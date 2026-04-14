import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; reportId: string }> }
) {
  const { id, reportId } = await params;
  const supabase = getServiceClient();

  const { data: report, error: reportError } = await supabase
    .from("issue_reports")
    .select("*")
    .eq("id", reportId)
    .eq("project_id", id)
    .single();

  if (reportError) return NextResponse.json({ error: reportError.message }, { status: 404 });

  const { data: issues, error: issuesError } = await supabase
    .from("report_issues")
    .select("*")
    .eq("report_id", reportId)
    .order("issue_number", { ascending: true });

  if (issuesError) return NextResponse.json({ error: issuesError.message }, { status: 500 });

  return NextResponse.json({ ...report, issues: issues || [] });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; reportId: string }> }
) {
  const { id, reportId } = await params;
  const supabase = getServiceClient();
  const body = await req.json();

  const allowed = ["status", "overall_assessment", "pdf_path", "prepared_by", "issue_count"];
  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }

  const { data, error } = await supabase
    .from("issue_reports")
    .update(updates)
    .eq("id", reportId)
    .eq("project_id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; reportId: string }> }
) {
  const { id, reportId } = await params;
  const supabase = getServiceClient();

  // Delete issues first (cascade should handle it, but explicit is safer)
  await supabase.from("report_issues").delete().eq("report_id", reportId);

  const { error } = await supabase
    .from("issue_reports")
    .delete()
    .eq("id", reportId)
    .eq("project_id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
