import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

// GET /api/projects/[id]/drawings/[setId]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; setId: string }> }
) {
  const { setId } = await params;
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("drawing_sets")
    .select(`
      *,
      drawing_sheets(*)
    `)
    .eq("id", setId)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Drawing set not found" }, { status: 404 });

  return NextResponse.json({ drawing_set: data });
}

// PATCH /api/projects/[id]/drawings/[setId]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; setId: string }> }
) {
  const { setId } = await params;
  const supabase = getServiceClient();
  const body = await req.json();

  const updates: Record<string, unknown> = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.revision !== undefined) updates.revision = body.revision;
  if (body.description !== undefined) updates.description = body.description;
  if (body.is_current !== undefined) updates.is_current = body.is_current;

  const { data, error } = await supabase
    .from("drawing_sets")
    .update(updates)
    .eq("id", setId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ drawing_set: data });
}

// DELETE /api/projects/[id]/drawings/[setId]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; setId: string }> }
) {
  const { setId } = await params;
  const supabase = getServiceClient();

  // Get sheets to find storage paths
  const { data: sheets } = await supabase
    .from("drawing_sheets")
    .select("storage_path")
    .eq("set_id", setId);

  // Delete from storage (deduplicate paths since sheets share the PDF)
  if (sheets && sheets.length > 0) {
    const uniquePaths = [...new Set(sheets.map((s) => s.storage_path))];
    await supabase.storage.from("drawings").remove(uniquePaths);
  }

  // Cascade delete handles sheets and pins
  const { error } = await supabase
    .from("drawing_sets")
    .delete()
    .eq("id", setId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
