/**
 * extract-text.mjs  — Phase 1: Extract PDF text and save to JSON
 * Run: node --max-old-space-size=4096 scripts/extract-text.mjs
 */
import { readFile, writeFile } from "fs/promises";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

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
const STORAGE_PATH = "95818a65-0d17-42ba-a04d-7698ff6fdff7/3R-BLDC-24-0244-3RD_SUBMITTAL_SET_-_A-APPROVED_1777093849289.pdf";

async function main() {
  await loadEnv();
  // Use public storage URL directly (bucket is public) — avoids Blob double-copy
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publicUrl = `${supabaseUrl}/storage/v1/object/public/drawings/${STORAGE_PATH}`;
  console.log(`⬇️  Downloading PDF from public URL...`);
  const resp = await fetch(publicUrl);
  if (!resp.ok) { console.error(`Download failed: ${resp.status} ${resp.statusText}`); process.exit(1); }
  const buf = await resp.arrayBuffer();
  console.log(`✅ Downloaded ${Math.round(buf.byteLength / 1024)}KB`);

  const pdfjsPath = resolve(projectRoot, "node_modules/pdfjs-dist/legacy/build/pdf.mjs");
  const pdfjsUrl = new URL(`file:///${pdfjsPath.replace(/\\/g, "/")}`).href;
  const workerPath = resolve(projectRoot, "node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs");
  const workerUrl = new URL(`file:///${workerPath.replace(/\\/g, "/")}`).href;
  const pdfjs = await import(pdfjsUrl);
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

  const doc = await pdfjs.getDocument({ data: new Uint8Array(buf), disableFontFace: true, verbosity: 0 }).promise;
  console.log(`📄 ${doc.numPages} pages`);

  const pages = [];
  for (let i = 1; i <= doc.numPages; i++) {
    try {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      const text = content.items.map(x => x.str || "").join(" ").trim();
      pages.push({ page: i, text: text.length > 400 ? text.slice(-400) : text });
      page.cleanup();
    } catch { pages.push({ page: i, text: "" }); }
    if (i % 20 === 0) console.log(`  ${i}/${doc.numPages}...`);
  }
  await doc.destroy();

  const outPath = resolve(projectRoot, "scripts/encanto-pages.json");
  await writeFile(outPath, JSON.stringify({ set_id: SET_ID, pages }, null, 2));
  console.log(`✅ Saved ${pages.length} pages to ${outPath}`);
}

main().catch(e => { console.error(e); process.exit(1); });
