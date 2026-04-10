import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

function getWeekRange(weekNumber: number): { start: string; end: string } {
  const now = new Date();
  const currentDay = now.getDay();
  const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1;
  
  const currentMonday = new Date(now);
  currentMonday.setDate(now.getDate() - daysFromMonday);
  currentMonday.setHours(0, 0, 0, 0);
  
  const targetMonday = new Date(currentMonday);
  targetMonday.setDate(currentMonday.getDate() + (weekNumber - 1) * 7);
  
  const targetSunday = new Date(targetMonday);
  targetSunday.setDate(targetMonday.getDate() + 6);
  
  return { 
    start: targetMonday.toISOString().split("T")[0], 
    end: targetSunday.toISOString().split("T")[0] 
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const { searchParams } = new URL(request.url);
    const weekParam = searchParams.get("week");
    const week = weekParam ? parseInt(weekParam, 10) : 1;

    if (![1, 2, 3].includes(week)) {
      return NextResponse.json({ error: "Week must be 1, 2, or 3" }, { status: 400 });
    }

    const supabase = getServiceClient();
    const { start, end } = getWeekRange(week);

    // Get activities that overlap with this week window
    // An activity overlaps if: start_date <= end AND finish_date >= start
    const { data: activities, error } = await supabase
      .from("parsed_activities")
      .select("*")
      .eq("project_id", projectId)
      .lte("start_date", end)
      .gte("finish_date", start)
      .order("start_date", { ascending: true });

    if (error) throw error;

    // Group activities by day (use start_date as the grouping key)
    const grouped: Record<string, typeof activities> = {};
    activities?.forEach((activity) => {
      const dayKey = activity.start_date || activity.finish_date;
      if (dayKey) {
        const key = dayKey.split("T")[0];
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(activity);
      }
    });

    return NextResponse.json({
      week,
      weekStart: start,
      weekEnd: end,
      activities: activities || [],
      groupedByDay: grouped,
    });
  } catch (error: unknown) {
    console.error("Week API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch week data" },
      { status: 500 }
    );
  }
}
