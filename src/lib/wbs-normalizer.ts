// ──────────────────────────────────────────────────────────────────────────────
// WBS Normalizer
// Takes a wbs_path (ancestor chain from leaf → root) and a task name,
// and returns normalized building / phase / area / work_type fields.
// ──────────────────────────────────────────────────────────────────────────────

export interface NormalizedWBS {
  normalized_building: string | null;
  normalized_phase: string | null;
  normalized_area: string | null;
  normalized_work_type: string | null;
}

// ── Normalization helper ───────────────────────────────────────────────────────

/**
 * Normalize a string to snake_case:
 *   "Building F"  → "building_f"
 *   "MEP Rough-in" → "mep_rough_in"
 *   "North Wing"   → "north_wing"
 */
function toSnakeCase(str: string): string {
  return str
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")  // non-alnum sequences → underscore
    .replace(/^_+|_+$/g, "");      // trim leading/trailing underscores
}

// ── Pattern sets ──────────────────────────────────────────────────────────────

/** Building-level indicators (word-boundary match, case-insensitive) */
const BUILDING_PATTERNS = [
  /\bbuilding\b/i,
  /\bbldg\.?\b/i,
  /\btower\b/i,
  /\bwing\b/i,
  /\bshops?\b/i,
  /\bblock\b/i,
  /\bpad\b/i,
  /\bunit\b/i,
  /\bstructure\b/i,
  /\bwarehouse\b/i,
  /\bgarage\b/i,
  /\bannex\b/i,
  /\bpavili?on\b/i,
  /\bcenter\b/i,
  /\bmodule\b/i,
  /\bcampus\b/i,
];

/** Phase-level indicators */
const PHASE_PATTERNS = [
  /\bfoundation\b/i,
  /\bsitework\b/i,
  /\bsite\s*work\b/i,
  /\bgrading\b/i,
  /\bexcavation\b/i,
  /\bdemolition\b/i,
  /\bframing\b/i,
  /\bstructur(?:al|e)\b/i,
  /\bshell\b/i,
  /\bcore\s*&?\s*shell\b/i,
  /\bmep\b/i,
  /\brough[- ]?in\b/i,
  /\brough\b/i,
  /\bfinish(?:es|ing)?\b/i,
  /\binterior\s*finish\b/i,
  /\bcloseout\b/i,
  /\bclose[- ]?out\b/i,
  /\bsubstantial\s*completion\b/i,
  /\bpunch\s*list\b/i,
  /\blandscap(?:e|ing)\b/i,
  /\bpaving\b/i,
  /\bpre[-\s]?construction\b/i,
  /\bmobilization\b/i,
  /\bprocurement\b/i,
  /\benclos(?:ure|ing)\b/i,
  /\benvelope\b/i,
  /\belectrical\s*rough\b/i,
  /\bplumbing\s*rough\b/i,
  /\bmechanical\s*rough\b/i,
];

/** Area-level indicators */
const AREA_PATTERNS = [
  /\blevel\s*\d+/i,
  /\bfloor\s*\d+/i,
  /\bl\d+\b/i,               // "L1", "L2"
  /\bbasement\b/i,
  /\bground\s*floor\b/i,
  /\bnorth\b/i,
  /\bsouth\b/i,
  /\beast\b/i,
  /\bwest\b/i,
  /\bparking\b/i,
  /\blobby\b/i,
  /\bpenthouse\b/i,
  /\bmezzanine\b/i,
  /\broof\b/i,
  /\bpodium\b/i,
  /\btypical\s*floor\b/i,
  /\binterior\b/i,
  /\bexterior\b/i,
];

// ── Work-type patterns extracted from task names ───────────────────────────────

interface WorkTypePattern {
  pattern: RegExp;
  label: string;
}

