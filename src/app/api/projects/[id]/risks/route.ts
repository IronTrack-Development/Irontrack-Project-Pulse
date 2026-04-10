import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getServiceClient();
  const { searchParams } = new URL(req.url);
  const severity = searchParams.get("severity");

  let query = supabase
    .from("daily_risks")
    .select(`*, parsed_activities(activity_name, trade, start_date, finish_date)`)
    .eq("project_id", id)
    .order("severity")
    .order("detected_at", { ascending: false });

  if (severity) query = query.eq("severity", severity);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data || []);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getServiceClient();
  const body = await req.json();
  const { riskId, status } = body;

  const { data, error } = await supabase
    .from("daily_risks")
    .update({ status })
    .eq("id", riskId)
    .eq("project_id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
