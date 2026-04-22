import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

/**
 * GET /api/projects/[id]/schedule/snapshots/[snapshotId]
 * 
 * Get a single snapshot including full task_data
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; snapshotId: string }> }
) {
  const { id: projectId, snapshotId } = await params;
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("schedule_snapshots")
    .select("*")
    .eq("id", snapshotId)
    .eq("project_id", projectId)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });

  return NextResponse.json(data);
}

/**
 * DELETE /api/projects/[id]/schedule/snapshots/[snapshotId]
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; snapshotId: string }> }
) {
  const { id: projectId, snapshotId } = await params;
  const supabase = getServiceClient();

  const { error } = await supabase
    .from("schedule_snapshots")
    .delete()
    .eq("id", snapshotId)
    .eq("project_id", projectId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
