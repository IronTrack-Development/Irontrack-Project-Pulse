import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase-server";
import { getServiceClient } from "@/lib/supabase";

type AccessResult =
  | { response: NextResponse; supabase?: never; userId?: never }
  | { response?: never; supabase: ReturnType<typeof getServiceClient>; userId: string };

export async function requireSubOpsUser(): Promise<AccessResult> {
  const supabase = await createServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return { supabase: getServiceClient(), userId: user.id };
}

export async function requireSubOpsCompanyAccess(companyId: string): Promise<AccessResult> {
  const access = await requireSubOpsUser();
  if (access.response) return access;

  const { supabase, userId } = access;
  const { data: company, error } = await supabase
    .from("sub_companies")
    .select("id")
    .eq("id", companyId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    return {
      response: NextResponse.json({ error: error.message }, { status: 500 }),
    };
  }

  if (!company) {
    return {
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return access;
}
