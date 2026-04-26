import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getServiceClient();
  const { searchParams } = new URL(req.url);

  const status = searchParams.get("status");
  const trade = searchParams.get("trade");
  const building = searchParams.get("building");
  const phase = searchParams.get("phase");
  const search = searchParams.get("search");
  const startAfter = searchParams.get("start_after");
  const finishBefore = searchParams.get("finish_before");
  const sort = searchParams.get("sort") || "start_date";
  const dir = searchParams.get("dir") === "desc" ? false : true;

  let query = supabase
    .from("parsed_activities")
    .select("id, activity_id, activity_name, trade, start_date, finish_date, actual_start, actual_finish, percent_complete, status, original_duration, remaining_duration, milestone, float_days, is_critical, normalized_building, normalized_area, normalized_phase, normalized_trade, wbs, predecessor_ids, successor_ids, project_id")
    .eq("project_id", id)
    .order(sort as string, { ascending: dir });

  if (status) query = query.eq("status", status);
  if (trade) query = query.eq("trade", trade);
  if (building) query = query.eq("normalized_building", building);
  if (phase) query = query.eq("normalized_phase", phase);
  if (startAfter) query = query.gte("start_date", startAfter);
  if (finishBefore) query = query.lte("finish_date", finishBefore);
  if (search) query = query.ilike("activity_name", `%${search}%`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data || []);
}
