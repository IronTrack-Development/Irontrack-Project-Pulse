import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

// GET /api/projects/[id]/rfis/[rfiId]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; rfiId: string }> }
) {
  const { rfiId } = await params;
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("rfis")
    .select(`
      *,
      assigned_contact:company_contacts!rfis_assigned_to_fkey(id, name, company, role),
      rfi_responses(*, responded_contact:company_contacts(id, name)),
      rfi_photos(*)
    `)
    .eq("id", rfiId)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });

  let days_open: number | null = null;
  if (data.submitted_date) {
    const end = data.answered_date ? new Date(data.answered_date) : new Date();
    const start = new Date(data.submitted_date);
    days_open = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  }

  return NextResponse.json({ ...data, days_open });
}

// PATCH /api/projects/[id]/rfis/[rfiId]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; rfiId: string }> }
) {
  const { rfiId } = await params;
  const supabase = getServiceClient();
  const body = await req.json();

  // Build update object
  const updates: Record<string, unknown> = {};
  const fields = [
    "subject", "question", "spec_section", "drawing_reference", "priority",
    "assigned_to", "ball_in_court", "status", "cost_impact", "schedule_impact",
    "due_date", "submitted_date", "answered_date", "notes",
  ];
  for (const f of fields) {
    if (f in body) updates[f] = body[f];
  }

  // Auto-set dates based on status transitions
  if (body.status === "submitted" && !body.submitted_date) {
    updates.submitted_date = new Date().toISOString().split("T")[0];
  }
  if (body.status === "answered" && !body.answered_date) {
    updates.answered_date = new Date().toISOString().split("T")[0];
  }

  // Handle adding a response
  if (body.response_text) {
    const { error: respError } = await supabase.from("rfi_responses").insert({
      rfi_id: rfiId,
      response_text: body.response_text,
      responded_by: body.responded_by || null,
      responded_by_name: body.responded_by_name || null,
    });
    if (respError) return NextResponse.json({ error: respError.message }, { status: 500 });
  }

  if (Object.keys(updates).length === 0 && !body.response_text) {
    return NextResponse.json({ error: "No updates provided" }, { status: 400 });
  }

  if (Object.keys(updates).length > 0) {
    const { data, error } = await supabase
      .from("rfis")
      .update(updates)
      .eq("id", rfiId)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  return NextResponse.json({ ok: true });
}

// DELETE /api/projects/[id]/rfis/[rfiId]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; rfiId: string }> }
) {
  const { rfiId } = await params;
  const supabase = getServiceClient();

  // Remove photos from storage
  const { data: photos } = await supabase
    .from("rfi_photos")
    .select("storage_path")
    .eq("rfi_id", rfiId);

  if (photos && photos.length > 0) {
    const paths = photos.map((p) => p.storage_path);
    await supabase.storage.from("rfi-photos").remove(paths);
  }

  const { error } = await supabase.from("rfis").delete().eq("id", rfiId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ deleted: true });
}
