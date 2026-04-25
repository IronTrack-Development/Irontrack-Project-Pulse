import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

// POST /api/projects/[id]/tm-tickets/[ticketId]/sign
// Body: { role: 'gc' | 'sub', signed_by: string, signature: base64_png }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; ticketId: string }> }
) {
  const { ticketId } = await params;
  const supabase = getServiceClient();

  let body: {
    role?: string;
    signed_by?: string;
    signature?: string; // base64 PNG, may include data:image/png;base64, prefix
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.role || !["gc", "sub"].includes(body.role)) {
    return NextResponse.json({ error: "role must be 'gc' or 'sub'" }, { status: 400 });
  }
  if (!body.signed_by?.trim()) {
    return NextResponse.json({ error: "signed_by is required" }, { status: 400 });
  }
  if (!body.signature) {
    return NextResponse.json({ error: "signature is required" }, { status: 400 });
  }

  // Strip data URL prefix if present
  const base64Data = body.signature.replace(/^data:image\/\w+;base64,/, "");
  const buffer = Buffer.from(base64Data, "base64");

  const fileName = `${ticketId}/${body.role}-signature-${Date.now()}.png`;

  const { error: uploadError } = await supabase.storage
    .from("tm-attachments")
    .upload(fileName, buffer, {
      contentType: "image/png",
      upsert: true,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: urlData } = supabase.storage
    .from("tm-attachments")
    .getPublicUrl(fileName);

  const signaturePath = urlData.publicUrl;
  const now = new Date().toISOString();

  const updateFields: Record<string, string> =
    body.role === "gc"
      ? {
          gc_signature_path: signaturePath,
          gc_signed_by: body.signed_by.trim(),
          gc_signed_at: now,
        }
      : {
          sub_signature_path: signaturePath,
          sub_signed_by: body.signed_by.trim(),
          sub_signed_at: now,
        };

  const { data: ticket, error: updateErr } = await supabase
    .from("tm_tickets")
    .update(updateFields)
    .eq("id", ticketId)
    .select()
    .single();

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

  return NextResponse.json(ticket);
}
