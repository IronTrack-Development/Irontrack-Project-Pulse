import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

// GET — list action items for meeting
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; meetingId: string }> }
) {
  const { meetingId } = await params;
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("coordination_action_items")
    .select("*")
    .eq("meeting_id", meetingId)
    .order("created_at");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ action_items: data });
}

// POST — create action item
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; meetingId: string }> }
) {
  const { id, meetingId } = await params;
  const supabase = getServiceClient();
  const body = await req.json();

  const { data, error } = await supabase
    .from("coordination_action_items")
    .insert({
      meeting_id: meetingId,
      project_id: id,
      title: body.title,
      description: body.description,
      assigned_to: body.assigned_to,
      assigned_company: body.assigned_company,
      assigned_trade: body.assigned_trade,
      category: body.category || "general",
      priority: body.priority || "medium",
      due_date: body.due_date,
      status: "open",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

// PATCH — update action item
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; meetingId: string }> }
) {
  const { meetingId } = await params;
  const supabase = getServiceClient();
  const body = await req.json();

  if (!body.action_item_id) {
    return NextResponse.json({ error: "action_item_id required" }, { status: 400 });
  }

  const allowed = [
    "title", "description", "assigned_to", "assigned_company", "assigned_trade",
    "category", "priority", "due_date", "status", "resolution_notes",
  ];
  const updates: Record<string, any> = {};
  allowed.forEach((key) => {
    if (body[key] !== undefined) updates[key] = body[key];
  });

  // Auto-set resolved_at
  if (body.status === "resolved") {
    updates.resolved_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("coordination_action_items")
    .update(updates)
    .eq("id", body.action_item_id)
    .eq("meeting_id", meetingId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE — remove action item
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
    .from("coordination_action_items")
    .delete()
    .eq("id", itemId)
    .eq("meeting_id", meetingId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
