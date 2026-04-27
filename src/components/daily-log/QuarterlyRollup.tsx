"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, RefreshCw, Clock, AlertTriangle, Flag } from "lucide-react";
import RollupStatCard from "./RollupStatCard";

interface QuarterlySummary {
  quarter: string;
  firstDay: string;
  lastDay: string;
  totalLogDays: number;
  totalCrewHours: number;
  crewHoursByTrade: Record<string, number>;
  totalDelayDays: number;
  totalLostHours: number;
  milestoneHitRate: number | null;
  totalMilestones: number;
  milestonesOnTime: number;
  topDelays: Array<{ code: string; count: number }>;
  trendDirection: "improving" | "stable" | "declining";
  monthlyBreakdown: Array<{
    month: string;
    crewHours: number;
    delayDays: number;
    completedActivities: number;
    logDays: number;
  }>;
}

function offsetQuarter(q: string, offset: number): string {
  const match = q.match(/^(\d{4})-Q([1-4])$/);
  if (!match) return q;
  let year = parseInt(match[1]);
  let qNum = parseInt(match[2]) + offset;
  while (qNum > 4) { qNum -= 4; year++; }
  while (qNum < 1) { qNum += 4; year--; }
  return `${year}-Q${qNum}`;
}

function formatQuarter(q: string): string {
  const match = q.match(/^(\d{4})-Q([1-4])$/);
  if (!match) return q;
  return `Q${match[2]} ${match[1]}`;
}

const trendBadge = (direction: string) => {
  switch (direction) {
    case "improving": return <span className="text-[#22C55E] text-sm font-medium">📈 Improving</span>;
    case "declining": return <span className="text-[#EF4444] text-sm font-medium">📉 Declining</span>;
    default: return <span className="text-[color:var(--text-secondary)] text-sm font-medium">➡️ Stable</span>;
  }
};

