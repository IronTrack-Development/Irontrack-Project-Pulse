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
  const date = searchParams.get("date");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const foremanId = searchParams.get("foreman_id");

  let query = supabase
    .from("sub_checkins")
    .select("*, sub_foremen(name)", { count: "exact" })
    .eq("company_id", companyId)
    .order("checkin_date", { ascending: false });

  if (date) query = query.eq("checkin_date", date);
  if (from) query = query.gte("checkin_date", from);
  if (to) query = query.lte("checkin_date", to);
  if (foremanId) query = query.eq("foreman_id", foremanId);

  const { data, error, count } = await query.range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const checkins = (data || []).map((c: Record<string, unknown>) => {
    const foreman = c.sub_foremen as { name: string } | null;
    return {
      ...c,
      foreman_name: foreman?.name || null,
      sub_foremen: undefined,
    };
  });

  return NextResponse.json({ data: checkins, total: count });
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

  if (!body.foreman_id || !body.checkin_date) {
    return NextResponse.json(
      { error: "foreman_id and checkin_date are required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("sub_checkins")
    .insert({ ...body, company_id: companyId })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data, { status: 201 });
}




