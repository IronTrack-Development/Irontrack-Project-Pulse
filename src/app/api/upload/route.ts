import { NextRequest, NextResponse } from "next/server";

// Allow up to 60 seconds for AI-powered PDF/MPP parsing
export const maxDuration = 60;
import { getServiceClient } from "@/lib/supabase";
import { inferTrade } from "@/lib/trade-inference";
import { runRiskDetection } from "@/lib/risk-engine";
import { computeHealthScore } from "@/lib/health-score";
import * as XLSX from "xlsx";
import Papa from "papaparse";
import Anthropic from "@anthropic-ai/sdk";

interface RawRow {
  [key: string]: string | number | null | undefined;
}

interface ColumnMapping {
  activity_id?: string;
  activity_name?: string;
  start_date?: string;
  finish_date?: string;
  original_duration?: string;
  percent_complete?: string;
  predecessor_ids?: string;
  wbs?: string;
  area?: string;
  trade?: string;
  actual_start?: string;
  actual_finish?: string;
  milestone?: string;
}

function parseDate(val: string | number | null | undefined): string | null {
  if (!val) return null;
  if (typeof val === "number") {
    const date = new Date((val - 25569) * 86400 * 1000);
    return date.toISOString().split("T")[0];
  }
  const str = String(val).trim();
  if (!str) return null;
  const d = new Date(str);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().split("T")[0];
}

function parseNum(val: string | number | null | undefined): number | null {
  if (val === null || val === undefined || val === "") return null;
  const n = parseFloat(String(val));
  return isNaN(n) ? null : n;
}

function deriveStatus(row: {
  actual_finish?: string | null;
  actual_start?: string | null;
  percent_complete?: number | null;
  start_date?: string | null;
}): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (row.actual_finish || (row.percent_complete !== null && row.percent_complete !== undefined && row.percent_complete >= 100)) {
    return "complete";
  }
  if (row.actual_start) return "in_progress";
  if (row.start_date) {
    const start = new Date(row.start_date);
    if (start < today && (!row.percent_complete || row.percent_complete === 0)) return "late";
  }
  return "not_started";
}

// AI-powered schedule extraction for PDFs and MPP files
async function aiParseSchedule(buffer: Buffer, filename: string, fileType: string): Promise<RawRow[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured");

  const anthropic = new Anthropic({ apiKey });

  const SCHEDULE_PROMPT = `You are a construction schedule parser. Extract ALL activities/tasks from this construction schedule data.

For EACH activity, extract:
- activity_name (required)
- start_date (YYYY-MM-DD format)
- finish_date (YYYY-MM-DD format)
- percent_complete (number 0-100, default 0 if not shown)
- duration (number of days if shown)
- milestone (true/false — true if duration is 0 or it says "milestone")

Return ONLY a JSON array. No explanation. No markdown. No code fences. Just the raw JSON array.
Example: [{"activity_name":"Pour Foundation","start_date":"2026-04-15","finish_date":"2026-04-22","percent_complete":0,"duration":5,"milestone":false}]

Extract every single line item. Do not skip any activities. If dates are ambiguous, use your best judgment on the format.`;

  let content: Anthropic.MessageCreateParams["messages"][0]["content"];

  if (fileType === "pdf") {
    // Extract text from PDF using pdf-parse
    let pdfText = "";
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require("pdf-parse");
      const pdfData = await pdfParse(buffer);
      pdfText = pdfData.text;
    } catch {
      // Fallback: try raw text extraction
      pdfText = buffer.toString("utf-8", 0, Math.min(buffer.length, 500000))
        .replace(/[^\x20-\x7E\n\r\t]/g, " ")
        .replace(/\s{3,}/g, "\n")
        .trim();
    }

    if (!pdfText || pdfText.trim().length < 50) {
      throw new Error("Could not extract readable text from this PDF");
    }

    // Truncate to fit context window
    const truncated = pdfText.slice(0, 80000);

    content = [
      {
        type: "text" as const,
        text: `${SCHEDULE_PROMPT}\n\nSCHEDULE DATA FROM PDF "${filename}":\n\n${truncated}`,
      },
    ];
  } else {
    // MPP — extract readable strings from binary
    const rawText = buffer.toString("utf-8", 0, Math.min(buffer.length, 500000));
    // Extract anything that looks like readable text
    const readable = rawText.replace(/[^\x20-\x7E\n\r\t]/g, " ").replace(/\s{3,}/g, "\n").trim();
    // Get the most useful 50K chars
    const truncated = readable.slice(0, 50000);

    content = [
      {
        type: "text",
        text: `You are a construction schedule parser. This is raw text extracted from a Microsoft Project (.mpp) binary file called "${filename}".

The text contains task names, dates, durations, and other schedule data mixed with binary artifacts. Your job is to find and extract ALL construction activities/tasks.

RAW TEXT:
${truncated}

For EACH activity you can identify, extract:
- activity_name (required)
- start_date (YYYY-MM-DD format if you can find it)
- finish_date (YYYY-MM-DD format if you can find it)
- percent_complete (number 0-100, default 0)
- duration (number of days if visible)
- milestone (true/false)

Return ONLY a JSON array. No explanation. No markdown. Just the raw JSON array.
Example: [{"activity_name":"Pour Foundation","start_date":"2026-04-15","finish_date":"2026-04-22","percent_complete":0,"duration":5,"milestone":false}]

Be aggressive — extract every task you can identify even if you only have the name and no dates. Construction task names include things like: mobilization, excavation, foundation, framing, rough-in, drywall, roofing, MEP, inspections, substantial completion, etc.`,
      },
    ];
  }

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 16000,
    messages: [{ role: "user", content }],
  });

  // Extract JSON from response
  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");

  // Find JSON array in the response
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error("AI could not extract schedule data from this file");

  const parsed = JSON.parse(jsonMatch[0]);
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error("AI found no activities in this file");
  }

  // Convert to RawRow format
  return parsed.map((item: Record<string, unknown>, i: number) => ({
    "Activity ID": String(i + 1),
    "Activity Name": String(item.activity_name || ""),
    "Start Date": String(item.start_date || ""),
    "Finish Date": String(item.finish_date || ""),
    "% Complete": String(item.percent_complete ?? 0),
    "Duration": String(item.duration || ""),
    "Milestone": item.milestone ? "yes" : "no",
  }));
}

