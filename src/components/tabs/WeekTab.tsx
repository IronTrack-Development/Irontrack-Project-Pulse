"use client";

import { useEffect, useState } from "react";
import { CalendarDays, Loader2, Share2 } from "lucide-react";

interface Activity {
  id: string;
  activity_name: string;
  start_date: string;
  finish_date: string;
  percent_complete: number | null;
}

interface WeekData {
  week: number;
  weekStart: string;
  weekEnd: string;
  activities: Activity[];
  groupedByDay: Record<string, Activity[]>;
}

interface WeekTabProps {
  projectId: string;
  weekNumber: 1 | 2 | 3;
}

export default function WeekTab({ projectId, weekNumber }: WeekTabProps) {
  const [data, setData] = useState<WeekData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [shareStatus, setShareStatus] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeekData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/projects/${projectId}/week?week=${weekNumber}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (error) {
        console.error("Failed to fetch week data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWeekData();
  }, [projectId, weekNumber]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={24} className="text-[#F97316] animate-spin" />
      </div>
    );
  }

  if (!data || data.activities.length === 0) {
    return (
      <div className="bg-[#121217] border border-[#1F1F25] rounded-2xl p-12 text-center">
        <CalendarDays size={40} className="mx-auto text-gray-700 mb-4" />
        <div className="text-gray-400 text-sm">No activities scheduled this week</div>
      </div>
    );
  }

  const weekStart = new Date(data.weekStart);
  const weekEnd = new Date(data.weekEnd);
  const formatDateRange = () => {
    const options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
    return `${weekStart.toLocaleDateString("en-US", options)} - ${weekEnd.toLocaleDateString("en-US", options)}`;
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

  const formatActivityDateRange = (startDate: string, finishDate: string) => {
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

    const selected = data.activities.filter((a) => selectedIds.has(a.id));

    let text = `IronTrack Project Pulse — Week ${weekNumber}\n\n`;

    selected.forEach((activity) => {
      const dateRange = formatActivityDateRange(activity.start_date, activity.finish_date);
      text += `• ${activity.activity_name} (${dateRange})\n`;
    });

    text += `\n${selected.length} activit${selected.length !== 1 ? "ies" : "y"}`;

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

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const daysInWeek = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + i);
    return day;
  });

  return (
    <div className="space-y-4">
      <div className="bg-[#121217] border border-[#1F1F25] rounded-xl px-4 py-3 flex items-center justify-between">
        {isSelecting ? (
          <>
            <div className="text-sm text-gray-300">Select activities to share</div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCancel}
                className="px-3 py-1.5 text-gray-400 hover:text-white text-xs font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleShare}
                disabled={selectedIds.size === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F97316] hover:bg-[#ea6a0a] disabled:bg-[#1F1F25] disabled:text-gray-600 text-white rounded-lg text-xs font-medium transition-colors"
              >
                <Share2 size={13} />
                Share ({selectedIds.size})
              </button>
            </div>
          </>
        ) : (
          <>
            <div>
              <div className="text-xs text-gray-500">Week {weekNumber}</div>
              <div className="text-sm font-medium text-white">{formatDateRange()}</div>
            </div>
            <button
              onClick={handleShareClick}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1F1F25] hover:bg-[#2a2a35] text-gray-300 rounded-lg text-xs font-medium transition-colors"
            >
              <Share2 size={13} />
              {shareStatus || "Share"}
            </button>
          </>
        )}
      </div>

      {/* Group by day */}
      <div className="space-y-4">
        {daysInWeek.map((day) => {
          const dayKey = day.toISOString().split("T")[0];
          const dayActivities = data.groupedByDay[dayKey] || [];

          if (dayActivities.length === 0) return null;

          return (
            <div key={dayKey} className="bg-[#121217] border border-[#1F1F25] rounded-xl overflow-hidden">
              <div className="bg-[#0B0B0D] border-b border-[#1F1F25] px-4 py-2">
                <div className="text-xs text-gray-500">{dayNames[day.getDay()]}</div>
                <div className="text-sm font-medium text-white">
                  {day.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </div>
              </div>
              <div className="divide-y divide-[#1F1F25]">
                {dayActivities.map((activity) => {
                  const isSelected = selectedIds.has(activity.id);
                  return (
                    <div
                      key={activity.id}
                      onClick={() => isSelecting && toggleActivity(activity.id)}
                      className={`px-4 py-3 transition-colors ${
                        isSelecting
                          ? "cursor-pointer hover:bg-[#1F1F25]/50"
                          : "hover:bg-[#1F1F25]/30"
                      } ${
                        isSelected ? "bg-[#F97316]/20 border-l-2 border-[#F97316]" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {isSelecting && (
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleActivity(activity.id)}
                            className="mt-0.5 w-4 h-4 rounded border-gray-600 bg-[#1F1F25] text-[#F97316] focus:ring-[#F97316] focus:ring-offset-0"
                          />
                        )}
                        <div className="flex items-start justify-between gap-3 flex-1">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-white mb-1">{activity.activity_name}</div>
                            <div className="text-xs text-gray-500">
                              {new Date(activity.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                              {" → "}
                              {new Date(activity.finish_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className={`text-sm font-semibold ${
                              (activity.percent_complete || 0) >= 100 
                                ? "text-[#22C55E]" 
                                : (activity.percent_complete || 0) > 0 
                                ? "text-[#F97316]" 
                                : "text-gray-500"
                            }`}>
                              {activity.percent_complete || 0}%
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary table fallback if no grouping */}
      {Object.keys(data.groupedByDay).length === 0 && (
        <div className="bg-[#121217] border border-[#1F1F25] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-[#0B0B0D] border-b border-[#1F1F25]">
              <tr>
                {isSelecting && (
                  <th className="px-4 py-2 w-12"></th>
                )}
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Activity Name</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Start Date</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Finish Date</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">% Complete</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F1F25]">
              {data.activities.map((activity) => {
                const isSelected = selectedIds.has(activity.id);
                return (
                  <tr
                    key={activity.id}
                    onClick={() => isSelecting && toggleActivity(activity.id)}
                    className={`transition-colors ${
                      isSelecting
                        ? "cursor-pointer hover:bg-[#1F1F25]/50"
                        : "hover:bg-[#1F1F25]/30"
                    } ${
                      isSelected ? "bg-[#F97316]/20" : ""
                    }`}
                  >
                    {isSelecting && (
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleActivity(activity.id)}
                          className="w-4 h-4 rounded border-gray-600 bg-[#1F1F25] text-[#F97316] focus:ring-[#F97316] focus:ring-offset-0"
                        />
                      </td>
                    )}
                    <td className="px-4 py-3 text-sm text-white">{activity.activity_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-400">
                      {new Date(activity.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">
                      {new Date(activity.finish_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      <span className={`font-semibold ${
                        (activity.percent_complete || 0) >= 100 
                          ? "text-[#22C55E]" 
                          : (activity.percent_complete || 0) > 0 
                          ? "text-[#F97316]" 
                          : "text-gray-500"
                      }`}>
                        {activity.percent_complete || 0}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
