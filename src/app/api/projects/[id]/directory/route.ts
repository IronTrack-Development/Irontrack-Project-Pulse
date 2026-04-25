import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

// GET /api/projects/[id]/directory — list all contacts on a project
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("project_contacts")
    .select(`
      id,
      role_on_project,
      invited_at,
      joined_at,
      contact_id,
      company_contacts (
        id,
        name,
        company,
        email,
        phone,
        role,
        trade,
        discipline,
        notes,
        created_via,
        created_at,
        updated_at
      )
    `)
    .eq("project_id", projectId)
    .order("invited_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

// POST /api/projects/[id]/directory
// Body: { contact_id? (existing), OR name + role + ... (new contact) }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const supabase = getServiceClient();

  let body: {
    contact_id?: string;
    role_on_project?: string;
    // new contact fields
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

  // Verify project exists
  const { data: project, error: projError } = await supabase
    .from("daily_projects")
    .select("id")
    .eq("id", projectId)
    .single();

  if (projError || !project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  let contactId = body.contact_id;

  if (!contactId) {
    // Create new contact
    if (!body.name?.trim()) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }
    if (!body.role) {
      return NextResponse.json({ error: "role is required" }, { status: 400 });
    }

    const { data: newContact, error: contactError } = await supabase
      .from("company_contacts")
      .insert({
        name: body.name.trim(),
        company: body.company?.trim() ?? null,
        email: body.email?.trim() ?? null,
        phone: body.phone?.trim() ?? null,
        role: body.role,
        trade: body.trade?.trim() ?? null,
        discipline: body.discipline?.trim() ?? null,
        notes: body.notes?.trim() ?? null,
        created_via: "manual",
      })
      .select()
      .single();

    if (contactError) {
      return NextResponse.json({ error: contactError.message }, { status: 500 });
    }

    contactId = newContact.id;
  }

  // Add to project_contacts
  const { data, error } = await supabase
    .from("project_contacts")
    .insert({
      project_id: projectId,
      contact_id: contactId,
      role_on_project: body.role_on_project ?? null,
    })
    .select(`
      id,
      role_on_project,
      invited_at,
      joined_at,
      contact_id,
      company_contacts (
        id, name, company, email, phone, role, trade, discipline, notes, created_via, created_at, updated_at
      )
    `)
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "This contact is already on this project" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
