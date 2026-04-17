"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  CalendarDays,
  Loader2,
  XCircle,
  ChevronDown,
  ChevronRight,
  Users,
  Timer,
  Send,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PastReport {
  id: string;
  report_date: string;
  submitted_by: string;
  manpower_count: number | null;
  total_hours: number | null;
  delay_reasons: string[];
  notes: string | null;
  worked_on_activities: Array<{ activity_id: string; status: string }>;
  submitted_at: string;
}

interface Activity {
  id: string;
  activity_id?: string;
  activity_name: string;
  start_date?: string;
  finish_date?: string;
  percent_complete: number;
  trade?: string;
  status: string;
  milestone?: boolean;
  float_days?: number;
}

interface DependencyEntry {
  your_activity: {
    id: string;
    activity_id?: string;
    activity_name: string;
    start_date?: string;
    trade?: string;
  };
  predecessor: {
    id: string;
    activity_id?: string;
    activity_name: string;
    finish_date?: string;
    trade?: string;
    status: string;
  };
}

interface ViewData {
  view_id: string | null;
  project: {
    id: string;
    name: string;
    location?: string;
    schedule_updated_at?: string;
  };
  sub: {
    id: string;
    name: string;
    trades: string[];
  };
  stats: {
    total_tasks: number;
    this_week: number;
    overdue: number;
    pct_complete: number;
  };
  activities: {
    today: Activity[];
    this_week: Activity[];
    next_two_weeks: Activity[];
    overdue: Activity[];
    complete: Activity[];
    upcoming: Activity[];
  };
  dependencies: DependencyEntry[];
  generated_at: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr?: string): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatDateShort(dateStr?: string): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function statusChip(status: string, pct: number) {
  if (status === "complete" || pct >= 100) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-900/40 text-green-400 border border-green-700/40">
        <CheckCircle2 size={11} /> Complete
      </span>
    );
  }
  if (status === "late") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-900/40 text-red-400 border border-red-700/40">
        <AlertTriangle size={11} /> Late
      </span>
    );
  }
  if (status === "in_progress") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-900/40 text-orange-400 border border-orange-700/40">
        <Clock size={11} /> In Progress
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-[#1F1F25] text-gray-400 border border-[#2a2a33]">
      On Track
    </span>
  );
}

function groupByDay(activities: Activity[]): Record<string, Activity[]> {
  const groups: Record<string, Activity[]> = {};
  for (const act of activities) {
    const day = act.start_date ?? "Unknown";
    if (!groups[day]) groups[day] = [];
    groups[day].push(act);
  }
  return groups;
}

// ─── Activity Card ─────────────────────────────────────────────────────────────

function ActivityCard({ activity }: { activity: Activity }) {
  const pct = activity.percent_complete ?? 0;
  return (
    <div className="bg-[#13131A] border border-[#1F1F25] rounded-xl p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-gray-100 leading-snug">{activity.activity_name}</p>
        {statusChip(activity.status, pct)}
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
        {activity.start_date && (
          <span>Start: <span className="text-gray-300">{formatDate(activity.start_date)}</span></span>
        )}
        {activity.finish_date && (
          <span>Finish: <span className="text-gray-300">{formatDate(activity.finish_date)}</span></span>
        )}
        {activity.trade && (
          <span>Trade: <span className="text-gray-300">{activity.trade}</span></span>
        )}
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-gray-500">
          <span>Progress</span>
          <span className="text-gray-300">{pct}%</span>
        </div>
        <div className="h-1.5 bg-[#1F1F25] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-[#F97316] transition-all"
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  accent = false,
  danger = false,
}: {
  label: string;
  value: string | number;
  accent?: boolean;
  danger?: boolean;
}) {
  return (
    <div className="bg-[#13131A] border border-[#1F1F25] rounded-xl p-3 flex flex-col items-center text-center">
      <span
        className={`text-2xl font-bold ${
          danger ? "text-red-400" : accent ? "text-[#F97316]" : "text-gray-100"
        }`}
      >
        {value}
      </span>
      <span className="text-xs text-gray-500 mt-0.5">{label}</span>
    </div>
  );
}

// ─── Empty State ───────────────────────────────────────────────────────────────

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-12 text-gray-600">
      <CalendarDays size={32} className="mx-auto mb-3 opacity-40" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

