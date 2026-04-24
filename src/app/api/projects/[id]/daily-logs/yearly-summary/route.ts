import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { getArizonaToday } from "@/lib/arizona-date";
import { parseQuarter, parseMonth } from "@/lib/week-utils";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getServiceClient();
  const url = new URL(req.url);
  const year = url.searchParams.get("year") || getArizonaToday().substring(0, 4);

  const firstDay = `${year}-01-01`;
  const lastDay = `${year}-12-31`;

  // Fetch all logs for the year
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

  // Milestones for the year
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
  }) => m.percent_complete === 100 && (!m.actual_finish || !m.finish_date || m.actual_finish <= m.finish_date)).length;
  const milestoneHitRate = totalMilestones > 0 ? Math.round((milestonesOnTime / totalMilestones) * 100) : null;

  // Aggregate totals
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
    if ((log.delay_codes || []).length > 0) {
      totalDelayDays++;
      for (const c of (log.delay_codes as string[])) delayCodes[c] = (delayCodes[c] || 0) + 1;
    }
    totalLostHours += log.lost_crew_hours || 0;
  }

  const topDelays = Object.entries(delayCodes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([code, count]) => ({ code, count }));

  const totalLogDays = (logs || []).length;
  const overallDelayPercent = totalLogDays > 0
    ? Math.round((totalDelayDays / totalLogDays) * 100)
    : 0;

  // Quarter-over-quarter breakdown
  const quarters = [`${year}-Q1`, `${year}-Q2`, `${year}-Q3`, `${year}-Q4`];
  const quarterlySummaries = quarters.map(q => {
    const { firstDay: qFirst, lastDay: qLast, months } = parseQuarter(q);
    const qLogs = (logs || []).filter((l: { log_date: string }) =>
      l.log_date >= qFirst && l.log_date <= qLast);
    const qLogIds = qLogs.map((l: { id: string }) => l.id);

    let qCrewHours = 0;
    let qDelayDays = 0;
    let qLostHours = 0;
    for (const log of qLogs) {
      for (const c of (log.crew || []) as Array<{ headcount: number; hours: number }>) {
        qCrewHours += (c.headcount || 0) * (c.hours || 0);
      }
      if ((log.delay_codes || []).length > 0) qDelayDays++;
      qLostHours += log.lost_crew_hours || 0;
    }

    const qCompleted = progressEntries.filter(p =>
      qLogIds.includes(p.daily_log_id) && p.pct_complete_after === 100
    ).length;

    const qMilestones = (milestones || []).filter((m: { finish_date?: string | null }) =>
      m.finish_date && m.finish_date >= qFirst && m.finish_date <= qLast);
    const qMilestonesOnTime = qMilestones.filter((m: {
      actual_finish?: string | null;
      finish_date?: string | null;
      percent_complete: number;
    }) => m.percent_complete === 100 && (!m.actual_finish || !m.finish_date || m.actual_finish <= m.finish_date)).length;

    // Monthly breakdown within quarter
    const monthlyData = months.map(m => {
      const { firstDay: mFirst, lastDay: mLast } = parseMonth(m);
      const mLogs = qLogs.filter((l: { log_date: string }) => l.log_date >= mFirst && l.log_date <= mLast);
      let mCrewHours = 0;
      let mDelays = 0;
      for (const log of mLogs) {
        for (const c of (log.crew || []) as Array<{ headcount: number; hours: number }>) {
          mCrewHours += (c.headcount || 0) * (c.hours || 0);
        }
        if ((log.delay_codes || []).length > 0) mDelays++;
      }
      return { month: m, crewHours: Math.round(mCrewHours), delayDays: mDelays, logDays: mLogs.length };
    });

    // Trend direction within quarter
    const withData = monthlyData.filter(m => m.logDays > 0);
    let trend: "improving" | "stable" | "declining" = "stable";
    if (withData.length >= 2) {
      const first = withData[0];
      const last = withData[withData.length - 1];
      const fDelay = first.logDays > 0 ? first.delayDays / first.logDays : 0;
      const lDelay = last.logDays > 0 ? last.delayDays / last.logDays : 0;
      if (lDelay < fDelay - 0.05) trend = "improving";
      else if (lDelay > fDelay + 0.05) trend = "declining";
    }

    return {
      quarter: q,
      logDays: qLogs.length,
      crewHours: Math.round(qCrewHours),
      delayDays: qDelayDays,
      lostHours: qLostHours,
      completedActivities: qCompleted,
      totalMilestones: qMilestones.length,
      milestonesOnTime: qMilestonesOnTime,
      milestoneHitRate: qMilestones.length > 0 ? Math.round((qMilestonesOnTime / qMilestones.length) * 100) : null,
      trendDirection: trend,
      monthlyBreakdown: monthlyData,
    };
  });

  return NextResponse.json({
    year,
    firstDay,
    lastDay,
    totalLogDays,
    totalCrewHours: Math.round(totalCrewHours),
    crewHoursByTrade,
    totalDelayDays,
    totalLostHours,
    overallDelayPercent,
    milestoneHitRate,
    totalMilestones,
    milestonesOnTime,
    topDelays,
    quarterlySummaries,
  });
}
