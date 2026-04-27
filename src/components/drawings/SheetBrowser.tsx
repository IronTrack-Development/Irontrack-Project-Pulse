"use client";

import { useState, useCallback } from "react";
import {
  ArrowLeft,
  FileImage,
  ChevronDown,
  ChevronRight,
  ClipboardList,
} from "lucide-react";
import SheetOrganizer from "@/components/drawings/SheetOrganizer";
import { useTranslation } from "@/lib/i18n";

const { t } = useTranslation();

interface DrawingSheet {
  id: string;
  sheet_number: string;
  sheet_title?: string;
  discipline?: string;
  storage_path: string;
  page_index: number;
}

interface DrawingSet {
  id: string;
  name: string;
  revision: string;
  is_current: boolean;
  sheet_count: number;
  uploaded_at: string;
}

// ─── Discipline meta ──────────────────────────────────────────────────────────

type Discipline =
  | "architectural"
  | "structural"
  | "mechanical"
  | "electrical"
  | "plumbing"
  | "civil"
  | "landscape"
  | "fire_protection"
  | "general"
  | "other";

const DISCIPLINE_ORDER: Discipline[] = [
  "architectural",
  "structural",
  "mechanical",
  "electrical",
  "plumbing",
  "civil",
  "landscape",
  "fire_protection",
  "general",
  "other",
];

const DISCIPLINE_LABEL: Record<Discipline, string> = {
  architectural: "Architectural",
  structural: "Structural",
  mechanical: "Mechanical",
  electrical: "Electrical",
  plumbing: "Plumbing",
  civil: "Civil",
  landscape: "Landscape",
  fire_protection: "Fire Protection",
  general: "General",
  other: "Other",
};

const DISCIPLINE_COLOR: Record<Discipline, string> = {
  architectural: "#3B82F6",   // blue
  structural: "#F97316",      // orange-red
  mechanical: "#8B5CF6",      // purple
  electrical: "#EAB308",      // yellow
  plumbing: "#22D3EE",        // cyan
  civil: "#A16207",           // brown/earth
  landscape: "#22C55E",       // green
  fire_protection: "#EF4444", // red
  general: "#6B7280",         // gray
  other: "#6B7280",           // gray
};



