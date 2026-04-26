import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

// GET — list agenda items for meeting
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; meetingId: string }> }
) {
  const { meetingId } = await params;
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("coordination_agenda_items")
    .select("*")
    .eq("meeting_id", meetingId)
    .order("sort_order");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ agenda_items: data });
}

// POST — add agenda item(s) or auto-populate from schedule
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; meetingId: string }> }
) {
  const { id, meetingId } = await params;
  const supabase = getServiceClient();
  const body = await req.json();

  // Auto-populate from schedule
  if (body.auto_populate) {
    const { data: meeting } = await supabase
      .from("coordination_meetings")
      .select("meeting_date")
      .eq("id", meetingId)
      .single();

    if (!meeting) return NextResponse.json({ error: "Meeting not found" }, { status: 404 });

    const startDate = meeting.meeting_date;
    const endDate = new Date(new Date(startDate).getTime() + 7 * 86400000).toISOString().split("T")[0];

    const { data: activities } = await supabase
      .from("parsed_activities")
      .select("id, activity_name, trade, normalized_area, start_date, finish_date")
      .eq("project_id", id)
      .gte("start_date", startDate)
      .lte("start_date", endDate)
      .not("trade", "is", null)
      .order("trade");

    if (!activities || activities.length === 0) {
      return NextResponse.json({ agenda_items: [], message: "No activities found for this week" });
    }

    // Group by trade
    const byTrade: Record<string, any[]> = {};
    activities.forEach((a: any) => {
      const trade = a.trade || "Unassigned";
      if (!byTrade[trade]) byTrade[trade] = [];
      byTrade[trade].push(a);
    });

    // Get max sort_order
    const { data: existing } = await supabase
      .from("coordination_agenda_items")
      .select("sort_order")
      .eq("meeting_id", meetingId)
      .order("sort_order", { ascending: false })
      .limit(1);

    let sortOrder = (existing?.[0]?.sort_order ?? -1) + 1;

    const items = Object.entries(byTrade).map(([trade, acts]) => ({
      meeting_id: meetingId,
      title: `${trade} — ${acts.length} activit${acts.length === 1 ? "y" : "ies"} this week`,
      trade,
      area: acts.map((a: any) => a.normalized_area).filter(Boolean).join(", "),
      sort_order: sortOrder++,
      status: "pending",
      activity_id: acts[0].id,
    }));

    const { data: inserted, error } = await supabase
      .from("coordination_agenda_items")
      .insert(items)
      .select();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ agenda_items: inserted }, { status: 201 });
  }

  // Normal add
  const { data, error } = await supabase
    .from("coordination_agenda_items")
    .insert({
      meeting_id: meetingId,
      title: body.title,
      trade: body.trade,
      area: body.area,
      notes: body.notes,
      sort_order: body.sort_order || 0,
      has_conflict: body.has_conflict || false,
      conflict_description: body.conflict_description,
      activity_id: body.activity_id,
      status: "pending",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

// PATCH — update agenda item
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; meetingId: string }> }
) {
  const { meetingId } = await params;
  const supabase = getServiceClient();
  const body = await req.json();

  if (!body.agenda_item_id) {
    return NextResponse.json({ error: "agenda_item_id required" }, { status: 400 });
  }

  const allowed = ["title", "trade", "area", "notes", "sort_order", "has_conflict", "conflict_description", "status"];
  const updates: Record<string, any> = {};
  allowed.forEach((key) => {
    if (body[key] !== undefined) updates[key] = body[key];
  });

  const { data, error } = await supabase
    .from("coordination_agenda_items")
    .update(updates)
    .eq("id", body.agenda_item_id)
    .eq("meeting_id", meetingId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE — remove agenda item
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; meetingId: string }> }
) {
  const { meetingId } = await params;
  const supabase = getServiceClient();
  const url = new URL(req.url);
  const itemId = url.searchParams.get("item_id");

  if (!itemId) return NextResponse.json({ error: "item_id required" }, { status: 400 });

  const { error } = await supabase
    .from("coordination_agenda_items")
    .delete()
    .eq("id", itemId)
    .eq("meeting_id", meetingId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
