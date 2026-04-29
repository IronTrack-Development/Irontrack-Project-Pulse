import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { requireSubOpsCompanyAccess } from "@/lib/sub-ops-auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  const { companyId } = await params;
  const access = await requireSubOpsCompanyAccess(companyId);
  if (access.response) return access.response;

  const supabase = access.supabase;

  const { data, error } = await supabase
    .from("sub_handoff_checklist_templates")
    .select("*, from_dept:sub_departments!sub_handoff_checklist_templates_from_department_id_fkey(name), to_dept:sub_departments!sub_handoff_checklist_templates_to_department_id_fkey(name)")
    .eq("company_id", companyId)
    .order("title");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const templates = (data || []).map((t: Record<string, unknown>) => {
    const fromDept = t.from_dept as { name: string } | null;
    const toDept = t.to_dept as { name: string } | null;
    return {
      ...t,
      from_department_name: fromDept?.name || null,
      to_department_name: toDept?.name || null,
      from_dept: undefined,
      to_dept: undefined,
    };
  });

  return NextResponse.json({ data: templates });
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

  if (!body.title || !body.items || body.items.length === 0) {
    return NextResponse.json({ error: "title and items are required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("sub_handoff_checklist_templates")
    .insert({
      company_id: companyId,
      title: body.title,
      from_department_id: body.from_department_id || null,
      to_department_id: body.to_department_id || null,
      items: body.items,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data, { status: 201 });
}


