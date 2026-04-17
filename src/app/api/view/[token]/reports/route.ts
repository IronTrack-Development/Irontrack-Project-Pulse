import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { rateLimit } from "@/lib/rate-limit";

// GET /api/view/[token]/reports
// PUBLIC — returns past progress reports submitted through this share link.
// Validates the token the same way as other view routes.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  // Rate limiting: 30 requests per minute per IP
  const ip =
    _req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    _req.headers.get("x-real-ip") ??
    "unknown";
  const rl = rateLimit(`view-reports:${ip}`, 30, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  const supabase = getServiceClient();

  // 1. Validate token
  const { data: link, error: linkError } = await supabase
    .from("sub_share_links")
    .select("id, project_id, sub_id, active, expires_at")
    .eq("token", token)
    .single();

  if (linkError || !link) {
    return NextResponse.json({ error: "Invalid or expired link" }, { status: 404 });
  }

  if (!link.active) {
    return NextResponse.json({ error: "This link has been deactivated" }, { status: 410 });
  }

  if (link.expires_at && new Date(link.expires_at) < new Date()) {
    return NextResponse.json({ error: "This link has expired" }, { status: 410 });
  }

  // 2. Fetch reports for this link, most recent first, limit 30
  const { data: reports, error: reportsError } = await supabase
    .from("sub_progress_reports")
    .select(
      "id, report_date, submitted_by, manpower_count, total_hours, delay_reasons, notes, worked_on_activities, submitted_at"
    )
    .eq("link_id", link.id)
    .order("report_date", { ascending: false })
    .limit(30);

  if (reportsError) {
    // Graceful degradation if table doesn't exist yet
    if (reportsError.code === "42P01") {
      return NextResponse.json([]);
    }
    return NextResponse.json({ error: reportsError.message }, { status: 500 });
  }

  return NextResponse.json(reports ?? []);
}