const WORK_TYPE_PATTERNS: WorkTypePattern[] = [
  // Concrete / SOG
  { pattern: /\bpour\s+sog\b/i,              label: "pour_sog" },
  { pattern: /\bslab\s*on\s*grade\b/i,       label: "slab_on_grade" },
  { pattern: /\bpour\s+foundation\b/i,       label: "pour_foundation" },
  { pattern: /\bpour\s+(?:concrete|slab|footing|wall|column|beam)/i, label: "concrete_pour" },
  { pattern: /\bformwork\b/i,                label: "formwork" },
  { pattern: /\breinforc(?:e|ement|ing)\b/i, label: "reinforcement" },

  // Framing
  { pattern: /\bwood\s*framing\b/i,          label: "wood_framing" },
  { pattern: /\bsteel\s*framing\b/i,         label: "steel_framing" },
  { pattern: /\blight\s*gauge\b/i,           label: "light_gauge_framing" },
  { pattern: /\bsteel\s*erection\b/i,        label: "steel_erection" },
  { pattern: /\bframing\b/i,                 label: "rough_framing" },

  // MEP
  { pattern: /\bduct\s*instal/i,             label: "duct_install" },
  { pattern: /\bductwork\b/i,                label: "ductwork" },
  { pattern: /\bmechanical\b/i,              label: "mechanical" },
  { pattern: /\bhvac\b/i,                    label: "hvac" },
  { pattern: /\bplumbing\b/i,                label: "plumbing" },
  { pattern: /\belectrical\b/i,              label: "electrical" },
  { pattern: /\bfire\s*sprinkler\b/i,        label: "fire_sprinkler" },
  { pattern: /\bfire\s*alarm\b/i,            label: "fire_alarm" },
  { pattern: /\blow\s*voltage\b/i,           label: "low_voltage" },

  // Finishes
  { pattern: /\bdrywall\b/i,                 label: "drywall" },
  { pattern: /\bgypsum\s*board\b/i,          label: "drywall" },
  { pattern: /\binsulation\b/i,              label: "insulation" },
  { pattern: /\btile\b/i,                    label: "tile" },
  { pattern: /\bcarpet\b/i,                  label: "carpet" },
  { pattern: /\bflooring\b/i,                label: "flooring" },
  { pattern: /\bpainting\b/i,                label: "painting" },
  { pattern: /\bpaint\b/i,                   label: "painting" },
  { pattern: /\bcabinetry\b/i,               label: "cabinetry" },
  { pattern: /\bcountertop\b/i,              label: "countertops" },
  { pattern: /\bdoor(?:s|frame)?\b/i,        label: "doors_frames" },
  { pattern: /\bwindow(?:s|glazing)?\b/i,    label: "windows_glazing" },
  { pattern: /\bcurtain\s*wall\b/i,          label: "curtain_wall" },
  { pattern: /\bstorefont\b/i,               label: "storefront" },

  // Sitework
  { pattern: /\bexcavat\b/i,                 label: "excavation" },
  { pattern: /\bgrading\b/i,                 label: "grading" },
  { pattern: /\bundergr(?:ound|nd)\b/i,      label: "underground_utilities" },
  { pattern: /\bpaving\b/i,                  label: "paving" },
  { pattern: /\basphalt\b/i,                 label: "asphalt" },
  { pattern: /\bconcrete\s*curb\b/i,         label: "curb_and_gutter" },
  { pattern: /\blandscap\b/i,                label: "landscaping" },
  { pattern: /\birrigation\b/i,              label: "irrigation" },

  // Roofing / Envelope
  { pattern: /\broofing\b/i,                 label: "roofing" },
  { pattern: /\broof\s*deck\b/i,             label: "roof_deck" },
  { pattern: /\bwaterproof\b/i,              label: "waterproofing" },
  { pattern: /\bcladding\b/i,                label: "cladding" },
  { pattern: /\bmasonry\b/i,                 label: "masonry" },
  { pattern: /\bstucco\b/i,                  label: "stucco" },

  // Inspections / Admin
  { pattern: /\binspection\b/i,              label: "inspection" },
  { pattern: /\bsubmittal\b/i,              label: "submittal" },
  { pattern: /\bpermit\b/i,                 label: "permit" },
  { pattern: /\bpunch\s*list\b/i,           label: "punch_list" },
  { pattern: /\bcommission\b/i,             label: "commissioning" },
  { pattern: /\btesting\b/i,                label: "testing" },
];

// ── Core normalizer function ──────────────────────────────────────────────────

/**
 * Normalize WBS hierarchy from a wbs_path array.
 *
 * @param wbsPath - ancestor chain from leaf → root
 *   e.g. ["Foundation", "Building F", "Encanto Storage"]
 * @param taskName - the activity/task name, used to extract work_type
 * @returns NormalizedWBS fields
 */
export function normalizeWBS(
  wbsPath: string[],
  taskName: string = ""
): NormalizedWBS {
  let normalized_building: string | null = null;
  let normalized_phase: string | null = null;
  let normalized_area: string | null = null;

  // Walk the path: index 0 is closest to the task, last is the project root.
  for (const segment of wbsPath) {
    if (!segment) continue;

    // Building — capture first match
    if (normalized_building === null) {
      for (const pat of BUILDING_PATTERNS) {
        if (pat.test(segment)) {
          normalized_building = toSnakeCase(segment);
          break;
        }
      }
    }

    // Phase — capture first match
    if (normalized_phase === null) {
      for (const pat of PHASE_PATTERNS) {
        if (pat.test(segment)) {
          normalized_phase = toSnakeCase(segment);
          break;
        }
      }
    }

    // Area — capture first match
    if (normalized_area === null) {
      for (const pat of AREA_PATTERNS) {
        if (pat.test(segment)) {
          normalized_area = toSnakeCase(segment);
          break;
        }
      }
    }
  }

  // Work type — extracted from the task name itself
  let normalized_work_type: string | null = null;
  for (const { pattern, label } of WORK_TYPE_PATTERNS) {
    if (pattern.test(taskName)) {
      normalized_work_type = label;
      break;
    }
  }

  return {
    normalized_building,
    normalized_phase,
    normalized_area,
    normalized_work_type,
  };
}

// ── MPP / XLSX hierarchy builder ──────────────────────────────────────────────

export interface FlatHierarchyRow {
  name: string;
  outline_level: number;  // 1-based depth: 1=top summary, higher=children
  parent_task_name?: string;
}

/**
 * Build a wbs_path for an MPP/XLSX row using outline level and parent traversal.
 * For a row at level N, walks up through ancestors to build the path.
 *
 * @param rows - all rows in order with name and outline_level
 * @param index - index of the current row in `rows`
 * @returns wbs_path array (ancestor names leaf → root)
 */
export function buildMPPWBSPath(
  rows: FlatHierarchyRow[],
  index: number
): string[] {
  const current = rows[index];
  if (!current) return [];

  const currentLevel = current.outline_level;
  if (currentLevel <= 1) return [];

  // Walk backwards to find direct ancestors at each decreasing level
  const path: string[] = [];
  let targetLevel = currentLevel - 1;

  for (let i = index - 1; i >= 0 && targetLevel >= 1; i--) {
    const row = rows[i];
    if (row.outline_level === targetLevel) {
      path.push(row.name);
      targetLevel--;
    }
  }

  return path;
}
