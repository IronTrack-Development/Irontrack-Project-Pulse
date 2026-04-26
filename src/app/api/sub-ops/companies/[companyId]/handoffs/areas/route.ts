import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  const { companyId } = await params;
  const supabase = getServiceClient();

  const { data: areas, error } = await supabase
    .from("sub_handoff_areas")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Get handoff counts and completion % per area
  const areaIds = (areas || []).map((a: Record<string, unknown>) => a.id as string);

  if (areaIds.length === 0) {
    return NextResponse.json({ data: [] });
  }

  const { data: handoffs } = await supabase
    .from("sub_handoffs")
    .select("area_id, status")
    .in("area_id", areaIds);

  const areaStats: Record<string, { total: number; accepted: number }> = {};
  (handoffs || []).forEach((h: { area_id: string; status: string }) => {
    if (!areaStats[h.area_id]) areaStats[h.area_id] = { total: 0, accepted: 0 };
    areaStats[h.area_id].total++;
    if (h.status === "accepted") areaStats[h.area_id].accepted++;
  });

  const enriched = (areas || []).map((a: Record<string, unknown>) => {
    const stats = areaStats[a.id as string] || { total: 0, accepted: 0 };
    return {
      ...a,
      handoff_count: stats.total,
      completion_pct: stats.total > 0 ? Math.round((stats.accepted / stats.total) * 100) : 0,
    };
  });

  return NextResponse.json({ data: enriched });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  const { companyId } = await params;
  const supabase = getServiceClient();
  const body = await req.json();

  if (!body.project_name || !body.area_name) {
    return NextResponse.json({ error: "project_name and area_name are required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("sub_handoff_areas")
    .insert({ ...body, company_id: companyId })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data, { status: 201 });
}
