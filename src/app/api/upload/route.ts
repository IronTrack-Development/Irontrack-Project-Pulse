import { NextRequest, NextResponse } from "next/server";

// Allow up to 300 seconds for AI-powered PDF/MPP parsing (Vercel Pro)
export const maxDuration = 300;
import { getServiceClient } from "@/lib/supabase";
import { inferTrade } from "@/lib/trade-inference";
import { runRiskDetection } from "@/lib/risk-engine";
import { computeHealthScore } from "@/lib/health-score";
import * as XLSX from "xlsx";
import Papa from "papaparse";
import Anthropic from "@anthropic-ai/sdk";

const MPP_CONVERTER_URL = process.env.MPP_CONVERTER_URL || "https://mpp-converter-production.up.railway.app";

// Convert MPP via MPXJ microservice on Railway
async function convertMppViaService(buffer: Buffer, filename: string): Promise<RawRow[]> {
  // Build multipart form data manually for Node.js compatibility
  const boundary = "----FormBoundary" + Math.random().toString(36).slice(2);
  const header = `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: application/octet-stream\r\n\r\n`;
  const footer = `\r\n--${boundary}--\r\n`;
  
  const headerBuf = Buffer.from(header);
  const footerBuf = Buffer.from(footer);
  const body = Buffer.concat([headerBuf, buffer, footerBuf]);

  const response = await fetch(`${MPP_CONVERTER_URL}/convert`, {
    method: "POST",
    headers: {
      "Content-Type": `multipart/form-data; boundary=${boundary}`,
    },
    body: body,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: "MPP conversion failed" }));
    throw new Error((err as { error?: string }).error || "MPP conversion service error");
  }

  const data = await response.json() as { tasks: Array<Record<string, unknown>> };
  if (!data.tasks || data.tasks.length === 0) {
    throw new Error("No tasks found in MPP file");
  }

  // Convert to RawRow format
  return data.tasks.map((task: Record<string, unknown>) => ({
    "Activity ID": String(task.activity_id || ""),
    "Activity Name": String(task.activity_name || ""),
    "Start Date": String(task.start_date || ""),
    "Finish Date": String(task.finish_date || ""),
    "Actual Start": String(task.actual_start || ""),
    "Actual Finish": String(task.actual_finish || ""),
    "% Complete": String(task.percent_complete ?? 0),
    "Duration": String(task.duration_days || ""),
    "Milestone": task.milestone ? "yes" : "no",
    "WBS": String(task.wbs || ""),
    "Resources": String(task.resources || ""),
    "Predecessors": String(task.predecessors || ""),
  }));
}

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
    // Try text extraction first
    let pdfText = "";
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require("pdf-parse");
      const pdfData = await pdfParse(buffer);
      pdfText = pdfData.text || "";
    } catch {
      pdfText = "";
    }

    // If text extraction got meaningful content, use text mode
    if (pdfText && pdfText.trim().length > 200) {
      const truncated = pdfText.slice(0, 80000);
      content = [
        {
          type: "text" as const,
          text: `${SCHEDULE_PROMPT}\n\nSCHEDULE DATA FROM PDF "${filename}":\n\n${truncated}`,
        },
      ];
    } else {
      // PDF text extraction failed — send PDF natively to Claude
      const base64 = buffer.toString("base64");
      
      if (base64.length > 20_000_000) {
        throw new Error("PDF file is too large for AI processing. Try a smaller file or export as .xlsx.");
      }

      // Use document type for native PDF support
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      content = [
        {
          type: "document",
          source: {
            type: "base64",
            media_type: "application/pdf",
            data: base64,
          },
        } as any,
        {
          type: "text" as const,
          text: SCHEDULE_PROMPT,
        },
      ];
    }
  } else if (fileType === "xer") {
    // Primavera P6 XER file — plain text, tab-delimited
    const xerText = buffer.toString("utf-8").slice(0, 80000);
    content = [
      {
        type: "text" as const,
        text: `${SCHEDULE_PROMPT}

This is a Primavera P6 XER export file called "${filename}". XER files are tab-delimited with table headers starting with %T and field definitions starting with %F. The TASK table contains the schedule activities. Extract ALL tasks with their activity names, start dates, finish dates, percent complete, and durations.

XER FILE CONTENT:
${xerText}`,
      },
    ];
  } else if (fileType === "xml") {
    // Microsoft Project XML export — fully readable
    const xmlText = buffer.toString("utf-8").slice(0, 80000);
    content = [
      {
        type: "text" as const,
        text: `${SCHEDULE_PROMPT}

This is a Microsoft Project XML export file called "${filename}". It contains Task elements with Name, Start, Finish, PercentComplete, Duration, and Milestone fields. Extract ALL tasks.

XML FILE CONTENT:
${xmlText}`,
      },
    ];
  } else {
    // MPP binary — use CFB to read OLE compound document structure
    let textForAI = "";
    
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const CFB = require("cfb");
      const cfb = CFB.read(buffer, { type: "buffer" });
      
      // Extract all text from all streams in the OLE container
      const allText: string[] = [];
      if (cfb.FileIndex) {
        for (const entry of cfb.FileIndex) {
          if (entry.size > 0 && entry.content) {
            // Try UTF-16LE decode (MS Project internal encoding)
            const utf16: string[] = [];
            let current = "";
            const bytes = entry.content;
            for (let i = 0; i < bytes.length - 1; i += 2) {
              const char = bytes[i] | (bytes[i + 1] << 8);
              if (char >= 32 && char <= 126) {
                current += String.fromCharCode(char);
              } else if (char === 0 && current.length > 0) {
                // null terminator in UTF-16
                continue;
              } else {
                if (current.length >= 2) utf16.push(current);
                current = "";
              }
            }
            if (current.length >= 2) utf16.push(current);
            
            // Also try ASCII
            const ascii: string[] = [];
            current = "";
            for (let i = 0; i < bytes.length; i++) {
              const byte = bytes[i];
              if (byte >= 32 && byte <= 126) {
                current += String.fromCharCode(byte);
              } else {
                if (current.length >= 2) ascii.push(current);
                current = "";
              }
            }
            if (current.length >= 2) ascii.push(current);
            
            const streamText = utf16.length > ascii.length ? utf16.join("\n") : ascii.join("\n");
            if (streamText.length > 10) {
              allText.push(`--- Stream: ${entry.name} ---\n${streamText}`);
            }
          }
        }
      }
      textForAI = allText.join("\n\n").slice(0, 70000);
    } catch {
      // CFB failed — fallback to raw string extraction
      const rawBytes = buffer;
      const strings: string[] = [];
      let current = "";
      for (let i = 0; i < Math.min(rawBytes.length, 2000000) - 1; i += 2) {
        const char = rawBytes[i] | (rawBytes[i + 1] << 8);
        if (char >= 32 && char <= 126) {
          current += String.fromCharCode(char);
        } else {
          if (current.length >= 3) strings.push(current);
          current = "";
        }
      }
      if (current.length >= 3) strings.push(current);
      textForAI = strings.join("\n").slice(0, 60000);
    }
    
    if (!textForAI || textForAI.length < 100) {
      throw new Error("Could not extract readable data from this MPP file. Try exporting from Microsoft Project as XML: File → Save As → XML Format.");
    }
    
    content = [
      {
        type: "text" as const,
        text: `You are a construction schedule parser extracting data from a Microsoft Project .mpp file called "${filename}".

Below is text extracted from the MPP binary. It contains task names and subcontractor names. The dates are stored as binary data and could not be extracted as text.

Your job:
1. Extract EVERY task/activity name you can find
2. For dates: since the binary dates couldn't be extracted, leave start_date and finish_date as empty strings
3. Group related items — if a line looks like a subcontractor name (short company name) following a task, it's the assigned resource, not a task
4. Filter out non-task items like column headers, settings, file paths, and metadata

Return ONLY a JSON array. No explanation. No markdown. No code fences.
Format: [{"activity_name":"Task Name Here","start_date":"","finish_date":"","percent_complete":0,"duration":0,"milestone":false}]

Mark as milestone=true if the name contains words like: milestone, NTP, notice to proceed, certificate of occupancy, substantial completion, final inspection, turnover, closeout, punch.

EXTRACTED MPP DATA:
${textForAI}`,
      },
    ];
  }

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 16000,
    messages: [{ role: "user", content }],
  }).catch((err) => {
    console.error("Claude API error:", err?.message || err);
    throw new Error(`AI processing failed: ${err?.message || "Unknown error"}`);
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
  } else if (ext === "mpp") {
    // Check if .mpp is actually XML
    const header = buffer.toString("utf-8", 0, Math.min(20, buffer.length)).trim();
    if (header.startsWith("<?xml")) {
      // It's XML masquerading as MPP — use AI
      try {
        rows = await aiParseSchedule(buffer, filename, "xml");
        usedAI = true;
      } catch (aiError) {
        const msg = aiError instanceof Error ? aiError.message : "AI parsing failed";
        return NextResponse.json({ error: msg }, { status: 400 });
      }
    } else {
      // Real binary MPP — use MPXJ microservice
      try {
        rows = await convertMppViaService(buffer, filename);
      } catch (mppError) {
        const msg = mppError instanceof Error ? mppError.message : "MPP conversion failed";
        return NextResponse.json({ error: msg }, { status: 400 });
      }
    }
    usedAI = false;
    mapping.activity_name = "Activity Name";
    mapping.start_date = "Start Date";
    mapping.finish_date = "Finish Date";
    mapping.percent_complete = "% Complete";
    mapping.original_duration = "Duration";
    mapping.activity_id = "Activity ID";
    mapping.milestone = "Milestone";
    mapping.actual_start = "Actual Start";
    mapping.actual_finish = "Actual Finish";
    mapping.wbs = "WBS";
    mapping.predecessor_ids = "Predecessors";
  } else if (ext === "xml" || ext === "xer" || ext === "pdf") {
    // AI-powered parsing for XML, XER, and PDF files
    try {
      rows = await aiParseSchedule(buffer, filename, ext);
      usedAI = true;
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
    return NextResponse.json({ error: "Unsupported file type. Accepted: .xlsx, .xls, .csv, .pdf, .mpp, .xml, .xer" }, { status: 400 });
  }

  if (rows.length === 0) {
    return NextResponse.json({ error: "No data rows found in file" }, { status: 400 });
  }

  // Auto-detect column mapping if not provided (for xlsx/csv)
  if (!usedAI && !mapping.activity_name) {
    const columns = Object.keys(rows[0] || {});
    // Exact match first to avoid "Task Mode" matching before "Task Name"
    const exactMap = (field: keyof ColumnMapping, exactPatterns: string[]) => {
      for (const col of columns) {
        const lower = col.toLowerCase().replace(/[\s_\-()]/g, "");
        for (const p of exactPatterns) {
          if (lower === p.replace(/[\s_\-()]/g, "")) {
            (mapping as Record<string, string>)[field] = col;
            return;
          }
        }
      }
    };
    exactMap("activity_name", ["task name", "taskname", "activity name", "activityname", "activity description", "description", "name"]);
    exactMap("start_date", ["start", "start date", "early start", "planned start"]);
    exactMap("finish_date", ["finish", "finish date", "early finish", "planned finish", "end date"]);
    exactMap("percent_complete", ["% complete", "percent complete", "pct complete", "progress"]);
    exactMap("original_duration", ["duration", "original duration"]);
    exactMap("activity_id", ["activity id", "task id", "id", "wbs"]);
    exactMap("milestone", ["milestone"]);

    // Fallback: partial match for anything still unmapped
    const tryMap = (field: keyof ColumnMapping, patterns: string[]) => {
      if ((mapping as Record<string, string>)[field]) return; // already mapped
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
