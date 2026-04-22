import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

/**
 * POST /api/projects/[id]/schedule/update-progress
 * 
 * Update progress on one or more tasks. Logs the change and
 * returns updated task data. Does NOT trigger a full reforecast
 * — call /recalculate separately after batch updates.
 * 
 * Body: { updates: [{ activity_id, percent_complete?, remaining_duration?, 
 *                      status?, actual_start?, actual_finish?, manual_override?, notes? }] }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const supabase = getServiceClient();
  const body = await req.json();

  const { updates, updated_by } = body;

  if (!updates || !Array.isArray(updates) || updates.length === 0) {
    return NextResponse.json({ error: "updates array is required" }, { status: 400 });
  }

  const results: Record<string, any>[] = [];
  const errors: string[] = [];

  for (const update of updates) {
    const { activity_id, percent_complete, remaining_duration, status, actual_start, actual_finish, manual_override, notes } = update;

    if (!activity_id) {
      errors.push("Missing activity_id in update");
      continue;
    }

    // Fetch current state
    const { data: current, error: fetchErr } = await supabase
      .from("parsed_activities")
      .select("*")
      .eq("id", activity_id)
      .eq("project_id", projectId)
      .single();

    if (fetchErr || !current) {
      errors.push(`Activity ${activity_id} not found`);
      continue;
    }

    // Build update payload
    const updatePayload: Record<string, any> = {};
    const progressLog: Record<string, any> = {
      project_id: projectId,
      activity_id,
      updated_by: updated_by || null,
      notes: notes || null,
    };

    if (percent_complete !== undefined) {
      progressLog.previous_percent_complete = current.percent_complete;
      progressLog.new_percent_complete = percent_complete;
      updatePayload.percent_complete = percent_complete;
      
      // Auto-calculate remaining duration unless manual override
      if (!manual_override && !current.manual_override) {
        const newRemaining = Math.ceil((current.original_duration || 0) * (1 - percent_complete / 100));
        updatePayload.remaining_duration = percent_complete >= 100 ? 0 : newRemaining;
        progressLog.previous_remaining_duration = current.remaining_duration;
        progressLog.new_remaining_duration = updatePayload.remaining_duration;
      }
    }

    if (remaining_duration !== undefined) {
      progressLog.previous_remaining_duration = current.remaining_duration;
      progressLog.new_remaining_duration = remaining_duration;
      updatePayload.remaining_duration = remaining_duration;
      updatePayload.manual_override = true;
      progressLog.manual_override = true;
    }

    if (manual_override !== undefined) {
      updatePayload.manual_override = manual_override;
    }

    if (status !== undefined) {
      progressLog.previous_status = current.status;
      progressLog.new_status = status;
      updatePayload.status = status;
    }

    if (actual_start !== undefined) {
      updatePayload.actual_start = actual_start;
      progressLog.actual_start_set = actual_start;
      if (current.status === "not_started") {
        updatePayload.status = "in_progress";
        progressLog.new_status = "in_progress";
      }
    }

    if (actual_finish !== undefined) {
      updatePayload.actual_finish = actual_finish;
      progressLog.actual_finish_set = actual_finish;
      updatePayload.status = "complete";
      updatePayload.percent_complete = 100;
      updatePayload.remaining_duration = 0;
      progressLog.new_status = "complete";
      progressLog.new_percent_complete = 100;
      progressLog.new_remaining_duration = 0;
    }

    // Apply update
    const { data: updated, error: updateErr } = await supabase
      .from("parsed_activities")
      .update(updatePayload)
      .eq("id", activity_id)
      .eq("project_id", projectId)
      .select()
      .single();

    if (updateErr) {
      errors.push(`Failed to update ${activity_id}: ${updateErr.message}`);
      continue;
    }

    // Log progress update
    await supabase.from("progress_updates").insert(progressLog);

    results.push(updated);
  }

  return NextResponse.json({
    updated: results.length,
    tasks: results,
    errors: errors.length > 0 ? errors : undefined,
  });
}
