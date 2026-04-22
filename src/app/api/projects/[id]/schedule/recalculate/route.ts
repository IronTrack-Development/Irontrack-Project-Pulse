import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import {
  runReforecast,
  dbRowToScheduleTask,
  scheduleTaskToDbUpdate,
} from "@/lib/schedule-engine";

/**
 * POST /api/projects/[id]/schedule/recalculate
 * 
 * Run a full CPM reforecast on the project schedule.
 * - Reads all tasks
 * - Runs forward/backward pass
 * - Calculates critical path + float
 * - Detects impacts + risks
 * - Generates recovery actions
 * - Saves updated tasks back to DB
 * - Creates a schedule snapshot
 * 
 * Body (optional): { trigger_description?: string, save_snapshot?: boolean }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const supabase = getServiceClient();
  
  let body: Record<string, any> = {};
  try {
    body = await req.json();
  } catch {
    // empty body is fine
  }

  const triggerDesc = body.trigger_description || "Manual reforecast";
  const saveSnapshot = body.save_snapshot !== false; // default true

  // 1. Fetch project
  const { data: project, error: projErr } = await supabase
    .from("daily_projects")
    .select("*")
    .eq("id", projectId)
    .single();

  if (projErr || !project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // 2. Fetch all activities
  const { data: activities, error: actErr } = await supabase
    .from("parsed_activities")
    .select("*")
    .eq("project_id", projectId);

  if (actErr) {
    return NextResponse.json({ error: actErr.message }, { status: 500 });
  }

  if (!activities || activities.length === 0) {
    return NextResponse.json({ error: "No activities found for this project" }, { status: 400 });
  }

  // 3. Convert DB rows to engine format
  const tasks = activities.map(dbRowToScheduleTask);

  // 4. Get previous critical path IDs
  const previousCritical = activities
    .filter((a: any) => a.is_critical)
    .map((a: any) => a.id);

  // 5. Run the reforecast engine
  const result = runReforecast(
    projectId,
    tasks,
    project.start_date || new Date().toISOString().split("T")[0],
    project.target_finish_date || null,
    previousCritical
  );

  // 6. Save updated tasks back to DB (batch)
  const updatePromises = result.updated_tasks.map((task) => {
    const dbFields = scheduleTaskToDbUpdate(task);
    return supabase
      .from("parsed_activities")
      .update(dbFields)
      .eq("id", task.id)
      .eq("project_id", projectId);
  });

  await Promise.all(updatePromises);

  // 7. Update project forecast finish date
  if (result.forecast_finish_date) {
    await supabase
      .from("daily_projects")
      .update({ target_finish_date: result.forecast_finish_date })
      .eq("id", projectId);
  }

  // 8. Save snapshot
  let snapshotId: string | null = null;
  if (saveSnapshot) {
    // Strip heavy fields for snapshot storage
    const snapshotTaskData = result.updated_tasks.map((t) => ({
      id: t.id,
      activity_id: t.activity_id,
      activity_name: t.activity_name,
      trade: t.trade,
      status: t.status,
      percent_complete: t.percent_complete,
      original_duration: t.original_duration,
      remaining_duration: t.remaining_duration,
      baseline_start: t.baseline_start,
      baseline_finish: t.baseline_finish,
      forecast_start: t.forecast_start,
      forecast_finish: t.forecast_finish,
      early_start: t.early_start,
      early_finish: t.early_finish,
      late_start: t.late_start,
      late_finish: t.late_finish,
      total_float: t.total_float,
      free_float: t.free_float,
      is_critical: t.is_critical,
      milestone: t.milestone,
    }));

    const { data: snapshot } = await supabase
      .from("schedule_snapshots")
      .insert({
        project_id: projectId,
        snapshot_type: "reforecast",
        trigger_description: triggerDesc,
        baseline_finish_date: project.target_finish_date || null,
        forecast_finish_date: result.forecast_finish_date,
        completion_delta_days: result.completion_delta_days,
        critical_path_changed: result.critical_path_changed,
        total_activities: result.stats.total_activities,
        complete_activities: result.stats.complete_activities,
        critical_activities: result.stats.critical_activities,
        at_risk_activities: result.stats.at_risk_activities,
        task_data: snapshotTaskData,
        recovery_actions: result.recovery_actions,
        risk_flags: result.risk_flags,
        schedule_impacts: result.schedule_impacts,
      })
      .select("id")
      .single();

    snapshotId = snapshot?.id || null;
  }

  return NextResponse.json({
    ...result,
    snapshot_id: snapshotId,
    // Don't return full task data in response to keep it lightweight
    updated_tasks: undefined,
    task_count: result.updated_tasks.length,
  });
}
