/**
 * IronTrack Schedule Reforecast Engine
 * 
 * Pure deterministic CPM scheduling engine. ZERO AI.
 * All calculations are rules-based and reproducible.
 * 
 * Implements:
 * - Forward pass (early start / early finish)
 * - Backward pass (late start / late finish)
 * - Critical path identification
 * - Float calculation (total + free)
 * - Remaining duration recalculation
 * - Dependency propagation (FS with lag)
 * - Schedule impact detection
 * - Rules-based recovery actions
 */

// ─── Types ────────────────────────────────────────────

export interface DependencyLink {
  predecessor_id: string;
  type: "FS"; // Finish-to-Start only for V1
  lag_days: number;
}

export interface ScheduleTask {
  id: string;
  activity_id?: string;       // external ID (P6/MSP activity code)
  activity_name: string;
  wbs?: string;
  trade?: string;
  
  // Durations
  original_duration: number;  // days
  remaining_duration: number; // days
  percent_complete: number;   // 0-100
  manual_override: boolean;   // user manually set remaining_duration
  
  // Baseline dates (original import, immutable)
  baseline_start: string | null;   // YYYY-MM-DD
  baseline_finish: string | null;
  baseline_duration: number | null;
  
  // Current planned dates (from last import or reforecast)
  start_date: string | null;
  finish_date: string | null;
  
  // Actual dates
  actual_start: string | null;
  actual_finish: string | null;
  
  // Forecast dates (computed by engine)
  forecast_start: string | null;
  forecast_finish: string | null;
  
  // CPM computed fields
  early_start: string | null;
  early_finish: string | null;
  late_start: string | null;
  late_finish: string | null;
  total_float: number | null;  // days
  free_float: number | null;   // days
  is_critical: boolean;
  
  // Dependencies
  dependency_links: DependencyLink[];
  predecessor_ids: string[];
  successor_ids: string[];
  
  // Status
  status: string;
  milestone: boolean;
  
  // Constraints
  constraint_type?: string | null;
  constraint_date?: string | null;
  
  // Metadata
  normalized_building?: string | null;
  normalized_phase?: string | null;
}

export interface ScheduleImpact {
  task_id: string;
  task_name: string;
  impact_type: "slip" | "critical_path_change" | "milestone_delay" | "float_consumed";
  description: string;
  delta_days: number;
  severity: "high" | "medium" | "low";
}

export interface RiskFlag {
  task_id: string;
  task_name: string;
  risk_type: "negative_float" | "zero_float" | "milestone_at_risk" | "cascade_risk";
  description: string;
  severity: "high" | "medium" | "low";
}

export interface RecoveryAction {
  priority: number;
  category: "manpower" | "resequence" | "overlap" | "procurement" | "overtime";
  description: string;
  target_task_id?: string;
  target_task_name?: string;
  potential_days_recovered: number;
}

export interface ReforecastResult {
  project_id: string;
  baseline_finish_date: string | null;
  forecast_finish_date: string | null;
  completion_delta_days: number;
  critical_path_changed: boolean;
  updated_tasks: ScheduleTask[];
  schedule_impacts: ScheduleImpact[];
  risk_flags: RiskFlag[];
  recovery_actions: RecoveryAction[];
  critical_path_task_ids: string[];
  stats: {
    total_activities: number;
    complete_activities: number;
    in_progress_activities: number;
    critical_activities: number;
    at_risk_activities: number;
    avg_completion: number;
  };
}

// ─── Date Utilities (business days: Mon-Fri) ──────────

function parseDate(d: string | null | undefined): Date | null {
  if (!d) return null;
  const date = new Date(d + "T00:00:00");
  return isNaN(date.getTime()) ? null : date;
}

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

/** Add business days (Mon-Fri) to a date */
function addBusinessDays(start: Date, days: number): Date {
  if (days <= 0) return new Date(start);
  const result = new Date(start);
  let added = 0;
  while (added < days) {
    result.setDate(result.getDate() + 1);
    const dow = result.getDay();
    if (dow !== 0 && dow !== 6) added++;
  }
  return result;
}

