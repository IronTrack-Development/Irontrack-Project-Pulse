import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { parseISOWeek, getCurrentISOWeek, formatShortDate } from "@/lib/week-utils";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getServiceClient();
  const url = new URL(req.url);
  const weekParam = url.searchParams.get("week") || getCurrentISOWeek();

  let monday: string, sunday: string;
  try {
    ({ monday, sunday } = parseISOWeek(weekParam));
  } catch {
    return new NextResponse("Invalid week format", { status: 400 });
  }

  // Fetch project info
  const { data: project } = await supabase
    .from("daily_projects")
    .select("name, client_name, project_number, location")
    .eq("id", id)
    .single();

  const projectName = project?.name || "Project";
  const clientName = project?.client_name || "";
  const projectNumber = project?.project_number || "";

  // Fetch summary data from our own API (internal fetch to reuse logic)
  // Instead, we compute inline for the PDF route to avoid circular fetch
  const { data: logs } = await supabase
    .from("daily_logs")
    .select("*")
    .eq("project_id", id)
    .gte("log_date", monday)
    .lte("log_date", sunday)
    .order("log_date");

  const logIds = (logs || []).map((l: { id: string }) => l.id);

  let progressEntries: Array<{
    activity_id: string | null;
    pct_complete_before: number;
    pct_complete_after: number;
  }> = [];
  if (logIds.length > 0) {
    const { data } = await supabase
      .from("daily_log_progress")
      .select("activity_id, pct_complete_before, pct_complete_after")
      .in("daily_log_id", logIds);
    progressEntries = data || [];
  }

  // Fetch activity names
  const activityIds = [...new Set(progressEntries.filter(p => p.activity_id).map(p => p.activity_id!))];
  let activityMap: Record<string, string> = {};
  if (activityIds.length > 0) {
    const { data: acts } = await supabase.from("parsed_activities").select("id, activity_name").in("id", activityIds);
    for (const a of acts || []) activityMap[a.id] = a.activity_name;
  }

  // Photo thumbnails
  let photos: Array<{ storage_path: string; caption: string | null }> = [];
  if (logIds.length > 0) {
    const { data } = await supabase
      .from("daily_log_photos")
      .select("storage_path, caption")
      .in("daily_log_id", logIds)
      .limit(6);
    photos = data || [];
  }

  // Compute summary values
  const crewByTrade: Record<string, { hours: number; headcount: number[] }> = {};
  let totalCrewHours = 0;
  let weatherImpactDays = 0;
  let totalDelayDays = 0;
  let totalLostHours = 0;
  const delayCodes: Record<string, number> = {};

  for (const log of logs || []) {
    for (const c of (log.crew || []) as Array<{ trade: string; headcount: number; hours: number }>) {
      const t = c.trade || "Unknown";
      if (!crewByTrade[t]) crewByTrade[t] = { hours: 0, headcount: [] };
      const h = (c.headcount || 0) * (c.hours || 0);
      crewByTrade[t].hours += h;
      crewByTrade[t].headcount.push(c.headcount || 0);
      totalCrewHours += h;
    }
    if (log.weather?.impact && log.weather.impact !== "none") weatherImpactDays++;
    const codes = (log.delay_codes || []) as string[];
    if (codes.length > 0) {
      totalDelayDays++;
      for (const c of codes) delayCodes[c] = (delayCodes[c] || 0) + 1;
    }
    totalLostHours += log.lost_crew_hours || 0;
  }

  const completed = progressEntries
    .filter(p => p.pct_complete_after === 100)
    .map(p => p.activity_id ? activityMap[p.activity_id] || "Unknown" : "Unknown");

  const advanced = progressEntries
    .filter(p => p.pct_complete_after > p.pct_complete_before)
    .map(p => ({
      name: p.activity_id ? activityMap[p.activity_id] || "Unknown" : "Unknown",
      delta: p.pct_complete_after - p.pct_complete_before,
    }));

  // Build crew table rows
  const crewRows = Object.entries(crewByTrade)
    .sort((a, b) => b[1].hours - a[1].hours)
    .map(([trade, d]) => {
      const avgHC = Math.round((d.headcount.reduce((s, n) => s + n, 0) / d.headcount.length) * 10) / 10;
      return `<tr><td>${trade}</td><td>${Math.round(d.hours)}</td><td>${avgHC}</td></tr>`;
    }).join("");

  // Delay rows
  const delayRows = Object.entries(delayCodes)
    .sort((a, b) => b[1] - a[1])
    .map(([code, count]) => `<tr><td>${code}</td><td>${count}</td></tr>`)
    .join("");

  const mondayLabel = formatShortDate(monday);
  const sundayLabel = formatShortDate(sunday);
  const year = monday.substring(0, 4);

  // Photo URLs
  const photoHtml = photos.map(p => {
    const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/daily-log-photos/${p.storage_path}`;
    return `<div class="photo"><img src="${publicUrl}" alt="${p.caption || ""}" />${p.caption ? `<span>${p.caption}</span>` : ""}</div>`;
  }).join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${projectName} — Weekly Report ${mondayLabel}–${sundayLabel}, ${year}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1a1a1a; background: #fff; padding: 40px; max-width: 900px; margin: 0 auto; font-size: 13px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; border-bottom: 3px solid #F97316; padding-bottom: 16px; }
  .header h1 { font-size: 22px; color: #0B0B0D; }
  .header .meta { text-align: right; font-size: 12px; color: #666; }
  .header .brand { font-size: 11px; color: #F97316; font-weight: 700; letter-spacing: 0.5px; }
  .section { margin-bottom: 20px; }
  .section h2 { font-size: 14px; font-weight: 700; color: #F97316; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
  .stats { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 20px; }
  .stat { flex: 1; min-width: 120px; background: #f8f8f8; border-radius: 8px; padding: 12px; text-align: center; }
  .stat .value { font-size: 24px; font-weight: 800; color: #0B0B0D; }
  .stat .label { font-size: 11px; color: #666; margin-top: 2px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
  th { background: #f3f3f3; text-align: left; padding: 6px 10px; font-size: 11px; text-transform: uppercase; color: #666; border-bottom: 2px solid #e0e0e0; }
  td { padding: 6px 10px; border-bottom: 1px solid #eee; }
  .list { padding-left: 18px; }
  .list li { margin-bottom: 4px; }
  .narrative { background: #FFF7ED; border-left: 3px solid #F97316; padding: 12px 16px; border-radius: 4px; font-style: italic; margin-bottom: 20px; }
  .photos { display: flex; gap: 8px; flex-wrap: wrap; }
  .photo { width: 130px; }
  .photo img { width: 100%; border-radius: 6px; }
  .photo span { font-size: 10px; color: #666; display: block; margin-top: 2px; }
  .footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #e0e0e0; font-size: 10px; color: #999; text-align: center; }
  @media print { body { padding: 20px; } .stat { break-inside: avoid; } }
</style>
</head>
<body>
<div class="header">
  <div>
    <h1>${projectName}</h1>
    <div style="color:#666; font-size:13px; margin-top:2px;">${[clientName, projectNumber].filter(Boolean).join(" • ")}</div>
  </div>
  <div class="meta">
    <div class="brand">IRONTRACK PROJECT PULSE</div>
    <div style="margin-top:4px;">Weekly Report</div>
    <div>${mondayLabel} – ${sundayLabel}, ${year}</div>
    <div>${(logs || []).length} day${(logs || []).length !== 1 ? "s" : ""} logged</div>
  </div>
</div>

<div class="narrative">${(() => {
  const tradeCount = Object.keys(crewByTrade).length;
  const topDelay = Object.entries(delayCodes).sort((a, b) => b[1] - a[1])[0];
  return `This week the team logged ${Math.round(totalCrewHours).toLocaleString()} crew-hours across ${tradeCount} trade${tradeCount !== 1 ? "s" : ""}. ${advanced.length} activit${advanced.length !== 1 ? "ies were" : "y was"} advanced${completed.length > 0 ? ` (${completed.length} completed)` : ""}. ${weatherImpactDays} weather impact day${weatherImpactDays !== 1 ? "s" : ""}.${topDelay ? ` Top delay: ${topDelay[0]}.` : ""}`;
})()}</div>

<div class="stats">
  <div class="stat"><div class="value">${Math.round(totalCrewHours).toLocaleString()}</div><div class="label">Crew-Hours</div></div>
  <div class="stat"><div class="value">${(logs || []).length}</div><div class="label">Days Logged</div></div>
  <div class="stat"><div class="value">${weatherImpactDays}</div><div class="label">Weather Impact</div></div>
  <div class="stat"><div class="value">${advanced.length}</div><div class="label">Activities Advanced</div></div>
  <div class="stat"><div class="value">${totalLostHours}</div><div class="label">Lost Hours</div></div>
</div>

<div class="section">
  <h2>Crew Summary</h2>
  <table>
    <thead><tr><th>Trade</th><th>Crew-Hours</th><th>Avg Headcount</th></tr></thead>
    <tbody>${crewRows || '<tr><td colspan="3" style="color:#999">No crew data</td></tr>'}</tbody>
  </table>
</div>

${completed.length > 0 ? `<div class="section">
  <h2>Activities Completed</h2>
  <ul class="list">${completed.map(n => `<li>${n}</li>`).join("")}</ul>
</div>` : ""}

${advanced.length > 0 ? `<div class="section">
  <h2>Activities Advanced</h2>
  <ul class="list">${advanced.map(a => `<li>${a.name} (+${a.delta}%)</li>`).join("")}</ul>
</div>` : ""}

${Object.keys(delayCodes).length > 0 ? `<div class="section">
  <h2>Delay Summary</h2>
  <table>
    <thead><tr><th>Reason</th><th>Occurrences</th></tr></thead>
    <tbody>${delayRows}</tbody>
  </table>
  <div style="font-size:12px; color:#666; margin-top:4px;">${totalDelayDays} delay day${totalDelayDays !== 1 ? "s" : ""} · ${totalLostHours} lost crew-hours</div>
</div>` : ""}

${photos.length > 0 ? `<div class="section">
  <h2>Photos</h2>
  <div class="photos">${photoHtml}</div>
</div>` : ""}

<div class="footer">Generated by IronTrack Project Pulse · ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</div>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
