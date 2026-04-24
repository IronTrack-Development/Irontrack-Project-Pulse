import type { ParsedActivity, DailyRisk, BriefSummary } from "@/types";
import { getArizonaToday } from "@/lib/arizona-date";

export function generateBriefSummary(
  activities: ParsedActivity[],
  risks: DailyRisk[],
  projectName: string
): BriefSummary {
  const todayStr = getArizonaToday();
  const today = new Date(todayStr + "T12:00:00");
  today.setHours(0, 0, 0, 0);

  // Today's active activities
  const todayActivities = activities.filter((a) => {
    if (!a.start_date || !a.finish_date) return false;
    const start = new Date(a.start_date);
    const finish = new Date(a.finish_date);
    return start <= today && finish >= today && a.status !== "complete";
  });

  // Recent starts (last 3 days)
  const threeDaysAgo = new Date(today);
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  const recentStarts = activities.filter((a) => {
    if (!a.actual_start) return false;
    const actualStart = new Date(a.actual_start);
    return actualStart >= threeDaysAgo && actualStart <= today;
  });

  // Open high risks
  const highRisks = risks.filter((r) => r.severity === "high" && r.status === "open");
  const medRisks = risks.filter((r) => r.severity === "medium" && r.status === "open");
  const allOpenRisks = risks.filter((r) => r.status === "open");

  // Determine status
  let status: "green" | "yellow" | "red" = "green";
  if (highRisks.length > 0) status = "red";
  else if (medRisks.length > 2 || allOpenRisks.length > 5) status = "yellow";

  // Today's summary sentences
  const todaySentences: string[] = [];
  const tradeGroups = new Map<string, ParsedActivity[]>();
  for (const a of todayActivities) {
    const trade = a.trade || "General";
    if (!tradeGroups.has(trade)) tradeGroups.set(trade, []);
    tradeGroups.get(trade)!.push(a);
  }
  tradeGroups.forEach((acts, trade) => {
    if (acts.length === 1) {
      todaySentences.push(`${acts[0].activity_name} underway (${trade})`);
    } else {
      todaySentences.push(`${acts.length} ${trade} activities in progress`);
    }
  });

  if (recentStarts.length > 0) {
    todaySentences.push(`${recentStarts.length} activit${recentStarts.length > 1 ? "ies" : "y"} recently mobilized`);
  }

  if (todaySentences.length === 0) {
    todaySentences.push(`No active field work scheduled for ${todayStr}`);
  }

  // Watchlist
  const watchlist: string[] = [];
  const inspectionRisks = risks.filter((r) => r.risk_type === "INSPECTION_RISK" && r.status === "open");
  for (const r of inspectionRisks) {
    watchlist.push(r.description || r.title);
  }
  const milestoneRisks = risks.filter((r) => r.risk_type === "MILESTONE_AT_RISK" && r.status === "open");
  for (const r of milestoneRisks.slice(0, 2)) {
    watchlist.push(r.description || r.title);
  }

  // Risk list for brief
  const briefRisks = allOpenRisks.slice(0, 5).map((r) => ({
    severity: r.severity,
    title: r.title,
    detail: r.description || "",
  }));

  // Actions
  const actions: string[] = [];
  for (const r of highRisks.slice(0, 3)) {
    if (r.suggested_action) actions.push(r.suggested_action);
  }
  if (actions.length === 0 && allOpenRisks.length > 0) {
    actions.push("Review open risks with field team");
    actions.push("Confirm today's scheduled activities are mobilized");
  }

  // Next milestone
  const upcomingMilestones = activities
    .filter((a) => a.milestone && a.finish_date && a.status !== "complete")
    .sort((a, b) => {
      const da = new Date(a.finish_date!).getTime();
      const db = new Date(b.finish_date!).getTime();
      return da - db;
    });
  const nextMilestone = upcomingMilestones[0]
    ? {
        name: upcomingMilestones[0].activity_name,
        due_date: upcomingMilestones[0].finish_date!,
      }
    : undefined;

  return {
    date: todayStr,
    status,
    today: todaySentences,
    watchlist,
    risks: briefRisks,
    actions,
    next_milestone: nextMilestone,
  };
}
