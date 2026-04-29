import { NextRequest, NextResponse } from "next/server";
import { requireSubOpsCompanyAccess } from "@/lib/sub-ops-auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ companyId: string; sopId: string }> }
) {
  const { companyId, sopId } = await params;
  const access = await requireSubOpsCompanyAccess(companyId);
  if (access.response) return access.response;

  const supabase = access.supabase;

  const { data: sop, error } = await supabase
    .from("sub_sops")
    .select("*")
    .eq("id", sopId)
    .eq("company_id", companyId)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });

  // Get acknowledgment list
  const { data: acknowledgments } = await supabase
    .from("sub_sop_acknowledgments")
    .select("*, sub_foremen(name)")
    .eq("sop_id", sopId);

  const ackList = (acknowledgments || []).map((a: Record<string, unknown>) => {
    const foreman = a.sub_foremen as { name: string } | null;
    return {
      ...a,
      foreman_name: foreman?.name || null,
      sub_foremen: undefined,
    };
  });

  return NextResponse.json({
    ...sop,
    acknowledgments: ackList,
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ companyId: string; sopId: string }> }
) {
  const { companyId, sopId } = await params;
  const access = await requireSubOpsCompanyAccess(companyId);
  if (access.response) return access.response;

  const supabase = access.supabase;
  const body = await req.json();

  const { data, error } = await supabase
    .from("sub_sops")
    .update(body)
    .eq("id", sopId)
    .eq("company_id", companyId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ companyId: string; sopId: string }> }
) {
  const { companyId, sopId } = await params;
  const access = await requireSubOpsCompanyAccess(companyId);
  if (access.response) return access.response;

  const supabase = access.supabase;

  const { error } = await supabase
    .from("sub_sops")
    .delete()
    .eq("id", sopId)
    .eq("company_id", companyId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}


