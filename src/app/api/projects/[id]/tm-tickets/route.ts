import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

// GET /api/projects/[id]/tm-tickets
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const supabase = getServiceClient();
  const { searchParams } = new URL(req.url);
  const statusFilter = searchParams.get("status");

  let query = supabase
    .from("tm_tickets")
    .select(`
      id,
      project_id,
      ticket_number,
      date,
      description,
      status,
      total_labor_cost,
      total_material_cost,
      total_equipment_cost,
      total_cost,
      gc_signature_path,
      gc_signed_by,
      gc_signed_at,
      sub_signature_path,
      sub_signed_by,
      sub_signed_at,
      dispute_reason,
      notes,
      created_at,
      updated_at,
      sub_contact:company_contacts!tm_tickets_sub_contact_id_fkey(id, name, company, role)
    `)
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (statusFilter) {
    query = query.eq("status", statusFilter);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data ?? []);
}

// POST /api/projects/[id]/tm-tickets
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const supabase = getServiceClient();

  let body: {
    description?: string;
    date?: string;
    sub_contact_id?: string | null;
    notes?: string | null;
    status?: string;
    labor_items?: Array<{
      trade: string;
      workers: number;
      hours: number;
      rate?: number | null;
      description?: string | null;
    }>;
    material_items?: Array<{
      item: string;
      quantity: number;
      unit?: string;
      unit_cost?: number;
      receipt_photo_path?: string | null;
    }>;
    equipment_items?: Array<{
      equipment_type: string;
      hours: number;
      rate?: number;
      description?: string | null;
    }>;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.description?.trim()) {
    return NextResponse.json({ error: "description is required" }, { status: 400 });
  }

  // Auto-number TM-XXX
  const { data: existing } = await supabase
    .from("tm_tickets")
    .select("ticket_number")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  let nextNum = 1;
  if (existing && existing.length > 0) {
    const nums = existing
      .map((t) => parseInt(t.ticket_number.replace("TM-", ""), 10))
      .filter((n) => !isNaN(n));
    if (nums.length > 0) nextNum = Math.max(...nums) + 1;
  }
  const ticket_number = `TM-${String(nextNum).padStart(3, "0")}`;

  // Calculate totals from line items
  const labor = body.labor_items ?? [];
  const materials = body.material_items ?? [];
  const equipment = body.equipment_items ?? [];

  const total_labor_cost = labor.reduce(
    (sum, l) => sum + (l.workers ?? 1) * (l.hours ?? 0) * (l.rate ?? 0),
    0
  );
  const total_material_cost = materials.reduce(
    (sum, m) => sum + (m.quantity ?? 1) * (m.unit_cost ?? 0),
    0
  );
  const total_equipment_cost = equipment.reduce(
    (sum, e) => sum + (e.hours ?? 0) * (e.rate ?? 0),
    0
  );

  // Insert ticket
  const { data: ticket, error: ticketErr } = await supabase
    .from("tm_tickets")
    .insert({
      project_id: projectId,
      ticket_number,
      description: body.description.trim(),
      date: body.date ?? new Date().toISOString().split("T")[0],
      sub_contact_id: body.sub_contact_id ?? null,
      notes: body.notes ?? null,
      status: body.status ?? "draft",
      total_labor_cost,
      total_material_cost,
      total_equipment_cost,
    })
    .select()
    .single();

  if (ticketErr) return NextResponse.json({ error: ticketErr.message }, { status: 500 });

  // Insert line items
  if (labor.length > 0) {
    await supabase.from("tm_labor_items").insert(
      labor.map((l) => ({
        ticket_id: ticket.id,
        trade: l.trade,
        workers: l.workers ?? 1,
        hours: l.hours ?? 0,
        rate: l.rate ?? null,
        description: l.description ?? null,
      }))
    );
  }

  if (materials.length > 0) {
    await supabase.from("tm_material_items").insert(
      materials.map((m) => ({
        ticket_id: ticket.id,
        item: m.item,
        quantity: m.quantity ?? 1,
        unit: m.unit ?? "ea",
        unit_cost: m.unit_cost ?? 0,
        receipt_photo_path: m.receipt_photo_path ?? null,
      }))
    );
  }

  if (equipment.length > 0) {
    await supabase.from("tm_equipment_items").insert(
      equipment.map((e) => ({
        ticket_id: ticket.id,
        equipment_type: e.equipment_type,
        hours: e.hours ?? 0,
        rate: e.rate ?? 0,
        description: e.description ?? null,
      }))
    );
  }

  return NextResponse.json(ticket, { status: 201 });
}
