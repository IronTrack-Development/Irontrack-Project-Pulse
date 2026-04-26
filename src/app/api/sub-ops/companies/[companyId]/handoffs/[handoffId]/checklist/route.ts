import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ companyId: string; handoffId: string }> }
) {
  const { handoffId } = await params;
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("sub_handoff_checklist_items")
    .select("*")
    .eq("handoff_id", handoffId)
    .order("sort_order");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data: data || [] });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ companyId: string; handoffId: string }> }
) {
  const { handoffId } = await params;
  const supabase = getServiceClient();
  const body = await req.json();

  if (!body.item_text) {
    return NextResponse.json({ error: "item_text is required" }, { status: 400 });
  }

  // Get next sort_order
  const { data: existing } = await supabase
    .from("sub_handoff_checklist_items")
    .select("sort_order")
    .eq("handoff_id", handoffId)
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextOrder = existing && existing.length > 0 ? (existing[0].sort_order || 0) + 1 : 0;

  const { data, error } = await supabase
    .from("sub_handoff_checklist_items")
    .insert({
      handoff_id: handoffId,
      item_text: body.item_text,
      sort_order: body.sort_order ?? nextOrder,
      notes: body.notes || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ companyId: string; handoffId: string }> }
) {
  const { handoffId } = await params;
  const supabase = getServiceClient();
  const body = await req.json();

  if (!body.id) {
    return NextResponse.json({ error: "Checklist item id is required" }, { status: 400 });
  }

  const updateData: Record<string, unknown> = {};
  if (typeof body.completed === "boolean") {
    updateData.completed = body.completed;
    updateData.completed_at = body.completed ? new Date().toISOString() : null;
    updateData.completed_by = body.completed ? (body.completed_by || null) : null;
  }
  if (body.notes !== undefined) updateData.notes = body.notes;
  if (body.item_text !== undefined) updateData.item_text = body.item_text;

  const { data, error } = await supabase
    .from("sub_handoff_checklist_items")
    .update(updateData)
    .eq("id", body.id)
    .eq("handoff_id", handoffId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}
