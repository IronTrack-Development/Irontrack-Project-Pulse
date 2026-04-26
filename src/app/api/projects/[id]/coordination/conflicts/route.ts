import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

// GET — auto-detect schedule conflicts for current week
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getServiceClient();
  const url = new URL(req.url);

  // Default to current week, allow override
  const now = new Date();
  const weekStart = url.searchParams.get("start") || (() => {
    const d = new Date(now);
    d.setDate(d.getDate() - d.getDay() + 1); // Monday
    return d.toISOString().split("T")[0];
  })();
  const weekEnd = url.searchParams.get("end") || (() => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 6); // Sunday
    return d.toISOString().split("T")[0];
  })();

  // Get activities for this week that have trade and area info
  const { data: activities, error } = await supabase
    .from("parsed_activities")
    .select("id, activity_name, trade, normalized_area, normalized_building, start_date, finish_date")
    .eq("project_id", id)
    .lte("start_date", weekEnd)
    .gte("finish_date", weekStart)
    .not("trade", "is", null);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!activities || activities.length === 0) {
    return NextResponse.json({ conflicts: [], count: 0 });
  }

  // Find overlapping activities with different trades in same area
  const conflicts: any[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < activities.length; i++) {
    for (let j = i + 1; j < activities.length; j++) {
      const a = activities[i];
      const b = activities[j];

      // Different trades
      if (a.trade === b.trade) continue;

      // Same area or building
      const sameArea = a.normalized_area && b.normalized_area && a.normalized_area === b.normalized_area;
      const sameBuilding = a.normalized_building && b.normalized_building && a.normalized_building === b.normalized_building;
      if (!sameArea && !sameBuilding) continue;

      // Date overlap
      const aStart = new Date(a.start_date);
      const aEnd = new Date(a.finish_date);
      const bStart = new Date(b.start_date);
      const bEnd = new Date(b.finish_date);

      if (aStart > bEnd || bStart > aEnd) continue;

      const overlapStart = aStart > bStart ? a.start_date : b.start_date;
      const overlapEnd = aEnd < bEnd ? a.finish_date : b.finish_date;

      // De-duplicate
      const key = [a.id, b.id].sort().join("-");
      if (seen.has(key)) continue;
      seen.add(key);

      conflicts.push({
        activity_a: {
          id: a.id,
          name: a.activity_name,
          trade: a.trade,
          area: a.normalized_area || a.normalized_building,
          start: a.start_date,
          finish: a.finish_date,
        },
        activity_b: {
          id: b.id,
          name: b.activity_name,
          trade: b.trade,
          area: b.normalized_area || b.normalized_building,
          start: b.start_date,
          finish: b.finish_date,
        },
        overlap_start: overlapStart,
        overlap_end: overlapEnd,
        conflict_type: sameArea ? "same_area" : "same_trade_area",
      });
    }
  }

  return NextResponse.json({ conflicts, count: conflicts.length });
}