export default function QuarterlyRollup({ projectId }: { projectId: string }) {
  const [quarter, setQuarter] = useState(() => {
    const today = new Date().toLocaleDateString("en-CA");
    const month = parseInt(today.substring(5, 7));
    const q = Math.ceil(month / 3);
    return `${today.substring(0, 4)}-Q${q}`;
  });
  const [data, setData] = useState<QuarterlySummary | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/daily-logs/quarterly-summary?quarter=${quarter}`);
      if (res.ok) setData(await res.json());
    } catch { /* ignore */ }
    setLoading(false);
  }, [projectId, quarter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const maxTrade = data
    ? Math.max(...Object.values(data.crewHoursByTrade), 1)
    : 1;

  return (
    <div>
      {/* Quarter selector */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => setQuarter(q => offsetQuarter(q, -1))}
          className="p-2 rounded-lg bg-[#1F1F25] text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
        >
          <ChevronLeft size={16} />
        </button>
        <div className="text-sm font-medium text-[color:var(--text-primary)]">{formatQuarter(quarter)}</div>
        <button
          onClick={() => setQuarter(q => offsetQuarter(q, 1))}
          className="p-2 rounded-lg bg-[#1F1F25] text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
        >
          <ChevronRight size={16} />
        </button>
        <div className="ml-3">{data && trendBadge(data.trendDirection)}</div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw size={20} className="text-[#F97316] animate-spin" />
        </div>
      ) : !data || data.totalLogDays === 0 ? (
        <div className="text-center py-12 text-[color:var(--text-muted)] text-sm">
          No logs found for this quarter.
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-6">
            <RollupStatCard
              label="Total Crew-Hours"
              value={data.totalCrewHours.toLocaleString()}
              icon={<Clock size={16} />}
              accent
            />
            <RollupStatCard
              label="Days Logged"
              value={data.totalLogDays}
            />
            <RollupStatCard
              label="Delay Days"
              value={data.totalDelayDays}
              icon={<AlertTriangle size={16} />}
            />
            <RollupStatCard
              label="Lost Hours"
              value={data.totalLostHours}
            />
            {data.milestoneHitRate !== null ? (
              <RollupStatCard
                label="Milestone Hit Rate"
                value={`${data.milestoneHitRate}%`}
                icon={<Flag size={16} />}
                subtext={`${data.milestonesOnTime}/${data.totalMilestones}`}
                accent
              />
            ) : (
              <RollupStatCard label="Milestones" value="—" icon={<Flag size={16} />} subtext="None due" />
            )}
          </div>

          {/* Milestone hit rate visual */}
          {data.milestoneHitRate !== null && (
            <div className="mb-6">
              <h3 className="text-sm font-bold text-[color:var(--text-primary)] mb-2">Milestone Performance</h3>
              <div className="bg-[#121217] rounded-xl p-4">
                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-16">
                    <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90">
                      <circle cx="18" cy="18" r="16" fill="none" stroke="#1F1F25" strokeWidth="3" />
                      <circle
                        cx="18" cy="18" r="16" fill="none"
                        stroke={data.milestoneHitRate >= 80 ? "#22C55E" : data.milestoneHitRate >= 50 ? "#EAB308" : "#EF4444"}
                        strokeWidth="3"
                        strokeDasharray={`${data.milestoneHitRate} ${100 - data.milestoneHitRate}`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-[color:var(--text-primary)]">
                      {data.milestoneHitRate}%
                    </div>
                  </div>
                  <div className="text-xs text-[color:var(--text-secondary)]">
                    {data.milestonesOnTime} of {data.totalMilestones} milestones completed on time
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Top delays */}
          {data.topDelays.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-bold text-[color:var(--text-primary)] mb-2">Top Delay Reasons</h3>
              <div className="flex gap-3 flex-wrap">
                {data.topDelays.map((d, i) => (
                  <div key={d.code} className="bg-[#121217] border border-[#1F1F25] rounded-lg px-4 py-3 text-center">
                    <div className="text-lg font-bold text-[color:var(--text-primary)]">#{i + 1}</div>
                    <div className="text-sm text-[#F97316] font-medium">{d.code}</div>
                    <div className="text-xs text-[color:var(--text-muted)]">{d.count} occurrences</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Crew-hours by trade */}
          {Object.keys(data.crewHoursByTrade).length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-bold text-[color:var(--text-primary)] mb-3">Crew-Hours by Trade</h3>
              <div className="space-y-2">
                {Object.entries(data.crewHoursByTrade)
                  .sort((a, b) => b[1] - a[1])
                  .map(([trade, hours]) => (
                    <div key={trade} className="flex items-center gap-3">
                      <div className="w-24 text-xs text-[color:var(--text-secondary)] text-right truncate shrink-0">{trade}</div>
                      <div className="flex-1 h-6 bg-[#1F1F25] rounded-md overflow-hidden">
                        <div
                          className="h-full bg-[#F97316] rounded-md transition-all duration-500"
                          style={{ width: `${Math.max((hours / maxTrade) * 100, 2)}%` }}
                        />
                      </div>
                      <div className="w-16 text-xs text-[color:var(--text-secondary)] text-right shrink-0">
                        {Math.round(hours).toLocaleString()}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Monthly breakdown */}
          <div className="mb-6">
            <h3 className="text-sm font-bold text-[color:var(--text-primary)] mb-2">Monthly Breakdown</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {data.monthlyBreakdown.map((m) => (
                <div key={m.month} className="bg-[#121217] border border-[#1F1F25] rounded-xl p-3">
                  <div className="text-xs text-[color:var(--text-muted)] mb-1">
                    {new Date(m.month + "-15T12:00:00Z").toLocaleDateString("en-US", { month: "long", timeZone: "UTC" })}
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between"><span className="text-[color:var(--text-secondary)]">Crew-Hours</span><span className="text-[color:var(--text-primary)] font-medium">{m.crewHours.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span className="text-[color:var(--text-secondary)]">Delay Days</span><span className="text-[color:var(--text-primary)]">{m.delayDays}</span></div>
                    <div className="flex justify-between"><span className="text-[color:var(--text-secondary)]">Completed</span><span className="text-[color:var(--text-primary)]">{m.completedActivities}</span></div>
                    <div className="flex justify-between"><span className="text-[color:var(--text-secondary)]">Logged Days</span><span className="text-[color:var(--text-primary)]">{m.logDays}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
