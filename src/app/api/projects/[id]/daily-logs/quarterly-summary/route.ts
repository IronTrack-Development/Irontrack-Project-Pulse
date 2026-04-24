import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { parseQuarter, getCurrentQuarter, parseMonth } from "@/lib/week-utils";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getServiceClient();
  const url = new URL(req.url);
  const quarterParam = url.searchParams.get("quarter") || getCurrentQuarter();

  let firstDay: string, lastDay: string, months: string[];
  try {
    ({ firstDay, lastDay, months } = parseQuarter(quarterParam));
  } catch {
    return NextResponse.json({ error: "Invalid quarter format. Use YYYY-Qn" }, { status: 400 });
  }

  // Fetch all logs for the quarter
  const { data: logs, error } = await supabase
    .from("daily_logs")
    .select("*")
    .eq("project_id", id)
    .gte("log_date", firstDay)
    .lte("log_date", lastDay)
    .order("log_date");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const logIds = (logs || []).map((l: { id: string }) => l.id);

  // Progress entries
  let progressEntries: Array<{
    daily_log_id: string;
    activity_id: string | null;
    pct_complete_before: number;
    pct_complete_after: number;
  }> = [];
  if (logIds.length > 0) {
    const { data } = await supabase
      .from("daily_log_progress")
      .select("daily_log_id, activity_id, pct_complete_before, pct_complete_after")
      .in("daily_log_id", logIds);
    progressEntries = data || [];
  }

  // Milestone hit rate
  const { data: milestones } = await supabase
    .from("parsed_activities")
    .select("id, activity_name, finish_date, actual_finish, percent_complete")
    .eq("project_id", id)
    .eq("milestone", true)
    .gte("finish_date", firstDay)
    .lte("finish_date", lastDay);

  const totalMilestones = (milestones || []).length;
  const milestonesOnTime = (milestones || []).filter((m: {
    actual_finish?: string | null;
    finish_date?: string | null;
    percent_complete: number;
  }) => {
    if (m.percent_complete === 100) {
      if (m.actual_finish && m.finish_date) return m.actual_finish <= m.finish_date;
      return true; // completed, no actual_finish recorded — assume on time
    }
    return false;
  }).length;

  const milestoneHitRate = totalMilestones > 0
    ? Math.round((milestonesOnTime / totalMilestones) * 100)
    : null;

  // Crew-hours by trade
  const crewHoursByTrade: Record<string, number> = {};
  let totalCrewHours = 0;
  let totalDelayDays = 0;
  let totalLostHours = 0;
  const delayCodes: Record<string, number> = {};

  for (const log of logs || []) {
    for (const c of (log.crew || []) as Array<{ trade: string; headcount: number; hours: number }>) {
      const t = c.trade || "Unknown";
      const h = (c.headcount || 0) * (c.hours || 0);
      crewHoursByTrade[t] = (crewHoursByTrade[t] || 0) + h;
      totalCrewHours += h;
    }
    const codes = (log.delay_codes || []) as string[];
    if (codes.length > 0) {
      totalDelayDays++;
      for (const c of codes) delayCodes[c] = (delayCodes[c] || 0) + 1;
    }
    totalLostHours += log.lost_crew_hours || 0;
  }

  // Top 3 delay reasons
  const topDelays = Object.entries(delayCodes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([code, count]) => ({ code, count }));

  // Monthly breakdown for trend direction
  const monthlyStats = months.map(m => {
    const { firstDay: mFirst, lastDay: mLast } = parseMonth(m);
    const monthLogs = (logs || []).filter((l: { log_date: string }) =>
      l.log_date >= mFirst && l.log_date <= mLast);
    let crewHrs = 0;
    let delays = 0;
    for (const log of monthLogs) {
      for (const c of (log.crew || []) as Array<{ headcount: number; hours: number }>) {
        crewHrs += (c.headcount || 0) * (c.hours || 0);
      }
      if ((log.delay_codes || []).length > 0) delays++;
    }
    const monthLogIds = monthLogs.map((l: { id: string }) => l.id);
    const completedCount = progressEntries.filter(p =>
      monthLogIds.includes(p.daily_log_id) && p.pct_complete_after === 100
    ).length;

    return { month: m, crewHours: Math.round(crewHrs), delayDays: delays, completedActivities: completedCount, logDays: monthLogs.length };
  });

  // Trend direction: compare last month to first month
  let trendDirection: "improving" | "stable" | "declining" = "stable";
  const monthsWithData = monthlyStats.filter(m => m.logDays > 0);
  if (monthsWithData.length >= 2) {
    const first = monthsWithData[0];
    const last = monthsWithData[monthsWithData.length - 1];
    // Improving = more completions + fewer delay days (normalized per log day)
    const firstDelayRate = first.logDays > 0 ? first.delayDays / first.logDays : 0;
    const lastDelayRate = last.logDays > 0 ? last.delayDays / last.logDays : 0;
    const firstCompRate = first.logDays > 0 ? first.completedActivities / first.logDays : 0;
    const lastCompRate = last.logDays > 0 ? last.completedActivities / last.logDays : 0;

    const delayImproving = lastDelayRate < firstDelayRate - 0.05;
    const delayDeclining = lastDelayRate > firstDelayRate + 0.05;
    const compImproving = lastCompRate > firstCompRate + 0.02;
    const compDeclining = lastCompRate < firstCompRate - 0.02;

    if (delayImproving || compImproving) trendDirection = "improving";
    else if (delayDeclining || compDeclining) trendDirection = "declining";
  }

  return NextResponse.json({
    quarter: quarterParam,
    firstDay,
    lastDay,
    totalLogDays: (logs || []).length,
    totalCrewHours: Math.round(totalCrewHours),
    crewHoursByTrade,
    totalDelayDays,
    totalLostHours,
    milestoneHitRate,
    totalMilestones,
    milestonesOnTime,
    topDelays,
    trendDirection,
    monthlyBreakdown: monthlyStats,
  });
}
