/**
 * classify-encanto.mjs
 * Classifies the existing Encanto Storage drawing set (159 pages)
 * using the AI classification API.
 *
 * Run: node scripts/classify-encanto.mjs
 * Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY in .env.local
 */

import { readFile } from "fs/promises";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");

// ─── Load env vars from .env.local ───────────────────────────────────────────
async function loadEnv() {
  try {
    const envPath = resolve(projectRoot, ".env.local");
    const text = await readFile(envPath, "utf-8");
    for (const line of text.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx < 0) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    // ignore
  }
}

// ─── Config ───────────────────────────────────────────────────────────────────
const SET_ID = "c4989230-ebfb-4a86-8a20-66cc548270a4";
const STORAGE_PATH = "95818a65-0d17-42ba-a04d-7698ff6fdff7/3R-BLDC-24-0244-3RD_SUBMITTAL_SET_-_A-APPROVED_1777093849289.pdf";
const BATCH_SIZE = 25;

const VALID_DISCIPLINES = [
  "architectural", "structural", "mechanical", "electrical", "plumbing",
  "civil", "landscape", "fire_protection", "general", "other",
];

// ─── PDF text extraction ──────────────────────────────────────────────────────
async function extractPageTexts(pdfBuffer) {
  // Dynamic import for pdfjs-dist legacy build (Windows needs file:// URLs)
  const pdfjsPath = resolve(projectRoot, "node_modules/pdfjs-dist/legacy/build/pdf.mjs");
  const pdfjsUrl = new URL(`file:///${pdfjsPath.replace(/\\/g, "/")}`).href;
  const pdfjsLib = await import(pdfjsUrl);
  // Point workerSrc to the actual worker file so pdfjs doesn't complain
  const workerPath = resolve(projectRoot, "node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs");
  const workerUrl = new URL(`file:///${workerPath.replace(/\\/g, "/")}`).href;
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

  const uint8 = new Uint8Array(pdfBuffer);
  const doc = await pdfjsLib.getDocument({ data: uint8, disableFontFace: true }).promise;
  const numPages = doc.numPages;
  console.log(`📄 PDF loaded: ${numPages} pages`);

  const pageTexts = [];
  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    try {
      const page = await doc.getPage(pageNum);
      const content = await page.getTextContent();
      const fullText = content.items.map((item) => item.str || "").join(" ").trim();
      // Focus on last ~400 chars (title block area)
      const excerpt = fullText.length > 400 ? fullText.slice(-400) : fullText;
      pageTexts.push(excerpt);
      page.cleanup();
    } catch {
      pageTexts.push("");
    }
    if (pageNum % 20 === 0) console.log(`  Extracted text from ${pageNum}/${numPages} pages...`);
  }

  await doc.destroy();
  return pageTexts;
}

