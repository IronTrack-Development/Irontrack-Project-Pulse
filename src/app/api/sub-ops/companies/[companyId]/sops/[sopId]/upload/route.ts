import { NextRequest, NextResponse } from "next/server";
import { requireSubOpsCompanyAccess } from "@/lib/sub-ops-auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ companyId: string; sopId: string }> }
) {
  const { companyId, sopId } = await params;
  const access = await requireSubOpsCompanyAccess(companyId);
  if (access.response) return access.response;

  const supabase = access.supabase;

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const timestamp = Date.now();
  const storagePath = `${companyId}/${sopId}/${timestamp}-${file.name}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from("sub-sop-files")
    .upload(storagePath, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  // Update SOP with file info
  const { data, error } = await supabase
    .from("sub_sops")
    .update({
      file_path: storagePath,
      file_name: file.name,
      file_size: file.size,
    })
    .eq("id", sopId)
    .eq("company_id", companyId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ storage_path: storagePath, sop: data });
}
