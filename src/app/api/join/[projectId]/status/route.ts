import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

// GET /api/join/[projectId]/status?sub_id=xxx
// Checks whether the GC has assigned activity_ids to this sub yet.
// Used by the waiting screen to poll for task assignment.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const { searchParams } = new URL(req.url);
  const subId = searchParams.get("sub_id");

  if (!subId) {
    return NextResponse.json({ error: "sub_id is required" }, { status: 400 });
  }

  const supabase = getServiceClient();

  // Get the sub record
  const { data: sub, error: subError } = await supabase
    .from("project_subs")
    .select("id, activity_ids")
    .eq("id", subId)
    .eq("project_id", projectId)
    .single();

  if (subError || !sub) {
    return NextResponse.json({ error: "Sub not found" }, { status: 404 });
  }

  const activityIds: string[] = Array.isArray(sub.activity_ids)
    ? sub.activity_ids
    : [];
  const hasActivities = activityIds.length > 0;

  // If activities are assigned, find the latest active share link token
  let token: string | null = null;
  if (hasActivities) {
    const { data: link } = await supabase
      .from("sub_share_links")
      .select("token")
      .eq("sub_id", subId)
      .eq("active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    token = link?.token ?? null;
  }

  return NextResponse.json({
    has_activities: hasActivities,
    activity_count: activityIds.length,
    token,
  });
}
