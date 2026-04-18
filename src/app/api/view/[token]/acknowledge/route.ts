import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { rateLimit } from "@/lib/rate-limit";
import { createNotification } from "@/lib/notifications-store";

// POST /api/view/[token]/acknowledge
// PUBLIC — records a sub's acknowledgment of a schedule.
// Body: { view_id: string, acknowledged_by: string }
// view_id is returned from GET /api/view/[token] on first load.
// If view_id is missing or stale, we create a new view record.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  // Rate limiting: 10 requests per minute per IP
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";
  const rl = rateLimit(`acknowledge:${ip}`, 10, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  const supabase = getServiceClient();

  let body: { view_id?: string; acknowledged_by?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const acknowledgedBy = body.acknowledged_by?.trim();
  if (!acknowledgedBy) {
    return NextResponse.json({ error: "acknowledged_by name is required" }, { status: 400 });
  }

  // Validate the token is still active
  const { data: link, error: linkError } = await supabase
    .from("sub_share_links")
    .select("id, project_id, sub_id, active, expires_at")
    .eq("token", token)
    .single();

  if (linkError || !link) {
    return NextResponse.json({ error: "Invalid link" }, { status: 404 });
  }

  if (!link.active) {
    return NextResponse.json({ error: "This link has been deactivated" }, { status: 410 });
  }

  if (link.expires_at && new Date(link.expires_at) < new Date()) {
    return NextResponse.json({ error: "This link has expired" }, { status: 410 });
  }

  const acknowledgedAt = new Date().toISOString();

  // Update existing view record if view_id supplied, otherwise create a new one
  if (body.view_id) {
    const { data: existing } = await supabase
      .from("sub_schedule_views")
      .select("id, link_id, acknowledged")
      .eq("id", body.view_id)
      .eq("link_id", link.id)
      .single();

    if (existing) {
      // Update existing view record
      const { data: updated, error: updateError } = await supabase
        .from("sub_schedule_views")
        .update({
          acknowledged: true,
          acknowledged_by: acknowledgedBy,
          acknowledged_at: acknowledgedAt,
        })
        .eq("id", existing.id)
        .select()
        .single();

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      // Fire-and-forget: notify the project owner
      void (async () => {
        try {
          const sc = getServiceClient();
          const [{ data: project }, { data: sub }] = await Promise.all([
            sc.from("daily_projects").select("user_id, name").eq("id", link.project_id).single(),
            sc.from("project_subs").select("sub_name").eq("id", link.sub_id).single(),
          ]);
          if (project?.user_id) {
            await createNotification(
              project.user_id,
              "ack_received",
              "Schedule Acknowledged",
              `${sub?.sub_name ?? acknowledgedBy} acknowledged the schedule for ${project.name}`,
              { project_id: link.project_id, sub_id: link.sub_id, acknowledged_by: acknowledgedBy }
            );
          }
        } catch { /* best-effort */ }
      })();

      return NextResponse.json({
        success: true,
        acknowledged_by: acknowledgedBy,
        acknowledged_at: acknowledgedAt,
        view_id: updated?.id,
      });
    }
  }

  // No valid view_id — insert a new record directly as acknowledged
  const viewerIp =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    null;
  const userAgent = req.headers.get("user-agent") ?? null;

  const { data: newView, error: insertError } = await supabase
    .from("sub_schedule_views")
    .insert({
      link_id: link.id,
      viewer_ip: viewerIp,
      user_agent: userAgent,
      acknowledged: true,
      acknowledged_by: acknowledgedBy,
      acknowledged_at: acknowledgedAt,
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  // Fire-and-forget: notify the project owner
  void (async () => {
    try {
      const sc = getServiceClient();
      const [{ data: project }, { data: sub }] = await Promise.all([
        sc.from("daily_projects").select("user_id, name").eq("id", link.project_id).single(),
        sc.from("project_subs").select("sub_name").eq("id", link.sub_id).single(),
      ]);
      if (project?.user_id) {
        await createNotification(
          project.user_id,
          "ack_received",
          "Schedule Acknowledged",
          `${sub?.sub_name ?? acknowledgedBy} acknowledged the schedule for ${project.name}`,
          { project_id: link.project_id, sub_id: link.sub_id, acknowledged_by: acknowledgedBy }
        );
      }
    } catch { /* best-effort */ }
  })();

  return NextResponse.json({
    success: true,
    acknowledged_by: acknowledgedBy,
    acknowledged_at: acknowledgedAt,
    view_id: newView?.id,
  });
}
