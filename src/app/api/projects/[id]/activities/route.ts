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
  const search = searchParams.get("search");
  const startAfter = searchParams.get("start_after");
  const finishBefore = searchParams.get("finish_before");
  const sort = searchParams.get("sort") || "start_date";
  const dir = searchParams.get("dir") === "desc" ? false : true;

  let query = supabase
    .from("parsed_activities")
    .select("*")
    .eq("project_id", id)
    .order(sort as string, { ascending: dir });

  if (status) query = query.eq("status", status);
  if (trade) query = query.eq("trade", trade);
  if (startAfter) query = query.gte("start_date", startAfter);
  if (finishBefore) query = query.lte("finish_date", finishBefore);
  if (search) query = query.ilike("activity_name", `%${search}%`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data || []);
}
