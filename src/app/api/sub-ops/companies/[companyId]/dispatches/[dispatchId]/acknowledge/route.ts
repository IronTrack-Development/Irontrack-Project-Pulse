import { NextRequest, NextResponse } from "next/server";
import { requireSubOpsCompanyAccess } from "@/lib/sub-ops-auth";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ companyId: string; dispatchId: string }> }
) {
  const { companyId, dispatchId } = await params;
  const access = await requireSubOpsCompanyAccess(companyId);
  if (access.response) return access.response;

  const supabase = access.supabase;

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
