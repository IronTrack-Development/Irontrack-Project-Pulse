import { NextRequest, NextResponse } from "next/server";
import { requireSubOpsCompanyAccess } from "@/lib/sub-ops-auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ companyId: string; foremanId: string }> }
) {
  const { companyId, foremanId } = await params;
  const access = await requireSubOpsCompanyAccess(companyId);
  if (access.response) return access.response;

  const supabase = access.supabase;

  const { data: foreman, error } = await supabase
    .from("sub_foremen")
    .select("*")
    .eq("id", foremanId)
    .eq("company_id", companyId)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });

  // Stats: total check-ins
  const { count: totalCheckins } = await supabase
    .from("sub_checkins")
    .select("*", { count: "exact", head: true })
    .eq("foreman_id", foremanId);

  // Stats: avg production (quantity per log)
  const { data: prodLogs } = await supabase
    .from("sub_production_logs")
    .select("quantity")
    .eq("foreman_id", foremanId)
    .not("quantity", "is", null);

  const avgProductionRate = prodLogs && prodLogs.length > 0
    ? prodLogs.reduce((sum, l) => sum + (l.quantity || 0), 0) / prodLogs.length
    : 0;

  // Stats: active dispatches
  const { count: activeDispatches } = await supabase
    .from("sub_dispatches")
    .select("*", { count: "exact", head: true })
    .eq("foreman_id", foremanId)
    .in("status", ["pending", "acknowledged", "in_progress"]);

  return NextResponse.json({
    ...foreman,
    stats: {
      total_checkins: totalCheckins || 0,
      avg_production_rate: Math.round(avgProductionRate * 100) / 100,
      active_dispatches: activeDispatches || 0,
    },
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ companyId: string; foremanId: string }> }
) {
  const { companyId, foremanId } = await params;
  const access = await requireSubOpsCompanyAccess(companyId);
  if (access.response) return access.response;

  const supabase = access.supabase;
  const body = await req.json();

  const { data, error } = await supabase
    .from("sub_foremen")
    .update(body)
    .eq("id", foremanId)
    .eq("company_id", companyId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ companyId: string; foremanId: string }> }
) {
  const { companyId, foremanId } = await params;
  const access = await requireSubOpsCompanyAccess(companyId);
  if (access.response) return access.response;

  const supabase = access.supabase;

  const { error } = await supabase
    .from("sub_foremen")
    .delete()
    .eq("id", foremanId)
    .eq("company_id", companyId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
