import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { createClient } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  // Verify the caller is authenticated
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    company_name?: string;
    contact_name?: string;
    contact_email?: string;
    contact_phone?: string;
    user_id?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { company_name, contact_name, contact_email, contact_phone, user_id } = body;

  if (!company_name || !company_name.trim()) {
    return NextResponse.json({ error: "company_name is required" }, { status: 400 });
  }

  // Use the authenticated user's ID from the session; allow caller to pass user_id
  // as long as it matches (to support cases where session resolves slightly after signup)
  const resolvedUserId = user_id || user.id;
  if (resolvedUserId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const serviceClient = getServiceClient();

  // Check if a sub_company already exists for this user
  // Use .limit(1) to avoid crashing when duplicate rows already exist.
  const { data: existingRows } = await serviceClient
    .from("sub_companies")
    .select("id")
    .eq("user_id", resolvedUserId)
    .limit(1);

  if (existingRows && existingRows.length > 0) {
    return NextResponse.json(
      { error: "A sub company already exists for this account." },
      { status: 409 }
    );
  }

  const { data, error } = await serviceClient
    .from("sub_companies")
    .insert({
      user_id: resolvedUserId,
      company_name: company_name.trim(),
      contact_name: contact_name?.trim() || null,
      contact_email: contact_email?.trim() || null,
      contact_phone: contact_phone?.trim() || null,
    })
    .select()
    .single();

  if (error) {
    console.error("[register-sub] insert error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
