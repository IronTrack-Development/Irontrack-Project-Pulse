import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { createClient } from "@/lib/supabase-server";

/**
 * GET /api/setup - Check if database tables exist
 * POST /api/setup - Run database migration (requires tables to be created manually first)
 */
export async function GET() {
  const authClient = await createClient();
  const {
    data: { user },
    error: authError,
  } = await authClient.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getServiceClient();

  const tableChecks = await Promise.all([
    supabase.from("daily_projects").select("id").limit(1),
    supabase.from("parsed_activities").select("id").limit(1),
    supabase.from("daily_risks").select("id").limit(1),
    supabase.from("schedule_uploads").select("id").limit(1),
    supabase.from("daily_briefs").select("id").limit(1),
  ]);

  const tables = [
    "daily_projects",
    "parsed_activities",
    "daily_risks",
    "schedule_uploads",
    "daily_briefs",
  ];

  const status = tables.map((name, i) => ({
    table: name,
    exists: !tableChecks[i].error,
    error: tableChecks[i].error?.message,
  }));

  const allReady = status.every((s) => s.exists);

  return NextResponse.json({
    ready: allReady,
    tables: status,
    message: allReady
      ? "Database is ready. All tables exist."
      : "Some tables are missing. Please run the SQL migration in Supabase SQL Editor.",
    migration_file: "src/migrations/001_irontrack_daily.sql",
    supabase_dashboard: "https://supabase.com/dashboard/project/raxdqjivrathfornpxug/editor",
  });
}
