import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { getArizonaToday } from "@/lib/arizona-date";

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
      .select("id, activity_name, trade, percent_complete, status, start_date, finish_date")
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
      const now = new Date(getArizonaToday() + "T00:00:00");
      const diffTime = targetDate.getTime() - now.getTime();
      daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    // Get the most recent daily_log_progress entries per activity
    // We fetch recent daily logs for this project, then get their progress entries
    const { data: recentLogs } = await supabase
      .from("daily_logs")
      .select("id, log_date")
      .eq("project_id", projectId)
      .in("status", ["submitted", "locked"])
      .order("log_date", { ascending: false })
      .limit(30);

    interface ActivityActual {
      activityId: string;
      actualPercent: number;
      plannedPercent: number;
      delta: number;
      activityName: string;
      trade: string;
      history: { logDate: string; pctBefore: number; pctAfter: number; note: string | null }[];
    }

    const activityActuals: ActivityActual[] = [];

    if (recentLogs && recentLogs.length > 0) {
      const logIds = recentLogs.map((l) => l.id);
      const logDateMap = new Map(recentLogs.map((l) => [l.id, l.log_date]));

      const { data: progressEntries } = await supabase
        .from("daily_log_progress")
        .select("daily_log_id, activity_id, pct_complete_before, pct_complete_after, note")
        .in("daily_log_id", logIds);

      if (progressEntries && progressEntries.length > 0) {
        // Group by activity and find most recent + build history
        const activityProgress = new Map<string, typeof progressEntries>();
        for (const p of progressEntries) {
          if (!p.activity_id) continue;
          if (!activityProgress.has(p.activity_id)) activityProgress.set(p.activity_id, []);
          activityProgress.get(p.activity_id)!.push(p);
        }

        const activityMap = new Map((activities || []).map((a) => [a.id, a]));

        for (const [activityId, entries] of activityProgress) {
          const activity = activityMap.get(activityId);
          if (!activity) continue;

          // Sort entries by log date descending
          const sorted = entries.sort((a, b) => {
            const dateA = logDateMap.get(a.daily_log_id) || "";
            const dateB = logDateMap.get(b.daily_log_id) || "";
            return dateB.localeCompare(dateA);
          });

          const mostRecent = sorted[0];
          const actualPercent = Number(mostRecent.pct_complete_after) || 0;
          const plannedPercent = activity.percent_complete || 0;
          const delta = actualPercent - plannedPercent;

          const history = sorted.map((e) => ({
            logDate: logDateMap.get(e.daily_log_id) || "",
            pctBefore: Number(e.pct_complete_before) || 0,
            pctAfter: Number(e.pct_complete_after) || 0,
            note: e.note || null,
          }));

          activityActuals.push({
            activityId,
            actualPercent,
            plannedPercent,
            delta,
            activityName: activity.activity_name,
            trade: activity.trade || "General",
            history,
          });
        }

        // Sort by trade then name
        activityActuals.sort((a, b) =>
          a.trade.localeCompare(b.trade) || a.activityName.localeCompare(b.activityName)
        );
      }
    }

    return NextResponse.json({
      totalActivities,
      completeActivities,
      percentComplete,
      targetFinishDate: project?.target_finish_date || null,
      daysRemaining,
      activityActuals,
    });
  } catch (error: unknown) {
    console.error("Progress API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch progress" },
      { status: 500 }
    );
  }
}
