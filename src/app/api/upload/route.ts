import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

// Allow up to 300 seconds for AI-powered PDF/MPP parsing (Vercel Pro)
export const maxDuration = 300;
import { getServiceClient } from "@/lib/supabase";
import { getArizonaToday } from "@/lib/arizona-date";
import { inferTrade } from "@/lib/trade-inference";
import { normalizeWBS, buildMPPWBSPath, type FlatHierarchyRow } from "@/lib/wbs-normalizer";
import { runRiskDetection } from "@/lib/risk-engine";
import { computeHealthScore } from "@/lib/health-score";
import * as XLSX from "xlsx";
import Papa from "papaparse";
import Anthropic from "@anthropic-ai/sdk";

const MPP_CONVERTER_URL = process.env.MPP_CONVERTER_URL || "https://mpp-converter-production.up.railway.app";

// Compute successor_ids as the inverse of predecessor_ids for all activities in a project
async function computeSuccessorIds(supabase: ReturnType<typeof getServiceClient>, projectId: string) {
  const { data: activities } = await supabase
    .from("parsed_activities")
    .select("id, activity_id, external_task_id, external_unique_id, predecessor_ids")
    .eq("project_id", projectId);

  if (!activities?.length) return;

  // Build O(1) lookup maps: activity_id -> UUID, and UUID -> UUID (identity)
  const idToUuid = new Map<string, string>();
  for (const a of activities) {
    idToUuid.set(a.id, a.id); // UUID -> UUID
    if (a.activity_id) idToUuid.set(a.activity_id, a.id); // string activity_id -> UUID
    if (a.external_task_id) idToUuid.set(a.external_task_id, a.id);
    if (a.external_unique_id) idToUuid.set(a.external_unique_id, a.id);
  }

  // Build reverse map: predecessor UUID -> set of successor UUIDs
  const successorMap = new Map<string, Set<string>>();

  for (const act of activities) {
    if (!act.predecessor_ids?.length) continue;
    for (const rawPredId of act.predecessor_ids) {
      // Strip any remaining relationship types (FS/SS/FF/SF) and lag, just in case
      const predId = rawPredId.replace(/\s*(FS|FF|SS|SF)\s*([+-][^,;|]*)?$/i, "").trim();
      const predUuid = idToUuid.get(predId);
      if (predUuid) {
        if (!successorMap.has(predUuid)) successorMap.set(predUuid, new Set());
        successorMap.get(predUuid)!.add(act.id);
      }
    }
  }

  // Batch update successor_ids
  const updates = Array.from(successorMap.entries());
  for (let i = 0; i < updates.length; i += 50) {
    const batch = updates.slice(i, i + 50);
    await Promise.all(
      batch.map(([actId, successors]) =>
        supabase
          .from("parsed_activities")
          .update({ successor_ids: Array.from(successors) })
          .eq("id", actId)
      )
    );
  }
}

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
      "Authorization": `Bearer ${process.env.MPP_CONVERTER_API_KEY}`,
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
    // WBS hierarchy fields
    "Outline Level": String(task.outline_level || ""),
    "Parent Task": String(task.parent_task_name || ""),
    "Constraint Type": String(task.constraint_type || ""),
    "Constraint Date": String(task.constraint_date || ""),
    "Notes": String(task.notes || ""),
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
  const today = new Date(getArizonaToday() + "T00:00:00");
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