/** Count business days between two dates (exclusive of start, inclusive of end) */
function businessDaysBetween(start: Date, end: Date): number {
  if (end <= start) return 0;
  let count = 0;
  const cursor = new Date(start);
  while (cursor < end) {
    cursor.setDate(cursor.getDate() + 1);
    const dow = cursor.getDay();
    if (dow !== 0 && dow !== 6) count++;
  }
  return count;
}

/** Get today's date as YYYY-MM-DD */
function today(): string {
  return new Date().toISOString().split("T")[0];
}

// ─── Core Engine ──────────────────────────────────────

/**
 * RULE 1: Recalculate remaining duration from percent complete
 */
function recalcRemainingDuration(task: ScheduleTask): number {
  // Complete tasks: 0 remaining
  if (task.actual_finish || task.status === "complete") return 0;
  
  // Manual override: keep user value
  if (task.manual_override) return task.remaining_duration;
  
  // Milestones: 0 duration
  if (task.milestone) return 0;
  
  // Standard formula: remaining = ceil(original * (1 - pct/100))
  const pct = Math.min(100, Math.max(0, task.percent_complete));
  if (pct >= 100) return 0;
  
  return Math.ceil(task.original_duration * (1 - pct / 100));
}

/**
 * RULE 2: Apply completion rules
 */
function applyCompletionRules(task: ScheduleTask): ScheduleTask {
  const updated = { ...task };
  
  // If actual_finish exists → complete
  if (updated.actual_finish) {
    updated.status = "complete";
    updated.remaining_duration = 0;
    updated.percent_complete = 100;
    updated.forecast_finish = updated.actual_finish;
    if (updated.actual_start) updated.forecast_start = updated.actual_start;
    return updated;
  }
  
  // If actual_start exists but no actual_finish → in_progress
  if (updated.actual_start && !updated.actual_finish) {
    if (updated.status === "not_started") updated.status = "in_progress";
  }
  
  // Recalculate remaining duration
  updated.remaining_duration = recalcRemainingDuration(updated);
  
  // If percent_complete >= 100, auto-complete
  if (updated.percent_complete >= 100) {
    updated.status = "complete";
    updated.remaining_duration = 0;
    if (!updated.actual_finish) {
      updated.actual_finish = today();
    }
    updated.forecast_finish = updated.actual_finish;
  }
  
  return updated;
}

/**
 * Build adjacency maps for dependency traversal
 */
function buildDependencyMaps(tasks: ScheduleTask[]): {
  successorMap: Map<string, { task_id: string; lag_days: number }[]>;
  predecessorMap: Map<string, { task_id: string; lag_days: number }[]>;
  taskMap: Map<string, ScheduleTask>;
} {
  const taskMap = new Map<string, ScheduleTask>();
  const successorMap = new Map<string, { task_id: string; lag_days: number }[]>();
  const predecessorMap = new Map<string, { task_id: string; lag_days: number }[]>();
  
  // Index tasks by both id and activity_id
  const idLookup = new Map<string, string>(); // activity_id → uuid
  for (const task of tasks) {
    taskMap.set(task.id, task);
    if (task.activity_id) idLookup.set(task.activity_id, task.id);
  }
  
  // Resolve a reference to a UUID
  const resolve = (ref: string): string | null => {
    if (taskMap.has(ref)) return ref;
    return idLookup.get(ref) || null;
  };
  
  // Build maps from dependency_links (structured) or fall back to predecessor_ids (legacy)
  for (const task of tasks) {
    if (task.dependency_links && task.dependency_links.length > 0) {
      for (const link of task.dependency_links) {
        const predId = resolve(link.predecessor_id);
        if (!predId) continue;
        
        // This task depends on predId (predId is predecessor)
        if (!predecessorMap.has(task.id)) predecessorMap.set(task.id, []);
        predecessorMap.get(task.id)!.push({ task_id: predId, lag_days: link.lag_days || 0 });
        
        if (!successorMap.has(predId)) successorMap.set(predId, []);
        successorMap.get(predId)!.push({ task_id: task.id, lag_days: link.lag_days || 0 });
      }
    } else if (task.predecessor_ids && task.predecessor_ids.length > 0) {
      // Legacy: string array, assume FS with 0 lag
      for (const predRef of task.predecessor_ids) {
        const predId = resolve(predRef);
        if (!predId) continue;
        
        if (!predecessorMap.has(task.id)) predecessorMap.set(task.id, []);
        predecessorMap.get(task.id)!.push({ task_id: predId, lag_days: 0 });
        
        if (!successorMap.has(predId)) successorMap.set(predId, []);
        successorMap.get(predId)!.push({ task_id: task.id, lag_days: 0 });
      }
    }
  }
  
  return { successorMap, predecessorMap, taskMap };
}

