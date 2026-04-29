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
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = parseInt(searchParams.get("offset") || "0");
  const status = searchParams.get("status");
  const category = searchParams.get("category");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const foremanId = searchParams.get("foreman_id") || searchParams.get("foreman");

  let query = supabase
    .from("sub_blockers")
    .select("*, sub_foremen(name)", { count: "exact" })
    .eq("company_id", companyId)
    .order("blocker_date", { ascending: false });

  if (status) query = query.eq("status", status);
  if (category) query = query.eq("category", category);
  if (from) query = query.gte("blocker_date", from);
  if (to) query = query.lte("blocker_date", to);
  if (foremanId) query = query.eq("foreman_id", foremanId);

  const { data, error, count } = await query.range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const blockers = (data || []).map((b: Record<string, unknown>) => {
    const foreman = b.sub_foremen as { name: string } | null;
    return {
      ...b,
      foreman_name: foreman?.name || null,
      sub_foremen: undefined,
    };
  });

  return NextResponse.json({ data: blockers, total: count });
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

  if (!body.foreman_id || !body.description || !body.blocker_date) {
    return NextResponse.json(
      { error: "foreman_id, description, and blocker_date are required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("sub_blockers")
    .insert({ ...body, company_id: companyId })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data, { status: 201 });
}




