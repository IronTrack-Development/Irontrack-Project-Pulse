// ──────────────────────────────────────────────────────────────────────────────
// Primavera P6 XER Parser
// Parses TASK, PROJWBS, TASKRSRC, and TASKNOTE tables from XER exports.
// Builds the full WBS ancestor chain for each task.
// ──────────────────────────────────────────────────────────────────────────────

export interface XERTask {
  // Core scheduling fields
  task_id: string;
  task_name: string;
  start_date: string | null;
  end_date: string | null;
  percent_complete: number;
  duration: number | null;
  milestone: boolean;

  // Raw WBS reference (node ID from PROJWBS)
  wbs_id: string | null;

  // Legacy resource field (may be populated from TASKRSRC)
  rsrc_names: string | null;

  // Predecessor task IDs (comma-separated task_ids)
  pred_task_ids: string | null;

  // Extended metadata (new)
  constraint_type: string | null;
  constraint_date: string | null;
  resource_names: string | null;  // comma-separated resource names from TASKRSRC
  notes: string | null;           // from TASKNOTE
  external_task_id: string | null;
  external_unique_id: string | null;
  outline_level: number | null;

  // WBS hierarchy
  parent_wbs_name: string | null;
  /** Full WBS ancestor chain from the task's immediate WBS node up to root.
   *  E.g. ["Foundation", "Building F", "Encanto Storage"]
   *  Index 0 = task's own WBS node (direct parent), last = project root.
   */
  wbs_path: string[];
}

// ── Internal types ─────────────────────────────────────────────────────────────

interface WBSNode {
  wbs_id: string;
  parent_wbs_id: string;
  wbs_name: string;
  wbs_short_name: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseXERDate(dateStr: string): string | null {
  if (!dateStr) return null;
  const datePart = dateStr.split(" ")[0];
  if (!datePart || datePart.length < 10) return null;
  return datePart; // YYYY-MM-DD
}

/**
 * Parse a single %T/%F/%R block from an XER text.
 * Returns an array of row objects keyed by the %F field names.
 */
function parseTable(
  lines: string[],
  tableName: string
): Record<string, string>[] {
  const rows: Record<string, string>[] = [];
  let inTable = false;
  let fieldNames: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith("%T")) {
      const parts = trimmed.split("\t");
      inTable = (parts[1]?.trim() || "") === tableName;
      fieldNames = [];
      continue;
    }

    if (!inTable) continue;

    if (trimmed.startsWith("%F")) {
      fieldNames = trimmed.split("\t").slice(1).map((f) => f.trim());
      continue;
    }

    if (trimmed.startsWith("%R")) {
      const values = trimmed.split("\t").slice(1);
      const row: Record<string, string> = {};
      fieldNames.forEach((field, idx) => {
        row[field] = values[idx] ?? "";
      });
      rows.push(row);
    }
  }

  return rows;
}

/**
 * Build a map from wbs_id → ancestor name array (leaf → root).
 * The first element is the node's own wbs_name, last is the root.
 */
function buildWBSPathMap(
  wbsNodes: WBSNode[]
): Map<string, string[]> {
  // Index nodes by wbs_id for O(1) parent lookup
  const byId = new Map<string, WBSNode>();
  for (const node of wbsNodes) {
    byId.set(node.wbs_id, node);
  }

  const cache = new Map<string, string[]>();

  function getPath(wbsId: string): string[] {
    if (cache.has(wbsId)) return cache.get(wbsId)!;

    const node = byId.get(wbsId);
    if (!node) return [];

    const name = node.wbs_name || node.wbs_short_name || "";
    if (!node.parent_wbs_id || node.parent_wbs_id === node.wbs_id) {
      // Root node
      const path = name ? [name] : [];
      cache.set(wbsId, path);
      return path;
    }

    const parentPath = getPath(node.parent_wbs_id);
    const path = name ? [name, ...parentPath] : [...parentPath];
    cache.set(wbsId, path);
    return path;
  }

  for (const node of wbsNodes) {
    if (!cache.has(node.wbs_id)) {
      getPath(node.wbs_id);
    }
  }

  return cache;
}

// ── Main export ────────────────────────────────────────────────────────────────