export async function POST(req: NextRequest) {
  const supabase = getServiceClient();
  const formData = await req.formData();

  const file = formData.get("file") as File | null;
  const projectId = formData.get("project_id") as string | null;
  const mappingStr = formData.get("mapping") as string | null;

  if (!file || !projectId) {
    return NextResponse.json({ error: "Missing file or project_id" }, { status: 400 });
  }

  const mapping: ColumnMapping = mappingStr ? JSON.parse(mappingStr) : {};
  const filename = file.name;
  const ext = filename.split(".").pop()?.toLowerCase() || "";

  // Verify project exists
  const { data: project } = await supabase
    .from("daily_projects")
    .select("id")
    .eq("id", projectId)
    .single();
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  // Create upload record
  const { data: upload, error: uploadError } = await supabase
    .from("schedule_uploads")
    .insert({
      project_id: projectId,
      original_filename: filename,
      file_type: ext,
      parse_status: "parsing",
    })
    .select()
    .single();
  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  // Parse file
  const buffer = Buffer.from(await file.arrayBuffer());
  let rows: RawRow[] = [];
  let usedAI = false;

  if (ext === "csv") {
    const text = buffer.toString("utf-8");
    const result = Papa.parse<RawRow>(text, { header: true, skipEmptyLines: true });
    rows = result.data;
  } else if (ext === "xlsx" || ext === "xls") {
    const wb = XLSX.read(buffer, { type: "buffer", cellDates: false });
    const ws = wb.Sheets[wb.SheetNames[0]];
    rows = XLSX.utils.sheet_to_json<RawRow>(ws, { defval: null });
  } else if (ext === "pdf" || ext === "mpp") {
    // Use AI to parse PDF and MPP files
    try {
      rows = await aiParseSchedule(buffer, filename, ext);
      usedAI = true;
      // Set mapping for AI-parsed data (standardized column names)
      mapping.activity_name = "Activity Name";
      mapping.start_date = "Start Date";
      mapping.finish_date = "Finish Date";
      mapping.percent_complete = "% Complete";
      mapping.original_duration = "Duration";
      mapping.activity_id = "Activity ID";
      mapping.milestone = "Milestone";
    } catch (aiError) {
      const msg = aiError instanceof Error ? aiError.message : "AI parsing failed";
      return NextResponse.json({
        error: `${msg}. For best results, export your schedule as .xlsx from Microsoft Project (File → Save As → Excel Workbook).`,
      }, { status: 400 });
    }
  } else {
    return NextResponse.json({ error: "Unsupported file type. Accepted: .xlsx, .xls, .csv, .pdf, .mpp" }, { status: 400 });
  }

  if (rows.length === 0) {
    return NextResponse.json({ error: "No data rows found in file" }, { status: 400 });
  }

  // Auto-detect column mapping if not provided (for xlsx/csv)
  if (!usedAI && !mapping.activity_name) {
    const columns = Object.keys(rows[0] || {});
    const tryMap = (field: keyof ColumnMapping, patterns: string[]) => {
      for (const col of columns) {
        const lower = col.toLowerCase().replace(/[\s_\-()]/g, "");
        for (const p of patterns) {
          if (lower.includes(p.replace(/[\s_\-()]/g, ""))) {
            (mapping as Record<string, string>)[field] = col;
            return;
          }
        }
      }
    };
    tryMap("activity_name", ["activity", "task", "description", "name", "activityname", "taskname", "activitydescription"]);
    tryMap("start_date", ["start", "startdate", "earlystart", "plannedstart", "begin", "planstart"]);
    tryMap("finish_date", ["finish", "end", "finishdate", "earlyfinish", "plannedfinish", "enddate", "completion", "planfinish"]);
    tryMap("percent_complete", ["percent", "complete", "percentcomplete", "pct", "progress", "%complete"]);
    tryMap("original_duration", ["duration", "origduration", "originalduration", "days"]);
    tryMap("activity_id", ["activityid", "id", "taskid"]);
    tryMap("wbs", ["wbs"]);
    tryMap("milestone", ["milestone"]);
  }

  // Map columns helper
  const col = (row: RawRow, field: keyof ColumnMapping): string | number | null | undefined => {
    const key = mapping[field];
    if (!key) return null;
    return row[key] ?? null;
  };

  // Delete existing activities for this project (re-upload flow)
  await supabase.from("parsed_activities").delete().eq("project_id", projectId);

  // Process rows into activities
  const activitiesToInsert = rows.map((row) => {
    const activityName = String(col(row, "activity_name") || "").trim();
    if (!activityName) return null;

    const startDate = parseDate(col(row, "start_date") as string | number | null);
    const finishDate = parseDate(col(row, "finish_date") as string | number | null);
    const actualStart = parseDate(col(row, "actual_start") as string | number | null);
    const actualFinish = parseDate(col(row, "actual_finish") as string | number | null);
    const pct = parseNum(col(row, "percent_complete") as string | number | null);
    const duration = parseNum(col(row, "original_duration") as string | number | null);

    const inferredTrade = mapping.trade
      ? String(col(row, "trade") || "").trim() || inferTrade(activityName)
      : inferTrade(activityName);

    const isMilestone =
      mapping.milestone
        ? String(col(row, "milestone") || "").toLowerCase() === "yes" ||
          String(col(row, "milestone")) === "true" ||
          String(col(row, "milestone")) === "1"
        : duration === 0 || activityName.toLowerCase().includes("milestone");

    const predecessorRaw = String(col(row, "predecessor_ids") || "").trim();
    const predecessorIds = predecessorRaw
      ? predecessorRaw.split(/[,;|]/).map((s) => s.trim()).filter(Boolean)
      : [];

    const status = deriveStatus({ actual_finish: actualFinish, actual_start: actualStart, percent_complete: pct, start_date: startDate });

    return {
      project_id: projectId,
      upload_id: upload.id,
      activity_id: String(col(row, "activity_id") || "").trim() || null,
      activity_name: activityName,
      wbs: String(col(row, "wbs") || "").trim() || null,
      area: String(col(row, "area") || "").trim() || null,
      trade: inferredTrade,
      original_duration: duration,
      remaining_duration: duration && pct !== null ? Math.round(duration * (1 - pct / 100)) : duration,
      start_date: startDate,
      finish_date: finishDate,
      actual_start: actualStart,
      actual_finish: actualFinish,
      percent_complete: pct ?? 0,
      predecessor_ids: predecessorIds.length > 0 ? predecessorIds : null,
      successor_ids: null,
      milestone: isMilestone,
      status,
    };
  }).filter(Boolean);

  // Insert in batches
  const inserted: { id: string }[] = [];
  for (let i = 0; i < activitiesToInsert.length; i += 100) {
    const batch = activitiesToInsert.slice(i, i + 100);
    const { data } = await supabase
      .from("parsed_activities")
      .insert(batch)
      .select("id");
    if (data) inserted.push(...data);
  }

  const milestoneCount = activitiesToInsert.filter((a) => a?.milestone).length;

  // Update upload record
  await supabase
    .from("schedule_uploads")
    .update({ parse_status: "complete", activity_count: inserted.length })
    .eq("id", upload.id);

  // Fetch inserted activities for risk detection
  const { data: allActivities } = await supabase
    .from("parsed_activities")
    .select("*")
    .eq("project_id", projectId);

  // Run risk detection
  const riskCount = await runRiskDetection(projectId, allActivities || []);

  // Update health score
  const { data: risks } = await supabase
    .from("daily_risks")
    .select("*")
    .eq("project_id", projectId)
    .eq("status", "open");
  const { score } = computeHealthScore(risks || [], allActivities || []);
  await supabase.from("daily_projects").update({ health_score: score }).eq("id", projectId);

  return NextResponse.json({
    upload_id: upload.id,
    project_id: projectId,
    activities_parsed: inserted.length,
    milestones_found: milestoneCount,
    risks_detected: riskCount,
    health_score: score,
    ai_parsed: usedAI,
  });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const filename = searchParams.get("filename");
  return NextResponse.json({ filename, message: "Upload the file via POST with form data" });
}
