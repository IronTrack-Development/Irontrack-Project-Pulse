import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getServiceClient();

  const { data: project, error } = await supabase
    .from("daily_projects")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });

  const today = new Date().toISOString().split("T")[0];

  const [
    { count: totalActivities },
    { count: completeActivities },
    { count: inProgressActivities },
    { count: lateActivities },
    { count: milestoneCount },
    { count: highRisks },
    { count: mediumRisks },
    { data: nextMilestones },
  ] = await Promise.all([
    supabase.from("parsed_activities").select("*", { count: "exact", head: true }).eq("project_id", id),
    supabase.from("parsed_activities").select("*", { count: "exact", head: true }).eq("project_id", id).eq("status", "complete"),
    supabase.from("parsed_activities").select("*", { count: "exact", head: true }).eq("project_id", id).eq("status", "in_progress"),
    supabase.from("parsed_activities").select("*", { count: "exact", head: true }).eq("project_id", id).eq("status", "late"),
    supabase.from("parsed_activities").select("*", { count: "exact", head: true }).eq("project_id", id).eq("milestone", true),
    supabase.from("daily_risks").select("*", { count: "exact", head: true }).eq("project_id", id).eq("severity", "high").eq("status", "open"),
    supabase.from("daily_risks").select("*", { count: "exact", head: true }).eq("project_id", id).eq("severity", "medium").eq("status", "open"),
    supabase.from("parsed_activities").select("*").eq("project_id", id).eq("milestone", true).neq("status", "complete").gte("finish_date", today).order("finish_date", { ascending: true }).limit(1),
  ]);

  const total = totalActivities || 0;
  const complete = completeActivities || 0;
  const completionPercent = total > 0 ? Math.round((complete / total) * 100) : 0;

  let daysToCompletion: number | null = null;
  if (project.target_finish_date) {
    const target = new Date(project.target_finish_date);
    daysToCompletion = Math.ceil(
      (target.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
  }

  return NextResponse.json({
    ...project,
    stats: {
      totalActivities: total,
      completeActivities: complete,
      inProgressActivities: inProgressActivities || 0,
      lateActivities: lateActivities || 0,
      milestoneCount: milestoneCount || 0,
      highRisks: highRisks || 0,
      mediumRisks: mediumRisks || 0,
      completionPercent,
      daysToCompletion,
      nextMilestone: nextMilestones?.[0] || null,
    },
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getServiceClient();
  const body = await req.json();

  const { data, error } = await supabase
    .from("daily_projects")
    .update(body)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}
