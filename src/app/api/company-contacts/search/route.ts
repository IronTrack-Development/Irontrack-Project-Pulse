import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { createClient } from "@/lib/supabase-server";

// GET /api/company-contacts/search?project_id=xxx&q=xxx&limit=10
export async function GET(req: NextRequest) {
  const authClient = await createClient();
  const {
    data: { user },
    error: authError,
  } = await authClient.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("project_id")?.trim() ?? "";
  const q = searchParams.get("q")?.trim() ?? "";
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "10"), 50);

  if (!projectId) {
    return NextResponse.json({ error: "project_id is required" }, { status: 400 });
  }

  if (!q) {
    return NextResponse.json([]);
  }
  const safeQuery = q.replace(/[,%()]/g, " ").trim();
  if (!safeQuery) {
    return NextResponse.json([]);
  }

  const supabase = getServiceClient();

  const { data: project } = await supabase
    .from("daily_projects")
    .select("id")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!project) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: ownedProjects, error: ownedProjectsError } = await supabase
    .from("daily_projects")
    .select("id")
    .eq("user_id", user.id);

  if (ownedProjectsError) {
    return NextResponse.json({ error: ownedProjectsError.message }, { status: 500 });
  }

  const ownedProjectIds = (ownedProjects ?? []).map((p) => p.id);
  if (ownedProjectIds.length === 0) {
    return NextResponse.json([]);
  }

  const { data: projectContacts, error: projectContactsError } = await supabase
    .from("project_contacts")
    .select("contact_id")
    .in("project_id", ownedProjectIds);

  if (projectContactsError) {
    return NextResponse.json({ error: projectContactsError.message }, { status: 500 });
  }

  const contactIds = Array.from(
    new Set((projectContacts ?? []).map((row) => row.contact_id).filter(Boolean))
  );
  if (contactIds.length === 0) {
    return NextResponse.json([]);
  }

  const { data, error } = await supabase
    .from("company_contacts")
    .select("id, name, company, email, phone, role, trade, discipline, notes, created_via, created_at, updated_at")
    .in("id", contactIds)
    .or(`name.ilike.%${safeQuery}%,email.ilike.%${safeQuery}%,company.ilike.%${safeQuery}%`)
    .order("name", { ascending: true })
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}
