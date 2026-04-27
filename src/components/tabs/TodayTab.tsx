"use client";

import { useEffect, useState } from "react";
import { Zap, Clock, CheckCircle2, AlertTriangle, ChevronRight, RefreshCw, Users, CloudRain, Sun, CloudSun, Cloud, CloudLightning, Wind, Snowflake, Thermometer, Activity } from "lucide-react";
import type { ParsedActivity, DailyRisk } from "@/types";

interface YesterdayRecap {
  logDate: string;
  dateLabel: string;
  totalWorkers: number;
  totalCrewHours: number;
  weather: { conditions: string[]; high?: number; low?: number; impact: string };
  activitiesAdvanced: number;
  activitiesCompleted: number;
  delayCodes: string[];
  lostCrewHours: number;
}

interface TodayData {
  date: string;
  happeningToday: ParsedActivity[];
  recentStarts: ParsedActivity[];
  finishingSoon: ParsedActivity[];
  atRisk: ParsedActivity[];
  actionItems: string[];
  risks: DailyRisk[];
  yesterdayRecap: YesterdayRecap | null;
}

function statusColor(status: string) {
  switch (status) {
    case "complete": return "text-[#22C55E] bg-[#22C55E]/10";
    case "in_progress": return "text-[#3B82F6] bg-[#3B82F6]/10";
    case "late": return "text-[#EF4444] bg-[#EF4444]/10";
    default: return "text-[color:var(--text-secondary)] bg-[color:var(--bg-tertiary)]";
  }
}

function statusLabel(status: string) {
  switch (status) {
    case "in_progress": return "In Progress";
    case "complete": return "Complete";
    case "late": return "Overdue";
    case "not_started": return "Scheduled";
    default: return status;
  }
}

function ActivityCard({ activity }: { activity: ParsedActivity }) {
  return (
    <div className="bg-[#0B0B0D] border border-[#1F1F25] rounded-xl px-4 py-3 flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-[color:var(--text-primary)] truncate">{activity.activity_name}</div>
        <div className="flex items-center gap-3 mt-1">
          {activity.trade && (
            <span className="text-xs text-[#F97316]">{activity.trade}</span>
          )}
          {activity.area && (
            <span className="text-xs text-[color:var(--text-muted)]">{activity.area}</span>
          )}
          {activity.percent_complete > 0 && (
            <span className="text-xs text-[color:var(--text-secondary)]">{activity.percent_complete}% done</span>
          )}
        </div>
      </div>
      <span className={`text-xs px-2 py-0.5 rounded font-medium ${statusColor(activity.status)}`}>
        {statusLabel(activity.status)}
      </span>
    </div>
  );
}

