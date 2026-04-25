import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

// POST /api/projects/[id]/punch-list/[itemId]/photos
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const { itemId } = await params;
  const supabase = getServiceClient();

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const caption = formData.get("caption") as string | null;
  const photo_type = (formData.get("photo_type") as string) || "issue";

  if (!file) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }

  const timestamp = Date.now();
  const ext = file.name.split(".").pop() || "jpg";
  const storagePath = `${itemId}/${timestamp}_${photo_type}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const { error: uploadError } = await supabase.storage
    .from("punch-photos")
    .upload(storagePath, arrayBuffer, {
      contentType: file.type || "image/jpeg",
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data, error } = await supabase
    .from("punch_item_photos")
    .insert({
      punch_item_id: itemId,
      storage_path: storagePath,
      photo_type,
      caption: caption || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/punch-photos/${storagePath}`;
  return NextResponse.json({ ...data, public_url: publicUrl }, { status: 201 });
}

// DELETE /api/projects/[id]/punch-list/[itemId]/photos?photoId=xxx
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const { itemId } = await params;
  const supabase = getServiceClient();
  const url = new URL(req.url);
  const photoId = url.searchParams.get("photoId");

  if (!photoId) return NextResponse.json({ error: "photoId required" }, { status: 400 });

  const { data: photo } = await supabase
    .from("punch_item_photos")
    .select("storage_path")
    .eq("id", photoId)
    .eq("punch_item_id", itemId)
    .single();

  if (photo?.storage_path) {
    await supabase.storage.from("punch-photos").remove([photo.storage_path]);
  }

  const { error } = await supabase
    .from("punch_item_photos")
    .delete()
    .eq("id", photoId)
    .eq("punch_item_id", itemId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ deleted: true });
}
