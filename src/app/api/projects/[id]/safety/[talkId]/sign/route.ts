import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

// POST /api/projects/[id]/safety/[talkId]/sign — mark attendee as signed
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; talkId: string }> }
) {
  const { talkId } = await params;
  const supabase = getServiceClient();
  const body = await req.json();

  if (!body.attendee_id) {
    return NextResponse.json({ error: "attendee_id is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("toolbox_talk_attendees")
    .update({
      signed: body.signed !== false,
      signed_at: body.signed !== false ? new Date().toISOString() : null,
    })
    .eq("id", body.attendee_id)
    .eq("talk_id", talkId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
