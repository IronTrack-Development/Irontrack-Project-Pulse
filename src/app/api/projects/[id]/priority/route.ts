import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { resolveClientDate } from "@/lib/arizona-date";
import type { ParsedActivity } from "@/types";

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getServiceClient();

  const { data: activities, error } = await supabase
    .from("parsed_activities")
    .select("*")
    .eq("project_id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const all: ParsedActivity[] = activities || [];
  const { searchParams } = new URL(_req.url);
  const clientDate = searchParams.get("clientDate");
  const todayStr = resolveClientDate(clientDate);
  const today = new Date(todayStr + "T12:00:00");
  today.setHours(0, 0, 0, 0);

  // ── Build id→activity map ────────────────────────────────────────────────
  const byId = new Map<string, ParsedActivity>();
  for (const a of all) {
    byId.set(a.id, a);
    if (a.activity_id) byId.set(a.activity_id, a);
  }

  // ── Section 1: Critical Path (next 4 weeks) ─────────────────────────────
  // Critical = activities starting within 4 weeks that are:
  //   - float_days === 0 (true critical path), OR
  //   - float_days <= 3 (near-critical), OR
  //   - have predecessors (part of a logic chain), OR
  //   - milestones within 4 weeks
  // Broadened criteria so schedules without float data still show results
  const in4Weeks = new Date(today);
  in4Weeks.setDate(in4Weeks.getDate() + 28);

  const criticalActivities = all.filter((a) => {
    if (a.status === "complete") return false;
    if (!a.start_date && !a.finish_date) return false;

    const start = a.start_date ? new Date(a.start_date) : null;
    const finish = a.finish_date ? new Date(a.finish_date) : null;

    // Must be within 4-week window (starting or finishing)
    const inWindow =
      (start && start >= today && start <= in4Weeks) ||
      (finish && finish >= today && finish <= in4Weeks) ||
      (start && start <= today && finish && finish >= today); // currently active

    if (!inWindow) return false;

    // True critical path: zero float
    if (a.float_days === 0) return true;

    // Near-critical: low float
    if (a.float_days !== null && a.float_days !== undefined && a.float_days <= 3) return true;

    // Has predecessors (part of a logic chain — likely critical or near-critical)
    if (a.predecessor_ids && a.predecessor_ids.length > 0) return true;

    // Milestones in the window
    if (a.milestone) return true;

    // If no float data at all, include activities starting within 2 weeks (tighter)
    const in2Weeks = new Date(today);
    in2Weeks.setDate(in2Weeks.getDate() + 14);
    if (a.float_days == null && start && start <= in2Weeks) return true;

    return false;
  });

  // Sort by start_date ascending — pick the one closest to today (in progress or soonest upcoming)
  const sortedCritical = [...criticalActivities].sort((a, b) => {
    const da = a.start_date ? new Date(a.start_date).getTime() : Infinity;
    const db = b.start_date ? new Date(b.start_date).getTime() : Infinity;
    return da - db;
  });

  // Prefer in-progress activities; if none, take first upcoming
  const inProgress = sortedCritical.filter((a) => a.status === "in_progress");
  const currentCritical = inProgress[0] ?? sortedCritical[0] ?? null;

  let criticalPathData = null;
  if (currentCritical) {
    // Next critical successor — find successor that is also critical
    const successorIds = currentCritical.successor_ids ?? [];
    const successors = successorIds
      .map((sid) => byId.get(sid))
      .filter((s): s is ParsedActivity => !!s);

    const nextCriticalSuccessor =
      successors.find(
        (s) => s.float_days === 0 || s.float_days == null
      ) ?? successors[0] ?? null;

    // Nearest critical milestone
    const criticalMilestones = criticalActivities.filter((a) => a.milestone);
    const sortedMilestones = criticalMilestones.sort((a, b) => {
      const da = a.finish_date ? new Date(a.finish_date).getTime() : Infinity;
      const db = b.finish_date ? new Date(b.finish_date).getTime() : Infinity;
      return da - db;
    });
    const nearestMilestone = sortedMilestones[0] ?? null;

    // Days until impact — days until current critical activity's finish_date
    const finishDate = currentCritical.finish_date
      ? new Date(currentCritical.finish_date)
      : null;
    const daysUntilImpact = finishDate ? daysBetween(today, finishDate) : null;

    // Impact statement
    const impactedNames = successors.slice(0, 3).map((s) => s.activity_name);
    const impactStatement =
      impactedNames.length > 0
        ? `Delay to "${currentCritical.activity_name}" will push ${impactedNames.join(" and ")}`
        : currentCritical.milestone
        ? `"${currentCritical.activity_name}" is a key milestone — track closely`
        : `"${currentCritical.activity_name}" is on the critical path — any delay will compress the schedule`;

    criticalPathData = {
      currentActivity: currentCritical,
      nextSuccessor: nextCriticalSuccessor,
      nearestMilestone,
      daysUntilImpact,
      impactStatement,
    };
  }

  // ── Section 2: Upcoming Inspections (next 7 days) ────────────────────────
  const in7Days = new Date(today);
  in7Days.setDate(in7Days.getDate() + 7);

  const inspections = all
    .filter((a) => {
      if (a.trade !== "Inspection") return false;
      if (!a.start_date) return false;
      const d = new Date(a.start_date);
      return d >= today && d <= in7Days;
    })
    .sort((a, b) => {
      const da = a.start_date ? new Date(a.start_date).getTime() : 0;
      const db = b.start_date ? new Date(b.start_date).getTime() : 0;
      return da - db;
    })
    .map((insp) => {
      const predIds = insp.predecessor_ids ?? [];
      const preds = predIds.map((pid) => byId.get(pid)).filter((p): p is ParsedActivity => !!p);

      // Readiness
      let readiness: "On Track" | "Watch" | "At Risk" = "On Track";
      if (preds.length > 0) {
        const anyNotStarted = preds.some(
          (p) => p.status === "not_started" || (!p.actual_start && p.percent_complete === 0)
        );
        const anyLate = preds.some(
          (p) =>
            p.finish_date &&
            new Date(p.finish_date) < today &&
            p.status !== "complete"
        );
        const anyInProgress = preds.some((p) => p.status === "in_progress" || p.percent_complete > 0);
        const allComplete = preds.every((p) => p.status === "complete" || p.percent_complete === 100);

        if (allComplete) {
          readiness = "On Track";
        } else if (anyLate || anyNotStarted) {
          readiness = "At Risk";
        } else if (anyInProgress) {
          readiness = "Watch";
        } else {
          readiness = "At Risk";
        }
      }

      const linkedPred = preds[0] ?? null;
      const dueDate = insp.start_date ? new Date(insp.start_date) : null;
      const daysAway = dueDate ? daysBetween(today, dueDate) : null;

      return {
        id: insp.id,
        name: insp.activity_name,
        linkedTask: linkedPred?.activity_name ?? null,
        dueDate: insp.start_date ?? null,
        daysAway,
        readiness,
      };
    });

  // ── Section 3: Behind Schedule ───────────────────────────────────────────
  const lateTasks = all
    .filter((a) => {
      if (!a.finish_date) return false;
      const finish = new Date(a.finish_date);
      return finish < today && a.status !== "complete" && a.percent_complete < 100;
    })
    .sort((a, b) => {
      const da = a.finish_date ? new Date(a.finish_date).getTime() : 0;
      const db = b.finish_date ? new Date(b.finish_date).getTime() : 0;
      return da - db; // earliest (most overdue) first
    })
    .map((a) => {
      const finishDate = new Date(a.finish_date!);
      const daysLate = daysBetween(finishDate, today);

      const successorIds = a.successor_ids ?? [];
      const successors = successorIds
        .map((sid) => byId.get(sid))
        .filter((s): s is ParsedActivity => !!s);
      const impactedNames = successors.slice(0, 3).map((s) => s.activity_name);
      const impactStatement =
        impactedNames.length > 0
          ? `Delay is pushing ${impactedNames.join(" and ")}`
          : "No direct successors — isolated delay";

      return {
        id: a.id,
        name: a.activity_name,
        plannedFinish: a.finish_date,
        daysLate,
        percentComplete: a.percent_complete,
        impactStatement,
      };
    });

  // ── Summary ───────────────────────────────────────────────────────────────
  let criticalPressure: "High" | "Medium" | "Low" = "Low";
  if (currentCritical) {
    const f = currentCritical.float_days;
    if (f === 0 || f == null) criticalPressure = "High";
    else if (f <= 3) criticalPressure = "Medium";
    else criticalPressure = "Low";
  }

  const summary = {
    criticalPressure,
    inspectionsDue7Days: inspections.length,
    lateTasks: lateTasks.length,
  };

  return NextResponse.json({
    summary,
    criticalPath: criticalPathData,
    inspections,
    lateTasks,
  });
}
