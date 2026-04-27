"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, RefreshCw, FileCheck, AlertCircle, Clock, CheckCircle2 } from "lucide-react";
import SubmittalForm from "@/components/submittals/SubmittalForm";
import SubmittalDetail from "@/components/submittals/SubmittalDetail";
import { useTranslation } from "@/lib/i18n";

const { t } = useTranslation();

interface Contact {
  id: string;
  name: string;
  company: string | null;
  role: string;
}

interface Submittal {
  id: string;
  submittal_number: string;
  spec_section: string | null;
  title: string;
  description: string | null;
  assigned_to: string | null;
  reviewer_id: string | null;
  ball_in_court: string;
  status: string;
  required_by: string | null;
  submitted_date: string | null;
  returned_date: string | null;
  lead_time_days: number | null;
  priority: string;
  notes: string | null;
  revision_count: number;
  assigned_contact?: Contact | null;
  reviewer_contact?: Contact | null;
  created_at: string;
  updated_at: string;
}

interface Props {
  projectId: string;
}

const STATUS_LABELS: Record<string, string> = {
  not_started: "Not Started",
  in_preparation: "In Prep",
  submitted: "Submitted",
  under_review: "Under Review",
  approved: "Approved",
  approved_as_noted: "Approved as Noted",
  revise_resubmit: "Revise & Resubmit",
  rejected: "Rejected",
};

const STATUS_COLORS: Record<string, string> = {
  not_started: "bg-gray-700/60 text-[color:var(--text-secondary)]",
  in_preparation: "bg-blue-900/60 text-blue-300",
  submitted: "bg-yellow-900/60 text-yellow-300",
  under_review: "bg-purple-900/60 text-purple-300",
  approved: "bg-green-900/60 text-green-300",
  approved_as_noted: "bg-emerald-900/60 text-yellow-300",
  revise_resubmit: "bg-orange-900/60 text-orange-300",
  rejected: "bg-red-900/60 text-red-300",
};

const FILTER_OPTIONS = [
  { value: "all", label: t('ui.all.6a7208') },
  { value: "not_started", label: t('ui.not.started') },
  { value: "in_preparation", label: t('ui.in.prep') },
  { value: "submitted", label: t('ui.submitted') },
  { value: "under_review", label: t('ui.under.review') },
  { value: "approved", label: t('ui.approved.41b81e') },
  { value: "rejected", label: t('ui.rejected.27eeb7') },
];

function isOverdue(s: Submittal): boolean {
  if (!s.required_by) return false;
  if (s.status === "approved" || s.status === "approved_as_noted") return false;
  return new Date(s.required_by) < new Date();
}

