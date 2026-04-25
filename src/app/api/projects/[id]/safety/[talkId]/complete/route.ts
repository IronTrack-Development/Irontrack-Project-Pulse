import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

// POST /api/projects/[id]/safety/[talkId]/complete — mark talk as completed
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; talkId: string }> }
) {
  const { id, talkId } = await params;
  const supabase = getServiceClient();

  // Validate at least 1 attendee has signed
  const { data: attendees } = await supabase
    .from("toolbox_talk_attendees")
    .select("id, signed")
    .eq("talk_id", talkId);

  const signedCount = (attendees || []).filter((a: any) => a.signed).length;
  if (signedCount === 0) {
    return NextResponse.json(
      { error: "At least one attendee must be signed before completing the talk" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("toolbox_talks")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", talkId)
    .eq("project_id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
