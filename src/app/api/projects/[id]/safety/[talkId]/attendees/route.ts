import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

// GET /api/projects/[id]/safety/[talkId]/attendees — list attendees
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; talkId: string }> }
) {
  const { talkId } = await params;
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("toolbox_talk_attendees")
    .select("*")
    .eq("talk_id", talkId)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ attendees: data });
}

// POST /api/projects/[id]/safety/[talkId]/attendees — add attendee(s)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; talkId: string }> }
) {
  const { talkId } = await params;
  const supabase = getServiceClient();
  const body = await req.json();

  // Accept single attendee or batch array
  const attendees = Array.isArray(body) ? body : [body];
  const records = attendees.map((a: any) => ({
    talk_id: talkId,
    name: a.name,
    trade: a.trade || null,
    company: a.company || null,
  }));

  const { data, error } = await supabase
    .from("toolbox_talk_attendees")
    .insert(records)
    .select();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ attendees: data }, { status: 201 });
}

// DELETE /api/projects/[id]/safety/[talkId]/attendees — remove attendee by id
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; talkId: string }> }
) {
  const { talkId } = await params;
  const supabase = getServiceClient();
  const url = new URL(req.url);
  const attendeeId = url.searchParams.get("attendeeId");

  if (!attendeeId) {
    return NextResponse.json({ error: "attendeeId query param required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("toolbox_talk_attendees")
    .delete()
    .eq("id", attendeeId)
    .eq("talk_id", talkId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
