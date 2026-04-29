import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { rateLimit } from "@/lib/rate-limit";

// GET /api/join/[projectId]/status?sub_id=xxx&token=xxx
// Checks whether the GC has assigned activity_ids to this sub yet.
// Used by the waiting screen to poll for task assignment.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const { searchParams } = new URL(req.url);
  const subId = searchParams.get("sub_id");
  const token = searchParams.get("token");

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";
  const rl = rateLimit(`join-status:${ip}`, 30, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  if (!subId) {
    return NextResponse.json({ error: "sub_id is required" }, { status: 400 });
  }
  if (!token) {
    return NextResponse.json({ error: "token is required" }, { status: 400 });
  }

  const supabase = getServiceClient();

  const { data: link, error: linkError } = await supabase
    .from("sub_share_links")
    .select("id, token, active, expires_at")
    .eq("token", token)
    .eq("sub_id", subId)
    .eq("project_id", projectId)
    .eq("active", true)
    .maybeSingle();

  if (linkError || !link) {
    return NextResponse.json({ error: "Invalid or expired link" }, { status: 404 });
  }

  if (link.expires_at && new Date(link.expires_at) < new Date()) {
    return NextResponse.json({ error: "This link has expired" }, { status: 410 });
  }

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
  let responseToken: string | null = null;
  if (hasActivities) {
    responseToken = link.token;
  }

  return NextResponse.json({
    has_activities: hasActivities,
    activity_count: activityIds.length,
    token: responseToken,
  });
}
