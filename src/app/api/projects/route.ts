import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { createClient } from "@/lib/supabase-server";
import { getArizonaToday } from "@/lib/arizona-date";

export async function GET() {
  const supabase = await createClient();
  
  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceSupabase = getServiceClient();
  const { data: projects, error } = await serviceSupabase
    .from("daily_projects")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Enrich with stats for each project
  const enriched = await Promise.all(
    (projects || []).map(async (project) => {
      const today = getArizonaToday();

      const { count: totalActivities } = await serviceSupabase
        .from("parsed_activities")
        .select("*", { count: "exact", head: true })
        .eq("project_id", project.id);

      const { count: lateActivities } = await serviceSupabase
        .from("parsed_activities")
        .select("*", { count: "exact", head: true })
        .eq("project_id", project.id)
        .eq("status", "late");

      const { count: completeActivities } = await serviceSupabase
        .from("parsed_activities")
        .select("*", { count: "exact", head: true })
        .eq("project_id", project.id)
        .eq("status", "complete");

      const { count: highRisks } = await serviceSupabase
        .from("daily_risks")
        .select("*", { count: "exact", head: true })
        .eq("project_id", project.id)
        .eq("severity", "high")
        .eq("status", "open");

      // Next milestone
      const { data: milestones } = await serviceSupabase
        .from("parsed_activities")
        .select("activity_name, finish_date")
        .eq("project_id", project.id)
        .eq("milestone", true)
        .neq("status", "complete")
        .gte("finish_date", today)
        .order("finish_date", { ascending: true })
        .limit(1);

      // Today's main activity
      const { data: todayActs } = await serviceSupabase
        .from("parsed_activities")
        .select("activity_name, trade")
        .eq("project_id", project.id)
        .lte("start_date", today)
        .gte("finish_date", today)
        .neq("status", "complete")
        .limit(1);

      const total = totalActivities || 0;
      const complete = completeActivities || 0;
      const completionPercent = total > 0 ? Math.round((complete / total) * 100) : 0;

      let daysToCompletion: number | null = null;
      if (project.target_finish_date) {
        const target = new Date(project.target_finish_date);
        const now = new Date();
        daysToCompletion = Math.ceil(
          (target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );
      }

      return {
        ...project,
        stats: {
          totalActivities: total,
          lateActivities: lateActivities || 0,
          completeActivities: complete,
          completionPercent,
          highRisks: highRisks || 0,
          daysToCompletion,
          nextMilestone: milestones?.[0] || null,
          todayActivity: todayActs?.[0] || null,
        },
      };
    })
  );

  return NextResponse.json(enriched);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  
  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const serviceSupabase = getServiceClient();

  // Check monthly project cap (50 per month)
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const { count: monthlyCount } = await serviceSupabase
    .from("daily_projects")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", monthStart);

  if ((monthlyCount || 0) >= 50) {
    return NextResponse.json(
      { error: "Monthly project limit reached (50 projects). Limit resets on the 1st of each month." },
      { status: 429 }
    );
  }

  const { data, error } = await serviceSupabase
    .from("daily_projects")
    .insert({
      name: body.name,
      project_number: body.project_number,
      client_name: body.client_name,
      location: body.location,
      start_date: body.start_date,
      target_finish_date: body.target_finish_date,
      status: body.status || "active",
      health_score: 100,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  
  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const serviceSupabase = getServiceClient();
  
  // Verify user owns this project
  const { data: project } = await serviceSupabase
    .from('daily_projects')
    .select('user_id')
    .eq('id', id)
    .single();

  if (!project || project.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Cascade deletes handle related tables
  const { error } = await serviceSupabase
    .from('daily_projects')
    .delete()
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, deleted: id });
}
