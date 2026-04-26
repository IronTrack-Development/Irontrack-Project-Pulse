import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

// POST — mark meeting as completed
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; meetingId: string }> }
) {
  const { id, meetingId } = await params;
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("coordination_meetings")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
    })
    .eq("id", meetingId)
    .eq("project_id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
