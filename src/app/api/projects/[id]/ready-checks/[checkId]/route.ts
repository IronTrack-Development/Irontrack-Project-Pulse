import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; checkId: string }> }
) {
  const { id, checkId } = await params;
  const supabase = getServiceClient();
  const body = await req.json();

  const { status, response_notes, follow_up } = body;

  // Build update payload
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updates: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (follow_up === true) {
    // Increment follow-up count; keep status as awaiting_response
    const { data: current } = await supabase
      .from("ready_checks")
      .select("follow_up_count")
      .eq("id", checkId)
      .eq("project_id", id)
      .single();

    updates.follow_up_count = ((current?.follow_up_count) ?? 0) + 1;
    updates.last_follow_up_at = new Date().toISOString();
    updates.status = "awaiting_response";
    updates.sent_at = new Date().toISOString();
  }

  if (status) {
    updates.status = status;
    // Set responded_at when moving to a terminal confirmation status
    if (["confirmed", "no_response", "issue_flagged"].includes(status)) {
      updates.responded_at = new Date().toISOString();
    }
  }

  if (response_notes !== undefined) {
    updates.response_notes = response_notes;
  }

  const { data, error } = await supabase
    .from("ready_checks")
    .update(updates)
    .eq("id", checkId)
    .eq("project_id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