/**
 * Topological sort (Kahn's algorithm) for forward/backward pass ordering
 */
function topologicalSort(
  tasks: ScheduleTask[],
  predecessorMap: Map<string, { task_id: string; lag_days: number }[]>
): string[] {
  const inDegree = new Map<string, number>();
  const adjacency = new Map<string, string[]>();
  
  for (const task of tasks) {
    inDegree.set(task.id, 0);
    adjacency.set(task.id, []);
  }
  
  for (const [taskId, preds] of predecessorMap) {
    inDegree.set(taskId, preds.length);
    for (const pred of preds) {
      if (adjacency.has(pred.task_id)) {
        adjacency.get(pred.task_id)!.push(taskId);
      }
    }
  }
  
  // Start with tasks that have no predecessors
  const queue: string[] = [];
  for (const [taskId, degree] of inDegree) {
    if (degree === 0) queue.push(taskId);
  }
  
  const sorted: string[] = [];
  while (queue.length > 0) {
    const current = queue.shift()!;
    sorted.push(current);
    
    for (const succ of (adjacency.get(current) || [])) {
      const newDegree = (inDegree.get(succ) || 0) - 1;
      inDegree.set(succ, newDegree);
      if (newDegree === 0) queue.push(succ);
    }
  }
  
  // If some tasks weren't reached (circular deps), append them
  for (const task of tasks) {
    if (!sorted.includes(task.id)) sorted.push(task.id);
  }
  
  return sorted;
}

/**
 * FORWARD PASS: Calculate early start and early finish for all tasks
 * 
 * Rule: ES = max(predecessor EF + lag) for all predecessors
 *       EF = ES + remaining_duration (business days)
 *       For complete tasks: EF = actual_finish or forecast_finish
 */
function forwardPass(
  tasks: ScheduleTask[],
  taskMap: Map<string, ScheduleTask>,
  predecessorMap: Map<string, { task_id: string; lag_days: number }[]>,
  sortOrder: string[],
  projectStartDate: string
): void {
  const projectStart = parseDate(projectStartDate) || new Date();
  
  for (const taskId of sortOrder) {
    const task = taskMap.get(taskId);
    if (!task) continue;
    
    // Complete tasks: use actual dates
    if (task.status === "complete" && task.actual_start && task.actual_finish) {
      task.early_start = task.actual_start;
      task.early_finish = task.actual_finish;
      task.forecast_start = task.actual_start;
      task.forecast_finish = task.actual_finish;
      continue;
    }
    
    // In-progress with actual_start: ES = actual_start
    let esDate: Date;
    if (task.actual_start) {
      esDate = parseDate(task.actual_start)!;
    } else {
      // ES = max of all (predecessor EF + lag)
      const preds = predecessorMap.get(taskId) || [];
      if (preds.length === 0) {
        // No predecessors: use baseline_start, start_date, or project start
        esDate = parseDate(task.baseline_start) || parseDate(task.start_date) || projectStart;
      } else {
        let maxDate = new Date(0);
        for (const pred of preds) {
          const predTask = taskMap.get(pred.task_id);
          if (!predTask) continue;
          const predEF = parseDate(predTask.early_finish);
          if (predEF) {
            const withLag = addBusinessDays(predEF, pred.lag_days);
            if (withLag > maxDate) maxDate = withLag;
          }
        }
        esDate = maxDate.getTime() === 0
          ? (parseDate(task.baseline_start) || parseDate(task.start_date) || projectStart)
          : maxDate;
      }
    }
    
    // Apply constraint: Start No Earlier Than
    if (task.constraint_type === "start_no_earlier_than" && task.constraint_date) {
      const constraintDate = parseDate(task.constraint_date);
      if (constraintDate && constraintDate > esDate) {
        esDate = constraintDate;
      }
    }
    
    // Ensure ES is not on a weekend
    const esDow = esDate.getDay();
    if (esDow === 0) esDate.setDate(esDate.getDate() + 1);
    if (esDow === 6) esDate.setDate(esDate.getDate() + 2);
    
    // EF = ES + remaining_duration (business days)
    const duration = task.remaining_duration || 0;
    const efDate = duration > 0 ? addBusinessDays(esDate, duration) : new Date(esDate);
    
    task.early_start = formatDate(esDate);
    task.early_finish = formatDate(efDate);
    task.forecast_start = task.actual_start || task.early_start;
    task.forecast_finish = (task.status === "complete" && task.actual_finish)
      ? task.actual_finish
      : task.early_finish;
  }
}

