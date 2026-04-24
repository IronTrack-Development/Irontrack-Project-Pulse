import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { rateLimit } from "@/lib/rate-limit";
import { getArizonaToday } from "@/lib/arizona-date";

const BUCKET = "sub-report-photos";
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB hard ceiling (client compresses before this)

// POST /api/view/[token]/upload-photo
// PUBLIC — uploads a single photo to Supabase Storage and returns its public URL.
// Body: multipart/form-data with fields:
//   file        — the image file (required)
//   report_date — YYYY-MM-DD (optional, defaults to today)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  // Rate limiting: 20 requests per minute per IP
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";
  const rl = rateLimit(`upload-photo:${ip}`, 20, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  const supabase = getServiceClient();

  // ── Validate token ──────────────────────────────────────────────────────────
  const { data: link, error: linkError } = await supabase
    .from("sub_share_links")
    .select("id, project_id, sub_id, active, expires_at")
    .eq("token", token)
    .single();

  if (linkError || !link) {
    return NextResponse.json({ error: "Invalid link" }, { status: 404 });
  }

  if (!link.active) {
    return NextResponse.json({ error: "This link has been deactivated" }, { status: 410 });
  }

  if (link.expires_at && new Date(link.expires_at) < new Date()) {
    return NextResponse.json({ error: "This link has expired" }, { status: 410 });
  }

  // ── Parse multipart form ────────────────────────────────────────────────────
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json(
      { error: `File too large (max ${MAX_FILE_SIZE_BYTES / 1024 / 1024}MB)` },
      { status: 413 }
    );
  }

  // Sanitize content type
  const contentType = file.type.startsWith("image/") ? file.type : "image/jpeg";

  // Derive file extension
  const extMap: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/heic": "heic",
    "image/heif": "heif",
    "image/gif": "gif",
  };
  const ext = extMap[contentType] ?? "jpg";

  const reportDate =
    (formData.get("report_date") as string | null) ??
    getArizonaToday();

  // Unique filename to avoid collisions
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 8);
  const filename = `${timestamp}-${random}.${ext}`;

  // Storage path: {project_id}/{sub_id}/{report_date}/{filename}
  const storagePath = `${link.project_id}/${link.sub_id}/${reportDate}/${filename}`;

  // ── Upload to Supabase Storage ───────────────────────────────────────────────
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, buffer, {
      contentType,
      upsert: false,
    });

  if (uploadError) {
    console.error("[upload-photo] Storage upload error:", uploadError);
    return NextResponse.json(
      { error: "Upload failed: " + uploadError.message },
      { status: 500 }
    );
  }

  // ── Get public URL ──────────────────────────────────────────────────────────
  const { data: urlData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(storagePath);

  return NextResponse.json({
    success: true,
    url: urlData.publicUrl,
    path: storagePath,
  });
}
