import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

// GET /api/projects/[id]/daily-logs/[logId] — fetch a single log with progress + photos
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; logId: string }> }
) {
  const { id, logId } = await params;
  const supabase = getServiceClient();

  const [logRes, progressRes, photosRes] = await Promise.all([
    supabase.from("daily_logs").select("*").eq("id", logId).eq("project_id", id).single(),
    supabase
      .from("daily_log_progress")
      .select("*, parsed_activities(activity_name, trade)")
      .eq("daily_log_id", logId),
    supabase.from("daily_log_photos").select("*").eq("daily_log_id", logId).order("uploaded_at"),
  ]);

  if (logRes.error) return NextResponse.json({ error: logRes.error.message }, { status: 404 });

  // Flatten joined activity data
  const progress = (progressRes.data || []).map((p: any) => ({
    ...p,
    activity_name: p.parsed_activities?.activity_name,
    trade: p.parsed_activities?.trade,
    parsed_activities: undefined,
  }));

  return NextResponse.json({
    ...logRes.data,
    progress,
    photos: photosRes.data || [],
  });
}

// PATCH /api/projects/[id]/daily-logs/[logId] — update log fields (autosave)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; logId: string }> }
) {
  const { id, logId } = await params;
  const supabase = getServiceClient();
  const body = await req.json();

  // Check lock status
  const { data: existing } = await supabase
    .from("daily_logs")
    .select("status")
    .eq("id", logId)
    .eq("project_id", id)
    .single();

  if (!existing) return NextResponse.json({ error: "Log not found" }, { status: 404 });
  if (existing.status === "locked") {
    return NextResponse.json({ error: "Log is locked" }, { status: 403 });
  }

  // Handle submit action
  if (body.status === "submitted") {
    body.submitted_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("daily_logs")
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq("id", logId)
    .eq("project_id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE /api/projects/[id]/daily-logs/[logId]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; logId: string }> }
) {
  const { id, logId } = await params;
  const supabase = getServiceClient();

  const { data: existing } = await supabase
    .from("daily_logs")
    .select("status")
    .eq("id", logId)
    .eq("project_id", id)
    .single();

  if (!existing) return NextResponse.json({ error: "Log not found" }, { status: 404 });
  if (existing.status !== "draft") {
    return NextResponse.json({ error: "Only draft logs can be deleted" }, { status: 403 });
  }

  const { error } = await supabase
    .from("daily_logs")
    .delete()
    .eq("id", logId)
    .eq("project_id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ deleted: true });
}