/**
 * BACKWARD PASS: Calculate late start and late finish for all tasks
 * 
 * Rule: LF = min(successor LS - lag) for all successors
 *       LS = LF - remaining_duration
 */
function backwardPass(
  tasks: ScheduleTask[],
  taskMap: Map<string, ScheduleTask>,
  successorMap: Map<string, { task_id: string; lag_days: number }[]>,
  sortOrder: string[],
  projectFinishDate: string | null
): void {
  // Find project end date (latest EF)
  let maxEF = new Date(0);
  for (const task of tasks) {
    const ef = parseDate(task.early_finish);
    if (ef && ef > maxEF) maxEF = ef;
  }
  
  // Use provided project finish if later, or the computed max
  const projFinish = parseDate(projectFinishDate);
  const endDate = (projFinish && projFinish > maxEF) ? projFinish : maxEF;
  
  // Reverse topological order
  const reversed = [...sortOrder].reverse();
  
  for (const taskId of reversed) {
    const task = taskMap.get(taskId);
    if (!task) continue;
    
    // Complete tasks: LS/LF = actual dates
    if (task.status === "complete" && task.actual_start && task.actual_finish) {
      task.late_start = task.actual_start;
      task.late_finish = task.actual_finish;
      continue;
    }
    
    const succs = successorMap.get(taskId) || [];
    let lfDate: Date;
    
    if (succs.length === 0) {
      // No successors: LF = project end date
      lfDate = new Date(endDate);
    } else {
      let minDate = new Date(8640000000000000); // max date
      for (const succ of succs) {
        const succTask = taskMap.get(succ.task_id);
        if (!succTask) continue;
        const succLS = parseDate(succTask.late_start);
        if (succLS) {
          // Subtract lag
          const withLag = succ.lag_days > 0
            ? (() => {
                const d = new Date(succLS);
                let toSubtract = succ.lag_days;
                while (toSubtract > 0) {
                  d.setDate(d.getDate() - 1);
                  if (d.getDay() !== 0 && d.getDay() !== 6) toSubtract--;
                }
                return d;
              })()
            : succLS;
          if (withLag < minDate) minDate = withLag;
        }
      }
      lfDate = minDate.getTime() === 8640000000000000 ? new Date(endDate) : minDate;
    }
    
    // Apply constraint: Finish No Later Than
    if (task.constraint_type === "finish_no_later_than" && task.constraint_date) {
      const constraintDate = parseDate(task.constraint_date);
      if (constraintDate && constraintDate < lfDate) {
        lfDate = constraintDate;
      }
    }
    
    // LS = LF - remaining_duration
    const duration = task.remaining_duration || 0;
    let lsDate: Date;
    if (duration > 0) {
      lsDate = new Date(lfDate);
      let toSubtract = duration;
      while (toSubtract > 0) {
        lsDate.setDate(lsDate.getDate() - 1);
        if (lsDate.getDay() !== 0 && lsDate.getDay() !== 6) toSubtract--;
      }
    } else {
      lsDate = new Date(lfDate);
    }
    
    task.late_start = formatDate(lsDate);
    task.late_finish = formatDate(lfDate);
  }
}

