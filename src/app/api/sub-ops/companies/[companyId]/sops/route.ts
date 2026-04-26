import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  const { companyId } = await params;
  const supabase = getServiceClient();
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = parseInt(searchParams.get("offset") || "0");
  const category = searchParams.get("category");

  let query = supabase
    .from("sub_sops")
    .select("*", { count: "exact" })
    .eq("company_id", companyId)
    .order("title");

  if (category) query = query.eq("category", category);

  const { data, error, count } = await query.range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Get acknowledgment counts for each SOP
  const { count: totalForemen } = await supabase
    .from("sub_foremen")
    .select("*", { count: "exact", head: true })
    .eq("company_id", companyId)
    .eq("status", "active");

  const sopsWithCounts = await Promise.all(
    (data || []).map(async (sop: Record<string, unknown>) => {
      const { count: ackCount } = await supabase
        .from("sub_sop_acknowledgments")
        .select("*", { count: "exact", head: true })
        .eq("sop_id", sop.id as string);

      return {
        ...sop,
        acknowledgment_count: ackCount || 0,
        total_foremen: totalForemen || 0,
      };
    })
  );

  return NextResponse.json({ data: sopsWithCounts, total: count });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  const { companyId } = await params;
  const supabase = getServiceClient();
  const body = await req.json();

  if (!body.title || !body.file_path || !body.file_name) {
    return NextResponse.json(
      { error: "title, file_path, and file_name are required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("sub_sops")
    .insert({ ...body, company_id: companyId })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data, { status: 201 });
}
