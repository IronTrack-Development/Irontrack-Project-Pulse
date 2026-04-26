import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  const { companyId } = await params;
  const supabase = getServiceClient();
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = parseInt(searchParams.get("offset") || "0");
  const date = searchParams.get("date");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const foremanId = searchParams.get("foreman_id");
  const status = searchParams.get("status");

  let query = supabase
    .from("sub_dispatches")
    .select("*, sub_foremen(name)", { count: "exact" })
    .eq("company_id", companyId)
    .order("dispatch_date", { ascending: false });

  if (date) query = query.eq("dispatch_date", date);
  if (from) query = query.gte("dispatch_date", from);
  if (to) query = query.lte("dispatch_date", to);
  if (foremanId) query = query.eq("foreman_id", foremanId);
  if (status) query = query.eq("status", status);

  const { data, error, count } = await query.range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Flatten foreman name
  const dispatches = (data || []).map((d: Record<string, unknown>) => {
    const foreman = d.sub_foremen as { name: string } | null;
    return {
      ...d,
      foreman_name: foreman?.name || null,
      sub_foremen: undefined,
    };
  });

  return NextResponse.json({ data: dispatches, total: count });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  const { companyId } = await params;
  const supabase = getServiceClient();
  const body = await req.json();

  if (!body.foreman_id || !body.project_name || !body.dispatch_date || !body.scope_of_work) {
    return NextResponse.json(
      { error: "foreman_id, project_name, dispatch_date, and scope_of_work are required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("sub_dispatches")
    .insert({ ...body, company_id: companyId })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data, { status: 201 });
}
