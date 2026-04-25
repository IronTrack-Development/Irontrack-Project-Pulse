import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

// GET /api/projects/[id]/drawings/sheets/[sheetId]/pins
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; sheetId: string }> }
) {
  const { sheetId } = await params;
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("drawing_pins")
    .select("*")
    .eq("sheet_id", sheetId)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Enrich pins with reference data
  const pins = data || [];
  const enriched = await Promise.all(
    pins.map(async (pin) => {
      if (!pin.reference_id) return pin;
      let reference = null;
      try {
        if (pin.pin_type === "rfi") {
          const { data: rfi } = await supabase
            .from("rfis")
            .select("id, rfi_number, subject, status")
            .eq("id", pin.reference_id)
            .single();
          reference = rfi;
        } else if (pin.pin_type === "punch") {
          const { data: punch } = await supabase
            .from("punch_items")
            .select("id, item_number, title, status")
            .eq("id", pin.reference_id)
            .single();
          reference = punch;
        } else if (pin.pin_type === "submittal") {
          const { data: sub } = await supabase
            .from("submittals")
            .select("id, submittal_number, title, status")
            .eq("id", pin.reference_id)
            .single();
          reference = sub;
        }
      } catch {
        // Reference may not exist
      }
      return { ...pin, reference };
    })
  );

  return NextResponse.json({ pins: enriched });
}

// POST /api/projects/[id]/drawings/sheets/[sheetId]/pins
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; sheetId: string }> }
) {
  const { sheetId } = await params;
  const supabase = getServiceClient();
  const body = await req.json();

  const { data, error } = await supabase
    .from("drawing_pins")
    .insert({
      sheet_id: sheetId,
      pin_type: body.pin_type,
      reference_id: body.reference_id || null,
      x_percent: body.x_percent,
      y_percent: body.y_percent,
      label: body.label || null,
      notes: body.notes || null,
      created_by: body.created_by || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ pin: data }, { status: 201 });
}

// DELETE /api/projects/[id]/drawings/sheets/[sheetId]/pins?pinId=xxx
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; sheetId: string }> }
) {
  const { sheetId } = await params;
  const supabase = getServiceClient();
  const url = new URL(req.url);
  const pinId = url.searchParams.get("pinId");

  if (!pinId) {
    return NextResponse.json({ error: "pinId is required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("drawing_pins")
    .delete()
    .eq("id", pinId)
    .eq("sheet_id", sheetId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
