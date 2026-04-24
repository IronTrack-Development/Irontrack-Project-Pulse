import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { resolveClientDate } from "@/lib/arizona-date";

interface Activity {
  id: string;
  activity_name: string;
  start_date: string;
  finish_date: string;
  percent_complete: number | null;
  trade: string | null;
}

function isInspection(activityName: string): boolean {
  const lower = activityName.toLowerCase();
  const patterns = [
    "inspect",
    "inspection",
    "test",
    "testing",
    "walkthrough",
    "walk-through",
    "punch",
    "punchlist",
    "final",
    "certificate",
    "cob",
    "3rd party",
    "third party",
    "code compliance",
    "fire marshal",
  ];
  return patterns.some((p) => lower.includes(p));
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const { searchParams } = new URL(req.url);
  const day = searchParams.get("day") || "today";
  const clientDate = searchParams.get("clientDate"); // YYYY-MM-DD from client's timezone

  const supabase = getServiceClient();

  // Use client's date if provided, otherwise fall back to Arizona timezone
  const resolvedDate = resolveClientDate(clientDate);
  let targetDate = new Date(resolvedDate + "T12:00:00"); // noon to avoid timezone edge cases
  if (day === "tomorrow") {
    targetDate.setDate(targetDate.getDate() + 1);
  }
  const targetDateStr = targetDate.toISOString().split("T")[0];

  // Calculate next day for preview
  const nextDate = new Date(targetDate);
  nextDate.setDate(targetDate.getDate() + 1);
  const nextDateStr = nextDate.toISOString().split("T")[0];

  // Query activities for target date
  const { data: activities, error } = await supabase
    .from("parsed_activities")
    .select("id, activity_name, start_date, finish_date, percent_complete, trade")
    .eq("project_id", projectId)
    .lte("start_date", targetDateStr)
    .gte("finish_date", targetDateStr)
    .order("percent_complete", { ascending: true })
    .order("activity_name", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const allActivities = (activities || []) as Activity[];

  // Separate inspections and active tasks
  const inspections = allActivities.filter((a) => isInspection(a.activity_name)).slice(0, 5);
  const activeTasks = allActivities.filter((a) => !isInspection(a.activity_name)).slice(0, 10);

  // Get preview count for next day
  const { data: nextDayActivities } = await supabase
    .from("parsed_activities")
    .select("id, activity_name")
    .eq("project_id", projectId)
    .lte("start_date", nextDateStr)
    .gte("finish_date", nextDateStr);

  const nextAll = (nextDayActivities || []) as { id: string; activity_name: string }[];
  const nextInspectionCount = nextAll.filter((a) => isInspection(a.activity_name)).length;
  const nextActivityCount = nextAll.length;

  return NextResponse.json({
    date: targetDateStr,
    inspections,
    activeTasks,
    totalActivities: allActivities.length,
    previewNext: {
      date: nextDateStr,
      activityCount: nextActivityCount,
      inspectionCount: nextInspectionCount,
    },
  });
}
