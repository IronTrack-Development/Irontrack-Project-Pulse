import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { resolveClientDate } from "@/lib/arizona-date";
import type { DailyLog, DailyLogProgress } from "@/types";

interface YesterdayRecap {
  logDate: string;
  dateLabel: string;
  totalWorkers: number;
  totalCrewHours: number;
  weather: { conditions: string[]; high?: number; low?: number; impact: string };
  activitiesAdvanced: number;
  activitiesCompleted: number;
  delayCodes: string[];
  lostCrewHours: number;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getServiceClient();

  const { searchParams } = new URL(_req.url);
  const clientDate = searchParams.get("clientDate"); // YYYY-MM-DD from client's timezone

  const todayStr = resolveClientDate(clientDate);
  const today = new Date(todayStr + "T12:00:00");
  today.setHours(0, 0, 0, 0);

  const threeDaysAgo = new Date(today);
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  const threeDaysAgoStr = threeDaysAgo.toISOString().split("T")[0];

  const threeDaysFromNow = new Date(today);
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
  const threeDaysFromNowStr = threeDaysFromNow.toISOString().split("T")[0];

  const [
    { data: happeningToday },
    { data: recentStarts },
    { data: finishingSoon },
    { data: atRisk },
    { data: risks },
  ] = await Promise.all([
    supabase
      .from("parsed_activities")
      .select("*")
      .eq("project_id", id)
      .lte("start_date", todayStr)
      .gte("finish_date", todayStr)
      .neq("status", "complete")
      .order("trade"),
    supabase
      .from("parsed_activities")
      .select("*")
      .eq("project_id", id)
      .gte("actual_start", threeDaysAgoStr)
      .lte("actual_start", todayStr)
      .order("actual_start", { ascending: false }),
    supabase
      .from("parsed_activities")
      .select("*")
      .eq("project_id", id)
      .gte("finish_date", todayStr)
      .lte("finish_date", threeDaysFromNowStr)
      .neq("status", "complete")
      .order("finish_date"),
    supabase
      .from("parsed_activities")
      .select("*")
      .eq("project_id", id)
      .eq("status", "late"),
    supabase
      .from("daily_risks")
      .select("*")
      .eq("project_id", id)
      .eq("status", "open")
      .in("severity", ["high", "medium"])
      .order("severity"),
  ]);

  // Fetch most recent daily log (yesterday or earlier)
  const { data: recentLog } = await supabase
    .from("daily_logs")
    .select("*")
    .eq("project_id", id)
    .lt("log_date", todayStr)
    .in("status", ["submitted", "locked"])
    .order("log_date", { ascending: false })
    .limit(1)
    .single();

  let yesterdayRecap: YesterdayRecap | null = null;

  if (recentLog) {
    const log = recentLog as DailyLog;
    const crew = (log.crew || []) as { trade: string; company: string; headcount: number; hours: number }[];
    const totalWorkers = crew.reduce((s, c) => s + (c.headcount || 0), 0);
    const totalCrewHours = crew.reduce((s, c) => s + (c.hours || 0), 0);
    const weather = (log.weather || {}) as { conditions?: string[]; high?: number; low?: number; impact?: string };

    // Get progress entries for this log
    const { data: progressEntries } = await supabase
      .from("daily_log_progress")
      .select("pct_complete_before, pct_complete_after")
      .eq("daily_log_id", log.id);

    const advanced = (progressEntries || []).filter(
      (p) => (p.pct_complete_after || 0) > (p.pct_complete_before || 0)
    ).length;
    const completed = (progressEntries || []).filter(
      (p) => (p.pct_complete_after || 0) >= 100 && (p.pct_complete_before || 0) < 100
    ).length;

    const logDate = new Date(log.log_date + "T12:00:00");
    const dateLabel = logDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });

    yesterdayRecap = {
      logDate: log.log_date,
      dateLabel,
      totalWorkers,
      totalCrewHours,
      weather: {
        conditions: weather.conditions || [],
        high: weather.high,
        low: weather.low,
        impact: weather.impact || "none",
      },
      activitiesAdvanced: advanced,
      activitiesCompleted: completed,
      delayCodes: log.delay_codes || [],
      lostCrewHours: Number(log.lost_crew_hours) || 0,
    };
  }

  return NextResponse.json({
    date: todayStr,
    happeningToday: happeningToday || [],
    recentStarts: recentStarts || [],
    finishingSoon: finishingSoon || [],
    atRisk: atRisk || [],
    actionItems: (risks || []).map((r) => r.suggested_action).filter(Boolean),
    risks: risks || [],
    yesterdayRecap,
  });
}
