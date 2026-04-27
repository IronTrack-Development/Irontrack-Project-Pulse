"use client";

import { useState, useEffect } from "react";
import {
  Shield, ShieldCheck, Plus, RefreshCw, Users, Calendar,
  CheckCircle2, Edit3, Lock, AlertTriangle, ArrowLeft,
  Settings, BookOpen,
} from "lucide-react";
import type { ToolboxTalk } from "@/types";
import NewTalkModal from "./NewTalkModal";
import TalkDetail from "./TalkDetail";
import SafetySettings from "./SafetySettings";
import TemplateManager from "./TemplateManager";
import { t } from "@/lib/i18n";

interface SafetyDashboardProps {
  projectId: string;
}

function categoryLabel(cat: string) {
  return cat.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function statusBadge(status: string) {
  switch (status) {
    case "completed":
      return (
        <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-[#22C55E]/10 text-[#22C55E]">
          <ShieldCheck size={10} />{t('status.completed')}
        </span>
      );
    case "locked":
      return (
        <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-gray-700/50 text-[color:var(--text-secondary)]">
          <Lock size={10} />{t('ui.locked')}
        </span>
      );
    default:
      return (
        <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-[#F97316]/10 text-[#F97316]">
          <Edit3 size={10} />{t('status.draft')}
        </span>
      );
  }
}

function categoryBadge(category: string) {
  return (
    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#3B82F6]/10 text-[#3B82F6]">
      {categoryLabel(category)}
    </span>
  );
}

function TalkCard({
  talk,
  onClick,
}: {
  talk: ToolboxTalk;
  onClick: () => void;
}) {
  const date = new Date(talk.talk_date + "T12:00:00");

  return (
    <button
      onClick={onClick}
      className="block w-full text-left bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-4 hover:border-[var(--border-secondary)] transition-colors min-h-[44px]"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-[color:var(--text-primary)] truncate">{talk.topic}</div>
          <div className="text-xs text-[color:var(--text-muted)] mt-0.5">
            {date.toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
            {talk.presenter ? ` — ${talk.presenter}` : ""}
          </div>
        </div>
        <div className="flex items-center gap-1.5 ml-2 shrink-0">
          {statusBadge(talk.status)}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mt-2">
        {categoryBadge(talk.category)}
        {(talk.attendee_count ?? 0) > 0 && (
          <span className="flex items-center gap-1 text-[10px] text-[color:var(--text-secondary)]">
            <Users size={10} />
            {talk.signed_count || 0}/{talk.attendee_count}{t('ui.signed')}
          </span>
        )}
        {talk.duration_minutes && (
          <span className="text-[10px] text-[color:var(--text-muted)]">
            {talk.duration_minutes}{t('ui.min')}
          </span>
        )}
        {talk.follow_up_needed && (
          <span className="flex items-center gap-1 text-[10px] text-[#EAB308]">
            <AlertTriangle size={10} />{t('ui.follow.up.a931af')}
          </span>
        )}
      </div>
    </button>
  );
}

export default function SafetyDashboard({ projectId }: SafetyDashboardProps) {
  const [talks, setTalks] = useState<ToolboxTalk[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedTalkId, setSelectedTalkId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  const fetchTalks = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/safety?limit=50`);
      if (res.ok) {
        const data = await res.json();
        setTalks(data.talks || []);
        setTotal(data.total || 0);
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchTalks();
  }, [projectId]);

  // Quick stats
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split("T")[0];
  const thisMonthTalks = talks.filter((item) => item.talk_date >= monthStart);
  const avgAttendance =
    talks.length > 0
      ? Math.round(
          talks.reduce((sum, talk) => sum + (talk.attendee_count || 0), 0) / talks.length
        )
      : 0;
  const followUps = talks.filter(
    (item) => item.follow_up_needed && item.status !== "locked"
  ).length;

  // If viewing a specific talk detail
  if (selectedTalkId) {
    return (
      <div>
        <button
          onClick={() => {
            setSelectedTalkId(null);
            fetchTalks();
          }}
          className="flex items-center gap-1.5 text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)] text-sm transition-colors min-h-[44px] mb-4"
        >
          <ArrowLeft size={16} />{t('ui.back.to.safety')}
        </button>
        <TalkDetail
          projectId={projectId}
          talkId={selectedTalkId}
          onBack={() => {
            setSelectedTalkId(null);
            fetchTalks();
          }}
        />
      </div>
    );
  }

  return (
    <div>
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-[color:var(--text-primary)] flex items-center gap-2">
          <Shield size={18} className="text-[#F97316]" />{t('nav.safety')}
          {total > 0 && (
            <span className="text-xs text-[color:var(--text-muted)] font-normal">({total})</span>
          )}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 rounded-lg text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)] transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
            title={t('ui.safety.settings')}
          >
            <Settings size={14} />
          </button>
          <button
            onClick={fetchTalks}
            className="p-2 rounded-lg bg-[var(--bg-tertiary)] text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#F97316] hover:bg-[#ea6c10] text-[color:var(--text-primary)] rounded-xl text-sm font-medium transition-colors min-h-[40px]"
          >
            <Plus size={14} />{t('safety.newTalk')}
          </button>
        </div>
      </div>

      {/* Manage Templates link */}
      <div className="flex items-center gap-3 mb-3">
        <button
          onClick={() => setShowTemplates(true)}
          className="flex items-center gap-1.5 text-xs text-[color:var(--text-muted)] hover:text-[#F97316] transition-colors"
        >
          <BookOpen size={12} />{t('ui.manage.templates')}
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-3">
          <div className="text-[10px] text-[color:var(--text-muted)] uppercase tracking-wider">{t('ui.this.month')}
          </div>
          <div className="text-lg font-bold text-[color:var(--text-primary)] mt-1">
            {thisMonthTalks.length}
          </div>
        </div>
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-3">
          <div className="text-[10px] text-[color:var(--text-muted)] uppercase tracking-wider">{t('ui.avg.attendance')}
          </div>
          <div className="text-lg font-bold text-[color:var(--text-primary)] mt-1">{avgAttendance}</div>
        </div>
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-3">
          <div className="text-[10px] text-[color:var(--text-muted)] uppercase tracking-wider">{t('ui.follow.ups')}
          </div>
          <div
            className={`text-lg font-bold mt-1 ${
              followUps > 0 ? "text-[#EAB308]" : "text-[color:var(--text-primary)]"
            }`}
          >
            {followUps}
          </div>
        </div>
      </div>

      {/* Talk list */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw size={20} className="text-[#F97316] animate-spin" />
        </div>
      ) : talks.length === 0 ? (
        <div className="text-center py-12">
          <Shield size={32} className="mx-auto mb-3 text-gray-700" />
          <p className="text-sm text-[color:var(--text-muted)] mb-1">{t('ui.no.toolbox.talks.yet')}</p>
          <p className="text-xs text-gray-600">{t('ui.start.your.first.safety.talk.to.document.compliance')}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {talks.map((talk) => (
            <TalkCard
              key={talk.id}
              talk={talk}
              onClick={() => setSelectedTalkId(talk.id)}
            />
          ))}
        </div>
      )}

      {/* New Talk Modal */}
      {showNewModal && (
        <NewTalkModal
          projectId={projectId}
          onClose={() => setShowNewModal(false)}
          onCreated={(talkId) => {
            setShowNewModal(false);
            setSelectedTalkId(talkId);
          }}
        />
      )}

      {/* Safety Settings Modal */}
      {showSettings && (
        <SafetySettings
          projectId={projectId}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Template Manager Modal */}
      {showTemplates && (
        <TemplateManager
          projectId={projectId}
          onClose={() => setShowTemplates(false)}
        />
      )}
    </div>
  );
}