/**
 * Calculate float and identify critical path
 * 
 * Total Float = LS - ES (in business days)
 * Free Float = min(successor ES) - EF
 * Critical = total_float <= 0
 */
function calculateFloat(
  tasks: ScheduleTask[],
  taskMap: Map<string, ScheduleTask>,
  successorMap: Map<string, { task_id: string; lag_days: number }[]>
): string[] {
  const criticalIds: string[] = [];
  
  for (const task of tasks) {
    // Complete tasks: float is 0, not critical
    if (task.status === "complete") {
      task.total_float = 0;
      task.free_float = 0;
      task.is_critical = false;
      continue;
    }
    
    const es = parseDate(task.early_start);
    const ls = parseDate(task.late_start);
    const ef = parseDate(task.early_finish);
    
    // Total float
    if (es && ls) {
      task.total_float = businessDaysBetween(es, ls);
      if (ls < es) task.total_float = -businessDaysBetween(ls, es);
    } else {
      task.total_float = null;
    }
    
    // Free float
    const succs = successorMap.get(task.id) || [];
    if (ef && succs.length > 0) {
      let minSuccES = new Date(8640000000000000);
      for (const succ of succs) {
        const succTask = taskMap.get(succ.task_id);
        if (!succTask) continue;
        const succES = parseDate(succTask.early_start);
        if (succES) {
          const adjusted = succ.lag_days > 0
            ? (() => { const d = new Date(succES); let sub = succ.lag_days; while (sub > 0) { d.setDate(d.getDate() - 1); if (d.getDay() !== 0 && d.getDay() !== 6) sub--; } return d; })()
            : succES;
          if (adjusted < minSuccES) minSuccES = adjusted;
        }
      }
      if (minSuccES.getTime() < 8640000000000000) {
        task.free_float = businessDaysBetween(ef, minSuccES);
        if (minSuccES < ef) task.free_float = -businessDaysBetween(minSuccES, ef);
      } else {
        task.free_float = task.total_float;
      }
    } else {
      task.free_float = task.total_float;
    }
    
    // Critical path: float <= 0
    task.is_critical = (task.total_float !== null && task.total_float <= 0);
    if (task.is_critical) criticalIds.push(task.id);
  }
  
  return criticalIds;
}

/**
 * Detect schedule impacts by comparing forecast vs baseline
 */
function detectImpacts(
  tasks: ScheduleTask[],
  previousCriticalIds: Set<string>
): ScheduleImpact[] {
  const impacts: ScheduleImpact[] = [];
  
  for (const task of tasks) {
    if (task.status === "complete") continue;
    
    const baselineFinish = parseDate(task.baseline_finish);
    const forecastFinish = parseDate(task.forecast_finish);
    
    if (baselineFinish && forecastFinish) {
      const delta = businessDaysBetween(baselineFinish, forecastFinish);
      const negativeDelta = forecastFinish < baselineFinish
        ? -businessDaysBetween(forecastFinish, baselineFinish)
        : delta;
      
      if (negativeDelta > 0) {
        impacts.push({
          task_id: task.id,
          task_name: task.activity_name,
          impact_type: task.milestone ? "milestone_delay" : "slip",
          description: `${task.activity_name} is forecast ${negativeDelta} day${negativeDelta !== 1 ? "s" : ""} beyond baseline finish`,
          delta_days: negativeDelta,
          severity: negativeDelta >= 10 ? "high" : negativeDelta >= 5 ? "medium" : "low",
        });
      }
    }
    
    // Critical path change detection
    const wasCritical = previousCriticalIds.has(task.id);
    if (task.is_critical && !wasCritical) {
      impacts.push({
        task_id: task.id,
        task_name: task.activity_name,
        impact_type: "critical_path_change",
        description: `${task.activity_name} is now on the critical path`,
        delta_days: 0,
        severity: "high",
      });
    }
    
    // Float consumed
    if (task.total_float !== null && task.total_float <= 2 && task.total_float > -999 && !task.is_critical) {
      impacts.push({
        task_id: task.id,
        task_name: task.activity_name,
        impact_type: "float_consumed",
        description: `${task.activity_name} has only ${task.total_float} day${task.total_float !== 1 ? "s" : ""} of float remaining`,
        delta_days: 0,
        severity: task.total_float <= 0 ? "high" : "medium",
      });
    }
  }
  
  return impacts;
}