// ─── My Full Scope Tab ────────────────────────────────────────────────────────

function FullScopeTab({ activities }: { activities: ViewData["activities"] }) {
  const [completeExpanded, setCompleteExpanded] = useState(false);

  // Gather all activities into status groups
  const allActivities = [
    ...activities.overdue,
    ...activities.today,
    ...activities.this_week,
    ...activities.next_two_weeks,
    ...activities.upcoming,
    ...activities.complete,
  ];

  // Deduplicate by id
  const seen = new Set<string>();
  const deduped: Activity[] = [];
  for (const act of allActivities) {
    if (!seen.has(act.id)) {
      seen.add(act.id);
      deduped.push(act);
    }
  }

  const overdue = deduped.filter(
    (a) => a.status === "late" || (a.finish_date && new Date(a.finish_date + "T12:00:00") < new Date() && a.percent_complete < 100 && a.status !== "complete")
  );
  const inProgress = deduped.filter(
    (a) => a.status === "in_progress" && !overdue.find((o) => o.id === a.id)
  );
  const complete = deduped.filter(
    (a) => a.status === "complete" || a.percent_complete >= 100
  );
  const notStarted = deduped.filter(
    (a) =>
      !overdue.find((o) => o.id === a.id) &&
      !inProgress.find((ip) => ip.id === a.id) &&
      !complete.find((c) => c.id === a.id)
  );

  const total = deduped.length;

  return (
    <div className="space-y-4">
      {/* Total badge */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400">
          <span className="text-white font-semibold">{total}</span> tasks assigned to your scope
        </p>
      </div>

      {/* Overdue */}
      {overdue.length > 0 && (
        <ScopeGroup
          label="Overdue"
          count={overdue.length}
          accentClass="text-red-400"
          borderClass="border-red-800/40"
          bgClass="bg-red-950/20"
          iconNode={<AlertTriangle size={14} className="text-red-400" />}
          activities={overdue}
          defaultOpen
        />
      )}

      {/* In Progress */}
      {inProgress.length > 0 && (
        <ScopeGroup
          label="In Progress"
          count={inProgress.length}
          accentClass="text-orange-400"
          borderClass="border-orange-800/40"
          bgClass="bg-orange-950/20"
          iconNode={<Clock size={14} className="text-orange-400" />}
          activities={inProgress}
          defaultOpen
        />
      )}

      {/* Not Started */}
      {notStarted.length > 0 && (
        <ScopeGroup
          label="Not Started"
          count={notStarted.length}
          accentClass="text-gray-300"
          borderClass="border-[#1F1F25]"
          bgClass="bg-[#13131A]"
          iconNode={<ChevronRight size={14} className="text-gray-500" />}
          activities={notStarted}
          defaultOpen
        />
      )}

      {/* Complete — collapsed by default */}
      {complete.length > 0 && (
        <ScopeGroup
          label="Complete"
          count={complete.length}
          accentClass="text-green-400"
          borderClass="border-green-800/40"
          bgClass="bg-green-950/20"
          iconNode={<CheckCircle2 size={14} className="text-green-400" />}
          activities={complete}
          defaultOpen={false}
          forceOpen={completeExpanded}
          onToggle={() => setCompleteExpanded((v) => !v)}
        />
      )}

      {total === 0 && (
        <EmptyState message="No activities assigned to your scope yet." />
      )}
    </div>
  );
}

function ScopeGroup({
  label,
  count,
  accentClass,
  borderClass,
  bgClass,
  iconNode,
  activities,
  defaultOpen,
  forceOpen,
  onToggle,
}: {
  label: string;
  count: number;
  accentClass: string;
  borderClass: string;
  bgClass: string;
  iconNode: React.ReactNode;
  activities: Activity[];
  defaultOpen: boolean;
  forceOpen?: boolean;
  onToggle?: () => void;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const isOpen = forceOpen !== undefined ? forceOpen : open;

  function toggle() {
    if (onToggle) {
      onToggle();
    } else {
      setOpen((v) => !v);
    }
  }

  return (
    <div className={`border ${borderClass} rounded-xl overflow-hidden`}>
      <button
        onClick={toggle}
        className={`w-full flex items-center justify-between px-4 py-3 ${bgClass}`}
      >
        <div className="flex items-center gap-2">
          {iconNode}
          <span className={`text-sm font-semibold ${accentClass}`}>
            {label}
          </span>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full bg-black/20 ${accentClass}`}>
            {count}
          </span>
        </div>
        <ChevronDown
          size={16}
          className={`text-gray-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="p-3 space-y-2 bg-[#0B0B0D]">
          {activities.map((act) => (
            <ActivityCard key={act.id} activity={act} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Progress Report Tab ──────────────────────────────────────────────────────

type ActivityStatusChoice = "0" | "25" | "50" | "75" | "100";

interface ReportState {
  selectedActivityIds: Set<string>;
  activityStatuses: Record<string, ActivityStatusChoice>;
  manpowerCount: number;
  totalHours: number;
  delayReasons: Set<string>;
  notes: string;
  submittedBy: string;
}

const DELAY_CHIPS = [
  "Weather",
  "Material Delay",
  "Waiting on Other Trade",
  "Inspection Hold",
  "Equipment",
  "Design Issue",
  "None",
];

// ─── Past Reports Section ────────────────────────────────────────────────────

function PastReportsSection({ reports }: { reports: PastReport[] }) {
  const [open, setOpen] = useState(false);

  if (reports.length === 0) return null;

  return (
    <div className="border border-[#1F1F25] rounded-xl overflow-hidden">
      {/* Collapsible header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-[#13131A]"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-200">
            📋 Past Reports
          </span>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[#1F1F25] text-gray-400">
            {reports.length}
          </span>
        </div>
        <ChevronDown
          size={16}
          className={`text-gray-500 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="divide-y divide-[#1F1F25] bg-[#0B0B0D]">
          {reports.map((report) => (
            <div key={report.id} className="p-4 space-y-2">
              {/* Date + submitted by */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-100">
                  {formatDate(report.report_date)}
                </span>
                <span className="text-xs text-gray-500">
                  by {report.submitted_by}
                </span>
              </div>

              {/* Manpower + hours */}
              <div className="flex gap-4 text-xs text-gray-400">
                {report.manpower_count != null && (
                  <span className="flex items-center gap-1">
                    <Users size={11} className="text-[#F97316]" />
                    {report.manpower_count} workers
                  </span>
                )}
                {report.total_hours != null && (
                  <span className="flex items-center gap-1">
                    <Timer size={11} className="text-[#F97316]" />
                    {report.total_hours}h total
                  </span>
                )}
              </div>

              {/* Delay chips */}
              {report.delay_reasons.length > 0 && !report.delay_reasons.includes("None") && (
                <div className="flex flex-wrap gap-1.5">
                  {report.delay_reasons.map((d) => (
                    <span
                      key={d}
                      className="text-xs px-2 py-0.5 rounded-full bg-red-900/30 border border-red-700/30 text-red-400"
                    >
                      {d}
                    </span>
                  ))}
                </div>
              )}

              {/* Task progress list */}
              {report.worked_on_activities.length > 0 && (
                <div className="space-y-1">
                  {report.worked_on_activities.map((task, i) => {
                    const pct = parseInt(task.status, 10);
                    const displayPct = isNaN(pct) ? task.status : `${pct}%`;
                    return (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 truncate pr-2 flex-1">
                          Task
                        </span>
                        <span className="text-gray-300 flex-shrink-0">{displayPct}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Notes */}
              {report.notes && (
                <p className="text-xs text-gray-500 italic">“{report.notes}”</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Progress Report Tab ────────────────────────────────────────────────────

function ProgressReportTab({
  activities,
  token,
  ackName,
  pastReports,
}: {
  activities: ViewData["activities"];
  token: string;
  ackName: string;
  pastReports: PastReport[];
}) {
  // All non-complete activities are available to report on
  const allActivities = [
    ...activities.overdue,
    ...activities.today,
    ...activities.this_week,
    ...activities.next_two_weeks,
    ...activities.upcoming,
  ];
  const seen = new Set<string>();
  const reportableActivities: Activity[] = [];
  for (const act of allActivities) {
    if (!seen.has(act.id) && act.status !== "complete" && act.percent_complete < 100) {
      seen.add(act.id);
      reportableActivities.push(act);
    }
  }

  const [report, setReport] = useState<ReportState>({
    selectedActivityIds: new Set(),
    activityStatuses: {},
    manpowerCount: 1,
    totalHours: 8,
    delayReasons: new Set(),
    notes: "",
    submittedBy: ackName,
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitResult, setSubmitResult] = useState<{
    submitted_at: string;
  } | null>(null);

  function toggleActivity(id: string) {
    setReport((prev) => {
      const next = new Set(prev.selectedActivityIds);
      if (next.has(id)) {
        next.delete(id);
        const statuses = { ...prev.activityStatuses };
        delete statuses[id];
        return { ...prev, selectedActivityIds: next, activityStatuses: statuses };
      } else {
        next.add(id);
        return {
          ...prev,
          selectedActivityIds: next,
          activityStatuses: { ...prev.activityStatuses, [id]: "in_progress" },
        };
      }
    });
  }

  function setActivityStatus(id: string, status: ActivityStatusChoice) {
    setReport((prev) => ({
      ...prev,
      activityStatuses: { ...prev.activityStatuses, [id]: status },
    }));
  }

  function setManpower(val: number) {
    setReport((prev) => ({
      ...prev,
      manpowerCount: val,
      totalHours: val * 8,
    }));
  }

  function toggleDelay(chip: string) {
    setReport((prev) => {
      const next = new Set(prev.delayReasons);
      if (chip === "None") {
        // None clears everything else
        return { ...prev, delayReasons: new Set(["None"]) };
      }
      // Selecting something real clears "None"
      next.delete("None");
      if (next.has(chip)) {
        next.delete(chip);
      } else {
        next.add(chip);
      }
      return { ...prev, delayReasons: next };
    });
  }

  async function handleSubmit() {
    if (!report.submittedBy.trim()) return;
    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch(`/api/view/${token}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          worked_on_activity_ids: Array.from(report.selectedActivityIds),
          activity_statuses: report.activityStatuses,
          manpower_count: report.manpowerCount,
          total_hours: report.totalHours,
          delay_reasons: Array.from(report.delayReasons),
          notes: report.notes,
          submitted_by: report.submittedBy.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setSubmitError(json.error ?? "Failed to submit report");
        return;
      }
      setSubmitResult({ submitted_at: json.submitted_at ?? new Date().toISOString() });
    } catch {
      setSubmitError("Network error — please try again");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Success state
  if (submitResult) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-green-900/30 border border-green-700/40 flex items-center justify-center">
          <CheckCircle2 size={32} className="text-green-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">Report Submitted</h2>
          <p className="text-sm text-gray-400 mt-1">
            {new Date(submitResult.submitted_at).toLocaleString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </p>
        </div>
        <p className="text-xs text-gray-600 max-w-xs">
          Your foreman report has been recorded. The GC can view it in their IronTrack dashboard.
        </p>
        <button
          onClick={() => setSubmitResult(null)}
          className="mt-4 text-sm text-[#F97316] underline underline-offset-2"
        >
          Submit another report
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8">
      {/* Past Reports — above the form */}
      <PastReportsSection reports={pastReports} />

      {/* Beta banner */}
      <div className="bg-[#1A1620] border border-purple-800/30 rounded-xl px-4 py-3 flex items-center gap-3">
        <span className="text-base">📊</span>
        <p className="text-xs text-purple-300 leading-snug">
          <span className="font-semibold">Progress Reports — Free during beta.</span>{" "}
          Coming soon: $10/month for your whole team.
        </p>
      </div>

      {/* Section 1: What did you work on today? */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-200">
          What did you work on today?
        </h3>
        <p className="text-xs text-gray-500">Tap to select tasks you worked on</p>

        {reportableActivities.length === 0 ? (
          <p className="text-xs text-gray-600 py-4 text-center">
            No active tasks in your scope right now.
          </p>
        ) : (
          <div className="space-y-2">
            {reportableActivities.map((act) => {
              const selected = report.selectedActivityIds.has(act.id);
              return (
                <div key={act.id} className="space-y-2">
                  {/* Tappable task card */}
                  <button
                    onClick={() => toggleActivity(act.id)}
                    className={`w-full text-left rounded-xl p-4 border transition-all ${
                      selected
                        ? "bg-[#F97316]/10 border-[#F97316]/50"
                        : "bg-[#13131A] border-[#1F1F25]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm text-gray-100 leading-snug flex-1">
                        {act.activity_name}
                      </p>
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                          selected
                            ? "bg-[#F97316] border-[#F97316]"
                            : "border-[#3a3a45] bg-transparent"
                        }`}
                      >
                        {selected && <CheckCircle2 size={12} className="text-white" />}
                      </div>
                    </div>
                    {act.finish_date && (
                      <p className="text-xs text-gray-500 mt-1">
                        Due: {formatDate(act.finish_date)}
                      </p>
                    )}
                  </button>

                  {/* Status buttons (only show when selected) */}
                  {selected && (
                    <div className="flex gap-1.5 px-1">
                      {(
                        [
                          { key: "0", label: "0%" },
                          { key: "25", label: "25%" },
                          { key: "50", label: "50%" },
                          { key: "75", label: "75%" },
                          { key: "100", label: "100%" },
                        ] as { key: ActivityStatusChoice; label: string }[]
                      ).map(({ key, label }) => {
                        const active = report.activityStatuses[act.id] === key;
                        return (
                          <button
                            key={key}
                            onClick={() => setActivityStatus(act.id, key)}
                            className={`flex-1 py-2.5 px-1 rounded-lg text-xs font-bold border transition-colors ${
                              active
                                ? key === "100"
                                  ? "bg-green-800/40 border-green-600/50 text-green-300"
                                  : key === "75"
                                  ? "bg-emerald-800/40 border-emerald-600/50 text-emerald-300"
                                  : key === "50"
                                  ? "bg-orange-800/40 border-orange-600/50 text-orange-300"
                                  : key === "25"
                                  ? "bg-blue-800/40 border-blue-600/50 text-blue-300"
                                  : "bg-[#1F1F25] border-[#2a2a35] text-gray-300"
                                : "bg-[#0B0B0D] border-[#1F1F25] text-gray-500"
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-[#1F1F25]" />

      {/* Section 2: Manpower */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
          <Users size={15} className="text-[#F97316]" />
          Manpower
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs text-gray-500">Workers on site today</label>
            <input
              type="number"
              min={0}
              max={999}
              value={report.manpowerCount}
              onChange={(e) => setManpower(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full bg-[#13131A] border border-[#1F1F25] rounded-xl px-4 py-3 text-white text-base font-semibold text-center focus:outline-none focus:border-[#F97316] focus:ring-1 focus:ring-[#F97316]/30 transition"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-gray-500 flex items-center gap-1">
              <Timer size={11} /> Total hours worked
            </label>
            <input
              type="number"
              min={0}
              max={9999}
              step={0.5}
              value={report.totalHours}
              onChange={(e) =>
                setReport((prev) => ({
                  ...prev,
                  totalHours: Math.max(0, parseFloat(e.target.value) || 0),
                }))
              }
              className="w-full bg-[#13131A] border border-[#1F1F25] rounded-xl px-4 py-3 text-white text-base font-semibold text-center focus:outline-none focus:border-[#F97316] focus:ring-1 focus:ring-[#F97316]/30 transition"
            />
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-[#1F1F25]" />

      {/* Section 3: Delays / Issues */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-200">Delays / Issues</h3>
          <span className="text-xs text-gray-600">Optional</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {DELAY_CHIPS.map((chip) => {
            const active = report.delayReasons.has(chip);
            return (
              <button
                key={chip}
                onClick={() => toggleDelay(chip)}
                className={`px-3 py-2 rounded-full text-xs font-medium border transition-colors ${
                  active
                    ? chip === "None"
                      ? "bg-gray-700 border-gray-500 text-gray-100"
                      : "bg-red-900/40 border-red-600/50 text-red-300"
                    : "bg-[#13131A] border-[#1F1F25] text-gray-400"
                }`}
              >
                {chip}
              </button>
            );
          })}
        </div>
        <textarea
          value={report.notes}
          onChange={(e) => setReport((prev) => ({ ...prev, notes: e.target.value }))}
          placeholder="Additional notes… (optional)"
          rows={3}
          className="w-full bg-[#13131A] border border-[#1F1F25] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#F97316] focus:ring-1 focus:ring-[#F97316]/30 transition resize-none"
        />
      </div>

      {/* Divider */}
      <div className="border-t border-[#1F1F25]" />

      {/* Section 4: Submit */}
      <div className="space-y-3">
        {/* Name confirm */}
        <div className="space-y-1.5">
          <label className="text-xs text-gray-500">Submitted by</label>
          <input
            type="text"
            value={report.submittedBy}
            onChange={(e) => setReport((prev) => ({ ...prev, submittedBy: e.target.value }))}
            placeholder="Your name"
            className="w-full bg-[#13131A] border border-[#1F1F25] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#F97316] focus:ring-1 focus:ring-[#F97316]/30 transition"
          />
        </div>

        {submitError && (
          <p className="text-xs text-red-400 text-center">{submitError}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={submitting || !report.submittedBy.trim()}
          className="w-full bg-[#F97316] hover:bg-[#ea6c0f] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold px-4 py-4 rounded-2xl text-base transition-colors flex items-center justify-center gap-2 shadow-lg shadow-orange-900/30"
        >
          {submitting ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <>
              <Send size={18} />
              Submit Daily Report
            </>
          )}
        </button>

        <p className="text-xs text-gray-600 text-center">
          One report per day. Submitting again today will update your previous report.
        </p>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type TabKey = "today" | "full_scope" | "this_week" | "next_two_weeks" | "progress_report";

export default function SubScheduleViewPage() {
  const { token } = useParams<{ token: string }>();

  const [data, setData] = useState<ViewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<TabKey>("today");

  // Past reports state — fetched once after schedule loads
  const [pastReports, setPastReports] = useState<PastReport[]>([]);

  // Acknowledge flow state — gate-first: sub must ack before seeing schedule
  const [ackName, setAckName] = useState("");
  const [ackSubmitting, setAckSubmitting] = useState(false);
  const [ackDone, setAckDone] = useState(false);
  const [ackTimestamp, setAckTimestamp] = useState<string | null>(null);
  const [ackError, setAckError] = useState<string | null>(null);
  const [showGate, setShowGate] = useState(true);

  // Fetch schedule data
  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/view/${token}`);
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json.error ?? "Failed to load schedule");
        return;
      }
      const json: ViewData = await res.json();
      setData(json);
    } catch {
      setError("Network error — please try again");
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Fetch past reports (best-effort, non-blocking)
  const fetchPastReports = useCallback(async () => {
    try {
      const res = await fetch(`/api/view/${token}/reports`);
      if (res.ok) {
        const json: PastReport[] = await res.json();
        setPastReports(Array.isArray(json) ? json : []);
      }
    } catch {
      // Silently ignore — past reports are non-critical
    }
  }, [token]);

  useEffect(() => {
    fetchData();
    fetchPastReports();
  }, [fetchData, fetchPastReports]);

  // Acknowledge handler
  async function handleAcknowledge() {
    if (!ackName.trim() || !data) return;
    setAckSubmitting(true);
    setAckError(null);
    try {
      const res = await fetch(`/api/view/${token}/acknowledge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          view_id: data.view_id,
          acknowledged_by: ackName.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setAckError(json.error ?? "Failed to acknowledge");
        return;
      }
      setAckDone(true);
      setShowGate(false);
      setAckTimestamp(json.acknowledged_at ?? new Date().toISOString());
    } catch {
      setAckError("Network error — please try again");
    } finally {
      setAckSubmitting(false);
    }
  }

  // ── Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0B0D] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <Loader2 className="animate-spin text-[#F97316]" size={32} />
          <p className="text-sm">Loading your schedule…</p>
        </div>
      </div>
    );
  }

  // ── Error state
  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#0B0B0D] flex items-center justify-center px-4">
        <div className="text-center space-y-3 max-w-sm">
          <XCircle className="text-red-500 mx-auto" size={40} />
          <h1 className="text-lg font-semibold text-gray-100">Schedule Unavailable</h1>
          <p className="text-sm text-gray-400">{error ?? "This link is invalid or has expired."}</p>
          <p className="text-xs text-gray-600">Contact your general contractor for an updated link.</p>
        </div>
      </div>
    );
  }

  const { project, sub, stats, activities } = data;

  const tabs: { key: TabKey; label: string; count?: number }[] = [
    {
      key: "today",
      label: "Today",
      count: activities.today.length + activities.overdue.length,
    },
    {
      key: "full_scope",
      label: "My Full Scope",
      count: stats.total_tasks,
    },
    {
      key: "this_week",
      label: "This Week",
      count: activities.this_week.length,
    },
    {
      key: "next_two_weeks",
      label: "Next 2 Weeks",
      count: activities.next_two_weeks.length,
    },
    {
      key: "progress_report",
      label: "Progress Report",
    },
  ];

  // Gate screen: must acknowledge before viewing schedule
  if (showGate && !ackDone) {
    return (
      <div className="min-h-screen bg-[#0B0B0D] flex items-center justify-center px-4">
        <div className="w-full max-w-sm space-y-6">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-[#F97316] flex items-center justify-center">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <span className="text-sm font-semibold text-gray-400 tracking-wide uppercase">IronTrack Pulse</span>
          </div>

          {/* Project info */}
          <div className="text-center space-y-1">
            <h1 className="text-xl font-bold text-white">{project.name}</h1>
            <p className="text-[#F97316] font-medium">{sub.name}</p>
            <p className="text-xs text-gray-500">{sub.trades.join(", ")}</p>
          </div>

          {/* Acknowledge card */}
          <div className="bg-[#121217] border border-[#1F1F25] rounded-2xl p-6 space-y-4">
            <div className="text-center">
              <CalendarDays size={28} className="mx-auto text-[#F97316] mb-2" />
              <p className="text-sm text-gray-300 leading-relaxed">
                You&apos;ve been shared a filtered schedule view for your trades on this project.
              </p>
            </div>

            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">Your full name</label>
              <input
                type="text"
                value={ackName}
                onChange={(e) => setAckName(e.target.value)}
                placeholder="e.g., Joe Martinez"
                className="w-full bg-[#0B0B0D] border border-[#1F1F25] rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-[#F97316] focus:ring-1 focus:ring-[#F97316]/30 transition"
                onKeyDown={(e) => { if (e.key === "Enter") handleAcknowledge(); }}
                autoFocus
              />
            </div>

            <p className="text-xs text-gray-500 text-center leading-snug">
              By continuing, I confirm I have received and reviewed the schedule for my trades on this project.
            </p>

            {ackError && (
              <p className="text-xs text-red-400 text-center">{ackError}</p>
            )}

            <button
              onClick={handleAcknowledge}
              disabled={!ackName.trim() || ackSubmitting}
              className="w-full bg-[#F97316] hover:bg-[#ea6c0f] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold px-4 py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
            >
              {ackSubmitting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  Acknowledge {"&"} View Schedule
                </>
              )}
            </button>
          </div>

          <p className="text-[10px] text-gray-700 text-center">
            {"©"} {new Date().getFullYear()} IronTrack Development LLC
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0B0D] pb-24">
      {/* ── Header ── */}
      <header className="bg-[#0F0F14] border-b border-[#1F1F25] sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-4 py-3">
          {/* Logo row */}
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-md bg-[#F97316] flex items-center justify-center">
                <span className="text-white font-bold text-xs">P</span>
              </div>
              <span className="text-xs font-semibold text-gray-400 tracking-wide uppercase">
                IronTrack Pulse
              </span>
            </div>
          </div>

          {/* Project + sub info */}
          <h1 className="text-base font-bold text-gray-100 leading-tight truncate">
            {project.name}
          </h1>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
            <span className="text-sm text-[#F97316] font-medium">{sub.name}</span>
            {sub.trades.length > 0 && (
              <span className="text-xs text-gray-500">
                {sub.trades.join(", ")}
              </span>
            )}
          </div>
          {project.schedule_updated_at && (
            <p className="text-xs text-gray-600 mt-1">
              Schedule as of {formatDate(project.schedule_updated_at.split("T")[0])}
            </p>
          )}
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4">
        {/* ── Stats Bar ── */}
        <div className="grid grid-cols-4 gap-2 mt-4">
          <StatCard label="Total Tasks" value={stats.total_tasks} />
          <StatCard label="This Week" value={stats.this_week} accent />
          <StatCard label="Overdue" value={stats.overdue} danger={stats.overdue > 0} />
          <StatCard label="% Done" value={`${stats.pct_complete}%`} accent />
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-1 mt-5 overflow-x-auto scrollbar-hide pb-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "bg-[#F97316] text-white"
                  : "bg-[#13131A] text-gray-400 border border-[#1F1F25] hover:text-gray-200"
              }`}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span
                  className={`text-xs rounded-full px-1.5 py-0 ${
                    activeTab === tab.key
                      ? "bg-white/20 text-white"
                      : "bg-[#1F1F25] text-gray-500"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Tab Content ── */}
        <div className="mt-4 space-y-3">
          {/* Today Tab */}
          {activeTab === "today" && (
            <>
              {/* Overdue banner */}
              {activities.overdue.length > 0 && (
                <div className="bg-red-950/30 border border-red-800/40 rounded-xl p-3 mb-2">
                  <p className="text-xs font-semibold text-red-400 mb-2 flex items-center gap-1.5">
                    <AlertTriangle size={13} /> {activities.overdue.length} Overdue Task{activities.overdue.length !== 1 ? "s" : ""}
                  </p>
                  <div className="space-y-2">
                    {activities.overdue.map((act) => (
                      <ActivityCard key={act.id} activity={act} />
                    ))}
                  </div>
                </div>
              )}

              {activities.today.length > 0 ? (
                activities.today.map((act) => (
                  <ActivityCard key={act.id} activity={act} />
                ))
              ) : activities.overdue.length === 0 ? (
                <EmptyState message="No active tasks today for your trades." />
              ) : null}
            </>
          )}

          {/* My Full Scope Tab */}
          {activeTab === "full_scope" && (
            <FullScopeTab activities={activities} />
          )}

          {/* This Week Tab */}
          {activeTab === "this_week" && (
            <>
              {activities.this_week.length > 0 ? (
                (() => {
                  const byDay = groupByDay(activities.this_week);
                  return Object.entries(byDay)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([day, acts]) => (
                      <div key={day}>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 mt-4 first:mt-0">
                          <CalendarDays size={11} className="inline mr-1.5 -mt-0.5" />
                          {formatDateShort(day)}
                        </p>
                        <div className="space-y-2">
                          {acts.map((act) => (
                            <ActivityCard key={act.id} activity={act} />
                          ))}
                        </div>
                      </div>
                    ));
                })()
              ) : (
                <EmptyState message="No tasks scheduled this week for your trades." />
              )}
            </>
          )}

          {/* Next 2 Weeks Tab */}
          {activeTab === "next_two_weeks" && (
            <>
              {activities.next_two_weeks.length > 0 ? (
                (() => {
                  const byDay = groupByDay(activities.next_two_weeks);
                  return Object.entries(byDay)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([day, acts]) => (
                      <div key={day}>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 mt-4 first:mt-0">
                          <CalendarDays size={11} className="inline mr-1.5 -mt-0.5" />
                          {formatDateShort(day)}
                        </p>
                        <div className="space-y-2">
                          {acts.map((act) => (
                            <ActivityCard key={act.id} activity={act} />
                          ))}
                        </div>
                      </div>
                    ));
                })()
              ) : (
                <EmptyState message="No tasks scheduled in the next 2 weeks for your trades." />
              )}
            </>
          )}

          {/* Progress Report Tab */}
          {activeTab === "progress_report" && (
            <ProgressReportTab
              activities={activities}
              token={token}
              ackName={ackName}
              pastReports={pastReports}
            />
          )}
        </div>
      </div>

      {/* ── Acknowledged confirmation (fixed bottom, slim) ── */}
      {ackDone && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-green-950/60 border-t border-green-700/40 safe-bottom">
          <div className="max-w-2xl mx-auto px-4 py-2 flex items-center gap-2">
            <CheckCircle2 className="text-green-400 flex-shrink-0" size={16} />
            <p className="text-xs text-green-400">
              Acknowledged by <span className="font-semibold text-green-300">{ackName}</span>
              {ackTimestamp && (
                <> · {new Date(ackTimestamp).toLocaleString("en-US", {
                  month: "short", day: "numeric",
                  hour: "numeric", minute: "2-digit",
                })}</>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
