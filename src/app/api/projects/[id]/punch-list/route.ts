import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

// GET /api/projects/[id]/punch-list
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getServiceClient();
  const url = new URL(req.url);
  const statusFilter = url.searchParams.get("status");
  const assignedToFilter = url.searchParams.get("assigned_to");

  let query = supabase
    .from("punch_items")
    .select(`
      *,
      assigned_contact:company_contacts!punch_items_assigned_to_fkey(id, name, company, role),
      punch_item_photos(id)
    `)
    .eq("project_id", id)
    .order("item_number", { ascending: true });

  if (statusFilter) query = query.eq("status", statusFilter);
  if (assignedToFilter) query = query.eq("assigned_to", assignedToFilter);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const items = (data || []).map((item) => ({
    ...item,
    photo_count: Array.isArray(item.punch_item_photos) ? item.punch_item_photos.length : 0,
    punch_item_photos: undefined,
  }));

  return NextResponse.json({ items });
}

// POST /api/projects/[id]/punch-list
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getServiceClient();
  const body = await req.json();

  // Auto-number: P-XXX
  const { data: existing } = await supabase
    .from("punch_items")
    .select("item_number")
    .eq("project_id", id)
    .order("created_at", { ascending: false });

  let nextNum = 1;
  if (existing && existing.length > 0) {
    const nums = existing
      .map((r) => parseInt(r.item_number.replace("P-", ""), 10))
      .filter((n) => !isNaN(n));
    if (nums.length > 0) nextNum = Math.max(...nums) + 1;
  }

  const item_number = body.item_number || `P-${String(nextNum).padStart(3, "0")}`;

  const { data, error } = await supabase
    .from("punch_items")
    .insert({
      project_id: id,
      item_number,
      description: body.description,
      location: body.location || null,
      building: body.building || null,
      floor: body.floor || null,
      room: body.room || null,
      trade: body.trade || null,
      assigned_to: body.assigned_to || null,
      priority: body.priority || "standard",
      status: body.status || "open",
      due_date: body.due_date || null,
      notes: body.notes || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
