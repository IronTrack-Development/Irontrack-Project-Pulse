import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import type { ParsedActivity } from "@/types";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const activityId = searchParams.get("activityId");

  if (!activityId) {
    return NextResponse.json({ error: "activityId query param is required" }, { status: 400 });
  }

  const supabase = getServiceClient();

  // Fetch all activities for this project
  const { data: allActivities, error } = await supabase
    .from("parsed_activities")
    .select("*")
    .eq("project_id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const activities: ParsedActivity[] = allActivities || [];

  // Find the target activity by UUID id or activity_id string
  const target = activities.find(
    (a) => a.id === activityId || a.activity_id === activityId
  );

  if (!target) {
    return NextResponse.json({ predecessors: [], successors: [] });
  }

  const predIds: string[] = target.predecessor_ids || [];
  const succIds: string[] = target.successor_ids || [];

  // Match against both `id` (UUID) and `activity_id` (string code)
  const predecessors = activities.filter(
    (a) =>
      predIds.includes(a.id) ||
      (a.activity_id != null && predIds.includes(a.activity_id))
  );

  const successors = activities.filter(
    (a) =>
      succIds.includes(a.id) ||
      (a.activity_id != null && succIds.includes(a.activity_id))
  );

  return NextResponse.json({ predecessors, successors });
}
