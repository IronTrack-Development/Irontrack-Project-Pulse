"use client";

import { useState, useCallback, useEffect } from "react";
import {
  X,
  Plus,
  ChevronDown,
  ChevronRight,
  Pencil,
  Check,
  AlertTriangle,
  Save,
  GripVertical,
  Layers,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

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
  sheet_count: number;
}

interface Category {
  id: string; // "general", "architectural", etc. for built-ins; UUID for custom
  name: string;
  discipline: string;
  color: string;
  isCustom: boolean;
  sort_order: number;
  assignedPages: number[]; // page numbers (1-indexed)
}

interface SheetOrganizerProps {
  projectId: string;
  drawingSet: DrawingSet;
  sheets: DrawingSheet[];
  onClose: () => void;
  onSaved: (updatedSheets: DrawingSheet[]) => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DISCIPLINE_COLORS: Record<string, string> = {
  general: "var(--text-muted)",
  civil: "#A16207",
  landscape: "#22C55E",
  architectural: "#3B82F6",
  structural: "#F97316",
  mechanical: "#8B5CF6",
  electrical: "#EAB308",
  plumbing: "#22D3EE",
  fire_protection: "#EF4444",
  other: "var(--text-muted)",
};

const DISCIPLINE_PREFIX: Record<string, string> = {
  general: "G",
  civil: "C",
  landscape: "L",
  architectural: "A",
  structural: "S",
  mechanical: "M",
  electrical: "E",
  plumbing: "P",
  fire_protection: "FP",
  other: "X",
};

const DEFAULT_CATEGORIES: Omit<Category, "assignedPages">[] = [
  { id: "general", name: "General", discipline: "general", color: DISCIPLINE_COLORS.general, isCustom: false, sort_order: 0 },
  { id: "civil", name: "Civil", discipline: "civil", color: DISCIPLINE_COLORS.civil, isCustom: false, sort_order: 1 },
  { id: "landscape", name: "Landscape", discipline: "landscape", color: DISCIPLINE_COLORS.landscape, isCustom: false, sort_order: 2 },
  { id: "architectural", name: "Architectural", discipline: "architectural", color: DISCIPLINE_COLORS.architectural, isCustom: false, sort_order: 3 },
  { id: "structural", name: "Structural", discipline: "structural", color: DISCIPLINE_COLORS.structural, isCustom: false, sort_order: 4 },
  { id: "mechanical", name: "Mechanical", discipline: "mechanical", color: DISCIPLINE_COLORS.mechanical, isCustom: false, sort_order: 5 },
  { id: "electrical", name: "Electrical", discipline: "electrical", color: DISCIPLINE_COLORS.electrical, isCustom: false, sort_order: 6 },
  { id: "plumbing", name: "Plumbing", discipline: "plumbing", color: DISCIPLINE_COLORS.plumbing, isCustom: false, sort_order: 7 },
  { id: "fire_protection", name: "Fire Protection", discipline: "fire_protection", color: DISCIPLINE_COLORS.fire_protection, isCustom: false, sort_order: 8 },
];

// ─── Page Range Parsing ───────────────────────────────────────────────────────

function parsePageRange(input: string, maxPage: number): number[] | null {
  const pages = new Set<number>();
  const parts = input.split(",").map((s) => s.trim()).filter(Boolean);
  for (const part of parts) {
    if (part.includes("-")) {
      const [startStr, endStr] = part.split("-").map((s) => s.trim());
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      if (isNaN(start) || isNaN(end) || start < 1 || end > maxPage || start > end) {
        return null;
      }
      for (let p = start; p <= end; p++) pages.add(p);
    } else {
      const page = parseInt(part, 10);
      if (isNaN(page) || page < 1 || page > maxPage) return null;
      pages.add(page);
    }
  }
  return pages.size > 0 ? Array.from(pages).sort((a, b) => a - b) : null;
}

function pagesToRangeString(pages: number[]): string {
  if (pages.length === 0) return "";
  const sorted = [...pages].sort((a, b) => a - b);
  const ranges: string[] = [];
  let start = sorted[0];
  let prev = sorted[0];
  for (let i = 1; i <= sorted.length; i++) {
    const curr = sorted[i];
    if (curr !== prev + 1) {
      ranges.push(start === prev ? `${start}` : `${start}-${prev}`);
      start = curr;
    }
    prev = curr;
  }
  return ranges.join(", ");
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function SheetOrganizer({
  projectId,
  drawingSet,
  sheets,
  onClose,
  onSaved,
}: SheetOrganizerProps) {
  const maxPage = sheets.length;

  // Initialize categories — start with defaults, load any existing assignments from sheets
  const [categories, setCategories] = useState<Category[]>(() => {
    const cats: Category[] = DEFAULT_CATEGORIES.map((c) => ({ ...c, assignedPages: [] }));

    // Detect any existing discipline assignments
    for (const sheet of sheets) {
      const pageNum = sheet.page_index + 1;
      const disc = sheet.discipline || "general";
      // Only treat as "assigned" if not still the generic default P{n} numbering
      if (!/^P\d+$/.test(sheet.sheet_number)) {
        const cat = cats.find((c) => c.discipline === disc);
        if (cat) cat.assignedPages.push(pageNum);
      }
    }

    return cats;
  });

  // Which category sections are expanded
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(["general"]));

  // Which category is in "set pages" mode
  const [editingPages, setEditingPages] = useState<string | null>(null);
  const [pageRangeInput, setPageRangeInput] = useState("");
  const [pageRangeError, setPageRangeError] = useState("");

  // Custom category add
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  // Inline sheet editing
  const [editingSheet, setEditingSheet] = useState<string | null>(null);
  const [editSheetNumber, setEditSheetNumber] = useState("");
  const [editSheetTitle, setEditSheetTitle] = useState("");

  // Saving state
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Uncategorized pages selection (for quick-assign)
  const [selectedUncategorized, setSelectedUncategorized] = useState<Set<number>>(new Set());
  const [showMoveMenu, setShowMoveMenu] = useState(false);

  // Drag reorder state
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  // Track inline edits to individual sheets (sheet id → { number, title })
  const [sheetEdits, setSheetEdits] = useState<Record<string, { sheet_number: string; sheet_title: string }>>({});

  // Compute all assigned pages
  const allAssignedPages = new Set<number>();
  for (const cat of categories) {
    for (const p of cat.assignedPages) allAssignedPages.add(p);
  }

  // Uncategorized = all pages not assigned
  const uncategorizedPages = Array.from({ length: maxPage }, (_, i) => i + 1)
    .filter((p) => !allAssignedPages.has(p));

  const toggleSection = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // Set pages for a category from range input
  const handleSetPages = (catId: string) => {
    if (!pageRangeInput.trim()) {
      // Clear the category's pages
      setCategories((prev) =>
        prev.map((c) => (c.id === catId ? { ...c, assignedPages: [] } : c))
      );
      setEditingPages(null);
      setPageRangeInput("");
      return;
    }

    const pages = parsePageRange(pageRangeInput, maxPage);
    if (!pages) {
      setPageRangeError(`Invalid range. Use format: 1-10, 15, 20-25 (max page: ${maxPage})`);
      return;
    }

    // Check for conflicts with other categories
    const conflictCats: string[] = [];
    for (const cat of categories) {
      if (cat.id === catId) continue;
      const conflicts = pages.filter((p) => cat.assignedPages.includes(p));
      if (conflicts.length > 0) conflictCats.push(cat.name);
    }

    if (conflictCats.length > 0) {
      const ok = confirm(
        `Pages ${pagesToRangeString(pages.filter((p) =>
          categories.some((c) => c.id !== catId && c.assignedPages.includes(p))
        ))} are already in: ${conflictCats.join(", ")}. Move them here?`
      );
      if (!ok) return;
      // Remove conflicting pages from other categories
      setCategories((prev) =>
        prev.map((c) => {
          if (c.id === catId) return { ...c, assignedPages: pages };
          return { ...c, assignedPages: c.assignedPages.filter((p) => !pages.includes(p)) };
        })
      );
    } else {
      setCategories((prev) =>
        prev.map((c) => (c.id === catId ? { ...c, assignedPages: pages } : c))
      );
    }

    setEditingPages(null);
    setPageRangeInput("");
    setPageRangeError("");
    setExpanded((prev) => new Set([...prev, catId]));
  };

  // Start editing pages for a category
  const startEditPages = (catId: string) => {
    const cat = categories.find((c) => c.id === catId);
    setEditingPages(catId);
    setPageRangeInput(cat ? pagesToRangeString(cat.assignedPages) : "");
    setPageRangeError("");
  };

  // Add custom category
  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    const newCat: Category = {
      id: `custom_${Date.now()}`,
      name: newCategoryName.trim(),
      discipline: "other",
      color: "var(--text-muted)",
      isCustom: true,
      sort_order: categories.length,
      assignedPages: [],
    };
    setCategories((prev) => [...prev, newCat]);
    setNewCategoryName("");
    setShowAddCategory(false);
  };

