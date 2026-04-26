import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ companyId: string; checkinId: string }> }
) {
  const { companyId, checkinId } = await params;
  const supabase = getServiceClient();

  const { data: checkin, error } = await supabase
    .from("sub_checkins")
    .select("*, sub_foremen(name)")
    .eq("id", checkinId)
    .eq("company_id", companyId)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });

  // Get production logs for this check-in
  const { data: productionLogs } = await supabase
    .from("sub_production_logs")
    .select("*")
    .eq("checkin_id", checkinId)
    .order("created_at");

  const foreman = checkin.sub_foremen as { name: string } | null;

  return NextResponse.json({
    ...checkin,
    foreman_name: foreman?.name || null,
    sub_foremen: undefined,
    production_logs: productionLogs || [],
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ companyId: string; checkinId: string }> }
) {
  const { companyId, checkinId } = await params;
  const supabase = getServiceClient();
  const body = await req.json();

  const { data, error } = await supabase
    .from("sub_checkins")
    .update(body)
    .eq("id", checkinId)
    .eq("company_id", companyId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}
