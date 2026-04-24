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
    return NextResponse.json({ error: "Invalid week format. Use YYYY-Wnn" }, { status: 400 });
  }

  // Fetch all logs for this project in the week range
  const { data: logs, error: logsErr } = await supabase
    .from("daily_logs")
    .select("*")
    .eq("project_id", id)
    .gte("log_date", monday)
    .lte("log_date", sunday)
    .order("log_date");

  if (logsErr) return NextResponse.json({ error: logsErr.message }, { status: 500 });

  const logIds = (logs || []).map((l: { id: string }) => l.id);

  // Fetch progress entries for all logs this week
  let progressEntries: Array<{
    id: string;
    daily_log_id: string;
    activity_id: string | null;
    pct_complete_before: number;
    pct_complete_after: number;
    note: string | null;
  }> = [];
  if (logIds.length > 0) {
    const { data } = await supabase
      .from("daily_log_progress")
      .select("*")
      .in("daily_log_id", logIds);
    progressEntries = data || [];
  }

  // Fetch photo count
  let photoCount = 0;
  if (logIds.length > 0) {
    const { count } = await supabase
      .from("daily_log_photos")
      .select("id", { count: "exact", head: true })
      .in("daily_log_id", logIds);
    photoCount = count || 0;
  }

  // Fetch activity names for progress entries
  const activityIds = [...new Set(progressEntries.filter(p => p.activity_id).map(p => p.activity_id!))];
  let activityMap: Record<string, { activity_name: string; trade: string | null }> = {};
  if (activityIds.length > 0) {
    const { data: activities } = await supabase
      .from("parsed_activities")
      .select("id, activity_name, trade")
      .in("id", activityIds);
    for (const a of activities || []) {
      activityMap[a.id] = { activity_name: a.activity_name, trade: a.trade };
    }
  }

  // Compute crew-hours by trade
  const crewHoursByTrade: Record<string, number> = {};
  const headcountByTrade: Record<string, number[]> = {};
  let totalCrewHours = 0;

  for (const log of logs || []) {
    const crew = (log.crew || []) as Array<{ trade: string; headcount: number; hours: number }>;
    for (const c of crew) {
      const trade = c.trade || "Unknown";
      const hours = (c.headcount || 0) * (c.hours || 0);
      crewHoursByTrade[trade] = (crewHoursByTrade[trade] || 0) + hours;
      if (!headcountByTrade[trade]) headcountByTrade[trade] = [];
      headcountByTrade[trade].push(c.headcount || 0);
      totalCrewHours += hours;
    }
  }

  // Average headcount by trade
  const avgHeadcountByTrade: Record<string, number> = {};
  for (const [trade, counts] of Object.entries(headcountByTrade)) {
    avgHeadcountByTrade[trade] = Math.round(
      (counts.reduce((s, n) => s + n, 0) / counts.length) * 10
    ) / 10;
  }

  // Activities completed (pct_complete_after = 100)
  const activitiesCompleted = progressEntries
    .filter((p) => p.pct_complete_after === 100)
    .map((p) => ({
      activityId: p.activity_id,
      activityName: p.activity_id ? activityMap[p.activity_id]?.activity_name || "Unknown" : "Unknown",
      trade: p.activity_id ? activityMap[p.activity_id]?.trade || null : null,
    }));

  // Activities advanced (delta > 0)
  const activitiesAdvanced = progressEntries
    .filter((p) => p.pct_complete_after > p.pct_complete_before)
    .map((p) => ({
      activityId: p.activity_id,
      activityName: p.activity_id ? activityMap[p.activity_id]?.activity_name || "Unknown" : "Unknown",
      trade: p.activity_id ? activityMap[p.activity_id]?.trade || null : null,
      delta: p.pct_complete_after - p.pct_complete_before,
      pctAfter: p.pct_complete_after,
    }));

  // Weather impact days
  const weatherImpactDays = (logs || []).filter((l: { weather?: { impact?: string } }) => {
    const impact = l.weather?.impact;
    return impact && impact !== "none";
  }).length;

  // Delay days + delay breakdown
  const delayBreakdown: Record<string, number> = {};
  let totalDelayDays = 0;
  let totalLostCrewHours = 0;
  const openIssues: Array<{ date: string; narrative: string }> = [];

  for (const log of logs || []) {
    const codes = (log.delay_codes || []) as string[];
    if (codes.length > 0) {
      totalDelayDays++;
      for (const code of codes) {
        delayBreakdown[code] = (delayBreakdown[code] || 0) + 1;
      }
    }
    totalLostCrewHours += log.lost_crew_hours || 0;
    if (log.delay_narrative) {
      openIssues.push({ date: log.log_date, narrative: log.delay_narrative });
    }
  }

  // Top delay
  const topDelay = Object.entries(delayBreakdown).sort((a, b) => b[1] - a[1])[0];
  const tradeCount = Object.keys(crewHoursByTrade).length;

  // Auto-generated narrative
  const narrative = `This week the team logged ${Math.round(totalCrewHours).toLocaleString()} crew-hours across ${tradeCount} trade${tradeCount !== 1 ? "s" : ""}. ${activitiesAdvanced.length} activit${activitiesAdvanced.length !== 1 ? "ies were" : "y was"} advanced${activitiesCompleted.length > 0 ? ` (${activitiesCompleted.length} completed)` : ""}. ${weatherImpactDays} weather impact day${weatherImpactDays !== 1 ? "s" : ""}.${topDelay ? ` Top delay: ${topDelay[0]}.` : ""}`;

  // Total headcount average (all trades combined, per day)
  const dailyHeadcounts = (logs || []).map((log: { crew?: Array<{ headcount: number }> }) => {
    return (log.crew || []).reduce((sum: number, c: { headcount: number }) => sum + (c.headcount || 0), 0);
  });
  const avgDailyCrew = dailyHeadcounts.length > 0
    ? Math.round((dailyHeadcounts.reduce((s: number, n: number) => s + n, 0) / dailyHeadcounts.length) * 10) / 10
    : 0;

  return NextResponse.json({
    week: weekParam,
    monday,
    sunday,
    mondayLabel: formatShortDate(monday),
    sundayLabel: formatShortDate(sunday),
    totalLogDays: (logs || []).length,
    totalCrewHours: Math.round(totalCrewHours),
    avgDailyCrew,
    crewHoursByTrade,
    avgHeadcountByTrade,
    activitiesCompleted,
    activitiesAdvanced,
    weatherImpactDays,
    totalDelayDays,
    totalLostCrewHours,
    delayBreakdown,
    photoCount,
    openIssues,
    narrative,
  });
}