  // Start inline sheet edit
  const startEditSheet = (sheetId: string) => {
    const existing = sheetEdits[sheetId];
    const sheet = sheets.find((s) => s.id === sheetId);
    if (!sheet) return;
    setEditingSheet(sheetId);
    setEditSheetNumber(existing?.sheet_number ?? sheet.sheet_number);
    setEditSheetTitle(existing?.sheet_title ?? (sheet.sheet_title || ""));
  };

  const saveSheetEdit = (sheetId: string) => {
    setSheetEdits((prev) => ({
      ...prev,
      [sheetId]: { sheet_number: editSheetNumber, sheet_title: editSheetTitle },
    }));
    setEditingSheet(null);
  };

  // Move selected uncategorized pages to a category
  const moveSelectedTo = (catId: string) => {
    const pages = Array.from(selectedUncategorized);
    setCategories((prev) =>
      prev.map((c) => {
        if (c.id === catId) {
          return { ...c, assignedPages: [...new Set([...c.assignedPages, ...pages])].sort((a, b) => a - b) };
        }
        return c;
      })
    );
    setSelectedUncategorized(new Set());
    setShowMoveMenu(false);
  };

  // Drag reorder categories
  const handleDragEnd = (targetId: string) => {
    if (!draggingId || draggingId === targetId) {
      setDraggingId(null);
      setDragOverId(null);
      return;
    }
    setCategories((prev) => {
      const from = prev.findIndex((c) => c.id === draggingId);
      const to = prev.findIndex((c) => c.id === targetId);
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next.map((c, i) => ({ ...c, sort_order: i }));
    });
    setDraggingId(null);
    setDragOverId(null);
  };

