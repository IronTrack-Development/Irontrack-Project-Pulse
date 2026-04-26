import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ companyId: string; dispatchId: string }> }
) {
  const { companyId, dispatchId } = await params;
  const supabase = getServiceClient();

  const { data: dispatch, error } = await supabase
    .from("sub_dispatches")
    .select("*, sub_foremen(name)")
    .eq("id", dispatchId)
    .eq("company_id", companyId)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });

  // Get linked SOPs
  const { data: dispatchSops } = await supabase
    .from("sub_dispatch_sops")
    .select("*, sub_sops(*)")
    .eq("dispatch_id", dispatchId);

  const foreman = dispatch.sub_foremen as { name: string } | null;
  const sops = (dispatchSops || []).map((ds: Record<string, unknown>) => ds.sub_sops);

  return NextResponse.json({
    ...dispatch,
    foreman_name: foreman?.name || null,
    sub_foremen: undefined,
    sops,
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ companyId: string; dispatchId: string }> }
) {
  const { companyId, dispatchId } = await params;
  const supabase = getServiceClient();
  const body = await req.json();

  const { data, error } = await supabase
    .from("sub_dispatches")
    .update(body)
    .eq("id", dispatchId)
    .eq("company_id", companyId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ companyId: string; dispatchId: string }> }
) {
  const { companyId, dispatchId } = await params;
  const supabase = getServiceClient();

  const { error } = await supabase
    .from("sub_dispatches")
    .delete()
    .eq("id", dispatchId)
    .eq("company_id", companyId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
