"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Shield, Clock, RefreshCw, CheckCircle, Send } from "lucide-react";
import ActivityDrawer from "@/components/ActivityDrawer";
import ReadyCheckModal from "@/components/ReadyCheckModal";
import ReadyCheckBadge from "@/components/ReadyCheckBadge";
import type { ParsedActivity, ReadyCheck } from "@/types";
import { t } from "@/lib/i18n";

// ── Types ────────────────────────────────────────────────────────────────────

interface CriticalPathData {
  currentActivity: { id: string; activity_name: string; start_date?: string; finish_date?: string; percent_complete: number };
  nextSuccessor: { id: string; activity_name: string } | null;
  nearestMilestone: { id: string; activity_name: string; finish_date?: string } | null;
  daysUntilImpact: number | null;
  impactStatement: string;
}

interface Inspection {
  id: string;
  name: string;
  linkedTask: string | null;
  dueDate: string | null;
  daysAway: number | null;
  readiness: "On Track" | "Watch" | "At Risk";
}

interface LateTask {
  id: string;
  name: string;
  plannedFinish: string;
  daysLate: number;
  percentComplete: number;
  impactStatement: string;
}

interface PriorityData {
  summary: {
    criticalPressure: "High" | "Medium" | "Low";
    inspectionsDue7Days: number;
    lateTasks: number;
  };
  criticalPath: CriticalPathData | null;
  inspections: Inspection[];
  lateTasks: LateTask[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function readinessStyle(status: "On Track" | "Watch" | "At Risk") {
  switch (status) {
    case "On Track":
      return "bg-[#22C55E]/15 text-[#22C55E] border-[#22C55E]/30";
    case "Watch":
      return "bg-[#EAB308]/15 text-[#EAB308] border-[#EAB308]/30";
    case "At Risk":
      return "bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/30";
  }
}

function pressureStyle(pressure: "High" | "Medium" | "Low") {
  switch (pressure) {
    case "High":
      return { color: "text-[#EF4444]", bg: "bg-[#EF4444]/10" };
    case "Medium":
      return { color: "text-[#EAB308]", bg: "bg-[#EAB308]/10" };
    case "Low":
      return { color: "text-[#22C55E]", bg: "bg-[#22C55E]/10" };
  }
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ── Section: Critical Path ────────────────────────────────────────────────────

function CriticalPathSection({ data, onOpenDrawer }: { data: CriticalPathData | null; onOpenDrawer: (id: string) => void }) {
  if (!data) {
    return (
      <div className="text-center py-10">
        <CheckCircle size={28} className="mx-auto text-[#22C55E] mb-2" />
        <p className="text-[color:var(--text-primary)] font-semibold">{t('priority.noCriticalPath')}</p>
        <p className="text-gray-600 text-sm mt-1">
          {t('priority.allActivitiesHaveFloat')}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] border-l-4 border-l-[#F97316] rounded-xl p-5 space-y-4">
      {/* Current critical activity */}
      <div
        className="cursor-pointer"
        onClick={() => onOpenDrawer(data.currentActivity.id)}
      >
        <div className="text-[10px] text-gray-600 uppercase tracking-wide mb-0.5">
          {t('priority.currentCriticalActivity')}
        </div>
        <div className="text-[color:var(--text-primary)] font-bold text-sm hover:text-[#F97316] transition-colors">{data.currentActivity.activity_name}</div>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-xs text-[color:var(--text-muted)]">
            {formatDate(data.currentActivity.start_date)} → {formatDate(data.currentActivity.finish_date)}
          </span>
          <span className="text-xs text-[#F97316] font-semibold">
            {data.currentActivity.percent_complete}% complete
          </span>
        </div>
      </div>

      {/* Grid: successor + milestone + impact */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg px-3 py-2">
          <div className="text-[10px] text-gray-600 uppercase tracking-wide mb-0.5">
            {t('priority.nextCriticalSuccessor')}
          </div>
          <div className="text-xs text-gray-200 font-medium">
            {data.nextSuccessor?.activity_name ?? t('priority.noneIdentified')}
          </div>
        </div>

        <div className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg px-3 py-2">
          <div className="text-[10px] text-gray-600 uppercase tracking-wide mb-0.5">
            {t('priority.nearestCriticalMilestone')}
          </div>
          {data.nearestMilestone ? (
            <>
              <div className="text-xs text-gray-200 font-medium truncate">
                {data.nearestMilestone.activity_name}
              </div>
              <div className="text-[10px] text-[color:var(--text-muted)] mt-0.5">
                {formatDate(data.nearestMilestone.finish_date)}
              </div>
            </>
          ) : (
            <div className="text-xs text-[color:var(--text-muted)]">{t('priority.noneOnCriticalPath')}</div>
          )}
        </div>
      </div>

      {/* Days until impact */}
      {data.daysUntilImpact !== null && (
        <div className="flex items-center gap-2">
          <Clock size={13} className="text-[#F97316]" />
          <span className="text-xs text-[color:var(--text-secondary)]">
            <span className="text-[#F97316] font-bold">{data.daysUntilImpact} day{data.daysUntilImpact !== 1 ? "s" : ""}</span>
            {" "}{t('priority.untilFinishDeadline')}
          </span>
        </div>
      )}

      {/* Impact statement */}
      <div className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg px-3 py-2">
        <div className="text-[10px] text-gray-600 uppercase tracking-wide mb-0.5">{t('priority.impact')}</div>
        <div className="text-xs text-[color:var(--text-secondary)]">{data.impactStatement}</div>
      </div>
    </div>
  );
}

// ── Section: Inspections ──────────────────────────────────────────────────────

function InspectionsSection({
  items,
  onOpenDrawer,
  readyChecks,
  onReadyCheck,
}: {
  items: Inspection[];
  onOpenDrawer: (id: string) => void;
  readyChecks: ReadyCheck[];
  onReadyCheck: (id: string) => void;
}) {
  if (items.length === 0) {
    return (
      <div className="text-center py-10">
        <Shield size={28} className="mx-auto text-gray-600 mb-2" />
        <p className="text-[color:var(--text-primary)] font-semibold">{t('priority.noInspections')}</p>
        <p className="text-gray-600 text-sm mt-1">{t('priority.clearForWeek')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((insp) => (
        <div
          key={insp.id}
          onClick={() => onOpenDrawer(insp.id)}
          className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] border-l-4 border-l-[#3B82F6] rounded-xl p-5 cursor-pointer hover:bg-[#1A1A22] transition-colors"
        >
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wide ${readinessStyle(insp.readiness)}`}
                >
                  {insp.readiness}
                </span>
                {insp.daysAway !== null && (
                  <span className="text-[10px] text-gray-600">
                    {insp.daysAway === 0 ? "Today" : `${insp.daysAway}d away`}
                  </span>
                )}
              </div>
              <h4 className="text-sm font-bold text-[color:var(--text-primary)] leading-tight">{insp.name}</h4>
            </div>
            <Shield size={15} className="text-[#3B82F6] shrink-0 mt-0.5" />
          </div>

          <div className="flex items-center gap-4 text-xs text-[color:var(--text-muted)] mb-2">
            {insp.linkedTask && (
              <span>
                Linked to: <span className="text-[color:var(--text-secondary)]">{insp.linkedTask}</span>
              </span>
            )}
            <span>Due: <span className="text-[color:var(--text-secondary)]">{formatDate(insp.dueDate)}</span></span>
          </div>
          {(() => {
            const rc = readyChecks.find((r) => r.activity_id === insp.id);
            if (rc) return <ReadyCheckBadge status={rc.status} followUpCount={rc.follow_up_count} />;
            return (
              <button
                onClick={(e) => { e.stopPropagation(); onReadyCheck(insp.id); }}
                className="flex items-center gap-1 text-[10px] text-gray-600 hover:text-[#F97316] transition-colors"
              >
                <Send size={10} />
                {t('action.readyCheck')}
              </button>
            );
          })()}
        </div>
      ))}
    </div>
  );
}

// ── Section: Late Tasks ───────────────────────────────────────────────────────

function LateTasksSection({
  items,
  onOpenDrawer,
  readyChecks,
  onReadyCheck,
}: {
  items: LateTask[];
  onOpenDrawer: (id: string) => void;
  readyChecks: ReadyCheck[];
  onReadyCheck: (id: string) => void;
}) {
  if (items.length === 0) {
    return (
      <div className="text-center py-10">
        <CheckCircle size={28} className="mx-auto text-[#22C55E] mb-2" />
        <p className="text-[color:var(--text-primary)] font-semibold">{t('priority.nothingBehind')}</p>
        <p className="text-gray-600 text-sm mt-1">{t('priority.allOnTrack')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((task) => (
        <div
          key={task.id}
          onClick={() => onOpenDrawer(task.id)}
          className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] border-l-4 border-l-[#EF4444] rounded-xl p-5 cursor-pointer hover:bg-[#1A1A22] transition-colors"
        >
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wide bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/30">
                  {task.daysLate}d late
                </span>
                <span className="text-[10px] text-gray-600">{task.percentComplete}% done</span>
              </div>
              <h4 className="text-sm font-bold text-[color:var(--text-primary)] leading-tight">{task.name}</h4>
            </div>
            <Clock size={15} className="text-[#EF4444] shrink-0 mt-0.5" />
          </div>

          <div className="text-xs text-[color:var(--text-muted)] mb-3">
            Planned finish: <span className="text-[color:var(--text-secondary)]">{formatDate(task.plannedFinish)}</span>
          </div>

          <div className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg px-3 py-2 mb-2">
            <div className="text-[10px] text-gray-600 uppercase tracking-wide mb-0.5">{t('priority.impact')}</div>
            <div className="text-xs text-[color:var(--text-secondary)]">{task.impactStatement}</div>
          </div>
          {(() => {
            const rc = readyChecks.find((r) => r.activity_id === task.id);
            if (rc) return <ReadyCheckBadge status={rc.status} followUpCount={rc.follow_up_count} />;
            return (
              <button
                onClick={(e) => { e.stopPropagation(); onReadyCheck(task.id); }}
                className="flex items-center gap-1 text-[10px] text-gray-600 hover:text-[#F97316] transition-colors"
              >
                <Send size={10} />
                {t('action.readyCheck')}
              </button>
            );
          })()}
        </div>
      ))}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function PriorityTab({ projectId }: { projectId: string }) {
  const [data, setData] = useState<PriorityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [allActivities, setAllActivities] = useState<ParsedActivity[]>([]);
  const [drawerActivity, setDrawerActivity] = useState<ParsedActivity | null>(null);
  const [readyChecks, setReadyChecks] = useState<ReadyCheck[]>([]);
  const [readyCheckActivity, setReadyCheckActivity] = useState<ParsedActivity | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const clientDate = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD in local tz
    const res = await fetch(`/api/projects/${projectId}/priority?clientDate=${clientDate}`);
    if (res.ok) setData(await res.json());
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [projectId]);

  useEffect(() => {
    fetch(`/api/projects/${projectId}/activities`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setAllActivities(data))
      .catch(() => {});
  }, [projectId]);

  useEffect(() => {
    fetch(`/api/projects/${projectId}/ready-checks`)
      .then((res) => (res.ok ? res.json() : []))
      .then((d: ReadyCheck[]) => setReadyChecks(d))
      .catch(() => {});
  }, [projectId]);

  const openReadyCheck = (activityId: string) => {
    const full = allActivities.find((a) => a.id === activityId);
    if (full) setReadyCheckActivity(full);
  };

  const handleReadyCheckSent = (check: ReadyCheck) => {
    setReadyChecks((prev) => {
      const exists = prev.findIndex((rc) => rc.id === check.id);
      if (exists >= 0) {
        const updated = [...prev];
        updated[exists] = check;
        return updated;
      }
      return [check, ...prev];
    });
    setReadyCheckActivity(null);
  };

  const openDrawer = (activityId: string) => {
    const full = allActivities.find((a) => a.id === activityId);
    if (full) setDrawerActivity(full);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <RefreshCw size={22} className="text-[#F97316] animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-16">
        <AlertTriangle size={28} className="mx-auto text-[#EF4444] mb-2" />
        <p className="text-[color:var(--text-primary)] font-semibold">{t('priority.failedToLoad')}</p>
        <button
          onClick={fetchData}
          className="mt-3 px-4 py-1.5 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] text-[color:var(--text-secondary)] rounded-lg text-xs transition-colors"
        >
          {t('action.retry')}
        </button>
      </div>
    );
  }

  const { summary, criticalPath, inspections, lateTasks } = data;
  const pressStyle = pressureStyle(summary.criticalPressure);

  return (
    <div className="space-y-6">
      {/* Summary Strip */}
      <div className="grid grid-cols-3 gap-3">
        <div className={`rounded-xl p-4 ${pressStyle.bg} text-center`}>
          <div className={`text-xl font-bold ${pressStyle.color}`}>{summary.criticalPressure}</div>
          <div className="text-xs text-[color:var(--text-muted)] mt-0.5">{t('priority.criticalPressure')}</div>
        </div>
        <div className="rounded-xl p-4 bg-[#3B82F6]/10 text-center">
          <div className="text-xl font-bold text-[#3B82F6]">{summary.inspectionsDue7Days}</div>
          <div className="text-xs text-[color:var(--text-muted)] mt-0.5">{t('priority.inspectionsIn7Days')}</div>
        </div>
        <div className="rounded-xl p-4 bg-[#EF4444]/10 text-center">
          <div className="text-xl font-bold text-[#EF4444]">{summary.lateTasks}</div>
          <div className="text-xs text-[color:var(--text-muted)] mt-0.5">{t('priority.lateTasks')}</div>
        </div>
      </div>

      {/* Refresh */}
      <div className="flex justify-end">
        <button
          onClick={fetchData}
          className="p-2 rounded-lg bg-[var(--bg-tertiary)] text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] transition-colors"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Section 1: Critical Path Ahead */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle size={16} className="text-[#F97316]" />
          <h3 className="text-[color:var(--text-primary)] font-bold text-sm uppercase tracking-wide">{t('priority.criticalPathAhead')}</h3>
        </div>
        <CriticalPathSection data={criticalPath} onOpenDrawer={openDrawer} />
      </section>

      {/* Section 2: Upcoming Inspections */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Shield size={16} className="text-[#3B82F6]" />
          <h3 className="text-[color:var(--text-primary)] font-bold text-sm uppercase tracking-wide">
            {t('priority.upcomingInspections')}
            {inspections.length > 0 && (
              <span className="ml-2 text-xs text-[#3B82F6] font-semibold normal-case">
                {inspections.length} {t('priority.inNext7Days')}
              </span>
            )}
          </h3>
        </div>
        <InspectionsSection items={inspections} onOpenDrawer={openDrawer} readyChecks={readyChecks} onReadyCheck={openReadyCheck} />
      </section>

      {/* Section 3: Behind Schedule */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Clock size={16} className="text-[#EF4444]" />
          <h3 className="text-[color:var(--text-primary)] font-bold text-sm uppercase tracking-wide">
            {t('priority.behindSchedule')}
            {lateTasks.length > 0 && (
              <span className="ml-2 text-xs text-[#EF4444] font-semibold normal-case">
                {lateTasks.length} {t('priority.overdue')}
              </span>
            )}
          </h3>
        </div>
        <LateTasksSection items={lateTasks} onOpenDrawer={openDrawer} readyChecks={readyChecks} onReadyCheck={openReadyCheck} />
      </section>

      {drawerActivity && (
        <ActivityDrawer
          activity={drawerActivity}
          projectId={projectId}
          onClose={() => setDrawerActivity(null)}
          onActivityChange={(a) => setDrawerActivity(a)}
        />
      )}

      {readyCheckActivity && (
        <ReadyCheckModal
          activity={readyCheckActivity}
          projectId={projectId}
          onClose={() => setReadyCheckActivity(null)}
          onSent={handleReadyCheckSent}
        />
      )}
    </div>
  );
}
