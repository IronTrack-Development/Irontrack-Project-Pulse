"use client";

import { useEffect, useState } from "react";
import { X, Calendar, Clock, Hash, MapPin, Users, AlertTriangle, ChevronRight } from "lucide-react";
import type { ParsedActivity, DailyRisk } from "@/types";

function fmt(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

function statusStyle(status: string) {
  switch (status) {
    case "complete": return "bg-[#22C55E]/15 text-[#22C55E] border-[#22C55E]/30";
    case "in_progress": return "bg-[#3B82F6]/15 text-[#3B82F6] border-[#3B82F6]/30";
    case "late": return "bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/30";
    default: return "bg-gray-800 text-gray-400 border-gray-700";
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

interface Props {
  activity: ParsedActivity;
  projectId: string;
  onClose: () => void;
}

export default function ActivityDrawer({ activity, projectId, onClose }: Props) {
  const [risks, setRisks] = useState<DailyRisk[]>([]);

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

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 animate-fade-in"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-[#121217] border-l border-[#1F1F25] z-50 overflow-y-auto animate-slide-in">
        {/* Header */}
        <div className="sticky top-0 bg-[#121217] border-b border-[#1F1F25] px-6 py-4 flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {activity.activity_id && (
                <span className="text-xs text-gray-500 font-mono">{activity.activity_id}</span>
              )}
              {activity.milestone && (
                <span className="text-[10px] bg-[#F97316]/20 text-[#F97316] px-2 py-0.5 rounded font-bold uppercase">Milestone</span>
              )}
              <span className={`text-xs px-2 py-0.5 rounded border font-semibold ${statusStyle(activity.status)}`}>
                {statusLabel(activity.status)}
              </span>
            </div>
            <h2 className="font-bold text-white text-base leading-tight">{activity.activity_name}</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-[#1F1F25] text-gray-400 hover:text-white transition-colors shrink-0">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Trade + Area */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#0B0B0D] border border-[#1F1F25] rounded-xl p-3">
              <div className="text-[10px] text-gray-600 uppercase tracking-wide mb-1">Trade</div>
              <div className="text-sm font-semibold text-[#F97316]">{activity.trade || "General"}</div>
            </div>
            {activity.area && (
              <div className="bg-[#0B0B0D] border border-[#1F1F25] rounded-xl p-3">
                <div className="flex items-center gap-1 text-[10px] text-gray-600 uppercase tracking-wide mb-1">
                  <MapPin size={9} /> Area
                </div>
                <div className="text-sm font-semibold text-white">{activity.area}</div>
              </div>
            )}
          </div>

          {/* Dates */}
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Schedule</div>
            <div className="space-y-2">
              {[
                { label: "Planned Start", value: activity.start_date, icon: Calendar },
                { label: "Planned Finish", value: activity.finish_date, icon: Calendar },
                { label: "Actual Start", value: activity.actual_start, icon: Calendar },
                { label: "Actual Finish", value: activity.actual_finish, icon: Calendar },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5 text-gray-500">
                    <Icon size={12} />
                    {label}
                  </span>
                  <span className={`font-medium ${value ? "text-white" : "text-gray-700"}`}>
                    {fmt(value)}
                  </span>
                </div>
              ))}
              {daysUntilFinish !== null && activity.status !== "complete" && (
                <div className={`mt-2 text-xs font-semibold px-2 py-1 rounded inline-block ${
                  daysUntilFinish < 0 ? "bg-red-900/30 text-red-400" :
                  daysUntilFinish <= 3 ? "bg-yellow-900/30 text-yellow-400" :
                  "bg-gray-800 text-gray-400"
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
            <div className="bg-[#0B0B0D] border border-[#1F1F25] rounded-xl p-3 text-center">
              <div className="text-lg font-bold text-white">{activity.original_duration ?? "—"}</div>
              <div className="text-[10px] text-gray-500">Orig Duration</div>
            </div>
            <div className="bg-[#0B0B0D] border border-[#1F1F25] rounded-xl p-3 text-center">
              <div className="text-lg font-bold text-white">{activity.remaining_duration ?? "—"}</div>
              <div className="text-[10px] text-gray-500">Remaining</div>
            </div>
            <div className="bg-[#0B0B0D] border border-[#1F1F25] rounded-xl p-3 text-center">
              <div className="text-lg font-bold text-[#3B82F6]">{activity.percent_complete}%</div>
              <div className="text-[10px] text-gray-500">Complete</div>
            </div>
          </div>

          {/* Progress bar */}
          <div>
            <div className="h-2 bg-[#1F1F25] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#F97316] to-[#3B82F6] rounded-full transition-all"
                style={{ width: `${activity.percent_complete}%` }}
              />
            </div>
          </div>

          {/* WBS */}
          {activity.wbs && (
            <div className="flex items-center gap-2 text-sm">
              <Hash size={13} className="text-gray-500" />
              <span className="text-gray-500">WBS:</span>
              <span className="text-gray-300 font-mono">{activity.wbs}</span>
            </div>
          )}

          {/* Float */}
          {activity.float_days !== null && activity.float_days !== undefined && (
            <div className="flex items-center gap-2 text-sm">
              <Clock size={13} className="text-gray-500" />
              <span className="text-gray-500">Float:</span>
              <span className={`font-semibold ${activity.float_days <= 0 ? "text-[#EF4444]" : activity.float_days <= 5 ? "text-[#EAB308]" : "text-[#22C55E]"}`}>
                {activity.float_days} days
              </span>
            </div>
          )}

          {/* Predecessors */}
          {activity.predecessor_ids && activity.predecessor_ids.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Predecessors</div>
              <div className="flex flex-wrap gap-2">
                {activity.predecessor_ids.map((id) => (
                  <span key={id} className="text-xs bg-[#0B0B0D] border border-[#1F1F25] text-gray-400 px-2 py-1 rounded font-mono">
                    {id}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Successor IDs */}
          {activity.successor_ids && activity.successor_ids.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Successors</div>
              <div className="flex flex-wrap gap-2">
                {activity.successor_ids.map((id) => (
                  <span key={id} className="text-xs bg-[#0B0B0D] border border-[#1F1F25] text-gray-400 px-2 py-1 rounded font-mono">
                    {id}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Risks for this activity */}
          {risks.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                <AlertTriangle size={12} className="inline mr-1.5 text-[#EF4444]" />
                Flagged Issues ({risks.length})
              </div>
              <div className="space-y-2">
                {risks.map((risk) => (
                  <div key={risk.id} className="bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-xl px-3 py-3">
                    <div className="text-xs font-bold text-[#EF4444] mb-1">{risk.title}</div>
                    <div className="text-xs text-gray-400">{risk.description}</div>
                    {risk.suggested_action && (
                      <div className="flex items-start gap-1.5 mt-2">
                        <ChevronRight size={12} className="text-[#F97316] shrink-0 mt-0.5" />
                        <div className="text-xs text-gray-300">{risk.suggested_action}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