/**
 * Generate risk flags
 */
function detectRisks(tasks: ScheduleTask[]): RiskFlag[] {
  const flags: RiskFlag[] = [];
  
  for (const task of tasks) {
    if (task.status === "complete") continue;
    
    // Negative float
    if (task.total_float !== null && task.total_float < 0) {
      flags.push({
        task_id: task.id,
        task_name: task.activity_name,
        risk_type: "negative_float",
        description: `${task.activity_name} has ${task.total_float} days negative float — schedule is being pushed`,
        severity: "high",
      });
    }
    
    // Zero float (critical but not negative)
    if (task.total_float === 0 && !task.milestone) {
      flags.push({
        task_id: task.id,
        task_name: task.activity_name,
        risk_type: "zero_float",
        description: `${task.activity_name} has zero float — any delay will push the project`,
        severity: "medium",
      });
    }
    
    // Milestone at risk
    if (task.milestone && task.total_float !== null && task.total_float <= 3) {
      flags.push({
        task_id: task.id,
        task_name: task.activity_name,
        risk_type: "milestone_at_risk",
        description: `Milestone "${task.activity_name}" has ${task.total_float} days float — at risk of delay`,
        severity: task.total_float <= 0 ? "high" : "medium",
      });
    }
  }
  
  return flags;
}

/**
 * Generate rules-based recovery actions (ZERO AI)
 */
function generateRecoveryActions(
  tasks: ScheduleTask[],
  impacts: ScheduleImpact[],
  riskFlags: RiskFlag[],
  completionDelta: number
): RecoveryAction[] {
  const actions: RecoveryAction[] = [];
  let priority = 1;
  
  // Only generate if project is slipping
  if (completionDelta <= 0 && riskFlags.length === 0) return actions;
  
  // Find critical path tasks that are delayed
  const delayedCritical = tasks.filter(
    (t) => t.is_critical && t.status !== "complete" && t.remaining_duration > 0
  );
  
  // Find non-critical tasks with float
  const nonCriticalWithFloat = tasks.filter(
    (t) => !t.is_critical && t.status !== "complete" && (t.total_float || 0) > 3
  );
  
  // Rule 1: Manpower increase on critical delayed tasks
  for (const task of delayedCritical.slice(0, 3)) {
    const baselineFinish = parseDate(task.baseline_finish);
    const forecastFinish = parseDate(task.forecast_finish);
    if (baselineFinish && forecastFinish && forecastFinish > baselineFinish) {
      const delta = businessDaysBetween(baselineFinish, forecastFinish);
      actions.push({
        priority: priority++,
        category: "manpower",
        description: `Increase crew size on "${task.activity_name}" (${task.trade || "General"}) to recover ${delta} days`,
        target_task_id: task.id,
        target_task_name: task.activity_name,
        potential_days_recovered: Math.ceil(delta * 0.5), // conservative: 50% recovery
      });
    }
  }
  
  // Rule 2: Overtime on critical tasks
  if (completionDelta > 5 && delayedCritical.length > 0) {
    actions.push({
      priority: priority++,
      category: "overtime",
      description: `Authorize extended work hours (Saturday work) for critical path trades: ${[...new Set(delayedCritical.map((t) => t.trade || "General"))].join(", ")}`,
      potential_days_recovered: Math.ceil(completionDelta * 0.2),
    });
  }
  
  // Rule 3: Resequence non-critical work
  if (nonCriticalWithFloat.length > 0 && delayedCritical.length > 0) {
    actions.push({
      priority: priority++,
      category: "resequence",
      description: `Defer non-critical work (${nonCriticalWithFloat.length} tasks with ${Math.round(nonCriticalWithFloat.reduce((sum, t) => sum + (t.total_float || 0), 0) / nonCriticalWithFloat.length)} avg days float) to free resources for critical path`,
      potential_days_recovered: Math.ceil(completionDelta * 0.3),
    });
  }
  
  // Rule 4: Overlap safe tasks (look for FS relationships where tasks could run in parallel)
  const criticalWithPreds = delayedCritical.filter(
    (t) => t.dependency_links && t.dependency_links.length > 0 && t.remaining_duration > 5
  );
  for (const task of criticalWithPreds.slice(0, 2)) {
    actions.push({
      priority: priority++,
      category: "overlap",
      description: `Evaluate overlapping "${task.activity_name}" with its predecessor — start when predecessor is 80% complete instead of waiting for full completion`,
      target_task_id: task.id,
      target_task_name: task.activity_name,
      potential_days_recovered: Math.ceil(task.remaining_duration * 0.2),
    });
  }
  
  // Rule 5: Procurement / long-lead check
  const delayedWithLongDuration = delayedCritical.filter((t) => t.remaining_duration >= 15);
  for (const task of delayedWithLongDuration.slice(0, 2)) {
    actions.push({
      priority: priority++,
      category: "procurement",
      description: `Verify material/equipment procurement status for "${task.activity_name}" — confirm long-lead items are ordered and delivery dates won't cause additional delay`,
      target_task_id: task.id,
      target_task_name: task.activity_name,
      potential_days_recovered: 0,
    });
  }
  
  return actions;
}

