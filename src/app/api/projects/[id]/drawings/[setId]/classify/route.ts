import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

// Allow up to 5 minutes for large drawing sets (e.g. 159 pages)
export const maxDuration = 300;

type Discipline =
  | "architectural"
  | "structural"
  | "mechanical"
  | "electrical"
  | "plumbing"
  | "civil"
  | "landscape"
  | "fire_protection"
  | "general"
  | "other";

const VALID_DISCIPLINES: Discipline[] = [
  "architectural",
  "structural",
  "mechanical",
  "electrical",
  "plumbing",
  "civil",
  "landscape",
  "fire_protection",
  "general",
  "other",
];

interface PageClassification {
  page: number;
  sheet_number: string;
  sheet_title: string;
  discipline: Discipline;
}

interface DrawingSheet {
  id: string;
  page_index: number;
  storage_path: string;
  sheet_number: string;
  sheet_title: string | null;
  discipline: string;
}

async function extractPageTexts(pdfBuffer: ArrayBuffer): Promise<string[]> {
  // Use pdf-parse for serverless-compatible text extraction
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require("pdf-parse");
  const buffer = Buffer.from(pdfBuffer);
  
  // pdf-parse extracts all text at once — we need per-page
  // Use the pagerender option to capture per-page text
  const pageTexts: string[] = [];
  
  try {
    // First get total page count
    const result = await pdfParse(buffer, {
      max: 0, // just metadata
    });
    const numPages = result.numpages;
    
    // Extract each page individually
    for (let i = 1; i <= numPages; i++) {
      try {
        const pageResult = await pdfParse(buffer, {
          max: i,
          // Custom page render to get specific page
          pagerender: function(pageData: { getTextContent: () => Promise<{ items: { str: string }[] }> }) {
            return pageData.getTextContent().then(function(textContent: { items: { str: string }[] }) {
              return textContent.items.map((item: { str: string }) => item.str).join(' ');
            });
          }
        });
        // pageResult.text contains all pages up to max — get the last page's contribution
        const text = pageResult.text || '';
        // Focus on last ~500 chars (title block area)
        const excerpt = text.length > 500 ? text.slice(-500) : text;
        pageTexts.push(excerpt);
      } catch {
        pageTexts.push('');
      }
    }
  } catch (e) {
    console.error('[classify] pdf-parse failed, trying raw text extraction:', e);
    // Fallback: extract raw text from PDF binary
    const text = buffer.toString('latin1');
    // Split by page markers and extract text chunks
    const pageMatches = text.split(/\/Type\s*\/Page[^s]/);
    for (let i = 1; i < pageMatches.length; i++) {
      // Extract readable strings from each page section
      const readable = pageMatches[i]
        .replace(/[^\x20-\x7E\n]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(-300);
      pageTexts.push(readable);
    }
  }
  
  return pageTexts;
}

async function classifyBatch(
  apiKey: string,
  pages: { page: number; text: string }[]
): Promise<PageClassification[]> {
  const systemPrompt = `You are an expert construction drawing classifier used by commercial general contractors. Classify each page from a construction drawing set.

RULES — READ CAREFULLY:
1. "general" should ONLY be used for the cover sheet (typically page 1 — the title page with project info/index). That's it. NOTHING ELSE is "general".
2. General Notes pages belong to their DISCIPLINE, not "general". Examples:
   - "Structural General Notes" → structural
   - "Architectural General Notes" → architectural
   - "Electrical General Notes" → electrical
   - "Plumbing Symbols & Abbreviations" → plumbing
3. Abbreviation pages, symbol legends, and detail sheets belong to their discipline.
4. Standard sheet number prefixes (the FIRST LETTER determines discipline):
   - G = general (ONLY cover/index sheets)
   - C = civil
   - L = landscape
   - A = architectural (THIS IS USUALLY THE LARGEST SECTION — floor plans, elevations, sections, details, door/window schedules, reflected ceiling plans, interior elevations, finish schedules)
   - S = structural (foundation plans, framing plans, structural details, structural notes)
   - M = mechanical/HVAC
   - P = plumbing
   - E = electrical
   - FP or F = fire_protection
   - T or D = other
5. If text is garbled or empty, use CONTEXT CLUES:
   - Pages between known architectural sheets are likely architectural
   - Pages between known structural sheets are likely structural
   - Construction sets follow a standard order: Cover → Civil → Landscape → Architectural → Structural → Mechanical → Plumbing → Electrical → Fire Protection
6. If a page mentions floor plans, elevations, sections, building plans, room layouts, finish schedules, door schedules, ceiling plans → architectural
7. If a page mentions foundations, footings, framing, rebar, columns, beams, shear walls → structural
8. If a page mentions ductwork, HVAC, diffusers, air handling, refrigerant → mechanical
9. If a page mentions conduit, panels, circuits, lighting, switchgear, receptacles → electrical
10. If a page mentions pipe, fixtures, water, sewer, drainage, gas → plumbing
11. NEVER put electrical sheets in structural or vice versa. The prefix letter is definitive when present.
12. When in doubt, classify by the discipline that makes the most sense given the page position in the set.

For each page return:
- sheet_number: The actual sheet number from the title block (e.g., "A1.01", "S2.1"). If not found, infer from discipline + sequence (e.g., "A-1", "S-1")
- sheet_title: The sheet title (e.g., "FIRST FLOOR PLAN"). If not found, describe what the page likely contains.
- discipline: One of EXACTLY: general, civil, landscape, architectural, structural, mechanical, electrical, plumbing, fire_protection, other

Respond ONLY as a JSON array with no markdown:
[{"page": 1, "sheet_number": "G0.01", "sheet_title": "COVER SHEET", "discipline": "general"}, ...]`;

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
          content: `Classify these ${pages.length} construction drawing pages. Remember: "general" is ONLY for the cover sheet (page 1). General notes, abbreviations, and legends belong to their specific discipline. Architectural is usually the largest section. Use the standard drawing set order (Civil → Landscape → Architectural → Structural → MEP) to help classify pages with unclear text.\n\n${userContent}\n\nReturn a JSON array with one object per page.`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Claude API error: ${err}`);
  }

  const data = await response.json();
  const rawText: string = data?.content?.[0]?.text || "[]";
  const cleaned = rawText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

  let results: PageClassification[];
  try {
    results = JSON.parse(cleaned) as PageClassification[];
  } catch {
    console.error("[classify] Failed to parse Claude response:", rawText);
    // Fall back to defaults for this batch
    results = pages.map((p) => ({
      page: p.page,
      sheet_number: `P${p.page}`,
      sheet_title: `Page ${p.page}`,
      discipline: "general" as Discipline,
    }));
  }

  // Validate & normalize disciplines
  return results.map((r) => ({
    ...r,
    discipline: VALID_DISCIPLINES.includes(r.discipline as Discipline)
      ? (r.discipline as Discipline)
      : "general",
  }));
}

// POST /api/projects/[id]/drawings/[setId]/classify
// Accepts optional JSON body with { pageTexts: string[] } from client-side extraction
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; setId: string }> }
) {
  const { setId } = await params;
  const supabase = getServiceClient();

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "AI classification not configured (missing ANTHROPIC_API_KEY)" },
      { status: 503 }
    );
  }

  // 1. Load all sheets for this set
  const { data: sheets, error: sheetsErr } = await supabase
    .from("drawing_sheets")
    .select("id, page_index, storage_path, sheet_number, sheet_title, discipline")
    .eq("set_id", setId)
    .order("page_index", { ascending: true });

  if (sheetsErr || !sheets || sheets.length === 0) {
    return NextResponse.json(
      { error: sheetsErr?.message || "No sheets found" },
      { status: 404 }
    );
  }

  const typedSheets = sheets as DrawingSheet[];

  // 2. Get page texts — prefer client-side extracted text, fallback to server-side
  let pageTexts: string[];
  try {
    const body = await req.json().catch(() => ({}));
    if (body.pageTexts && Array.isArray(body.pageTexts) && body.pageTexts.length > 0) {
      pageTexts = body.pageTexts;
    } else {
      // Server-side fallback — download and extract
      const storagePath = typedSheets[0].storage_path;
      const { data: fileData, error: downloadErr } = await supabase.storage
        .from("drawings")
        .download(storagePath);
      if (downloadErr || !fileData) {
        return NextResponse.json(
          { error: `Failed to download PDF: ${downloadErr?.message}` },
          { status: 500 }
        );
      }
      const arrayBuffer = await fileData.arrayBuffer();
      pageTexts = await extractPageTexts(arrayBuffer);
    }
  } catch (e) {
    console.error("[classify] Text extraction failed:", e);
    return NextResponse.json(
      { error: `Text extraction failed: ${e instanceof Error ? e.message : String(e)}` },
      { status: 500 }
    );
  }

  // 3. Send batches to Claude (25 pages at a time)
  const BATCH_SIZE = 25;
  const allClassifications: PageClassification[] = [];

  for (let i = 0; i < typedSheets.length; i += BATCH_SIZE) {
    const batch = typedSheets.slice(i, i + BATCH_SIZE);
    const batchPages = batch.map((sheet) => ({
      page: sheet.page_index + 1,
      text: pageTexts[sheet.page_index] || "",
    }));

    try {
      const batchResults = await classifyBatch(apiKey, batchPages);
      allClassifications.push(...batchResults);
    } catch (e) {
      console.error(`[classify] Batch ${i / BATCH_SIZE + 1} failed:`, e);
      // Use fallback for failed batch
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

  // 5. Build a map: page_number → classification
  const classMap = new Map<number, PageClassification>();
  for (const c of allClassifications) {
    classMap.set(c.page, c);
  }

  // 6. Bulk update all sheets
  const updates = typedSheets.map((sheet) => {
    const c = classMap.get(sheet.page_index + 1);
    return {
      id: sheet.id,
      sheet_number: c?.sheet_number || `P${sheet.page_index + 1}`,
      sheet_title: c?.sheet_title || `Page ${sheet.page_index + 1}`,
      discipline: c?.discipline || "general",
    };
  });

  // Supabase doesn't support true bulk upsert easily by id alone, so batch with chunks
  const UPDATE_CHUNK = 50;
  for (let i = 0; i < updates.length; i += UPDATE_CHUNK) {
    const chunk = updates.slice(i, i + UPDATE_CHUNK);
    await Promise.all(
      chunk.map((u) =>
        supabase
          .from("drawing_sheets")
          .update({
            sheet_number: u.sheet_number,
            sheet_title: u.sheet_title,
            discipline: u.discipline,
          })
          .eq("id", u.id)
          .eq("set_id", setId)
      )
    );
  }

  // 7. Summarize disciplines
  const summary: Record<string, number> = {};
  for (const u of updates) {
    summary[u.discipline] = (summary[u.discipline] || 0) + 1;
  }

  return NextResponse.json({
    success: true,
    sheets_classified: updates.length,
    discipline_summary: summary,
  });
}

