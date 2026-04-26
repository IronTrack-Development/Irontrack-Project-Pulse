import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ companyId: string; blockerId: string }> }
) {
  const { companyId, blockerId } = await params;
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("sub_blockers")
    .select("*, sub_foremen(name)")
    .eq("id", blockerId)
    .eq("company_id", companyId)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });

  const foreman = data.sub_foremen as { name: string } | null;

  return NextResponse.json({
    ...data,
    foreman_name: foreman?.name || null,
    sub_foremen: undefined,
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ companyId: string; blockerId: string }> }
) {
  const { companyId, blockerId } = await params;
  const supabase = getServiceClient();
  const body = await req.json();

  // If resolving, set resolved_at
  if (body.status === "resolved" && !body.resolved_at) {
    body.resolved_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("sub_blockers")
    .update(body)
    .eq("id", blockerId)
    .eq("company_id", companyId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ companyId: string; blockerId: string }> }
) {
  const { companyId, blockerId } = await params;
  const supabase = getServiceClient();

  const { error } = await supabase
    .from("sub_blockers")
    .delete()
    .eq("id", blockerId)
    .eq("company_id", companyId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
