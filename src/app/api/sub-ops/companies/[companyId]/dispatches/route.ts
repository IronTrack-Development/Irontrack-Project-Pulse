import { NextRequest, NextResponse } from "next/server";
import { requireSubOpsCompanyAccess } from "@/lib/sub-ops-auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  const { companyId } = await params;
  const access = await requireSubOpsCompanyAccess(companyId);
  if (access.response) return access.response;

  const supabase = access.supabase;
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = parseInt(searchParams.get("offset") || "0");
  const date = searchParams.get("date");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const foremanId = searchParams.get("foreman_id");
  const status = searchParams.get("status");

  let query = supabase
    .from("sub_dispatches")
    .select("*, sub_foremen(name)", { count: "exact" })
    .eq("company_id", companyId)
    .order("dispatch_date", { ascending: false });

  if (date) query = query.eq("dispatch_date", date);
  if (from) query = query.gte("dispatch_date", from);
  if (to) query = query.lte("dispatch_date", to);
  if (foremanId) query = query.eq("foreman_id", foremanId);
  if (status) query = query.eq("status", status);

  const { data, error, count } = await query.range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Flatten foreman name
  const dispatches = (data || []).map((d: Record<string, unknown>) => {
    const foreman = d.sub_foremen as { name: string } | null;
    return {
      ...d,
      foreman_name: foreman?.name || null,
      sub_foremen: undefined,
    };
  });

  return NextResponse.json({ data: dispatches, total: count });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  const { companyId } = await params;
  const access = await requireSubOpsCompanyAccess(companyId);
  if (access.response) return access.response;

  const supabase = access.supabase;
  const body = await req.json();

  if (!body.foreman_id || !body.project_name || !body.dispatch_date || !body.scope_of_work) {
    return NextResponse.json(
      { error: "foreman_id, project_name, dispatch_date, and scope_of_work are required" },
      { status: 400 }
    );
  }

  const dispatchInsert = {
    foreman_id: body.foreman_id,
    project_name: body.project_name,
    project_location: body.project_location || null,
    dispatch_date: body.dispatch_date,
    scope_of_work: body.scope_of_work,
    priority_notes: body.priority_notes || null,
    safety_focus: body.safety_focus || null,
    material_notes: body.material_notes || null,
    special_instructions: body.special_instructions || null,
    expected_crew_size: body.expected_crew_size ?? null,
    expected_hours: body.expected_hours ?? null,
    status: body.status || "pending",
    company_id: companyId,
  };

  const { data, error } = await supabase
    .from("sub_dispatches")
    .insert(dispatchInsert)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (data && Array.isArray(body.sop_ids) && body.sop_ids.length > 0) {
    const links = body.sop_ids
      .filter((sopId: unknown): sopId is string => typeof sopId === "string" && sopId.length > 0)
      .map((sopId: string) => ({ dispatch_id: data.id, sop_id: sopId }));

    if (links.length > 0) {
      const { error: sopError } = await supabase.from("sub_dispatch_sops").insert(links);
      if (sopError) {
        return NextResponse.json(
          { error: "Dispatch created, but SOP attachments failed", dispatch: data },
          { status: 207 }
        );
      }
    }
  }

  return NextResponse.json(data, { status: 201 });
}
