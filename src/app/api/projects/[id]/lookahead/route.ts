import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { getArizonaToday } from "@/lib/arizona-date";
import type { LookaheadGroup } from "@/types";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getServiceClient();

  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get("days") || "14");

  const todayStr = getArizonaToday();
  const today = new Date(todayStr + "T12:00:00Z");
  today.setHours(0, 0, 0, 0);

  const endDate = new Date(todayStr + "T12:00:00");
  endDate.setDate(endDate.getDate() + days);

  const endStr = endDate.toISOString().split("T")[0];

  const { data: activities, error } = await supabase
    .from("parsed_activities")
    .select("*")
    .eq("project_id", id)
    .or(
      `and(start_date.gte.${todayStr},start_date.lte.${endStr}),and(finish_date.gte.${todayStr},finish_date.lte.${endStr}),and(start_date.lte.${todayStr},finish_date.gte.${todayStr})`
    )
    .order("start_date");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Group by week, then by trade
  const groups: LookaheadGroup[] = [];
  const weekStarts: Date[] = [];

  let weekStart = new Date(today);
  while (weekStart < endDate) {
    weekStarts.push(new Date(weekStart));
    weekStart.setDate(weekStart.getDate() + 7);
  }

  for (const ws of weekStarts) {
    const we = new Date(ws);
    we.setDate(we.getDate() + 6);

    const weekActivities = (activities || []).filter((a) => {
      if (!a.start_date && !a.finish_date) return false;
      const start = a.start_date ? new Date(a.start_date) : null;
      const finish = a.finish_date ? new Date(a.finish_date) : null;
      return (
        (start && start >= ws && start <= we) ||
        (finish && finish >= ws && finish <= we) ||
        (start && finish && start <= ws && finish >= we)
      );
    });

    const tradeMap = new Map<string, typeof weekActivities>();
    for (const a of weekActivities) {
      const trade = a.trade || "General";
      if (!tradeMap.has(trade)) tradeMap.set(trade, []);
      tradeMap.get(trade)!.push(a);
    }

    const trades = Array.from(tradeMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([trade, acts]) => ({ trade, activities: acts }));

    const weekLabel = `${ws.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${we.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;

    groups.push({
      weekLabel,
      weekStart: ws.toISOString().split("T")[0],
      weekEnd: we.toISOString().split("T")[0],
      trades,
    });
  }

  // ── Reality-adjusted flags from daily log progress ──
  // Get recent daily logs to pull progress data
  const { data: recentLogs } = await supabase
    .from("daily_logs")
    .select("id, log_date")
    .eq("project_id", id)
    .in("status", ["submitted", "locked"])
    .order("log_date", { ascending: false })
    .limit(10);

  interface TradeFlag {
    trade: string;
    behindPercent: number;
    message: string;
  }
  const tradeFlags: TradeFlag[] = [];

  if (recentLogs && recentLogs.length > 0) {
    const logIds = recentLogs.map((l) => l.id);
    const logDateMap = new Map(recentLogs.map((l) => [l.id, l.log_date]));

    const { data: progressEntries } = await supabase
      .from("daily_log_progress")
      .select("daily_log_id, activity_id, pct_complete_before, pct_complete_after")
      .in("daily_log_id", logIds);

    if (progressEntries && progressEntries.length > 0) {
      // Get activity trade info
      const activityIds = [...new Set(progressEntries.filter(p => p.activity_id).map(p => p.activity_id!))];
      const { data: activityData } = await supabase
        .from("parsed_activities")
        .select("id, trade, percent_complete, original_duration, remaining_duration")
        .in("id", activityIds);

      const activityMap = new Map((activityData || []).map(a => [a.id, a]));

      // Group progress entries by trade, take last 5 per trade
      const tradeEntries = new Map<string, { pctBefore: number; pctAfter: number; logDate: string }[]>();
      for (const p of progressEntries) {
        if (!p.activity_id) continue;
        const act = activityMap.get(p.activity_id);
        if (!act || !act.trade) continue;
        if (!tradeEntries.has(act.trade)) tradeEntries.set(act.trade, []);
        tradeEntries.get(act.trade)!.push({
          pctBefore: Number(p.pct_complete_before) || 0,
          pctAfter: Number(p.pct_complete_after) || 0,
          logDate: logDateMap.get(p.daily_log_id) || "",
        });
      }

      for (const [trade, entries] of tradeEntries) {
        // Sort by date descending, take last 5
        const sorted = entries.sort((a, b) => b.logDate.localeCompare(a.logDate)).slice(0, 5);
        if (sorted.length < 2) continue;

        // Calculate average daily progress rate
        const avgDelta = sorted.reduce((s, e) => s + (e.pctAfter - e.pctBefore), 0) / sorted.length;

        // Compare to expected rate: for active activities in this trade, what's the planned daily rate?
        const tradeActivities = (activityData || []).filter(
          a => a.trade === trade && (a.remaining_duration || 0) > 0
        );
        if (tradeActivities.length === 0) continue;

        // Average expected daily progress across trade activities
        const avgExpectedDaily = tradeActivities.reduce((s, a) => {
          const remaining = 100 - (a.percent_complete || 0);
          const days = a.remaining_duration || 1;
          return s + (remaining / days);
        }, 0) / tradeActivities.length;

        if (avgExpectedDaily <= 0) continue;

        const ratio = avgDelta / avgExpectedDaily;
        const behindPercent = Math.round((1 - ratio) * 100);

        if (behindPercent >= 20) {
          tradeFlags.push({
            trade,
            behindPercent,
            message: `\u26A0\uFE0F ${trade} trending ${behindPercent}% behind plan based on last ${sorted.length} logs \u2014 consider rebaselining`,
          });
        }
      }
    }
  }

  return NextResponse.json({ days, groups, tradeFlags });
}
