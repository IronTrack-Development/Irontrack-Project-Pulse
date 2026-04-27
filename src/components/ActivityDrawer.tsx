"use client";

import { useEffect, useState } from "react";
import { X, Calendar, Clock, Hash, MapPin, AlertTriangle, ChevronRight, ArrowLeft, ArrowRight, Link2, Building2, Layers, Tag, Users, FileText, Send, RefreshCw, ClipboardList } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ParsedActivity, DailyRisk, ReadyCheck } from "@/types";
import ReadyCheckModal from "@/components/ReadyCheckModal";
import ReadyCheckBadge from "@/components/ReadyCheckBadge";

function fmt(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

/** Format a snake_case normalized value: "building_f" → "Building F" */
function fmtNormalized(val?: string | null): string {
  if (!val) return "—";
  return val
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function fmtShort(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function statusStyle(status: string) {
  switch (status) {
    case "complete": return "bg-[#22C55E]/15 text-[#22C55E] border-[#22C55E]/30";
    case "in_progress": return "bg-[#3B82F6]/15 text-[#3B82F6] border-[#3B82F6]/30";
    case "late": return "bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/30";
    default: return "bg-[color:var(--bg-tertiary)] text-[color:var(--text-secondary)] border-gray-700";
  }
}

function statusLabel(status: string) {
  switch (status) {
    case "in_progress": return "In Progress";
    case "complete": return "Complete";
    case "late": return "Overdue";
    case "not_started": return "Not Started";
    default: return status;
  }
}

function statusBorderColor(status: string): string {
  switch (status) {
    case "complete": return "#22C55E";
    case "in_progress": return "#3B82F6";
    case "late": return "#EF4444";
    default: return "#374151"; // gray-700
  }
}

interface RelationshipActivity extends ParsedActivity {}

interface Props {
  activity: ParsedActivity;
  projectId: string;
  onClose: () => void;
  onActivityChange?: (activity: ParsedActivity) => void;
}

export default function ActivityDrawer({ activity, projectId, onClose, onActivityChange }: Props) {
  const router = useRouter();
  const [risks, setRisks] = useState<DailyRisk[]>([]);
  const [predecessors, setPredecessors] = useState<RelationshipActivity[]>([]);
  const [successors, setSuccessors] = useState<RelationshipActivity[]>([]);
  const [relLoading, setRelLoading] = useState(true);
  const [readyCheck, setReadyCheck] = useState<ReadyCheck | null>(null);
  const [rcLoading, setRcLoading] = useState(true);
  const [showReadyCheckModal, setShowReadyCheckModal] = useState(false);
  const [isFollowUp, setIsFollowUp] = useState(false);

  useEffect(() => {
    const fetchRisks = async () => {
      const res = await fetch(`/api/projects/${projectId}/risks`);
      if (res.ok) {
        const all: DailyRisk[] = await res.json();
        setRisks(all.filter((r) => r.activity_id === activity.id));
      }
    };
    fetchRisks();
  }, [activity.id, projectId]);

  useEffect(() => {
    setRcLoading(true);
    setReadyCheck(null);
    fetch(`/api/projects/${projectId}/ready-checks?activity_id=${activity.id}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((checks: ReadyCheck[]) => {
        setReadyCheck(checks.length > 0 ? checks[0] : null);
      })
      .catch(() => {})
      .finally(() => setRcLoading(false));
  }, [activity.id, projectId]);

  useEffect(() => {
    const fetchRelationships = async () => {
      setRelLoading(true);
      setPredecessors([]);
      setSuccessors([]);
      try {
        const res = await fetch(
          `/api/projects/${projectId}/relationships?activityId=${activity.id}`
        );
        if (res.ok) {
          const data = await res.json();
          setPredecessors(data.predecessors || []);
          setSuccessors(data.successors || []);
        }
      } finally {
        setRelLoading(false);
      }
    };
    fetchRelationships();
  }, [activity.id, projectId]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const today = new Date();
  let daysUntilFinish: number | null = null;
  if (activity.finish_date) {
    daysUntilFinish = Math.ceil(
      (new Date(activity.finish_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
  }

  const handleRelatedClick = (related: ParsedActivity) => {
    if (onActivityChange) {
      onActivityChange(related);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 animate-fade-in"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-[var(--bg-secondary)] border-l border-[var(--border-primary)] z-50 overflow-y-auto animate-slide-in">
        {/* Header */}
        <div className="sticky top-0 bg-[var(--bg-secondary)] border-b border-[var(--border-primary)] px-6 py-4 flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {activity.activity_id && (
                <span className="text-xs text-[color:var(--text-muted)] font-mono">{activity.activity_id}</span>
              )}
              {activity.milestone && (
                <span className="text-[10px] bg-[#F97316]/20 text-[#F97316] px-2 py-0.5 rounded font-bold uppercase">Milestone</span>
              )}
              <span className={`text-xs px-2 py-0.5 rounded border font-semibold ${statusStyle(activity.status)}`}>
                {statusLabel(activity.status)}
              </span>
            </div>
            <h2 className="font-bold text-[color:var(--text-primary)] text-base leading-tight">{activity.activity_name}</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] transition-colors shrink-0">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom)+80px)] md:pb-6 space-y-6">
          {/* Trade + Area */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl p-3">
              <div className="text-[10px] text-gray-600 uppercase tracking-wide mb-1">Trade</div>
              <div className="text-sm font-semibold text-[#F97316]">{activity.trade || "General"}</div>
            </div>
            {activity.area && (
              <div className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl p-3">
                <div className="flex items-center gap-1 text-[10px] text-gray-600 uppercase tracking-wide mb-1">
                  <MapPin size={9} /> Area
                </div>
                <div className="text-sm font-semibold text-[color:var(--text-primary)]">{activity.area}</div>
              </div>
            )}
          </div>

          {/* Location / WBS Hierarchy */}
          {(activity.normalized_building || activity.normalized_phase || activity.normalized_area || activity.normalized_work_type) && (
            <div>
              <div className="text-xs font-semibold text-[color:var(--text-muted)] uppercase tracking-wide mb-3">
                <MapPin size={12} className="inline mr-1.5" />
                Location
              </div>
              <div className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl p-3 space-y-2">
                {activity.normalized_building && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5 text-[color:var(--text-muted)]">
                      <Building2 size={12} /> Building
                    </span>
                    <span className="font-semibold text-[color:var(--text-primary)]">{fmtNormalized(activity.normalized_building)}</span>
                  </div>
                )}
                {activity.normalized_phase && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5 text-[color:var(--text-muted)]">
                      <Layers size={12} /> Phase
                    </span>
                    <span className="font-semibold text-[color:var(--text-primary)]">{fmtNormalized(activity.normalized_phase)}</span>
                  </div>
                )}
                {activity.normalized_area && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5 text-[color:var(--text-muted)]">
                      <MapPin size={12} /> Area
                    </span>
                    <span className="font-semibold text-[color:var(--text-primary)]">{fmtNormalized(activity.normalized_area)}</span>
                  </div>
                )}
                {activity.normalized_work_type && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5 text-[color:var(--text-muted)]">
                      <Tag size={12} /> Work Type
                    </span>
                    <span className="font-semibold text-[color:var(--text-primary)]">{fmtNormalized(activity.normalized_work_type)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Resources */}
          {activity.resource_names && (
            <div>
              <div className="text-xs font-semibold text-[color:var(--text-muted)] uppercase tracking-wide mb-2">
                <Users size={12} className="inline mr-1.5" />
                Resources
              </div>
              <div className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl px-3 py-2">
                <div className="text-sm text-[color:var(--text-secondary)]">{activity.resource_names}</div>
              </div>
            </div>
          )}

          {/* Notes */}
          {activity.notes && (
            <div>
              <div className="text-xs font-semibold text-[color:var(--text-muted)] uppercase tracking-wide mb-2">
                <FileText size={12} className="inline mr-1.5" />
                Notes
              </div>
              <div className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl px-3 py-2">
                <div className="text-xs text-[color:var(--text-secondary)] whitespace-pre-wrap leading-relaxed">{activity.notes}</div>
              </div>
            </div>
          )}

          {/* Dates */}
          <div>
            <div className="text-xs font-semibold text-[color:var(--text-muted)] uppercase tracking-wide mb-3">Schedule</div>
            <div className="space-y-2">
              {[
                { label: "Planned Start", value: activity.start_date, icon: Calendar },
                { label: "Planned Finish", value: activity.finish_date, icon: Calendar },
                { label: "Actual Start", value: activity.actual_start, icon: Calendar },
                { label: "Actual Finish", value: activity.actual_finish, icon: Calendar },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5 text-[color:var(--text-muted)]">
                    <Icon size={12} />
                    {label}
                  </span>
                  <span className={`font-medium ${value ? "text-[color:var(--text-primary)]" : "text-gray-700"}`}>
                    {fmt(value)}
                  </span>
                </div>
              ))}
              {daysUntilFinish !== null && activity.status !== "complete" && (
                <div className={`mt-2 text-xs font-semibold px-2 py-1 rounded inline-block ${
                  daysUntilFinish < 0 ? "bg-red-900/30 text-red-400" :
                  daysUntilFinish <= 3 ? "bg-yellow-900/30 text-yellow-400" :
                  "bg-[color:var(--bg-tertiary)] text-[color:var(--text-secondary)]"
                }`}>
                  {daysUntilFinish < 0 ? `${Math.abs(daysUntilFinish)} days overdue` :
                   daysUntilFinish === 0 ? "Due today" :
                   `${daysUntilFinish} days until planned finish`}
                </div>
              )}
            </div>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl p-3 text-center">
              <div className="text-lg font-bold text-[color:var(--text-primary)]">{activity.original_duration ?? "—"}</div>
              <div className="text-[10px] text-[color:var(--text-muted)]">Orig Duration</div>
            </div>
            <div className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl p-3 text-center">
              <div className="text-lg font-bold text-[color:var(--text-primary)]">{activity.remaining_duration ?? "—"}</div>
              <div className="text-[10px] text-[color:var(--text-muted)]">Remaining</div>
            </div>
            <div className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl p-3 text-center">
              <div className="text-lg font-bold text-[#3B82F6]">{activity.percent_complete}%</div>
              <div className="text-[10px] text-[color:var(--text-muted)]">Complete</div>
            </div>
          </div>

          {/* Progress bar */}
          <div>
            <div className="h-2 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#F97316] to-[#3B82F6] rounded-full transition-all"
                style={{ width: `${activity.percent_complete}%` }}
              />
            </div>
          </div>

          {/* WBS */}
          {activity.wbs && (
            <div className="flex items-center gap-2 text-sm">
              <Hash size={13} className="text-[color:var(--text-muted)]" />
              <span className="text-[color:var(--text-muted)]">WBS:</span>
              <span className="text-[color:var(--text-secondary)] font-mono">{activity.wbs}</span>
            </div>
          )}

          {/* Float */}
          {activity.float_days !== null && activity.float_days !== undefined && (
            <div className="flex items-center gap-2 text-sm">
              <Clock size={13} className="text-[color:var(--text-muted)]" />
              <span className="text-[color:var(--text-muted)]">Float:</span>
              <span className={`font-semibold ${activity.float_days <= 0 ? "text-[#EF4444]" : activity.float_days <= 5 ? "text-[#EAB308]" : "text-[#22C55E]"}`}>
                {activity.float_days} days
              </span>
            </div>
          )}

          {/* ── RELATIONSHIPS ── */}
          {relLoading ? (
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <div className="w-3 h-3 border border-gray-600 border-t-[#F97316] rounded-full animate-spin" />
              Loading relationships…
            </div>
          ) : (
            <div className="space-y-4">
              {/* Flow summary */}
              <div className="flex items-center gap-2 text-xs text-[color:var(--text-muted)]">
                <Link2 size={12} className="text-gray-600 shrink-0" />
                <span className="text-[color:var(--text-muted)]">
                  {predecessors.length} predecessor{predecessors.length !== 1 ? "s" : ""}
                </span>
                <span className="text-gray-700">→</span>
                <span className="text-[#F97316] font-semibold truncate max-w-[140px]">
                  {activity.activity_name}
                </span>
                <span className="text-gray-700">→</span>
                <span className="text-[color:var(--text-muted)]">
                  {successors.length} successor{successors.length !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Predecessors */}
              <div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[color:var(--text-muted)] uppercase tracking-wide mb-2">
                  <ArrowLeft size={12} />
                  Predecessors ({predecessors.length})
                </div>
                {predecessors.length === 0 ? (
                  <p className="text-xs text-gray-700 italic">No predecessors</p>
                ) : (
                  <div className="space-y-2">
                    {predecessors.map((pred) => (
                      <button
                        key={pred.id}
                        onClick={() => handleRelatedClick(pred)}
                        className="w-full text-left bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl p-3 hover:border-gray-600 hover:bg-[var(--bg-tertiary)]/60 transition-colors"
                        style={{ borderLeftWidth: "3px", borderLeftColor: statusBorderColor(pred.status) }}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <span className="text-sm font-semibold text-[color:var(--text-primary)] leading-tight line-clamp-2">
                            {pred.activity_name}
                          </span>
                          <span className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded border font-semibold ${statusStyle(pred.status)}`}>
                            {statusLabel(pred.status)}
                          </span>
                        </div>
                        <div className="text-[11px] text-[color:var(--text-muted)] mb-2">
                          {pred.trade && <span>{pred.trade}</span>}
                          {pred.trade && pred.finish_date && <span className="mx-1">•</span>}
                          {pred.finish_date && (
                            <span>Planned Finish: {fmtShort(pred.finish_date)}</span>
                          )}
                        </div>
                        <div className="mb-1.5">
                          <div className="h-1.5 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-[#F97316] to-[#3B82F6] rounded-full"
                              style={{ width: `${pred.percent_complete}%` }}
                            />
                          </div>
                          <div className="text-[10px] text-gray-600 mt-0.5">
                            Progress: {pred.percent_complete}%
                          </div>
                        </div>
                        {pred.float_days !== null && pred.float_days !== undefined && (
                          <div className="text-[10px] text-gray-600">
                            Float:{" "}
                            <span className={`font-semibold ${pred.float_days <= 0 ? "text-[#EF4444]" : pred.float_days <= 5 ? "text-[#EAB308]" : "text-[#22C55E]"}`}>
                              {pred.float_days} days
                            </span>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Successors */}
              <div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[color:var(--text-muted)] uppercase tracking-wide mb-2">
                  <ArrowRight size={12} />
                  Successors ({successors.length})
                </div>
                {successors.length === 0 ? (
                  <p className="text-xs text-gray-700 italic">No successors</p>
                ) : (
                  <div className="space-y-2">
                    {successors.map((succ) => (
                      <button
                        key={succ.id}
                        onClick={() => handleRelatedClick(succ)}
                        className="w-full text-left bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl p-3 hover:border-gray-600 hover:bg-[var(--bg-tertiary)]/60 transition-colors"
                        style={{ borderLeftWidth: "3px", borderLeftColor: statusBorderColor(succ.status) }}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <span className="text-sm font-semibold text-[color:var(--text-primary)] leading-tight line-clamp-2">
                            {succ.activity_name}
                          </span>
                          <span className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded border font-semibold ${statusStyle(succ.status)}`}>
                            {statusLabel(succ.status)}
                          </span>
                        </div>
                        <div className="text-[11px] text-[color:var(--text-muted)] mb-2">
                          {succ.trade && <span>{succ.trade}</span>}
                          {succ.trade && succ.start_date && <span className="mx-1">•</span>}
                          {succ.start_date && (
                            <span>Planned Start: {fmtShort(succ.start_date)}</span>
                          )}
                        </div>
                        <div className="mb-1.5">
                          <div className="h-1.5 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-[#F97316] to-[#3B82F6] rounded-full"
                              style={{ width: `${succ.percent_complete}%` }}
                            />
                          </div>
                          <div className="text-[10px] text-gray-600 mt-0.5">
                            Progress: {succ.percent_complete}%
                          </div>
                        </div>
                        {succ.float_days !== null && succ.float_days !== undefined && (
                          <div className="text-[10px] text-gray-600">
                            Float:{" "}
                            <span className={`font-semibold ${succ.float_days <= 0 ? "text-[#EF4444]" : succ.float_days <= 5 ? "text-[#EAB308]" : "text-[#22C55E]"}`}>
                              {succ.float_days} days
                            </span>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Generate Report */}
          <div>
            <div className="text-xs font-semibold text-[color:var(--text-muted)] uppercase tracking-wide mb-3">
              <ClipboardList size={12} className="inline mr-1.5 text-[#F97316]" />
              Observation
            </div>
            <button
              onClick={() => {
                onClose();
                router.push(`/projects/${projectId}/report?activity=${activity.id}`);
              }}
              className="w-full flex items-center justify-center gap-2 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] rounded-xl py-3 text-sm font-semibold transition-colors border border-[var(--border-primary)] hover:border-[#F97316]/30"
            >
              <ClipboardList size={14} className="text-[#F97316]" />
              New Observation
            </button>
          </div>

          {/* Ready Check Section */}
          <div>
            <div className="text-xs font-semibold text-[color:var(--text-muted)] uppercase tracking-wide mb-3">
              <Send size={12} className="inline mr-1.5 text-[#F97316]" />
              Ready Check
            </div>
            {rcLoading ? (
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <RefreshCw size={12} className="animate-spin" />
                Loading…
              </div>
            ) : readyCheck ? (
              <div className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl p-3 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <ReadyCheckBadge status={readyCheck.status} followUpCount={readyCheck.follow_up_count} />
                    <div className="text-xs text-[color:var(--text-muted)] mt-1.5">
                      Sent to {readyCheck.contact_name}
                      {readyCheck.contact_company ? ` · ${readyCheck.contact_company}` : ""}
                    </div>
                    {readyCheck.sent_at && (
                      <div className="text-[10px] text-gray-600 mt-0.5">
                        {new Date(readyCheck.sent_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                      </div>
                    )}
                    {readyCheck.follow_up_count > 0 && (
                      <div className="text-[10px] text-gray-600 mt-0.5">
                        {readyCheck.follow_up_count} follow-up{readyCheck.follow_up_count !== 1 ? "s" : ""} sent
                      </div>
                    )}
                  </div>
                </div>
                {readyCheck.status === "awaiting_response" && (
                  <button
                    onClick={() => { setIsFollowUp(true); setShowReadyCheckModal(true); }}
                    className="w-full flex items-center justify-center gap-2 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] rounded-lg py-2.5 text-xs font-semibold transition-colors"
                  >
                    <RefreshCw size={12} />
                    Send Follow-Up
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={() => { setIsFollowUp(false); setShowReadyCheckModal(true); }}
                className="w-full flex items-center justify-center gap-2 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] rounded-xl py-3 text-sm font-semibold transition-colors border border-[var(--border-primary)] hover:border-[#F97316]/30"
              >
                <Send size={14} className="text-[#F97316]" />
                Send Ready Check
              </button>
            )}
          </div>

          {/* Risks for this activity */}
          {risks.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-[color:var(--text-muted)] uppercase tracking-wide mb-3">
                <AlertTriangle size={12} className="inline mr-1.5 text-[#EF4444]" />
                Flagged Issues ({risks.length})
              </div>
              <div className="space-y-2">
                {risks.map((risk) => (
                  <div key={risk.id} className="bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-xl px-3 py-3">
                    <div className="text-xs font-bold text-[#EF4444] mb-1">{risk.title}</div>
                    <div className="text-xs text-[color:var(--text-secondary)]">{risk.description}</div>
                    {risk.suggested_action && (
                      <div className="flex items-start gap-1.5 mt-2">
                        <ChevronRight size={12} className="text-[#F97316] shrink-0 mt-0.5" />
                        <div className="text-xs text-[color:var(--text-secondary)]">{risk.suggested_action}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {showReadyCheckModal && (
        <ReadyCheckModal
          activity={activity}
          projectId={projectId}
          onClose={() => setShowReadyCheckModal(false)}
          existingCheck={isFollowUp && readyCheck ? readyCheck : undefined}
          onSent={(check) => {
            setReadyCheck(check);
            setShowReadyCheckModal(false);
          }}
        />
      )}
    </>
  );
}
