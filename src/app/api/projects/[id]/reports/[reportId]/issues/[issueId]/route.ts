import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; reportId: string; issueId: string }> }
) {
  const { reportId, issueId } = await params;
  const supabase = getServiceClient();
  const body = await req.json();

  const allowed = [
    "title", "note", "location", "priority", "category", "status",
    "trade", "potential_impact", "action_needed", "photo_paths", "photo_captions",
  ];
  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }

  const { data, error } = await supabase
    .from("report_issues")
    .update(updates)
    .eq("id", issueId)
    .eq("report_id", reportId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; reportId: string; issueId: string }> }
) {
  const { id, reportId, issueId } = await params;
  const supabase = getServiceClient();

  const { error } = await supabase
    .from("report_issues")
    .delete()
    .eq("id", issueId)
    .eq("report_id", reportId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Recalculate issue_count
  const { count } = await supabase
    .from("report_issues")
    .select("*", { count: "exact", head: true })
    .eq("report_id", reportId);

  await supabase
    .from("issue_reports")
    .update({ issue_count: count || 0 })
    .eq("id", reportId)
    .eq("project_id", id);

  return NextResponse.json({ success: true });
}
