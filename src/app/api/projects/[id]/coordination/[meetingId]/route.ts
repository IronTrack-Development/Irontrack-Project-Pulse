import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

// GET /api/projects/[id]/coordination/[meetingId] — single meeting with related data
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; meetingId: string }> }
) {
  const { id, meetingId } = await params;
  const supabase = getServiceClient();

  const { data: meeting, error } = await supabase
    .from("coordination_meetings")
    .select("*")
    .eq("id", meetingId)
    .eq("project_id", id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });

  const [agendaRes, actionsRes, attendeesRes] = await Promise.all([
    supabase
      .from("coordination_agenda_items")
      .select("*")
      .eq("meeting_id", meetingId)
      .order("sort_order"),
    supabase
      .from("coordination_action_items")
      .select("*")
      .eq("meeting_id", meetingId)
      .order("created_at"),
    supabase
      .from("coordination_attendees")
      .select("*")
      .eq("meeting_id", meetingId)
      .order("name"),
  ]);

  return NextResponse.json({
    ...meeting,
    agenda_items: agendaRes.data || [],
    action_items: actionsRes.data || [],
    attendees: attendeesRes.data || [],
  });
}

// PATCH /api/projects/[id]/coordination/[meetingId] — update meeting
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; meetingId: string }> }
) {
  const { id, meetingId } = await params;
  const supabase = getServiceClient();
  const body = await req.json();

  const allowed = [
    "title", "meeting_date", "meeting_type", "location", "facilitator",
    "start_time", "end_time", "notes", "summary", "recurrence",
    "recurrence_day", "status",
  ];
  const updates: Record<string, any> = {};
  allowed.forEach((key) => {
    if (body[key] !== undefined) updates[key] = body[key];
  });

  const { data, error } = await supabase
    .from("coordination_meetings")
    .update(updates)
    .eq("id", meetingId)
    .eq("project_id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE /api/projects/[id]/coordination/[meetingId] — delete scheduled/cancelled only
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; meetingId: string }> }
) {
  const { id, meetingId } = await params;
  const supabase = getServiceClient();

  // Check status before deleting
  const { data: meeting } = await supabase
    .from("coordination_meetings")
    .select("status")
    .eq("id", meetingId)
    .eq("project_id", id)
    .single();

  if (!meeting) return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
  if (meeting.status === "completed" || meeting.status === "in_progress") {
    return NextResponse.json({ error: "Cannot delete completed or in-progress meetings" }, { status: 400 });
  }

  const { error } = await supabase
    .from("coordination_meetings")
    .delete()
    .eq("id", meetingId)
    .eq("project_id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
