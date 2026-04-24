import type { ParsedActivity } from "@/types";
import { getServiceClient } from "./supabase";
import { getArizonaToday } from "@/lib/arizona-date";

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
  const today = new Date(getArizonaToday() + "T00:00:00");

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

  // Run daily-log-driven risk detection
  const logRiskCount = await runDailyLogRiskDetection(projectId, supabase, activities);

  return risks.length + logRiskCount;
}

/**
 * Detect risks from daily log patterns:
 * - Weather pattern: 3+ weather delays in last 7 daily logs
 * - Labor shortage: trade headcount averaging < 50% of schedule
 * - Lost time accumulation: > 40 crew-hours lost in 7 days
 */
async function runDailyLogRiskDetection(
  projectId: string,
  supabase: ReturnType<typeof getServiceClient>,
  activities: ParsedActivity[]
): Promise<number> {
  const risks: RiskInsert[] = [];

  // Fetch last 7 daily logs
  const { data: recentLogs } = await supabase
    .from("daily_logs")
    .select("*")
    .eq("project_id", projectId)
    .in("status", ["submitted", "locked"])
    .order("log_date", { ascending: false })
    .limit(7);

  if (!recentLogs || recentLogs.length === 0) return 0;

  // 1. WEATHER PATTERN RISK
  const weatherDelayLogs = recentLogs.filter((log) => {
    const delayCodes = (log.delay_codes || []) as string[];
    return delayCodes.includes("Weather");
  });

  if (weatherDelayLogs.length >= 3) {
    risks.push({
      project_id: projectId,
      risk_type: "WEATHER_PATTERN",
      severity: "medium",
      title: "Weather Pattern Detected",
      description: `${weatherDelayLogs.length} weather delays in last 7 daily logs. Consider schedule buffer.`,
      suggested_action: "Review weather forecast for next 2 weeks and add contingency days to critical path activities.",
      status: "open",
    });
  }

  // 2. LABOR SHORTAGE RISK
  // Build a trade headcount map from schedule (activities with trade + start/finish spanning today-ish)
  const todayStr = getArizonaToday();
  const tradeWorkersScheduled = new Map<string, number>();
  for (const a of activities) {
    if (!a.trade || a.status === "complete") continue;
    if (a.start_date && a.finish_date && a.start_date <= todayStr && a.finish_date >= todayStr) {
      // Count each active activity as needing workers
      tradeWorkersScheduled.set(a.trade, (tradeWorkersScheduled.get(a.trade) || 0) + 1);
    }
  }

  // Get last 3 logs for labor analysis
  const last3Logs = recentLogs.slice(0, 3);
  const tradeActualCounts = new Map<string, number[]>();
  for (const log of last3Logs) {
    const crew = (log.crew || []) as { trade: string; headcount: number }[];
    for (const c of crew) {
      if (!c.trade) continue;
      if (!tradeActualCounts.has(c.trade)) tradeActualCounts.set(c.trade, []);
      tradeActualCounts.get(c.trade)!.push(c.headcount || 0);
    }
  }

  // For trades with scheduled work, check if actual headcount is averaging < 50%
  // We use a rough heuristic: if a trade has scheduled activities but averaging very low headcount
  for (const [trade, counts] of tradeActualCounts) {
    if (counts.length === 0) continue;
    const avg = counts.reduce((s, c) => s + c, 0) / counts.length;
    // Use scheduled workers as baseline — each active activity expects at least 2 workers
    const scheduledCount = (tradeWorkersScheduled.get(trade) || 0) * 2;
    if (scheduledCount > 0 && avg < scheduledCount * 0.5) {
      risks.push({
        project_id: projectId,
        risk_type: "LABOR_SHORTAGE",
        severity: "high",
        title: `${trade} Understaffed`,
        description: `${trade} averaging ${Math.round(avg)} workers vs ${scheduledCount} planned over last ${counts.length} logs.`,
        suggested_action: `Contact ${trade} foreman — confirm crew availability and mobilization plan.`,
        status: "open",
      });
    }
  }

  // 3. LOST TIME ACCUMULATION
  const totalLostHours = recentLogs.reduce(
    (sum, log) => sum + (Number(log.lost_crew_hours) || 0),
    0
  );

  if (totalLostHours > 40) {
    risks.push({
      project_id: projectId,
      risk_type: "LOST_TIME_ACCUMULATION",
      severity: "high",
      title: "Significant Lost Time",
      description: `${Math.round(totalLostHours)} crew-hours lost in last ${recentLogs.length} daily logs.`,
      suggested_action: "Review delay causes with field team — identify mitigation strategies for top delay codes.",
      status: "open",
    });
  }

  if (risks.length > 0) {
    await supabase.from("daily_risks").insert(risks);
  }

  return risks.length;
}
