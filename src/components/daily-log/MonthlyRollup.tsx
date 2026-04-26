"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, RefreshCw, Clock, Users, CloudRain, AlertTriangle } from "lucide-react";
import RollupStatCard from "./RollupStatCard";

interface MonthlySummary {
  month: string;
  firstDay: string;
  lastDay: string;
  totalLogDays: number;
  totalCrewHours: number;
  avgDailyCrewSize: number;
  dailyTrend: Array<{ date: string; headcount: number; crewHours: number }>;
  activityCompletionByWeek: Array<{ weekStart: string; completedCount: number }>;
  recurringDelayCodes: Array<{ code: string; count: number }>;
  weatherImpactDays: number;
  weatherImpactPercent: number;
  totalDelayDays: number;
  totalLostHours: number;
  cumulativeCrewHours: Array<{ date: string; cumulative: number }>;
  monthOverMonth: {
    prevMonth: string;
    crewHoursDelta: number;
    completionDelta: number;
    delayDayDelta: number;
  } | null;
}

function offsetMonth(monthStr: string, offset: number): string {
  const d = new Date(monthStr + "-15T12:00:00Z");
  d.setUTCMonth(d.getUTCMonth() + offset);
  return d.toISOString().substring(0, 7);
}

function formatMonth(monthStr: string): string {
  const d = new Date(monthStr + "-15T12:00:00Z");
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
}

export default function MonthlyRollup({ projectId }: { projectId: string }) {
  const [month, setMonth] = useState(() => new Date().toLocaleDateString("en-CA").substring(0, 7));
  const [data, setData] = useState<MonthlySummary | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/daily-logs/monthly-summary?month=${month}`);
      if (res.ok) setData(await res.json());
    } catch { /* ignore */ }
    setLoading(false);
  }, [projectId, month]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Simple SVG line chart for crew utilization
  const renderTrendChart = () => {
    if (!data || data.dailyTrend.length < 2) return null;
    const trend = data.dailyTrend;
    const maxHC = Math.max(...trend.map(d => d.headcount), 1);
    const w = 600;
    const h = 120;
    const padding = 20;
    const chartW = w - padding * 2;
    const chartH = h - padding * 2;

    const points = trend.map((d, i) => {
      const x = padding + (i / (trend.length - 1)) * chartW;
      const y = padding + chartH - (d.headcount / maxHC) * chartH;
      return `${x},${y}`;
    });

    const areaPoints = [
      `${padding},${padding + chartH}`,
      ...points,
      `${padding + chartW},${padding + chartH}`,
    ].join(" ");

    return (
      <div className="mb-6">
        <h3 className="text-sm font-bold text-white mb-3">Daily Crew Size</h3>
        <div className="bg-[var(--bg-secondary)] rounded-xl p-3 overflow-x-auto">
          <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ maxHeight: 160 }}>
            <polygon points={areaPoints} fill="#F97316" opacity="0.1" />
            <polyline points={points.join(" ")} fill="none" stroke="#F97316" strokeWidth="2" />
            {trend.map((d, i) => {
              const x = padding + (i / (trend.length - 1)) * chartW;
              const y = padding + chartH - (d.headcount / maxHC) * chartH;
              return <circle key={i} cx={x} cy={y} r="3" fill="#F97316" />;
            })}
            {/* Y-axis labels */}
            <text x={padding - 4} y={padding + 4} fill="#666" fontSize="10" textAnchor="end">{maxHC}</text>
            <text x={padding - 4} y={padding + chartH + 4} fill="#666" fontSize="10" textAnchor="end">0</text>
            {/* X-axis: first and last date */}
            <text x={padding} y={h - 2} fill="#666" fontSize="9" textAnchor="start">
              {trend[0].date.substring(5)}
            </text>
            <text x={padding + chartW} y={h - 2} fill="#666" fontSize="9" textAnchor="end">
              {trend[trend.length - 1].date.substring(5)}
            </text>
          </svg>
        </div>
      </div>
    );
  };

  const deltaLabel = (v: number, suffix = "") => {
    if (v > 0) return <span className="text-[#22C55E]">+{v.toLocaleString()}{suffix}</span>;
    if (v < 0) return <span className="text-[#EF4444]">{v.toLocaleString()}{suffix}</span>;
    return <span className="text-gray-500">—</span>;
  };

  return (
    <div>
      {/* Month selector */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => setMonth(m => offsetMonth(m, -1))}
          className="p-2 rounded-lg bg-[var(--bg-tertiary)] text-gray-400 hover:text-white transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
        >
          <ChevronLeft size={16} />
        </button>
        <div className="text-sm font-medium text-white">{formatMonth(month)}</div>
        <button
          onClick={() => setMonth(m => offsetMonth(m, 1))}
          className="p-2 rounded-lg bg-[var(--bg-tertiary)] text-gray-400 hover:text-white transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
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
          No logs found for this month.
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
              label="Avg Daily Crew"
              value={data.avgDailyCrewSize}
              icon={<Users size={16} />}
            />
            <RollupStatCard
              label="Weather Impact"
              value={`${data.weatherImpactDays} (${data.weatherImpactPercent}%)`}
              icon={<CloudRain size={16} />}
            />
            <RollupStatCard
              label="Delay Days"
              value={data.totalDelayDays}
              icon={<AlertTriangle size={16} />}
            />
            <RollupStatCard
              label="Days Logged"
              value={data.totalLogDays}
            />
          </div>

          {/* Month-over-month comparison */}
          {data.monthOverMonth && (
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-4 mb-6">
              <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">vs Previous Month</h3>
              <div className="flex flex-wrap gap-6 text-sm">
                <div>
                  <span className="text-gray-400 mr-2">Crew-Hours:</span>
                  {deltaLabel(data.monthOverMonth.crewHoursDelta)}
                </div>
                <div>
                  <span className="text-gray-400 mr-2">Completions:</span>
                  {deltaLabel(data.monthOverMonth.completionDelta)}
                </div>
                <div>
                  <span className="text-gray-400 mr-2">Delay Days:</span>
                  {deltaLabel(data.monthOverMonth.delayDayDelta)}
                </div>
              </div>
            </div>
          )}

          {/* Crew utilization trend chart */}
          {renderTrendChart()}

          {/* Activity completions by week */}
          {data.activityCompletionByWeek.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-bold text-white mb-2">Completions by Week</h3>
              <div className="flex gap-3 flex-wrap">
                {data.activityCompletionByWeek.map((w) => (
                  <div key={w.weekStart} className="bg-[var(--bg-secondary)] rounded-lg px-3 py-2 text-center">
                    <div className="text-xs text-gray-500">
                      {new Date(w.weekStart + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </div>
                    <div className="text-lg font-bold text-white">{w.completedCount}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Delay codes table */}
          {data.recurringDelayCodes.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-bold text-white mb-2">Recurring Delay Codes</h3>
              <div className="bg-[var(--bg-secondary)] rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-[var(--border-primary)]">
                      <th className="text-left text-gray-500 px-3 py-2 font-medium">Code</th>
                      <th className="text-right text-gray-500 px-3 py-2 font-medium">Occurrences</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recurringDelayCodes.map((d) => (
                      <tr key={d.code} className="border-b border-[var(--border-primary)] last:border-0">
                        <td className="px-3 py-2 text-gray-300">{d.code}</td>
                        <td className="px-3 py-2 text-gray-400 text-right">{d.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
