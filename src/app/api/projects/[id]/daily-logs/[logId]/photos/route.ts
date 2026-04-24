import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

// POST /api/projects/[id]/daily-logs/[logId]/photos — upload photo metadata
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; logId: string }> }
) {
  const { id, logId } = await params;
  const supabase = getServiceClient();
  const body = await req.json();

  const { data, error } = await supabase
    .from("daily_log_photos")
    .insert({
      daily_log_id: logId,
      activity_id: body.activity_id || null,
      storage_path: body.storage_path,
      taken_at: body.taken_at || null,
      caption: body.caption || null,
      gps_lat: body.gps_lat || null,
      gps_lon: body.gps_lon || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

// DELETE /api/projects/[id]/daily-logs/[logId]/photos?photoId=xxx
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; logId: string }> }
) {
  const { logId } = await params;
  const supabase = getServiceClient();
  const url = new URL(req.url);
  const photoId = url.searchParams.get("photoId");

  if (!photoId) return NextResponse.json({ error: "photoId required" }, { status: 400 });

  // Get storage path to delete the file too
  const { data: photo } = await supabase
    .from("daily_log_photos")
    .select("storage_path")
    .eq("id", photoId)
    .eq("daily_log_id", logId)
    .single();

  if (photo?.storage_path) {
    await supabase.storage.from("daily-log-photos").remove([photo.storage_path]);
  }

  const { error } = await supabase
    .from("daily_log_photos")
    .delete()
    .eq("id", photoId)
    .eq("daily_log_id", logId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ deleted: true });
}