// ─── Claude classification ────────────────────────────────────────────────────
async function classifyBatch(apiKey, pages) {
  const systemPrompt = `You are a construction drawing classifier. For each page of text extracted from construction drawings, identify:
1. sheet_number: The official sheet number (e.g., "A1.01", "S2.1", "M1.0", "E3.01", "C1.0", "G0.01")
2. sheet_title: The sheet title (e.g., "FIRST FLOOR PLAN", "FOUNDATION PLAN", "ROOF FRAMING PLAN")
3. discipline: One of: general, civil, landscape, architectural, structural, mechanical, electrical, plumbing, fire_protection, other

Standard construction drawing prefixes:
- G = General (cover sheets, abbreviations, symbols, index)
- C = Civil / Site work
- L = Landscape
- A = Architectural
- S = Structural
- M = Mechanical / HVAC
- P = Plumbing
- E = Electrical
- FP or F = Fire Protection
- T = Telecommunications / Low Voltage
- D = Demolition (classify as architectural)

If you can identify the sheet number from the text, use its prefix to determine discipline.
If no sheet number is found, classify based on content keywords.
If the text is empty or unclear, use discipline "general" and sheet_number "?".

Respond ONLY as a JSON array with no markdown:
[{"page": 1, "sheet_number": "A1.01", "sheet_title": "FIRST FLOOR PLAN", "discipline": "architectural"}, ...]`;

  const userContent = pages
    .map((p) => `--- Page ${p.page} ---\n${p.text || "(no text extracted)"}`)
    .join("\n\n");

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5",
      max_tokens: 4096,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `Classify these ${pages.length} construction drawing pages:\n\n${userContent}\n\nReturn a JSON array with one object per page.`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Claude API error: ${err}`);
  }

  const data = await response.json();
  const rawText = data?.content?.[0]?.text || "[]";
  const cleaned = rawText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

  let results;
  try {
    results = JSON.parse(cleaned);
  } catch {
    console.error("Failed to parse Claude response:", rawText.slice(0, 200));
    results = pages.map((p) => ({
      page: p.page,
      sheet_number: `P${p.page}`,
      sheet_title: `Page ${p.page}`,
      discipline: "general",
    }));
  }

  return results.map((r) => ({
    ...r,
    discipline: VALID_DISCIPLINES.includes(r.discipline) ? r.discipline : "general",
  }));
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  await loadEnv();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }
  if (!apiKey) {
    console.error("Missing ANTHROPIC_API_KEY");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log(`🔍 Loading sheets for set: ${SET_ID}`);
  const { data: sheets, error: sheetsErr } = await supabase
    .from("drawing_sheets")
    .select("id, page_index, storage_path, sheet_number")
    .eq("set_id", SET_ID)
    .order("page_index", { ascending: true });

  if (sheetsErr || !sheets?.length) {
    console.error("Failed to load sheets:", sheetsErr?.message);
    process.exit(1);
  }
  console.log(`📑 Found ${sheets.length} sheets`);

  // Download PDF
  console.log(`⬇️  Downloading PDF from storage: ${STORAGE_PATH}`);
  const { data: fileData, error: downloadErr } = await supabase.storage
    .from("drawings")
    .download(STORAGE_PATH);

  if (downloadErr || !fileData) {
    console.error("Failed to download PDF:", downloadErr?.message);
    process.exit(1);
  }
  console.log(`✅ PDF downloaded (${Math.round(fileData.size / 1024)}KB)`);

  // Extract text — free the blob as soon as we have the buffer
  console.log(`📝 Extracting text from all pages...`);
  const arrayBuffer = await fileData.arrayBuffer();
  const pageTexts = await extractPageTexts(arrayBuffer);
  // Explicitly free large objects to reduce memory pressure
  // eslint-disable-next-line no-global-assign
  try { if (global.gc) global.gc(); } catch { /* ignore */ }
  console.log(`✅ Text extraction complete (${pageTexts.length} pages, avg ${Math.round(pageTexts.reduce((a,t)=>a+t.length,0)/pageTexts.length)} chars/page)`);

  // Classify in batches
  const allClassifications = [];
  const totalBatches = Math.ceil(sheets.length / BATCH_SIZE);

  for (let i = 0; i < sheets.length; i += BATCH_SIZE) {
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const batch = sheets.slice(i, i + BATCH_SIZE);
    console.log(`🤖 Classifying batch ${batchNum}/${totalBatches} (pages ${batch[0].page_index + 1}–${batch[batch.length - 1].page_index + 1})...`);

    const batchPages = batch.map((sheet) => ({
      page: sheet.page_index + 1,
      text: pageTexts[sheet.page_index] || "",
    }));

    try {
      const batchResults = await classifyBatch(apiKey, batchPages);
      allClassifications.push(...batchResults);
    } catch (e) {
      console.error(`  Batch ${batchNum} failed:`, e.message);
      batch.forEach((sheet) => {
        allClassifications.push({
          page: sheet.page_index + 1,
          sheet_number: `P${sheet.page_index + 1}`,
          sheet_title: `Page ${sheet.page_index + 1}`,
          discipline: "general",
        });
      });
    }
  }

  // Build classification map
  const classMap = new Map();
  for (const c of allClassifications) classMap.set(c.page, c);

  // Update sheets in Supabase
  console.log(`💾 Updating ${sheets.length} sheets in database...`);
  let updated = 0;
  let failed = 0;

  for (const sheet of sheets) {
    const c = classMap.get(sheet.page_index + 1);
    const { error } = await supabase
      .from("drawing_sheets")
      .update({
        sheet_number: c?.sheet_number || `P${sheet.page_index + 1}`,
        sheet_title: c?.sheet_title || `Page ${sheet.page_index + 1}`,
        discipline: c?.discipline || "general",
      })
      .eq("id", sheet.id)
      .eq("set_id", SET_ID);

    if (error) {
      console.error(`  Failed to update sheet ${sheet.id}:`, error.message);
      failed++;
    } else {
      updated++;
    }
  }

  // Summary
  const summary = {};
  for (const c of allClassifications) {
    summary[c.discipline] = (summary[c.discipline] || 0) + 1;
  }

  console.log(`\n✅ Classification complete!`);
  console.log(`   Updated: ${updated} | Failed: ${failed}`);
  console.log(`\n📊 Discipline summary:`);
  for (const [disc, count] of Object.entries(summary).sort((a, b) => b[1] - a[1])) {
    console.log(`   ${disc.padEnd(20)} ${count}`);
  }

  // Show first 10 classifications as sample
  console.log(`\n🔍 Sample classifications:`);
  for (const c of allClassifications.slice(0, 10)) {
    console.log(`   Page ${String(c.page).padStart(3)} | ${c.sheet_number.padEnd(8)} | ${c.discipline.padEnd(15)} | ${c.sheet_title}`);
  }
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
