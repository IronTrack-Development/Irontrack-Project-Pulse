import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

// Allow large PDF uploads (up to 50MB on Vercel Pro)
export const config = {
  api: {
    bodyParser: false,
  },
};

// Increase max duration for large file processing
export const maxDuration = 60;

// GET /api/projects/[id]/drawings
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getServiceClient();
  const url = new URL(req.url);
  const currentOnly = url.searchParams.get("current_only") === "true";

  let query = supabase
    .from("drawing_sets")
    .select("*")
    .eq("project_id", id)
    .order("uploaded_at", { ascending: false });

  if (currentOnly) {
    query = query.eq("is_current", true);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ drawing_sets: data || [] });
}

// POST /api/projects/[id]/drawings
// Accepts JSON with: name, revision, description, storage_path, page_count, mode
// File is uploaded directly to Supabase Storage from the client
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getServiceClient();

  const body = await req.json();
  const name = body.name || "Drawing Set";
  const revision = body.revision || "Rev 0";
  const description = body.description || null;
  const uploaded_by = body.uploaded_by || null;
  const markCurrentMode = body.mode || "new_revision";
  const storagePath = body.storage_path;
  const pageCount = body.page_count || 1;

  if (!storagePath) {
    return NextResponse.json({ error: "storage_path is required" }, { status: 400 });
  }

  // If replacing, mark previous sets with same name as not current
  if (markCurrentMode === "replace") {
    await supabase
      .from("drawing_sets")
      .update({ is_current: false })
      .eq("project_id", id)
      .eq("name", name);
  } else {
    // new_revision: mark all current sets with same name as not current
    await supabase
      .from("drawing_sets")
      .update({ is_current: false })
      .eq("project_id", id)
      .eq("name", name)
      .eq("is_current", true);
  }

  // Create the drawing set record
  const { data: drawingSet, error: setError } = await supabase
    .from("drawing_sets")
    .insert({
      project_id: id,
      name,
      revision,
      description,
      uploaded_by,
      is_current: true,
      sheet_count: pageCount,
    })
    .select()
    .single();

  if (setError) {
    return NextResponse.json({ error: setError.message }, { status: 500 });
  }

  // Create sheet records for each page
  const sheets = Array.from({ length: pageCount }, (_, i) => ({
    set_id: drawingSet.id,
    sheet_number: `P${i + 1}`,
    sheet_title: `Page ${i + 1}`,
    storage_path: storagePath,
    page_index: i,
    discipline: "general" as const,
  }));

  const { error: sheetsError } = await supabase
    .from("drawing_sheets")
    .insert(sheets);

  if (sheetsError) {
    return NextResponse.json({ error: sheetsError.message }, { status: 500 });
  }

  return NextResponse.json(
    {
      drawing_set: drawingSet,
      sheet_count: pageCount,
      storage_path: storagePath,
    },
    { status: 201 }
  );
}
