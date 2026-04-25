import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

// GET /api/projects/[id]/rfis
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getServiceClient();
  const url = new URL(req.url);
  const statusFilter = url.searchParams.get("status");

  let query = supabase
    .from("rfis")
    .select(`
      *,
      assigned_contact:company_contacts!rfis_assigned_to_fkey(id, name, company, role),
      rfi_responses(id),
      rfi_photos(id)
    `)
    .eq("project_id", id)
    .order("created_at", { ascending: false });

  if (statusFilter) {
    query = query.eq("status", statusFilter);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Compute days_open in JS
  const rfis = (data || []).map((rfi) => {
    let days_open: number | null = null;
    if (rfi.submitted_date) {
      const end = rfi.answered_date ? new Date(rfi.answered_date) : new Date();
      const start = new Date(rfi.submitted_date);
      days_open = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    }
    return {
      ...rfi,
      days_open,
      response_count: Array.isArray(rfi.rfi_responses) ? rfi.rfi_responses.length : 0,
      photo_count: Array.isArray(rfi.rfi_photos) ? rfi.rfi_photos.length : 0,
    };
  });

  return NextResponse.json({ rfis });
}

// POST /api/projects/[id]/rfis
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getServiceClient();
  const body = await req.json();

  // Auto-number: get max rfi_number for this project
  const { data: existing } = await supabase
    .from("rfis")
    .select("rfi_number")
    .eq("project_id", id)
    .order("created_at", { ascending: false });

  let nextNum = 1;
  if (existing && existing.length > 0) {
    const nums = existing
      .map((r) => parseInt(r.rfi_number.replace("RFI-", ""), 10))
      .filter((n) => !isNaN(n));
    if (nums.length > 0) nextNum = Math.max(...nums) + 1;
  }

  const rfi_number = body.rfi_number || `RFI-${String(nextNum).padStart(3, "0")}`;

  const { data, error } = await supabase
    .from("rfis")
    .insert({
      project_id: id,
      rfi_number,
      subject: body.subject,
      question: body.question,
      spec_section: body.spec_section || null,
      drawing_reference: body.drawing_reference || null,
      priority: body.priority || "normal",
      assigned_to: body.assigned_to || null,
      ball_in_court: body.ball_in_court || "contractor",
      status: body.status || "draft",
      cost_impact: body.cost_impact || false,
      schedule_impact: body.schedule_impact || false,
      due_date: body.due_date || null,
      submitted_date: body.status === "submitted" ? new Date().toISOString().split("T")[0] : null,
      notes: body.notes || null,
      ai_drafted: body.ai_drafted || false,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
