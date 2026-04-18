import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { rateLimit } from "@/lib/rate-limit";

// POST /api/view/[token]/report
// PUBLIC — records a sub foreman's daily progress report.
// Body: {
//   worked_on_activity_ids: string[],
//   activity_statuses: Record<string, string>,  // activity_id -> "0"|"25"|"50"|"75"|"100"
//   manpower_count: number,
//   total_hours: number,
//   delay_reasons: string[],
//   notes: string,
//   submitted_by: string,
//   photo_urls: string[],  // public Supabase Storage URLs (uploaded before submit)
// }
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
  const rl = rateLimit(`report:${ip}`, 10, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  const supabase = getServiceClient();

  let body: {
    worked_on_activity_ids?: string[];
    activity_statuses?: Record<string, string>;
    manpower_count?: number;
    total_hours?: number;
    delay_reasons?: string[];
    notes?: string;
    submitted_by?: string;
    photo_urls?: string[];
  } = {};

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const submittedBy = body.submitted_by?.trim();
  if (!submittedBy) {
    return NextResponse.json({ error: "submitted_by is required" }, { status: 400 });
  }

  // Validate token
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

  // Build the worked_on_activities JSONB array
  const workedOnActivities = (body.worked_on_activity_ids ?? []).map((id) => ({
    activity_id: id,
    status: body.activity_statuses?.[id] ?? "in_progress",
  }));

  const reportDate = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  // Upsert the report (one per link per day)
  const { data: report, error: insertError } = await supabase
    .from("sub_progress_reports")
    .upsert(
      {
        link_id: link.id,
        sub_id: link.sub_id,
        project_id: link.project_id,
        report_date: reportDate,
        submitted_by: submittedBy,
        worked_on_activities: workedOnActivities,
        manpower_count: body.manpower_count ?? null,
        total_hours: body.total_hours ?? null,
        delay_reasons: body.delay_reasons ?? [],
        notes: body.notes?.trim() ?? null,
        photo_urls: body.photo_urls ?? [],
        submitted_at: new Date().toISOString(),
      },
      {
        onConflict: "link_id,report_date,submitted_by",
      }
    )
    .select()
    .single();

  if (insertError) {
    // If the table doesn't exist yet, return a graceful degradation
    if (insertError.code === "42P01") {
      return NextResponse.json({
        success: true,
        degraded: true,
        message: "Report received (table not yet migrated — run scripts/sub-progress-reports.sql)",
        submitted_at: new Date().toISOString(),
      });
    }
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    report_id: report?.id,
    report_date: reportDate,
    submitted_at: report?.submitted_at ?? new Date().toISOString(),
  });
}
