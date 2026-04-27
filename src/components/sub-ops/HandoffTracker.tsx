"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ArrowRightLeft, Plus, X, ChevronUp, ChevronDown, Settings,
  Check, AlertTriangle, Clock, Camera, FileText, Trash2,
} from "lucide-react";

interface Department {
  id: string;
  name: string;
  trade?: string;
  color: string;
  sort_order: number;
  crew_count?: number;
}

interface BoardArea {
  area_id: string;
  project_name: string;
  area_name: string;
  description?: string;
  cells: {
    from_department_id: string;
    from_department_name: string;
    to_department_id: string;
    to_department_name: string;
    handoff_id: string | null;
    status: string;
  }[];
}

interface HandoffDetail {
  id: string;
  area_id: string;
  from_department_id: string;
  to_department_id: string;
  from_department_name: string;
  to_department_name: string;
  from_department_color: string;
  to_department_color: string;
  area_name: string;
  project_name: string;
  status: string;
  handoff_date?: string;
  accepted_date?: string;
  notes?: string;
  checklist: ChecklistItem[];
  photos: Photo[];
  checklist_total: number;
  checklist_complete: number;
  photo_count: number;
}

interface ChecklistItem {
  id: string;
  item_text: string;
  completed: boolean;
  completed_by?: string;
  completed_at?: string;
  notes?: string;
  sort_order: number;
}

interface Photo {
  id: string;
  photo_path: string;
  caption?: string;
  taken_by?: string;
  created_at: string;
}

interface Template {
  id: string;
  title: string;
  from_department_name?: string;
  to_department_name?: string;
  items: string[];
}

const STATUS_CONFIG: Record<string, { label: string; abbrev: string; color: string; bg: string }> = {
  not_started: { label: "Not Started", abbrev: "NS", color: "var(--text-muted)", bg: "rgba(107,114,128,0.2)" },
  in_progress: { label: "In Progress", abbrev: "IP", color: "#3B82F6", bg: "rgba(59,130,246,0.2)" },
  ready_for_handoff: { label: "Ready", abbrev: "RDY", color: "#EAB308", bg: "rgba(234,179,8,0.2)" },
  handed_off: { label: "Handed Off", abbrev: "HO", color: "#F97316", bg: "rgba(249,115,22,0.2)" },
  accepted: { label: "Accepted", abbrev: "OK", color: "#22C55E", bg: "rgba(34,197,94,0.2)" },
  issue_flagged: { label: "Issue", abbrev: "⚠", color: "#EF4444", bg: "rgba(239,68,68,0.2)" },
};

interface Props {
  projectId: string;
}

