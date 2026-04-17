import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

// GET /api/projects/[id]/sub-status
// Returns acknowledgment dashboard: for each sub, their latest link status and ack state
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const supabase = getServiceClient();

  // Verify project exists
  const { data: project, error: projError } = await supabase
    .from("daily_projects")
    .select("id, name, updated_at")
    .eq("id", projectId)
    .single();

  if (projError || !project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // Fetch all subs for this project
  const { data: subs, error: subsError } = await supabase
    .from("project_subs")
    .select("id, sub_name, contact_name, contact_phone, contact_email, trades")
    .eq("project_id", projectId)
    .order("sub_name");

  if (subsError) {
    return NextResponse.json({ error: subsError.message }, { status: 500 });
  }

  if (!subs || subs.length === 0) {
    return NextResponse.json({ project, subs: [] });
  }

  const subIds = subs.map((s) => s.id);

  // Fetch all active share links for these subs
  const { data: links } = await supabase
    .from("sub_share_links")
    .select("id, sub_id, token, created_at, expires_at, active, label")
    .in("sub_id", subIds)
    .order("created_at", { ascending: false });

  const allLinks = links ?? [];

  // Fetch all views/acks for these links
  const linkIds = allLinks.map((l) => l.id);
  let allViews: Array<{
    id: string;
    link_id: string;
    viewed_at: string;
    acknowledged: boolean;
    acknowledged_by: string | null;
    acknowledged_at: string | null;
  }> = [];

  if (linkIds.length > 0) {
    const { data: views } = await supabase
      .from("sub_schedule_views")
      .select("id, link_id, viewed_at, acknowledged, acknowledged_by, acknowledged_at")
      .in("link_id", linkIds)
      .order("viewed_at", { ascending: false });

    allViews = views ?? [];
  }

  // Build per-sub status summary
  const subsWithStatus = subs.map((sub) => {
    // Most recent active link for this sub
    const subLinks = allLinks.filter((l) => l.sub_id === sub.id);
    const activeLinks = subLinks.filter((l) => l.active);
    const latestActiveLink = activeLinks[0] ?? null;

    // Views for this sub's links
    const subLinkIds = subLinks.map((l) => l.id);
    const subViews = allViews.filter((v) => subLinkIds.includes(v.link_id));

    const totalViews = subViews.length;
    const firstView = subViews[subViews.length - 1] ?? null; // oldest = first view
    const latestView = subViews[0] ?? null; // newest

    const ackRecord = subViews.find((v) => v.acknowledged) ?? null;

    // Status logic:
    // 🔴 not_sent    — no active link exists
    // ⚠️  sent        — link sent but never opened
    // 👁  viewed      — opened but not acknowledged
    // ✅  acknowledged — ack recorded
    let status: "not_sent" | "sent" | "viewed" | "acknowledged";
    if (!latestActiveLink) {
      status = "not_sent";
    } else if (totalViews === 0) {
      status = "sent";
    } else if (!ackRecord) {
      status = "viewed";
    } else {
      status = "acknowledged";
    }

    return {
      id: sub.id,
      sub_name: sub.sub_name,
      contact_name: sub.contact_name,
      contact_phone: sub.contact_phone,
      contact_email: sub.contact_email,
      trades: sub.trades,
      status,
      latest_active_link: latestActiveLink
        ? {
            id: latestActiveLink.id,
            token: latestActiveLink.token,
            label: latestActiveLink.label,
            created_at: latestActiveLink.created_at,
            expires_at: latestActiveLink.expires_at,
            share_url: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/view/${latestActiveLink.token}`,
          }
        : null,
      view_count: totalViews,
      first_viewed_at: firstView?.viewed_at ?? null,
      last_viewed_at: latestView?.viewed_at ?? null,
      acknowledged: !!ackRecord,
      acknowledged_by: ackRecord?.acknowledged_by ?? null,
      acknowledged_at: ackRecord?.acknowledged_at ?? null,
      all_links_count: subLinks.length,
    };
  });

  // Dashboard summary counts
  const summary = {
    total: subsWithStatus.length,
    not_sent: subsWithStatus.filter((s) => s.status === "not_sent").length,
    sent: subsWithStatus.filter((s) => s.status === "sent").length,
    viewed: subsWithStatus.filter((s) => s.status === "viewed").length,
    acknowledged: subsWithStatus.filter((s) => s.status === "acknowledged").length,
  };

  return NextResponse.json({
    project: {
      id: project.id,
      name: project.name,
      last_updated: project.updated_at,
    },
    summary,
    subs: subsWithStatus,
  });
}
