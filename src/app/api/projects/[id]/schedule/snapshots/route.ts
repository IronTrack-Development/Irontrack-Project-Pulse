import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

/**
 * GET /api/projects/[id]/schedule/snapshots
 * 
 * List schedule snapshots for a project, ordered newest first.
 * ?limit=N (default 20)
 * ?type=reforecast|baseline|manual
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const supabase = getServiceClient();
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") || "20", 10);
  const type = searchParams.get("type");

  let query = supabase
    .from("schedule_snapshots")
    .select("id, project_id, snapshot_name, snapshot_type, trigger_description, baseline_finish_date, forecast_finish_date, completion_delta_days, critical_path_changed, total_activities, complete_activities, critical_activities, at_risk_activities, recovery_actions, risk_flags, schedule_impacts, created_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (type) query = query.eq("snapshot_type", type);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data || []);
}
