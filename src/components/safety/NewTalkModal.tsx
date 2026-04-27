"use client";

import { useState, useEffect } from "react";
import { X, Shield, ChevronRight, Plus, Minus, BookOpen } from "lucide-react";
import type { ToolboxTalkTemplate, ToolboxTalkCategory } from "@/types";
import EditableTalkingPoints from "./EditableTalkingPoints";
import { useTranslation } from "@/lib/i18n";

const { t } = useTranslation();

interface NewTalkModalProps {
  projectId: string;
  onClose: () => void;
  onCreated: (talkId: string) => void;
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

export default function NewTalkModal({
  projectId,
  onClose,
  onCreated,
}: NewTalkModalProps) {
  const [mode, setMode] = useState<"choose" | "template" | "custom">("choose");
  const [templates, setTemplates] = useState<ToolboxTalkTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ToolboxTalkTemplate | null>(null);
  const [creating, setCreating] = useState(false);

  // Form fields
  const [topic, setTopic] = useState("");
  const [category, setCategory] = useState<ToolboxTalkCategory>("general");
  const [talkDate, setTalkDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [presenter, setPresenter] = useState("");
  const [duration, setDuration] = useState(15);
  const [location, setLocation] = useState("");
  const [talkingPoints, setTalkingPoints] = useState<string[]>([""]);
  const [notes, setNotes] = useState("");
  const [createdTalkId, setCreatedTalkId] = useState<string | null>(null);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [templateSaved, setTemplateSaved] = useState(false);

  useEffect(() => {
    fetchTemplates();
    // Auto-fill default presenter from localStorage
    const defaultPresenter = localStorage.getItem(`pulse_default_presenter_${projectId}`);
    if (defaultPresenter) setPresenter(defaultPresenter);
  }, []);

  const fetchTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/safety/templates`);
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates || []);
      }
    } catch {}
    setLoadingTemplates(false);
  };

  const selectTemplate = (template: ToolboxTalkTemplate) => {
    setSelectedTemplate(template);
    setTopic(template.title);
    setCategory(template.category);
    setTalkingPoints([...template.talking_points]);
    setDuration(template.duration_minutes);
    setMode("template");
  };

  const handleCreate = async () => {
    if (!topic.trim()) return;
    setCreating(true);
    try {
      const body: any = {
        topic: topic.trim(),
        category,
        talk_date: talkDate,
        presenter: presenter.trim() || null,
        duration_minutes: duration,
        location: location.trim() || null,
        talking_points: talkingPoints.filter((p) => p.trim()),
        notes: notes.trim() || null,
      };
      if (selectedTemplate) {
        body.template_id = selectedTemplate.id;
      }

      const res = await fetch(`/api/projects/${projectId}/safety`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = await res.json();
        if (!selectedTemplate) {
          setCreatedTalkId(data.id);
        }
        onCreated(data.id);
      }
    } catch {}
    setCreating(false);
  };

  const handleSaveAsTemplate = async () => {
    setSavingTemplate(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/safety/templates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: topic.trim(),
          category,
          talking_points: talkingPoints.filter((p) => p.trim()),
          duration_minutes: duration,
        }),
      });
      if (res.ok) setTemplateSaved(true);
    } catch {}
    setSavingTemplate(false);
  };

  // Group templates by category
  const templatesByCategory: Record<string, ToolboxTalkTemplate[]> = {};
  templates.forEach((t) => {
    if (!templatesByCategory[t.category]) templatesByCategory[t.category] = [];
    templatesByCategory[t.category].push(t);
  });

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center">
      <div className="bg-[var(--bg-secondary)] w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[90vh] flex flex-col border border-[var(--border-primary)]">
        {/* Modal header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border-primary)]">
          <h3 className="text-base font-bold text-[color:var(--text-primary)] flex items-center gap-2">
            <Shield size={18} className="text-[#F97316]" />
            {mode === "choose"
              ? t('ui.new.toolbox.talk')
              : mode === "template"
              ? t('ui.from.template')
              : t('ui.custom.talk')}
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal body */}
        <div className="flex-1 overflow-y-auto p-4">
          {mode === "choose" && (
            <div className="space-y-3">
              <button
                onClick={() => setMode("custom")}
                className="w-full flex items-center justify-between bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl p-4 hover:border-[#F97316]/50 transition-colors min-h-[44px]"
              >
                <div className="text-left">
                  <div className="text-sm font-medium text-[color:var(--text-primary)]">{t('ui.custom.talk')}
                  </div>
                  <div className="text-xs text-[color:var(--text-muted)] mt-0.5">{t('ui.start.from.scratch.with.your.own.topic')}
                  </div>
                </div>
                <ChevronRight size={16} className="text-[color:var(--text-muted)]" />
              </button>

              <div className="text-xs text-[color:var(--text-muted)] uppercase tracking-wider mt-4 mb-2">{t('ui.or.start.from.a.template')}
              </div>

              {loadingTemplates ? (
                <div className="text-center py-8 text-[color:var(--text-muted)] text-sm">{t('ui.loading.templates')}
                </div>
              ) : (
                Object.entries(templatesByCategory).map(([cat, temps]) => (
                  <div key={cat} className="mb-3">
                    <div className="text-[10px] text-[color:var(--text-muted)] uppercase tracking-wider mb-1.5 px-1">
                      {cat.replace(/_/g, " ")}
                    </div>
                    {temps.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => selectTemplate(template)}
                        className="w-full flex items-center justify-between bg-[#0B0B0D] border border-[#1F1F25] rounded-lg p-3 hover:border-[#3B82F6]/50 transition-colors mb-1.5 min-h-[44px]"
                      >
                        <div className="text-left min-w-0 flex-1">
                          <div className="text-sm text-[color:var(--text-primary)] truncate">
                            {template.title}
                          </div>
                          <div className="text-[10px] text-[color:var(--text-muted)] mt-0.5">
                            {template.talking_points.length}{t('ui.talking.points')}{" "}
                            {template.duration_minutes}{t('ui.min')}
                            {template.osha_reference ? ` Â· ${template.osha_reference}` : ""}
                          </div>
                        </div>
                        <ChevronRight size={14} className="text-[color:var(--text-muted)] ml-2 shrink-0" />
                      </button>
                    ))}
                  </div>
                ))
              )}
            </div>
          )}

          {(mode === "template" || mode === "custom") && (
            <div className="space-y-4">
              {/* Topic */}
              <div>
                <label className="text-xs text-[color:var(--text-muted)] mb-1 block">{t('ui.topic')}
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder={t('ui.safety.topic.for.today.s.talk')}
                  className="w-full bg-[#0B0B0D] border border-[#1F1F25] rounded-lg px-3 py-2.5 text-sm text-[color:var(--text-primary)] placeholder-gray-600 focus:outline-none focus:border-[#F97316] min-h-[44px]"
                />
              </div>

              {/* Category */}
              <div>
                <label className="text-xs text-[color:var(--text-muted)] mb-1 block">{t('ui.category')}
                </label>
                <select
                  value={category}
                  onChange={(e) =>
                    setCategory(e.target.value as ToolboxTalkCategory)
                  }
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg px-3 py-2.5 text-sm text-[color:var(--text-primary)] focus:outline-none focus:border-[#F97316] min-h-[44px]"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date + Duration row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[color:var(--text-muted)] mb-1 block">{t('ui.date')}
                  </label>
                  <input
                    type="date"
                    value={talkDate}
                    onChange={(e) => setTalkDate(e.target.value)}
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg px-3 py-2.5 text-sm text-[color:var(--text-primary)] focus:outline-none focus:border-[#F97316] min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="text-xs text-[color:var(--text-muted)] mb-1 block">{t('ui.duration.min')}
                  </label>
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value) || 15)}
                    min={5}
                    max={120}
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg px-3 py-2.5 text-sm text-[color:var(--text-primary)] focus:outline-none focus:border-[#F97316] min-h-[44px]"
                  />
                </div>
              </div>

              {/* Presenter + Location */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[color:var(--text-muted)] mb-1 block">{t('safety.presenter')}
                  </label>
                  <input
                    type="text"
                    value={presenter}
                    onChange={(e) => setPresenter(e.target.value)}
                    placeholder={t('ui.name.709a23')}
                    className="w-full bg-[#0B0B0D] border border-[#1F1F25] rounded-lg px-3 py-2.5 text-sm text-[color:var(--text-primary)] placeholder-gray-600 focus:outline-none focus:border-[#F97316] min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="text-xs text-[color:var(--text-muted)] mb-1 block">{t('ui.location')}
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder={t('ui.where')}
                    className="w-full bg-[#0B0B0D] border border-[#1F1F25] rounded-lg px-3 py-2.5 text-sm text-[color:var(--text-primary)] placeholder-gray-600 focus:outline-none focus:border-[#F97316] min-h-[44px]"
                  />
                </div>
              </div>

              {/* Talking Points */}
              <div>
                <label className="text-xs text-[color:var(--text-muted)] mb-2 block">{t('safety.talkingPoints')}
                </label>
                <EditableTalkingPoints
                  points={talkingPoints}
                  onChange={setTalkingPoints}
                />
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs text-[color:var(--text-muted)] mb-1 block">{t('ui.notes')}
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder={t('ui.additional.notes')}
                  className="w-full bg-[#0B0B0D] border border-[#1F1F25] rounded-lg px-3 py-2.5 text-sm text-[color:var(--text-primary)] placeholder-gray-600 focus:outline-none focus:border-[#F97316] resize-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal footer */}
        <div className="p-4 border-t border-[var(--border-primary)] flex gap-2">
          {mode !== "choose" && (
            <button
              onClick={() => {
                setMode("choose");
                if (!selectedTemplate) {
                  setTopic("");
                  setTalkingPoints([""]);
                }
              }}
              className="px-4 py-2.5 bg-[#1F1F25] text-[color:var(--text-secondary)] rounded-xl text-sm font-medium hover:bg-[#2a2a35] transition-colors min-h-[44px]"
            >{t('action.back')}
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-[#1F1F25] text-[color:var(--text-secondary)] rounded-xl text-sm font-medium hover:bg-[#2a2a35] transition-colors min-h-[44px]"
          >{t('action.cancel')}
          </button>
          {mode !== "choose" && (
            <button
              onClick={handleCreate}
              disabled={creating || !topic.trim()}
              className="flex-1 px-4 py-2.5 bg-[#F97316] hover:bg-[#ea6c10] text-[color:var(--text-primary)] rounded-xl text-sm font-bold transition-colors disabled:opacity-50 min-h-[44px]"
            >
              {creating ? t('ui.creating') : t('ui.create.talk')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
