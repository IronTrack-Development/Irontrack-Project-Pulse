import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  const { companyId } = await params;
  const supabase = getServiceClient();

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const productionLogId = formData.get("production_log_id") as string | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const timestamp = Date.now();
  const storagePath = `${companyId}/${timestamp}-${file.name}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from("sub-production-photos")
    .upload(storagePath, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  // If a production_log_id is provided, update the log with the photo path
  if (productionLogId) {
    const { error } = await supabase
      .from("sub_production_logs")
      .update({ photo_path: storagePath })
      .eq("id", productionLogId)
      .eq("company_id", companyId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ storage_path: storagePath });
}
