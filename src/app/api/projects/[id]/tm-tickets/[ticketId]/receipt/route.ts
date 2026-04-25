import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

// POST /api/projects/[id]/tm-tickets/[ticketId]/receipt
// Body: { material_item_id: string, photo: base64_png }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; ticketId: string }> }
) {
  const { ticketId } = await params;
  const supabase = getServiceClient();

  let body: {
    material_item_id?: string;
    photo?: string; // base64 PNG or data URL
    filename?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.photo) {
    return NextResponse.json({ error: "photo is required" }, { status: 400 });
  }

  // Strip data URL prefix if present
  const base64Data = body.photo.replace(/^data:image\/\w+;base64,/, "");
  const buffer = Buffer.from(base64Data, "base64");

  const ext = body.filename?.split(".").pop() ?? "jpg";
  const fileName = `${ticketId}/receipt-${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("tm-attachments")
    .upload(fileName, buffer, {
      contentType: ext === "png" ? "image/png" : "image/jpeg",
      upsert: true,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: urlData } = supabase.storage
    .from("tm-attachments")
    .getPublicUrl(fileName);

  const photoPath = urlData.publicUrl;

  // If material_item_id provided, update that row
  if (body.material_item_id) {
    await supabase
      .from("tm_material_items")
      .update({ receipt_photo_path: photoPath })
      .eq("id", body.material_item_id)
      .eq("ticket_id", ticketId);
  }

  return NextResponse.json({ photo_path: photoPath });
}
