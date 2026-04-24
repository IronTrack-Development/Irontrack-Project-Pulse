"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ChevronLeft, ChevronRight, RefreshCw, Clock, Users, CloudRain,
  TrendingUp, AlertTriangle, FileText,
} from "lucide-react";
import RollupStatCard from "./RollupStatCard";

interface WeeklySummary {
  week: string;
  monday: string;
  sunday: string;
  mondayLabel: string;
  sundayLabel: string;
  totalLogDays: number;
  totalCrewHours: number;
  avgDailyCrew: number;
  crewHoursByTrade: Record<string, number>;
  avgHeadcountByTrade: Record<string, number>;
  activitiesCompleted: Array<{ activityName: string; trade: string | null }>;
  activitiesAdvanced: Array<{ activityName: string; trade: string | null; delta: number; pctAfter: number }>;
  weatherImpactDays: number;
  totalDelayDays: number;
  totalLostCrewHours: number;
  delayBreakdown: Record<string, number>;
  photoCount: number;
  openIssues: Array<{ date: string; narrative: string }>;
  narrative: string;
}

function getISOWeekFromDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00Z");
  const dayOfWeek = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayOfWeek);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

function offsetWeek(weekStr: string, offset: number): string {
  const match = weekStr.match(/^(\d{4})-W(\d{2})$/);
  if (!match) return weekStr;
  const year = parseInt(match[1]);
  const week = parseInt(match[2]);
  // Get Monday of this week, then offset by 7 days
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const dayOfWeek = jan4.getUTCDay() || 7;
  const monday = new Date(jan4);
  monday.setUTCDate(jan4.getUTCDate() - dayOfWeek + 1 + (week - 1) * 7);
  monday.setUTCDate(monday.getUTCDate() + offset * 7);
  return getISOWeekFromDate(monday.toISOString().split("T")[0]);
}