// ─── Main Entry Point ─────────────────────────────────

/**
 * Run the full reforecast engine on a set of tasks.
 * 
 * @param projectId - project UUID
 * @param tasks - all tasks for the project
 * @param projectStartDate - project start date (YYYY-MM-DD)
 * @param projectFinishDate - baseline/target finish date (YYYY-MM-DD)
 * @param previousCriticalIds - task IDs that were critical before this run
 */
export function runReforecast(
  projectId: string,
  tasks: ScheduleTask[],
  projectStartDate: string,
  projectFinishDate: string | null,
  previousCriticalIds: string[] = []
): ReforecastResult {
  // Step 1: Apply completion rules + recalculate remaining durations
  const updatedTasks = tasks.map(applyCompletionRules);
  
  // Step 2: Build dependency graph
  const { successorMap, predecessorMap, taskMap } = buildDependencyMaps(updatedTasks);
  
  // Step 3: Topological sort
  const sortOrder = topologicalSort(updatedTasks, predecessorMap);
  
  // Step 4: Forward pass
  forwardPass(updatedTasks, taskMap, predecessorMap, sortOrder, projectStartDate);
  
  // Step 5: Backward pass
  backwardPass(updatedTasks, taskMap, successorMap, sortOrder, projectFinishDate);
  
  // Step 6: Calculate float + identify critical path
  const criticalIds = calculateFloat(updatedTasks, taskMap, successorMap);
  
  // Step 7: Detect schedule impacts
  const prevCritSet = new Set(previousCriticalIds);
  const impacts = detectImpacts(updatedTasks, prevCritSet);
  
  // Step 8: Detect risks
  const riskFlags = detectRisks(updatedTasks);
  
  // Step 9: Find forecast project finish date
  let forecastFinish: string | null = null;
  let maxEF = new Date(0);
  for (const task of updatedTasks) {
    const ef = parseDate(task.forecast_finish) || parseDate(task.early_finish);
    if (ef && ef > maxEF) maxEF = ef;
  }
  if (maxEF.getTime() > 0) forecastFinish = formatDate(maxEF);
  
  // Step 10: Calculate completion delta
  const baselineFinish = parseDate(projectFinishDate);
  const fcstFinish = parseDate(forecastFinish);
  let completionDelta = 0;
  if (baselineFinish && fcstFinish) {
    completionDelta = fcstFinish > baselineFinish
      ? businessDaysBetween(baselineFinish, fcstFinish)
      : -businessDaysBetween(fcstFinish, baselineFinish);
  }
  
  // Check if critical path changed
  const criticalChanged = criticalIds.length !== previousCriticalIds.length ||
    criticalIds.some((id) => !prevCritSet.has(id));
  
  // Step 11: Generate recovery actions
  const recoveryActions = generateRecoveryActions(updatedTasks, impacts, riskFlags, completionDelta);
  
  // Step 12: Compute stats
  const complete = updatedTasks.filter((t) => t.status === "complete").length;
  const inProgress = updatedTasks.filter((t) => t.status === "in_progress").length;
  const critical = updatedTasks.filter((t) => t.is_critical).length;
  const atRisk = updatedTasks.filter(
    (t) => t.status !== "complete" && t.total_float !== null && t.total_float <= 0
  ).length;
  const avgCompletion = updatedTasks.length > 0
    ? Math.round(updatedTasks.reduce((s, t) => s + t.percent_complete, 0) / updatedTasks.length)
    : 0;
  
  // Update float_days for compatibility with existing UI
  for (const task of updatedTasks) {
    (task as any).float_days = task.total_float;
  }
  
  return {
    project_id: projectId,
    baseline_finish_date: projectFinishDate,
    forecast_finish_date: forecastFinish,
    completion_delta_days: completionDelta,
    critical_path_changed: criticalChanged,
    updated_tasks: updatedTasks,
    schedule_impacts: impacts,
    risk_flags: riskFlags,
    recovery_actions: recoveryActions,
    critical_path_task_ids: criticalIds,
    stats: {
      total_activities: updatedTasks.length,
      complete_activities: complete,
      in_progress_activities: inProgress,
      critical_activities: critical,
      at_risk_activities: atRisk,
      avg_completion: avgCompletion,
    },
  };
}

