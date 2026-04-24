import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

// GET /api/projects/[id]/inspections — get jurisdiction + inspection history
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getServiceClient();

  // Get locked jurisdiction for this project
  const { data: pj } = await supabase
    .from("project_jurisdiction")
    .select("*, jurisdictions(*)")
    .eq("project_id", id)
    .single();

  // Get inspection requests
  const { data: inspections, error } = await supabase
    .from("inspection_requests")
    .select("*")
    .eq("project_id", id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Get jurisdiction-specific inspection codes if jurisdiction is locked
  let inspectionCodes: { code: string; description: string; category: string; permit_type: string | null }[] = [];
  if (pj?.jurisdiction_id) {
    const { data: codes } = await supabase
      .from("jurisdiction_inspection_codes")
      .select("code, description, category, permit_type")
      .eq("jurisdiction_id", pj.jurisdiction_id)
      .order("sort_order", { ascending: true });
    inspectionCodes = codes || [];
  }

  return NextResponse.json({
    jurisdiction: pj?.jurisdictions || null,
    projectJurisdiction: pj || null,
    inspections: inspections || [],
    inspectionCodes,
  });
}

// POST /api/projects/[id]/inspections — create inspection request or lock jurisdiction
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getServiceClient();
  const body = await req.json();

  // If action is "lock-jurisdiction", lock it to this project
  if (body.action === "lock-jurisdiction") {
    // Check if already locked
    const { data: existing } = await supabase
      .from("project_jurisdiction")
      .select("id")
      .eq("project_id", id)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "Jurisdiction already locked for this project" },
        { status: 409 }
      );
    }

    const { data, error } = await supabase
      .from("project_jurisdiction")
      .insert({
        project_id: id,
        jurisdiction_id: body.jurisdiction_id,
        set_by: body.set_by || "unknown",
      })
      .select("*, jurisdictions(*)")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  }

  // Otherwise, create an inspection request
  const { data: pj } = await supabase
    .from("project_jurisdiction")
    .select("jurisdiction_id")
    .eq("project_id", id)
    .single();

  if (!pj) {
    return NextResponse.json(
      { error: "No jurisdiction locked for this project" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("inspection_requests")
    .insert({
      project_id: id,
      jurisdiction_id: pj.jurisdiction_id,
      inspection_type: body.inspection_type,
      permit_number: body.permit_number || null,
      requested_date: body.requested_date || null,
      contact_name: body.contact_name || null,
      contact_phone: body.contact_phone || null,
      time_window: body.time_window || "Anytime",
      notes: body.notes || null,
      status: body.portal_url_used ? "redirected" : "called",
      portal_url_used: body.portal_url_used || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

// PATCH /api/projects/[id]/inspections — update inspection request status
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getServiceClient();
  const body = await req.json();

  if (!body.inspection_id || !body.status) {
    return NextResponse.json({ error: "inspection_id and status required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("inspection_requests")
    .update({
      status: body.status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", body.inspection_id)
    .eq("project_id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
