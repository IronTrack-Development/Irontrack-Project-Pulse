"use client";

import { useState, useEffect } from "react";
import {
  Shield, ShieldCheck, Calendar, Clock, MapPin, User,
  RefreshCw, CheckCircle2, Edit3, Lock, Trash2, FileText,
  AlertTriangle, Save, BookOpen, Check,
} from "lucide-react";
import type { ToolboxTalk, ToolboxTalkAttendee } from "@/types";
import AttendanceSheet from "./AttendanceSheet";
import EditableTalkingPoints from "./EditableTalkingPoints";
import { useTranslation } from "@/lib/i18n";

const { t } = useTranslation();

interface TalkDetailProps {
  projectId: string;
  talkId: string;
  onBack: () => void;
}

function categoryLabel(cat: string) {
  return cat.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function TalkDetail({ projectId, talkId, onBack }: TalkDetailProps) {
  const [talk, setTalk] = useState<(ToolboxTalk & { attendees?: ToolboxTalkAttendee[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Editable fields
  const [notes, setNotes] = useState("");
  const [correctiveActions, setCorrectiveActions] = useState("");
  const [followUpNeeded, setFollowUpNeeded] = useState(false);
  const [followUpNotes, setFollowUpNotes] = useState("");
  const [talkingPoints, setTalkingPoints] = useState<string[]>([]);
  const [dirty, setDirty] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [templateSaved, setTemplateSaved] = useState(false);
  const [isDefaultPresenter, setIsDefaultPresenter] = useState(false);

  const fetchTalk = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/safety/${talkId}`);
      if (res.ok) {
        const data = await res.json();
        setTalk(data);
        setNotes(data.notes || "");
        setCorrectiveActions(data.corrective_actions || "");
        setFollowUpNeeded(data.follow_up_needed || false);
        setFollowUpNotes(data.follow_up_notes || "");
        setTalkingPoints(data.talking_points || []);
        setDirty(false);
        // Check if current presenter matches default
        const defaultPresenter = localStorage.getItem(`pulse_default_presenter_${projectId}`);
        setIsDefaultPresenter(
          !!data.presenter && !!defaultPresenter && data.presenter === defaultPresenter
        );
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchTalk();
  }, [talkId]);

  const handleSave = async () => {
    if (!dirty) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/safety/${talkId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notes: notes.trim() || null,
          corrective_actions: correctiveActions.trim() || null,
          follow_up_needed: followUpNeeded,
          follow_up_notes: followUpNotes.trim() || null,
          talking_points: talkingPoints.filter((p) => p.trim()),
        }),
      });
      if (res.ok) {
        setDirty(false);
        fetchTalk();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to save");
      }
    } catch {
      setError(t('ui.failed.to.save'));
    }
    setSaving(false);
  };

  const handleComplete = async () => {
    setCompleting(true);
    setError(null);
    try {
      // Save any pending changes first
      if (dirty) await handleSave();

      const res = await fetch(
        `/api/projects/${projectId}/safety/${talkId}/complete`,
        { method: "POST" }
      );
      if (res.ok) {
        fetchTalk();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to complete");
      }
    } catch {
      setError(t('ui.failed.to.complete'));
    }
    setCompleting(false);
  };

  const handleDelete = async () => {
    if (!confirm(t('ui.delete.this.draft.talk'))) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/safety/${talkId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        onBack();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to delete");
      }
    } catch {
      setError(t('ui.failed.to.delete'));
    }
    setDeleting(false);
  };

  const handleExportPdf = () => {
    const companyName = localStorage.getItem("pulse_company_name");
    const params = new URLSearchParams();
    if (companyName) params.set("company", companyName);
    const qs = params.toString();
    window.open(
      `/api/projects/${projectId}/safety/${talkId}/pdf${qs ? `?${qs}` : ""}`,
      "_blank"
    );
  };

  const handleSaveAsTemplate = async () => {
    if (!talk) return;
    setSavingTemplate(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/safety/templates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: talk.topic,
          category: talk.category,
          talking_points: talk.talking_points || [],
          duration_minutes: talk.duration_minutes,
        }),
      });
      if (res.ok) setTemplateSaved(true);
    } catch {}
    setSavingTemplate(false);
  };

  const handleToggleDefaultPresenter = () => {
    if (!talk?.presenter) return;
    if (isDefaultPresenter) {
      localStorage.removeItem(`pulse_default_presenter_${projectId}`);
      setIsDefaultPresenter(false);
    } else {
      localStorage.setItem(`pulse_default_presenter_${projectId}`, talk.presenter);
      setIsDefaultPresenter(true);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw size={20} className="text-[#F97316] animate-spin" />
      </div>
    );
  }

  if (!talk) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-[color:var(--text-muted)]">{t('ui.talk.not.found')}</p>
      </div>
    );
  }

  const isReadOnly = talk.status === "locked" || talk.status === "completed";
  const talkDate = new Date(talk.talk_date + "T12:00:00");

  return (
    <div className="space-y-4">
      {/* Talk header */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold text-[color:var(--text-primary)]">{talk.topic}</h3>
            <div className="flex flex-wrap gap-2 mt-1.5">
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#3B82F6]/10 text-[#3B82F6]">
                {categoryLabel(talk.category)}
              </span>
              {talk.status === "completed" && (
                <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-[#22C55E]/10 text-[#22C55E]">
                  <ShieldCheck size={10} />{t('status.completed')}
                </span>
              )}
              {talk.status === "locked" && (
                <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-gray-700/50 text-[color:var(--text-secondary)]">
                  <Lock size={10} />{t('ui.locked')}
                </span>
              )}
              {talk.status === "draft" && (
                <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-[#F97316]/10 text-[#F97316]">
                  <Edit3 size={10} />{t('status.draft')}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-[color:var(--text-secondary)]">
          <div className="flex items-center gap-1.5">
            <Calendar size={12} className="text-[#F97316]" />
            {talkDate.toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
          </div>
          {talk.presenter && (
            <div className="flex items-center gap-1.5">
              <User size={12} className="text-[#F97316]" />
              {talk.presenter}
              <button
                onClick={handleToggleDefaultPresenter}
                className={`ml-1 flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded transition-colors ${
                  isDefaultPresenter
                    ? "bg-[#22C55E]/10 text-[#22C55E]"
                    : "bg-[var(--bg-tertiary)] text-[color:var(--text-muted)] hover:text-[color:var(--text-secondary)]"
                }`}
                title={isDefaultPresenter ? t('ui.default.presenter.f6c095') : t('ui.set.as.default.presenter')}
              >
                <Check size={8} />
                {isDefaultPresenter ? t('ui.default') : t('ui.set.default')}
              </button>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <Clock size={12} className="text-[#F97316]" />
            {talk.duration_minutes}{t('ui.min')}
          </div>
          {talk.location && (
            <div className="flex items-center gap-1.5">
              <MapPin size={12} className="text-[#F97316]" />
              {talk.location}
            </div>
          )}
        </div>
      </div>

      {/* Talking Points */}
      {(isReadOnly ? (talk.talking_points || []).length > 0 : true) && (
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-4">
          <h4 className="text-sm font-medium text-[color:var(--text-primary)] mb-3 flex items-center gap-2">
            <Shield size={14} className="text-[#F97316]" />{t('safety.talkingPoints')}
          </h4>
          <EditableTalkingPoints
            points={isReadOnly ? (talk.talking_points || []) : talkingPoints}
            onChange={(pts) => {
              setTalkingPoints(pts);
              setDirty(true);
            }}
            readOnly={isReadOnly}
          />
        </div>
      )}

      {/* Attendance Section */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-4">
        <AttendanceSheet
          projectId={projectId}
          talkId={talkId}
          attendees={talk.attendees || []}
          readOnly={isReadOnly}
          onRefresh={fetchTalk}
        />
      </div>

      {/* Notes & Corrective Actions */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-4 space-y-4">
        <div>
          <label className="text-xs text-[color:var(--text-muted)] mb-1 block">{t('ui.notes')}</label>
          <textarea
            value={notes}
            onChange={(e) => {
              setNotes(e.target.value);
              setDirty(true);
            }}
            disabled={isReadOnly}
            rows={3}
            placeholder={t('ui.additional.notes')}
            className="w-full bg-[#0B0B0D] border border-[#1F1F25] rounded-lg px-3 py-2.5 text-sm text-[color:var(--text-primary)] placeholder-gray-600 focus:outline-none focus:border-[#F97316] resize-none disabled:opacity-50"
          />
        </div>

        <div>
          <label className="text-xs text-[color:var(--text-muted)] mb-1 block">{t('ui.corrective.actions')}
          </label>
          <textarea
            value={correctiveActions}
            onChange={(e) => {
              setCorrectiveActions(e.target.value);
              setDirty(true);
            }}
            disabled={isReadOnly}
            rows={2}
            placeholder={t('ui.any.corrective.actions.needed')}
            className="w-full bg-[#0B0B0D] border border-[#1F1F25] rounded-lg px-3 py-2.5 text-sm text-[color:var(--text-primary)] placeholder-gray-600 focus:outline-none focus:border-[#F97316] resize-none disabled:opacity-50"
          />
        </div>

        {/* Follow-up toggle */}
        <div className="flex items-start gap-3">
          <button
            onClick={() => {
              if (!isReadOnly) {
                setFollowUpNeeded(!followUpNeeded);
                setDirty(true);
              }
            }}
            disabled={isReadOnly}
            className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center shrink-0 transition-colors ${
              followUpNeeded
                ? "bg-[#EAB308]/20 text-[#EAB308]"
                : "bg-[var(--bg-tertiary)] text-gray-600"
            } ${isReadOnly ? "cursor-default" : "cursor-pointer"}`}
          >
            {followUpNeeded && <AlertTriangle size={12} />}
          </button>
          <div className="flex-1">
            <div className="text-sm text-[color:var(--text-primary)]">{t('ui.follow.up.needed')}</div>
            {followUpNeeded && (
              <textarea
                value={followUpNotes}
                onChange={(e) => {
                  setFollowUpNotes(e.target.value);
                  setDirty(true);
                }}
                disabled={isReadOnly}
                rows={2}
                placeholder={t('ui.follow.up.details')}
                className="w-full mt-2 bg-[#0B0B0D] border border-[#1F1F25] rounded-lg px-3 py-2 text-sm text-[color:var(--text-primary)] placeholder-gray-600 focus:outline-none focus:border-[#F97316] resize-none disabled:opacity-50"
              />
            )}
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        {dirty && !isReadOnly && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-[#F97316] hover:bg-[#ea6c10] text-[color:var(--text-primary)] rounded-xl text-sm font-medium transition-colors disabled:opacity-50 min-h-[44px]"
          >
            <Save size={14} />
            {saving ? t('ui.saving') : t('ui.save.changes')}
          </button>
        )}

        {talk.status === "draft" && (
          <button
            onClick={handleComplete}
            disabled={completing}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-[#22C55E]/20 hover:bg-[#22C55E]/30 text-[#22C55E] rounded-xl text-sm font-medium transition-colors disabled:opacity-50 min-h-[44px]"
          >
            <CheckCircle2 size={14} />
            {completing ? t('ui.completing') : t('ui.complete.talk')}
          </button>
        )}

        <button
          onClick={handleExportPdf}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] text-[color:var(--text-secondary)] rounded-xl text-sm font-medium transition-colors min-h-[44px]"
        >
          <FileText size={14} />{t('ui.export.pdf')}
        </button>

        {isReadOnly && !templateSaved && (
          <button
            onClick={handleSaveAsTemplate}
            disabled={savingTemplate}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-[#3B82F6]/10 hover:bg-[#3B82F6]/20 text-[#3B82F6] rounded-xl text-sm font-medium transition-colors disabled:opacity-50 min-h-[44px]"
          >
            <BookOpen size={14} />
            {savingTemplate ? t('ui.saving') : t('ui.save.as.template')}
          </button>
        )}
        {templateSaved && (
          <span className="flex items-center gap-1.5 px-4 py-2.5 text-[#22C55E] text-sm min-h-[44px]">
            <Check size={14} />{t('ui.template.saved')}
          </span>
        )}

        {talk.status === "draft" && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 min-h-[44px] ml-auto"
          >
            <Trash2 size={14} />
            {deleting ? t('ui.deleting') : t('action.delete')}
          </button>
        )}
      </div>
    </div>
  );
}
