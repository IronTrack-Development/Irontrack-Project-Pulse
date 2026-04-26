import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  const { companyId } = await params;
  const supabase = getServiceClient();

  const { data: departments, error } = await supabase
    .from("sub_departments")
    .select("*")
    .eq("company_id", companyId)
    .order("sort_order");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Get crew counts per department
  const { data: crewCounts } = await supabase
    .from("sub_crew_members")
    .select("department_id")
    .eq("company_id", companyId)
    .eq("status", "active");

  const countMap: Record<string, number> = {};
  (crewCounts || []).forEach((c: { department_id: string | null }) => {
    if (c.department_id) {
      countMap[c.department_id] = (countMap[c.department_id] || 0) + 1;
    }
  });

  const enriched = (departments || []).map((d: Record<string, unknown>) => ({
    ...d,
    crew_count: countMap[d.id as string] || 0,
  }));

  return NextResponse.json({ data: enriched });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  const { companyId } = await params;
  const supabase = getServiceClient();
  const body = await req.json();

  if (!body.name) {
    return NextResponse.json({ error: "Department name is required" }, { status: 400 });
  }

  // Get next sort_order
  const { data: existing } = await supabase
    .from("sub_departments")
    .select("sort_order")
    .eq("company_id", companyId)
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextOrder = existing && existing.length > 0 ? (existing[0].sort_order || 0) + 1 : 0;

  const { data, error } = await supabase
    .from("sub_departments")
    .insert({ ...body, company_id: companyId, sort_order: body.sort_order ?? nextOrder })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data, { status: 201 });
}
