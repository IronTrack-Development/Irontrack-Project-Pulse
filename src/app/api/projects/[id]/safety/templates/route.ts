import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

// GET /api/projects/[id]/safety/templates — list available templates (system + project-custom)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getServiceClient();
  const url = new URL(req.url);
  const category = url.searchParams.get("category");

  let query = supabase
    .from("toolbox_talk_templates")
    .select("*")
    .or(`is_system.eq.true,project_id.eq.${id}`)
    .order("category", { ascending: true })
    .order("title", { ascending: true });

  if (category) {
    query = query.eq("category", category);
  }

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ templates: data });
}

// POST /api/projects/[id]/safety/templates — create custom template for this project
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getServiceClient();
  const body = await req.json();

  const { data, error } = await supabase
    .from("toolbox_talk_templates")
    .insert({
      ...body,
      project_id: id,
      is_system: false,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

// PATCH /api/projects/[id]/safety/templates — update a custom template
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const supabase = getServiceClient();
  const body = await req.json();
  const { id: templateId, ...updates } = body;

  if (!templateId) {
    return NextResponse.json({ error: "Template id required" }, { status: 400 });
  }

  // Verify it's a custom template for this project
  const { data: existing } = await supabase
    .from("toolbox_talk_templates")
    .select("is_system, project_id")
    .eq("id", templateId)
    .single();

  if (!existing) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }
  if (existing.is_system) {
    return NextResponse.json({ error: "Cannot modify system templates" }, { status: 403 });
  }
  if (existing.project_id !== projectId) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("toolbox_talk_templates")
    .update(updates)
    .eq("id", templateId)
    .eq("project_id", projectId)
    .eq("is_system", false)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE /api/projects/[id]/safety/templates — delete a custom template
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const supabase = getServiceClient();
  const body = await req.json();
  const { id: templateId } = body;

  if (!templateId) {
    return NextResponse.json({ error: "Template id required" }, { status: 400 });
  }

  // Verify it's a custom template for this project
  const { data: existing } = await supabase
    .from("toolbox_talk_templates")
    .select("is_system, project_id")
    .eq("id", templateId)
    .single();

  if (!existing) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }
  if (existing.is_system) {
    return NextResponse.json({ error: "Cannot delete system templates" }, { status: 403 });
  }
  if (existing.project_id !== projectId) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  const { error } = await supabase
    .from("toolbox_talk_templates")
    .delete()
    .eq("id", templateId)
    .eq("project_id", projectId)
    .eq("is_system", false);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
