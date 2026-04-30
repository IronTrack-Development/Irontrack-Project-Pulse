import { NextRequest, NextResponse } from "next/server";
import { requireProjectAccess } from "@/lib/project-auth";

// GET /api/projects/[id]/field-reports
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const access = await requireProjectAccess(id);
  if (access.response) return access.response;
  const supabase = access.supabase;
  const url = new URL(req.url);
  const statusFilter = url.searchParams.get("status");

  let query = supabase
    .from("field_reports")
    .select("*", { count: "exact" })
    .eq("project_id", id)
    .order("created_at", { ascending: false });

  if (statusFilter) query = query.eq("status", statusFilter);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ reports: data || [], count: count ?? 0 });
}

// POST /api/projects/[id]/field-reports
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const access = await requireProjectAccess(id);
  if (access.response) return access.response;
  const supabase = access.supabase;
  const body = await req.json();

  // Auto-generate report_number
  const { data: existing } = await supabase
    .from("field_reports")
    .select("report_number")
    .eq("project_id", id)
    .order("report_number", { ascending: false })
    .limit(1);

  const nextNum = existing && existing.length > 0 ? existing[0].report_number + 1 : 1;

  const { data, error } = await supabase
    .from("field_reports")
    .insert({
      project_id: id,
      report_number: nextNum,
      title: body.title || `Issue ${nextNum}`,
      photo_path: body.photo_path || null,
      photo_caption: body.photo_caption || null,
      assigned_to: body.assigned_to || null,
      assigned_company: body.assigned_company || null,
      comments: body.comments || null,
      location: body.location || null,
      priority: body.priority || "medium",
      trade: body.trade || null,
      linked_activity_id: body.linked_activity_id || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
