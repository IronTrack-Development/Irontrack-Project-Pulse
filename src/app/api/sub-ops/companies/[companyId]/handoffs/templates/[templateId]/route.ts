import { NextRequest, NextResponse } from "next/server";
import { requireSubOpsCompanyAccess } from "@/lib/sub-ops-auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ companyId: string; templateId: string }> }
) {
  const { companyId, templateId } = await params;
  const access = await requireSubOpsCompanyAccess(companyId);
  if (access.response) return access.response;

  const supabase = access.supabase;

  const { data, error } = await supabase
    .from("sub_handoff_checklist_templates")
    .select("*")
    .eq("id", templateId)
    .eq("company_id", companyId)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });

  return NextResponse.json(data);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ companyId: string; templateId: string }> }
) {
  const { companyId, templateId } = await params;
  const access = await requireSubOpsCompanyAccess(companyId);
  if (access.response) return access.response;

  const supabase = access.supabase;
  const body = await req.json();

  const { data, error } = await supabase
    .from("sub_handoff_checklist_templates")
    .update(body)
    .eq("id", templateId)
    .eq("company_id", companyId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ companyId: string; templateId: string }> }
) {
  const { companyId, templateId } = await params;
  const access = await requireSubOpsCompanyAccess(companyId);
  if (access.response) return access.response;

  const supabase = access.supabase;

  const { error } = await supabase
    .from("sub_handoff_checklist_templates")
    .delete()
    .eq("id", templateId)
    .eq("company_id", companyId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