export default function WeeklyRollup({ projectId }: { projectId: string }) {
  const [week, setWeek] = useState(() => {
    const today = new Date().toLocaleDateString("en-CA");
    return getISOWeekFromDate(today);
  });
  const [data, setData] = useState<WeeklySummary | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/daily-logs/weekly-summary?week=${week}`);
      if (res.ok) setData(await res.json());
    } catch { /* ignore */ }
    setLoading(false);
  }, [projectId, week]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const maxCrewHours = data
    ? Math.max(...Object.values(data.crewHoursByTrade), 1)
    : 1;

  return (
    <div>
      {/* Week selector */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => setWeek((w) => offsetWeek(w, -1))}
          className="p-2 rounded-lg bg-[#1F1F25] text-gray-400 hover:text-white transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
        >
          <ChevronLeft size={16} />
        </button>
        <div className="text-sm font-medium text-white">
          {data ? `Week of ${data.mondayLabel}` : week}
          {data && <span className="text-gray-500 ml-1">– {data.sundayLabel}</span>}
        </div>
        <button
          onClick={() => setWeek((w) => offsetWeek(w, 1))}
          className="p-2 rounded-lg bg-[#1F1F25] text-gray-400 hover:text-white transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
        >
          <ChevronRight size={16} />
        </button>
        <a
          href={`/api/projects/${projectId}/daily-logs/weekly-report-pdf?week=${week}`}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto flex items-center gap-1.5 px-3 py-2 bg-[#1F1F25] hover:bg-[#2a2a35] text-gray-300 rounded-xl text-xs font-medium transition-colors min-h-[40px]"
        >
          <FileText size={14} />
          Export PDF
        </a>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw size={20} className="text-[#F97316] animate-spin" />
        </div>
      ) : !data || data.totalLogDays === 0 ? (
        <div className="text-center py-12 text-gray-500 text-sm">
          No logs found for this week.
        </div>
      ) : (
        <>
          {/* Narrative */}
          <div className="bg-[#1F1F25] border-l-3 border-[#F97316] rounded-lg p-3 mb-4 text-sm text-gray-300 italic" style={{ borderLeftWidth: 3 }}>
            {data.narrative}
          </div>

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
              value={data.avgDailyCrew}
              icon={<Users size={16} />}
            />
            <RollupStatCard
              label="Weather Impact"
              value={`${data.weatherImpactDays} day${data.weatherImpactDays !== 1 ? "s" : ""}`}
              icon={<CloudRain size={16} />}
            />
            <RollupStatCard
              label="Activities Advanced"
              value={data.activitiesAdvanced.length}
              icon={<TrendingUp size={16} />}
            />
            <RollupStatCard
              label="Lost Hours"
              value={data.totalLostCrewHours}
              icon={<AlertTriangle size={16} />}
            />
          </div>

          {/* Crew-hours by trade bar chart */}
          {Object.keys(data.crewHoursByTrade).length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-bold text-white mb-3">Crew-Hours by Trade</h3>
              <div className="space-y-2">
                {Object.entries(data.crewHoursByTrade)
                  .sort((a, b) => b[1] - a[1])
                  .map(([trade, hours]) => (
                    <div key={trade} className="flex items-center gap-3">
                      <div className="w-24 text-xs text-gray-400 text-right truncate shrink-0">{trade}</div>
                      <div className="flex-1 h-6 bg-[#1F1F25] rounded-md overflow-hidden">
                        <div
                          className="h-full bg-[#F97316] rounded-md transition-all duration-500"
                          style={{ width: `${Math.max((hours / maxCrewHours) * 100, 2)}%` }}
                        />
                      </div>
                      <div className="w-16 text-xs text-gray-400 text-right shrink-0">
                        {Math.round(hours).toLocaleString()}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Activities completed */}
          {data.activitiesCompleted.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-bold text-white mb-2">
                ✅ Activities Completed ({data.activitiesCompleted.length})
              </h3>
              <div className="space-y-1">
                {data.activitiesCompleted.map((a, i) => (
                  <div key={i} className="text-xs text-gray-300 bg-[#121217] rounded-lg px-3 py-2 flex justify-between">
                    <span>{a.activityName}</span>
                    {a.trade && <span className="text-gray-500">{a.trade}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Activities advanced */}
          {data.activitiesAdvanced.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-bold text-white mb-2">
                📈 Activities Advanced ({data.activitiesAdvanced.length})
              </h3>
              <div className="space-y-1">
                {data.activitiesAdvanced.map((a, i) => (
                  <div key={i} className="text-xs text-gray-300 bg-[#121217] rounded-lg px-3 py-2 flex justify-between">
                    <span>{a.activityName}</span>
                    <span className="text-[#F97316] font-medium">+{a.delta}% → {a.pctAfter}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Delay breakdown */}
          {Object.keys(data.delayBreakdown).length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-bold text-white mb-2">Delay Breakdown</h3>
              <div className="bg-[#121217] rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-[#1F1F25]">
                      <th className="text-left text-gray-500 px-3 py-2 font-medium">Reason</th>
                      <th className="text-right text-gray-500 px-3 py-2 font-medium">Occurrences</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(data.delayBreakdown)
                      .sort((a, b) => b[1] - a[1])
                      .map(([code, count]) => (
                        <tr key={code} className="border-b border-[#1F1F25] last:border-0">
                          <td className="px-3 py-2 text-gray-300">{code}</td>
                          <td className="px-3 py-2 text-gray-400 text-right">{count}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              <div className="text-[11px] text-gray-500 mt-2">
                {data.totalDelayDays} delay day{data.totalDelayDays !== 1 ? "s" : ""} · {data.totalLostCrewHours} lost crew-hours · {data.photoCount} photos
              </div>
            </div>
          )}

          {/* Open issues */}
          {data.openIssues.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-bold text-white mb-2">⚠️ Open Issues</h3>
              <div className="space-y-1">
                {data.openIssues.map((issue, i) => (
                  <div key={i} className="text-xs text-gray-300 bg-[#121217] rounded-lg px-3 py-2">
                    <span className="text-gray-500 mr-2">{new Date(issue.date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                    {issue.narrative}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
