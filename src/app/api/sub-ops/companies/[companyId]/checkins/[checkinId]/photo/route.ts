import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ companyId: string; checkinId: string }> }
) {
  const { companyId, checkinId } = await params;
  const supabase = getServiceClient();

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const timestamp = Date.now();
  const storagePath = `${companyId}/${checkinId}/${timestamp}-${file.name}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from("sub-checkin-photos")
    .upload(storagePath, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  // Update check-in with photo path
  const { data, error } = await supabase
    .from("sub_checkins")
    .update({ site_photo_path: storagePath })
    .eq("id", checkinId)
    .eq("company_id", companyId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ storage_path: storagePath, checkin: data });
}
