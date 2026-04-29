import { NextRequest, NextResponse } from "next/server";
import { requireSubOpsCompanyAccess } from "@/lib/sub-ops-auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ companyId: string; checkinId: string }> }
) {
  const { companyId, checkinId } = await params;
  const access = await requireSubOpsCompanyAccess(companyId);
  if (access.response) return access.response;

  const supabase = access.supabase;
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = parseInt(searchParams.get("offset") || "0");

  const { data, error, count } = await supabase
    .from("sub_production_logs")
    .select("*", { count: "exact" })
    .eq("checkin_id", checkinId)
    .eq("company_id", companyId)
    .order("created_at")
    .range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data, total: count });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ companyId: string; checkinId: string }> }
) {
  const { companyId, checkinId } = await params;
  const access = await requireSubOpsCompanyAccess(companyId);
  if (access.response) return access.response;

  const supabase = access.supabase;
  const body = await req.json();

  if (!body.description || !body.log_date) {
    return NextResponse.json(
      { error: "description and log_date are required" },
      { status: 400 }
    );
  }

  // Get foreman_id from the check-in
  const { data: checkin } = await supabase
    .from("sub_checkins")
    .select("foreman_id")
    .eq("id", checkinId)
    .single();

  if (!checkin) {
    return NextResponse.json({ error: "Check-in not found" }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("sub_production_logs")
    .insert({
      ...body,
      checkin_id: checkinId,
      company_id: companyId,
      foreman_id: body.foreman_id || checkin.foreman_id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data, { status: 201 });
}
