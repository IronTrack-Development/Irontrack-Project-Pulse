import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

// PATCH /api/projects/[id]/directory/[contactId]
// Update contact info or role_on_project
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; contactId: string }> }
) {
  const { id: projectId, contactId } = await params;
  const supabase = getServiceClient();

  let body: {
    role_on_project?: string;
    name?: string;
    company?: string;
    email?: string;
    phone?: string;
    role?: string;
    trade?: string;
    discipline?: string;
    notes?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Get the project_contact record to find the contact_id
  const { data: pc, error: pcError } = await supabase
    .from("project_contacts")
    .select("id, contact_id")
    .eq("project_id", projectId)
    .eq("id", contactId)
    .single();

  if (pcError || !pc) {
    return NextResponse.json({ error: "Contact not found on this project" }, { status: 404 });
  }

  // Update role_on_project if provided
  if (body.role_on_project !== undefined) {
    const { error: pcUpdateError } = await supabase
      .from("project_contacts")
      .update({ role_on_project: body.role_on_project })
      .eq("id", contactId);

    if (pcUpdateError) {
      return NextResponse.json({ error: pcUpdateError.message }, { status: 500 });
    }
  }

  // Update company_contacts fields if provided
  const contactUpdates: Record<string, unknown> = {};
  if (body.name !== undefined) contactUpdates.name = body.name.trim();
  if (body.company !== undefined) contactUpdates.company = body.company?.trim() ?? null;
  if (body.email !== undefined) contactUpdates.email = body.email?.trim() ?? null;
  if (body.phone !== undefined) contactUpdates.phone = body.phone?.trim() ?? null;
  if (body.role !== undefined) contactUpdates.role = body.role;
  if (body.trade !== undefined) contactUpdates.trade = body.trade?.trim() ?? null;
  if (body.discipline !== undefined) contactUpdates.discipline = body.discipline?.trim() ?? null;
  if (body.notes !== undefined) contactUpdates.notes = body.notes?.trim() ?? null;

  if (Object.keys(contactUpdates).length > 0) {
    const { error: contactUpdateError } = await supabase
      .from("company_contacts")
      .update(contactUpdates)
      .eq("id", pc.contact_id);

    if (contactUpdateError) {
      return NextResponse.json({ error: contactUpdateError.message }, { status: 500 });
    }
  }

  // Return updated record
  const { data, error } = await supabase
    .from("project_contacts")
    .select(`
      id, role_on_project, invited_at, joined_at, contact_id,
      company_contacts (
        id, name, company, email, phone, role, trade, discipline, notes, created_via, created_at, updated_at
      )
    `)
    .eq("id", contactId)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// DELETE /api/projects/[id]/directory/[contactId]
// Remove contact from project (does NOT delete from company_contacts)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; contactId: string }> }
) {
  const { id: projectId, contactId } = await params;
  const supabase = getServiceClient();

  const { error } = await supabase
    .from("project_contacts")
    .delete()
    .eq("project_id", projectId)
    .eq("id", contactId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
