import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

// POST /api/projects/[id]/daily-logs/[logId]/upload-photo
// Accepts multipart form with: file, activity_id?, caption?, gps_lat?, gps_lon?
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; logId: string }> }
) {
  const { id, logId } = await params;
  const supabase = getServiceClient();

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const activityId = formData.get("activity_id") as string | null;
  const caption = formData.get("caption") as string | null;
  const gpsLat = formData.get("gps_lat") as string | null;
  const gpsLon = formData.get("gps_lon") as string | null;

  // Generate storage path: project_id/log_date/timestamp-random.ext
  const ext = file.name.split(".").pop() || "jpg";
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 8);
  const storagePath = `${id}/${logId}/${timestamp}-${random}.${ext}`;

  // Upload to Supabase Storage
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await supabase.storage
    .from("daily-log-photos")
    .upload(storagePath, buffer, {
      contentType: file.type || "image/jpeg",
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from("daily-log-photos")
    .getPublicUrl(storagePath);

  // Insert metadata record
  const { data, error } = await supabase
    .from("daily_log_photos")
    .insert({
      daily_log_id: logId,
      activity_id: activityId || null,
      storage_path: storagePath,
      taken_at: new Date(timestamp).toISOString(),
      caption: caption || null,
      gps_lat: gpsLat ? parseFloat(gpsLat) : null,
      gps_lon: gpsLon ? parseFloat(gpsLon) : null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    ...data,
    public_url: urlData.publicUrl,
  }, { status: 201 });
}
