/**
 * classify-from-json.mjs  — Phase 2: Claude classification from saved text
 * Run: node scripts/classify-from-json.mjs
 */
import { readFile, writeFile } from "fs/promises";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");

async function loadEnv() {
  try {
    const text = await readFile(resolve(projectRoot, ".env.local"), "utf-8");
    for (const line of text.split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const eq = t.indexOf("=");
      if (eq < 0) continue;
      const k = t.slice(0, eq).trim();
      const v = t.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
      if (!process.env[k]) process.env[k] = v;
    }
  } catch { /* ignore */ }
}

const SET_ID = "c4989230-ebfb-4a86-8a20-66cc548270a4";
const BATCH_SIZE = 25;
const VALID_DISCIPLINES = [
  "architectural", "structural", "mechanical", "electrical", "plumbing",
  "civil", "landscape", "fire_protection", "general", "other",
];

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
If text is empty or unclear, use discipline "general" and sheet_number "?".

Respond ONLY as a JSON array with no markdown:
[{"page": 1, "sheet_number": "A1.01", "sheet_title": "FIRST FLOOR PLAN", "discipline": "architectural"}, ...]`;

  const userContent = pages.map(p => `--- Page ${p.page} ---\n${p.text || "(no text)"}`).join("\n\n");

  const resp = await fetch("https://api.anthropic.com/v1/messages", {
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
      messages: [{ role: "user", content: `Classify these ${pages.length} drawing pages:\n\n${userContent}\n\nReturn JSON array.` }],
    }),
  });

  if (!resp.ok) throw new Error(`Claude API error: ${await resp.text()}`);
  const data = await resp.json();
  const raw = data?.content?.[0]?.text || "[]";
  const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  let results;
  try { results = JSON.parse(cleaned); }
  catch { results = pages.map(p => ({ page: p.page, sheet_number: `P${p.page}`, sheet_title: `Page ${p.page}`, discipline: "general" })); }
  return results.map(r => ({ ...r, discipline: VALID_DISCIPLINES.includes(r.discipline) ? r.discipline : "general" }));
}

async function main() {
  await loadEnv();

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) { console.error("Missing ANTHROPIC_API_KEY"); process.exit(1); }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Load extracted page texts
  const jsonPath = resolve(projectRoot, "scripts/encanto-pages.json");
  console.log(`📂 Loading page texts from ${jsonPath}`);
  const { pages } = JSON.parse(await readFile(jsonPath, "utf-8"));
  console.log(`📑 ${pages.length} pages to classify`);

  // Load sheets from DB to get IDs
  const { data: sheets } = await supabase
    .from("drawing_sheets")
    .select("id, page_index")
    .eq("set_id", SET_ID)
    .order("page_index", { ascending: true });
  if (!sheets?.length) { console.error("No sheets found"); process.exit(1); }

  // Check for saved classifications checkpoint
  const classCheckpoint = resolve(projectRoot, "scripts/encanto-classifications.json");
  let allClassifications = [];
  try {
    allClassifications = JSON.parse(await readFile(classCheckpoint, "utf-8"));
    console.log(`✅ Loaded ${allClassifications.length} classifications from checkpoint (skipping Claude)`);
  } catch {
    // No checkpoint, run Claude
    const totalBatches = Math.ceil(pages.length / BATCH_SIZE);
    for (let i = 0; i < pages.length; i += BATCH_SIZE) {
      const batch = pages.slice(i, i + BATCH_SIZE);
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      console.log(`🤖 Batch ${batchNum}/${totalBatches} (pages ${batch[0].page}–${batch[batch.length - 1].page})...`);
      try {
        const results = await classifyBatch(apiKey, batch);
        allClassifications.push(...results);
        console.log(`   ✓ ${results.length} pages classified`);
        // Save checkpoint after each batch
        await writeFile(classCheckpoint, JSON.stringify(allClassifications, null, 2));
      } catch (e) {
        console.error(`   ✗ Batch failed:`, e.message);
        batch.forEach(p => allClassifications.push({ page: p.page, sheet_number: `P${p.page}`, sheet_title: `Page ${p.page}`, discipline: "general" }));
      }
    }
    console.log(`✅ All batches complete. Checkpoint saved.`);
  }

  // Use SQL UPDATE FROM VALUES for an efficient single-query bulk update
  console.log(`\n💾 Bulk-updating ${sheets.length} sheets via SQL...`);
  const classMap = new Map(allClassifications.map(c => [c.page, c]));

  const updates = sheets.map(sheet => {
    const c = classMap.get(sheet.page_index + 1);
    return {
      id: sheet.id,
      sheet_number: c?.sheet_number || `P${sheet.page_index + 1}`,
      sheet_title: c?.sheet_title || `Page ${sheet.page_index + 1}`,
      discipline: c?.discipline || "general",
    };
  });

  let updated = 0, failed = 0;
  const CHUNK = 50;
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  for (let i = 0; i < updates.length; i += CHUNK) {
    const chunk = updates.slice(i, i + CHUNK);
    // Build VALUES clause: (id::uuid, sheet_number, sheet_title, discipline::discipline_type)
    const valueRows = chunk
      .map(r => `('${r.id}'::uuid, ${esc(r.sheet_number)}, ${esc(r.sheet_title)}, ${esc(r.discipline)}::text)`)
      .join(",\n");
    const sql = `
      UPDATE drawing_sheets ds
      SET
        sheet_number = v.sheet_number,
        sheet_title  = v.sheet_title,
        discipline   = v.discipline::text
      FROM (VALUES ${valueRows}) AS v(id, sheet_number, sheet_title, discipline)
      WHERE ds.id = v.id
    `;
    const resp = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: "POST",
      headers: {
        "apikey": SERVICE_KEY,
        "Authorization": `Bearer ${SERVICE_KEY}`,
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
      },
      body: JSON.stringify({ sql_text: sql }),
    });
    if (!resp.ok) {
      const err = await resp.text();
      console.error(`  ✗ Chunk ${Math.floor(i/CHUNK)+1}: HTTP ${resp.status} ${err.slice(0,200)}`);
      failed += chunk.length;
    } else {
      updated += chunk.length;
      console.log(`  ✓ Chunk ${Math.floor(i/CHUNK)+1}: ${chunk.length} rows OK`);
    }
  }

  // Summary
  const summary = {};
  for (const c of allClassifications) summary[c.discipline] = (summary[c.discipline] || 0) + 1;
  console.log(`\n✅ Done! Updated: ${updated} | Failed: ${failed}`);
  console.log(`\n📊 Discipline summary:`);
  for (const [d, n] of Object.entries(summary).sort((a, b) => b[1] - a[1])) {
    console.log(`   ${d.padEnd(20)} ${n}`);
  }
  console.log(`\n🔍 Sample (first 10):`);
  for (const c of allClassifications.slice(0, 10)) {
    console.log(`   Pg ${String(c.page).padStart(3)} | ${c.sheet_number.padEnd(8)} | ${c.discipline.padEnd(15)} | ${c.sheet_title}`);
  }
}

function esc(s) {
  if (!s) return "NULL";
  return `'${String(s).replace(/'/g, "''")}'`;
}

main().catch(e => { console.error("Fatal:", e); process.exit(1); });
