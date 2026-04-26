import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  const { companyId } = await params;
  const supabase = getServiceClient();

  const today = new Date().toISOString().split("T")[0];
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  // Foremen counts
  const [
    { count: activeForemen },
    { count: inactiveForemen },
  ] = await Promise.all([
    supabase.from("sub_foremen").select("*", { count: "exact", head: true }).eq("company_id", companyId).eq("status", "active"),
    supabase.from("sub_foremen").select("*", { count: "exact", head: true }).eq("company_id", companyId).eq("status", "inactive"),
  ]);

  // Today's dispatches
  const { data: todayDispatches } = await supabase
    .from("sub_dispatches")
    .select("id, foreman_id, acknowledged, status")
    .eq("company_id", companyId)
    .eq("dispatch_date", today);

  const totalDispatches = todayDispatches?.length || 0;
  const acknowledgedDispatches = todayDispatches?.filter(d => d.acknowledged).length || 0;
  const pendingDispatches = totalDispatches - acknowledgedDispatches;

  // Today's check-ins
  const { data: todayCheckins } = await supabase
    .from("sub_checkins")
    .select("foreman_id, sub_foremen(name)")
    .eq("company_id", companyId)
    .eq("checkin_date", today);

  const checkedInForemanIds = new Set((todayCheckins || []).map((c: Record<string, unknown>) => c.foreman_id));

  // Get all active foremen to determine who didn't check in
  const { data: allForemen } = await supabase
    .from("sub_foremen")
    .select("id, name")
    .eq("company_id", companyId)
    .eq("status", "active");

  const checkedIn = (todayCheckins || []).map((c: Record<string, unknown>) => {
    const foreman = c.sub_foremen as { name: string } | null;
    return { foreman_id: c.foreman_id, foreman_name: foreman?.name || null };
  });

  const notCheckedIn = (allForemen || [])
    .filter(f => !checkedInForemanIds.has(f.id))
    .map(f => ({ foreman_id: f.id, foreman_name: f.name }));

  // Open blockers
  const { count: openBlockers } = await supabase
    .from("sub_blockers")
    .select("*", { count: "exact", head: true })
    .eq("company_id", companyId)
    .eq("status", "open");

  // This week's production summary
  const { data: weekProduction } = await supabase
    .from("sub_production_logs")
    .select("quantity, unit, description")
    .eq("company_id", companyId)
    .gte("log_date", weekAgo)
    .lte("log_date", today);

  const productionSummary = {
    total_logs: weekProduction?.length || 0,
    total_quantity: (weekProduction || []).reduce((sum, l) => sum + (l.quantity || 0), 0),
  };

  // SOPs with low acknowledgment rates
  const { data: sops } = await supabase
    .from("sub_sops")
    .select("id, title, category")
    .eq("company_id", companyId)
    .eq("is_active", true);

  const totalForemanCount = activeForemen || 0;
  const lowAckSops: { id: string; title: string; category: string; ack_count: number; ack_rate: number }[] = [];

  if (sops && totalForemanCount > 0) {
    for (const sop of sops) {
      const { count: ackCount } = await supabase
        .from("sub_sop_acknowledgments")
        .select("*", { count: "exact", head: true })
        .eq("sop_id", sop.id);

      const rate = (ackCount || 0) / totalForemanCount;
      if (rate < 0.8) {
        lowAckSops.push({
          id: sop.id,
          title: sop.title,
          category: sop.category,
          ack_count: ackCount || 0,
          ack_rate: Math.round(rate * 100),
        });
      }
    }
  }

  return NextResponse.json({
    foremen: {
      active: activeForemen || 0,
      inactive: inactiveForemen || 0,
      total: (activeForemen || 0) + (inactiveForemen || 0),
    },
    dispatches: {
      total: totalDispatches,
      acknowledged: acknowledgedDispatches,
      pending: pendingDispatches,
    },
    checkins: {
      checked_in: checkedIn,
      not_checked_in: notCheckedIn,
      total_checked_in: checkedIn.length,
      total_not_checked_in: notCheckedIn.length,
    },
    blockers: {
      open: openBlockers || 0,
    },
    production: productionSummary,
    sops_low_acknowledgment: lowAckSops,
  });
}
