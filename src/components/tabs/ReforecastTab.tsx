"use client";

import { useEffect, useState, useCallback } from "react";
import {
  RefreshCw, TrendingUp, AlertTriangle, Clock, CheckCircle,
  ChevronDown, ChevronUp, Target, Zap, Download, History,
  ArrowUpRight, ArrowDownRight, Minus, Shield
} from "lucide-react";
import ProgressUpdateModal from "@/components/ProgressUpdateModal";
import type { ParsedActivity, ScheduleSnapshot } from "@/types";
import { getLanguage, t } from "@/lib/i18n";

interface Props {
  projectId: string;
}

interface ScheduleData {
  project: {
    id: string;
    name: string;
    start_date: string;
    target_finish_date: string;
  };
  forecast_finish_date: string | null;
  stats: {
    total_activities: number;
    complete_activities: number;
    in_progress_activities: number;
    critical_activities: number;
    at_risk_activities: number;
    avg_completion: number;
  };
  tasks: ParsedActivity[];
  latest_snapshot: ScheduleSnapshot | null;
}

function fmt(d?: string | null) {
  if (!d) return "—";
  return new Date(d + "T00:00:00").toLocaleDateString(getLanguage() === "es" ? "es-US" : "en-US", { month: "short", day: "numeric", year: "numeric" });
}

function fmtShort(d?: string | null) {
  if (!d) return "—";
  return new Date(d + "T00:00:00").toLocaleDateString(getLanguage() === "es" ? "es-US" : "en-US", { month: "short", day: "numeric" });
}

function deltaLabel(days: number): string {
  if (days === 0) return t('reforecast.onSchedule');
  if (days > 0) return `${days}${t('reforecast.dLate')}`;
  return `${Math.abs(days)}${t('reforecast.dAhead')}`;
}

function deltaColor(days: number): string {
  if (days > 5) return "#EF4444";
  if (days > 0) return "#EAB308";
  if (days < 0) return "#22C55E";
  return "#22C55E";
}

function severityColor(s: string) {
  switch (s) {
    case "high": return "bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/30";
    case "medium": return "bg-[#EAB308]/15 text-[#EAB308] border-[#EAB308]/30";
    case "low": return "bg-[#22C55E]/15 text-[#22C55E] border-[#22C55E]/30";
    default: return "bg-[color:var(--bg-tertiary)] text-[color:var(--text-secondary)] border-gray-700";
  }
}

