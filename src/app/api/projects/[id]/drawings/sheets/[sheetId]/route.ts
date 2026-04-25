import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

// PATCH /api/projects/[id]/drawings/sheets/[sheetId]
// Update individual sheet metadata
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; sheetId: string }> }
) {
  const { id, sheetId } = await params;
  const supabase = getServiceClient();
  const body = await req.json();

  const updateFields: Record<string, unknown> = {};
  if (body.sheet_number !== undefined) updateFields.sheet_number = body.sheet_number;
  if (body.sheet_title !== undefined) updateFields.sheet_title = body.sheet_title;
  if (body.discipline !== undefined) updateFields.discipline = body.discipline;
  if (body.custom_category !== undefined) updateFields.custom_category = body.custom_category;
  if (body.category_id !== undefined) updateFields.category_id = body.category_id;

  if (Object.keys(updateFields).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  // Verify the sheet belongs to a set in this project
  const { data: sheet, error: findErr } = await supabase
    .from("drawing_sheets")
    .select("id, set_id, drawing_sets!inner(project_id)")
    .eq("id", sheetId)
    .single();

  if (findErr || !sheet) {
    return NextResponse.json({ error: "Sheet not found" }, { status: 404 });
  }

  const drawingSet = sheet.drawing_sets as unknown as { project_id: string };
  if (drawingSet?.project_id !== id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("drawing_sheets")
    .update(updateFields)
    .eq("id", sheetId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ sheet: data });
}
