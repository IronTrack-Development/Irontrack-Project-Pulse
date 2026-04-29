import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
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

  const { data, error, count } = await supabase
    .from("sub_foremen")
    .select("*", { count: "exact" })
    .eq("company_id", companyId)
    .order("name")
    .range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const foremen = (data || []).map((foreman: Record<string, unknown>) => ({
    ...foreman,
    name: (foreman.name as string | undefined) || "",
  }));

  return NextResponse.json({ data: foremen, total: count });
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

  if (!body.name) {
    return NextResponse.json({ error: "Foreman name is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("sub_foremen")
    .insert({
      ...body,
      company_id: companyId,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data, { status: 201 });
}


