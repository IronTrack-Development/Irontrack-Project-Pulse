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

  let query = supabase
    .from("issue_reports")
    .select("*")
    .eq("project_id", id)
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data || []);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getServiceClient();
  const body = await req.json();

  const { activity_id, activity_name, project_name, trade, normalized_building, prepared_by } = body;

  if (!activity_name) {
    return NextResponse.json({ error: "activity_name is required" }, { status: 400 });
  }

  // Count existing reports to auto-generate report_number
  const { count } = await supabase
    .from("issue_reports")
    .select("*", { count: "exact", head: true })
    .eq("project_id", id);

  const reportNumber = `IR-${String((count || 0) + 1).padStart(3, "0")}`;

  const { data, error } = await supabase
    .from("issue_reports")
    .insert({
      project_id: id,
      activity_id: activity_id || null,
      activity_name,
      project_name: project_name || null,
      trade: trade || null,
      normalized_building: normalized_building || null,
      prepared_by: prepared_by || null,
      report_number: reportNumber,
      status: "draft",
      issue_count: 0,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data, { status: 201 });
}
