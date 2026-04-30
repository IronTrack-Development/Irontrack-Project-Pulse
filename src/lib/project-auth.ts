import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase-server";
import { getServiceClient } from "@/lib/supabase";

type ProjectAccessResult =
  | { response: NextResponse; supabase?: never; userId?: never }
  | { response?: never; supabase: ReturnType<typeof getServiceClient>; userId: string };

export async function requireProjectAccess(projectId: string): Promise<ProjectAccessResult> {
  const authClient = await createServerClient();
  const {
    data: { user },
    error,
  } = await authClient.auth.getUser();

  if (error || !user) {
    return { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const supabase = getServiceClient();
  const { data: project, error: projectError } = await supabase
    .from("daily_projects")
    .select("id")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (projectError) {
    return { response: NextResponse.json({ error: projectError.message }, { status: 500 }) };
  }

  if (!project) {
    return { response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { supabase, userId: user.id };
}
