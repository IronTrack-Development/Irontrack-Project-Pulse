import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { parseMonth, getCurrentMonth, getWeekMonday } from "@/lib/week-utils";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getServiceClient();
  const url = new URL(req.url);
  const monthParam = url.searchParams.get("month") || getCurrentMonth();

  let firstDay: string, lastDay: string;
  try {
    ({ firstDay, lastDay } = parseMonth(monthParam));
  } catch {
    return NextResponse.json({ error: "Invalid month format. Use YYYY-MM" }, { status: 400 });
  }

  // Fetch logs for the month
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
    pct_complete_before: number;
    pct_complete_after: number;
  }> = [];
  if (logIds.length > 0) {
    const { data } = await supabase
      .from("daily_log_progress")
      .select("daily_log_id, pct_complete_before, pct_complete_after")
      .in("daily_log_id", logIds);
    progressEntries = data || [];
  }

  // Build daily crew utilization trend
  const dailyTrend = (logs || []).map((log: {
    log_date: string;
    crew?: Array<{ headcount: number; hours: number }>;
  }) => {
    const crew = log.crew || [];
    const headcount = crew.reduce((s: number, c: { headcount: number }) => s + (c.headcount || 0), 0);
    const crewHours = crew.reduce((s: number, c: { headcount: number; hours: number }) =>
      s + (c.headcount || 0) * (c.hours || 0), 0);
    return { date: log.log_date, headcount, crewHours };
  });

  // Activity completion by week
  const logDateMap: Record<string, string> = {};
  for (const log of logs || []) {
    logDateMap[log.id] = log.log_date;
  }

  const weeklyCompletions: Record<string, number> = {};
  for (const p of progressEntries) {
    if (p.pct_complete_after === 100) {
      const logDate = logDateMap[p.daily_log_id];
      if (logDate) {
        const weekMonday = getWeekMonday(logDate);
        weeklyCompletions[weekMonday] = (weeklyCompletions[weekMonday] || 0) + 1;
      }
    }
  }

  const activityCompletionByWeek = Object.entries(weeklyCompletions)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([weekStart, count]) => ({ weekStart, completedCount: count }));

  // Recurring delay codes
  const delayCodes: Record<string, number> = {};
  let weatherImpactDays = 0;
  let totalDelayDays = 0;
  let totalLostHours = 0;
  let totalCrewHours = 0;

  for (const log of logs || []) {
    const crew = (log.crew || []) as Array<{ headcount: number; hours: number }>;
    totalCrewHours += crew.reduce((s: number, c: { headcount: number; hours: number }) =>
      s + (c.headcount || 0) * (c.hours || 0), 0);

    if (log.weather?.impact && log.weather.impact !== "none") weatherImpactDays++;

    const codes = (log.delay_codes || []) as string[];
    if (codes.length > 0) {
      totalDelayDays++;
      for (const c of codes) delayCodes[c] = (delayCodes[c] || 0) + 1;
    }
    totalLostHours += log.lost_crew_hours || 0;
  }

  const recurringDelayCodes = Object.entries(delayCodes)
    .sort((a, b) => b[1] - a[1])
    .map(([code, count]) => ({ code, count }));

  // Cumulative crew-hours (running total by date)
  let cumulative = 0;
  const cumulativeCrewHours = dailyTrend.map((d: { date: string; crewHours: number }) => {
    cumulative += d.crewHours;
    return { date: d.date, cumulative: Math.round(cumulative) };
  });

  const workDays = (logs || []).length;
  const avgDailyCrewSize = workDays > 0
    ? Math.round((dailyTrend.reduce((s: number, d: { headcount: number }) => s + d.headcount, 0) / workDays) * 10) / 10
    : 0;

  // Month-over-month comparison
  const prevMonthDate = new Date(firstDay + "T12:00:00Z");
  prevMonthDate.setUTCMonth(prevMonthDate.getUTCMonth() - 1);
  const prevMonthStr = prevMonthDate.toISOString().substring(0, 7);
  const { firstDay: prevFirst, lastDay: prevLast } = parseMonth(prevMonthStr);

  const { data: prevLogs } = await supabase
    .from("daily_logs")
    .select("id, crew, delay_codes, lost_crew_hours")
    .eq("project_id", id)
    .gte("log_date", prevFirst)
    .lte("log_date", prevLast);

  let monthOverMonth = null;
  if (prevLogs && prevLogs.length > 0) {
    let prevCrewHours = 0;
    let prevDelayDays = 0;
    for (const log of prevLogs) {
      const crew = (log.crew || []) as Array<{ headcount: number; hours: number }>;
      prevCrewHours += crew.reduce((s: number, c: { headcount: number; hours: number }) =>
        s + (c.headcount || 0) * (c.hours || 0), 0);
      if ((log.delay_codes || []).length > 0) prevDelayDays++;
    }

    // Completion rate from prev month progress
    const prevLogIds = prevLogs.map((l) => l.id).filter(Boolean);
    let prevCompleted = 0;
    if (prevLogIds.length > 0) {
      const { count } = await supabase
        .from("daily_log_progress")
        .select("id", { count: "exact", head: true })
        .in("daily_log_id", prevLogIds)
        .eq("pct_complete_after", 100);
      prevCompleted = count || 0;
    }
    const currentCompleted = progressEntries.filter(p => p.pct_complete_after === 100).length;

    monthOverMonth = {
      prevMonth: prevMonthStr,
      crewHoursDelta: Math.round(totalCrewHours - prevCrewHours),
      completionDelta: currentCompleted - prevCompleted,
      delayDayDelta: totalDelayDays - prevDelayDays,
    };
  }

  return NextResponse.json({
    month: monthParam,
    firstDay,
    lastDay,
    totalLogDays: workDays,
    totalCrewHours: Math.round(totalCrewHours),
    avgDailyCrewSize,
    dailyTrend,
    activityCompletionByWeek,
    recurringDelayCodes,
    weatherImpactDays,
    weatherImpactPercent: workDays > 0 ? Math.round((weatherImpactDays / workDays) * 100) : 0,
    totalDelayDays,
    totalLostHours,
    cumulativeCrewHours,
    monthOverMonth,
  });
}
