import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

// GET /api/company-contacts/search?q=xxx&limit=10
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "10"), 50);

  if (!q) {
    return NextResponse.json([]);
  }

  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("company_contacts")
    .select("id, name, company, email, phone, role, trade, discipline, notes, created_via, created_at, updated_at")
    .or(`name.ilike.%${q}%,email.ilike.%${q}%,company.ilike.%${q}%`)
    .order("name", { ascending: true })
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}