// Natural sort for sheet numbers like A1.01, A1.02, A2.01, S1.1, S2.1
function naturalSheetSort(a: DrawingSheet, b: DrawingSheet): number {
  const tokenize = (s: string) =>
    s.split(/(\d+)/).map((t) => (isNaN(Number(t)) ? t : parseInt(t, 10)));
  const ta = tokenize(a.sheet_number);
  const tb = tokenize(b.sheet_number);
  for (let i = 0; i < Math.max(ta.length, tb.length); i++) {
    const va = ta[i] ?? 0;
    const vb = tb[i] ?? 0;
    if (typeof va === "number" && typeof vb === "number") {
      if (va !== vb) return va - vb;
    } else {
      const cmp = String(va).localeCompare(String(vb));
      if (cmp !== 0) return cmp;
    }
  }
  return 0;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface SheetBrowserProps {
  projectId: string;
  sheets: DrawingSheet[];
  drawingSet: DrawingSet;
  onSheetSelect: (sheetIndex: number) => void;
  onBack: () => void;
  onSheetsRefresh?: () => void;
  openOrganizerOnMount?: boolean;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function SheetBrowser({
  projectId,
  sheets,
  drawingSet,
  onSheetSelect,
  onBack,
  onSheetsRefresh,
  openOrganizerOnMount = false,
}: SheetBrowserProps) {
  const [showOrganizer, setShowOrganizer] = useState(openOrganizerOnMount);

  // Check if all sheets are still unclassified (all "general" with generic names)
  const allUnclassified = sheets.length > 0 && sheets.every(
    (s) => (!s.discipline || s.discipline === "general") &&
      /^P\d+$/.test(s.sheet_number)
  );

  // Group by discipline
  const disciplineGroups = DISCIPLINE_ORDER.reduce<Record<Discipline, DrawingSheet[]>>(
    (acc, d) => {
      acc[d] = [];
      return acc;
    },
    {} as Record<Discipline, DrawingSheet[]>
  );

  for (const sheet of sheets) {
    const disc = (sheet.discipline as Discipline) || "general";
    const key = DISCIPLINE_ORDER.includes(disc) ? disc : "other";
    disciplineGroups[key].push(sheet);
  }

  // Only include disciplines that have sheets
  const activeDisciplines = DISCIPLINE_ORDER.filter((d) => disciplineGroups[d].length > 0);

  // Sort sheets within each discipline
  for (const d of activeDisciplines) {
    disciplineGroups[d].sort(naturalSheetSort);
  }

  // Map from sheet id → original index (for onSheetSelect — SheetViewer uses the original array)
  const sheetOriginalIndex = new Map<string, number>(
    sheets.map((s, i) => [s.id, i])
  );

  // Track which discipline sections are expanded
  const [expanded, setExpanded] = useState<Set<Discipline>>(
    () => new Set(activeDisciplines.length > 0 ? [activeDisciplines[0]] : [])
  );

  const toggleSection = useCallback((d: Discipline) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(d)) next.delete(d);
      else next.add(d);
      return next;
    });
  }, []);

  // Organizer saved — refresh sheets and close
  const handleOrganizerSaved = (updatedSheets: DrawingSheet[]) => {
    setShowOrganizer(false);
    if (updatedSheets.length > 0) {
      onSheetsRefresh?.();
    }
  };

  // Organizer overlay
  if (showOrganizer) {
    return (
      <SheetOrganizer
        projectId={projectId}
        drawingSet={drawingSet}
        sheets={sheets}
        onClose={() => setShowOrganizer(false)}
        onSaved={handleOrganizerSaved}
      />
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={onBack}
          className="p-2 text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-[color:var(--text-primary)] font-semibold truncate">{drawingSet.name}</h2>
          <p className="text-[color:var(--text-muted)] text-xs">
            {drawingSet.revision} · {drawingSet.sheet_count}{t('ui.sheets')}
          </p>
        </div>
        {/* Organize button */}
        <button
          onClick={() => setShowOrganizer(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-[#1F1F25] hover:bg-[#2A2A30] text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] rounded-lg text-xs font-medium min-h-[44px] transition-colors shrink-0"
        >
          <ClipboardList size={14} />{t('ui.organize')}
        </button>
        {drawingSet.is_current && (
          <span className="px-2 py-0.5 bg-green-500/15 text-green-400 rounded text-xs font-medium border border-green-500/20 shrink-0">{t('ui.current')}
          </span>
        )}
      </div>

      {/* Empty state */}
      {sheets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FileImage size={40} className="text-gray-700 mb-3" />
          <p className="text-[color:var(--text-muted)] text-sm">{t('ui.no.sheets.in.this.set')}</p>
        </div>
      ) : (
        <>
          {/* Unorganized banner */}
          {allUnclassified && (
            <div className="mb-4 p-3 bg-[#1F1F25] border border-[#F97316]/30 rounded-xl flex items-center gap-3">
              <ClipboardList size={16} className="text-[#F97316] shrink-0" />
              <p className="text-[color:var(--text-secondary)] text-sm flex-1">{t('ui.sheets.haven.t.been.organized.yet')}
              </p>
              <button
                onClick={() => setShowOrganizer(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F97316] hover:bg-[#ea6c10] text-[color:var(--text-primary)] rounded-lg text-xs font-semibold min-h-[36px] transition-colors shrink-0"
              >
                <ClipboardList size={12} />{t('ui.organize.sheets')}
              </button>
            </div>
          )}

          {/* Discipline-grouped collapsible sections */}
          <div className="space-y-2">
            {activeDisciplines.map((disc) => {
              const groupSheets = disciplineGroups[disc];
              const isOpen = expanded.has(disc);
              const color = DISCIPLINE_COLOR[disc];

              return (
                <div
                  key={disc}
                  className="bg-[#121217] border border-[#1F1F25] rounded-xl overflow-hidden"
                >
                  {/* Section header */}
                  <button
                    onClick={() => toggleSection(disc)}
                    className="w-full flex items-center gap-3 px-4 py-3 min-h-[52px] hover:bg-[#1A1A20] transition-colors"
                  >
                    {/* Discipline icon + label */}
                    <span className="w-3 h-3 rounded-full inline-block shrink-0" style={{ backgroundColor: DISCIPLINE_COLOR[disc] }} />
                    <span
                      className="font-semibold text-sm flex-1 text-left"
                      style={{ color }}
                    >
                      {DISCIPLINE_LABEL[disc]}
                    </span>

                    {/* Count badge */}
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-bold shrink-0"
                      style={{
                        backgroundColor: color + "20",
                        color,
                      }}
                    >
                      {groupSheets.length}
                    </span>

                    {/* Expand/collapse chevron */}
                    <span className="text-[color:var(--text-muted)] shrink-0">
                      {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </span>
                  </button>

                  {/* Sheet list — animated expand/collapse */}
                  <div
                    className="overflow-hidden transition-all duration-200 ease-in-out"
                    style={{
                      maxHeight: isOpen ? `${groupSheets.length * 60 + 8}px` : "0px",
                    }}
                  >
                    <div className="border-t border-[#1F1F25]">
                      {groupSheets.map((sheet) => {
                        const displayIdx = sheetOriginalIndex.get(sheet.id) ?? 0;
                        return (
                          <button
                            key={sheet.id}
                            onClick={() => onSheetSelect(displayIdx)}
                            className="w-full flex items-center gap-3 px-4 py-3 min-h-[52px] hover:bg-[#1A1A20] transition-colors border-b border-[#1F1F25]/50 last:border-b-0 text-left"
                          >
                            {/* Sheet number */}
                            <span
                              className="text-xs font-bold font-mono shrink-0 w-14 truncate"
                              style={{ color }}
                            >
                              {sheet.sheet_number}
                            </span>

                            {/* Divider */}
                            <span className="text-gray-700 shrink-0">—</span>

                            {/* Sheet title */}
                            <span className="text-[color:var(--text-secondary)] text-sm truncate flex-1">
                              {sheet.sheet_title || `Page ${sheet.page_index + 1}`}
                            </span>

                            {/* Page arrow */}
                            <ChevronRight size={14} className="text-gray-600 shrink-0" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
