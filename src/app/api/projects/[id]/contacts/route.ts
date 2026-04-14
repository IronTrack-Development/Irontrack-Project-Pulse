import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getServiceClient();
  const { searchParams } = new URL(req.url);
  const trade = searchParams.get("trade");

  let query = supabase
    .from("ready_check_contacts")
    .select("*")
    .eq("project_id", id)
    .order("updated_at", { ascending: false });

  if (trade) query = query.eq("trade", trade);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data || []);
}
