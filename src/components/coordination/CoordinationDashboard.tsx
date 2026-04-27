"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Handshake,
  Plus,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  ChevronRight,
} from "lucide-react";
import type { CoordinationMeeting } from "@/types";
import NewMeetingModal from "./NewMeetingModal";
import MeetingDetail from "./MeetingDetail";
import ActionTracker from "./ActionTracker";
import { useTranslation } from "@/lib/i18n";

const { t } = useTranslation();

interface CoordinationDashboardProps {
  projectId: string;
  defaultView?: "meetings" | "actions";
}

const STATUS_COLORS: Record<string, string> = {
  scheduled: "#3B82F6",
  in_progress: "#F97316",
  completed: "#22C55E",
  cancelled: "var(--text-muted)",
};

export default function CoordinationDashboard({ projectId, defaultView = "meetings" }: CoordinationDashboardProps) {
  const [view, setView] = useState<"list" | "detail" | "actions">(defaultView === "actions" ? "actions" : "list");
  const [meetings, setMeetings] = useState<CoordinationMeeting[]>([]);
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const [actionSummary, setActionSummary] = useState({ open: 0, overdue: 0 });

  const fetchMeetings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/coordination`);
      if (res.ok) {
        const data = await res.json();
        setMeetings(data.meetings || []);
      }
    } catch (e) { /* silent */ }
    setLoading(false);
  }, [projectId]);

  const fetchActionSummary = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/coordination/actions?status=open&limit=1`);
      if (res.ok) {
        const data = await res.json();
        setActionSummary({ open: data.open_count || 0, overdue: data.overdue_count || 0 });
      }
    } catch (e) { /* silent */ }
  }, [projectId]);

  useEffect(() => {
    fetchMeetings();
    fetchActionSummary();
  }, [fetchMeetings, fetchActionSummary]);

  const handleMeetingCreated = () => {
    setShowNewModal(false);
    fetchMeetings();
    fetchActionSummary();
  };

  const handleSelectMeeting = (id: string) => {
    setSelectedMeetingId(id);
    setView("detail");
  };

  const handleBackToList = () => {
    setView("list");
    setSelectedMeetingId(null);
    fetchMeetings();
    fetchActionSummary();
  };

  // Action tracker view
  if (view === "actions") {
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setView("list")}
            className="text-sm text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] transition-colors min-h-[44px] px-2"
          >{t('ui.meetings')}
          </button>
        </div>
        <ActionTracker projectId={projectId} />
      </div>
    );
  }

  // Meeting detail view
  if (view === "detail" && selectedMeetingId) {
    return (
      <MeetingDetail
        projectId={projectId}
        meetingId={selectedMeetingId}
        onBack={handleBackToList}
      />
    );
  }

  // Meeting list view
  return (
    <div>
      {/* Action Items Banner */}
      {(actionSummary.open > 0 || actionSummary.overdue > 0) && (
        <button
          onClick={() => setView("actions")}
          className="w-full mb-4 p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] hover:border-[#F97316]/30 transition-colors text-left min-h-[44px]"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#F97316]/10">
                <AlertTriangle size={18} className="text-[#F97316]" />
              </div>
              <div>
                <span className="text-[color:var(--text-primary)] text-sm font-medium">
                  {actionSummary.open}{t('ui.open.action.item')}{actionSummary.open !== 1 ? t('ui.s') : ""}
                </span>
                {actionSummary.overdue > 0 && (
                  <span className="text-red-400 text-sm ml-2">
                    · {actionSummary.overdue}{t('ui.overdue')}
                  </span>
                )}
              </div>
            </div>
            <ChevronRight size={16} className="text-[color:var(--text-muted)]" />
          </div>
        </button>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Handshake size={20} className="text-[#F97316]" />
          <h2 className="text-lg font-bold text-[color:var(--text-primary)]">{t('ui.coordination.meetings')}</h2>
        </div>
        <button
          onClick={() => setShowNewModal(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-[#F97316] hover:bg-[#ea6c10] text-[color:var(--text-primary)] rounded-lg text-sm font-semibold transition-colors min-h-[44px]"
        >
          <Plus size={16} />{t('ui.new.meeting')}
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center h-32">
          <RefreshCw size={20} className="text-[#F97316] animate-spin" />
        </div>
      )}

      {/* Empty state */}
      {!loading && meetings.length === 0 && (
        <div className="text-center py-16">
          <Handshake size={48} className="text-gray-600 mx-auto mb-4" />
          <p className="text-[color:var(--text-secondary)] text-lg mb-2">{t('ui.no.coordination.meetings.yet')}</p>
          <p className="text-[color:var(--text-muted)] text-sm mb-6">{t('ui.schedule.your.first.meeting.to.start.tracking.trade.coordination')}</p>
          <button
            onClick={() => setShowNewModal(true)}
            className="px-6 py-3 bg-[#F97316] hover:bg-[#ea6c10] text-[color:var(--text-primary)] rounded-lg text-sm font-semibold transition-colors min-h-[44px]"
          >{t('ui.schedule.meeting')}
          </button>
        </div>
      )}

      {/* Meeting cards */}
      {!loading && meetings.length > 0 && (
        <div className="space-y-3">
          {meetings.map((meeting) => (
            <button
              key={meeting.id}
              onClick={() => handleSelectMeeting(meeting.id)}
              className="w-full p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] hover:border-[#F97316]/30 transition-colors text-left min-h-[44px]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-[color:var(--text-primary)] font-medium truncate">{meeting.title}</h3>
                    <span
                      className="px-2 py-0.5 rounded-full text-[11px] font-medium shrink-0"
                      style={{
                        backgroundColor: `${STATUS_COLORS[meeting.status]}20`,
                        color: STATUS_COLORS[meeting.status],
                      }}
                    >
                      {meeting.status.replace("_", " ")}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[color:var(--text-muted)]">
                    <span>{new Date(meeting.meeting_date + t('ui.t00.00.00')).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</span>
                    <span className="text-gray-700">·</span>
                    <span>{meeting.meeting_type.replace(/_/g, " ")}</span>
                    {meeting.facilitator && (
                      <>
                        <span className="text-gray-700">·</span>
                        <span>{meeting.facilitator}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0 text-xs">
                  {(meeting.agenda_count ?? 0) > 0 && (
                    <span className="text-[color:var(--text-muted)]">{meeting.agenda_count}{t('ui.agenda')}</span>
                  )}
                  {(meeting.open_action_count ?? 0) > 0 && (
                    <span className="text-[#F97316]">{meeting.open_action_count}{t('ui.open')}</span>
                  )}
                  <ChevronRight size={16} className="text-gray-600" />
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* New Meeting Modal */}
      {showNewModal && (
        <NewMeetingModal
          projectId={projectId}
          onClose={() => setShowNewModal(false)}
          onCreated={handleMeetingCreated}
        />
      )}
    </div>
  );
}
