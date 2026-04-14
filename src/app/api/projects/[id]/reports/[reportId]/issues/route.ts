import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; reportId: string }> }
) {
  const { reportId } = await params;
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("report_issues")
    .select("*")
    .eq("report_id", reportId)
    .order("issue_number", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data || []);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; reportId: string }> }
) {
  const { id, reportId } = await params;
  const supabase = getServiceClient();
  const body = await req.json();

  const {
    title,
    note,
    location,
    priority = "medium",
    category = "qa_qc",
    trade,
    potential_impact,
    action_needed,
    photo_paths = [],
    photo_captions = [],
  } = body;

  if (!title) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  // Count existing issues to determine issue_number
  const { count } = await supabase
    .from("report_issues")
    .select("*", { count: "exact", head: true })
    .eq("report_id", reportId);

  const issueNumber = (count || 0) + 1;

  const { data: issue, error: issueError } = await supabase
    .from("report_issues")
    .insert({
      report_id: reportId,
      issue_number: issueNumber,
      title,
      note: note || null,
      location: location || null,
      priority,
      category,
      status: "open",
      trade: trade || null,
      potential_impact: potential_impact || null,
      action_needed: action_needed || null,
      photo_paths,
      photo_captions,
    })
    .select()
    .single();

  if (issueError) return NextResponse.json({ error: issueError.message }, { status: 500 });

  // Update issue_count on the report
  await supabase
    .from("issue_reports")
    .update({ issue_count: issueNumber })
    .eq("id", reportId);

  return NextResponse.json(issue, { status: 201 });
}