export default function SubmittalsTab({ projectId }: Props) {
  const [submittals, setSubmittals] = useState<Submittal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editSubmittal, setEditSubmittal] = useState<Submittal | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);

  const fetchSubmittals = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/submittals`);
      if (res.ok) {
        const data = await res.json();
        setSubmittals(Array.isArray(data) ? data : []);
      }
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { fetchSubmittals(); }, [fetchSubmittals]);

  const total = submittals.length;
  const pendingReview = submittals.filter((s) =>
    s.status === "submitted" || s.status === "under_review"
  ).length;
  const overdue = submittals.filter(isOverdue).length;
  const approved = submittals.filter((s) =>
    s.status === "approved" || s.status === "approved_as_noted"
  ).length;

  const filtered = filter === "all"
    ? submittals
    : submittals.filter((s) => s.status === filter);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw size={24} className="text-[#F97316] animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[color:var(--text-primary)]">{t('ui.submittals')}</h2>
            <p className="text-xs text-[color:var(--text-muted)] mt-0.5">
              {total}{t('ui.submittal.1ae838')}{total !== 1 ? t('ui.s') : ""}{t('ui.on.this.project')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchSubmittals}
              className="p-2.5 rounded-lg bg-[#1F1F25] text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <RefreshCw size={15} />
            </button>
            <button
              onClick={() => { setEditSubmittal(null); setShowForm(true); }}
              className="flex items-center gap-1.5 px-3 py-2.5 bg-[#F97316] hover:bg-[#ea6c10] text-[color:var(--text-primary)] rounded-lg text-xs font-semibold transition-colors min-h-[44px]"
            >
              <Plus size={14} />
              <span className="hidden sm:inline">{t('ui.new.submittal')}</span>
            </button>
          </div>
        </div>

        {/* Summary cards */}
        {total > 0 && (
          <div className="grid grid-cols-4 gap-2">
            <div className="bg-[#121217] border border-[#1F1F25] rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-[color:var(--text-primary)]">{total}</p>
              <p className="text-xs text-[color:var(--text-muted)] mt-0.5">{t('ui.total')}</p>
            </div>
            <div className="bg-[#121217] border border-[#1F1F25] rounded-xl p-3 text-center">
              <p className={`text-xl font-bold ${pendingReview > 0 ? "text-purple-400" : "text-[color:var(--text-primary)]"}`}>{pendingReview}</p>
              <p className="text-xs text-[color:var(--text-muted)] mt-0.5">{t('status.pending')}</p>
            </div>
            <div className="bg-[#121217] border border-[#1F1F25] rounded-xl p-3 text-center">
              <p className={`text-xl font-bold ${overdue > 0 ? "text-red-400" : "text-[color:var(--text-primary)]"}`}>{overdue}</p>
              <p className="text-xs text-[color:var(--text-muted)] mt-0.5">{t('ui.overdue.07217c')}</p>
            </div>
            <div className="bg-[#121217] border border-[#1F1F25] rounded-xl p-3 text-center">
              <p className={`text-xl font-bold ${approved > 0 ? "text-green-400" : "text-[color:var(--text-primary)]"}`}>{approved}</p>
              <p className="text-xs text-[color:var(--text-muted)] mt-0.5">{t('ui.approved.41b81e')}</p>
            </div>
          </div>
        )}

        {/* Filter chips */}
        {total > 0 && (
          <div className="flex gap-2 overflow-x-auto scrollbar-none -mx-1 px-1 pb-0.5">
            {FILTER_OPTIONS.map((opt) => {
              const count = opt.value === "all"
                ? total
                : submittals.filter((s) => s.status === opt.value).length;
              if (opt.value !== "all" && count === 0) return null;
              return (
                <button
                  key={opt.value}
                  onClick={() => setFilter(opt.value)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-colors min-h-[36px] ${
                    filter === opt.value
                      ? "bg-[#F97316] text-[color:var(--text-primary)]"
                      : "bg-[#121217] border border-[#1F1F25] text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]"
                  }`}
                >
                  {opt.label}
                  <span className={`text-xs ${filter === opt.value ? "text-orange-200" : "text-gray-600"}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Empty state */}
        {total === 0 && (
          <div className="bg-[#121217] border border-[#1F1F25] rounded-xl p-10 text-center">
            <FileCheck size={36} className="mx-auto text-gray-600 mb-3" />
            <p className="text-[color:var(--text-secondary)] text-sm font-semibold mb-1">{t('ui.no.submittals.yet')}</p>
            <p className="text-gray-600 text-xs mb-5">{t('ui.tap.to.create.your.first.submittal')}
            </p>
            <button
              onClick={() => { setEditSubmittal(null); setShowForm(true); }}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#F97316] hover:bg-[#ea6c10] text-[color:var(--text-primary)] rounded-lg text-xs font-semibold transition-colors"
            >
              <Plus size={14} />{t('ui.new.submittal')}
            </button>
          </div>
        )}

        {/* Submittal list */}
        {filtered.length > 0 && (
          <div className="space-y-2">
            {filtered.map((s) => {
              const overdueSub = isOverdue(s);
              return (
                <button
                  key={s.id}
                  onClick={() => setDetailId(s.id)}
                  className="w-full text-left bg-[#121217] border border-[#1F1F25] hover:border-[#2a2a35] rounded-xl p-4 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-xs font-mono text-[color:var(--text-muted)]">{s.submittal_number}</span>
                        {s.spec_section && (
                          <span className="text-xs text-gray-600">§ {s.spec_section}</span>
                        )}
                        {s.priority !== "normal" && (
                          <span className={`text-xs font-semibold ${
                            s.priority === "critical" ? "text-red-400" :
                            s.priority === "high" ? "text-orange-400" : "text-[color:var(--text-muted)]"
                          }`}>
                            ↑ {s.priority.charAt(0).toUpperCase() + s.priority.slice(1)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-[color:var(--text-primary)] leading-tight mb-2">{s.title}</p>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[s.status] ?? "bg-gray-700 text-[color:var(--text-secondary)]"}`}>
                          {STATUS_LABELS[s.status] ?? s.status}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[#1F1F25] text-[color:var(--text-secondary)]">
                          🏀 {s.ball_in_court}
                        </span>
                        {s.revision_count > 1 && (
                          <span className="text-xs text-gray-600">{t('ui.rev')} {s.revision_count}</span>
                        )}
                      </div>
                      {(s.assigned_contact || s.reviewer_contact) && (
                        <div className="flex flex-wrap gap-3 mt-2">
                          {s.assigned_contact && (
                            <span className="text-xs text-[color:var(--text-muted)]">{t('ui.sub.3360cb')} <span className="text-[color:var(--text-secondary)]">{s.assigned_contact.name}</span>
                            </span>
                          )}
                          {s.reviewer_contact && (
                            <span className="text-xs text-[color:var(--text-muted)]">{t('ui.review')} <span className="text-[color:var(--text-secondary)]">{s.reviewer_contact.name}</span>
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      {s.required_by && (
                        <div className={`flex items-center gap-1 text-xs font-medium ${overdueSub ? "text-red-400" : "text-[color:var(--text-muted)]"}`}>
                          {overdueSub ? <AlertCircle size={12} /> : <Clock size={12} />}
                          {new Date(s.required_by + t('ui.t00.00.00')).toLocaleDateString("en-US", {
                            month: "short", day: "numeric",
                          })}
                        </div>
                      )}
                      {(s.status === "approved" || s.status === "approved_as_noted") && (
                        <CheckCircle2 size={16} className="text-green-400 mt-1 ml-auto" />
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Filtered empty */}
        {total > 0 && filtered.length === 0 && (
          <div className="text-center py-8">
            <p className="text-[color:var(--text-muted)] text-sm">{t('ui.no.submittals.match.this.filter')}</p>
          </div>
        )}
      </div>

      {/* Form modal */}
      {showForm && (
        <SubmittalForm
          projectId={projectId}
          editSubmittal={editSubmittal}
          onClose={() => { setShowForm(false); setEditSubmittal(null); }}
          onSaved={fetchSubmittals}
        />
      )}

      {/* Detail modal */}
      {detailId && (
        <SubmittalDetail
          projectId={projectId}
          submittalId={detailId}
          onClose={() => setDetailId(null)}
          onUpdated={fetchSubmittals}
          onEdit={() => {
            const s = submittals.find((x) => x.id === detailId) ?? null;
            setEditSubmittal(s);
            setDetailId(null);
            setShowForm(true);
          }}
          onDeleted={() => {
            setDetailId(null);
            fetchSubmittals();
          }}
        />
      )}
    </>
  );
}
