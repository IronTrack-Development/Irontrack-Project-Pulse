import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { generateToken } from "@/lib/token-utils";

// POST /api/projects/[id]/subs/[subId]/share
// Generate a new share link (token) for this sub on this project
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; subId: string }> }
) {
  const { id: projectId, subId } = await params;
  const supabase = getServiceClient();

  let body: {
    label?: string;
    expires_at?: string; // ISO date string, optional
    created_by?: string; // user email or id, optional
    deactivate_existing?: boolean; // if true, revoke previous links first
  } = {};

  try {
    const text = await req.text();
    if (text) body = JSON.parse(text);
  } catch {
    // body is optional — swallow parse errors
  }

  // Verify the sub exists on this project
  const { data: sub, error: subError } = await supabase
    .from("project_subs")
    .select("id, sub_name, project_id")
    .eq("id", subId)
    .eq("project_id", projectId)
    .single();

  if (subError || !sub) {
    return NextResponse.json({ error: "Sub not found on this project" }, { status: 404 });
  }

  // Optionally deactivate existing links for this sub
  if (body.deactivate_existing) {
    await supabase
      .from("sub_share_links")
      .update({ active: false })
      .eq("sub_id", subId);
  }

  // Generate unique token — retry once on collision (extremely unlikely)
  let token = generateToken();
  let insertData = null;
  let insertError = null;

  for (let attempt = 0; attempt < 2; attempt++) {
    const result = await supabase
      .from("sub_share_links")
      .insert({
        project_id: projectId,
        sub_id: subId,
        token,
        label: body.label ?? null,
        expires_at: body.expires_at ?? null,
        created_by: body.created_by ?? null,
        active: true,
      })
      .select()
      .single();

    if (!result.error) {
      insertData = result.data;
      break;
    }

    if (result.error.code === "23505" && attempt === 0) {
      // Token collision — regenerate and retry
      token = generateToken();
      insertError = result.error;
    } else {
      insertError = result.error;
      break;
    }
  }

  if (!insertData) {
    return NextResponse.json(
      { error: insertError?.message ?? "Failed to generate share link" },
      { status: 500 }
    );
  }

  // Build the full URL using the app's base URL
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? `https://${req.headers.get("host")}`;
  const shareUrl = `${baseUrl}/view/${token}`;

  return NextResponse.json(
    {
      ...insertData,
      share_url: shareUrl,
    },
    { status: 201 }
  );
}
