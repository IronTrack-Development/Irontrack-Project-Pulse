import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const supabase = getServiceClient();
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = parseInt(searchParams.get("offset") || "0");

  const { data, error, count } = await supabase
    .from("sub_companies")
    .select("*", { count: "exact" })
    .order("name")
    .range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data, total: count });
}

export async function POST(req: NextRequest) {
  const supabase = getServiceClient();
  const body = await req.json();

  if (!body.name) {
    return NextResponse.json({ error: "Company name is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("sub_companies")
    .insert(body)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data, { status: 201 });
}
