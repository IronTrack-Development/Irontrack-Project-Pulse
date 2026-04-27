"use client";

import { useState, useEffect } from "react";
import { X, Plus, Trash2, Save, BookOpen, RefreshCw } from "lucide-react";
import type { ToolboxTalkTemplate, ToolboxTalkCategory } from "@/types";
import EditableTalkingPoints from "./EditableTalkingPoints";
import { t } from "@/lib/i18n";

interface TemplateManagerProps {
  projectId: string;
  onClose: () => void;
}

const CATEGORIES: { value: ToolboxTalkCategory; label: string }[] = [
  { value: "falls", label: t('ui.falls') },
  { value: "electrical", label: t('ui.electrical') },
  { value: "excavation", label: t('ui.excavation') },
  { value: "confined_space", label: t('ui.confined.space') },
  { value: "scaffolding", label: t('ui.scaffolding') },
  { value: "ppe", label: "PPE" },
  { value: "heat_illness", label: t('ui.heat.illness') },
  { value: "cold_stress", label: t('ui.cold.stress') },
  { value: "fire_prevention", label: t('ui.fire.prevention') },
  { value: "hazcom", label: t('ui.hazcom') },
  { value: "lockout_tagout", label: t('ui.lockout.tagout') },
  { value: "crane_rigging", label: t('ui.crane.and.rigging') },
  { value: "housekeeping", label: t('ui.housekeeping') },
  { value: "hand_power_tools", label: t('ui.hand.and.power.tools') },
  { value: "ladders", label: t('ui.ladders') },
  { value: "silica", label: t('ui.silica') },
  { value: "struck_by", label: t('ui.struck.by') },
  { value: "caught_between", label: t('ui.caught.in.between') },
  { value: "traffic_control", label: t('ui.traffic.control') },
  { value: "general", label: t('ui.general') },
  { value: "custom", label: t('ui.custom') },
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
    if (!confirm(t('ui.delete.this.template'))) return;
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
  templates.forEach((item) => {
    if (!grouped[item.category]) grouped[item.category] = [];
    grouped[item.category].push(item);
  });

  const showForm = showCreate || editingId;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center">
      <div className="bg-[var(--bg-secondary)] w-full sm:max-w-xl sm:rounded-2xl rounded-t-2xl max-h-[90vh] flex flex-col border border-[var(--border-primary)]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border-primary)]">
          <h3 className="text-base font-bold text-[color:var(--text-primary)] flex items-center gap-2">
            <BookOpen size={16} className="text-[#F97316]" />
            {showForm
              ? editingId
                ? t('ui.edit.template')
                : t('ui.new.template')
              : t('ui.manage.templates')}
          </h3>
          <button
            onClick={showForm ? resetForm : onClose}
            className="p-2 rounded-lg text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4">
          {showForm ? (
            <div className="space-y-4">
              <div>
                <label className="text-xs text-[color:var(--text-muted)] mb-1 block">{t('ui.title.961697')}</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder={t('ui.template.title')}
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg px-3 py-2.5 text-sm text-[color:var(--text-primary)] placeholder-gray-600 focus:outline-none focus:border-[#F97316] min-h-[44px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[color:var(--text-muted)] mb-1 block">{t('blocker.category')}</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as ToolboxTalkCategory)}
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg px-3 py-2.5 text-sm text-[color:var(--text-primary)] focus:outline-none focus:border-[#F97316] min-h-[44px]"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-[color:var(--text-muted)] mb-1 block">{t('ui.duration.min')}</label>
                  <input
                    type="number"
                    value={formDuration}
                    onChange={(e) => setFormDuration(parseInt(e.target.value) || 15)}
                    min={5}
                    max={120}
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg px-3 py-2.5 text-sm text-[color:var(--text-primary)] focus:outline-none focus:border-[#F97316] min-h-[44px]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-[color:var(--text-muted)] mb-1 block">{t('ui.osha.reference')}</label>
                <input
                  type="text"
                  value={formOsha}
                  onChange={(e) => setFormOsha(e.target.value)}
                  placeholder={t('ui.e.g.29.cfr.1926.501')}
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg px-3 py-2.5 text-sm text-[color:var(--text-primary)] placeholder-gray-600 focus:outline-none focus:border-[#F97316] min-h-[44px]"
                />
              </div>

              <div>
                <label className="text-xs text-[color:var(--text-muted)] mb-2 block">{t('safety.talkingPoints')}</label>
                <EditableTalkingPoints points={formPoints} onChange={setFormPoints} />
              </div>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw size={20} className="text-[#F97316] animate-spin" />
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-8 text-[color:var(--text-muted)] text-sm">{t('ui.no.templates.yet.create.one.to.get.started')}
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(grouped).map(([cat, temps]) => (
                <div key={cat}>
                  <div className="text-[10px] text-[color:var(--text-muted)] uppercase tracking-wider mb-2 px-1">
                    {categoryLabel(cat)}
                  </div>
                  <div className="space-y-1.5">
                    {temps.map((template) => (
                      <div
                        key={template.id}
                        className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg p-3 flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-[color:var(--text-primary)] truncate">{template.title}</span>
                            {template.is_system ? (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#3B82F6]/10 text-[#3B82F6] shrink-0">{t('ui.system')}
                              </span>
                            ) : (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#F97316]/10 text-[#F97316] shrink-0">{t('ui.custom')}
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-[color:var(--text-muted)] mt-0.5">
                            {template.talking_points.length}{t('ui.points')} {template.duration_minutes}{t('ui.min')}
                            {template.osha_reference ? ` Â· ${template.osha_reference}` : ""}
                          </div>
                        </div>
                        {!template.is_system && (
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => startEdit(template)}
                              className="p-2 text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)] transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
                              title={t('action.edit')}
                            >
                              <Save size={13} />
                            </button>
                            <button
                              onClick={() => handleDelete(template.id)}
                              disabled={deleting === template.id}
                              className="p-2 text-[color:var(--text-muted)] hover:text-red-400 transition-colors disabled:opacity-50 min-w-[36px] min-h-[36px] flex items-center justify-center"
                              title={t('action.delete')}
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
                className="px-4 py-2.5 bg-[var(--bg-tertiary)] text-[color:var(--text-secondary)] rounded-xl text-sm font-medium hover:bg-[var(--bg-hover)] transition-colors min-h-[44px]"
              >{t('action.cancel')}
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !formTitle.trim()}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#F97316] hover:bg-[#ea6c10] text-[color:var(--text-primary)] rounded-xl text-sm font-bold transition-colors disabled:opacity-50 min-h-[44px]"
              >
                <Save size={14} />
                {saving ? t('ui.saving') : editingId ? t('ui.update.template') : t('ui.create.template')}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2.5 bg-[var(--bg-tertiary)] text-[color:var(--text-secondary)] rounded-xl text-sm font-medium hover:bg-[var(--bg-hover)] transition-colors min-h-[44px]"
              >{t('ui.close')}
              </button>
              <button
                onClick={() => setShowCreate(true)}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#F97316] hover:bg-[#ea6c10] text-[color:var(--text-primary)] rounded-xl text-sm font-bold transition-colors min-h-[44px]"
              >
                <Plus size={14} />{t('ui.create.new.template')}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
