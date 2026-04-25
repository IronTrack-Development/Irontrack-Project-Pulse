import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

// GET /api/projects/[id]/submittals/[submittalId]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; submittalId: string }> }
) {
  const { id: projectId, submittalId } = await params;
  const supabase = getServiceClient();

  const { data: submittal, error } = await supabase
    .from("submittals")
    .select(`
      id,
      project_id,
      submittal_number,
      spec_section,
      title,
      description,
      ball_in_court,
      status,
      required_by,
      submitted_date,
      returned_date,
      lead_time_days,
      priority,
      notes,
      created_at,
      updated_at,
      assigned_contact:company_contacts!submittals_assigned_to_fkey (
        id, name, company, role
      ),
      reviewer_contact:company_contacts!submittals_reviewer_id_fkey (
        id, name, company, role
      )
    `)
    .eq("id", submittalId)
    .eq("project_id", projectId)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });

  const { data: revisions } = await supabase
    .from("submittal_revisions")
    .select("*")
    .eq("submittal_id", submittalId)
    .order("created_at", { ascending: true });

  return NextResponse.json({ ...submittal, revisions: revisions ?? [] });
}

// PATCH /api/projects/[id]/submittals/[submittalId]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; submittalId: string }> }
) {
  const { id: projectId, submittalId } = await params;
  const supabase = getServiceClient();

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Get current submittal to detect status change
  const { data: current } = await supabase
    .from("submittals")
    .select("status, submittal_number")
    .eq("id", submittalId)
    .eq("project_id", projectId)
    .single();

  if (!current) {
    return NextResponse.json({ error: "Submittal not found" }, { status: 404 });
  }

  const updatePayload: Record<string, unknown> = {};
  const allowedFields = [
    "submittal_number", "spec_section", "title", "description",
    "assigned_to", "reviewer_id", "ball_in_court", "status",
    "required_by", "submitted_date", "returned_date", "lead_time_days",
    "priority", "notes"
  ];

  for (const field of allowedFields) {
    if (field in body) {
      updatePayload[field] = body[field];
    }
  }

  const { data: updated, error } = await supabase
    .from("submittals")
    .update(updatePayload)
    .eq("id", submittalId)
    .eq("project_id", projectId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Auto-create revision entry if status changed
  if ("status" in body && body.status !== current.status) {
    // Get current max revision number
    const { data: revs } = await supabase
      .from("submittal_revisions")
      .select("revision_number")
      .eq("submittal_id", submittalId)
      .order("revision_number", { ascending: false })
      .limit(1);

    const nextRevNum = revs && revs.length > 0 ? revs[0].revision_number + 1 : 1;

    await supabase.from("submittal_revisions").insert({
      submittal_id: submittalId,
      revision_number: nextRevNum,
      status: body.status as string,
      notes: (body.revision_notes as string) ?? null,
      changed_by: (body.changed_by as string) ?? null,
    });
  }

  return NextResponse.json(updated);
}

// DELETE /api/projects/[id]/submittals/[submittalId]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; submittalId: string }> }
) {
  const { id: projectId, submittalId } = await params;
  const supabase = getServiceClient();

  const { error } = await supabase
    .from("submittals")
    .delete()
    .eq("id", submittalId)
    .eq("project_id", projectId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
