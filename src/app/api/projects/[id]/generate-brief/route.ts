import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { generateBriefSummary } from "@/lib/brief-engine";
import { computeHealthScore } from "@/lib/health-score";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getServiceClient();

  const today = new Date().toISOString().split("T")[0];

  const [{ data: project }, { data: activities }, { data: risks }] = await Promise.all([
    supabase.from("daily_projects").select("*").eq("id", id).single(),
    supabase.from("parsed_activities").select("*").eq("project_id", id),
    supabase.from("daily_risks").select("*").eq("project_id", id).eq("status", "open"),
  ]);

  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const summary = generateBriefSummary(
    activities || [],
    risks || [],
    project.name
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