export function parseXER(xerText: string): XERTask[] {
  const lines = xerText.split("\n");

  // ── Parse PROJWBS ──────────────────────────────────────────────────────────
  const wbsRows = parseTable(lines, "PROJWBS");
  const wbsNodes: WBSNode[] = wbsRows.map((r) => ({
    wbs_id: r.wbs_id || "",
    parent_wbs_id: r.parent_wbs_id || "",
    wbs_name: r.wbs_name || "",
    wbs_short_name: r.wbs_short_name || "",
  })).filter((n) => n.wbs_id);

  const wbsPathMap = buildWBSPathMap(wbsNodes);

  // Compute depth (outline_level) for each WBS node: root = 0
  const wbsDepthMap = new Map<string, number>();
  function getDepth(wbsId: string): number {
    if (wbsDepthMap.has(wbsId)) return wbsDepthMap.get(wbsId)!;
    const node = wbsNodes.find((n) => n.wbs_id === wbsId);
    if (!node || !node.parent_wbs_id || node.parent_wbs_id === wbsId) {
      wbsDepthMap.set(wbsId, 0);
      return 0;
    }
    const depth = getDepth(node.parent_wbs_id) + 1;
    wbsDepthMap.set(wbsId, depth);
    return depth;
  }
  for (const node of wbsNodes) getDepth(node.wbs_id);

  // ── Parse TASKRSRC (resource assignments) ─────────────────────────────────
  // Map: task_id → comma-separated resource names
  const taskResourceMap = new Map<string, string[]>();
  const taskrsrcRows = parseTable(lines, "TASKRSRC");
  for (const r of taskrsrcRows) {
    const tid = r.task_id || "";
    const rsrcName = r.rsrc_name || r.rsrc_short_name || "";
    if (tid && rsrcName) {
      const existing = taskResourceMap.get(tid) || [];
      existing.push(rsrcName);
      taskResourceMap.set(tid, existing);
    }
  }

  // ── Parse TASKPRED (predecessor relationships) ────────────────────────────
  // Map: task_id → list of predecessor task_ids
  const taskPredMap = new Map<string, string[]>();
  const taskpredRows = parseTable(lines, "TASKPRED");
  for (const r of taskpredRows) {
    const tid = r.task_id || "";
    const predTid = r.pred_task_id || "";
    if (tid && predTid) {
      const existing = taskPredMap.get(tid) || [];
      existing.push(predTid);
      taskPredMap.set(tid, existing);
    }
  }

  // ── Parse TASKNOTE (activity notes) ───────────────────────────────────────
  // Map: task_id → notes text
  const taskNoteMap = new Map<string, string>();
  const tasknoteRows = parseTable(lines, "TASKNOTE");
  for (const r of tasknoteRows) {
    const tid = r.task_id || "";
    const noteText = r.note_text || r.memo || "";
    if (tid && noteText) {
      // Append notes if multiple entries
      const existing = taskNoteMap.get(tid) || "";
      taskNoteMap.set(tid, existing ? `${existing}\n${noteText}` : noteText);
    }
  }

  // ── Parse TASK ─────────────────────────────────────────────────────────────
  const taskRows = parseTable(lines, "TASK");
  const tasks: XERTask[] = [];

  for (const row of taskRows) {
    const taskId = row.task_id || row.task_code || "";
    const taskName = row.task_name || "";
    if (!taskName) continue;

    const startDate = parseXERDate(
      row.target_start_date || row.start_date || row.act_start_date || ""
    );
    const endDate = parseXERDate(
      row.target_end_date || row.end_date || row.act_end_date || ""
    );

    const percentComplete =
      parseFloat(row.phys_complete_pct || row.complete_pct || "0") || 0;

    const durationHours =
      parseFloat(row.duration_hr_cnt || row.target_drtn_hr_cnt || "0") || 0;
    const durationDays = durationHours > 0 ? Math.round(durationHours / 8) : null;

    const taskType = row.task_type || "";
    const isMilestone = taskType.includes("Mile") || durationDays === 0;

    // WBS ancestry
    const wbsId = row.wbs_id || null;
    const wbsPath: string[] = wbsId ? (wbsPathMap.get(wbsId) || []) : [];
    const parentWbsName = wbsPath.length > 0 ? wbsPath[0] : null;
    const outlineLevel = wbsId ? (wbsDepthMap.get(wbsId) ?? null) : null;

    // Resources from TASKRSRC (preferred) or legacy field
    const resourcesFromTable = taskResourceMap.get(taskId);
    const resourceNames = resourcesFromTable
      ? resourcesFromTable.join(", ")
      : (row.rsrc_names || null);

    // Notes from TASKNOTE
    const notes = taskNoteMap.get(taskId) || null;

    // Constraint
    const constraintType = row.cstr_type || null;
    const constraintDate = parseXERDate(row.cstr_date || "");

    // External IDs
    const externalTaskId = row.task_code || null;    // P6 activity code
    const externalUniqueId = row.task_id || null;    // P6 internal task_id

    tasks.push({
      task_id: taskId,
      task_name: taskName,
      start_date: startDate,
      end_date: endDate,
      percent_complete: percentComplete,
      duration: durationDays,
      milestone: isMilestone,
      wbs_id: wbsId,
      rsrc_names: row.rsrc_names || null,
      // Use TASKPRED table (complete predecessor list) if available, else fall back to TASK row field
      pred_task_ids: taskPredMap.has(taskId)
        ? taskPredMap.get(taskId)!.join(",")
        : (row.pred_task_id || null),
      constraint_type: constraintType,
      constraint_date: constraintDate,
      resource_names: resourceNames,
      notes,
      external_task_id: externalTaskId,
      external_unique_id: externalUniqueId,
      outline_level: outlineLevel !== null ? outlineLevel + 1 : null, // +1 so tasks are depth ≥ 1
      parent_wbs_name: parentWbsName,
      wbs_path: wbsPath,
    });
  }

  return tasks;
}
