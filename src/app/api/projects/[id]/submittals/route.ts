import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

// GET /api/projects/[id]/submittals
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const supabase = getServiceClient();
  const { searchParams } = new URL(req.url);
  const statusFilter = searchParams.get("status");

  let query = supabase
    .from("submittals")
    .select(`
      id,
      project_id,
      submittal_number,
      spec_section,
      title,
      description,
      ball_in_court,
      status,
      required_by,
      submitted_date,
      returned_date,
      lead_time_days,
      priority,
      notes,
      created_at,
      updated_at,
      assigned_contact:company_contacts!submittals_assigned_to_fkey (
        id, name, company, role
      ),
      reviewer_contact:company_contacts!submittals_reviewer_id_fkey (
        id, name, company, role
      )
    `)
    .eq("project_id", projectId)
    .order("submittal_number", { ascending: true });

  if (statusFilter) {
    query = query.eq("status", statusFilter);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Get revision counts
  const submittalIds = (data ?? []).map((s) => s.id);
  let revisionCounts: Record<string, number> = {};

  if (submittalIds.length > 0) {
    const { data: revData } = await supabase
      .from("submittal_revisions")
      .select("submittal_id")
      .in("submittal_id", submittalIds);

    if (revData) {
      for (const r of revData) {
        revisionCounts[r.submittal_id] = (revisionCounts[r.submittal_id] ?? 0) + 1;
      }
    }
  }

  const result = (data ?? []).map((s) => ({
    ...s,
    revision_count: revisionCounts[s.id] ?? 0,
  }));

  return NextResponse.json(result);
}

// POST /api/projects/[id]/submittals
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const supabase = getServiceClient();

  let body: {
    submittal_number?: string;
    spec_section?: string;
    title?: string;
    description?: string;
    assigned_to?: string | null;
    reviewer_id?: string | null;
    ball_in_court?: string;
    status?: string;
    required_by?: string | null;
    submitted_date?: string | null;
    returned_date?: string | null;
    lead_time_days?: number | null;
    priority?: string;
    notes?: string | null;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.title?.trim()) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }
  if (!body.submittal_number?.trim()) {
    return NextResponse.json({ error: "submittal_number is required" }, { status: 400 });
  }

  const { data: submittal, error } = await supabase
    .from("submittals")
    .insert({
      project_id: projectId,
      submittal_number: body.submittal_number.trim(),
      spec_section: body.spec_section?.trim() ?? null,
      title: body.title.trim(),
      description: body.description?.trim() ?? null,
      assigned_to: body.assigned_to ?? null,
      reviewer_id: body.reviewer_id ?? null,
      ball_in_court: body.ball_in_court ?? "contractor",
      status: body.status ?? "not_started",
      required_by: body.required_by ?? null,
      submitted_date: body.submitted_date ?? null,
      returned_date: body.returned_date ?? null,
      lead_time_days: body.lead_time_days ?? null,
      priority: body.priority ?? "normal",
      notes: body.notes ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Create initial revision entry
  await supabase.from("submittal_revisions").insert({
    submittal_id: submittal.id,
    revision_number: 1,
    status: submittal.status,
    notes: "Created",
    changed_by: "system",
  });

  return NextResponse.json(submittal, { status: 201 });
}
