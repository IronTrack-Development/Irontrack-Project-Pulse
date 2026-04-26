import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ companyId: string; areaId: string }> }
) {
  const { companyId, areaId } = await params;
  const supabase = getServiceClient();

  const { data: area, error } = await supabase
    .from("sub_handoff_areas")
    .select("*")
    .eq("id", areaId)
    .eq("company_id", companyId)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });

  // Get all handoffs for this area with department names
  const { data: handoffs } = await supabase
    .from("sub_handoffs")
    .select("*, from_dept:sub_departments!sub_handoffs_from_department_id_fkey(name), to_dept:sub_departments!sub_handoffs_to_department_id_fkey(name)")
    .eq("area_id", areaId)
    .order("created_at");

  const enrichedHandoffs = (handoffs || []).map((h: Record<string, unknown>) => {
    const fromDept = h.from_dept as { name: string } | null;
    const toDept = h.to_dept as { name: string } | null;
    return {
      ...h,
      from_department_name: fromDept?.name || null,
      to_department_name: toDept?.name || null,
      from_dept: undefined,
      to_dept: undefined,
    };
  });

  return NextResponse.json({ ...area, handoffs: enrichedHandoffs });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ companyId: string; areaId: string }> }
) {
  const { companyId, areaId } = await params;
  const supabase = getServiceClient();
  const body = await req.json();

  const { data, error } = await supabase
    .from("sub_handoff_areas")
    .update(body)
    .eq("id", areaId)
    .eq("company_id", companyId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ companyId: string; areaId: string }> }
) {
  const { companyId, areaId } = await params;
  const supabase = getServiceClient();

  const { error } = await supabase
    .from("sub_handoff_areas")
    .delete()
    .eq("id", areaId)
    .eq("company_id", companyId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
