import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

// GET /api/join/[projectId]/directory?token=xxx
// Validate token, return project info and form config
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "token is required" }, { status: 400 });
  }

  const supabase = getServiceClient();

  // Validate token
  const now = new Date().toISOString();
  const { data: tokenRow, error: tokenError } = await supabase
    .from("directory_join_tokens")
    .select("id, project_id, expires_at, is_active")
    .eq("token", token)
    .eq("project_id", projectId)
    .eq("is_active", true)
    .maybeSingle();

  if (tokenError || !tokenRow) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 404 });
  }

  if (tokenRow.expires_at && tokenRow.expires_at < now) {
    return NextResponse.json({ error: "This link has expired" }, { status: 410 });
  }

  // Get project name
  const { data: project, error: projError } = await supabase
    .from("daily_projects")
    .select("id, name")
    .eq("id", projectId)
    .single();

  if (projError || !project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  return NextResponse.json({
    project_id: project.id,
    project_name: project.name,
    valid: true,
  });
}

// POST /api/join/[projectId]/directory
// Submit contact info to join project directory
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;

  let body: {
    token: string;
    name: string;
    company?: string;
    email?: string;
    phone?: string;
    role: string;
    trade?: string;
    discipline?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.token) {
    return NextResponse.json({ error: "token is required" }, { status: 400 });
  }
  if (!body.name?.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  if (!body.role) {
    return NextResponse.json({ error: "role is required" }, { status: 400 });
  }

  const supabase = getServiceClient();

  // Validate token
  const now = new Date().toISOString();
  const { data: tokenRow, error: tokenError } = await supabase
    .from("directory_join_tokens")
    .select("id, project_id, expires_at, is_active")
    .eq("token", body.token)
    .eq("project_id", projectId)
    .eq("is_active", true)
    .maybeSingle();

  if (tokenError || !tokenRow) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 404 });
  }

  if (tokenRow.expires_at && tokenRow.expires_at < now) {
    return NextResponse.json({ error: "This link has expired" }, { status: 410 });
  }

  // Get project name for response
  const { data: project } = await supabase
    .from("daily_projects")
    .select("name")
    .eq("id", projectId)
    .single();

  const projectName = project?.name ?? "Project";

  // Check if email already exists in company_contacts
  let contactId: string;

  if (body.email?.trim()) {
    const { data: existing } = await supabase
      .from("company_contacts")
      .select("id")
      .eq("email", body.email.trim().toLowerCase())
      .maybeSingle();

    if (existing) {
      contactId = existing.id;
      // Update contact info
      await supabase
        .from("company_contacts")
        .update({
          name: body.name.trim(),
          company: body.company?.trim() ?? null,
          phone: body.phone?.trim() ?? null,
          role: body.role,
          trade: body.trade?.trim() ?? null,
          discipline: body.discipline?.trim() ?? null,
        })
        .eq("id", contactId);
    } else {
      // Create new contact
      const { data: newContact, error: createError } = await supabase
        .from("company_contacts")
        .insert({
          name: body.name.trim(),
          company: body.company?.trim() ?? null,
          email: body.email.trim().toLowerCase(),
          phone: body.phone?.trim() ?? null,
          role: body.role,
          trade: body.trade?.trim() ?? null,
          discipline: body.discipline?.trim() ?? null,
          created_via: "qr_join",
        })
        .select("id")
        .single();

      if (createError || !newContact) {
        return NextResponse.json({ error: "Failed to create contact" }, { status: 500 });
      }

      contactId = newContact.id;
    }
  } else {
    // No email — always create new
    const { data: newContact, error: createError } = await supabase
      .from("company_contacts")
      .insert({
        name: body.name.trim(),
        company: body.company?.trim() ?? null,
        email: null,
        phone: body.phone?.trim() ?? null,
        role: body.role,
        trade: body.trade?.trim() ?? null,
        discipline: body.discipline?.trim() ?? null,
        created_via: "qr_join",
      })
      .select("id")
      .single();

    if (createError || !newContact) {
      return NextResponse.json({ error: "Failed to create contact" }, { status: 500 });
    }

    contactId = newContact.id;
  }

  // Add to project_contacts (upsert on project_id + contact_id)
  const { error: pcError } = await supabase
    .from("project_contacts")
    .upsert(
      {
        project_id: projectId,
        contact_id: contactId,
        role_on_project: body.role,
        joined_at: new Date().toISOString(),
      },
      { onConflict: "project_id,contact_id" }
    );

  if (pcError) {
    return NextResponse.json({ error: pcError.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    project_name: projectName,
    contact_name: body.name.trim(),
  });
}
