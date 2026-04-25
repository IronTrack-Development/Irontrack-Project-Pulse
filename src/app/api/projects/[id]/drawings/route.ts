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
// Accepts multipart form data with: file (PDF), name, revision, description, uploaded_by
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getServiceClient();

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const name = (formData.get("name") as string) || "Drawing Set";
  const revision = (formData.get("revision") as string) || "Rev 0";
  const description = (formData.get("description") as string) || null;
  const uploaded_by = (formData.get("uploaded_by") as string) || null;
  const markCurrentMode = (formData.get("mode") as string) || "new_revision"; // "new_revision" | "replace"

  if (!file) {
    return NextResponse.json({ error: "PDF file is required" }, { status: 400 });
  }

  // Store the full PDF in the drawings bucket
  const timestamp = Date.now();
  const safeName = name.replace(/[^a-zA-Z0-9_-]/g, "_");
  const storagePath = `${id}/${safeName}_${timestamp}.pdf`;

  const arrayBuffer = await file.arrayBuffer();
  const { error: uploadError } = await supabase.storage
    .from("drawings")
    .upload(storagePath, arrayBuffer, {
      contentType: "application/pdf",
      upsert: false,
    });

  if (uploadError) {
    console.error('Drawing upload error:', uploadError);
    return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 });
  }

  // Get page count from form data (client extracts via pdf.js) or default to 1
  let pageCount = 1;
  const clientPageCount = formData.get("page_count");
  if (clientPageCount) {
    pageCount = parseInt(clientPageCount as string, 10) || 1;
  } else {
    // Fallback: try to extract page count server-side
    try {
      const buffer = Buffer.from(arrayBuffer);
      // Quick PDF page count — scan for /Type /Page entries
      const text = buffer.toString('latin1');
      const matches = text.match(/\/Type\s*\/Page[^s]/g);
      if (matches && matches.length > 0) {
        pageCount = matches.length;
      }
    } catch {
      pageCount = 1;
    }
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
