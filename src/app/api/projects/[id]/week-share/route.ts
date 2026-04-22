import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { randomBytes } from "crypto";

/**
 * POST /api/projects/[id]/week-share
 * 
 * Generate a shareable link + QR code URL for a week's lookahead.
 * Creates a time-limited share token stored in the database.
 * 
 * Body: { week: 1|2|3 }
 * Returns: { url, qr_url, token, expires_at }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const supabase = getServiceClient();
  const body = await req.json();
  const week = body.week || 1;

  // Validate project exists
  const { data: project, error: projErr } = await supabase
    .from("daily_projects")
    .select("id, name")
    .eq("id", projectId)
    .single();

  if (projErr || !project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // Generate a share token
  const token = randomBytes(16).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7-day expiry

  // Store in week_share_links table
  const { error: insertErr } = await supabase
    .from("week_share_links")
    .insert({
      project_id: projectId,
      token,
      week_number: week,
      expires_at: expiresAt.toISOString(),
      active: true,
    });

  if (insertErr) {
    // Table might not exist yet — return a direct URL instead
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${req.headers.get("host")}`;
    const directUrl = `${baseUrl}/projects/${projectId}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(directUrl)}`;
    
    return NextResponse.json({
      url: directUrl,
      qr_url: qrUrl,
      project_name: project.name,
      week,
      fallback: true,
    });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${req.headers.get("host")}`;
  const shareUrl = `${baseUrl}/view/week/${token}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(shareUrl)}&color=F97316&bgcolor=0B0B0D`;

  return NextResponse.json({
    url: shareUrl,
    qr_url: qrUrl,
    token,
    project_name: project.name,
    week,
    expires_at: expiresAt.toISOString(),
  });
}
