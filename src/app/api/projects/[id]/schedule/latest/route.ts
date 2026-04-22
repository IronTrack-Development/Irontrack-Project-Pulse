import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

/**
 * GET /api/projects/[id]/schedule/latest
 * 
 * Get the latest reforecast data for the project.
 * Returns: project metadata + all tasks with forecast fields + latest snapshot summary
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const supabase = getServiceClient();

  // Fetch project
  const { data: project, error: projErr } = await supabase
    .from("daily_projects")
    .select("*")
    .eq("id", projectId)
    .single();

  if (projErr || !project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // Fetch all activities with forecast fields
  const { data: activities, error: actErr } = await supabase
    .from("parsed_activities")
    .select("*")
    .eq("project_id", projectId)
    .order("start_date", { ascending: true });

  if (actErr) {
    return NextResponse.json({ error: actErr.message }, { status: 500 });
  }

  // Fetch latest snapshot (summary only, no task_data)
  const { data: snapshots } = await supabase
    .from("schedule_snapshots")
    .select("id, snapshot_type, trigger_description, baseline_finish_date, forecast_finish_date, completion_delta_days, critical_path_changed, total_activities, complete_activities, critical_activities, at_risk_activities, recovery_actions, risk_flags, schedule_impacts, created_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(1);

  const latestSnapshot = snapshots && snapshots.length > 0 ? snapshots[0] : null;

  // Compute summary stats
  const tasks = activities || [];
  const complete = tasks.filter((t: any) => t.status === "complete").length;
  const inProgress = tasks.filter((t: any) => t.status === "in_progress").length;
  const critical = tasks.filter((t: any) => t.is_critical).length;
  const atRisk = tasks.filter((t: any) => t.status !== "complete" && (t.total_float ?? t.float_days ?? 999) <= 0).length;

  // Find forecast finish (latest forecast_finish across all tasks)
  let forecastFinish: string | null = null;
  for (const task of tasks) {
    const ff = task.forecast_finish || task.finish_date;
    if (ff && (!forecastFinish || ff > forecastFinish)) {
      forecastFinish = ff;
    }
  }

  return NextResponse.json({
    project: {
      id: project.id,
      name: project.name,
      start_date: project.start_date,
      target_finish_date: project.target_finish_date,
    },
    forecast_finish_date: forecastFinish,
    stats: {
      total_activities: tasks.length,
      complete_activities: complete,
      in_progress_activities: inProgress,
      critical_activities: critical,
      at_risk_activities: atRisk,
      avg_completion: tasks.length > 0
        ? Math.round(tasks.reduce((s: number, t: any) => s + (t.percent_complete || 0), 0) / tasks.length)
        : 0,
    },
    tasks,
    latest_snapshot: latestSnapshot,
  });
}