/**
 * Convert a ParsedActivity row from DB into a ScheduleTask for the engine
 */
export function dbRowToScheduleTask(row: Record<string, any>): ScheduleTask {
  return {
    id: row.id,
    activity_id: row.activity_id || undefined,
    activity_name: row.activity_name,
    wbs: row.wbs || undefined,
    trade: row.trade || undefined,
    original_duration: row.original_duration || row.baseline_duration || 0,
    remaining_duration: row.remaining_duration || 0,
    percent_complete: row.percent_complete || 0,
    manual_override: row.manual_override || false,
    baseline_start: row.baseline_start || row.start_date || null,
    baseline_finish: row.baseline_finish || row.finish_date || null,
    baseline_duration: row.baseline_duration || row.original_duration || null,
    start_date: row.start_date || null,
    finish_date: row.finish_date || null,
    actual_start: row.actual_start || null,
    actual_finish: row.actual_finish || null,
    forecast_start: row.forecast_start || null,
    forecast_finish: row.forecast_finish || null,
    early_start: row.early_start || null,
    early_finish: row.early_finish || null,
    late_start: row.late_start || null,
    late_finish: row.late_finish || null,
    total_float: row.total_float ?? row.float_days ?? null,
    free_float: row.free_float ?? null,
    is_critical: row.is_critical || false,
    dependency_links: row.dependency_links || [],
    predecessor_ids: row.predecessor_ids || [],
    successor_ids: row.successor_ids || [],
    status: row.status || "not_started",
    milestone: row.milestone || false,
    constraint_type: row.constraint_type || null,
    constraint_date: row.constraint_date || null,
    normalized_building: row.normalized_building || null,
    normalized_phase: row.normalized_phase || null,
  };
}

/**
 * Convert a ScheduleTask back to DB update fields
 */
export function scheduleTaskToDbUpdate(task: ScheduleTask): Record<string, any> {
  return {
    remaining_duration: task.remaining_duration,
    percent_complete: task.percent_complete,
    status: task.status,
    actual_start: task.actual_start,
    actual_finish: task.actual_finish,
    forecast_start: task.forecast_start,
    forecast_finish: task.forecast_finish,
    early_start: task.early_start,
    early_finish: task.early_finish,
    late_start: task.late_start,
    late_finish: task.late_finish,
    total_float: task.total_float,
    free_float: task.free_float,
    is_critical: task.is_critical,
    manual_override: task.manual_override,
    last_reforecast_at: new Date().toISOString(),
    float_days: task.total_float,
  };
}
