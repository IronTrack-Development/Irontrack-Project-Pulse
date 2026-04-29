import { NextRequest, NextResponse } from "next/server";
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
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const foremanId = searchParams.get("foreman_id") || searchParams.get("foreman");
  const projectName = searchParams.get("project");

  let query = supabase
    .from("sub_production_logs")
    .select("*, sub_foremen(name)", { count: "exact" })
    .eq("company_id", companyId)
    .order("log_date", { ascending: false });

  if (from) query = query.gte("log_date", from);
  if (to) query = query.lte("log_date", to);
  if (foremanId) query = query.eq("foreman_id", foremanId);
  if (projectName) query = query.ilike("area", `%${projectName}%`);

  const { data, error, count } = await query.range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const entries = (data || []).map((entry: Record<string, unknown>) => {
    const foreman = entry.sub_foremen as { name?: string } | null;
    return {
      ...entry,
      date: entry.log_date,
      foreman_name: foreman?.name || null,
      photo_url: entry.photo_path || null,
      sub_foremen: undefined,
    };
  });

  const totalCrewHours = entries.reduce((sum, entry: Record<string, unknown>) => {
    if (entry.unit === "HR" && typeof entry.quantity === "number") return sum + entry.quantity;
    return sum;
  }, 0);

  return NextResponse.json({
    data: entries,
    total: count,
    summary: {
      total_entries: count || entries.length,
      total_crew_hours: totalCrewHours,
    },
  });
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

  if (!body.foreman_id || !body.description || !body.log_date) {
    return NextResponse.json(
      { error: "foreman_id, description, and log_date are required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("sub_production_logs")
    .insert({ ...body, company_id: companyId })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data, { status: 201 });
}

