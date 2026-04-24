import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { getArizonaToday } from "@/lib/arizona-date";

// GET /api/projects/[id]/weekly-summary
// Returns structured JSON data for the weekly summary report.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getServiceClient();

  const todayStr = getArizonaToday();
  const today = new Date(todayStr + "T12:00:00");
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 7);
  const nextWeekEnd = new Date(today);
  nextWeekEnd.setDate(today.getDate() + 7);

  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split("T")[0];
  const nextWeekEndStr = nextWeekEnd.toISOString().split("T")[0];

  // Fetch all data in parallel
  const [
    { data: project, error: projError },
    { data: allActivities },
    { data: recentReports },
    { data: ackViews },
    { data: subs },
  ] = await Promise.all([
    supabase.from("daily_projects").select("*").eq("id", id).single(),

    supabase
      .from("parsed_activities")
      .select("id, activity_id, activity_name, start_date, finish_date, percent_complete, status, trade, milestone")
      .eq("project_id", id)
      .order("start_date", { ascending: true }),

    supabase
      .from("sub_progress_reports")
      .select(`
        id, report_date, submitted_by, manpower_count, total_hours,
        delay_reasons, notes, worked_on_activities, photo_urls, submitted_at, sub_id
      `)
      .eq("project_id", id)
      .gte("report_date", sevenDaysAgoStr)
      .lte("report_date", todayStr)
      .order("report_date", { ascending: false }),

    supabase
      .from("sub_schedule_views")
      .select("acknowledged, acknowledged_by, acknowledged_at, link_id")
      .eq("acknowledged", true),

    supabase
      .from("project_subs")
      .select("id, sub_name, trades")
      .eq("project_id", id),
  ]);

  if (projError || !project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const activities = allActivities ?? [];
  const reports = recentReports ?? [];

  // ── Schedule Stats ──────────────────────────────────────────────────────────
  const totalActivities = activities.length;
  const completeActivities = activities.filter(
    (a) => a.status === "complete" || a.percent_complete >= 100
  ).length;
  const inProgressActivities = activities.filter(
    (a) => a.status === "in_progress"
  ).length;
  const lateActivities = activities.filter(
    (a) =>
      a.status === "late" ||
      (a.finish_date &&
        a.finish_date < todayStr &&
        a.percent_complete < 100 &&
        a.status !== "complete")
  ).length;
  const overallPercent =
    totalActivities > 0
      ? Math.round((completeActivities / totalActivities) * 100)
      : 0;

  // ── Activities that moved this week (had progress reports) ─────────────────
  const reportedActivityIds = new Set<string>();
  for (const r of reports) {
    for (const wa of r.worked_on_activities ?? []) {
      reportedActivityIds.add(wa.activity_id);
    }
  }
  const activitiesMovedThisWeek = activities.filter((a) =>
    reportedActivityIds.has(a.id)
  );

  // ── Sub Activity Summary ────────────────────────────────────────────────────
  const subActivityMap: Record<
    string,
    {
      sub_name: string;
      report_count: number;
      total_manpower: number;
      total_hours: number;
      delays: string[];
      latest_report_date: string;
    }
  > = {};

  for (const report of reports) {
    const sub = (subs ?? []).find((s) => s.id === report.sub_id);
    const key = report.sub_id ?? "unknown";
    if (!subActivityMap[key]) {
      subActivityMap[key] = {
        sub_name: sub?.sub_name ?? "Unknown Sub",
        report_count: 0,
        total_manpower: 0,
        total_hours: 0,
        delays: [],
        latest_report_date: report.report_date,
      };
    }
    const entry = subActivityMap[key];
    entry.report_count += 1;
    entry.total_manpower += report.manpower_count ?? 0;
    entry.total_hours += report.total_hours ?? 0;
    if (report.delay_reasons?.length > 0) {
      entry.delays.push(...report.delay_reasons.filter((d: string) => d !== "None"));
    }
  }

  // ── Photos from reports this week ───────────────────────────────────────────
  const allPhotos: Array<{ url: string; submitted_by: string; report_date: string }> = [];
  for (const report of reports) {
    for (const url of report.photo_urls ?? []) {
      allPhotos.push({
        url,
        submitted_by: report.submitted_by,
        report_date: report.report_date,
      });
    }
  }

  // ── Upcoming: next week's key activities ────────────────────────────────────
  const upcomingActivities = activities
    .filter(
      (a) =>
        a.start_date &&
        a.start_date >= todayStr &&
        a.start_date <= nextWeekEndStr &&
        a.status !== "complete" &&
        a.percent_complete < 100
    )
    .slice(0, 5);

  // ── Health score from project ───────────────────────────────────────────────
  const healthScore: number = project.health_score ?? 0;

  // ── Date range label ────────────────────────────────────────────────────────
  const dateRange = `${sevenDaysAgo.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })} – ${today.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;

  // ── Executive Summary ───────────────────────────────────────────────────────
  let execSummary = `${project.name} is ${overallPercent}% complete overall`;
  if (reports.length > 0) {
    const subsReported = Object.keys(subActivityMap).length;
    execSummary += ` with ${subsReported} sub${subsReported !== 1 ? "s" : ""} reporting activity this week`;
  }
  if (lateActivities > 0) {
    execSummary += `. ${lateActivities} activit${lateActivities !== 1 ? "ies are" : "y is"} currently late`;
  }
  execSummary += ".";

  return NextResponse.json({
    project: {
      id: project.id,
      name: project.name,
      client_name: project.client_name,
      location: project.location,
      health_score: healthScore,
      target_finish_date: project.target_finish_date,
    },
    dateRange,
    weekStart: sevenDaysAgoStr,
    weekEnd: todayStr,
    execSummary,
    schedule: {
      totalActivities,
      completeActivities,
      inProgressActivities,
      lateActivities,
      overallPercent,
    },
    activitiesMovedThisWeek,
    subActivity: Object.values(subActivityMap),
    photos: allPhotos.slice(0, 20), // cap at 20 for performance
    upcoming: upcomingActivities,
    reportCount: reports.length,
  });
}
