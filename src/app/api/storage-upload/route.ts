import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

// This endpoint creates a signed upload URL that bypasses RLS
// The browser then uploads directly to Supabase Storage using this URL
export async function POST(req: NextRequest) {
  try {
    const { filename, user_id } = await req.json();

    if (!filename || !user_id) {
      return NextResponse.json({ error: "Missing filename or user_id" }, { status: 400 });
    }

    const supabase = getServiceClient();
    const timestamp = Date.now();
    const storagePath = `${user_id}/${timestamp}-${filename}`;

    // Create signed upload URL (valid for 5 minutes)
    const { data, error } = await supabase.storage
      .from("uploads")
      .createSignedUploadUrl(storagePath);

    if (error) {
      console.error("Signed URL error:", error);
      return NextResponse.json(
        { error: `Failed to create upload URL: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      signed_url: data.signedUrl,
      storage_path: storagePath,
      token: data.token,
    });
  } catch (err: any) {
    console.error("Storage upload route error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create upload URL" },
      { status: 500 }
    );
  }
}
