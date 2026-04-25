import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

// GET /api/projects/[id]/drawings/[setId]/category
// List all custom categories for a drawing set
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; setId: string }> }
) {
  const { setId } = await params;
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("drawing_categories")
    .select("*")
    .eq("set_id", setId)
    .order("sort_order", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ categories: data || [] });
}

// POST /api/projects/[id]/drawings/[setId]/category
// Create a custom category
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; setId: string }> }
) {
  const { setId } = await params;
  const supabase = getServiceClient();
  const body = await req.json();

  if (!body.name?.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  // Get current max sort_order
  const { data: existing } = await supabase
    .from("drawing_categories")
    .select("sort_order")
    .eq("set_id", setId)
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextOrder = existing?.[0]?.sort_order != null ? existing[0].sort_order + 1 : 0;

  const { data, error } = await supabase
    .from("drawing_categories")
    .insert({
      set_id: setId,
      name: body.name.trim(),
      discipline: body.discipline || "other",
      sort_order: nextOrder,
      color: body.color || "#6B7280",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ category: data }, { status: 201 });
}

// PATCH /api/projects/[id]/drawings/[setId]/category
// Reorder categories (accepts array of { id, sort_order })
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; setId: string }> }
) {
  const { setId } = await params;
  const supabase = getServiceClient();
  const body = await req.json();

  const updates: Array<{ id: string; sort_order: number }> = body.categories || [];

  await Promise.all(
    updates.map((u) =>
      supabase
        .from("drawing_categories")
        .update({ sort_order: u.sort_order })
        .eq("id", u.id)
        .eq("set_id", setId)
    )
  );

  return NextResponse.json({ success: true });
}
