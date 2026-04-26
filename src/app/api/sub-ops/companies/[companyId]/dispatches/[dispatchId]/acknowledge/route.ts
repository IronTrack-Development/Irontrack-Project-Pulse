import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ companyId: string; dispatchId: string }> }
) {
  const { companyId, dispatchId } = await params;
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("sub_dispatches")
    .update({
      acknowledged: true,
      acknowledged_at: new Date().toISOString(),
      status: "acknowledged",
    })
    .eq("id", dispatchId)
    .eq("company_id", companyId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}
