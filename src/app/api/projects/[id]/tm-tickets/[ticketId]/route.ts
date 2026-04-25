import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

// GET /api/projects/[id]/tm-tickets/[ticketId]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; ticketId: string }> }
) {
  const { ticketId } = await params;
  const supabase = getServiceClient();

  const { data: ticket, error } = await supabase
    .from("tm_tickets")
    .select(`
      *,
      sub_contact:company_contacts!tm_tickets_sub_contact_id_fkey(id, name, company, role)
    `)
    .eq("id", ticketId)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });

  const [{ data: laborItems }, { data: materialItems }, { data: equipmentItems }] =
    await Promise.all([
      supabase.from("tm_labor_items").select("*").eq("ticket_id", ticketId).order("id"),
      supabase.from("tm_material_items").select("*").eq("ticket_id", ticketId).order("id"),
      supabase.from("tm_equipment_items").select("*").eq("ticket_id", ticketId).order("id"),
    ]);

  return NextResponse.json({
    ...ticket,
    labor_items: laborItems ?? [],
    material_items: materialItems ?? [],
    equipment_items: equipmentItems ?? [],
  });
}

// PATCH /api/projects/[id]/tm-tickets/[ticketId]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; ticketId: string }> }
) {
  const { ticketId } = await params;
  const supabase = getServiceClient();

  let body: {
    description?: string;
    date?: string;
    sub_contact_id?: string | null;
    status?: string;
    dispute_reason?: string | null;
    notes?: string | null;
    labor_items?: Array<{
      id?: string;
      trade: string;
      workers: number;
      hours: number;
      rate?: number | null;
      description?: string | null;
    }>;
    material_items?: Array<{
      id?: string;
      item: string;
      quantity: number;
      unit?: string;
      unit_cost?: number;
      receipt_photo_path?: string | null;
    }>;
    equipment_items?: Array<{
      id?: string;
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

  // Build update object for ticket fields
  const ticketUpdate: Record<string, unknown> = {};
  if (body.description !== undefined) ticketUpdate.description = body.description;
  if (body.date !== undefined) ticketUpdate.date = body.date;
  if (body.sub_contact_id !== undefined) ticketUpdate.sub_contact_id = body.sub_contact_id;
  if (body.status !== undefined) ticketUpdate.status = body.status;
  if (body.dispute_reason !== undefined) ticketUpdate.dispute_reason = body.dispute_reason;
  if (body.notes !== undefined) ticketUpdate.notes = body.notes;

  // If line items are provided, replace them and recalculate totals
  if (body.labor_items !== undefined || body.material_items !== undefined || body.equipment_items !== undefined) {
    // Delete existing and re-insert
    if (body.labor_items !== undefined) {
      await supabase.from("tm_labor_items").delete().eq("ticket_id", ticketId);
      if (body.labor_items.length > 0) {
        await supabase.from("tm_labor_items").insert(
          body.labor_items.map((l) => ({
            ticket_id: ticketId,
            trade: l.trade,
            workers: l.workers ?? 1,
            hours: l.hours ?? 0,
            rate: l.rate ?? null,
            description: l.description ?? null,
          }))
        );
      }
    }

    if (body.material_items !== undefined) {
      await supabase.from("tm_material_items").delete().eq("ticket_id", ticketId);
      if (body.material_items.length > 0) {
        await supabase.from("tm_material_items").insert(
          body.material_items.map((m) => ({
            ticket_id: ticketId,
            item: m.item,
            quantity: m.quantity ?? 1,
            unit: m.unit ?? "ea",
            unit_cost: m.unit_cost ?? 0,
            receipt_photo_path: m.receipt_photo_path ?? null,
          }))
        );
      }
    }

    if (body.equipment_items !== undefined) {
      await supabase.from("tm_equipment_items").delete().eq("ticket_id", ticketId);
      if (body.equipment_items.length > 0) {
        await supabase.from("tm_equipment_items").insert(
          body.equipment_items.map((e) => ({
            ticket_id: ticketId,
            equipment_type: e.equipment_type,
            hours: e.hours ?? 0,
            rate: e.rate ?? 0,
            description: e.description ?? null,
          }))
        );
      }
    }

    // Recalculate totals from fresh DB data
    const [{ data: freshLabor }, { data: freshMaterials }, { data: freshEquipment }] =
      await Promise.all([
        supabase.from("tm_labor_items").select("total").eq("ticket_id", ticketId),
        supabase.from("tm_material_items").select("total").eq("ticket_id", ticketId),
        supabase.from("tm_equipment_items").select("total").eq("ticket_id", ticketId),
      ]);

    ticketUpdate.total_labor_cost = (freshLabor ?? []).reduce(
      (sum: number, r: { total: number | null }) => sum + (r.total ?? 0), 0
    );
    ticketUpdate.total_material_cost = (freshMaterials ?? []).reduce(
      (sum: number, r: { total: number | null }) => sum + (r.total ?? 0), 0
    );
    ticketUpdate.total_equipment_cost = (freshEquipment ?? []).reduce(
      (sum: number, r: { total: number | null }) => sum + (r.total ?? 0), 0
    );
  }

  const { data: updated, error } = await supabase
    .from("tm_tickets")
    .update(ticketUpdate)
    .eq("id", ticketId)
    .select(`*, sub_contact:company_contacts!tm_tickets_sub_contact_id_fkey(id, name, company, role)`)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(updated);
}

// DELETE /api/projects/[id]/tm-tickets/[ticketId]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; ticketId: string }> }
) {
  const { ticketId } = await params;
  const supabase = getServiceClient();

  const { error } = await supabase.from("tm_tickets").delete().eq("id", ticketId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
