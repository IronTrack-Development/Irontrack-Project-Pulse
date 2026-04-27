"use client";

import { useEffect, useState } from "react";
import { CalendarDays, RefreshCw, ChevronDown, AlertTriangle } from "lucide-react";
import type { LookaheadGroup, ParsedActivity } from "@/types";

interface TradeFlag {
  trade: string;
  behindPercent: number;
  message: string;
}

const DAY_OPTIONS = [7, 14, 21] as const;

function statusStyle(status: string): string {
  switch (status) {
    case "complete": return "bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20";
    case "in_progress": return "bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/20";
    case "late": return "bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/20";
    default: return "bg-[var(--bg-tertiary)] text-[color:var(--text-secondary)] border border-[var(--border-primary)]";
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case "in_progress": return "Active";
    case "complete": return "Done";
    case "late": return "Late";
    case "not_started": return "Upcoming";
    default: return status;
  }
}

function ActivityRow({ activity }: { activity: ParsedActivity }) {
  const isInspection = activity.trade === "Inspection";
  return (
    <div
      className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
        isInspection
          ? "bg-[#F97316]/10 border border-[#F97316]/20"
          : "bg-[var(--bg-primary)] border border-[var(--border-primary)]"
      }`}
    >
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-medium truncate ${isInspection ? "text-[#F97316]" : "text-[color:var(--text-primary)]"}`}>
          {activity.activity_name}
          {isInspection && <span className="ml-2 text-[10px] bg-[#F97316]/20 text-[#F97316] px-1.5 py-0.5 rounded font-bold">INSPECT</span>}
        </div>
        <div className="flex items-center gap-3 mt-0.5 text-xs text-[color:var(--text-muted)]">
          {activity.start_date && (
            <span>{new Date(activity.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
          )}
          {activity.finish_date && (
            <span>→ {new Date(activity.finish_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
          )}
          {activity.original_duration && (
            <span>{activity.original_duration}d</span>
          )}
          {activity.percent_complete > 0 && (
            <span className="text-[#3B82F6]">{activity.percent_complete}%</span>
          )}
        </div>
      </div>
      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${statusStyle(activity.status)}`}>
        {statusLabel(activity.status)}
      </span>
    </div>
  );
}

export default function LookaheadTab({ projectId }: { projectId: string }) {
  const [days, setDays] = useState<7 | 14 | 21>(14);
  const [groups, setGroups] = useState<LookaheadGroup[]>([]);
  const [tradeFlags, setTradeFlags] = useState<TradeFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const fetchData = async (d: number) => {
    setLoading(true);
    const res = await fetch(`/api/projects/${projectId}/lookahead?days=${d}`);
    if (res.ok) {
      const data = await res.json();
      setGroups(data.groups || []);
      setTradeFlags(data.tradeFlags || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(days); }, [projectId, days]);

  const totalActivities = groups.reduce((s, g) => s + g.trades.reduce((ts, t) => ts + t.activities.length, 0), 0);

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-[color:var(--text-primary)]">{totalActivities} activities in view</div>
          <div className="text-xs text-[color:var(--text-muted)]">Grouped by week and trade</div>
        </div>
        <div className="flex items-center gap-1 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-1">
          {DAY_OPTIONS.map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                days === d
                  ? "bg-[#F97316] text-[color:var(--text-primary)]"
                  : "text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)]"
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* Trade flags from daily logs */}
      {tradeFlags.length > 0 && (
        <div className="space-y-2">
          {tradeFlags.map((flag) => (
            <div
              key={flag.trade}
              className="bg-[#EAB308]/10 border border-[#EAB308]/20 rounded-xl px-4 py-3 flex items-start gap-3"
            >
              <AlertTriangle size={14} className="text-[#EAB308] shrink-0 mt-0.5" />
              <div className="text-xs text-[#EAB308]">{flag.message}</div>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <RefreshCw size={20} className="text-[#F97316] animate-spin" />
        </div>
      ) : groups.length === 0 ? (
        <div className="text-center py-12 text-gray-600">
          <CalendarDays size={32} className="mx-auto mb-3 opacity-30" />
          <p>No activities in this window.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => {
            const totalInWeek = group.trades.reduce((s, t) => s + t.activities.length, 0);
            if (totalInWeek === 0) return null;
            const isCollapsed = collapsed[group.weekStart];

            return (
              <div key={group.weekStart} className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-2xl overflow-hidden">
                <button
                  onClick={() => setCollapsed({ ...collapsed, [group.weekStart]: !isCollapsed })}
                  className="w-full flex items-center justify-between px-5 py-3 hover:bg-[var(--bg-tertiary)]/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <CalendarDays size={15} className="text-[#F97316]" />
                    <span className="font-semibold text-[color:var(--text-primary)] text-sm">{group.weekLabel}</span>
                    <span className="text-xs text-[color:var(--text-muted)]">{totalInWeek} activit{totalInWeek !== 1 ? "ies" : "y"}</span>
                  </div>
                  <ChevronDown
                    size={16}
                    className={`text-[color:var(--text-muted)] transition-transform ${isCollapsed ? "" : "rotate-180"}`}
                  />
                </button>

                {!isCollapsed && (
                  <div className="px-4 pb-4 space-y-4">
                    {group.trades.map(({ trade, activities }) => {
                      const flagged = tradeFlags.find((f) => f.trade === trade);
                      return (
                      <div key={trade}>
                        <div className="flex items-center gap-2 mb-2 px-1">
                          <span className={`text-xs font-bold uppercase tracking-wide ${flagged ? "text-[#EAB308]" : "text-[color:var(--text-secondary)]"}`}>{trade}</span>
                          <span className="text-xs text-gray-600">({activities.length})</span>
                          {flagged && <AlertTriangle size={10} className="text-[#EAB308]" />}
                        </div>
                        <div className="space-y-1.5">
                          {activities.map((a) => <ActivityRow key={a.id} activity={a} />)}
                        </div>
                      </div>
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
  );
}