export default function HandoffTracker({ projectId }: Props) {
  const [view, setView] = useState<"board" | "departments">("board");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [board, setBoard] = useState<BoardArea[]>([]);
  const [loading, setLoading] = useState(true);

  // Detail panel
  const [selectedHandoff, setSelectedHandoff] = useState<HandoffDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Add area form
  const [showAddArea, setShowAddArea] = useState(false);
  const [areaProject, setAreaProject] = useState("");
  const [areaName, setAreaName] = useState("");

  // Add department form
  const [showAddDept, setShowAddDept] = useState(false);
  const [deptName, setDeptName] = useState("");
  const [deptTrade, setDeptTrade] = useState("");
  const [deptColor, setDeptColor] = useState("#F97316");

  // Checklist add
  const [newItemText, setNewItemText] = useState("");

  // Templates
  const [templates, setTemplates] = useState<Template[]>([]);

  const companyId = typeof window !== "undefined" ? localStorage.getItem("sub_ops_company_id") : null;

  const fetchBoard = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/sub-ops/companies/${companyId}/handoffs/board`);
      if (res.ok) {
        const d = await res.json();
        setDepartments(d.departments || []);
        setBoard(d.areas || []);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, [companyId]);

  const fetchDepartments = useCallback(async () => {
    if (!companyId) return;
    try {
      const res = await fetch(`/api/sub-ops/companies/${companyId}/departments`);
      if (res.ok) {
        const d = await res.json();
        setDepartments(d.data || []);
      }
    } catch { /* ignore */ }
  }, [companyId]);

  const fetchTemplates = useCallback(async () => {
    if (!companyId) return;
    try {
      const res = await fetch(`/api/sub-ops/companies/${companyId}/handoffs/templates`);
      if (res.ok) {
        const d = await res.json();
        setTemplates(d.data || []);
      }
    } catch { /* ignore */ }
  }, [companyId]);

  useEffect(() => {
    fetchBoard();
    fetchTemplates();
  }, [fetchBoard, fetchTemplates]);

  const openHandoffDetail = async (handoffId: string | null, areaId: string, fromDeptId: string, toDeptId: string) => {
    if (!companyId) return;
    setDetailLoading(true);

    if (!handoffId) {
      // Create the handoff first
      try {
        const res = await fetch(`/api/sub-ops/companies/${companyId}/handoffs`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            area_id: areaId,
            from_department_id: fromDeptId,
            to_department_id: toDeptId,
          }),
        });
        if (res.ok) {
          const newHandoff = await res.json();
          handoffId = newHandoff.id;
          await fetchBoard();
        }
      } catch { /* ignore */ }
    }

    if (handoffId) {
      try {
        const res = await fetch(`/api/sub-ops/companies/${companyId}/handoffs/${handoffId}`);
        if (res.ok) {
          setSelectedHandoff(await res.json());
        }
      } catch { /* ignore */ }
    }
    setDetailLoading(false);
  };

  const updateHandoffStatus = async (status: string) => {
    if (!companyId || !selectedHandoff) return;
    try {
      const res = await fetch(`/api/sub-ops/companies/${companyId}/handoffs/${selectedHandoff.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        // Reload detail
        const detRes = await fetch(`/api/sub-ops/companies/${companyId}/handoffs/${selectedHandoff.id}`);
        if (detRes.ok) setSelectedHandoff(await detRes.json());
        fetchBoard();
      }
    } catch { /* ignore */ }
  };

  const updateHandoffNotes = async (notes: string) => {
    if (!companyId || !selectedHandoff) return;
    try {
      await fetch(`/api/sub-ops/companies/${companyId}/handoffs/${selectedHandoff.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
    } catch { /* ignore */ }
  };

  const toggleChecklistItem = async (item: ChecklistItem) => {
    if (!companyId || !selectedHandoff) return;
    try {
      await fetch(`/api/sub-ops/companies/${companyId}/handoffs/${selectedHandoff.id}/checklist`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, completed: !item.completed }),
      });
      // Refresh detail
      const res = await fetch(`/api/sub-ops/companies/${companyId}/handoffs/${selectedHandoff.id}`);
      if (res.ok) setSelectedHandoff(await res.json());
    } catch { /* ignore */ }
  };

  const addChecklistItem = async () => {
    if (!companyId || !selectedHandoff || !newItemText.trim()) return;
    try {
      await fetch(`/api/sub-ops/companies/${companyId}/handoffs/${selectedHandoff.id}/checklist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item_text: newItemText.trim() }),
      });
      setNewItemText("");
      const res = await fetch(`/api/sub-ops/companies/${companyId}/handoffs/${selectedHandoff.id}`);
      if (res.ok) setSelectedHandoff(await res.json());
    } catch { /* ignore */ }
  };

  const applyTemplate = async (templateId: string) => {
    if (!companyId || !selectedHandoff) return;
    const template = templates.find(t => t.id === templateId);
    if (!template) return;
    // Add each item from template
    for (const item of template.items) {
      await fetch(`/api/sub-ops/companies/${companyId}/handoffs/${selectedHandoff.id}/checklist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item_text: item }),
      });
    }
    const res = await fetch(`/api/sub-ops/companies/${companyId}/handoffs/${selectedHandoff.id}`);
    if (res.ok) setSelectedHandoff(await res.json());
  };

  const addArea = async () => {
    if (!companyId || !areaProject.trim() || !areaName.trim()) return;
    try {
      const res = await fetch(`/api/sub-ops/companies/${companyId}/handoffs/areas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_name: areaProject.trim(), area_name: areaName.trim() }),
      });
      if (res.ok) {
        setAreaProject("");
        setAreaName("");
        setShowAddArea(false);
        fetchBoard();
      }
    } catch { /* ignore */ }
  };

  const addDepartment = async () => {
    if (!companyId || !deptName.trim()) return;
    try {
      const res = await fetch(`/api/sub-ops/companies/${companyId}/departments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: deptName.trim(), trade: deptTrade.trim() || null, color: deptColor }),
      });
      if (res.ok) {
        setDeptName("");
        setDeptTrade("");
        setDeptColor("#F97316");
        setShowAddDept(false);
        fetchBoard();
        fetchDepartments();
      }
    } catch { /* ignore */ }
  };

  const deleteDepartment = async (deptId: string) => {
    if (!companyId) return;
    if (!confirm("Delete this department? This will also remove related handoffs.")) return;
    try {
      await fetch(`/api/sub-ops/companies/${companyId}/departments/${deptId}`, { method: "DELETE" });
      fetchBoard();
      fetchDepartments();
    } catch { /* ignore */ }
  };

  const moveDepartment = async (deptId: string, direction: "up" | "down") => {
    if (!companyId) return;
    const idx = departments.findIndex(d => d.id === deptId);
    if (idx < 0) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= departments.length) return;

    // Swap sort_order values
    const a = departments[idx];
    const b = departments[swapIdx];
    await Promise.all([
      fetch(`/api/sub-ops/companies/${companyId}/departments/${a.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sort_order: b.sort_order }),
      }),
      fetch(`/api/sub-ops/companies/${companyId}/departments/${b.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sort_order: a.sort_order }),
      }),
    ]);
    fetchBoard();
    fetchDepartments();
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!companyId || !selectedHandoff || !e.target.files?.length) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("file", file);

    try {
      await fetch(`/api/sub-ops/companies/${companyId}/handoffs/${selectedHandoff.id}/photos`, {
        method: "POST",
        body: formData,
      });
      const res = await fetch(`/api/sub-ops/companies/${companyId}/handoffs/${selectedHandoff.id}`);
      if (res.ok) setSelectedHandoff(await res.json());
    } catch { /* ignore */ }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="w-6 h-6 border-2 border-[#F97316] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-bold text-[color:var(--text-primary)] flex items-center gap-2">
            <ArrowRightLeft size={20} /> Handoff Tracker
          </h2>
          <p className="text-xs text-[color:var(--text-muted)] mt-0.5">Track department-to-department handoffs by area</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView(view === "board" ? "departments" : "board")}
            className="flex items-center gap-1.5 px-3 py-2 bg-[var(--bg-tertiary)] text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] rounded-lg text-xs font-medium transition-colors min-h-[40px]"
          >
            <Settings size={14} />
            {view === "board" ? "Departments" : "Status Board"}
          </button>
          {view === "board" && (
            <>
              <button
                onClick={() => setShowAddArea(!showAddArea)}
                className="flex items-center gap-1.5 px-3 py-2 bg-[#F97316]/10 text-[#F97316] hover:bg-[#F97316]/20 rounded-lg text-xs font-semibold transition-colors min-h-[40px]"
              >
                <Plus size={14} /> Add Area
              </button>
              <button
                onClick={() => setShowAddDept(!showAddDept)}
                className="flex items-center gap-1.5 px-3 py-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-lg text-xs font-semibold transition-colors min-h-[40px]"
              >
                <Plus size={14} /> Add Dept
              </button>
            </>
          )}
        </div>
      </div>

      {/* Add Area Form */}
      {showAddArea && (
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-[color:var(--text-primary)]">New Area</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              value={areaProject}
              onChange={e => setAreaProject(e.target.value)}
              placeholder="Project name (e.g. Building A)"
              className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-lg text-sm text-[color:var(--text-primary)] placeholder-gray-500 min-h-[40px]"
            />
            <input
              value={areaName}
              onChange={e => setAreaName(e.target.value)}
              placeholder="Area name (e.g. Floor 1)"
              className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-lg text-sm text-[color:var(--text-primary)] placeholder-gray-500 min-h-[40px]"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={addArea} className="px-4 py-2 bg-[#F97316] text-[color:var(--text-primary)] rounded-lg text-xs font-semibold min-h-[40px]">
              Add Area
            </button>
            <button onClick={() => setShowAddArea(false)} className="px-4 py-2 bg-[var(--bg-tertiary)] text-[color:var(--text-secondary)] rounded-lg text-xs min-h-[40px]">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Add Department Form */}
      {showAddDept && (
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-[color:var(--text-primary)]">New Department</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              value={deptName}
              onChange={e => setDeptName(e.target.value)}
              placeholder="Department name"
              className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-lg text-sm text-[color:var(--text-primary)] placeholder-gray-500 min-h-[40px]"
            />
            <input
              value={deptTrade}
              onChange={e => setDeptTrade(e.target.value)}
              placeholder="Trade (optional)"
              className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-lg text-sm text-[color:var(--text-primary)] placeholder-gray-500 min-h-[40px]"
            />
            <div className="flex items-center gap-2">
              <label className="text-xs text-[color:var(--text-secondary)]">Color:</label>
              <input
                type="color"
                value={deptColor}
                onChange={e => setDeptColor(e.target.value)}
                className="w-8 h-8 rounded cursor-pointer bg-transparent border-0"
              />
              <span className="text-xs text-[color:var(--text-muted)]">{deptColor}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={addDepartment} className="px-4 py-2 bg-blue-500 text-[color:var(--text-primary)] rounded-lg text-xs font-semibold min-h-[40px]">
              Add Department
            </button>
            <button onClick={() => setShowAddDept(false)} className="px-4 py-2 bg-[var(--bg-tertiary)] text-[color:var(--text-secondary)] rounded-lg text-xs min-h-[40px]">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Board View */}
      {view === "board" && (
        <>
          {departments.length === 0 ? (
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-8 text-center">
              <ArrowRightLeft size={32} className="mx-auto text-gray-600 mb-3" />
              <p className="text-[color:var(--text-secondary)] text-sm mb-2">No departments set up yet</p>
              <p className="text-[color:var(--text-muted)] text-xs">Add departments to start tracking handoffs between them</p>
            </div>
          ) : departments.length < 2 ? (
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-8 text-center">
              <p className="text-[color:var(--text-secondary)] text-sm mb-2">Need at least 2 departments for handoffs</p>
              <p className="text-[color:var(--text-muted)] text-xs">Add another department to start tracking handoffs</p>
            </div>
          ) : board.length === 0 ? (
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-8 text-center">
              <p className="text-[color:var(--text-secondary)] text-sm mb-2">No areas yet</p>
              <p className="text-[color:var(--text-muted)] text-xs">Add areas to track handoffs across departments</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-[600px]">
                <thead>
                  <tr>
                    <th className="text-left text-xs font-semibold text-[color:var(--text-secondary)] px-3 py-2 sticky left-0 bg-[var(--bg-primary)] z-10 min-w-[140px]">
                      Area
                    </th>
                    {departments.slice(0, -1).map((dept, i) => (
                      <th key={dept.id} className="text-center text-xs font-semibold text-[color:var(--text-secondary)] px-2 py-2 min-w-[90px]">
                        <div className="flex items-center justify-center gap-1">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: dept.color }} />
                          <span className="truncate">{dept.name}</span>
                          <span className="text-gray-600 mx-0.5">→</span>
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: departments[i + 1].color }} />
                          <span className="truncate">{departments[i + 1].name}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {board.map(area => (
                    <tr key={area.area_id} className="border-t border-[var(--border-primary)]">
                      <td className="px-3 py-2.5 sticky left-0 bg-[var(--bg-primary)] z-10">
                        <div className="text-sm font-medium text-[color:var(--text-primary)]">{area.area_name}</div>
                        <div className="text-xs text-[color:var(--text-muted)]">{area.project_name}</div>
                      </td>
                      {area.cells.map((cell, idx) => {
                        const cfg = STATUS_CONFIG[cell.status] || STATUS_CONFIG.not_started;
                        return (
                          <td key={idx} className="px-2 py-2.5 text-center">
                            <button
                              onClick={() => openHandoffDetail(cell.handoff_id, area.area_id, cell.from_department_id, cell.to_department_id)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105 min-w-[70px] justify-center"
                              style={{ backgroundColor: cfg.bg, color: cfg.color }}
                            >
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cfg.color }} />
                              {cfg.abbrev}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Status Legend */}
          {board.length > 0 && (
            <div className="flex flex-wrap gap-3 text-xs text-[color:var(--text-muted)]">
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                <span key={key} className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cfg.color }} />
                  {cfg.label}
                </span>
              ))}
            </div>
          )}
        </>
      )}

      {/* Departments View */}
      {view === "departments" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[color:var(--text-primary)]">Department Order</h3>
            <button
              onClick={() => setShowAddDept(!showAddDept)}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-lg text-xs font-semibold transition-colors min-h-[36px]"
            >
              <Plus size={14} /> Add
            </button>
          </div>
          {departments.length === 0 ? (
            <p className="text-[color:var(--text-muted)] text-sm">No departments yet.</p>
          ) : (
            departments.map((dept, idx) => (
              <div key={dept.id} className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-4 h-4 rounded" style={{ backgroundColor: dept.color }} />
                  <div>
                    <div className="text-sm font-medium text-[color:var(--text-primary)]">{dept.name}</div>
                    {dept.trade && <div className="text-xs text-[color:var(--text-muted)]">{dept.trade}</div>}
                  </div>
                  {dept.crew_count !== undefined && (
                    <span className="text-xs text-[color:var(--text-muted)] bg-[var(--bg-tertiary)] px-2 py-0.5 rounded">
                      {dept.crew_count} crew
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => moveDepartment(dept.id, "up")}
                    disabled={idx === 0}
                    className="p-1.5 text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)] disabled:opacity-30 transition-colors"
                  >
                    <ChevronUp size={14} />
                  </button>
                  <button
                    onClick={() => moveDepartment(dept.id, "down")}
                    disabled={idx === departments.length - 1}
                    className="p-1.5 text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)] disabled:opacity-30 transition-colors"
                  >
                    <ChevronDown size={14} />
                  </button>
                  <button
                    onClick={() => deleteDepartment(dept.id)}
                    className="p-1.5 text-red-400/50 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
          <p className="text-xs text-gray-600">
            Handoffs flow left-to-right through departments in this order.
          </p>
        </div>
      )}

      {/* Handoff Detail Modal */}
      {(selectedHandoff || detailLoading) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setSelectedHandoff(null)}>
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {detailLoading ? (
              <div className="flex items-center justify-center h-40">
                <div className="w-6 h-6 border-2 border-[#F97316] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : selectedHandoff && (
              <div className="p-5 space-y-5">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium text-[color:var(--text-primary)]">
                      <span className="px-2 py-0.5 rounded text-xs" style={{ backgroundColor: selectedHandoff.from_department_color || "#F97316", color: "#fff" }}>
                        {selectedHandoff.from_department_name}
                      </span>
                      <ArrowRightLeft size={14} className="text-[color:var(--text-muted)]" />
                      <span className="px-2 py-0.5 rounded text-xs" style={{ backgroundColor: selectedHandoff.to_department_color || "#3B82F6", color: "#fff" }}>
                        {selectedHandoff.to_department_name}
                      </span>
                    </div>
                    <p className="text-xs text-[color:var(--text-muted)] mt-1">
                      {selectedHandoff.project_name} · {selectedHandoff.area_name}
                    </p>
                  </div>
                  <button onClick={() => setSelectedHandoff(null)} className="p-1.5 text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)]">
                    <X size={18} />
                  </button>
                </div>

                {/* Status */}
                <div>
                  <div className="text-xs text-[color:var(--text-muted)] mb-2">Status</div>
                  <div className="flex flex-wrap gap-2">
                    {(["not_started", "in_progress", "ready_for_handoff", "handed_off", "accepted", "issue_flagged"] as const).map(s => {
                      const cfg = STATUS_CONFIG[s];
                      const active = selectedHandoff.status === s;
                      return (
                        <button
                          key={s}
                          onClick={() => updateHandoffStatus(s)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all min-h-[32px]"
                          style={{
                            backgroundColor: active ? cfg.bg : "var(--bg-tertiary)",
                            color: active ? cfg.color : "var(--text-muted)",
                            borderWidth: 1,
                            borderColor: active ? cfg.color : "transparent",
                          }}
                        >
                          {cfg.label}
                        </button>
                      );
                    })}
                  </div>
                  {selectedHandoff.handoff_date && (
                    <p className="text-xs text-[color:var(--text-muted)] mt-1">Handed off: {selectedHandoff.handoff_date}</p>
                  )}
                  {selectedHandoff.accepted_date && (
                    <p className="text-xs text-[color:var(--text-muted)]">Accepted: {selectedHandoff.accepted_date}</p>
                  )}
                </div>

                {/* Checklist */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs text-[color:var(--text-muted)] flex items-center gap-1">
                      <Check size={12} />
                      Checklist ({selectedHandoff.checklist_complete}/{selectedHandoff.checklist_total})
                    </div>
                    {templates.length > 0 && (
                      <select
                        onChange={e => { if (e.target.value) applyTemplate(e.target.value); e.target.value = ""; }}
                        className="text-xs bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] text-[color:var(--text-secondary)] rounded px-2 py-1"
                        defaultValue=""
                      >
                        <option value="" disabled>Apply Template…</option>
                        {templates.map(t => (
                          <option key={t.id} value={t.id}>{t.title}</option>
                        ))}
                      </select>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    {selectedHandoff.checklist.map(item => (
                      <label key={item.id} className="flex items-start gap-2 group cursor-pointer">
                        <input
                          type="checkbox"
                          checked={item.completed}
                          onChange={() => toggleChecklistItem(item)}
                          className="mt-0.5 w-4 h-4 rounded border-gray-600 text-[#F97316] bg-[var(--bg-tertiary)] focus:ring-0 cursor-pointer"
                        />
                        <span className={`text-sm ${item.completed ? "text-[color:var(--text-muted)] line-through" : "text-[color:var(--text-secondary)]"}`}>
                          {item.item_text}
                        </span>
                      </label>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <input
                      value={newItemText}
                      onChange={e => setNewItemText(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && addChecklistItem()}
                      placeholder="Add checklist item…"
                      className="flex-1 px-3 py-1.5 bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-lg text-sm text-[color:var(--text-primary)] placeholder-gray-600 min-h-[36px]"
                    />
                    <button
                      onClick={addChecklistItem}
                      disabled={!newItemText.trim()}
                      className="px-3 py-1.5 bg-[#F97316]/10 text-[#F97316] rounded-lg text-xs font-medium disabled:opacity-40 min-h-[36px]"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Photos */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs text-[color:var(--text-muted)] flex items-center gap-1">
                      <Camera size={12} /> Photos ({selectedHandoff.photo_count})
                    </div>
                    <label className="flex items-center gap-1 px-2 py-1 bg-[var(--bg-tertiary)] text-[color:var(--text-secondary)] rounded text-xs cursor-pointer hover:text-[color:var(--text-primary)] transition-colors">
                      <Camera size={12} /> Upload
                      <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                    </label>
                  </div>
                  {selectedHandoff.photos.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {selectedHandoff.photos.map(photo => (
                        <div key={photo.id} className="aspect-square bg-[var(--bg-tertiary)] rounded-lg overflow-hidden relative">
                          <div className="w-full h-full flex items-center justify-center text-gray-600">
                            <Camera size={20} />
                          </div>
                          {photo.caption && (
                            <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-1.5 py-0.5 text-xs text-[color:var(--text-secondary)] truncate">
                              {photo.caption}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div>
                  <div className="text-xs text-[color:var(--text-muted)] mb-1 flex items-center gap-1">
                    <FileText size={12} /> Notes
                  </div>
                  <textarea
                    defaultValue={selectedHandoff.notes || ""}
                    onBlur={e => updateHandoffNotes(e.target.value)}
                    placeholder="Add notes about this handoff…"
                    rows={3}
                    className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-lg text-sm text-[color:var(--text-primary)] placeholder-gray-600 resize-none"
                  />
                </div>

                {/* Quick Status Actions */}
                <div className="flex flex-wrap gap-2 border-t border-[var(--border-primary)] pt-4">
                  {selectedHandoff.status !== "ready_for_handoff" && selectedHandoff.status !== "handed_off" && selectedHandoff.status !== "accepted" && (
                    <button
                      onClick={() => updateHandoffStatus("ready_for_handoff")}
                      className="flex items-center gap-1.5 px-3 py-2 bg-yellow-500/10 text-yellow-400 rounded-lg text-xs font-semibold min-h-[40px]"
                    >
                      <Clock size={14} /> Mark Ready for Handoff
                    </button>
                  )}
                  {(selectedHandoff.status === "ready_for_handoff" || selectedHandoff.status === "handed_off") && (
                    <button
                      onClick={() => updateHandoffStatus("accepted")}
                      className="flex items-center gap-1.5 px-3 py-2 bg-green-500/10 text-green-400 rounded-lg text-xs font-semibold min-h-[40px]"
                    >
                      <Check size={14} /> Accept Handoff
                    </button>
                  )}
                  {selectedHandoff.status !== "issue_flagged" && (
                    <button
                      onClick={() => updateHandoffStatus("issue_flagged")}
                      className="flex items-center gap-1.5 px-3 py-2 bg-red-500/10 text-red-400 rounded-lg text-xs font-semibold min-h-[40px]"
                    >
                      <AlertTriangle size={14} /> Flag Issue
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
