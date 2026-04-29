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
  const targetKeys = new Set(
    [target.id, target.activity_id, target.external_task_id, target.external_unique_id]
      .filter((value): value is string => typeof value === "string" && value.length > 0)
      .map(normalizeScheduleLinkId)
  );

  const includesScheduleLink = (ids: string[] | null | undefined, activity: ParsedActivity) => {
    if (!ids?.length) return false;

    const activityKeys = [activity.id, activity.activity_id, activity.external_task_id, activity.external_unique_id]
      .filter((value): value is string => typeof value === "string" && value.length > 0)
      .map(normalizeScheduleLinkId);

    const idSet = new Set(ids.map(normalizeScheduleLinkId));
    return activityKeys.some((key) => idSet.has(key));
  };

  // Match against both `id` (UUID) and `activity_id` (string code)
  const predecessors = activities.filter(
    (a) => includesScheduleLink(predIds, a)
  );

  const storedSuccessors = activities.filter(
    (a) => includesScheduleLink(succIds, a)
  );

  // Derive successors from other activities' predecessor lists too. This repairs
  // older uploads and MPP/XER imports where successor_ids were empty or stored
  // with a different schedule ID flavor than the UI expects.
  const derivedSuccessors = activities.filter(
    (a) => (a.predecessor_ids || []).some((id) => targetKeys.has(normalizeScheduleLinkId(id)))
  );

  const successorMap = new Map<string, ParsedActivity>();
  for (const successor of [...storedSuccessors, ...derivedSuccessors]) {
    if (successor.id !== target.id) successorMap.set(successor.id, successor);
  }
  const successors = Array.from(successorMap.values());

  return NextResponse.json({ predecessors, successors });
}

function normalizeScheduleLinkId(value: string): string {
  return value
    .replace(/\s*(FS|FF|SS|SF)\s*([+-][^,;|]*)?$/i, "")
    .trim()
    .toLowerCase();
}
