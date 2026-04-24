import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

// GET /api/jurisdictions — list/search Arizona jurisdictions
export async function GET(req: NextRequest) {
  const supabase = getServiceClient();
  const url = new URL(req.url);
  const search = url.searchParams.get("search")?.trim();

  let query = supabase
    .from("jurisdictions")
    .select("*")
    .order("name", { ascending: true });

  if (search) {
    query = query.ilike("name", `%${search}%`);
  }

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ jurisdictions: data });
}
