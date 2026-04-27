"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronDown, ChevronUp, Clock, CheckCircle2, XCircle, RotateCcw, Send, Loader2, Trash2 } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

const { t } = useTranslation();

interface Revision {
  id: string;
  revision_number: number;
  status: string;
  notes: string | null;
  changed_by: string | null;
  created_at: string;
}

interface Contact {
  id: string;
  name: string;
  company: string | null;
  role: string;
}

interface SubmittalFull {
  id: string;
  submittal_number: string;
  spec_section: string | null;
  title: string;
  description: string | null;
  ball_in_court: string;
  status: string;
  required_by: string | null;
  submitted_date: string | null;
  returned_date: string | null;
  lead_time_days: number | null;
  priority: string;
  notes: string | null;
  assigned_contact: Contact | null;
  reviewer_contact: Contact | null;
  revisions: Revision[];
}

interface Props {
  projectId: string;
  submittalId: string;
  onClose: () => void;
  onUpdated: () => void;
  onEdit: () => void;
  onDeleted: () => void;
}

function formatDate(d: string | null) {
  if (!d) return null;
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

function formatDateTime(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

const STATUS_LABELS: Record<string, string> = {
  not_started: "Not Started",
  in_preparation: "In Preparation",
  submitted: "Submitted",
  under_review: "Under Review",
  approved: "Approved",
  approved_as_noted: "Approved as Noted",
  revise_resubmit: "Revise & Resubmit",
  rejected: "Rejected",
};

const STATUS_COLORS: Record<string, string> = {
  not_started: "bg-gray-700 text-[color:var(--text-secondary)]",
  in_preparation: "bg-blue-900/60 text-blue-300",
  submitted: "bg-yellow-900/60 text-yellow-300",
  under_review: "bg-purple-900/60 text-purple-300",
  approved: "bg-green-900/60 text-green-300",
  approved_as_noted: "bg-emerald-900/60 text-yellow-300",
  revise_resubmit: "bg-orange-900/60 text-orange-300",
  rejected: "bg-red-900/60 text-red-300",
};

export default function SubmittalDetail({ projectId, submittalId, onClose, onUpdated, onEdit, onDeleted }: Props) {
  const [submittal, setSubmittal] = useState<SubmittalFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showRevisions, setShowRevisions] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const fetchDetail = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/submittals/${submittalId}`);
      if (res.ok) setSubmittal(await res.json());
    } finally {
      setLoading(false);
    }
  }, [projectId, submittalId]);

  useEffect(() => { fetchDetail(); }, [fetchDetail]);

  const doAction = async (newStatus: string, label: string) => {
    setActionLoading(newStatus);
    try {
      const res = await fetch(`/api/projects/${projectId}/submittals/${submittalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        await fetchDetail();
        onUpdated();
      }
    } finally {
      setActionLoading(null);
    }
    void label;
  };

  const handleDelete = async () => {
    if (!confirm(t('ui.delete.this.submittal.this.cannot.be.undone'))) return;
    setDeleting(true);
    const res = await fetch(`/api/projects/${projectId}/submittals/${submittalId}`, {
      method: "DELETE",
    });
    if (res.ok || res.status === 204) {
      onDeleted();
    }
    setDeleting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-[#121217] border border-[#1F1F25] rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[92dvh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-[#121217] border-b border-[#1F1F25] px-5 py-4 flex items-start justify-between z-10">
          <div className="min-w-0 flex-1 pr-3">
            {loading || !submittal ? (
              <div className="h-5 w-40 bg-[#1F1F25] rounded animate-pulse" />
            ) : (
              <>
                <p className="text-xs text-[color:var(--text-muted)] font-mono mb-0.5">{submittal.submittal_number}</p>
                <h2 className="text-base font-bold text-[color:var(--text-primary)] leading-tight">{submittal.title}</h2>
                {submittal.spec_section && (
                  <p className="text-xs text-[color:var(--text-muted)] mt-0.5">{t('ui.section')} {submittal.spec_section}</p>
                )}
              </>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] hover:bg-[#1F1F25] transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center shrink-0"
          >
            ✕
          </button>
        </div>

        {loading || !submittal ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 size={24} className="text-[#F97316] animate-spin" />
          </div>
        ) : (
          <div className="p-5 space-y-5">
            {/* Status + badges row */}
            <div className="flex flex-wrap gap-2">
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[submittal.status] ?? "bg-gray-700 text-[color:var(--text-secondary)]"}`}>
                {STATUS_LABELS[submittal.status] ?? submittal.status}
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#1F1F25] text-[color:var(--text-secondary)]">
                🏀 {submittal.ball_in_court.charAt(0).toUpperCase() + submittal.ball_in_court.slice(1)}
              </span>
              {submittal.priority !== "normal" && (
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                  submittal.priority === "critical" ? "bg-red-900/60 text-red-300" :
                  submittal.priority === "high" ? "bg-orange-900/60 text-orange-300" :
                  "bg-gray-700 text-[color:var(--text-secondary)]"
                }`}>
                  {submittal.priority.charAt(0).toUpperCase() + submittal.priority.slice(1)}
                </span>
              )}
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              {submittal.required_by && (
                <div className="bg-[#0B0B0D] rounded-xl p-3">
                  <p className="text-xs text-[color:var(--text-muted)] mb-1">{t('ui.required.by')}</p>
                  <p className={`font-medium ${
                    new Date(submittal.required_by) < new Date() && submittal.status !== "approved" && submittal.status !== "approved_as_noted"
                      ? "text-red-400" : "text-[color:var(--text-primary)]"
                  }`}>
                    {formatDate(submittal.required_by)}
                  </p>
                </div>
              )}
              {submittal.lead_time_days != null && (
                <div className="bg-[#0B0B0D] rounded-xl p-3">
                  <p className="text-xs text-[color:var(--text-muted)] mb-1">{t('ui.lead.time')}</p>
                  <p className="font-medium text-[color:var(--text-primary)]">{submittal.lead_time_days}{t('ui.days')}</p>
                </div>
              )}
              {submittal.submitted_date && (
                <div className="bg-[#0B0B0D] rounded-xl p-3">
                  <p className="text-xs text-[color:var(--text-muted)] mb-1">{t('ui.submitted')}</p>
                  <p className="font-medium text-[color:var(--text-primary)]">{formatDate(submittal.submitted_date)}</p>
                </div>
              )}
              {submittal.returned_date && (
                <div className="bg-[#0B0B0D] rounded-xl p-3">
                  <p className="text-xs text-[color:var(--text-muted)] mb-1">{t('ui.returned')}</p>
                  <p className="font-medium text-[color:var(--text-primary)]">{formatDate(submittal.returned_date)}</p>
                </div>
              )}
            </div>

            {/* Contacts */}
            {(submittal.assigned_contact || submittal.reviewer_contact) && (
              <div className="space-y-2">
                {submittal.assigned_contact && (
                  <div className="flex items-center justify-between bg-[#0B0B0D] rounded-xl px-3 py-2.5">
                    <div>
                      <p className="text-xs text-[color:var(--text-muted)]">{t('ui.preparing.sub')}</p>
                      <p className="text-sm font-medium text-[color:var(--text-primary)]">{submittal.assigned_contact.name}</p>
                      {submittal.assigned_contact.company && (
                        <p className="text-xs text-[color:var(--text-muted)]">{submittal.assigned_contact.company}</p>
                      )}
                    </div>
                  </div>
                )}
                {submittal.reviewer_contact && (
                  <div className="flex items-center justify-between bg-[#0B0B0D] rounded-xl px-3 py-2.5">
                    <div>
                      <p className="text-xs text-[color:var(--text-muted)]">{t('ui.reviewer')}</p>
                      <p className="text-sm font-medium text-[color:var(--text-primary)]">{submittal.reviewer_contact.name}</p>
                      {submittal.reviewer_contact.company && (
                        <p className="text-xs text-[color:var(--text-muted)]">{submittal.reviewer_contact.company}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Description / Notes */}
            {submittal.description && (
              <div>
                <p className="text-xs text-[color:var(--text-muted)] mb-1">{t('blocker.description')}</p>
                <p className="text-sm text-[color:var(--text-secondary)]">{submittal.description}</p>
              </div>
            )}
            {submittal.notes && (
              <div>
                <p className="text-xs text-[color:var(--text-muted)] mb-1">{t('ui.notes')}</p>
                <p className="text-sm text-[color:var(--text-secondary)]">{submittal.notes}</p>
              </div>
            )}

            {/* Quick Actions */}
            <div>
              <p className="text-xs text-[color:var(--text-muted)] mb-2 font-medium uppercase tracking-wide">{t('ui.quick.actions')}</p>
              <div className="grid grid-cols-2 gap-2">
                {submittal.status !== "submitted" && (
                  <button
                    onClick={() => doAction("submitted", "Submitted")}
                    disabled={!!actionLoading}
                    className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-yellow-900/40 border border-yellow-800/40 text-yellow-300 text-xs font-semibold transition-colors hover:bg-yellow-900/60 min-h-[44px] disabled:opacity-50"
                  >
                    {actionLoading === "submitted" ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}{t('ui.mark.submitted')}
                  </button>
                )}
                {submittal.status !== "under_review" && (
                  <button
                    onClick={() => doAction("under_review", "Under Review")}
                    disabled={!!actionLoading}
                    className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-purple-900/40 border border-purple-800/40 text-purple-300 text-xs font-semibold transition-colors hover:bg-purple-900/60 min-h-[44px] disabled:opacity-50"
                  >
                    {actionLoading === "under_review" ? <Loader2 size={14} className="animate-spin" /> : <Clock size={14} />}{t('ui.under.review')}
                  </button>
                )}
                {submittal.status !== "approved" && (
                  <button
                    onClick={() => doAction("approved", "Approved")}
                    disabled={!!actionLoading}
                    className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-900/40 border border-green-800/40 text-green-300 text-xs font-semibold transition-colors hover:bg-green-900/60 min-h-[44px] disabled:opacity-50"
                  >
                    {actionLoading === "approved" ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}{t('ui.approve')}
                  </button>
                )}
                {submittal.status !== "revise_resubmit" && (
                  <button
                    onClick={() => doAction("revise_resubmit", "Revise & Resubmit")}
                    disabled={!!actionLoading}
                    className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-orange-900/40 border border-orange-800/40 text-orange-300 text-xs font-semibold transition-colors hover:bg-orange-900/60 min-h-[44px] disabled:opacity-50"
                  >
                    {actionLoading === "revise_resubmit" ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}{t('ui.revise.and.resubmit')}
                  </button>
                )}
                {submittal.status !== "rejected" && (
                  <button
                    onClick={() => doAction("rejected", "Rejected")}
                    disabled={!!actionLoading}
                    className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-900/40 border border-red-800/40 text-red-300 text-xs font-semibold transition-colors hover:bg-red-900/60 min-h-[44px] disabled:opacity-50"
                  >
                    {actionLoading === "rejected" ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}{t('ui.reject')}
                  </button>
                )}
              </div>
            </div>

            {/* Revision History */}
            {submittal.revisions.length > 0 && (
              <div>
                <button
                  onClick={() => setShowRevisions((v) => !v)}
                  className="flex items-center gap-2 w-full text-left text-xs text-[color:var(--text-muted)] font-medium uppercase tracking-wide mb-2 hover:text-[color:var(--text-secondary)] transition-colors"
                >{t('ui.revision.history')}{submittal.revisions.length})
                  {showRevisions ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                {showRevisions && (
                  <div className="space-y-2">
                    {submittal.revisions.slice().reverse().map((rev) => (
                      <div key={rev.id} className="flex gap-3 bg-[#0B0B0D] rounded-xl px-3 py-2.5">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-[color:var(--text-muted)] font-mono">{t('ui.rev')} {rev.revision_number}</span>
                            <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[rev.status] ?? "bg-gray-700 text-[color:var(--text-secondary)]"}`}>
                              {STATUS_LABELS[rev.status] ?? rev.status}
                            </span>
                          </div>
                          {rev.notes && <p className="text-xs text-[color:var(--text-secondary)] mt-1">{rev.notes}</p>}
                          <p className="text-xs text-gray-600 mt-0.5">{formatDateTime(rev.created_at)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Edit + Delete */}
            <div className="flex gap-3 pt-1 border-t border-[#1F1F25]">
              <button
                onClick={onEdit}
                className="flex-1 py-3 rounded-xl bg-[#1F1F25] text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] text-sm font-medium transition-colors min-h-[44px]"
              >{t('action.edit')}
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-3 rounded-xl bg-red-900/30 border border-red-900/40 text-red-400 hover:bg-red-900/50 text-sm font-medium transition-colors min-h-[44px] flex items-center gap-2 disabled:opacity-50"
              >
                {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}{t('action.delete')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
