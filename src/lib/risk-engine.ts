import type { ParsedActivity } from "@/types";
import { getServiceClient } from "./supabase";

interface RiskInsert {
  project_id: string;
  activity_id?: string;
  risk_type: string;
  severity: "high" | "medium" | "low";
  title: string;
  description: string;
  suggested_action: string;
  status: string;
}

export async function runRiskDetection(
  projectId: string,
  activities: ParsedActivity[]
): Promise<number> {
  const supabase = getServiceClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const risks: RiskInsert[] = [];

  // Delete existing open risks for this project
  await supabase
    .from("daily_risks")
    .delete()
    .eq("project_id", projectId)
    .eq("status", "open");

  const activityMap = new Map<string, ParsedActivity>();
  for (const a of activities) {
    if (a.activity_id) activityMap.set(a.activity_id, a);
    activityMap.set(a.id, a);
  }

  for (const activity of activities) {
    // 1. DELAYED START
    if (activity.start_date && activity.status === "not_started") {
      const startDate = new Date(activity.start_date);
      const daysLate = Math.floor(
        (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysLate > 5) {
        risks.push({
          project_id: projectId,
          activity_id: activity.id,
          risk_type: "DELAYED_START",
          severity: "high",
          title: `Delayed Start: ${activity.activity_name}`,
          description: `Activity was scheduled to start ${daysLate} days ago but has not started.`,
          suggested_action: "Contact trade foreman — confirm mobilization status and update schedule.",
          status: "open",
        });
      } else if (daysLate > 0) {
        risks.push({
          project_id: projectId,
          activity_id: activity.id,
          risk_type: "DELAYED_START",
          severity: "medium",
          title: `Late Start Warning: ${activity.activity_name}`,
          description: `Activity is ${daysLate} day${daysLate > 1 ? "s" : ""} past scheduled start date.`,
          suggested_action: "Confirm start status with field supervisor.",
          status: "open",
        });
      }
    }

    // 2. SUCCESSOR COMPRESSION
    if (
      activity.successor_ids &&
      activity.successor_ids.length > 0 &&
      activity.status !== "complete" &&
      activity.finish_date
    ) {
      const finishDate = new Date(activity.finish_date);
      for (const succId of activity.successor_ids) {
        const succ = activityMap.get(succId);
        if (succ && succ.start_date) {
          const succStart = new Date(succ.start_date);
          if (succStart <= finishDate) {
            risks.push({
              project_id: projectId,
              activity_id: activity.id,
              risk_type: "SUCCESSOR_COMPRESSION",
              severity: "high",
              title: `Schedule Compression: ${activity.activity_name}`,
              description: `Successor "${succ.activity_name}" starts before or on this activity's finish date, and this activity is not complete.`,
              suggested_action: "Review logic tie with scheduler and expedite predecessor work.",
              status: "open",
            });
            break;
          }
        }
      }
    }

    // 3. MILESTONE AT RISK
    if (activity.milestone && activity.finish_date) {
      const finishDate = new Date(activity.finish_date);
      const daysUntil = Math.floor(
        (finishDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysUntil <= 14 && daysUntil >= 0 && activity.status !== "complete") {
        const hasPendingPredecessors =
          activity.predecessor_ids &&
          activity.predecessor_ids.some((predId) => {
            const pred = activityMap.get(predId);
            return pred && pred.status !== "complete";
          });
        if (hasPendingPredecessors || !activity.predecessor_ids?.length) {
          risks.push({
            project_id: projectId,
            activity_id: activity.id,
            risk_type: "MILESTONE_AT_RISK",
            severity: "high",
            title: `Milestone At Risk: ${activity.activity_name}`,
            description: `Milestone due in ${daysUntil} days with incomplete predecessor work.`,
            suggested_action: "Escalate to project manager — review predecessor chain and recovery plan.",
            status: "open",
          });
        }
      }
    }

    // 4. INSPECTION RISK
    if (
      activity.trade === "Inspection" &&
      activity.start_date
    ) {
      const startDate = new Date(activity.start_date);
      const daysUntil = Math.floor(
        (startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysUntil >= 0 && daysUntil <= 5 && activity.status !== "complete") {
        const hasPendingPredecessors =
          activity.predecessor_ids &&
          activity.predecessor_ids.some((predId) => {
            const pred = activityMap.get(predId);
            return pred && pred.status !== "complete";
          });
        if (hasPendingPredecessors) {
          risks.push({
            project_id: projectId,
            activity_id: activity.id,
            risk_type: "INSPECTION_RISK",
            severity: "high",
            title: `Inspection Risk: ${activity.activity_name}`,
            description: `Inspection scheduled in ${daysUntil} days but predecessor work is incomplete.`,
            suggested_action: "Confirm predecessor completion status with field. Contact inspector if delay anticipated.",
            status: "open",
          });
        }
      }
    }

    // 5. MISSING LOGIC
    const hasPreds = activity.predecessor_ids && activity.predecessor_ids.length > 0;
    const hasSuccs = activity.successor_ids && activity.successor_ids.length > 0;
    if (!hasPreds && !hasSuccs && !activity.milestone) {
      risks.push({
        project_id: projectId,
        activity_id: activity.id,
        risk_type: "MISSING_LOGIC",
        severity: "low",
        title: `Isolated Activity: ${activity.activity_name}`,
        description: "Activity has no predecessors or successors — may be missing schedule logic.",
        suggested_action: "Review with scheduler to confirm activity is correctly linked.",
        status: "open",
      });
    }

    // 6. LONG DURATION
    if (activity.original_duration && activity.original_duration > 15) {
      risks.push({
        project_id: projectId,
        activity_id: activity.id,
        risk_type: "LONG_DURATION",
        severity: "low",
        title: `Long Duration Advisory: ${activity.activity_name}`,
        description: `Activity has a ${activity.original_duration}-day duration. Consider breaking into smaller work packages for better field tracking.`,
        suggested_action: "Review with PM — consider subdividing for granular progress tracking.",
        status: "open",
      });
    }
  }

  // Insert in batches of 50
  if (risks.length > 0) {
    for (let i = 0; i < risks.length; i += 50) {
      const batch = risks.slice(i, i + 50);
      await supabase.from("daily_risks").insert(batch);
    }
  }

  return risks.length;
}
