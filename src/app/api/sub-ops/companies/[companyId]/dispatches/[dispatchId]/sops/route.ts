import { NextRequest, NextResponse } from "next/server";
import { requireSubOpsCompanyAccess } from "@/lib/sub-ops-auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ companyId: string; dispatchId: string }> }
) {
  const { companyId, dispatchId } = await params;
  const access = await requireSubOpsCompanyAccess(companyId);
  if (access.response) return access.response;

  const supabase = access.supabase;

  const { data, error } = await supabase
    .from("sub_dispatch_sops")
    .select("*, sub_sops(*)")
    .eq("dispatch_id", dispatchId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const sops = (data || []).map((ds: Record<string, unknown>) => ds.sub_sops);

  return NextResponse.json({ data: sops });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ companyId: string; dispatchId: string }> }
) {
  const { companyId, dispatchId } = await params;
  const access = await requireSubOpsCompanyAccess(companyId);
  if (access.response) return access.response;

  const supabase = access.supabase;
  const body = await req.json();

  if (!body.sop_id) {
    return NextResponse.json({ error: "sop_id is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("sub_dispatch_sops")
    .insert({ dispatch_id: dispatchId, sop_id: body.sop_id })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data, { status: 201 });
}