  // Build assignments from current state
  const buildAssignments = () => {
    const assignments: Array<{
      page_start: number;
      page_end: number;
      discipline: string;
      category_label?: string;
      category_id?: string;
    }> = [];

    for (const cat of categories) {
      if (cat.assignedPages.length === 0) continue;
      const sorted = [...cat.assignedPages].sort((a, b) => a - b);

      // Compress into ranges
      let start = sorted[0];
      let prev = sorted[0];
      for (let i = 1; i <= sorted.length; i++) {
        const curr = sorted[i];
        if (curr !== prev + 1) {
          assignments.push({
            page_start: start,
            page_end: prev,
            discipline: cat.discipline,
            category_label: cat.isCustom ? cat.name : undefined,
          });
          start = curr;
        }
        prev = curr;
      }
    }

    return assignments;
  };

  // Save organization
  const handleSave = async () => {
    setSaving(true);
    setSaveError("");

    try {
      const assignments = buildAssignments();

      if (assignments.length === 0) {
        // Nothing assigned — skip the organize call, just close
        onSaved(sheets);
        return;
      }

      const resp = await fetch(
        `/api/projects/${projectId}/drawings/${drawingSet.id}/sheets/organize`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ assignments }),
        }
      );

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Save failed" }));
        setSaveError(err.error || "Save failed");
        return;
      }

      const data = await resp.json();

      // Also apply any inline sheet edits
      const editEntries = Object.entries(sheetEdits);
      if (editEntries.length > 0) {
        await Promise.all(
          editEntries.map(([sheetId, edits]) =>
            fetch(`/api/projects/${projectId}/drawings/sheets/${sheetId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(edits),
            })
          )
        );
      }

      onSaved(data.sheets || sheets);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  // Get the sheets for a given category (merging page assignments with inline edits)
  const getSheetsForCategory = (cat: Category): DrawingSheet[] => {
    return cat.assignedPages
      .map((pageNum) => sheets.find((s) => s.page_index === pageNum - 1))
      .filter(Boolean) as DrawingSheet[];
  };

  const prefix = (cat: Category) =>
    DISCIPLINE_PREFIX[cat.discipline] || "X";

  return (
    <div className="fixed inset-0 z-50 bg-[var(--bg-primary)] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-[var(--border-primary)] shrink-0">
        <div className="flex-1 min-w-0">
          <h2 className="text-[color:var(--text-primary)] font-semibold">Organize Drawing Set</h2>
          <p className="text-[color:var(--text-muted)] text-xs mt-0.5">
            {drawingSet.name} · {maxPage} pages
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          <X size={18} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Add Category button */}
        {showAddCategory ? (
          <div className="bg-[var(--bg-secondary)] border border-[#F97316]/40 rounded-xl p-3 flex gap-2">
            <input
              autoFocus
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddCategory();
                if (e.key === "Escape") { setShowAddCategory(false); setNewCategoryName(""); }
              }}
              placeholder="Category name (e.g. Shop Drawings, ASI #3)"
              className="flex-1 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg px-3 py-2 text-[color:var(--text-primary)] placeholder-gray-600 text-sm min-h-[44px]"
            />
            <button
              onClick={handleAddCategory}
              className="px-3 py-2 bg-[#F97316] text-[color:var(--text-primary)] rounded-lg text-sm font-semibold min-h-[44px] min-w-[44px]"
            >
              <Check size={16} />
            </button>
            <button
              onClick={() => { setShowAddCategory(false); setNewCategoryName(""); }}
              className="px-3 py-2 bg-[var(--bg-tertiary)] text-[color:var(--text-secondary)] rounded-lg text-sm min-h-[44px] min-w-[44px]"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowAddCategory(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[var(--bg-secondary)] border border-[var(--border-primary)] hover:border-[#F97316]/40 text-[color:var(--text-secondary)] hover:text-[#F97316] rounded-xl text-sm min-h-[44px] transition-colors"
          >
            <Plus size={15} />
            Add Custom Category
          </button>
        )}

        {/* Category list */}
        {categories.map((cat) => {
          const isOpen = expanded.has(cat.id);
          const catSheets = getSheetsForCategory(cat);
          const isEditingThisPages = editingPages === cat.id;
          const isDragOver = dragOverId === cat.id;

          return (
            <div
              key={cat.id}
              className={`bg-[var(--bg-secondary)] border rounded-xl overflow-hidden transition-colors ${
                isDragOver ? "border-[#F97316]/60" : "border-[var(--border-primary)]"
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragOverId(cat.id); }}
              onDrop={() => handleDragEnd(cat.id)}
            >
              {/* Category header */}
              <div className="flex items-center gap-2 px-3 py-3 min-h-[52px]">
                {/* Drag handle */}
                <div
                  draggable
                  onDragStart={() => setDraggingId(cat.id)}
                  onDragEnd={() => { setDraggingId(null); setDragOverId(null); }}
                  className="text-gray-700 hover:text-[color:var(--text-muted)] cursor-grab active:cursor-grabbing shrink-0 p-1"
                >
                  <GripVertical size={14} />
                </div>

                {/* Color dot */}
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: cat.color }}
                />

                {/* Name + sheet count */}
                <button
                  onClick={() => toggleSection(cat.id)}
                  className="flex-1 flex items-center gap-2 text-left"
                >
                  <span className="text-[color:var(--text-primary)] font-medium text-sm">{cat.name}</span>
                  {catSheets.length > 0 && (
                    <span
                      className="text-xs px-1.5 py-0.5 rounded-full"
                      style={{ backgroundColor: cat.color + "25", color: cat.color }}
                    >
                      {catSheets.length}
                    </span>
                  )}
                  <span className="text-gray-600 ml-auto">
                    {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </span>
                </button>

                {/* Set Pages button */}
                {isEditingThisPages ? null : (
                  <button
                    onClick={() => startEditPages(cat.id)}
                    className="shrink-0 px-2.5 py-1.5 bg-[var(--bg-tertiary)] hover:bg-[#2A2A30] text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] rounded-lg text-xs min-h-[36px] transition-colors"
                  >
                    Set Pages
                  </button>
                )}
              </div>

              {/* Page range input */}
              {isEditingThisPages && (
                <div className="px-3 pb-3 border-t border-[var(--border-primary)]">
                  <div className="pt-3 flex gap-2">
                    <div className="flex-1">
                      <input
                        autoFocus
                        type="text"
                        value={pageRangeInput}
                        onChange={(e) => { setPageRangeInput(e.target.value); setPageRangeError(""); }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSetPages(cat.id);
                          if (e.key === "Escape") { setEditingPages(null); setPageRangeInput(""); setPageRangeError(""); }
                        }}
                        placeholder={`e.g. 2-47, 50, 53-60 (1–${maxPage})`}
                        className="w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg px-3 py-2.5 text-[color:var(--text-primary)] placeholder-gray-600 text-sm min-h-[44px]"
                      />
                      {pageRangeError && (
                        <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                          <AlertTriangle size={11} /> {pageRangeError}
                        </p>
                      )}
                      <p className="text-gray-600 text-xs mt-1">
                        Sheets will be numbered: {prefix(cat)}-1, {prefix(cat)}-2, ...
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                      <button
                        onClick={() => handleSetPages(cat.id)}
                        className="px-3 py-2 bg-[#F97316] text-[color:var(--text-primary)] rounded-lg text-sm font-semibold min-h-[44px] min-w-[44px] flex items-center justify-center"
                      >
                        <Check size={15} />
                      </button>
                      <button
                        onClick={() => { setEditingPages(null); setPageRangeInput(""); setPageRangeError(""); }}
                        className="px-3 py-2 bg-[var(--bg-tertiary)] text-[color:var(--text-secondary)] rounded-lg min-h-[36px] min-w-[44px] flex items-center justify-center"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Sheet list */}
              {isOpen && catSheets.length > 0 && (
                <div className="border-t border-[var(--border-primary)]">
                  {catSheets.map((sheet) => {
                    const edits = sheetEdits[sheet.id];
                    const displayNumber = edits?.sheet_number ?? sheet.sheet_number;
                    const displayTitle = edits?.sheet_title ?? (sheet.sheet_title || "");
                    const isEditingThis = editingSheet === sheet.id;

                    return (
                      <div
                        key={sheet.id}
                        className="flex items-center gap-2 px-4 py-2.5 min-h-[48px] border-b border-[var(--border-primary)]/50 last:border-b-0 hover:bg-[#1A1A20] transition-colors"
                      >
                        {isEditingThis ? (
                          <>
                            <input
                              autoFocus
                              value={editSheetNumber}
                              onChange={(e) => setEditSheetNumber(e.target.value)}
                              className="w-20 bg-[var(--bg-primary)] border border-[#F97316]/40 rounded px-2 py-1 text-[color:var(--text-primary)] text-xs font-mono min-h-[36px]"
                              placeholder="A-1"
                            />
                            <input
                              value={editSheetTitle}
                              onChange={(e) => setEditSheetTitle(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") saveSheetEdit(sheet.id);
                                if (e.key === "Escape") setEditingSheet(null);
                              }}
                              className="flex-1 bg-[var(--bg-primary)] border border-[#F97316]/40 rounded px-2 py-1 text-[color:var(--text-primary)] text-xs min-h-[36px]"
                              placeholder="Sheet title"
                            />
                            <button
                              onClick={() => saveSheetEdit(sheet.id)}
                              className="p-1.5 text-[#F97316] hover:text-[color:var(--text-primary)] min-w-[36px] min-h-[36px] flex items-center justify-center"
                            >
                              <Check size={14} />
                            </button>
                          </>
                        ) : (
                          <>
                            <span
                              className="text-xs font-bold font-mono w-14 truncate shrink-0"
                              style={{ color: cat.color }}
                            >
                              {displayNumber}
                            </span>
                            <span className="text-gray-600 shrink-0">—</span>
                            <span className="text-[color:var(--text-secondary)] text-sm truncate flex-1">
                              {displayTitle || `Page ${sheet.page_index + 1}`}
                            </span>
                            <button
                              onClick={() => startEditSheet(sheet.id)}
                              className="p-1.5 text-gray-700 hover:text-[color:var(--text-secondary)] opacity-0 group-hover:opacity-100 min-w-[36px] min-h-[36px] flex items-center justify-center hover:opacity-100"
                            >
                              <Pencil size={12} />
                            </button>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* Uncategorized section */}
        {uncategorizedPages.length > 0 && (
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3 min-h-[52px]">
              <div className="w-2.5 h-2.5 rounded-full shrink-0 bg-gray-600" />
              <button
                onClick={() => toggleSection("__uncategorized__")}
                className="flex-1 flex items-center gap-2 text-left"
              >
                <span className="text-[color:var(--text-secondary)] font-medium text-sm">
                  Uncategorized
                </span>
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-gray-700/50 text-[color:var(--text-muted)]">
                  {uncategorizedPages.length}
                </span>
                <span className="text-gray-600 ml-auto">
                  {expanded.has("__uncategorized__") ? (
                    <ChevronDown size={14} />
                  ) : (
                    <ChevronRight size={14} />
                  )}
                </span>
              </button>

              {selectedUncategorized.size > 0 && (
                <div className="relative shrink-0">
                  <button
                    onClick={() => setShowMoveMenu((v) => !v)}
                    className="px-2.5 py-1.5 bg-[#F97316] text-[color:var(--text-primary)] rounded-lg text-xs font-semibold min-h-[36px]"
                  >
                    Move {selectedUncategorized.size} →
                  </button>
                  {showMoveMenu && (
                    <div className="absolute right-0 top-full mt-1 z-10 bg-[var(--bg-tertiary)] border border-[#2A2A30] rounded-xl overflow-hidden shadow-xl min-w-[160px]">
                      {categories.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => moveSelectedTo(cat.id)}
                          className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-[#2A2A30] text-left text-sm text-[color:var(--text-secondary)] min-h-[44px]"
                        >
                          <div
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: cat.color }}
                          />
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {expanded.has("__uncategorized__") && (
              <div className="border-t border-[var(--border-primary)] p-3">
                <div className="flex flex-wrap gap-1.5">
                  {uncategorizedPages.map((pageNum) => {
                    const isSelected = selectedUncategorized.has(pageNum);
                    return (
                      <button
                        key={pageNum}
                        onClick={() => {
                          setSelectedUncategorized((prev) => {
                            const next = new Set(prev);
                            if (next.has(pageNum)) next.delete(pageNum);
                            else next.add(pageNum);
                            return next;
                          });
                        }}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-mono min-w-[44px] min-h-[36px] transition-colors ${
                          isSelected
                            ? "bg-[#F97316] text-[color:var(--text-primary)]"
                            : "bg-[var(--bg-tertiary)] text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {uncategorizedPages.length === 0 && categories.every((c) => c.assignedPages.length === 0) && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Layers size={36} className="text-gray-700 mb-3" />
            <p className="text-[color:var(--text-muted)] text-sm">
              Use &ldquo;Set Pages&rdquo; on each category to assign pages
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-[var(--border-primary)] shrink-0">
        {saveError && (
          <p className="text-red-400 text-xs mb-3 flex items-center gap-1">
            <AlertTriangle size={12} /> {saveError}
          </p>
        )}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-[var(--bg-tertiary)] text-[color:var(--text-secondary)] rounded-xl font-medium text-sm min-h-[48px]"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#F97316] hover:bg-[#ea6c10] disabled:opacity-50 text-[color:var(--text-primary)] rounded-xl font-semibold text-sm min-h-[48px] transition-colors"
          >
            {saving ? (
              <>Saving...</>
            ) : (
              <>
                <Save size={16} />
                Save Organization
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
