import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { getServiceClient } from "@/lib/supabase";
import { normalizeCompanyName } from "@/lib/company-match";

// GET /api/sub/dashboard
// Requires auth. Returns the sub PM's projects, latest reports, and stats.
export async function GET() {
  // 1. Authenticate the user via session cookies
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const service = getServiceClient();

  // 2. Look up the user's sub_companies record
  const { data: company, error: companyError } = await service
    .from("sub_companies")
    .select("id, company_name, contact_name, contact_email")
    .eq("user_id", user.id)
    .maybeSingle();

  if (companyError) {
    return NextResponse.json({ error: companyError.message }, { status: 500 });
  }

  if (!company) {
    // No sub company registered — return empty state
    return NextResponse.json({
      company: null,
      projects: [],
      recentReports: [],
      stats: { activeProjects: 0, reportsThisWeek: 0, uniqueForemen: 0 },
    });
  }

  const normalizedCompanyName = normalizeCompanyName(company.company_name);

  // 3. Find project_subs linked by sub_company_id (explicitly linked)
  const { data: linkedSubs } = await service
    .from("project_subs")
    .select("id, project_id, sub_name, trades, activity_ids, sub_company_id, contact_name, contact_email")
    .eq("sub_company_id", company.id);

  // 4. Find project_subs that fuzzy-match by name (for unlinked projects)
  //    We fetch all project_subs and filter in-process to avoid n+1 calls.
  //    In most deployments the table is small; this is acceptable.
  const { data: allSubs } = await service
    .from("project_subs")
    .select("id, project_id, sub_name, trades, activity_ids, sub_company_id, contact_name, contact_email")
    .is("sub_company_id", null); // Only unlinked ones (linked are already captured above)

  const fuzzyMatchedSubs = (allSubs ?? []).filter(
    (s) => normalizeCompanyName(s.sub_name) === normalizedCompanyName
  );

  // Merge and deduplicate by id
  const allMatchedSubs = [...(linkedSubs ?? []), ...fuzzyMatchedSubs];
  const seenSubIds = new Set<string>();
  const uniqueSubs = allMatchedSubs.filter((s) => {
    if (seenSubIds.has(s.id)) return false;
    seenSubIds.add(s.id);
    return true;
  });

  if (uniqueSubs.length === 0) {
    return NextResponse.json({
      company,
      projects: [],
      recentReports: [],
      stats: { activeProjects: 0, reportsThisWeek: 0, uniqueForemen: 0 },
    });
  }

  // 5. Fetch project details for all matched project_subs
  const projectIds = [...new Set(uniqueSubs.map((s) => s.project_id))];
  const { data: projectRows } = await service
    .from("daily_projects")
    .select("id, name, location, user_id")
    .in("id", projectIds);

  const projectMap = new Map((projectRows ?? []).map((p) => [p.id, p]));

  // 6. Fetch all progress reports for all matched sub IDs
  const subIds = uniqueSubs.map((s) => s.id);

  const { data: allReports } = await service
    .from("sub_progress_reports")
    .select(
      "id, link_id, sub_id, project_id, report_date, submitted_by, manpower_count, total_hours, delay_reasons, notes, worked_on_activities, submitted_at"
    )
    .in("sub_id", subIds)
    .order("report_date", { ascending: false })
    .limit(200); // generous cap; filtered per-project below

  // 7. Group reports by project_id for per-project stats
  const reportsByProject = new Map<string, typeof allReports>();
  for (const report of allReports ?? []) {
    const existing = reportsByProject.get(report.project_id) ?? [];
    existing.push(report);
    reportsByProject.set(report.project_id, existing);
  }

  // 8. Build the projects array with stats
  const projects = uniqueSubs.map((sub) => {
    const project = projectMap.get(sub.project_id);
    const reports = reportsByProject.get(sub.project_id) ?? [];
    const lastReport = reports[0] ?? null; // already ordered DESC

    // Average percent from most recent report's worked_on_activities
    let avgPercent = 0;
    if (lastReport?.worked_on_activities?.length > 0) {
      const tasks = lastReport.worked_on_activities as Array<{ activity_id: string; status: string }>;
      const percentValues = tasks.map((t) => {
        const pct = parseInt(t.status, 10);
        return isNaN(pct) ? 0 : pct;
      });
      avgPercent =
        percentValues.length > 0
          ? Math.round(percentValues.reduce((a, b) => a + b, 0) / percentValues.length)
          : 0;
    }

    const tasksCount = Array.isArray(sub.activity_ids) ? sub.activity_ids.length : 0;

    return {
      sub_id: sub.id,
      project_id: sub.project_id,
      project_name: project?.name ?? "Unknown Project",
      location: project?.location ?? null,
      sub_name: sub.sub_name,
      trades: sub.trades ?? [],
      tasks_count: tasksCount,
      last_report_date: lastReport?.report_date ?? null,
      last_report_by: lastReport?.submitted_by ?? null,
      avg_percent: avgPercent,
      report_count: reports.length,
    };
  });

  // 9. Build recent reports feed (across all projects, last 10 by date)
  const allReportsSorted = (allReports ?? []).slice(0, 50); // already sorted DESC
  const recentReports = allReportsSorted.slice(0, 10).map((r) => {
    const project = projectMap.get(r.project_id);
    return {
      id: r.id,
      report_date: r.report_date,
      submitted_at: r.submitted_at,
      submitted_by: r.submitted_by,
      project_id: r.project_id,
      project_name: project?.name ?? "Unknown Project",
      manpower_count: r.manpower_count,
      total_hours: r.total_hours,
      delay_reasons: r.delay_reasons ?? [],
      notes: r.notes,
      worked_on_activities: r.worked_on_activities ?? [],
    };
  });

  const allReportsForStats = allReports ?? [];

  // 10. Compute stats
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const weekAgoStr = oneWeekAgo.toISOString().split("T")[0];

  const reportsThisWeek = allReportsForStats.filter(
    (r) => r.report_date >= weekAgoStr
  ).length;

  const uniqueForemen = new Set(
    allReportsForStats.map((r) => r.submitted_by).filter(Boolean)
  ).size;

  return NextResponse.json({
    company,
    projects,
    recentReports,
    stats: {
      activeProjects: projects.length,
      reportsThisWeek,
      uniqueForemen,
    },
    // Include total report count for "load more"
    totalReports: allReportsForStats.length,
  });
}
