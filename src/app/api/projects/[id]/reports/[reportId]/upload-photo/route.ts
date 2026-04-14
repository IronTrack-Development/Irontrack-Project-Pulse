import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { randomUUID } from "crypto";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; reportId: string }> }
) {
  const { id: projectId, reportId } = await params;
  const supabase = getServiceClient();

  try {
    const formData = await req.formData();
    const photo = formData.get("photo") as File | null;

    if (!photo) {
      return NextResponse.json({ error: "No photo provided" }, { status: 400 });
    }

    const ext = photo.name.split(".").pop()?.toLowerCase() || "jpg";
    const validExts = ["jpg", "jpeg", "png", "webp", "heic", "heif"];
    const safeExt = validExts.includes(ext) ? ext : "jpg";

    const filename = `${randomUUID()}.${safeExt}`;
    const storagePath = `${projectId}/${reportId}/${filename}`;

    const arrayBuffer = await photo.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from("report-photos")
      .upload(storagePath, buffer, {
        contentType: photo.type || "image/jpeg",
        upsert: false,
      });

    if (uploadError) {
      console.error("Photo upload error:", uploadError);
      return NextResponse.json(
        { error: `Upload failed: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Generate a signed URL valid for 7 days (for immediate use)
    const { data: signedData, error: signedError } = await supabase.storage
      .from("report-photos")
      .createSignedUrl(storagePath, 60 * 60 * 24 * 7);

    if (signedError) {
      console.error("Signed URL error:", signedError);
      // Return path without URL — print page will generate its own
      return NextResponse.json({ path: storagePath, url: null });
    }

    return NextResponse.json({ path: storagePath, url: signedData.signedUrl });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Upload failed";
    console.error("Upload photo route error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
