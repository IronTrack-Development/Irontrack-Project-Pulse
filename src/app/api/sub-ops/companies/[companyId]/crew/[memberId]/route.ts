import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ companyId: string; memberId: string }> }
) {
  const { companyId, memberId } = await params;
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("sub_crew_members")
    .select("*, sub_departments(name)")
    .eq("id", memberId)
    .eq("company_id", companyId)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });

  const dept = data.sub_departments as { name: string } | null;
  return NextResponse.json({
    ...data,
    department_name: dept?.name || null,
    sub_departments: undefined,
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ companyId: string; memberId: string }> }
) {
  const { companyId, memberId } = await params;
  const supabase = getServiceClient();
  const body = await req.json();

  const { data, error } = await supabase
    .from("sub_crew_members")
    .update(body)
    .eq("id", memberId)
    .eq("company_id", companyId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ companyId: string; memberId: string }> }
) {
  const { companyId, memberId } = await params;
  const supabase = getServiceClient();

  const { error } = await supabase
    .from("sub_crew_members")
    .delete()
    .eq("id", memberId)
    .eq("company_id", companyId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
