import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getStatusSummary(healthScore: number): string {
  if (healthScore >= 85) return "Project is on schedule with activities tracking to plan.";
  if (healthScore >= 70) return "Project is experiencing minor delays but remains recoverable.";
  return "Project is at risk with schedule performance below acceptable thresholds.";
}

function getOutlook(healthScore: number): string {
  if (healthScore >= 85) return "on track";
  if (healthScore >= 70) return "at risk";
  return "at risk";
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getServiceClient();

  // Fetch project
  const { data: project, error: projectError } = await supabase
    .from("daily_projects")
    .select("id, name, health_score, status")
    .eq("id", id)
    .single();

  if (projectError || !project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const today = new Date().toISOString().split("T")[0];

  // Run all queries in parallel
  const [
    { count: totalActivities },
    { count: completeActivities },
    { count: lateActivities },
    { data: inProgressActivities },
    { data: recentlyCompleted },
    { data: nextMilestones },
    { data: topRisks },
  ] = await Promise.all([
    supabase
      .from("parsed_activities")
      .select("*", { count: "exact", head: true })
      .eq("project_id", id),
    supabase
      .from("parsed_activities")
      .select("*", { count: "exact", head: true })
      .eq("project_id", id)
      .eq("status", "complete"),
    supabase
      .from("parsed_activities")
      .select("*", { count: "exact", head: true })
      .eq("project_id", id)
      .eq("status", "late"),
    supabase
      .from("parsed_activities")
      .select("activity_name, trade, percent_complete")
      .eq("project_id", id)
      .eq("status", "in_progress")
      .order("percent_complete", { ascending: false })
      .limit(3),
    supabase
      .from("parsed_activities")
      .select("activity_name, trade, percent_complete")
      .eq("project_id", id)
      .eq("status", "complete")
      .order("actual_finish", { ascending: false })
      .limit(2),
    supabase
      .from("parsed_activities")
      .select("activity_name, finish_date")
      .eq("project_id", id)
      .eq("milestone", true)
      .neq("status", "complete")
      .gte("finish_date", today)
      .order("finish_date", { ascending: true })
      .limit(1),
    supabase
      .from("daily_risks")
      .select("title, severity, description")
      .eq("project_id", id)
      .eq("status", "open")
      .order("severity", { ascending: true }) // high < low alphabetically, use custom ordering below
      .limit(5),
  ]);

  // Compute stats
  const total = totalActivities || 0;
  const complete = completeActivities || 0;
  const completionPercent = total > 0 ? Math.round((complete / total) * 100) : 0;
  const lateCount = lateActivities || 0;

  // Pick highest severity risk (high > medium > low)
  const severityOrder = { high: 0, medium: 1, low: 2 };
  const sortedRisks = (topRisks || []).sort(
    (a, b) =>
      (severityOrder[a.severity as keyof typeof severityOrder] ?? 3) -
      (severityOrder[b.severity as keyof typeof severityOrder] ?? 3)
  );
  const topRisk = sortedRisks[0] || null;

  // Build progress bullets
  const progressActivities = inProgressActivities || [];
  const completedActivities = recentlyCompleted || [];

  const progressBullets: string[] = [];

  if (progressActivities.length > 0) {
    const act = progressActivities[0];
    const tradePrefix = act.trade ? `${act.trade}: ` : "";
    progressBullets.push(
      `${tradePrefix}${act.activity_name} (${act.percent_complete}% complete)`
    );
  }

  if (progressActivities.length > 1) {
    const act = progressActivities[1];
    const tradePrefix = act.trade ? `${act.trade}: ` : "";
    progressBullets.push(
      `${tradePrefix}${act.activity_name} (${act.percent_complete}% complete)`
    );
  } else if (completedActivities.length > 0 && progressBullets.length < 2) {
    const act = completedActivities[0];
    const tradePrefix = act.trade ? `${act.trade}: ` : "";
    progressBullets.push(`${tradePrefix}${act.activity_name} (completed)`);
  }

  if (progressBullets.length === 0) {
    progressBullets.push(`${completionPercent}% of activities complete`);
    if (lateCount > 0) {
      progressBullets.push(`${lateCount} activit${lateCount === 1 ? "y" : "ies"} running late`);
    }
  }

  // Build milestone line
  const nextMilestone = nextMilestones?.[0] || null;
  const milestoneLine = nextMilestone
    ? `${nextMilestone.activity_name} — ${formatDate(nextMilestone.finish_date)}`
    : "No upcoming milestones";

  // Build the snapshot text
  const lines: string[] = [
    "IronTrack Pulse — Executive Snapshot",
    "",
    `Project: ${project.name}`,
    "",
    "Schedule Status:",
    getStatusSummary(project.health_score),
    "",
    "Key Progress:",
  ];

  progressBullets.forEach((b) => lines.push(`• ${b}`));

  if (topRisk) {
    lines.push("");
    lines.push("Primary Risk:");
    lines.push(`• ${topRisk.title}`);
  }

  lines.push("");
  lines.push("Upcoming Milestone:");
  lines.push(`• ${milestoneLine}`);
  lines.push("");
  lines.push(
    `Outlook: Project is ${getOutlook(project.health_score)} based on current activity performance and upcoming dependencies.`
  );

  const text = lines.join("\n");

  return NextResponse.json({ text, projectName: project.name });
}
