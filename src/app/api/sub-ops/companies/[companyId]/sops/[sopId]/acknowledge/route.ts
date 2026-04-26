import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ companyId: string; sopId: string }> }
) {
  const { sopId } = await params;
  const supabase = getServiceClient();
  const body = await req.json();

  if (!body.foreman_id) {
    return NextResponse.json({ error: "foreman_id is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("sub_sop_acknowledgments")
    .insert({
      sop_id: sopId,
      foreman_id: body.foreman_id,
    })
    .select()
    .single();

  if (error) {
    // Unique constraint violation = already acknowledged
    if (error.code === "23505") {
      return NextResponse.json({ error: "SOP already acknowledged by this foreman" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
