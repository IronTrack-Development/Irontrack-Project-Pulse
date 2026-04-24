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

  return NextResponse.json({ days, groups });
}