// AI-powered schedule extraction for XML and PDF files
// Note: XER files now use direct parsing (zero cost)
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
  const authClient = await createClient();
  const {
    data: { user },
    error: authError,
  } = await authClient.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getServiceClient();
  const contentType = req.headers.get("content-type") || "";

  let file: File | null = null;
  let projectId: string | null = null;
  let mapping: ColumnMapping = {};
  let filename = "";
  let ext = "";
  let storagePath: string | null = null;
  let fileBuffer: Buffer | null = null;
  let fileSize = 0;

  // Support both FormData (old flow) and JSON (new two-step flow)
  if (contentType.includes("application/json")) {
    // New flow: JSON with storage_path
    const body = await req.json();
    storagePath = body.storage_path;
    projectId = body.project_id;
    mapping = body.mapping || {};

    if (!storagePath || !projectId) {
      return NextResponse.json({ error: "Missing storage_path or project_id" }, { status: 400 });
    }

    // Download file from Supabase Storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('uploads')
      .download(storagePath);

    if (downloadError || !fileData) {
      console.error('Storage download error:', downloadError);
      return NextResponse.json({ error: "Failed to retrieve file from storage" }, { status: 500 });
    }

    // Convert Blob to Buffer
    const arrayBuffer = await fileData.arrayBuffer();
    fileBuffer = Buffer.from(arrayBuffer);
    fileSize = fileBuffer.length;

    // Extract filename from storage path: {user_id}/{timestamp}-{filename}
    const pathParts = storagePath.split('/');
    filename = pathParts[pathParts.length - 1].replace(/^\d+-/, ''); // Remove timestamp prefix
    ext = filename.split(".").pop()?.toLowerCase() || "";
  } else {
    // Old flow: FormData with file
    const formData = await req.formData();
    file = formData.get("file") as File | null;
    projectId = formData.get("project_id") as string | null;
    const mappingStr = formData.get("mapping") as string | null;

    if (!file || !projectId) {
      return NextResponse.json({ error: "Missing file or project_id" }, { status: 400 });
    }

    mapping = mappingStr ? JSON.parse(mappingStr) : {};
    filename = file.name;
    ext = filename.split(".").pop()?.toLowerCase() || "";
    fileSize = file.size;
  }

  // File size limit: 100MB max
  const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
  if (fileSize > MAX_FILE_SIZE) {
    // Clean up storage file if it exists
    if (storagePath) {
      await supabase.storage.from('uploads').remove([storagePath]);
    }
    return NextResponse.json(
      { error: 'File too large. Maximum size is 100MB.' },
      { status: 413 }
    );
  }

  // Verify project exists and get user_id
  const { data: project } = await supabase
    .from("daily_projects")
    .select("id, user_id")
    .eq("id", projectId)
    .single();
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  if (project.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Get user_id from project for quota checks
  const userId = project.user_id;

  // Daily upload limit check — 50 uploads per day
  const today = getArizonaToday();
  const { data: uploadStats } = await supabase
    .from('user_uploads')
    .select('upload_count')
    .eq('user_id', userId)
    .eq('upload_date', today)
    .single();

  const dailyCount = uploadStats?.upload_count || 0;
  if (dailyCount >= 50) {
    return NextResponse.json(
      { error: 'Daily upload limit reached (50 files per day). Try again tomorrow.' },
      { status: 429 }
    );
  }

  // Monthly upload limit check — 50 uploads per month
  const todayStr = getArizonaToday();
  const monthStart = new Date(todayStr + "T12:00:00");
  monthStart.setDate(1);
  const monthStartStr = monthStart.toISOString().split('T')[0];

  const { data: monthlyStats } = await supabase
    .from('user_uploads')
    .select('upload_count')
    .eq('user_id', userId)
    .gte('upload_date', monthStartStr);

  const monthlyCount = monthlyStats?.reduce((sum, row) => sum + row.upload_count, 0) || 0;
  if (monthlyCount >= 50) {
    return NextResponse.json(
      { error: 'Monthly upload limit reached (50 files per month).' },
      { status: 429 }
    );
  }

  // Storage quota check — 500MB total per user
  const { data: storageData } = await supabase
    .from('user_storage')
    .select('total_bytes')
    .eq('user_id', userId)
    .single();

  const currentStorage = storageData?.total_bytes || 0;
  const MAX_STORAGE = 500 * 1024 * 1024; // 500MB

  if (currentStorage + fileSize > MAX_STORAGE) {
    const usedMB = (currentStorage / (1024 * 1024)).toFixed(1);
    // Clean up storage file if it exists
    if (storagePath) {
      await supabase.storage.from('uploads').remove([storagePath]);
    }
    return NextResponse.json(
      { error: `Storage quota exceeded. You've used ${usedMB}MB of 500MB. Delete old projects to free up space.` },
      { status: 507 }
    );
  }

  // Rate limiting: max 10 uploads per hour per user
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("schedule_uploads")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId)
    .gte("created_at", oneHourAgo);
  
  if (count !== null && count >= 10) {
    return NextResponse.json({ error: "Upload limit reached (10 per hour). Please try again later." }, { status: 429 });
  }

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

  // Parse file (use buffer from storage or convert from File)
  const buffer = fileBuffer || Buffer.from(await file!.arrayBuffer());
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
    // MPP hierarchy fields (will be used in activitiesToInsert)
    (mapping as Record<string, string>)["outline_level"] = "Outline Level";
    (mapping as Record<string, string>)["parent_task"] = "Parent Task";
    (mapping as Record<string, string>)["constraint_type"] = "Constraint Type";
    (mapping as Record<string, string>)["constraint_date"] = "Constraint Date";
    (mapping as Record<string, string>)["notes"] = "Notes";
  } else if (ext === "xer") {
    // Direct XER parsing (zero cost) — includes WBS hierarchy
    const { parseXER } = await import("@/lib/xer-parser");
    const xerText = buffer.toString("utf-8");
    const xerTasks = parseXER(xerText);

    if (xerTasks.length === 0) {
      return NextResponse.json({ error: "No tasks found in XER file. Verify this is a valid Primavera P6 export." }, { status: 400 });
    }

    // Build activities directly (bypass generic RawRow pipeline to preserve WBS path)
    const xerActivities = xerTasks.map((task) => {
      const activityName = task.task_name.trim();
      if (!activityName) return null;

      const startDate = task.start_date || null;
      const finishDate = task.end_date || null;
      const pct = task.percent_complete ?? 0;
      const duration = task.duration;
      const inferredTrade = inferTrade(activityName);
      const isMilestone = task.milestone;
      const status = deriveStatus({ actual_finish: null, actual_start: null, percent_complete: pct, start_date: startDate });
      const wbsNorm = normalizeWBS(task.wbs_path, activityName);

      return {
        project_id: projectId,
        upload_id: upload.id,
        activity_id: task.task_id || null,
        activity_name: activityName,
        wbs: task.wbs_id || null,
        area: null,
        trade: inferredTrade,
        original_duration: duration,
        remaining_duration: duration && pct !== null ? Math.round(duration * (1 - pct / 100)) : duration,
        start_date: startDate,
        finish_date: finishDate,
        actual_start: null,
        actual_finish: null,
        percent_complete: pct,
        predecessor_ids: task.pred_task_ids ? task.pred_task_ids.split(/[,;|]/).map((s) => {
          // Strip relationship types (FS/SS/FF/SF) and lag
          return s.trim().replace(/\s*(FS|FF|SS|SF)\s*([+-][^,;|]*)?$/i, "").trim();
        }).filter(Boolean) : null,
        successor_ids: null,
        milestone: isMilestone,
        status,
        // Metadata
        constraint_type: task.constraint_type,
        constraint_date: task.constraint_date,
        resource_names: task.resource_names,
        notes: task.notes,
        external_task_id: task.external_task_id,
        external_unique_id: task.external_unique_id,
        outline_level: task.outline_level,
        parent_activity_name: task.parent_wbs_name,
        // Normalized hierarchy
        ...wbsNorm,
        normalized_trade: inferredTrade,
      };
    }).filter(Boolean);

    // FIX 1: Save old activity name->id mapping BEFORE deleting (XER re-upload)
    const xerSubsWithActivities: { id: string; activity_ids: string[] }[] = [];
    const xerOldIdToName = new Map<string, string>();
    {
      const { data: xerSubsToRemap } = await supabase
        .from("project_subs")
        .select("id, activity_ids")
        .eq("project_id", projectId)
        .not("activity_ids", "is", null);

      if (xerSubsToRemap && xerSubsToRemap.length > 0) {
        const allOldIds = xerSubsToRemap
          .flatMap((s) => s.activity_ids ?? [])
          .filter(Boolean);
        if (allOldIds.length > 0) {
          const { data: oldActs } = await supabase
            .from("parsed_activities")
            .select("id, activity_name")
            .in("id", allOldIds);
          if (oldActs) {
            for (const a of oldActs) xerOldIdToName.set(a.id, a.activity_name);
          }
        }
        for (const s of xerSubsToRemap) {
          if (s.activity_ids && s.activity_ids.length > 0) {
            xerSubsWithActivities.push({ id: s.id, activity_ids: s.activity_ids });
          }
        }
      }
    }

    // ── Clean slate on re-upload ──────────────────────────────────────────
    // Delete old activities, risks, and stale upload records so re-uploads
    // don't accumulate ghost data.
    await supabase.from("parsed_activities").delete().eq("project_id", projectId);
    await supabase.from("daily_risks").delete().eq("project_id", projectId).eq("status", "open");
    // Clean old upload records (keep only the current one)
    await supabase.from("schedule_uploads").delete().eq("project_id", projectId).neq("id", upload.id);

    // Insert in batches and return early
    const insertedXer: { id: string }[] = [];
    for (let i = 0; i < xerActivities.length; i += 100) {
      const batch = xerActivities.slice(i, i + 100);
      const { data } = await supabase.from("parsed_activities").insert(batch).select("id");
      if (data) insertedXer.push(...data);
    }

    // FIX 1: Remap project_subs.activity_ids to new UUIDs after XER re-upload
    if (xerSubsWithActivities.length > 0 && insertedXer.length > 0) {
      const { data: xerNewActs } = await supabase
        .from("parsed_activities")
        .select("id, activity_name")
        .eq("project_id", projectId);
      const xerNewNameToId = new Map<string, string>();
      if (xerNewActs) {
        for (const a of xerNewActs) xerNewNameToId.set(a.activity_name, a.id);
      }
      for (const sub of xerSubsWithActivities) {
        const remapped: string[] = [];
        const unmapped: string[] = [];
        for (const oldId of sub.activity_ids) {
          const name = xerOldIdToName.get(oldId);
          if (name) {
            const newId = xerNewNameToId.get(name);
            if (newId) remapped.push(newId);
            else unmapped.push(name);
          }
        }
        if (unmapped.length > 0) {
          console.warn(`[upload/xer] Sub ${sub.id}: could not remap activities (removed from schedule): ${unmapped.join(", ")}`);
        }
        await supabase
          .from("project_subs")
          .update({ activity_ids: remapped.length > 0 ? remapped : null })
          .eq("id", sub.id);
      }
    }

    // Compute successor_ids from predecessor_ids
    await computeSuccessorIds(supabase, projectId);

    const xMilestoneCount = xerActivities.filter((a) => a?.milestone).length;
    await supabase.from("schedule_uploads").update({ parse_status: "complete", activity_count: insertedXer.length }).eq("id", upload.id);

    const { data: xerAllActivities } = await supabase.from("parsed_activities").select("*").eq("project_id", projectId);
    if (xerAllActivities && xerAllActivities.length > 0) {
      const validStarts = xerAllActivities.map((a) => a.start_date).filter((d): d is string => !!d);
      const validFinishes = xerAllActivities.map((a) => a.finish_date).filter((d): d is string => !!d);
      if (validStarts.length > 0 && validFinishes.length > 0) {
        await supabase.from("daily_projects").update({ start_date: validStarts.sort()[0], target_finish_date: validFinishes.sort().reverse()[0] }).eq("id", projectId);
      }
    }
    const xRiskCount = await runRiskDetection(projectId, xerAllActivities || []);
    const { data: xRisks } = await supabase.from("daily_risks").select("*").eq("project_id", projectId).eq("status", "open");
    const { score: xScore } = computeHealthScore(xRisks || [], xerAllActivities || []);
    await supabase.from("daily_projects").update({ health_score: xScore }).eq("id", projectId);
    await supabase.rpc("increment_daily_uploads", { p_user_id: userId, p_file_size: fileSize });
    await supabase.rpc("increment_user_storage", { p_user_id: userId, p_file_size: fileSize });
    if (storagePath) await supabase.storage.from("uploads").remove([storagePath]);

    return NextResponse.json({
      upload_id: upload.id,
      project_id: projectId,
      activities_parsed: insertedXer.length,
      milestones_found: xMilestoneCount,
      risks_detected: xRiskCount,
      health_score: xScore,
      ai_parsed: false,
    });
  } else if (ext === "xml") {
    // AI-powered parsing for XML files
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
    return NextResponse.json({ error: "Unsupported file type. Accepted: .xlsx, .xls, .csv, .mpp, .xml, .xer" }, { status: 400 });
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

  // FIX 1: Save old activity name->id mapping BEFORE deleting (re-upload remapping)
  const subsWithActivities: { id: string; activity_ids: string[] }[] = [];
  const oldIdToName = new Map<string, string>();
  {
    const { data: subsToRemap } = await supabase
      .from("project_subs")
      .select("id, activity_ids")
      .eq("project_id", projectId)
      .not("activity_ids", "is", null);

    if (subsToRemap && subsToRemap.length > 0) {
      const allOldIds = subsToRemap
        .flatMap((s) => s.activity_ids ?? [])
        .filter(Boolean);
      if (allOldIds.length > 0) {
        const { data: oldActs } = await supabase
          .from("parsed_activities")
          .select("id, activity_name")
          .in("id", allOldIds);
        if (oldActs) {
          for (const a of oldActs) oldIdToName.set(a.id, a.activity_name);
        }
      }
      for (const s of subsToRemap) {
        if (s.activity_ids && s.activity_ids.length > 0) {
          subsWithActivities.push({ id: s.id, activity_ids: s.activity_ids });
        }
      }
    }
  }

  // ── Clean slate on re-upload ────────────────────────────────────────────
  // Delete old activities, risks, and stale upload records so re-uploads
  // don't accumulate ghost data.
  await supabase.from("parsed_activities").delete().eq("project_id", projectId);
  await supabase.from("daily_risks").delete().eq("project_id", projectId).eq("status", "open");
  // Clean old upload records (keep only the current one)
  await supabase.from("schedule_uploads").delete().eq("project_id", projectId).neq("id", upload.id);

  // Build flat hierarchy rows for MPP/XLSX outline-level WBS path resolution
  const outlineColName = (mapping as Record<string, string>)["outline_level"] || "Outline Level";
  const parentTaskColName = (mapping as Record<string, string>)["parent_task"] || "Parent Task";
  const constraintTypeColName = (mapping as Record<string, string>)["constraint_type"] || "Constraint Type";
  const constraintDateColName = (mapping as Record<string, string>)["constraint_date"] || "Constraint Date";
  const notesColName = (mapping as Record<string, string>)["notes"] || "Notes";
  const hasOutlineLevel = rows.some((r) => !!r[outlineColName]);

  const flatRows: FlatHierarchyRow[] = rows.map((row) => ({
    name: String((row["Activity Name"] || row[(mapping as Record<string, string>)["activity_name"]] || "")).trim(),
    outline_level: parseInt(String(row[outlineColName] || "0")) || 0,
    parent_task_name: String(row[parentTaskColName] || "").trim() || undefined,
  }));

  // Process rows into activities
  const activitiesToInsert = rows.map((row, rowIndex) => {
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
      ? predecessorRaw.split(/[,;|]/).map((s) => {
          // Strip relationship types (FS/SS/FF/SF) and lag (+2d, -1d, +3 days, etc.)
          // Examples: "15FS" → "15", "A1010SS+2d" → "A1010", "20FF-1" → "20"
          return s.trim().replace(/\s*(FS|FF|SS|SF)\s*([+-][^,;|]*)?$/i, "").trim();
        }).filter(Boolean)
      : [];

    const status = deriveStatus({ actual_finish: actualFinish, actual_start: actualStart, percent_complete: pct, start_date: startDate });

    // WBS hierarchy for MPP/XLSX/CSV: use outline level + parent traversal
    const outlineLevelRaw = parseInt(String(row[outlineColName] || "0")) || 0;
    const parentTaskName = String(row[parentTaskColName] || "").trim() || null;
    const constraintTypeRaw = String(row[constraintTypeColName] || "").trim() || null;
    const constraintDateRaw = parseDate(String(row[constraintDateColName] || ""));
    const notesRaw = String(row[notesColName] || "").trim() || null;
    const resourceNamesRaw = String(row["Resources"] || "").trim() || null;

    // Build wbs_path from flat hierarchy for MPP/XLSX
    let wbsPath: string[] = [];
    if (outlineLevelRaw > 0 && hasOutlineLevel) {
      wbsPath = buildMPPWBSPath(flatRows, rowIndex);
    } else if (parentTaskName) {
      wbsPath = [parentTaskName];
    }

    const wbsNorm = normalizeWBS(wbsPath, activityName);
    const effectiveOutlineLevel = outlineLevelRaw > 0 ? outlineLevelRaw : null;

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
      // WBS hierarchy metadata
      constraint_type: constraintTypeRaw,
      constraint_date: constraintDateRaw,
      resource_names: resourceNamesRaw,
      notes: notesRaw,
      external_task_id: String(col(row, "activity_id") || "").trim() || null,
      external_unique_id: null,
      outline_level: effectiveOutlineLevel,
      parent_activity_name: parentTaskName,
      // Normalized hierarchy
      ...wbsNorm,
      normalized_trade: inferredTrade,
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

  // FIX 1: Remap project_subs.activity_ids to new UUIDs after re-upload
  if (subsWithActivities.length > 0 && inserted.length > 0) {
    const { data: newActs } = await supabase
      .from("parsed_activities")
      .select("id, activity_name")
      .eq("project_id", projectId);
    const newNameToId = new Map<string, string>();
    if (newActs) {
      for (const a of newActs) newNameToId.set(a.activity_name, a.id);
    }
    for (const sub of subsWithActivities) {
      const remapped: string[] = [];
      const unmapped: string[] = [];
      for (const oldId of sub.activity_ids) {
        const name = oldIdToName.get(oldId);
        if (name) {
          const newId = newNameToId.get(name);
          if (newId) remapped.push(newId);
          else unmapped.push(name);
        }
      }
      if (unmapped.length > 0) {
        console.warn(
          `[upload] Sub ${sub.id}: could not remap activities (removed from schedule): ${unmapped.join(", ")}`
        );
      }
      await supabase
        .from("project_subs")
        .update({ activity_ids: remapped.length > 0 ? remapped : null })
        .eq("id", sub.id);
    }
  }

  // Compute successor_ids from predecessor_ids
  await computeSuccessorIds(supabase, projectId);

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

  // Auto-set project start and finish dates from schedule
  if (allActivities && allActivities.length > 0) {
    const validStartDates = allActivities
      .map((a) => a.start_date)
      .filter((d): d is string => d !== null && d !== undefined);
    const validFinishDates = allActivities
      .map((a) => a.finish_date)
      .filter((d): d is string => d !== null && d !== undefined);

    if (validStartDates.length > 0 && validFinishDates.length > 0) {
      const minStart = validStartDates.sort()[0];
      const maxFinish = validFinishDates.sort().reverse()[0];

      await supabase
        .from("daily_projects")
        .update({
          start_date: minStart,
          target_finish_date: maxFinish,
        })
        .eq("id", projectId);
    }
  }

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

  // Update upload tracking and storage quota
  await supabase.rpc('increment_daily_uploads', {
    p_user_id: userId,
    p_file_size: fileSize
  });

  await supabase.rpc('increment_user_storage', {
    p_user_id: userId,
    p_file_size: fileSize
  });

  // Clean up storage file if it was uploaded via two-step flow
  if (storagePath) {
    await supabase.storage.from('uploads').remove([storagePath]);
  }

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
