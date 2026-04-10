import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const supabase = await createClient();

    // Get project details
    const { data: project, error: projectError } = await supabase
      .from("daily_projects")
      .select("target_finish_date")
      .eq("id", projectId)
      .single();

    if (projectError) throw projectError;

    // Get all activities for this project
    const { data: activities, error: activitiesError } = await supabase
      .from("parsed_activities")
      .select("percent_complete")
      .eq("project_id", projectId);

    if (activitiesError) throw activitiesError;

    const totalActivities = activities?.length || 0;
    const completeActivities = activities?.filter((a) => (a.percent_complete || 0) >= 100).length || 0;
    const percentComplete = totalActivities > 0 
      ? Math.round((completeActivities / totalActivities) * 100) 
      : 0;

    // Calculate days remaining
    let daysRemaining: number | null = null;
    if (project?.target_finish_date) {
      const targetDate = new Date(project.target_finish_date);
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const diffTime = targetDate.getTime() - now.getTime();
      daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    return NextResponse.json({
      totalActivities,
      completeActivities,
      percentComplete,
      targetFinishDate: project?.target_finish_date || null,
      daysRemaining,
    });
  } catch (error: unknown) {
    console.error("Progress API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch progress" },
      { status: 500 }
    );
  }
}
