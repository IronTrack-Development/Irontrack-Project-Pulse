"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  CalendarDays, Plus, RefreshCw, CheckCircle2, Edit3, Lock,
  Thermometer, Users, AlertTriangle, Image as ImageIcon,
} from "lucide-react";
import type { DailyLog, DailyLogWeather, DailyLogCrewEntry } from "@/types";

interface DailyLogListProps {
  projectId: string;
}

function statusBadge(status: string) {
  switch (status) {
    case "submitted":
      return (
        <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-[#22C55E]/10 text-[#22C55E]">
          <CheckCircle2 size={10} />
          Submitted
        </span>
      );
    case "locked":
      return (
        <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-gray-700/50 text-[color:var(--text-secondary)]">
          <Lock size={10} />
          Locked
        </span>
      );
    default:
      return (
        <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-[#F97316]/10 text-[#F97316]">
          <Edit3 size={10} />
          Draft
        </span>
      );
  }
}

function LogCard({ log, projectId }: { log: DailyLog; projectId: string }) {
  const weather: DailyLogWeather = log.weather || { conditions: [], impact: "none" };
  const crew: DailyLogCrewEntry[] = log.crew || [];
  const totalHeadcount = crew.reduce((sum, c) => sum + (c.headcount || 0), 0);
  const date = new Date(log.log_date + "T12:00:00");

  return (
    <Link
      href={`/projects/${projectId}/daily-log?date=${log.log_date}&logId=${log.id}`}
      className="block bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-4 hover:border-[var(--border-secondary)] transition-colors"
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="text-sm font-medium text-[color:var(--text-primary)]">
            {date.toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
          </div>
          <div className="text-xs text-[color:var(--text-muted)] mt-0.5">
            {log.superintendent || "Superintendent"}
          </div>
        </div>
        {statusBadge(log.status)}
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-[color:var(--text-secondary)] mt-2">
        {(weather.high || weather.low) && (
          <span className="flex items-center gap-1">
            <Thermometer size={12} className="text-[#F97316]" />
            {weather.high ?? "--"}°/{weather.low ?? "--"}°
          </span>
        )}
        {totalHeadcount > 0 && (
          <span className="flex items-center gap-1">
            <Users size={12} className="text-[#3B82F6]" />
            {totalHeadcount} crew
          </span>
        )}
        {(log.delay_codes || []).length > 0 && (
          <span className="flex items-center gap-1">
            <AlertTriangle size={12} className="text-[#EAB308]" />
            {log.delay_codes.length} delays
          </span>
        )}
      </div>
    </Link>
  );
}

export default function DailyLogList({ projectId }: DailyLogListProps) {
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/daily-logs?limit=50`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
        setTotal(data.total || 0);
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, [projectId]);

  const today = new Date().toLocaleDateString("en-CA");
  const hasTodayLog = logs.some((l) => l.log_date === today);

  return (
    <div>
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-[color:var(--text-primary)] flex items-center gap-2">
          <CalendarDays size={18} className="text-[#F97316]" />
          Daily Logs
          {total > 0 && <span className="text-xs text-[color:var(--text-muted)] font-normal">({total})</span>}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchLogs}
            className="p-2 rounded-lg bg-[var(--bg-tertiary)] text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
          <Link
            href={`/projects/${projectId}/daily-log?date=${today}`}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#F97316] hover:bg-[#ea6c10]
              text-[color:var(--text-primary)] rounded-xl text-sm font-medium transition-colors min-h-[40px]"
          >
            <Plus size={14} />
            {hasTodayLog ? "Edit Today" : "New Log"}
          </Link>
        </div>
      </div>

      {/* Log list */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw size={20} className="text-[#F97316] animate-spin" />
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-12">
          <CalendarDays size={32} className="mx-auto mb-3 text-gray-700" />
          <p className="text-sm text-[color:var(--text-muted)] mb-1">No daily logs yet</p>
          <p className="text-xs text-gray-600">Start your first daily log to track field conditions</p>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <LogCard key={log.id} log={log} projectId={projectId} />
          ))}
        </div>
      )}
    </div>
  );
}
