import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { createClient } from "@/lib/supabase-server";
import { inferTrade } from "@/lib/trade-inference";
import { runRiskDetection } from "@/lib/risk-engine";
import { computeHealthScore } from "@/lib/health-score";
import * as XLSX from "xlsx";
import Papa from "papaparse";

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
    // Excel serial date
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
  if (row.actual_start) {
    return "in_progress";
  }
  if (row.start_date) {
    const start = new Date(row.start_date);
    if (start < today && (!row.percent_complete || row.percent_complete === 0)) {
      return "late";
    }
  }
  return "not_started";
}

export async function POST(req: NextRequest) {
  const authSupabase = await createClient();
  
  // Get authenticated user
  const { data: { user }, error: authError } = await authSupabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  // Verify project exists and user owns it
  const { data: project } = await supabase
    .from("daily_projects")
    .select("id, user_id")
    .eq("id", projectId)
    .single();
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  if (project.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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

  // Parse file
  const buffer = Buffer.from(await file.arrayBuffer());
  let rows: RawRow[] = [];

  if (ext === "csv") {
    const text = buffer.toString("utf-8");
    const result = Papa.parse<RawRow>(text, { header: true, skipEmptyLines: true });
    rows = result.data;
  } else if (ext === "xlsx" || ext === "xls") {
    const wb = XLSX.read(buffer, { type: "buffer", cellDates: false });
    const ws = wb.Sheets[wb.SheetNames[0]];
    rows = XLSX.utils.sheet_to_json<RawRow>(ws, { defval: null });
  } else if (ext === "mpp") {
    // Microsoft Project — use MPXJ (Java) to convert to JSON
    const fs = await import('fs');
    const path = await import('path');
    const { execSync } = await import('child_process');
    const os = await import('os');
    
    const tmpDir = os.default.tmpdir();
    const tmpFile = path.default.join(tmpDir, `upload_${Date.now()}.mpp`);
    const tmpOut = path.default.join(tmpDir, `upload_${Date.now()}.csv`);
    
    // Write MPP to temp file
    fs.default.writeFileSync(tmpFile, buffer);
    
    const mpxjDir = 'C:\\Users\\Iront\\.openclaw\\workspace\\tools\\mpxj';
    
    try {
      // Use MPXJ to extract tasks as CSV
      // First try the Java approach
      const jars = ['mpxj.jar','poi.jar','commons-codec.jar','commons-io.jar','commons-math3.jar','jakarta-xml-bind.jar','slf4j-api.jar','slf4j-simple.jar','log4j-api.jar'].map(j => path.default.join(mpxjDir, j)).join(';');
      const cmd = `java -cp "${mpxjDir};${jars}" ReadMPP "${tmpFile}"`;
      const output = execSync(cmd, { cwd: mpxjDir, timeout: 30000, encoding: 'utf-8' });
      
      // Parse the output — ReadMPP outputs task data
      const lines = output.split('\n').filter(l => l.trim());
      let activityId = 1;
      for (const line of lines) {
        const parts = line.split('\t');
        if (parts.length >= 2 && parts[1] && parts[1].trim().length > 2) {
          rows.push({
            'Activity ID': parts[0]?.trim() || String(activityId++),
            'Activity Name': parts[1]?.trim() || '',
            'Start Date': parts[2]?.trim() || '',
            'Finish Date': parts[3]?.trim() || '',
            'Duration': parts[4]?.trim() || '',
            '% Complete': parts[5]?.trim() || '0',
          });
        }
      }
    } catch (javaErr) {
      // Java/MPXJ not available — try reading raw binary for task names
      const rawText = buffer.toString('utf-8', 0, Math.min(buffer.length, 1000000));
      const taskPattern = /[A-Z][a-z].*(?:Level|Floor|Install|Frame|Pour|Rough|Paint|Inspect|Demo|Excavat|Concrete|Steel|Roof|Plumb|Electric|HVAC|Drywall|Tile|Landscape|Close)/g;
      const matches = rawText.match(taskPattern) || [];
      const unique = [...new Set(matches)].slice(0, 500);
      let id = 1;
      for (const name of unique) {
        if (name.length > 5 && name.length < 200) {
          rows.push({
            'Activity ID': String(id++),
            'Activity Name': name.trim(),
          });
        }
      }
    } finally {
      // Cleanup temp files
      try { fs.default.unlinkSync(tmpFile); } catch {}
      try { fs.default.unlinkSync(tmpOut); } catch {}
    }
    
    if (rows.length === 0) {
      return NextResponse.json({
        error: "Could not extract tasks from this MPP file. Try exporting from Microsoft Project: File → Save As → Excel Workbook (.xlsx)",
      }, { status: 400 });
    }
  } else if (ext === "pdf") {
    // For PDF schedules, extract text and parse line-by-line
    // Use a simple text extraction approach
    const text = buffer.toString('utf-8', 0, Math.min(buffer.length, 500000));
    // Try to find tabular data in the PDF text
    const lines = text.split('\n').filter(l => l.trim().length > 10);
    // Create rows from lines that look like schedule activities
    let activityId = 1;
    for (const line of lines) {
      // Look for lines with dates (common in schedule PDFs)
      const dateMatch = line.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/);
      if (dateMatch && line.trim().length > 20) {
        rows.push({
          'Activity ID': String(activityId++),
          'Activity Name': line.replace(dateMatch[0], '').trim().slice(0, 200),
          'Start Date': dateMatch[1] || '',
          'Finish Date': dateMatch[1] || '',
        });
      }
    }
    // If no structured data found, return helpful error
    if (rows.length === 0) {
      return NextResponse.json({ 
        error: "Could not extract schedule data from this PDF. For best results, export your schedule as .xlsx or .csv from Microsoft Project or Primavera P6.",
        hint: "PDF parsing works best with schedule reports that contain dates and activity names in tabular format."
      }, { status: 400 });
    }
  } else {
    return NextResponse.json({ error: "Unsupported file type. Accepted: .xlsx, .xls, .csv, .pdf" }, { status: 400 });
  }

  if (rows.length === 0) {
    return NextResponse.json({ error: "No data rows found in file" }, { status: 400 });
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
  });
}

// GET endpoint to detect columns from file preview
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const filename = searchParams.get("filename");
  // Return column detection hint
  return NextResponse.json({ filename, message: "Upload the file via POST with form data" });
}
