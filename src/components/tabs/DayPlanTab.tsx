"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CalendarCheck, Loader2, Share2 } from "lucide-react";

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
  const [shareStatus, setShareStatus] = useState<string | null>(null);

  useEffect(() => {
    const fetchDayPlan = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/projects/${projectId}/today-plan?day=${day}`);
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

  const handleShare = async () => {
    if (!data) return;

    const dateObj = new Date(data.date);
    const formattedDate = dateObj.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const dayLabel = day === "today" ? "Today's Plan" : "Tomorrow's Plan";
    let text = `IronTrack Project Pulse — ${dayLabel}\n${formattedDate}\n\n`;

    if (data.inspections.length > 0) {
      text += "⚠️ INSPECTIONS:\n";
      data.inspections.forEach((inspection) => {
        const tradeSuffix = inspection.trade ? ` — ${inspection.trade}` : "";
        text += `• ${inspection.activity_name}${tradeSuffix}\n`;
      });
      text += "\n";
    }

    if (data.activeTasks.length > 0) {
      text += "TASKS:\n";
      data.activeTasks.forEach((task) => {
        const tradeSuffix = task.trade ? ` — ${task.trade}` : "";
        text += `• ${task.activity_name}${tradeSuffix}\n`;
      });
      text += "\n";
    }

    text += `${data.totalActivities} task${data.totalActivities !== 1 ? "s" : ""}`;
    if (data.inspections.length > 0) {
      text += `, ${data.inspections.length} inspection${data.inspections.length !== 1 ? "s" : ""}`;
    }

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={24} className="text-[#F97316] animate-spin" />
      </div>
    );
  }

  if (!data || data.totalActivities === 0) {
    return (
      <div className="bg-[#121217] border border-[#1F1F25] rounded-2xl p-12 text-center">
        <CalendarCheck size={40} className="mx-auto text-gray-700 mb-4" />
        <div className="text-gray-400 text-sm">No activities scheduled</div>
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
      {/* Header with Share button */}
      <div className="bg-[#121217] border border-[#1F1F25] rounded-xl px-4 py-3 flex items-center justify-between">
        <div>
          <div className="text-xs text-gray-500">{day === "today" ? "Today" : "Tomorrow"}</div>
          <div className="text-sm font-medium text-white">{formattedDate}</div>
        </div>
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1F1F25] hover:bg-[#2a2a35] text-gray-300 rounded-lg text-xs font-medium transition-colors"
        >
          <Share2 size={13} />
          {shareStatus || "Share"}
        </button>
      </div>

      {/* Inspections section */}
      {data.inspections.length > 0 && (
        <div className="bg-[#121217] border border-[#F97316]/30 rounded-xl overflow-hidden">
          <div className="bg-[#F97316]/10 border-b border-[#F97316]/30 px-4 py-2.5 flex items-center gap-2">
            <AlertTriangle size={16} className="text-[#F97316]" />
            <div className="text-sm font-semibold text-[#F97316]">Inspections</div>
          </div>
          <div className="divide-y divide-[#1F1F25]">
            {data.inspections.map((inspection) => (
              <div key={inspection.id} className="px-4 py-3 hover:bg-[#1F1F25]/30 transition-colors">
                <div className="text-sm text-white">{inspection.activity_name}</div>
                {inspection.trade && (
                  <div className="text-xs text-gray-500 mt-0.5">{inspection.trade}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active tasks section */}
      {data.activeTasks.length > 0 && (
        <div className="bg-[#121217] border border-[#1F1F25] rounded-xl overflow-hidden">
          <div className="bg-[#0B0B0D] border-b border-[#1F1F25] px-4 py-2">
            <div className="text-xs text-gray-500">Active Tasks</div>
          </div>
          <div className="divide-y divide-[#1F1F25]">
            {data.activeTasks.map((task) => {
              const pct = task.percent_complete || 0;
              return (
                <div key={task.id} className="px-4 py-3 hover:bg-[#1F1F25]/30 transition-colors">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white mb-0.5">{task.activity_name}</div>
                      {task.trade && (
                        <div className="text-xs text-gray-500">{task.trade}</div>
                      )}
                    </div>
                    <div className={`text-sm font-semibold shrink-0 ${
                      pct >= 100 
                        ? "text-[#22C55E]" 
                        : pct > 0 
                        ? "text-[#F97316]" 
                        : "text-gray-500"
                    }`}>
                      {pct}%
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-[#1F1F25] rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        pct >= 100 ? "bg-[#22C55E]" : "bg-[#F97316]"
                      }`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          {data.totalActivities > 10 && (
            <div className="px-4 py-2 text-center text-xs text-gray-500 border-t border-[#1F1F25]">
              View all {data.totalActivities} activities →
            </div>
          )}
        </div>
      )}

      {/* Preview next day */}
      {data.previewNext.activityCount > 0 && (
        <div className="bg-[#121217] border border-[#1F1F25] rounded-xl px-4 py-3">
          <div className="text-xs text-gray-500 mb-1">{nextLabel}</div>
          <div className="text-sm text-gray-400">
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
