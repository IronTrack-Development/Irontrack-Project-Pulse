import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

// GET /api/projects/[id]/directory/qr — get or create active join token
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const supabase = getServiceClient();

  const { data: project, error: projError } = await supabase
    .from("daily_projects")
    .select("id, name")
    .eq("id", projectId)
    .single();

  if (projError || !project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // Look for an active, non-expired token
  const now = new Date().toISOString();
  const { data: existing } = await supabase
    .from("directory_join_tokens")
    .select("id, token, expires_at")
    .eq("project_id", projectId)
    .eq("is_active", true)
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let token: string;
  let expiresAt: string | null;

  if (existing) {
    token = existing.token;
    expiresAt = existing.expires_at;
  } else {
    // Create new token with 30-day expiry
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 30);

    const { data: newToken, error: createError } = await supabase
      .from("directory_join_tokens")
      .insert({
        project_id: projectId,
        expires_at: expiry.toISOString(),
        is_active: true,
      })
      .select("token, expires_at")
      .single();

    if (createError || !newToken) {
      return NextResponse.json({ error: "Failed to create token" }, { status: 500 });
    }

    token = newToken.token;
    expiresAt = newToken.expires_at;
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? `https://${req.headers.get("host")}`;
  const joinUrl = `${baseUrl}/join/${projectId}/directory?token=${token}`;

  return NextResponse.json({
    token,
    url: joinUrl,
    project_name: project.name,
    expires_at: expiresAt,
  });
}

// POST /api/projects/[id]/directory/qr — create new token (invalidates old)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const supabase = getServiceClient();

  const { data: project, error: projError } = await supabase
    .from("daily_projects")
    .select("id, name")
    .eq("id", projectId)
    .single();

  if (projError || !project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // Deactivate all existing tokens
  await supabase
    .from("directory_join_tokens")
    .update({ is_active: false })
    .eq("project_id", projectId);

  // Create new token with 30-day expiry
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + 30);

  const { data: newToken, error: createError } = await supabase
    .from("directory_join_tokens")
    .insert({
      project_id: projectId,
      expires_at: expiry.toISOString(),
      is_active: true,
    })
    .select("token, expires_at")
    .single();

  if (createError || !newToken) {
    return NextResponse.json({ error: "Failed to create token" }, { status: 500 });
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? `https://${req.headers.get("host")}`;
  const joinUrl = `${baseUrl}/join/${projectId}/directory?token=${newToken.token}`;

  return NextResponse.json({
    token: newToken.token,
    url: joinUrl,
    project_name: project.name,
    expires_at: newToken.expires_at,
  });
}
