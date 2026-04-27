"use client";

import { useEffect, useState } from "react";
import { Loader2, TrendingUp, Calendar, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";

interface ActivityActual {
  activityId: string;
  actualPercent: number;
  plannedPercent: number;
  delta: number;
  activityName: string;
  trade: string;
  history: { logDate: string; pctBefore: number; pctAfter: number; note: string | null }[];
}

interface ProgressData {
  totalActivities: number;
  completeActivities: number;
  percentComplete: number;
  targetFinishDate: string | null;
  daysRemaining: number | null;
  activityActuals?: ActivityActual[];
}

interface ProgressTabProps {
  projectId: string;
}

function DeltaBadge({ delta }: { delta: number }) {
  if (delta === 0) return <span className="text-xs text-[color:var(--text-muted)]">On track</span>;
  if (delta > 0) return <span className="text-xs text-[#22C55E] font-semibold">+{delta}% ahead</span>;
  return <span className="text-xs text-[#EF4444] font-semibold">{delta}% behind</span>;
}

function ActivityProgressCard({ activity }: { activity: ActivityActual }) {
  const [expanded, setExpanded] = useState(false);
  const actualClamped = Math.min(100, Math.max(0, activity.actualPercent));
  const plannedClamped = Math.min(100, Math.max(0, activity.plannedPercent));

  return (
    <div className="bg-[#121217] border border-[#1F1F25] rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left px-4 py-3 hover:bg-[#1F1F25]/30 transition-colors"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-[color:var(--text-primary)] truncate">{activity.activityName}</div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-[#F97316]">{activity.trade}</span>
              <DeltaBadge delta={activity.delta} />
            </div>
          </div>
          {activity.history.length > 0 && (
            expanded
              ? <ChevronUp size={14} className="text-[color:var(--text-muted)] shrink-0" />
              : <ChevronDown size={14} className="text-[color:var(--text-muted)] shrink-0" />
          )}
        </div>
        {/* Dual progress bars */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-600 w-14 shrink-0">Planned</span>
            <div className="flex-1 bg-[#0B0B0D] rounded-full h-2 overflow-hidden">
              <div
                className="h-full rounded-full bg-gray-600 transition-all duration-500"
                style={{ width: `${plannedClamped}%` }}
              />
            </div>
            <span className="text-[10px] font-mono text-[color:var(--text-muted)] w-8 text-right">{activity.plannedPercent}%</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-600 w-14 shrink-0">Actual</span>
            <div className="flex-1 bg-[#0B0B0D] rounded-full h-2 overflow-hidden">
              <div
                className="h-full rounded-full bg-[#F97316] transition-all duration-500"
                style={{ width: `${actualClamped}%` }}
              />
            </div>
            <span className="text-[10px] font-mono text-[#F97316] w-8 text-right">{activity.actualPercent}%</span>
          </div>
        </div>
      </button>

      {/* History drawer */}
      {expanded && activity.history.length > 0 && (
        <div className="border-t border-[#1F1F25] px-4 py-3 space-y-2">
          <div className="text-[10px] text-gray-600 uppercase tracking-wide mb-1">Log History</div>
          {activity.history.map((h, i) => {
            const delta = h.pctAfter - h.pctBefore;
            const dateLabel = new Date(h.logDate + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
            return (
              <div key={i} className="flex items-start gap-2 text-xs">
                <span className="text-[color:var(--text-muted)] shrink-0 w-14">{dateLabel}</span>
                <span className="text-[color:var(--text-secondary)]">
                  {h.pctBefore}% → {h.pctAfter}%
                  <span className={delta > 0 ? " text-[#22C55E]" : delta < 0 ? " text-[#EF4444]" : " text-[color:var(--text-muted)]"}>
                    {" "}({delta > 0 ? "+" : ""}{delta}%)
                  </span>
                </span>
                {h.note && (
                  <span className="text-gray-600 italic truncate">&ldquo;{h.note}&rdquo;</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function ProgressTab({ projectId }: ProgressTabProps) {
  const [data, setData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProgress = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/projects/${projectId}/progress`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (error) {
        console.error("Failed to fetch progress:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={24} className="text-[#F97316] animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-[#121217] border border-[#1F1F25] rounded-2xl p-12 text-center">
        <div className="text-[color:var(--text-secondary)] text-sm">Unable to load progress data</div>
      </div>
    );
  }

  const progressColor = data.percentComplete >= 75 
    ? "#22C55E" 
    : data.percentComplete >= 50 
    ? "#F97316" 
    : "#EF4444";

  return (
    <div className="space-y-6">
      {/* Large percent complete display */}
      <div className="bg-[#121217] border border-[#1F1F25] rounded-2xl p-8 text-center">
        <div className="mb-4">
          <TrendingUp size={40} className="mx-auto text-[#F97316]" />
        </div>
        <div className="text-6xl font-bold mb-2" style={{ color: progressColor }}>
          {data.percentComplete}%
        </div>
        <div className="text-sm text-[color:var(--text-muted)]">Project Complete</div>
      </div>

      {/* Progress bar visualization */}
      <div className="bg-[#121217] border border-[#1F1F25] rounded-xl p-6">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-[color:var(--text-muted)]">Progress</span>
            <span className="text-xs font-mono text-[color:var(--text-secondary)]">{data.percentComplete}%</span>
          </div>
          <div className="w-full bg-[#0B0B0D] rounded-full h-3 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${data.percentComplete}%`,
                backgroundColor: progressColor,
              }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="bg-[#0B0B0D] border border-[#1F1F25] rounded-lg p-4">
            <CheckCircle2 size={16} className="text-[#22C55E] mb-2" />
            <div className="text-2xl font-bold text-[color:var(--text-primary)]">{data.completeActivities}</div>
            <div className="text-xs text-[color:var(--text-muted)]">Complete</div>
          </div>
          <div className="bg-[#0B0B0D] border border-[#1F1F25] rounded-lg p-4">
            <CheckCircle2 size={16} className="text-gray-600 mb-2" />
            <div className="text-2xl font-bold text-[color:var(--text-primary)]">{data.totalActivities - data.completeActivities}</div>
            <div className="text-xs text-[color:var(--text-muted)]">Remaining</div>
          </div>
        </div>
      </div>

      {/* Actual vs Planned — from daily logs */}
      {data.activityActuals && data.activityActuals.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={15} className="text-[#F97316]" />
            <h3 className="font-semibold text-[color:var(--text-primary)]">Actual vs Planned</h3>
            <span className="text-xs text-[color:var(--text-muted)]">({data.activityActuals.length} tracked)</span>
          </div>
          <div className="flex items-center gap-4 mb-3 text-[10px] text-gray-600">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-1.5 rounded-full bg-gray-600" /> Planned
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-1.5 rounded-full bg-[#F97316]" /> Actual (from logs)
            </div>
          </div>
          <div className="space-y-2">
            {data.activityActuals.map((a) => (
              <ActivityProgressCard key={a.activityId} activity={a} />
            ))}
          </div>
        </div>
      )}

      {/* Breakdown */}
      <div className="bg-[#121217] border border-[#1F1F25] rounded-xl p-6">
        <div className="text-sm font-semibold text-[color:var(--text-primary)] mb-4">Activity Breakdown</div>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-[color:var(--text-secondary)]">Total Activities</span>
            <span className="font-semibold text-[color:var(--text-primary)]">{data.totalActivities}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[color:var(--text-secondary)]">Complete</span>
            <span className="font-semibold text-[#22C55E]">{data.completeActivities}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[color:var(--text-secondary)]">In Progress</span>
            <span className="font-semibold text-[#F97316]">{data.totalActivities - data.completeActivities}</span>
          </div>
        </div>
      </div>

      {/* Target finish date and countdown */}
      {data.targetFinishDate && (
        <div className="bg-[#121217] border border-[#1F1F25] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Calendar size={20} className="text-[#F97316]" />
            <div className="text-sm font-semibold text-[color:var(--text-primary)]">Target Completion</div>
          </div>
          <div className="text-2xl font-bold text-[color:var(--text-primary)] mb-1">
            {new Date(data.targetFinishDate).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </div>
          {data.daysRemaining !== null && (
            <div className={`text-sm font-semibold ${
              data.daysRemaining < 0 
                ? "text-[#EF4444]" 
                : data.daysRemaining < 30 
                ? "text-[#F97316]" 
                : "text-[#22C55E]"
            }`}>
              {data.daysRemaining < 0 
                ? `${Math.abs(data.daysRemaining)} days overdue` 
                : `${data.daysRemaining} days remaining`}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
