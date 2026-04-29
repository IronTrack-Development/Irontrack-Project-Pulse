import { NextRequest, NextResponse } from "next/server";
import { requireSubOpsUser } from "@/lib/sub-ops-auth";

export async function GET(req: NextRequest) {
  const access = await requireSubOpsUser();
  if (access.response) return access.response;

  const { supabase, userId } = access;
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = parseInt(searchParams.get("offset") || "0");

  const { data, error, count } = await supabase
    .from("sub_companies")
    .select("*", { count: "exact" })
    .eq("user_id", userId)
    .order("company_name")
    .range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data, total: count });
}

export async function POST(req: NextRequest) {
  const access = await requireSubOpsUser();
  if (access.response) return access.response;

  const { supabase, userId } = access;
  const body = await req.json();

  if (!body.name && !body.company_name) {
    return NextResponse.json({ error: "Company name is required" }, { status: 400 });
  }

  const companyName = body.company_name || body.name;

  const { data, error } = await supabase
    .from("sub_companies")
    .insert({
      ...body,
      user_id: userId,
      company_name: companyName,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data, { status: 201 });
}
