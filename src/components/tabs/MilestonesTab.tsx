"use client";

import { useEffect, useState } from "react";
import { Flag, CheckCircle, AlertTriangle, Clock, RefreshCw } from "lucide-react";
import type { ParsedActivity } from "@/types";

function milestoneStatus(activity: ParsedActivity) {
  if (activity.status === "complete") return { label: "Complete", color: "#22C55E", icon: CheckCircle };
  if (!activity.finish_date) return { label: "No date", color: "#6B7280", icon: Clock };
  const today = new Date();
  const due = new Date(activity.finish_date);
  const days = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (days < 0) return { label: `${Math.abs(days)}d overdue`, color: "#EF4444", icon: AlertTriangle };
  if (days === 0) return { label: "Due today", color: "#F97316", icon: AlertTriangle };
  if (days <= 7) return { label: `${days}d away`, color: "#EAB308", icon: Clock };
  return { label: `${days}d away`, color: "#22C55E", icon: Flag };
}

export default function MilestonesTab({ projectId }: { projectId: string }) {
  const [milestones, setMilestones] = useState<ParsedActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMilestones = async () => {
      setLoading(true);
      const res = await fetch(`/api/projects/${projectId}/activities?sort=finish_date&dir=asc`);
      if (res.ok) {
        const data: ParsedActivity[] = await res.json();
        setMilestones(data.filter((a) => a.milestone));
      }
      setLoading(false);
    };
    fetchMilestones();
  }, [projectId]);

  const upcoming = milestones.filter((m) => m.status !== "complete");
  const completed = milestones.filter((m) => m.status === "complete");

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <RefreshCw size={20} className="text-[#F97316] animate-spin" />
      </div>
    );
  }

  if (milestones.length === 0) {
    return (
      <div className="text-center py-16 text-gray-600">
        <Flag size={32} className="mx-auto mb-3 opacity-30" />
        <p>No milestones found.</p>
        <p className="text-sm mt-1">Milestones are identified as 0-duration activities or those marked as milestones in your schedule.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[#121217] border border-[#1F1F25] rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-white">{milestones.length}</div>
          <div className="text-xs text-gray-500">Total Milestones</div>
        </div>
        <div className="bg-[#22C55E]/10 border border-[#22C55E]/20 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-[#22C55E]">{completed.length}</div>
          <div className="text-xs text-gray-500">Achieved</div>
        </div>
        <div className="bg-[#EAB308]/10 border border-[#EAB308]/20 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-[#EAB308]">{upcoming.length}</div>
          <div className="text-xs text-gray-500">Upcoming</div>
        </div>
      </div>

      {/* Upcoming milestones */}
      {upcoming.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-300 mb-3">Upcoming Milestones</h3>
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-[#1F1F25]" />
            <div className="space-y-3">
              {upcoming.map((m) => {
                const ms = milestoneStatus(m);
                const Icon = ms.icon;
                return (
                  <div key={m.id} className="flex items-start gap-4">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10"
                      style={{ backgroundColor: `${ms.color}20`, border: `2px solid ${ms.color}` }}
                    >
                      <Icon size={16} style={{ color: ms.color }} />
                    </div>
                    <div className="flex-1 bg-[#121217] border border-[#1F1F25] rounded-xl p-4 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-white text-sm leading-tight">{m.activity_name}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {m.wbs && <span className="mr-2 font-mono">{m.wbs}</span>}
                            {m.area && <span>{m.area}</span>}
                          </div>
                        </div>
                        <div
                          className="text-xs font-bold px-2 py-1 rounded-lg shrink-0"
                          style={{ color: ms.color, backgroundColor: `${ms.color}20` }}
                        >
                          {ms.label}
                        </div>
                      </div>
                      {m.finish_date && (
                        <div className="text-xs text-gray-500 mt-2">
                          Target:{" "}
                          {new Date(m.finish_date).toLocaleDateString("en-US", {
                            weekday: "short", month: "short", day: "numeric", year: "numeric"
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Completed milestones */}
      {completed.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-500 mb-3">Achieved Milestones</h3>
          <div className="space-y-2">
            {completed.map((m) => (
              <div key={m.id} className="flex items-center gap-3 bg-[#121217] border border-[#1F1F25] rounded-xl px-4 py-3 opacity-60">
                <CheckCircle size={16} className="text-[#22C55E] shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">{m.activity_name}</div>
                  {m.actual_finish && (
                    <div className="text-xs text-gray-500">
                      Completed {new Date(m.actual_finish).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </div>
                  )}
                </div>
                <span className="text-xs bg-[#22C55E]/10 text-[#22C55E] px-2 py-0.5 rounded font-medium shrink-0">Done</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
