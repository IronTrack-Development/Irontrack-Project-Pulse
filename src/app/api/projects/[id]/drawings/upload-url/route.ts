import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

// POST /api/projects/[id]/drawings/upload-url
// Returns a signed upload URL for direct browser → Supabase Storage upload
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getServiceClient();
  const { filename } = await req.json();

  const timestamp = Date.now();
  const safeName = (filename || "drawing").replace(/[^a-zA-Z0-9_.-]/g, "_");
  const storagePath = `${id}/${safeName}_${timestamp}.pdf`;

  const { data, error } = await supabase.storage
    .from("drawings")
    .createSignedUploadUrl(storagePath);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    signed_url: data.signedUrl,
    token: data.token,
    storage_path: storagePath,
  });
}
