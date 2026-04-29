import { NextRequest, NextResponse } from "next/server";
import { requireSubOpsCompanyAccess } from "@/lib/sub-ops-auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ companyId: string; handoffId: string }> }
) {
  const { companyId, handoffId } = await params;
  const access = await requireSubOpsCompanyAccess(companyId);
  if (access.response) return access.response;

  const supabase = access.supabase;

  const { data: handoff, error } = await supabase
    .from("sub_handoffs")
    .select("*, from_dept:sub_departments!sub_handoffs_from_department_id_fkey(name, color), to_dept:sub_departments!sub_handoffs_to_department_id_fkey(name, color), sub_handoff_areas(area_name, project_name)")
    .eq("id", handoffId)
    .eq("company_id", companyId)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });

  // Get checklist items
  const { data: checklist } = await supabase
    .from("sub_handoff_checklist_items")
    .select("*")
    .eq("handoff_id", handoffId)
    .order("sort_order");

  // Get photos
  const { data: photos } = await supabase
    .from("sub_handoff_photos")
    .select("*")
    .eq("handoff_id", handoffId)
    .order("created_at", { ascending: false });

  const fromDept = handoff.from_dept as { name: string; color: string } | null;
  const toDept = handoff.to_dept as { name: string; color: string } | null;
  const area = handoff.sub_handoff_areas as { area_name: string; project_name: string } | null;

  return NextResponse.json({
    ...handoff,
    from_department_name: fromDept?.name || null,
    from_department_color: fromDept?.color || null,
    to_department_name: toDept?.name || null,
    to_department_color: toDept?.color || null,
    area_name: area?.area_name || null,
    project_name: area?.project_name || null,
    from_dept: undefined,
    to_dept: undefined,
    sub_handoff_areas: undefined,
    checklist: checklist || [],
    photos: photos || [],
    checklist_total: (checklist || []).length,
    checklist_complete: (checklist || []).filter((c: Record<string, unknown>) => c.completed).length,
    photo_count: (photos || []).length,
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ companyId: string; handoffId: string }> }
) {
  const { companyId, handoffId } = await params;
  const access = await requireSubOpsCompanyAccess(companyId);
  if (access.response) return access.response;

  const supabase = access.supabase;
  const body = await req.json();

  // Auto-set dates based on status
  if (body.status === "handed_off" && !body.handoff_date) {
    body.handoff_date = new Date().toISOString().split("T")[0];
  }
  if (body.status === "accepted" && !body.accepted_date) {
    body.accepted_date = new Date().toISOString().split("T")[0];
  }

  const { data, error } = await supabase
    .from("sub_handoffs")
    .update(body)
    .eq("id", handoffId)
    .eq("company_id", companyId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ companyId: string; handoffId: string }> }
) {
  const { companyId, handoffId } = await params;
  const access = await requireSubOpsCompanyAccess(companyId);
  if (access.response) return access.response;

  const supabase = access.supabase;

  const { error } = await supabase
    .from("sub_handoffs")
    .delete()
    .eq("id", handoffId)
    .eq("company_id", companyId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