export default function ReforecastTab({ projectId }: Props) {
  const [data, setData] = useState<ScheduleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showCritical, setShowCritical] = useState(true);
  const [showImpacts, setShowImpacts] = useState(true);
  const [showRecovery, setShowRecovery] = useState(true);
  const [showSnapshots, setShowSnapshots] = useState(false);
  const [snapshots, setSnapshots] = useState<ScheduleSnapshot[]>([]);
  const [selectedTask, setSelectedTask] = useState<ParsedActivity | null>(null);
  const [showProgressModal, setShowProgressModal] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/schedule/latest`);
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleRecalculate = async () => {
    setRecalculating(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/schedule/recalculate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trigger_description: "Manual reforecast from UI" }),
      });
      if (res.ok) {
        await fetchData();
      } else {
        const err = await res.json();
        alert(`Reforecast failed: ${err.error || "Unknown error"}`);
      }
    } finally {
      setRecalculating(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/schedule/export-mspdi`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        const contentType = res.headers.get("content-type");
        if (contentType?.includes("xml")) {
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `${data?.project.name || "Schedule"}_Reforecast.xml`;
          a.click();
          URL.revokeObjectURL(url);
        } else {
          const json = await res.json();
          if (json.service_required) {
            alert("MSPDI export service not configured yet. The reforecast data is saved — export will work once the service is deployed.");
          }
        }
      }
    } finally {
      setExporting(false);
    }
  };

  const fetchSnapshots = async () => {
    const res = await fetch(`/api/projects/${projectId}/schedule/snapshots?limit=10`);
    if (res.ok) setSnapshots(await res.json());
    setShowSnapshots(true);
  };

  const handleProgressUpdate = (task: ParsedActivity) => {
    setSelectedTask(task);
    setShowProgressModal(true);
  };

  const handleProgressSaved = async () => {
    setShowProgressModal(false);
    setSelectedTask(null);
    // Auto-recalculate after progress update
    await handleRecalculate();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <RefreshCw size={20} className="text-[#F97316] animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-16 text-[color:var(--text-muted)]">
        <p>{t('reforecast.noScheduleData')}</p>
      </div>
    );
  }

  const { stats, latest_snapshot: snap } = data;
  const delta = snap?.completion_delta_days ?? 0;
  const impacts = snap?.schedule_impacts || [];
  const risks = snap?.risk_flags || [];
  const recoveryActions = snap?.recovery_actions || [];

  // Critical path tasks
  const criticalTasks = (data.tasks || []).filter(
    (t: any) => t.is_critical && t.status !== "complete"
  );

  // In-progress tasks (for progress update)
  const inProgressTasks = (data.tasks || []).filter(
    (t: any) => t.status === "in_progress" || t.status === "not_started"
  );

  return (
    <div className="space-y-6">
      {/* Header + Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-[color:var(--text-primary)] font-bold text-lg flex items-center gap-2">
            <TrendingUp size={18} className="text-[#F97316]" />
            {t('reforecast.scheduleReforecast')}
          </h2>
          <p className="text-[color:var(--text-muted)] text-sm mt-0.5">
            {t('reforecast.zeroCpm')}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchSnapshots}
            className="flex items-center gap-1.5 px-3 py-2 bg-[var(--bg-tertiary)] text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] rounded-lg text-xs font-medium transition-colors"
          >
            <History size={14} />
            {t('reforecast.history')}
          </button>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-1.5 px-3 py-2 bg-[var(--bg-tertiary)] text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] rounded-lg text-xs font-medium transition-colors disabled:opacity-40"
          >
            <Download size={14} />
            {exporting ? t('reforecast.exporting') : t('reforecast.exportMspdi')}
          </button>
          <button
            onClick={handleRecalculate}
            disabled={recalculating}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#F97316] hover:bg-[#ea6c10] text-[color:var(--text-primary)] rounded-lg text-xs font-bold transition-colors disabled:opacity-60"
          >
            <RefreshCw size={14} className={recalculating ? "animate-spin" : ""} />
            {recalculating ? t('reforecast.recalculating') : t('reforecast.reforecast')}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-4">
          <div className="text-[10px] text-gray-600 uppercase tracking-wide mb-1">{t('reforecast.completion')}</div>
          <div className="text-2xl font-bold text-[color:var(--text-primary)]">{stats.avg_completion}%</div>
          <div className="mt-1.5 h-1.5 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#F97316] to-[#22C55E] rounded-full" style={{ width: `${stats.avg_completion}%` }} />
          </div>
        </div>

        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-4">
          <div className="text-[10px] text-gray-600 uppercase tracking-wide mb-1">{t('reforecast.forecastDelta')}</div>
          <div className="text-2xl font-bold flex items-center gap-1" style={{ color: deltaColor(delta) }}>
            {delta > 0 ? <ArrowUpRight size={20} /> : delta < 0 ? <ArrowDownRight size={20} /> : <Minus size={16} />}
            {deltaLabel(delta)}
          </div>
          <div className="text-[10px] text-gray-600 mt-1">
            {t('reforecast.finish')}: {fmt(data.forecast_finish_date)}
          </div>
        </div>

        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-4">
          <div className="text-[10px] text-gray-600 uppercase tracking-wide mb-1">{t('reforecast.criticalPath')}</div>
          <div className="text-2xl font-bold text-[#EF4444]">{stats.critical_activities}</div>
          <div className="text-[10px] text-gray-600 mt-1">
            {t('reforecast.ofTotalTasks')} {stats.total_activities} {t('reforecast.totalTasks')}
          </div>
        </div>

        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-4">
          <div className="text-[10px] text-gray-600 uppercase tracking-wide mb-1">{t('reforecast.atRisk')}</div>
          <div className="text-2xl font-bold" style={{ color: stats.at_risk_activities > 0 ? "#EAB308" : "#22C55E" }}>
            {stats.at_risk_activities}
          </div>
          <div className="text-[10px] text-gray-600 mt-1">
            {stats.complete_activities} {t('reforecast.complete')} / {stats.in_progress_activities} {t('reforecast.inProgressLabel')}
          </div>
        </div>
      </div>

      {/* {t('reforecast.scheduleImpacts')} */}
      {impacts.length > 0 && (
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl overflow-hidden">
          <button
            onClick={() => setShowImpacts(!showImpacts)}
            className="w-full flex items-center justify-between px-4 py-3 text-left"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle size={14} className="text-[#EAB308]" />
              <span className="text-sm font-bold text-[color:var(--text-primary)]">{t('reforecast.scheduleImpacts')}</span>
              <span className="text-[10px] bg-[#EAB308]/15 text-[#EAB308] px-2 py-0.5 rounded-full font-bold">{impacts.length}</span>
            </div>
            {showImpacts ? <ChevronUp size={14} className="text-[color:var(--text-muted)]" /> : <ChevronDown size={14} className="text-[color:var(--text-muted)]" />}
          </button>
          {showImpacts && (
            <div className="px-4 pb-4 space-y-2">
              {impacts.map((impact: any, i: number) => (
                <div key={i} className={`rounded-lg border px-3 py-2.5 ${severityColor(impact.severity)}`}>
                  <div className="text-xs font-bold">{impact.task_name}</div>
                  <div className="text-[11px] mt-0.5 opacity-80">{impact.description}</div>
                  {impact.delta_days > 0 && (
                    <div className="text-[10px] mt-1 font-semibold">+{impact.delta_days} {impact.delta_days === 1 ? t('reforecast.day') : t('reforecast.days')}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* {t('reforecast.riskFlags')} */}
      {risks.length > 0 && (
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3">
            <Shield size={14} className="text-[#EF4444]" />
            <span className="text-sm font-bold text-[color:var(--text-primary)]">{t('reforecast.riskFlags')}</span>
            <span className="text-[10px] bg-[#EF4444]/15 text-[#EF4444] px-2 py-0.5 rounded-full font-bold">{risks.length}</span>
          </div>
          <div className="px-4 pb-4 space-y-2">
            {risks.slice(0, 8).map((risk: any, i: number) => (
              <div key={i} className={`rounded-lg border px-3 py-2 ${severityColor(risk.severity)}`}>
                <div className="text-xs font-bold">{risk.task_name}</div>
                <div className="text-[11px] mt-0.5 opacity-80">{risk.description}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* {t('reforecast.recoveryActions')} */}
      {recoveryActions.length > 0 && (
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl overflow-hidden">
          <button
            onClick={() => setShowRecovery(!showRecovery)}
            className="w-full flex items-center justify-between px-4 py-3 text-left"
          >
            <div className="flex items-center gap-2">
              <Zap size={14} className="text-[#F97316]" />
              <span className="text-sm font-bold text-[color:var(--text-primary)]">{t('reforecast.recoveryActions')}</span>
              <span className="text-[10px] bg-[#F97316]/15 text-[#F97316] px-2 py-0.5 rounded-full font-bold">{recoveryActions.length}</span>
            </div>
            {showRecovery ? <ChevronUp size={14} className="text-[color:var(--text-muted)]" /> : <ChevronDown size={14} className="text-[color:var(--text-muted)]" />}
          </button>
          {showRecovery && (
            <div className="px-4 pb-4 space-y-2">
              {recoveryActions.map((action: any, i: number) => (
                <div key={i} className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg px-3 py-2.5">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold text-[#F97316] bg-[#F97316]/15 px-2 py-0.5 rounded uppercase">{action.category}</span>
                    {action.potential_days_recovered > 0 && (
                      <span className="text-[10px] text-[#22C55E] font-semibold">~{action.potential_days_recovered}d {t('reforecast.recovery')}</span>
                    )}
                  </div>
                  <div className="text-xs text-[color:var(--text-secondary)]">{action.description}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* {t('reforecast.criticalPath')} Tasks */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl overflow-hidden">
        <button
          onClick={() => setShowCritical(!showCritical)}
          className="w-full flex items-center justify-between px-4 py-3 text-left"
        >
          <div className="flex items-center gap-2">
            <Target size={14} className="text-[#EF4444]" />
            <span className="text-sm font-bold text-[color:var(--text-primary)]">{t('reforecast.criticalPath')}</span>
            <span className="text-[10px] bg-[#EF4444]/15 text-[#EF4444] px-2 py-0.5 rounded-full font-bold">{criticalTasks.length}</span>
          </div>
          {showCritical ? <ChevronUp size={14} className="text-[color:var(--text-muted)]" /> : <ChevronDown size={14} className="text-[color:var(--text-muted)]" />}
        </button>
        {showCritical && (
          <div className="px-4 pb-4 space-y-2">
            {criticalTasks.length === 0 ? (
              <div className="text-xs text-gray-600 py-3 text-center">
                {t('reforecast.noCriticalTasks')}
              </div>
            ) : (
              criticalTasks.map((task: any) => (
                <button
                  key={task.id}
                  onClick={() => handleProgressUpdate(task)}
                  className="w-full text-left bg-[var(--bg-primary)] border border-[#EF4444]/20 rounded-lg px-3 py-2.5 hover:border-[#EF4444]/40 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-[color:var(--text-primary)] leading-tight">{task.activity_name}</div>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                        {task.trade && <span className="text-[10px] text-[#F97316] font-medium">{task.trade}</span>}
                        <span className="text-[10px] text-[color:var(--text-muted)]">
                          {fmtShort(task.forecast_start || task.start_date)} → {fmtShort(task.forecast_finish || task.finish_date)}
                        </span>
                        {task.remaining_duration !== null && (
                          <span className="text-[10px] text-[color:var(--text-muted)]">{task.remaining_duration}{t('reforecast.dRemaining')}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-bold text-[#EF4444]">{task.percent_complete}%</div>
                      {task.total_float !== null && task.total_float !== undefined && (
                        <div className="text-[10px] font-semibold" style={{ color: task.total_float < 0 ? "#EF4444" : task.total_float === 0 ? "#EAB308" : "#22C55E" }}>
                          {task.total_float}{t('reforecast.dFloat')}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-1.5 h-1 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                    <div className="h-full bg-[#EF4444] rounded-full" style={{ width: `${task.percent_complete}%` }} />
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* {t('reforecast.updateProgress')} Section */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border-primary)]">
          <Clock size={14} className="text-[#3B82F6]" />
          <span className="text-sm font-bold text-[color:var(--text-primary)]">{t('reforecast.updateProgress')}</span>
          <span className="text-[10px] text-[color:var(--text-muted)] ml-auto">{t('reforecast.tapToUpdate')}</span>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {inProgressTasks.length === 0 ? (
            <div className="text-xs text-gray-600 py-6 text-center">{t('reforecast.noInProgressTasks')}</div>
          ) : (
            inProgressTasks.slice(0, 20).map((task: any) => (
              <button
                key={task.id}
                onClick={() => handleProgressUpdate(task)}
                className="w-full text-left px-4 py-2.5 border-b border-[var(--border-primary)] hover:bg-[var(--bg-tertiary)]/50 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-[color:var(--text-primary)] truncate">{task.activity_name}</div>
                    <div className="flex gap-2 mt-0.5">
                      {task.trade && <span className="text-[10px] text-[#F97316]">{task.trade}</span>}
                      <span className="text-[10px] text-[color:var(--text-muted)]">{fmtShort(task.start_date)} → {fmtShort(task.finish_date)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs font-bold ${task.status === "in_progress" ? "text-[#3B82F6]" : "text-[color:var(--text-muted)]"}`}>
                      {task.percent_complete}%
                    </span>
                    {task.is_critical && (
                      <span className="text-[9px] bg-[#EF4444]/15 text-[#EF4444] px-1.5 py-0.5 rounded font-bold">{t('reforecast.cp')}</span>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Snapshot {t('reforecast.history')} */}
      {showSnapshots && (
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-primary)]">
            <div className="flex items-center gap-2">
              <History size={14} className="text-[color:var(--text-secondary)]" />
              <span className="text-sm font-bold text-[color:var(--text-primary)]">{t('reforecast.reforecastHistory')}</span>
            </div>
            <button onClick={() => setShowSnapshots(false)} className="text-xs text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)]">{t('reforecast.close')}</button>
          </div>
          <div className="max-h-60 overflow-y-auto">
            {snapshots.length === 0 ? (
              <div className="text-xs text-gray-600 py-6 text-center">{t('reforecast.noSnapshots')}</div>
            ) : (
              snapshots.map((snap) => (
                <div key={snap.id} className="px-4 py-2.5 border-b border-[var(--border-primary)]">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-[color:var(--text-primary)]">{snap.trigger_description || "Reforecast"}</div>
                      <div className="text-[10px] text-[color:var(--text-muted)] mt-0.5">
                        {new Date(snap.created_at).toLocaleString(getLanguage() === "es" ? "es-US" : "en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold" style={{ color: deltaColor(snap.completion_delta_days) }}>
                        {deltaLabel(snap.completion_delta_days)}
                      </div>
                      <div className="text-[10px] text-[color:var(--text-muted)]">
                        {snap.critical_activities} {t('reforecast.critical')} - {snap.at_risk_activities} {t('reforecast.atRisk2')}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Progress Update Modal */}
      {showProgressModal && selectedTask && (
        <ProgressUpdateModal
          task={selectedTask}
          projectId={projectId}
          onClose={() => { setShowProgressModal(false); setSelectedTask(null); }}
          onSaved={handleProgressSaved}
        />
      )}
    </div>
  );
}
