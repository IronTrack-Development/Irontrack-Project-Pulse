import type { DailyRisk, ParsedActivity } from "@/types";

export interface HealthResult {
  score: number;
  band: "green" | "yellow" | "red";
}

export function computeHealthScore(
  risks: DailyRisk[],
  activities: ParsedActivity[]
): HealthResult {
  let score = 100;

  const highRisks = risks.filter((r) => r.severity === "high" && r.status === "open");
  const mediumRisks = risks.filter((r) => r.severity === "medium" && r.status === "open");
  const atRiskMilestones = risks.filter(
    (r) => r.risk_type === "MILESTONE_AT_RISK" && r.status === "open"
  );

  score -= highRisks.length * 10;
  score -= mediumRisks.length * 5;
  score -= atRiskMilestones.length * 7;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const lateStarts = activities.filter((a) => {
    if (!a.start_date) return false;
    const start = new Date(a.start_date);
    return start < today && a.status === "not_started";
  });
  if (lateStarts.length > 2) score -= 3;

  score = Math.max(0, Math.min(100, score));

  let band: "green" | "yellow" | "red" = "green";
  if (score < 70) band = "red";
  else if (score < 85) band = "yellow";

  return { score, band };
}

export function healthBandColor(band: "green" | "yellow" | "red"): string {
  switch (band) {
    case "green": return "#22C55E";
    case "yellow": return "#EAB308";
    case "red": return "#EF4444";
  }
}

export function scoreToband(score: number): "green" | "yellow" | "red" {
  if (score >= 85) return "green";
  if (score >= 70) return "yellow";
  return "red";
}
