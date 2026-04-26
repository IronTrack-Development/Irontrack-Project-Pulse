import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

// GET — list attendees
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; meetingId: string }> }
) {
  const { meetingId } = await params;
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("coordination_attendees")
    .select("*")
    .eq("meeting_id", meetingId)
    .order("name");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ attendees: data });
}

// POST — add attendee(s)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; meetingId: string }> }
) {
  const { meetingId } = await params;
  const supabase = getServiceClient();
  const body = await req.json();

  // Support batch or single
  const attendees = Array.isArray(body.attendees)
    ? body.attendees.map((a: any) => ({ ...a, meeting_id: meetingId }))
    : [{ meeting_id: meetingId, name: body.name, company: body.company, trade: body.trade, present: body.present || false }];

  const { data, error } = await supabase
    .from("coordination_attendees")
    .insert(attendees)
    .select();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ attendees: data }, { status: 201 });
}

// PATCH — mark present/absent
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; meetingId: string }> }
) {
  const { meetingId } = await params;
  const supabase = getServiceClient();
  const body = await req.json();

  if (!body.attendee_id) {
    return NextResponse.json({ error: "attendee_id required" }, { status: 400 });
  }

  const updates: Record<string, any> = {};
  if (body.present !== undefined) updates.present = body.present;
  if (body.name !== undefined) updates.name = body.name;
  if (body.company !== undefined) updates.company = body.company;
  if (body.trade !== undefined) updates.trade = body.trade;

  const { data, error } = await supabase
    .from("coordination_attendees")
    .update(updates)
    .eq("id", body.attendee_id)
    .eq("meeting_id", meetingId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE — remove attendee
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; meetingId: string }> }
) {
  const { meetingId } = await params;
  const supabase = getServiceClient();
  const url = new URL(req.url);
  const attendeeId = url.searchParams.get("attendee_id");

  if (!attendeeId) return NextResponse.json({ error: "attendee_id required" }, { status: 400 });

  const { error } = await supabase
    .from("coordination_attendees")
    .delete()
    .eq("id", attendeeId)
    .eq("meeting_id", meetingId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
