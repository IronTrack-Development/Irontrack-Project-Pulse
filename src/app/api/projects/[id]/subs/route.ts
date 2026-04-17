import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { normalizeCompanyName } from "@/lib/company-match";

// GET /api/projects/[id]/subs — list all subs on a project
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("project_subs")
    .select("*")
    .eq("project_id", projectId)
    .order("sub_name", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

// POST /api/projects/[id]/subs — add a sub to a project
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const supabase = getServiceClient();

  let body: {
    sub_name: string;
    contact_name?: string;
    contact_phone?: string;
    contact_email?: string;
    trades: string[];
    activity_ids?: string[];
    notes?: string;
    company_code?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.sub_name || typeof body.sub_name !== "string") {
    return NextResponse.json({ error: "sub_name is required" }, { status: 400 });
  }
  if (!Array.isArray(body.trades)) {
    body.trades = [];
  }

  // Verify the project exists
  const { data: project, error: projError } = await supabase
    .from("daily_projects")
    .select("id")
    .eq("id", projectId)
    .single();

  if (projError || !project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("project_subs")
    .insert({
      project_id: projectId,
      sub_name: body.sub_name.trim(),
      contact_name: body.contact_name ?? null,
      contact_phone: body.contact_phone ?? null,
      contact_email: body.contact_email ?? null,
      trades: body.trades,
      activity_ids: body.activity_ids ?? null,
      notes: body.notes ?? null,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      // unique constraint: (project_id, sub_name)
      return NextResponse.json(
        { error: "A sub with this name already exists on this project" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // ── Link to sub_companies record ─────────────────────────────────────────────
  // If a company_code was provided, do an exact lookup first (instant matching).
  // Otherwise fall back to fuzzy name normalization.
  if (data?.id) {
    try {
      let matched = false;

      // Fast path: company_code exact match
      if (body.company_code?.trim()) {
        const { data: byCode } = await supabase
          .from("sub_companies")
          .select("id")
          .eq("company_code", body.company_code.trim())
          .single();
        if (byCode) {
          await supabase
            .from("project_subs")
            .update({ sub_company_id: byCode.id })
            .eq("id", data.id);
          matched = true;
        }
      }

      // Slow path: fuzzy name normalization
      if (!matched) {
        const normalizedSubName = normalizeCompanyName(body.sub_name);
        const { data: companies } = await supabase
          .from("sub_companies")
          .select("id, company_name");

        if (companies && companies.length > 0) {
          const match = companies.find(
            (c) => normalizeCompanyName(c.company_name) === normalizedSubName
          );
          if (match) {
            await supabase
              .from("project_subs")
              .update({ sub_company_id: match.id })
              .eq("id", data.id);
          }
        }
      }
    } catch {
      // Auto-matching is best-effort — never fail the request
    }
  }

  return NextResponse.json(data, { status: 201 });
}