export default function TodayTab({ projectId }: { projectId: string }) {
  const [data, setData] = useState<TodayData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    const clientDate = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD in local tz
    const res = await fetch(`/api/projects/${projectId}/today?clientDate=${clientDate}`);
    if (res.ok) setData(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [projectId]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <RefreshCw size={20} className="text-[#F97316] animate-spin" />
      </div>
    );
  }

  if (!data) return <div className="text-[color:var(--text-muted)] text-center py-12">No data available.</div>;

  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  const weatherIcon = (conditions: string[]) => {
    const c = conditions[0] || "";
    if (c.includes("Storm")) return <CloudLightning size={14} className="text-[#EAB308]" />;
    if (c.includes("Rain")) return <CloudRain size={14} className="text-[#3B82F6]" />;
    if (c.includes("Wind")) return <Wind size={14} className="text-[color:var(--text-secondary)]" />;
    if (c.includes("Freeze")) return <Snowflake size={14} className="text-[#60A5FA]" />;
    if (c.includes("Heat")) return <Thermometer size={14} className="text-[#EF4444]" />;
    if (c.includes("Overcast")) return <Cloud size={14} className="text-[color:var(--text-secondary)]" />;
    if (c.includes("Partly")) return <CloudSun size={14} className="text-[#EAB308]" />;
    return <Sun size={14} className="text-[#EAB308]" />;
  };

  const impactLabel = (impact: string) => {
    switch (impact) {
      case "full_stop": return { text: "Full Stop", color: "text-[#EF4444]" };
      case "partial_stop": return { text: "Partial Stop", color: "text-[#F97316]" };
      case "minor_slowdown": return { text: "Minor Slowdown", color: "text-[#EAB308]" };
      default: return { text: "No Impact", color: "text-[#22C55E]" };
    }
  };

  return (
    <div className="space-y-6">
      {/* Yesterday Recap */}
      {data.yesterdayRecap && (
        <div className="bg-[#121217] border border-[#1F1F25] rounded-2xl p-5">
          <div className="text-xs text-[color:var(--text-muted)] uppercase tracking-widest mb-2">Yesterday — {data.yesterdayRecap.dateLabel}</div>
          <div className="grid grid-cols-2 gap-3">
            {/* Crew */}
            <div className="flex items-center gap-2">
              <Users size={14} className="text-[#F97316] shrink-0" />
              <span className="text-sm text-[color:var(--text-secondary)]">
                {data.yesterdayRecap.totalWorkers} workers · {data.yesterdayRecap.totalCrewHours} crew-hours
              </span>
            </div>
            {/* Weather */}
            <div className="flex items-center gap-2">
              {weatherIcon(data.yesterdayRecap.weather.conditions)}
              <span className="text-sm text-[color:var(--text-secondary)]">
                {data.yesterdayRecap.weather.high != null ? `${data.yesterdayRecap.weather.high}°` : ""}
                {data.yesterdayRecap.weather.high != null && data.yesterdayRecap.weather.low != null ? "/" : ""}
                {data.yesterdayRecap.weather.low != null ? `${data.yesterdayRecap.weather.low}°` : ""}
                {data.yesterdayRecap.weather.conditions.length > 0 && (
                  <span className="ml-1 text-[color:var(--text-muted)]">{data.yesterdayRecap.weather.conditions[0]}</span>
                )}
              </span>
              <span className={`text-xs ${impactLabel(data.yesterdayRecap.weather.impact).color}`}>
                {impactLabel(data.yesterdayRecap.weather.impact).text}
              </span>
            </div>
            {/* Activities */}
            <div className="flex items-center gap-2">
              <Activity size={14} className="text-[#3B82F6] shrink-0" />
              <span className="text-sm text-[color:var(--text-secondary)]">
                {data.yesterdayRecap.activitiesAdvanced} advanced{data.yesterdayRecap.activitiesCompleted > 0 ? `, ${data.yesterdayRecap.activitiesCompleted} completed` : ""}
              </span>
            </div>
            {/* Issues */}
            <div className="flex items-center gap-2">
              {data.yesterdayRecap.delayCodes.length > 0 || data.yesterdayRecap.lostCrewHours > 0 ? (
                <>
                  <AlertTriangle size={14} className="text-[#EF4444] shrink-0" />
                  <span className="text-sm text-[color:var(--text-secondary)]">
                    {data.yesterdayRecap.delayCodes.length > 0
                      ? `${data.yesterdayRecap.delayCodes.length} delay${data.yesterdayRecap.delayCodes.length > 1 ? "s" : ""} (${data.yesterdayRecap.delayCodes[0]})`
                      : ""}
                    {data.yesterdayRecap.lostCrewHours > 0
                      ? `${data.yesterdayRecap.delayCodes.length > 0 ? " · " : ""}${data.yesterdayRecap.lostCrewHours} lost crew-hours`
                      : ""}
                  </span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={14} className="text-[#22C55E] shrink-0" />
                  <span className="text-sm text-[#22C55E]">No issues</span>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Date header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-[color:var(--text-muted)] uppercase tracking-widest mb-0.5">Today is</div>
          <div className="text-lg font-bold text-[color:var(--text-primary)]">{today}</div>
        </div>
        <button onClick={fetchData} className="p-2 rounded-lg bg-[#1F1F25] text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] transition-colors">
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Action items */}
      {data.actionItems.length > 0 && (
        <div className="bg-[#F97316]/10 border border-[#F97316]/20 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Zap size={16} className="text-[#F97316]" />
            <h3 className="font-bold text-[color:var(--text-primary)]">Action Items</h3>
            <span className="bg-[#F97316] text-[color:var(--text-primary)] text-xs font-bold px-1.5 py-0.5 rounded-full">
              {data.actionItems.length}
            </span>
          </div>
          <ul className="space-y-2">
            {data.actionItems.slice(0, 5).map((action, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-[color:var(--text-secondary)]">
                <ChevronRight size={14} className="text-[#F97316] shrink-0 mt-0.5" />
                {action}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* What's happening today */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Zap size={15} className="text-[#3B82F6]" />
          <h3 className="font-semibold text-[color:var(--text-primary)]">Happening Today</h3>
          <span className="text-xs text-[color:var(--text-muted)]">({data.happeningToday.length})</span>
        </div>
        {data.happeningToday.length === 0 ? (
          <p className="text-gray-600 text-sm bg-[#121217] border border-[#1F1F25] rounded-xl p-4">
            No activities scheduled for today.
          </p>
        ) : (
          <div className="space-y-2">
            {data.happeningToday.map((a) => <ActivityCard key={a.id} activity={a} />)}
          </div>
        )}
      </div>

      {/* At risk */}
      {data.atRisk.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={15} className="text-[#EF4444]" />
            <h3 className="font-semibold text-[color:var(--text-primary)]">At Risk</h3>
            <span className="text-xs text-[color:var(--text-muted)]">({data.atRisk.length})</span>
          </div>
          <div className="space-y-2">
            {data.atRisk.map((a) => <ActivityCard key={a.id} activity={a} />)}
          </div>
        </div>
      )}

      {/* Started recently */}
      {data.recentStarts.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 size={15} className="text-[#22C55E]" />
            <h3 className="font-semibold text-[color:var(--text-primary)]">Started Recently</h3>
            <span className="text-xs text-[color:var(--text-muted)]">(last 3 days)</span>
          </div>
          <div className="space-y-2">
            {data.recentStarts.map((a) => <ActivityCard key={a.id} activity={a} />)}
          </div>
        </div>
      )}

      {/* Finishing soon */}
      {data.finishingSoon.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Clock size={15} className="text-[#EAB308]" />
            <h3 className="font-semibold text-[color:var(--text-primary)]">Should Finish Soon</h3>
            <span className="text-xs text-[color:var(--text-muted)]">(next 3 days)</span>
          </div>
          <div className="space-y-2">
            {data.finishingSoon.map((a) => <ActivityCard key={a.id} activity={a} />)}
          </div>
        </div>
      )}

      {data.happeningToday.length === 0 && data.atRisk.length === 0 && data.recentStarts.length === 0 && data.finishingSoon.length === 0 && (
        <div className="text-center py-12 text-gray-600">
          <Zap size={32} className="mx-auto mb-3 opacity-30" />
          <p>No field activity data for today. Upload a schedule to get started.</p>
        </div>
      )}
    </div>
  );
}
