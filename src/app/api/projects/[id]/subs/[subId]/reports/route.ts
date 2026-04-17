import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

// GET /api/projects/[id]/subs/[subId]/reports
// Returns the latest progress reports submitted by foremen for a sub on a project.
// GC-side only — requires project access. Uses service client for simplicity.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; subId: string }> }
) {
  const { id: projectId, subId } = await params;
  const supabase = getServiceClient();

  // Verify project exists
  const { data: project } = await supabase
    .from("daily_projects")
    .select("id")
    .eq("id", projectId)
    .single();

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // Fetch reports for this sub+project, most recent first
  const { data: reports, error } = await supabase
    .from("sub_progress_reports")
    .select(
      "id, report_date, submitted_by, manpower_count, total_hours, delay_reasons, notes, worked_on_activities, submitted_at, photo_urls"
    )
    .eq("sub_id", subId)
    .eq("project_id", projectId)
    .order("report_date", { ascending: false })
    .limit(10);

  if (error) {
    // Graceful degradation if table not yet migrated
    if (error.code === "42P01") return NextResponse.json([]);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!reports || reports.length === 0) {
    return NextResponse.json([]);
  }

  // Resolve activity names from worked_on_activities JSONB
  // Each entry looks like: { activity_id: "<uuid>", status: "50" }
  const activityIds = new Set<string>();
  for (const report of reports) {
    const activities = report.worked_on_activities ?? [];
    for (const wa of activities) {
      if (wa?.activity_id) activityIds.add(wa.activity_id);
    }
  }

  const nameMap = new Map<string, string>();
  if (activityIds.size > 0) {
    const { data: activities } = await supabase
      .from("parsed_activities")
      .select("id, activity_name")
      .in("id", [...activityIds]);

    if (activities) {
      for (const a of activities) {
        nameMap.set(a.id, a.activity_name);
      }
    }
  }

  // Enrich reports with resolved activity names
  const enriched = reports.map((report) => ({
    ...report,
    worked_on_activities: (report.worked_on_activities ?? []).map(
      (wa: { activity_id: string; status: string }) => ({
        ...wa,
        activity_name: nameMap.get(wa.activity_id) ?? "Unknown Activity",
      })
    ),
  }));

  return NextResponse.json(enriched);
}
