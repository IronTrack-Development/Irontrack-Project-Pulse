import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

// GET /api/projects/[id]/subs/[subId] — sub detail
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; subId: string }> }
) {
  const { id: projectId, subId } = await params;
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("project_subs")
    .select("*")
    .eq("id", subId)
    .eq("project_id", projectId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Sub not found" }, { status: 404 });
  }

  // Also fetch associated share links for convenience
  const { data: shareLinks } = await supabase
    .from("sub_share_links")
    .select("id, token, label, created_at, expires_at, active, created_by")
    .eq("sub_id", subId)
    .order("created_at", { ascending: false });

  return NextResponse.json({ ...data, share_links: shareLinks ?? [] });
}

// PATCH /api/projects/[id]/subs/[subId] — update sub
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; subId: string }> }
) {
  const { id: projectId, subId } = await params;
  const supabase = getServiceClient();

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Whitelist updatable fields
  const allowed = [
    "sub_name",
    "contact_name",
    "contact_phone",
    "contact_email",
    "trades",
    "activity_ids",
    "notes",
  ];
  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("project_subs")
    .update(updates)
    .eq("id", subId)
    .eq("project_id", projectId)
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "A sub with this name already exists on this project" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Sub not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}

// DELETE /api/projects/[id]/subs/[subId] — remove a sub
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; subId: string }> }
) {
  const { id: projectId, subId } = await params;
  const supabase = getServiceClient();

  const { error } = await supabase
    .from("project_subs")
    .delete()
    .eq("id", subId)
    .eq("project_id", projectId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
