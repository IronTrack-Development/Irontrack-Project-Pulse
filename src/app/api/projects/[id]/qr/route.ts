import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

// GET /api/projects/[id]/qr
// Returns the join URL and project name for QR code generation
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const supabase = getServiceClient();

  const { data: project, error } = await supabase
    .from("daily_projects")
    .select("id, name")
    .eq("id", projectId)
    .single();

  if (error || !project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? `https://${req.headers.get("host")}`;
  const joinUrl = `${baseUrl}/join/${projectId}`;

  return NextResponse.json({
    url: joinUrl,
    project_name: project.name,
    project_id: project.id,
  });
}
