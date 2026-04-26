import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

// POST /api/projects/[id]/field-reports/multi-add
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getServiceClient();
  const body = await req.json();

  const items: { photo_path?: string; title?: string }[] = body.items;
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "items array required" }, { status: 400 });
  }

  // Get current max report_number
  const { data: existing } = await supabase
    .from("field_reports")
    .select("report_number")
    .eq("project_id", id)
    .order("report_number", { ascending: false })
    .limit(1);

  let nextNum = existing && existing.length > 0 ? existing[0].report_number + 1 : 1;

  const rows = items.map((item) => {
    const num = nextNum++;
    return {
      project_id: id,
      report_number: num,
      title: item.title || `Issue ${num}`,
      photo_path: item.photo_path || null,
    };
  });

  const { data, error } = await supabase
    .from("field_reports")
    .insert(rows)
    .select();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ reports: data }, { status: 201 });
}
