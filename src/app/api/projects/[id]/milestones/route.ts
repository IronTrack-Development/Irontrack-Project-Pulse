import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const supabase = await createClient();

    // Get all milestone activities
    const { data: activities, error } = await supabase
      .from("parsed_activities")
      .select("*")
      .eq("project_id", projectId)
      .or("milestone.eq.true,original_duration.eq.0")
      .order("finish_date", { ascending: true });

    if (error) throw error;

    // Also include activities with "milestone" in the name
    const { data: nameBasedMilestones, error: nameError } = await supabase
      .from("parsed_activities")
      .select("*")
      .eq("project_id", projectId)
      .ilike("activity_name", "%milestone%")
      .order("finish_date", { ascending: true });

    if (nameError) throw nameError;

    // Merge and deduplicate
    const allMilestones = [...(activities || [])];
    nameBasedMilestones?.forEach((m) => {
      if (!allMilestones.find((a) => a.id === m.id)) {
        allMilestones.push(m);
      }
    });

    // Sort by date
    allMilestones.sort((a, b) => {
      const dateA = new Date(a.finish_date || a.start_date);
      const dateB = new Date(b.finish_date || b.start_date);
      return dateA.getTime() - dateB.getTime();
    });

    // Add status to each milestone
    const now = new Date();
    const milestonesWithStatus = allMilestones.map((m) => {
      const date = new Date(m.finish_date || m.start_date);
      const isComplete = (m.percent_complete || 0) >= 100;
      let status: "complete" | "upcoming" | "overdue";
      
      if (isComplete) {
        status = "complete";
      } else if (date < now) {
        status = "overdue";
      } else {
        status = "upcoming";
      }

      return { ...m, status, milestone_date: m.finish_date || m.start_date };
    });

    return NextResponse.json({ milestones: milestonesWithStatus });
  } catch (error: unknown) {
    console.error("Milestones API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch milestones" },
      { status: 500 }
    );
  }
}
