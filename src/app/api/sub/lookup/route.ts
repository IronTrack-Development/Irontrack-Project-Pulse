import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

// GET /api/sub/lookup?code=IT-XXXXXX
// PUBLIC — no auth required. Company codes are meant to be shared.
// Returns company info if found, 404 if not.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code")?.trim();

  if (!code) {
    return NextResponse.json({ error: "code query parameter is required" }, { status: 400 });
  }

  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("sub_companies")
    .select("id, company_name, contact_name, contact_phone, contact_email, company_code")
    .eq("company_code", code)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "No company found with this code" }, { status: 404 });
  }

  return NextResponse.json(data);
}
