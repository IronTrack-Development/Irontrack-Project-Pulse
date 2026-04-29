import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { requireSubOpsCompanyAccess } from "@/lib/sub-ops-auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  const { companyId } = await params;
  const access = await requireSubOpsCompanyAccess(companyId);
  if (access.response) return access.response;

  const supabase = access.supabase;
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const areaId = searchParams.get("area_id");
  const departmentId = searchParams.get("department_id");

  let query = supabase
    .from("sub_handoffs")
    .select("*, from_dept:sub_departments!sub_handoffs_from_department_id_fkey(name), to_dept:sub_departments!sub_handoffs_to_department_id_fkey(name), sub_handoff_areas(area_name)")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);
  if (areaId) query = query.eq("area_id", areaId);
  if (departmentId) {
    query = query.or(`from_department_id.eq.${departmentId},to_department_id.eq.${departmentId}`);
  }

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const handoffs = (data || []).map((h: Record<string, unknown>) => {
    const fromDept = h.from_dept as { name: string } | null;
    const toDept = h.to_dept as { name: string } | null;
    const area = h.sub_handoff_areas as { area_name: string } | null;
    return {
      ...h,
      from_department_name: fromDept?.name || null,
      to_department_name: toDept?.name || null,
      area_name: area?.area_name || null,
      from_dept: undefined,
      to_dept: undefined,
      sub_handoff_areas: undefined,
    };
  });

  return NextResponse.json({ data: handoffs });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  const { companyId } = await params;
  const access = await requireSubOpsCompanyAccess(companyId);
  if (access.response) return access.response;

  const supabase = access.supabase;
  const body = await req.json();

  if (!body.area_id || !body.from_department_id || !body.to_department_id) {
    return NextResponse.json(
      { error: "area_id, from_department_id, and to_department_id are required" },
      { status: 400 }
    );
  }

  const { data: handoff, error } = await supabase
    .from("sub_handoffs")
    .insert({
      company_id: companyId,
      area_id: body.area_id,
      from_department_id: body.from_department_id,
      to_department_id: body.to_department_id,
      status: body.status || "not_started",
      notes: body.notes || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // If template_id provided, apply checklist template
  if (body.template_id && handoff) {
    const { data: template } = await supabase
      .from("sub_handoff_checklist_templates")
      .select("items")
      .eq("id", body.template_id)
      .single();

    if (template && template.items && template.items.length > 0) {
      const checklistItems = template.items.map((item: string, idx: number) => ({
        handoff_id: handoff.id,
        item_text: item,
        sort_order: idx,
      }));

      await supabase.from("sub_handoff_checklist_items").insert(checklistItems);
    }
  }

  return NextResponse.json(handoff, { status: 201 });
}


