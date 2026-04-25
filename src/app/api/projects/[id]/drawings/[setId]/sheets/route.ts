import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

// GET /api/projects/[id]/drawings/[setId]/sheets
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; setId: string }> }
) {
  const { setId } = await params;
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("drawing_sheets")
    .select("*")
    .eq("set_id", setId)
    .order("page_index", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ sheets: data || [] });
}

// POST /api/projects/[id]/drawings/[setId]/sheets
// Add individual sheet metadata (e.g. update sheet number/title/discipline)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; setId: string }> }
) {
  const { setId } = await params;
  const supabase = getServiceClient();
  const body = await req.json();

  const { data, error } = await supabase
    .from("drawing_sheets")
    .insert({
      set_id: setId,
      sheet_number: body.sheet_number || "1",
      sheet_title: body.sheet_title || null,
      discipline: body.discipline || "general",
      storage_path: body.storage_path,
      page_index: body.page_index ?? 0,
      width: body.width || null,
      height: body.height || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ sheet: data }, { status: 201 });
}

// PATCH /api/projects/[id]/drawings/[setId]/sheets
// Bulk update sheet numbers/titles/disciplines
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; setId: string }> }
) {
  const { setId } = await params;
  const supabase = getServiceClient();
  const body = await req.json();

  // body.sheets = array of { id, sheet_number, sheet_title, discipline }
  const updates = body.sheets || [];
  const results = await Promise.all(
    updates.map(async (sheet: { id: string; sheet_number?: string; sheet_title?: string; discipline?: string }) => {
      const { data, error } = await supabase
        .from("drawing_sheets")
        .update({
          sheet_number: sheet.sheet_number,
          sheet_title: sheet.sheet_title,
          discipline: sheet.discipline,
        })
        .eq("id", sheet.id)
        .eq("set_id", setId)
        .select()
        .single();
      return error ? null : data;
    })
  );

  return NextResponse.json({ sheets: results.filter(Boolean) });
}
