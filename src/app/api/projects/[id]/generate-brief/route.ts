import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { generateBriefSummary } from "@/lib/brief-engine";
import { computeHealthScore } from "@/lib/health-score";
import { getArizonaToday } from "@/lib/arizona-date";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getServiceClient();

  const today = getArizonaToday();

  const [{ data: project }, { data: activities }, { data: risks }] = await Promise.all([
    supabase.from("daily_projects").select("*").eq("id", id).single(),
    supabase.from("parsed_activities").select("*").eq("project_id", id),
    supabase.from("daily_risks").select("*").eq("project_id", id).eq("status", "open"),
  ]);

  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  // Fetch most recent daily log for "Yesterday we..." section
  const { data: recentLog } = await supabase
    .from("daily_logs")
    .select("*")
    .eq("project_id", id)
    .lt("log_date", today)
    .in("status", ["submitted", "locked"])
    .order("log_date", { ascending: false })
    .limit(1)
    .single();

  let yesterdaySummary: string[] | undefined;
  if (recentLog) {
    const crew = (recentLog.crew || []) as { trade: string; headcount: number; hours: number }[];
    const totalWorkers = crew.reduce((s, c) => s + (c.headcount || 0), 0);
    const totalHours = crew.reduce((s, c) => s + ((c.headcount || 0) * (c.hours || 0)), 0);
    const delayCodes = (recentLog.delay_codes || []) as string[];
    const lostHours = Number(recentLog.lost_crew_hours) || 0;

    // Fetch progress for this log
    const { data: progressEntries } = await supabase
      .from("daily_log_progress")
      .select("pct_complete_before, pct_complete_after")
      .eq("daily_log_id", recentLog.id);

    const advanced = (progressEntries || []).filter(
      (p) => (p.pct_complete_after || 0) > (p.pct_complete_before || 0)
    ).length;

    yesterdaySummary = [
      `Yesterday we had ${totalWorkers} workers on site (${Math.round(totalHours)} crew-hours)`,
    ];
    if (advanced > 0) {
      yesterdaySummary.push(`${advanced} activit${advanced !== 1 ? "ies" : "y"} advanced`);
    }
    if (delayCodes.length > 0) {
      yesterdaySummary.push(`Delays: ${delayCodes.join(", ")}${lostHours > 0 ? ` (${lostHours} hours lost)` : ""}`);
    }
  }

  const summary = generateBriefSummary(
    activities || [],
    risks || [],
    project.name,
    yesterdaySummary
  );

  // Upsert today's brief
  const { data: brief, error } = await supabase
    .from("daily_briefs")
    .upsert(
      {
        project_id: id,
        brief_date: today,
        summary,
        generated_at: new Date().toISOString(),
      },
      { onConflict: "project_id,brief_date" }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Update health score
  const { score } = computeHealthScore(risks || [], activities || []);
  await supabase
    .from("daily_projects")
    .update({ health_score: score })
    .eq("id", id);

  return NextResponse.json(brief);
}
