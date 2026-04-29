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
  const limit = parseInt(searchParams.get("limit") || "100");
  const offset = parseInt(searchParams.get("offset") || "0");
  const department = searchParams.get("department");
  const role = searchParams.get("role");
  const status = searchParams.get("status") || "active";

  let query = supabase
    .from("sub_crew_members")
    .select("*, sub_departments(name)", { count: "exact" })
    .eq("company_id", companyId)
    .order("name");

  if (department) query = query.eq("department_id", department);
  if (role) query = query.eq("role", role);
  if (status) query = query.eq("status", status);

  const { data, error, count } = await query.range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const members = (data || []).map((m: Record<string, unknown>) => {
    const dept = m.sub_departments as { name: string } | null;
    return {
      ...m,
      department_name: dept?.name || null,
      sub_departments: undefined,
    };
  });

  return NextResponse.json({ data: members, total: count });
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

  if (!body.name) {
    return NextResponse.json({ error: "Crew member name is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("sub_crew_members")
    .insert({ ...body, company_id: companyId })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data, { status: 201 });
}


