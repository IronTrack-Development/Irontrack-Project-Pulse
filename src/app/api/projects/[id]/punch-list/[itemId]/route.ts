import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

// GET /api/projects/[id]/punch-list/[itemId]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const { id, itemId } = await params;
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("punch_items")
    .select(`
      *,
      assigned_contact:company_contacts!punch_items_assigned_to_fkey(id, name, company, role),
      punch_item_photos(id, storage_path, photo_type, caption, uploaded_at)
    `)
    .eq("id", itemId)
    .eq("project_id", id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}

// PATCH /api/projects/[id]/punch-list/[itemId]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const { id, itemId } = await params;
  const supabase = getServiceClient();
  const body = await req.json();

  // Auto-set closed_date when status → closed
  const updates: Record<string, unknown> = { ...body };
  if (body.status === "closed" && !body.closed_date) {
    updates.closed_date = new Date().toISOString().split("T")[0];
  }
  // Clear closed_date if reopening
  if (body.status && body.status !== "closed") {
    updates.closed_date = null;
  }

  const { data, error } = await supabase
    .from("punch_items")
    .update(updates)
    .eq("id", itemId)
    .eq("project_id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE /api/projects/[id]/punch-list/[itemId]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const { id, itemId } = await params;
  const supabase = getServiceClient();

  // Also clean up photos from storage
  const { data: photos } = await supabase
    .from("punch_item_photos")
    .select("storage_path")
    .eq("punch_item_id", itemId);

  if (photos && photos.length > 0) {
    const paths = photos.map((p) => p.storage_path);
    await supabase.storage.from("punch-photos").remove(paths);
  }

  const { error } = await supabase
    .from("punch_items")
    .delete()
    .eq("id", itemId)
    .eq("project_id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ deleted: true });
}
