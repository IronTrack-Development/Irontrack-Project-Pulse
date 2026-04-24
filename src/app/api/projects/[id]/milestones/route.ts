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
    const now = new Date(getArizonaToday() + "T00:00:00");
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

    // Fetch daily log context strips for each milestone (±2 days around finish_date)
    const milestoneContextMap: Record<string, Array<{
      logDate: string;
      crewSize: number;
      status: string;
      summary: string;
    }>> = {};

    // Collect all milestone dates and query daily logs
    const milestoneDates = milestonesWithStatus
      .filter((m) => m.milestone_date)
      .map((m) => ({ id: m.id, date: m.milestone_date }));

    if (milestoneDates.length > 0) {
      // Build a date range that covers all milestones ±2 days
      const allDates = milestoneDates.map((m) => new Date(m.date));
      const minDate = new Date(Math.min(...allDates.map((d) => d.getTime())));
      const maxDate = new Date(Math.max(...allDates.map((d) => d.getTime())));
      minDate.setDate(minDate.getDate() - 2);
      maxDate.setDate(maxDate.getDate() + 2);
      const minStr = minDate.toISOString().split("T")[0];
      const maxStr = maxDate.toISOString().split("T")[0];

      const { data: contextLogs } = await supabase
        .from("daily_logs")
        .select("log_date, crew, status, delay_codes, delay_narrative, weather")
        .eq("project_id", projectId)
        .gte("log_date", minStr)
        .lte("log_date", maxStr)
        .in("status", ["submitted", "locked"])
        .order("log_date");

      if (contextLogs) {
        for (const ms of milestoneDates) {
          const msDate = new Date(ms.date);
          const msMin = new Date(msDate);
          msMin.setDate(msMin.getDate() - 2);
          const msMax = new Date(msDate);
          msMax.setDate(msMax.getDate() + 2);
          const msMinStr = msMin.toISOString().split("T")[0];
          const msMaxStr = msMax.toISOString().split("T")[0];

          const relevant = contextLogs.filter(
            (l) => l.log_date >= msMinStr && l.log_date <= msMaxStr
          );

          milestoneContextMap[ms.id] = relevant.map((l) => {
            const crew = (l.crew || []) as Array<{ headcount: number }>;
            const crewSize = crew.reduce((s, c) => s + (c.headcount || 0), 0);
            const delayCodes = (l.delay_codes || []) as string[];
            const weather = (l.weather || {}) as { conditions?: string[]; impact?: string };
            const parts: string[] = [];
            if (weather.conditions && weather.conditions.length > 0) {
              parts.push(weather.conditions[0]);
            }
            if (delayCodes.length > 0) {
              parts.push(`Delay: ${delayCodes.join(", ")}`);
            }
            if (l.delay_narrative) {
              parts.push(l.delay_narrative.substring(0, 80));
            }
            return {
              logDate: l.log_date,
              crewSize,
              status: l.status,
              summary: parts.join(" · ") || "Normal operations",
            };
          });
        }
      }
    }

    // Attach context to milestones
    const milestonesWithContext = milestonesWithStatus.map((m) => ({
      ...m,
      contextStrip: milestoneContextMap[m.id] || [],
    }));

    return NextResponse.json({ milestones: milestonesWithContext });
  } catch (error: unknown) {
    console.error("Milestones API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch milestones" },
      { status: 500 }
    );
  }
}
