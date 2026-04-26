import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

// GET — all action items across meetings for a project (action tracker view)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getServiceClient();
  const url = new URL(req.url);

  const status = url.searchParams.get("status");
  const category = url.searchParams.get("category");
  const priority = url.searchParams.get("priority");
  const assignee = url.searchParams.get("assignee");
  const meetingId = url.searchParams.get("meeting_id");
  const limit = parseInt(url.searchParams.get("limit") || "100");
  const offset = parseInt(url.searchParams.get("offset") || "0");

  let query = supabase
    .from("coordination_action_items")
    .select("*", { count: "exact" })
    .eq("project_id", id)
    .order("due_date", { ascending: true, nullsFirst: false })
    .range(offset, offset + limit - 1);

  if (status) query = query.eq("status", status);
  if (category) query = query.eq("category", category);
  if (priority) query = query.eq("priority", priority);
  if (assignee) query = query.eq("assigned_to", assignee);
  if (meetingId) query = query.eq("meeting_id", meetingId);

  const { data, error, count } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Get meeting titles for context
  if (data && data.length > 0) {
    const meetingIds = [...new Set(data.map((a: any) => a.meeting_id))];
    const { data: meetings } = await supabase
      .from("coordination_meetings")
      .select("id, title, meeting_date")
      .in("id", meetingIds);

    const meetingMap: Record<string, any> = {};
    (meetings || []).forEach((m: any) => { meetingMap[m.id] = m; });
    data.forEach((a: any) => {
      a.meeting_title = meetingMap[a.meeting_id]?.title;
      a.meeting_date = meetingMap[a.meeting_id]?.meeting_date;
    });
  }

  // Summary counts
  const openCount = (data || []).filter((a: any) => a.status === "open" || a.status === "in_progress").length;
  const overdueCount = (data || []).filter((a: any) =>
    (a.status === "open" || a.status === "in_progress") &&
    a.due_date && new Date(a.due_date) < new Date()
  ).length;

  return NextResponse.json({
    action_items: data,
    total: count,
    open_count: openCount,
    overdue_count: overdueCount,
  });
}
