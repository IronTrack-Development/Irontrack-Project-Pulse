import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

// GET /api/projects/[id]/coordination — list meetings with action counts
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getServiceClient();
  const url = new URL(req.url);
  const limit = parseInt(url.searchParams.get("limit") || "30");
  const offset = parseInt(url.searchParams.get("offset") || "0");
  const status = url.searchParams.get("status");

  let query = supabase
    .from("coordination_meetings")
    .select("*", { count: "exact" })
    .eq("project_id", id)
    .order("meeting_date", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) query = query.eq("status", status);

  const { data, error, count } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Attach action item counts
  if (data && data.length > 0) {
    const meetingIds = data.map((m: any) => m.id);

    const { data: actions } = await supabase
      .from("coordination_action_items")
      .select("meeting_id, status")
      .in("meeting_id", meetingIds);

    const { data: agendas } = await supabase
      .from("coordination_agenda_items")
      .select("meeting_id")
      .in("meeting_id", meetingIds);

    const actionCounts: Record<string, { total: number; open: number }> = {};
    const agendaCounts: Record<string, number> = {};

    (actions || []).forEach((a: any) => {
      if (!actionCounts[a.meeting_id]) actionCounts[a.meeting_id] = { total: 0, open: 0 };
      actionCounts[a.meeting_id].total++;
      if (a.status === "open" || a.status === "in_progress") actionCounts[a.meeting_id].open++;
    });

    (agendas || []).forEach((a: any) => {
      agendaCounts[a.meeting_id] = (agendaCounts[a.meeting_id] || 0) + 1;
    });

    data.forEach((m: any) => {
      m.action_count = actionCounts[m.id]?.total || 0;
      m.open_action_count = actionCounts[m.id]?.open || 0;
      m.agenda_count = agendaCounts[m.id] || 0;
    });
  }

  return NextResponse.json({ meetings: data, total: count });
}

// POST /api/projects/[id]/coordination — create meeting
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getServiceClient();
  const body = await req.json();

  const meetingDate = body.meeting_date || new Date().toISOString().split("T")[0];

  const { data: meeting, error } = await supabase
    .from("coordination_meetings")
    .insert({
      project_id: id,
      meeting_date: meetingDate,
      meeting_type: body.meeting_type || "weekly_coordination",
      title: body.title,
      location: body.location,
      facilitator: body.facilitator,
      start_time: body.start_time,
      end_time: body.end_time,
      recurrence: body.recurrence || "none",
      recurrence_day: body.recurrence_day,
      status: "scheduled",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Auto-populate agenda from meeting type template
  if (body.meeting_type) {
    const { data: meetingType } = await supabase
      .from("coordination_meeting_types")
      .select("*")
      .or(`project_id.eq.${id},project_id.is.null`)
      .eq("name", body.meeting_type)
      .limit(1)
      .single();

    if (meetingType && meetingType.default_agenda?.length > 0) {
      const agendaItems = meetingType.default_agenda.map((title: string, i: number) => ({
        meeting_id: meeting.id,
        title,
        sort_order: i,
        status: "pending",
      }));

      await supabase.from("coordination_agenda_items").insert(agendaItems);
    }
  }

  // Auto-populate from schedule if requested
  if (body.auto_populate_schedule) {
    const startDate = meetingDate;
    const endDate = new Date(new Date(meetingDate).getTime() + 7 * 86400000).toISOString().split("T")[0];

    const { data: activities } = await supabase
      .from("parsed_activities")
      .select("id, activity_name, trade, normalized_area, start_date, finish_date")
      .eq("project_id", id)
      .gte("start_date", startDate)
      .lte("start_date", endDate)
      .not("trade", "is", null)
      .order("trade");

    if (activities && activities.length > 0) {
      // Group by trade
      const byTrade: Record<string, any[]> = {};
      activities.forEach((a: any) => {
        const trade = a.trade || "Unassigned";
        if (!byTrade[trade]) byTrade[trade] = [];
        byTrade[trade].push(a);
      });

      // Get current max sort_order
      const { data: existingAgenda } = await supabase
        .from("coordination_agenda_items")
        .select("sort_order")
        .eq("meeting_id", meeting.id)
        .order("sort_order", { ascending: false })
        .limit(1);

      let sortOrder = (existingAgenda?.[0]?.sort_order ?? -1) + 1;

      const tradeAgendaItems = Object.entries(byTrade).map(([trade, acts]) => ({
        meeting_id: meeting.id,
        title: `${trade} — ${acts.length} activit${acts.length === 1 ? "y" : "ies"} this week`,
        trade,
        area: acts.map((a: any) => a.normalized_area).filter(Boolean).join(", "),
        sort_order: sortOrder++,
        status: "pending",
        activity_id: acts[0].id,
      }));

      if (tradeAgendaItems.length > 0) {
        await supabase.from("coordination_agenda_items").insert(tradeAgendaItems);
      }
    }
  }

  return NextResponse.json(meeting, { status: 201 });
}
