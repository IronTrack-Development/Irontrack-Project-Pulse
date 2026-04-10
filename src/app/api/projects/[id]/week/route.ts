import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

function getWeekRange(weekNumber: number): { start: Date; end: Date } {
  const now = new Date();
  const currentDay = now.getDay();
  const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1;
  
  // Get Monday of current week
  const currentMonday = new Date(now);
  currentMonday.setDate(now.getDate() - daysFromMonday);
  currentMonday.setHours(0, 0, 0, 0);
  
  // Calculate target Monday based on week number
  const targetMonday = new Date(currentMonday);
  targetMonday.setDate(currentMonday.getDate() + (weekNumber - 1) * 7);
  
  // Sunday is 6 days after Monday
  const targetSunday = new Date(targetMonday);
  targetSunday.setDate(targetMonday.getDate() + 6);
  targetSunday.setHours(23, 59, 59, 999);
  
  return { start: targetMonday, end: targetSunday };
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

    const supabase = await createClient();
    const { start, end } = getWeekRange(week);

    // Get activities where start_date OR finish_date falls within the week
    const { data: activities, error } = await supabase
      .from("activities")
      .select("*")
      .eq("project_id", projectId)
      .or(`start_date.gte.${start.toISOString()},start_date.lte.${end.toISOString()},finish_date.gte.${start.toISOString()},finish_date.lte.${end.toISOString()}`)
      .order("start_date", { ascending: true });

    if (error) throw error;

    // Group activities by day
    const grouped: Record<string, typeof activities> = {};
    activities?.forEach((activity) => {
      const activityDate = new Date(activity.start_date || activity.finish_date);
      if (activityDate >= start && activityDate <= end) {
        const dayKey = activityDate.toISOString().split("T")[0];
        if (!grouped[dayKey]) grouped[dayKey] = [];
        grouped[dayKey].push(activity);
      }
    });

    return NextResponse.json({
      week,
      weekStart: start.toISOString(),
      weekEnd: end.toISOString(),
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
