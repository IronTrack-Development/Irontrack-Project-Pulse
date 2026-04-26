"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, RefreshCw, Clock, AlertTriangle, Flag, TrendingUp } from "lucide-react";
import RollupStatCard from "./RollupStatCard";

interface QuarterSummary {
  quarter: string;
  logDays: number;
  crewHours: number;
  delayDays: number;
  lostHours: number;
  completedActivities: number;
  totalMilestones: number;
  milestonesOnTime: number;
  milestoneHitRate: number | null;
  trendDirection: "improving" | "stable" | "declining";
}

interface YearlySummary {
  year: string;
  totalLogDays: number;
  totalCrewHours: number;
  crewHoursByTrade: Record<string, number>;
  totalDelayDays: number;
  totalLostHours: number;
  overallDelayPercent: number;
  milestoneHitRate: number | null;
  totalMilestones: number;
  milestonesOnTime: number;
  topDelays: Array<{ code: string; count: number }>;
  quarterlySummaries: QuarterSummary[];
}

const trendIcon = (d: string) => {
  switch (d) {
    case "improving": return "📈";
    case "declining": return "📉";
    default: return "➡️";
  }
};

export default function YearlyRollup({ projectId }: { projectId: string }) {
  const [year, setYear] = useState(() => new Date().toLocaleDateString("en-CA").substring(0, 4));
  const [data, setData] = useState<YearlySummary | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/daily-logs/yearly-summary?year=${year}`);
      if (res.ok) setData(await res.json());
    } catch { /* ignore */ }
    setLoading(false);
  }, [projectId, year]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const maxQCrewHours = data
    ? Math.max(...data.quarterlySummaries.map(q => q.crewHours), 1)
    : 1;

  return (
    <div>
      {/* Year selector */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => setYear(y => String(parseInt(y) - 1))}
          className="p-2 rounded-lg bg-[#1F1F25] text-gray-400 hover:text-white transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
        >
          <ChevronLeft size={16} />
        </button>
        <div className="text-sm font-medium text-white">{year}</div>
        <button
          onClick={() => setYear(y => String(parseInt(y) + 1))}
          className="p-2 rounded-lg bg-[#1F1F25] text-gray-400 hover:text-white transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw size={20} className="text-[#F97316] animate-spin" />
        </div>
      ) : !data || data.totalLogDays === 0 ? (
        <div className="text-center py-12 text-gray-500 text-sm">
          No logs found for {year}.
        </div>
      ) : (
        <>
          {/* Annual stat cards */}
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
              subtext={`${data.overallDelayPercent}% of days`}
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
              <RollupStatCard label="Milestones" value="—" icon={<Flag size={16} />} />
            )}
          </div>

          {/* Quarter-over-quarter comparison */}
          <div className="mb-6">
            <h3 className="text-sm font-bold text-white mb-3">Quarter-over-Quarter</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {data.quarterlySummaries.map((q) => (
                <div
                  key={q.quarter}
                  className={`bg-[#121217] border rounded-xl p-4 ${
                    q.logDays > 0 ? "border-[#1F1F25]" : "border-[#1F1F25]/50 opacity-50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-bold text-white">{q.quarter.replace("-", " ")}</div>
                    {q.logDays > 0 && <span className="text-xs">{trendIcon(q.trendDirection)}</span>}
                  </div>
                  {q.logDays > 0 ? (
                    <>
                      {/* Mini bar for crew-hours relative to max quarter */}
                      <div className="h-2 bg-[#1F1F25] rounded-full mb-3 overflow-hidden">
                        <div
                          className="h-full bg-[#F97316] rounded-full transition-all duration-500"
                          style={{ width: `${(q.crewHours / maxQCrewHours) * 100}%` }}
                        />
                      </div>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Crew-Hours</span>
                          <span className="text-white font-medium">{q.crewHours.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Logged Days</span>
                          <span className="text-white">{q.logDays}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Delay Days</span>
                          <span className="text-white">{q.delayDays}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Completed</span>
                          <span className="text-white">{q.completedActivities}</span>
                        </div>
                        {q.milestoneHitRate !== null && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">Milestones</span>
                            <span className="text-white">{q.milestoneHitRate}% ({q.milestonesOnTime}/{q.totalMilestones})</span>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="text-xs text-gray-600 py-2">No data</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Top delays */}
          {data.topDelays.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-bold text-white mb-2">Top Delay Reasons (Annual)</h3>
              <div className="flex gap-3 flex-wrap">
                {data.topDelays.map((d, i) => (
                  <div key={d.code} className="bg-[#121217] border border-[#1F1F25] rounded-lg px-4 py-3 text-center">
                    <div className="text-lg font-bold text-white">#{i + 1}</div>
                    <div className="text-sm text-[#F97316] font-medium">{d.code}</div>
                    <div className="text-xs text-gray-500">{d.count} occurrences</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Crew-hours by trade (annual) */}
          {Object.keys(data.crewHoursByTrade).length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-bold text-white mb-3">Annual Crew-Hours by Trade</h3>
              <div className="space-y-2">
                {Object.entries(data.crewHoursByTrade)
                  .sort((a, b) => b[1] - a[1])
                  .map(([trade, hours]) => {
                    const maxTrade = Math.max(...Object.values(data.crewHoursByTrade), 1);
                    return (
                      <div key={trade} className="flex items-center gap-3">
                        <div className="w-24 text-xs text-gray-400 text-right truncate shrink-0">{trade}</div>
                        <div className="flex-1 h-6 bg-[#1F1F25] rounded-md overflow-hidden">
                          <div
                            className="h-full bg-[#F97316] rounded-md transition-all duration-500"
                            style={{ width: `${Math.max((hours / maxTrade) * 100, 2)}%` }}
                          />
                        </div>
                        <div className="w-16 text-xs text-gray-400 text-right shrink-0">
                          {Math.round(hours).toLocaleString()}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
