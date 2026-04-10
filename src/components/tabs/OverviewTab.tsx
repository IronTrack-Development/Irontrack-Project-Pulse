"use client";

import { CheckCircle, AlertTriangle, TrendingDown, Clock, Flag, Activity, Zap } from "lucide-react";

interface Project {
  id: string;
  name: string;
  health_score: number;
  target_finish_date?: string;
  stats: {
    totalActivities: number;
    completeActivities: number;
    inProgressActivities: number;
    lateActivities: number;
    milestoneCount: number;
    highRisks: number;
    mediumRisks: number;
    completionPercent: number;
    daysToCompletion: number | null;
    nextMilestone: { activity_name: string; finish_date: string } | null;
  };
}

function healthColor(score: number) {
  if (score >= 85) return { color: "#22C55E", label: "On Track", ring: "rgba(34,197,94,0.15)" };
  if (score >= 70) return { color: "#EAB308", label: "Watch", ring: "rgba(234,179,8,0.15)" };
  return { color: "#EF4444", label: "At Risk", ring: "rgba(239,68,68,0.15)" };
}

export default function OverviewTab({ project }: { project: Project }) {
  const health = healthColor(project.health_score);
  const { stats } = project;

  const circumference = 2 * Math.PI * 42;
  const offset = circumference - (project.health_score / 100) * circumference;

  return (
    <div className="space-y-6">
      {/* Top row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Health score */}
        <div className="bg-[#121217] border border-[#1F1F25] rounded-2xl p-6 flex flex-col items-center justify-center">
          <div className="relative w-28 h-28 mb-4">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="42" fill="none" stroke="#1F1F25" strokeWidth="8" />
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke={health.color}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                style={{ filter: `drop-shadow(0 0 6px ${health.color})`, transition: "stroke-dashoffset 0.5s ease" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-white">{project.health_score}</span>
              <span className="text-[10px] text-gray-500">Health</span>
            </div>
          </div>
          <div
            className="text-sm font-bold px-3 py-1 rounded-full"
            style={{ color: health.color, backgroundColor: health.ring }}
          >
            {health.label}
          </div>
        </div>

        {/* Completion progress */}
        <div className="bg-[#121217] border border-[#1F1F25] rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle size={16} className="text-[#22C55E]" />
            <span className="text-sm font-semibold text-gray-300">Schedule Progress</span>
          </div>
          <div className="text-4xl font-bold text-white mb-1">{stats.completionPercent}%</div>
          <div className="text-xs text-gray-500 mb-4">
            {stats.completeActivities} of {stats.totalActivities} activities complete
          </div>
          <div className="h-2 bg-[#1F1F25] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#F97316] to-[#22C55E]"
              style={{ width: `${stats.completionPercent}%`, transition: "width 0.5s ease" }}
            />
          </div>
        </div>

        {/* Next milestone */}
        <div className="bg-[#121217] border border-[#1F1F25] rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Flag size={16} className="text-[#F97316]" />
            <span className="text-sm font-semibold text-gray-300">Next Milestone</span>
          </div>
          {stats.nextMilestone ? (
            <>
              <div className="text-white font-semibold mb-2 leading-tight">
                {stats.nextMilestone.activity_name}
              </div>
              <div className="text-sm text-gray-400">
                Due {new Date(stats.nextMilestone.finish_date).toLocaleDateString("en-US", {
                  weekday: "short", month: "short", day: "numeric", year: "numeric"
                })}
              </div>
              {(() => {
                const days = Math.ceil(
                  (new Date(stats.nextMilestone.finish_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                );
                return (
                  <div className={`mt-3 text-xs font-semibold px-2 py-1 rounded inline-block ${
                    days < 0 ? "bg-red-900/30 text-red-400" :
                    days <= 7 ? "bg-yellow-900/30 text-yellow-400" :
                    "bg-green-900/30 text-green-400"
                  }`}>
                    {days < 0 ? `${Math.abs(days)} days overdue` : days === 0 ? "Today" : `${days} days away`}
                  </div>
                );
              })()}
            </>
          ) : (
            <div className="text-gray-600 text-sm">No upcoming milestones</div>
          )}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#121217] border border-[#1F1F25] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity size={14} className="text-[#3B82F6]" />
            <span className="text-xs text-gray-500">In Progress</span>
          </div>
          <div className="text-2xl font-bold text-white">{stats.inProgressActivities}</div>
        </div>
        <div className="bg-[#121217] border border-[#1F1F25] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown size={14} className="text-[#EAB308]" />
            <span className="text-xs text-gray-500">Overdue</span>
          </div>
          <div className="text-2xl font-bold text-[#EAB308]">{stats.lateActivities}</div>
        </div>
        <div className="bg-[#121217] border border-[#1F1F25] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={14} className="text-[#EF4444]" />
            <span className="text-xs text-gray-500">High Risks</span>
          </div>
          <div className="text-2xl font-bold text-[#EF4444]">{stats.highRisks}</div>
        </div>
        <div className="bg-[#121217] border border-[#1F1F25] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={14} className="text-[#22C55E]" />
            <span className="text-xs text-gray-500">Days Left</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {stats.daysToCompletion !== null
              ? stats.daysToCompletion > 0
                ? stats.daysToCompletion
                : <span className="text-[#EF4444]">OVR</span>
              : "—"}
          </div>
        </div>
      </div>

      {/* Activity breakdown */}
      <div className="bg-[#121217] border border-[#1F1F25] rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-gray-300 mb-4">Activity Status Breakdown</h3>
        <div className="space-y-3">
          {[
            { label: "Complete", value: stats.completeActivities, color: "#22C55E" },
            { label: "In Progress", value: stats.inProgressActivities, color: "#3B82F6" },
            { label: "Not Started", value: stats.totalActivities - stats.completeActivities - stats.inProgressActivities - stats.lateActivities, color: "#6B7280" },
            { label: "Overdue", value: stats.lateActivities, color: "#EAB308" },
          ].map(({ label, value, color }) => (
            <div key={label}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-400">{label}</span>
                <span className="text-gray-300 font-medium">{value} / {stats.totalActivities}</span>
              </div>
              <div className="h-1.5 bg-[#1F1F25] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: stats.totalActivities > 0 ? `${(value / stats.totalActivities) * 100}%` : "0%",
                    backgroundColor: color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
