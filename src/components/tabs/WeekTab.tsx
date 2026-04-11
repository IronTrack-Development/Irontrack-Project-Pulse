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

  const handleShare = async () => {
    if (!data) return;

    const dateRangeStr = formatDateRange();
    const year = weekStart.getFullYear();
    let text = `IronTrack Project Pulse — Week ${weekNumber} Lookahead\nWeek of ${dateRangeStr}, ${year}\n\n`;

    data.activities.forEach((activity) => {
      text += `• ${activity.activity_name}\n`;
    });

    text += `\n${data.activities.length} activit${data.activities.length !== 1 ? "ies" : "y"} this week`;

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
        <div>
          <div className="text-xs text-gray-500">Week {weekNumber}</div>
          <div className="text-sm font-medium text-white">{formatDateRange()}</div>
        </div>
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1F1F25] hover:bg-[#2a2a35] text-gray-300 rounded-lg text-xs font-medium transition-colors"
        >
          <Share2 size={13} />
          {shareStatus || "Share"}
        </button>
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
                {dayActivities.map((activity) => (
                  <div key={activity.id} className="px-4 py-3 hover:bg-[#1F1F25]/30 transition-colors">
                    <div className="flex items-start justify-between gap-3">
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
                ))}
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
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Activity Name</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Start Date</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Finish Date</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">% Complete</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F1F25]">
              {data.activities.map((activity) => (
                <tr key={activity.id} className="hover:bg-[#1F1F25]/30 transition-colors">
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
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
