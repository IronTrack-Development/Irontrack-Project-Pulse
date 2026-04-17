"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  CalendarDays,
  Loader2,
  XCircle,
  ChevronRight,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SubScheduleViewPage() {
  const { token } = useParams<{ token: string }>();

  const [data, setData] = useState<ViewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<"today" | "this_week" | "next_two_weeks" | "dependencies">(
    "today"
  );

  // Acknowledge flow state
  const [ackName, setAckName] = useState("");
  const [ackSubmitting, setAckSubmitting] = useState(false);
  const [ackDone, setAckDone] = useState(false);
  const [ackTimestamp, setAckTimestamp] = useState<string | null>(null);
  const [ackError, setAckError] = useState<string | null>(null);

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

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  const { project, sub, stats, activities, dependencies } = data;

  const tabs = [
    {
      key: "today" as const,
      label: "Today",
      count: activities.today.length + activities.overdue.length,
    },
    {
      key: "this_week" as const,
      label: "This Week",
      count: activities.this_week.length,
    },
    {
      key: "next_two_weeks" as const,
      label: "Next 2 Weeks",
      count: activities.next_two_weeks.length,
    },
    {
      key: "dependencies" as const,
      label: "Dependencies",
      count: dependencies.length,
    },
  ];

  return (
    <div className="min-h-screen bg-[#0B0B0D] pb-40">
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
              {tab.count > 0 && (
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

          {/* Dependencies Tab */}
          {activeTab === "dependencies" && (
            <>
              {dependencies.length > 0 ? (
                <div className="space-y-3">
                  {dependencies.map((dep, i) => (
                    <DependencyCard key={i} dep={dep} />
                  ))}
                </div>
              ) : (
                <EmptyState message="No cross-trade dependencies found for your tasks." />
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Acknowledge Bar (fixed bottom) ── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#0F0F14] border-t border-[#1F1F25]">
        <div className="max-w-2xl mx-auto px-4 py-3">
          {ackDone ? (
            <div className="flex items-center gap-3 bg-green-950/40 border border-green-700/40 rounded-xl px-4 py-3">
              <CheckCircle2 className="text-green-400 flex-shrink-0" size={20} />
              <div>
                <p className="text-sm font-semibold text-green-400">Schedule Acknowledged</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Confirmed by <span className="text-gray-200">{ackName}</span>
                  {ackTimestamp && (
                    <> · {new Date(ackTimestamp).toLocaleString("en-US", {
                      month: "short", day: "numeric", year: "numeric",
                      hour: "numeric", minute: "2-digit",
                    })}</>
                  )}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-gray-500 text-center leading-snug">
                I confirm I have received and reviewed this schedule
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={ackName}
                  onChange={(e) => setAckName(e.target.value)}
                  placeholder="Your full name"
                  className="flex-1 bg-[#13131A] border border-[#1F1F25] rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-[#F97316] focus:ring-1 focus:ring-[#F97316]/30 transition"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAcknowledge();
                  }}
                />
                <button
                  onClick={handleAcknowledge}
                  disabled={!ackName.trim() || ackSubmitting}
                  className="flex-shrink-0 bg-[#F97316] hover:bg-[#ea6c0f] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-1.5"
                >
                  {ackSubmitting ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <>
                      Acknowledge
                      <ChevronRight size={14} />
                    </>
                  )}
                </button>
              </div>
              {ackError && (
                <p className="text-xs text-red-400 text-center">{ackError}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Dependency Card ───────────────────────────────────────────────────────────

function DependencyCard({ dep }: { dep: DependencyEntry }) {
  const predStatus = dep.predecessor.status;
  const isBlocking = predStatus !== "complete";

  return (
    <div
      className={`bg-[#13131A] border rounded-xl p-4 space-y-3 ${
        isBlocking ? "border-orange-700/40" : "border-[#1F1F25]"
      }`}
    >
      {isBlocking && (
        <div className="flex items-center gap-1.5 text-xs text-orange-400">
          <AlertTriangle size={12} />
          <span className="font-medium">Blocking dependency</span>
        </div>
      )}

      {/* Predecessor (other trade's task) */}
      <div className="space-y-1">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          {dep.predecessor.trade ?? "Other Trade"} must complete:
        </p>
        <p className="text-sm text-gray-200 font-medium">{dep.predecessor.activity_name}</p>
        <div className="flex flex-wrap gap-x-3 text-xs text-gray-500">
          {dep.predecessor.finish_date && (
            <span>By: <span className="text-gray-300">{formatDate(dep.predecessor.finish_date)}</span></span>
          )}
          <span>Status: {dep.predecessor.status === "complete"
            ? <span className="text-green-400">Complete</span>
            : dep.predecessor.status === "late"
              ? <span className="text-red-400">Late</span>
              : <span className="text-orange-400">In Progress</span>}
          </span>
        </div>
      </div>

      {/* Arrow connector */}
      <div className="flex items-center gap-2 text-gray-600">
        <div className="flex-1 h-px bg-[#1F1F25]" />
        <ArrowRight size={14} className="text-[#F97316]" />
        <div className="flex-1 h-px bg-[#1F1F25]" />
      </div>

      {/* Your activity */}
      <div className="space-y-1">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Before you can start:
        </p>
        <p className="text-sm text-gray-100 font-medium">{dep.your_activity.activity_name}</p>
        {dep.your_activity.start_date && (
          <p className="text-xs text-gray-500">
            Your start: <span className="text-gray-300">{formatDate(dep.your_activity.start_date)}</span>
          </p>
        )}
      </div>
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
