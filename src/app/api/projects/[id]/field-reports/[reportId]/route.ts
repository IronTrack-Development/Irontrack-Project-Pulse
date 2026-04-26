import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

// GET /api/projects/[id]/field-reports/[reportId]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; reportId: string }> }
) {
  const { id, reportId } = await params;
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("field_reports")
    .select("*")
    .eq("id", reportId)
    .eq("project_id", id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: error.code === "PGRST116" ? 404 : 500 });
  return NextResponse.json(data);
}

// PATCH /api/projects/[id]/field-reports/[reportId]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; reportId: string }> }
) {
  const { id, reportId } = await params;
  const supabase = getServiceClient();
  const body = await req.json();

  // If resolving, set resolved_at
  const updates: Record<string, unknown> = { ...body };
  if (body.status === "resolved" && !body.resolved_at) {
    updates.resolved_at = new Date().toISOString();
  }
  // If reopening, clear resolved_at
  if (body.status && body.status !== "resolved") {
    updates.resolved_at = null;
  }

  const { data, error } = await supabase
    .from("field_reports")
    .update(updates)
    .eq("id", reportId)
    .eq("project_id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE /api/projects/[id]/field-reports/[reportId]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; reportId: string }> }
) {
  const { id, reportId } = await params;
  const supabase = getServiceClient();

  const { error } = await supabase
    .from("field_reports")
    .delete()
    .eq("id", reportId)
    .eq("project_id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
