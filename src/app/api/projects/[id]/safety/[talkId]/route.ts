import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

// GET /api/projects/[id]/safety/[talkId] — get single talk with attendees
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; talkId: string }> }
) {
  const { id, talkId } = await params;
  const supabase = getServiceClient();

  const { data: talk, error } = await supabase
    .from("toolbox_talks")
    .select("*")
    .eq("id", talkId)
    .eq("project_id", id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });

  const { data: attendees } = await supabase
    .from("toolbox_talk_attendees")
    .select("*")
    .eq("talk_id", talkId)
    .order("created_at", { ascending: true });

  return NextResponse.json({ ...talk, attendees: attendees || [] });
}

// PATCH /api/projects/[id]/safety/[talkId] — update talk
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; talkId: string }> }
) {
  const { id, talkId } = await params;
  const supabase = getServiceClient();
  const body = await req.json();

  // Check if talk is locked
  const { data: existing } = await supabase
    .from("toolbox_talks")
    .select("status")
    .eq("id", talkId)
    .eq("project_id", id)
    .single();

  if (!existing) return NextResponse.json({ error: "Talk not found" }, { status: 404 });
  if (existing.status === "locked") {
    return NextResponse.json({ error: "Talk is locked and cannot be edited" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("toolbox_talks")
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq("id", talkId)
    .eq("project_id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE /api/projects/[id]/safety/[talkId] — delete draft talk
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; talkId: string }> }
) {
  const { id, talkId } = await params;
  const supabase = getServiceClient();

  // Only allow deleting draft talks
  const { data: existing } = await supabase
    .from("toolbox_talks")
    .select("status")
    .eq("id", talkId)
    .eq("project_id", id)
    .single();

  if (!existing) return NextResponse.json({ error: "Talk not found" }, { status: 404 });
  if (existing.status !== "draft") {
    return NextResponse.json({ error: "Only draft talks can be deleted" }, { status: 403 });
  }

  const { error } = await supabase
    .from("toolbox_talks")
    .delete()
    .eq("id", talkId)
    .eq("project_id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
