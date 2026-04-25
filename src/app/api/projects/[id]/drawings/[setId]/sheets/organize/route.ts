import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

const DISCIPLINE_PREFIX: Record<string, string> = {
  general: "G",
  civil: "C",
  landscape: "L",
  architectural: "A",
  structural: "S",
  mechanical: "M",
  electrical: "E",
  plumbing: "P",
  fire_protection: "FP",
  other: "X",
};

const DISCIPLINE_LABEL: Record<string, string> = {
  general: "General",
  civil: "Civil",
  landscape: "Landscape",
  architectural: "Architectural",
  structural: "Structural",
  mechanical: "Mechanical",
  electrical: "Electrical",
  plumbing: "Plumbing",
  fire_protection: "Fire Protection",
  other: "Other",
};

interface Assignment {
  page_start: number;
  page_end: number;
  discipline: string;
  category_label?: string;
  category_id?: string;
}

// PATCH /api/projects/[id]/drawings/[setId]/sheets/organize
// Bulk-assigns pages to disciplines and auto-numbers sheets
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; setId: string }> }
) {
  const { setId } = await params;
  const supabase = getServiceClient();
  const body = await req.json();

  const assignments: Assignment[] = body.assignments || [];

  if (!assignments.length) {
    return NextResponse.json({ error: "No assignments provided" }, { status: 400 });
  }

  // Load all sheets for this set
  const { data: sheets, error: sheetsErr } = await supabase
    .from("drawing_sheets")
    .select("id, page_index, sheet_number, sheet_title, discipline")
    .eq("set_id", setId)
    .order("page_index", { ascending: true });

  if (sheetsErr || !sheets) {
    return NextResponse.json({ error: sheetsErr?.message || "Sheets not found" }, { status: 404 });
  }

  // Build a map from page_index → assignment (0-indexed, but assignments use 1-indexed page numbers)
  const pageAssignMap = new Map<number, Assignment>();
  for (const assignment of assignments) {
    for (let p = assignment.page_start; p <= assignment.page_end; p++) {
      pageAssignMap.set(p - 1, assignment); // convert to 0-indexed
    }
  }

  // Count sheets per discipline (for sequential numbering within each discipline)
  const disciplineCounters: Record<string, number> = {};

  // Sort sheets by page_index for sequential numbering
  const sortedSheets = [...sheets].sort((a, b) => a.page_index - b.page_index);

  // Build updates
  const updates = sortedSheets.map((sheet) => {
    const assignment = pageAssignMap.get(sheet.page_index);
    if (!assignment) {
      return null; // uncategorized — leave as-is
    }

    const discipline = assignment.discipline || "other";
    const prefix = DISCIPLINE_PREFIX[discipline] || "X";
    const disciplineLabel = assignment.category_label || DISCIPLINE_LABEL[discipline] || discipline;

    disciplineCounters[discipline] = (disciplineCounters[discipline] || 0) + 1;
    const seq = disciplineCounters[discipline];

    return {
      id: sheet.id,
      discipline,
      sheet_number: `${prefix}-${seq}`,
      sheet_title: `${disciplineLabel} Sheet ${seq}`,
      category_id: assignment.category_id || null,
      custom_category: assignment.category_label || null,
    };
  }).filter(Boolean) as Array<{
    id: string;
    discipline: string;
    sheet_number: string;
    sheet_title: string;
    category_id: string | null;
    custom_category: string | null;
  }>;

  // Bulk update in chunks of 50
  const CHUNK = 50;
  for (let i = 0; i < updates.length; i += CHUNK) {
    const chunk = updates.slice(i, i + CHUNK);
    await Promise.all(
      chunk.map((u) =>
        supabase
          .from("drawing_sheets")
          .update({
            discipline: u.discipline,
            sheet_number: u.sheet_number,
            sheet_title: u.sheet_title,
            ...(u.category_id !== undefined ? { category_id: u.category_id } : {}),
            ...(u.custom_category !== undefined ? { custom_category: u.custom_category } : {}),
          })
          .eq("id", u.id)
          .eq("set_id", setId)
      )
    );
  }

  // Return updated sheets
  const { data: updatedSheets, error: fetchErr } = await supabase
    .from("drawing_sheets")
    .select("*")
    .eq("set_id", setId)
    .order("page_index", { ascending: true });

  if (fetchErr) {
    return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  }

  return NextResponse.json({ sheets: updatedSheets, updated: updates.length });
}
