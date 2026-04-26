import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

// POST /api/projects/[id]/field-reports/[reportId]/photo
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; reportId: string }> }
) {
  const { id, reportId } = await params;
  const supabase = getServiceClient();

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Generate storage path
  const ext = file.name.split(".").pop() || "jpg";
  const storagePath = `${id}/${reportId}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("field-report-photos")
    .upload(storagePath, buffer, {
      contentType: file.type || "image/jpeg",
      upsert: true,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from("field-report-photos")
    .getPublicUrl(storagePath);

  // Update report with photo path
  const { error: updateError } = await supabase
    .from("field_reports")
    .update({ photo_path: storagePath })
    .eq("id", reportId)
    .eq("project_id", id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({
    storage_path: storagePath,
    public_url: urlData.publicUrl,
  });
}
