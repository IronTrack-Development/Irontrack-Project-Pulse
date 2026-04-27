"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CalendarCheck, Loader2, Share2, Send } from "lucide-react";
import ActivityDrawer from "@/components/ActivityDrawer";
import ReadyCheckModal from "@/components/ReadyCheckModal";
import ReadyCheckBadge from "@/components/ReadyCheckBadge";
import type { ParsedActivity, ReadyCheck } from "@/types";

interface Activity {
  id: string;
  activity_name: string;
  start_date: string;
  finish_date: string;
  percent_complete: number | null;
  trade: string | null;
}

interface DayPlanData {
  date: string;
  inspections: Activity[];
  activeTasks: Activity[];
  totalActivities: number;
  previewNext: {
    date: string;
    activityCount: number;
    inspectionCount: number;
  };
}

interface DayPlanTabProps {
  projectId: string;
  day: "today" | "tomorrow";
}

export default function DayPlanTab({ projectId, day }: DayPlanTabProps) {
  const [data, setData] = useState<DayPlanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [shareStatus, setShareStatus] = useState<string | null>(null);
  const [allActivities, setAllActivities] = useState<ParsedActivity[]>([]);
  const [drawerActivity, setDrawerActivity] = useState<ParsedActivity | null>(null);
  const [readyChecks, setReadyChecks] = useState<ReadyCheck[]>([]);
  const [readyCheckActivity, setReadyCheckActivity] = useState<ParsedActivity | null>(null);

  useEffect(() => {
    const fetchDayPlan = async () => {
      setLoading(true);
      try {
        const clientDate = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD in local tz
    const res = await fetch(`/api/projects/${projectId}/today-plan?day=${day}&clientDate=${clientDate}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (error) {
        console.error("Failed to fetch day plan:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDayPlan();
  }, [projectId, day]);

  useEffect(() => {
    fetch(`/api/projects/${projectId}/activities`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setAllActivities(data))
      .catch(() => {});
  }, [projectId]);

  useEffect(() => {
    fetch(`/api/projects/${projectId}/ready-checks`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data: ReadyCheck[]) => setReadyChecks(data))
      .catch(() => {});
  }, [projectId]);

  const getReadyCheck = (activityId: string) =>
    readyChecks.find((rc) => rc.activity_id === activityId) ?? null;

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

  const handleShareClick = () => {
    setIsSelecting(true);
    setSelectedIds(new Set());
  };

  const handleCancel = () => {
    setIsSelecting(false);
    setSelectedIds(new Set());
  };

  const toggleActivity = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const formatDateRange = (startDate: string, finishDate: string) => {
    if (!startDate || !finishDate) return "TBD";
    
    const start = new Date(startDate);
    const finish = new Date(finishDate);
    
    const monthDay = (date: Date) => 
      date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const day = (date: Date) => 
      date.toLocaleDateString("en-US", { day: "numeric" });
    
    if (startDate === finishDate) {
      return monthDay(start);
    }
    
    // Same month
    if (start.getMonth() === finish.getMonth() && start.getFullYear() === finish.getFullYear()) {
      const month = start.toLocaleDateString("en-US", { month: "short" });
      return `${month} ${day(start)}-${day(finish)}`;
    }
    
    // Different months
    return `${monthDay(start)}-${monthDay(finish)}`;
  };

  const handleShare = async () => {
    if (!data || selectedIds.size === 0) return;

    const allActivities = [...data.inspections, ...data.activeTasks];
    const selected = allActivities.filter((a) => selectedIds.has(a.id));

    const dayLabel = day === "today" ? "Today" : "Tomorrow";
    let text = ``;

    selected.forEach((activity) => {
      const dateRange = formatDateRange(activity.start_date, activity.finish_date);
      const tradeSuffix = activity.trade ? ` — ${activity.trade}` : "";
      text += `• ${activity.activity_name} (${dateRange})${tradeSuffix}\n`;
    });

    // Try native share first
    if (navigator.share) {
      try {
        await navigator.share({ text });
        setShareStatus("Shared!");
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          // Fall back to clipboard
          await navigator.clipboard.writeText(text);
          setShareStatus("Copied!");
        }
      }
    } else {
      // Fall back to clipboard
      await navigator.clipboard.writeText(text);
      setShareStatus("Copied!");
    }

    setTimeout(() => setShareStatus(null), 2000);
    setIsSelecting(false);
    setSelectedIds(new Set());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={24} className="text-[#F97316] animate-spin" />
      </div>
    );
  }

  if (!data || data.totalActivities === 0) {
    return (
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-2xl p-12 text-center">
        <CalendarCheck size={40} className="mx-auto text-gray-700 mb-4" />
        <div className="text-[color:var(--text-secondary)] text-sm">No activities scheduled</div>
      </div>
    );
  }

  const dateObj = new Date(data.date);
  const formattedDate = dateObj.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const nextDateObj = new Date(data.previewNext.date);
  const nextLabel = day === "today" ? "Tomorrow" : "Day After";
  const nextFormattedDate = nextDateObj.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return (
    <div className="space-y-4">
      {/* Header with Share button / Selection mode */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl px-4 py-3 flex items-center justify-between">
        {isSelecting ? (
          <>
            <div className="text-sm text-[color:var(--text-secondary)]">Select activities to share</div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCancel}
                className="px-3 py-1.5 text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] text-xs font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleShare}
                disabled={selectedIds.size === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F97316] hover:bg-[#ea6a0a] disabled:bg-[var(--bg-tertiary)] disabled:text-gray-600 text-[color:var(--text-primary)] rounded-lg text-xs font-medium transition-colors"
              >
                <Share2 size={13} />
                Share ({selectedIds.size})
              </button>
            </div>
          </>
        ) : (
          <>
            <div>
              <div className="text-xs text-[color:var(--text-muted)]">{day === "today" ? "Today" : "Tomorrow"}</div>
              <div className="text-sm font-medium text-[color:var(--text-primary)]">{formattedDate}</div>
            </div>
            <button
              onClick={handleShareClick}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] text-[color:var(--text-secondary)] rounded-lg text-xs font-medium transition-colors"
            >
              <Share2 size={13} />
              {shareStatus || "Share"}
            </button>
          </>
        )}
      </div>

      {/* Inspections section */}
      {data.inspections.length > 0 && (
        <div className="bg-[var(--bg-secondary)] border border-[#F97316]/30 rounded-xl overflow-hidden">
          <div className="bg-[#F97316]/10 border-b border-[#F97316]/30 px-4 py-2.5 flex items-center gap-2">
            <AlertTriangle size={16} className="text-[#F97316]" />
            <div className="text-sm font-semibold text-[#F97316]">Inspections</div>
          </div>
          <div className="divide-y divide-[#1F1F25]">
            {data.inspections.map((inspection) => {
              const isSelected = selectedIds.has(inspection.id);
              return (
                <div
                  key={inspection.id}
                  onClick={() => isSelecting ? toggleActivity(inspection.id) : openDrawer(inspection.id)}
                  className={`px-4 py-3 transition-colors cursor-pointer group ${
                    isSelecting
                      ? "hover:bg-[var(--bg-tertiary)]/50"
                      : "hover:bg-[var(--bg-tertiary)]/30"
                  } ${
                    isSelected ? "bg-[#F97316]/20 border-l-2 border-[#F97316]" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {isSelecting && (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleActivity(inspection.id)}
                        className="mt-0.5 w-4 h-4 rounded border-gray-600 bg-[var(--bg-tertiary)] text-[#F97316] focus:ring-[#F97316] focus:ring-offset-0"
                      />
                    )}
                    <div className="flex-1">
                      <div className="text-sm text-[color:var(--text-primary)]">{inspection.activity_name}</div>
                      {inspection.trade && (
                        <div className="text-xs text-[color:var(--text-muted)] mt-0.5">{inspection.trade}</div>
                      )}
                      {(() => {
                        const rc = getReadyCheck(inspection.id);
                        if (rc) return <div className="mt-1.5"><ReadyCheckBadge status={rc.status} followUpCount={rc.follow_up_count} /></div>;
                        if (!isSelecting) return (
                          <button
                            onClick={(e) => { e.stopPropagation(); const full = allActivities.find((a) => a.id === inspection.id); if (full) setReadyCheckActivity(full); }}
                            className="mt-1.5 flex items-center gap-1 text-[10px] text-gray-600 hover:text-[#F97316] transition-colors"
                          >
                            <Send size={10} />
                            Ready Check
                          </button>
                        );
                        return null;
                      })()}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Active tasks section */}
      {data.activeTasks.length > 0 && (
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl overflow-hidden">
          <div className="bg-[var(--bg-primary)] border-b border-[var(--border-primary)] px-4 py-2">
            <div className="text-xs text-[color:var(--text-muted)]">Active Tasks</div>
          </div>
          <div className="divide-y divide-[#1F1F25]">
            {data.activeTasks.map((task) => {
              const pct = task.percent_complete || 0;
              const isSelected = selectedIds.has(task.id);
              return (
                <div
                  key={task.id}
                  onClick={() => isSelecting ? toggleActivity(task.id) : openDrawer(task.id)}
                  className={`px-4 py-3 transition-colors cursor-pointer ${
                    isSelecting
                      ? "hover:bg-[var(--bg-tertiary)]/50"
                      : "hover:bg-[var(--bg-tertiary)]/30"
                  } ${
                    isSelected ? "bg-[#F97316]/20 border-l-2 border-[#F97316]" : ""
                  }`}
                >
                  <div className="flex items-start gap-3 mb-2">
                    {isSelecting && (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleActivity(task.id)}
                        className="mt-0.5 w-4 h-4 rounded border-gray-600 bg-[var(--bg-tertiary)] text-[#F97316] focus:ring-[#F97316] focus:ring-offset-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-[color:var(--text-primary)] mb-0.5">{task.activity_name}</div>
                          {task.trade && (
                            <div className="text-xs text-[color:var(--text-muted)]">{task.trade}</div>
                          )}
                          {(() => {
                            const rc = getReadyCheck(task.id);
                            if (rc) return <div className="mt-1.5"><ReadyCheckBadge status={rc.status} followUpCount={rc.follow_up_count} /></div>;
                            if (!isSelecting) return (
                              <button
                                onClick={(e) => { e.stopPropagation(); const full = allActivities.find((a) => a.id === task.id); if (full) setReadyCheckActivity(full); }}
                                className="mt-1.5 flex items-center gap-1 text-[10px] text-gray-600 hover:text-[#F97316] transition-colors"
                              >
                                <Send size={10} />
                                Ready Check
                              </button>
                            );
                            return null;
                          })()}
                        </div>
                        <div className={`text-sm font-semibold shrink-0 ${
                          pct >= 100 
                            ? "text-[#22C55E]" 
                            : pct > 0 
                            ? "text-[#F97316]" 
                            : "text-[color:var(--text-muted)]"
                        }`}>
                          {pct}%
                        </div>
                      </div>
                      {/* Progress bar */}
                      <div className="w-full bg-[var(--bg-tertiary)] rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            pct >= 100 ? "bg-[#22C55E]" : "bg-[#F97316]"
                          }`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {data.totalActivities > 10 && (
            <div className="px-4 py-2 text-center text-xs text-[color:var(--text-muted)] border-t border-[var(--border-primary)]">
              View all {data.totalActivities} activities →
            </div>
          )}
        </div>
      )}

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

      {/* Preview next day */}
      {data.previewNext.activityCount > 0 && (
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl px-4 py-3">
          <div className="text-xs text-[color:var(--text-muted)] mb-1">{nextLabel}</div>
          <div className="text-sm text-[color:var(--text-secondary)]">
            {nextFormattedDate}: {data.previewNext.activityCount} activit{data.previewNext.activityCount !== 1 ? "ies" : "y"}
            {data.previewNext.inspectionCount > 0 && (
              <>, {data.previewNext.inspectionCount} inspection{data.previewNext.inspectionCount !== 1 ? "s" : ""}</>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
