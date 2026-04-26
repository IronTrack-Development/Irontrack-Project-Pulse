"use client";

import { useState, useEffect } from "react";
import { X, Plus, Trash2, Save, BookOpen, RefreshCw } from "lucide-react";
import type { ToolboxTalkTemplate, ToolboxTalkCategory } from "@/types";
import EditableTalkingPoints from "./EditableTalkingPoints";

interface TemplateManagerProps {
  projectId: string;
  onClose: () => void;
}

const CATEGORIES: { value: ToolboxTalkCategory; label: string }[] = [
  { value: "falls", label: "Falls" },
  { value: "electrical", label: "Electrical" },
  { value: "excavation", label: "Excavation" },
  { value: "confined_space", label: "Confined Space" },
  { value: "scaffolding", label: "Scaffolding" },
  { value: "ppe", label: "PPE" },
  { value: "heat_illness", label: "Heat Illness" },
  { value: "cold_stress", label: "Cold Stress" },
  { value: "fire_prevention", label: "Fire Prevention" },
  { value: "hazcom", label: "HazCom" },
  { value: "lockout_tagout", label: "Lockout/Tagout" },
  { value: "crane_rigging", label: "Crane & Rigging" },
  { value: "housekeeping", label: "Housekeeping" },
  { value: "hand_power_tools", label: "Hand & Power Tools" },
  { value: "ladders", label: "Ladders" },
  { value: "silica", label: "Silica" },
  { value: "struck_by", label: "Struck-By" },
  { value: "caught_between", label: "Caught In/Between" },
  { value: "traffic_control", label: "Traffic Control" },
  { value: "general", label: "General" },
  { value: "custom", label: "Custom" },
];

function categoryLabel(cat: string) {
  return cat.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function TemplateManager({ projectId, onClose }: TemplateManagerProps) {
  const [templates, setTemplates] = useState<ToolboxTalkTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Create/Edit form fields
  const [formTitle, setFormTitle] = useState("");
  const [formCategory, setFormCategory] = useState<ToolboxTalkCategory>("general");
  const [formPoints, setFormPoints] = useState<string[]>([""]);
  const [formDuration, setFormDuration] = useState(15);
  const [formOsha, setFormOsha] = useState("");

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/safety/templates`);
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates || []);
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const resetForm = () => {
    setFormTitle("");
    setFormCategory("general");
    setFormPoints([""]);
    setFormDuration(15);
    setFormOsha("");
    setShowCreate(false);
    setEditingId(null);
  };

  const startEdit = (t: ToolboxTalkTemplate) => {
    setEditingId(t.id);
    setFormTitle(t.title);
    setFormCategory(t.category);
    setFormPoints([...t.talking_points]);
    setFormDuration(t.duration_minutes);
    setFormOsha(t.osha_reference || "");
    setShowCreate(false);
  };

  const handleSave = async () => {
    if (!formTitle.trim()) return;
    setSaving(true);
    const body = {
      title: formTitle.trim(),
      category: formCategory,
      talking_points: formPoints.filter((p) => p.trim()),
      duration_minutes: formDuration,
      osha_reference: formOsha.trim() || null,
    };

    try {
      if (editingId) {
        // PATCH existing
        const res = await fetch(`/api/projects/${projectId}/safety/templates`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingId, ...body }),
        });
        if (res.ok) {
          resetForm();
          fetchTemplates();
        }
      } else {
        // POST new
        const res = await fetch(`/api/projects/${projectId}/safety/templates`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (res.ok) {
          resetForm();
          fetchTemplates();
        }
      }
    } catch {}
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this template?")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/projects/${projectId}/safety/templates`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        fetchTemplates();
      }
    } catch {}
    setDeleting(null);
  };

  // Group by category
  const grouped: Record<string, ToolboxTalkTemplate[]> = {};
  templates.forEach((t) => {
    if (!grouped[t.category]) grouped[t.category] = [];
    grouped[t.category].push(t);
  });

  const showForm = showCreate || editingId;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center">
      <div className="bg-[var(--bg-secondary)] w-full sm:max-w-xl sm:rounded-2xl rounded-t-2xl max-h-[90vh] flex flex-col border border-[var(--border-primary)]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border-primary)]">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <BookOpen size={16} className="text-[#F97316]" />
            {showForm
              ? editingId
                ? "Edit Template"
                : "New Template"
              : "Manage Templates"}
          </h3>
          <button
            onClick={showForm ? resetForm : onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-white transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4">
          {showForm ? (
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Title *</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Template title"
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#F97316] min-h-[44px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as ToolboxTalkCategory)}
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#F97316] min-h-[44px]"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Duration (min)</label>
                  <input
                    type="number"
                    value={formDuration}
                    onChange={(e) => setFormDuration(parseInt(e.target.value) || 15)}
                    min={5}
                    max={120}
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#F97316] min-h-[44px]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">OSHA Reference</label>
                <input
                  type="text"
                  value={formOsha}
                  onChange={(e) => setFormOsha(e.target.value)}
                  placeholder="e.g. 29 CFR 1926.501"
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#F97316] min-h-[44px]"
                />
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-2 block">Talking Points</label>
                <EditableTalkingPoints points={formPoints} onChange={setFormPoints} />
              </div>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw size={20} className="text-[#F97316] animate-spin" />
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              No templates yet. Create one to get started.
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(grouped).map(([cat, temps]) => (
                <div key={cat}>
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 px-1">
                    {categoryLabel(cat)}
                  </div>
                  <div className="space-y-1.5">
                    {temps.map((t) => (
                      <div
                        key={t.id}
                        className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg p-3 flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-white truncate">{t.title}</span>
                            {t.is_system ? (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#3B82F6]/10 text-[#3B82F6] shrink-0">
                                System
                              </span>
                            ) : (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#F97316]/10 text-[#F97316] shrink-0">
                                Custom
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-gray-500 mt-0.5">
                            {t.talking_points.length} points · {t.duration_minutes} min
                            {t.osha_reference ? ` · ${t.osha_reference}` : ""}
                          </div>
                        </div>
                        {!t.is_system && (
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => startEdit(t)}
                              className="p-2 text-gray-500 hover:text-white transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
                              title="Edit"
                            >
                              <Save size={13} />
                            </button>
                            <button
                              onClick={() => handleDelete(t.id)}
                              disabled={deleting === t.id}
                              className="p-2 text-gray-500 hover:text-red-400 transition-colors disabled:opacity-50 min-w-[36px] min-h-[36px] flex items-center justify-center"
                              title="Delete"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--border-primary)] flex gap-2">
          {showForm ? (
            <>
              <button
                onClick={resetForm}
                className="px-4 py-2.5 bg-[var(--bg-tertiary)] text-gray-300 rounded-xl text-sm font-medium hover:bg-[var(--bg-hover)] transition-colors min-h-[44px]"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !formTitle.trim()}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#F97316] hover:bg-[#ea6c10] text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50 min-h-[44px]"
              >
                <Save size={14} />
                {saving ? "Saving..." : editingId ? "Update Template" : "Create Template"}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2.5 bg-[var(--bg-tertiary)] text-gray-300 rounded-xl text-sm font-medium hover:bg-[var(--bg-hover)] transition-colors min-h-[44px]"
              >
                Close
              </button>
              <button
                onClick={() => setShowCreate(true)}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#F97316] hover:bg-[#ea6c10] text-white rounded-xl text-sm font-bold transition-colors min-h-[44px]"
              >
                <Plus size={14} />
                Create New Template
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
