import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

// POST /api/projects/[id]/rfis/[rfiId]/photos — upload photo metadata + file
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; rfiId: string }> }
) {
  const { rfiId } = await params;
  const supabase = getServiceClient();

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const caption = formData.get("caption") as string | null;

  if (!file) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }

  const timestamp = Date.now();
  const ext = file.name.split(".").pop() || "jpg";
  const storagePath = `${rfiId}/${timestamp}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const { error: uploadError } = await supabase.storage
    .from("rfi-photos")
    .upload(storagePath, arrayBuffer, {
      contentType: file.type || "image/jpeg",
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data, error } = await supabase
    .from("rfi_photos")
    .insert({
      rfi_id: rfiId,
      storage_path: storagePath,
      caption: caption || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/rfi-photos/${storagePath}`;
  return NextResponse.json({ ...data, public_url: publicUrl }, { status: 201 });
}

// DELETE /api/projects/[id]/rfis/[rfiId]/photos?photoId=xxx
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; rfiId: string }> }
) {
  const { rfiId } = await params;
  const supabase = getServiceClient();
  const url = new URL(req.url);
  const photoId = url.searchParams.get("photoId");

  if (!photoId) return NextResponse.json({ error: "photoId required" }, { status: 400 });

  const { data: photo } = await supabase
    .from("rfi_photos")
    .select("storage_path")
    .eq("id", photoId)
    .eq("rfi_id", rfiId)
    .single();

  if (photo?.storage_path) {
    await supabase.storage.from("rfi-photos").remove([photo.storage_path]);
  }

  const { error } = await supabase
    .from("rfi_photos")
    .delete()
    .eq("id", photoId)
    .eq("rfi_id", rfiId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ deleted: true });
}
