"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ClipboardList, ExternalLink, Trash2, RefreshCw,
  FileText, ChevronRight, AlertTriangle, CalendarDays,
  Users, CloudRain, Activity, Printer
} from "lucide-react";
import type { IssueReport, ReportStatus } from "@/types";

interface Props {
  projectId: string;
}

function statusBadge(status: ReportStatus) {
  switch (status) {
    case "draft":
      return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-700 text-gray-300">Draft</span>;
    case "generated":
      return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#22C55E]/15 text-[#22C55E]">Generated</span>;
    case "shared":
      return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#3B82F6]/15 text-[#3B82F6]">Shared</span>;
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

interface WeeklyLogData {
  weekStart: string;
  weekEnd: string;
  totalCrewHours: number;
  totalWorkers: number;
  activitiesCompleted: number;
  activitiesAdvanced: number;
  weatherImpactDays: number;
  delayCount: number;
  lostCrewHours: number;
  logCount: number;
}

function WeeklyLogReport({ projectId }: { projectId: string }) {
  const [data, setData] = useState<WeeklyLogData | null>(null);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/daily-logs/weekly-summary`);
      if (res.ok) {
        const json = await res.json();
        setData({
          weekStart: json.monday,
          weekEnd: json.sunday,
          totalCrewHours: json.totalCrewHours || 0,
          totalWorkers: json.avgDailyCrew || 0,
          activitiesCompleted: (json.activitiesCompleted || []).length,
          activitiesAdvanced: (json.activitiesAdvanced || []).length,
          weatherImpactDays: json.weatherImpactDays || 0,
          delayCount: json.totalDelayDays || 0,
          lostCrewHours: json.totalLostCrewHours || 0,
          logCount: json.totalLogDays || 0,
        });
        setGenerated(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const exportPdf = () => {
    // Open the printable weekly report HTML in a new tab
    window.open(`/api/projects/${projectId}/daily-logs/weekly-report-pdf`, "_blank");
  };

  if (!generated) {
    return (
      <div className="bg-[#121217] border border-[#1F1F25] rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <CalendarDays size={16} className="text-[#F97316]" />
          <h3 className="text-sm font-bold text-white">Weekly Log Report</h3>
        </div>
        <p className="text-xs text-gray-500 mb-4">
          Generate a summary from this week&apos;s daily logs — crew-hours, progress, weather, and issues.
        </p>
        <button
          onClick={generate}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-[#F97316] hover:bg-[#ea6c10] text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
        >
          {loading ? <RefreshCw size={14} className="animate-spin" /> : <CalendarDays size={14} />}
          Generate Weekly Report
        </button>
      </div>
    );
  }

  if (!data) return null;

  const weekLabel = `${new Date(data.weekStart + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${new Date(data.weekEnd + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;

  return (
    <div className="bg-[#121217] border border-[#1F1F25] rounded-2xl p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <CalendarDays size={16} className="text-[#F97316]" />
            <h3 className="text-sm font-bold text-white">Weekly Log Report</h3>
          </div>
          <div className="text-xs text-gray-500">{weekLabel} · {data.logCount} log{data.logCount !== 1 ? "s" : ""}</div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={generate}
            className="p-2 rounded-lg bg-[#1F1F25] text-gray-400 hover:text-white transition-colors"
            title="Refresh"
          >
            <RefreshCw size={14} />
          </button>
          <button
            onClick={exportPdf}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F97316] hover:bg-[#ea6c10] text-white rounded-lg text-xs font-bold transition-colors"
          >
            <Printer size={12} />
            Export PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#0B0B0D] border border-[#1F1F25] rounded-lg p-3 text-center">
          <Users size={14} className="mx-auto text-[#F97316] mb-1" />
          <div className="text-lg font-bold text-white">{data.totalCrewHours}</div>
          <div className="text-[10px] text-gray-500">Crew-Hours</div>
        </div>
        <div className="bg-[#0B0B0D] border border-[#1F1F25] rounded-lg p-3 text-center">
          <Activity size={14} className="mx-auto text-[#22C55E] mb-1" />
          <div className="text-lg font-bold text-white">{data.activitiesCompleted}</div>
          <div className="text-[10px] text-gray-500">Completed</div>
        </div>
        <div className="bg-[#0B0B0D] border border-[#1F1F25] rounded-lg p-3 text-center">
          <CloudRain size={14} className="mx-auto text-[#3B82F6] mb-1" />
          <div className="text-lg font-bold text-white">{data.weatherImpactDays}</div>
          <div className="text-[10px] text-gray-500">Weather Days</div>
        </div>
        <div className="bg-[#0B0B0D] border border-[#1F1F25] rounded-lg p-3 text-center">
          <AlertTriangle size={14} className="mx-auto text-[#EF4444] mb-1" />
          <div className="text-lg font-bold text-white">{data.lostCrewHours}</div>
          <div className="text-[10px] text-gray-500">Lost Hours</div>
        </div>
      </div>
    </div>
  );
}

export default function ReportsTab({ projectId }: Props) {
  const [reports, setReports] = useState<IssueReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/reports`);
      if (res.ok) {
        const data = await res.json();
        setReports(data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [projectId]);

  const handleDelete = async (reportId: string) => {
    if (!confirm("Delete this report? This cannot be undone.")) return;
    setDeletingId(reportId);
    try {
      await fetch(`/api/projects/${projectId}/reports/${reportId}`, { method: "DELETE" });
      setReports((prev) => prev.filter((r) => r.id !== reportId));
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <RefreshCw size={20} className="text-[#F97316] animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Weekly Log Report */}
      <WeeklyLogReport projectId={projectId} />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-white font-bold text-lg flex items-center gap-2">
            <ClipboardList size={18} className="text-[#F97316]" />
            Observations
          </h2>
          <p className="text-gray-500 text-sm mt-0.5">
            {reports.length} observation{reports.length !== 1 ? "s" : ""} generated
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchReports}
            className="p-2 rounded-lg bg-[#1F1F25] text-gray-400 hover:text-white transition-colors"
          >
            <RefreshCw size={15} />
          </button>
          <Link
            href={`/projects/${projectId}/report`}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#F97316] hover:bg-[#ea6c10] text-white rounded-lg text-xs font-bold transition-colors"
          >
            <ClipboardList size={14} />
            New Observation
          </Link>
        </div>
      </div>

      {reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 rounded-full bg-[#1F1F25] flex items-center justify-center mb-4">
            <FileText size={24} className="text-gray-600" />
          </div>
          <p className="text-gray-400 font-semibold mb-1">No observations yet</p>
          <p className="text-gray-600 text-sm mb-6">
            Start your first observation to document field conditions.
          </p>
          <Link
            href={`/projects/${projectId}/report`}
            className="flex items-center gap-2 bg-[#F97316] hover:bg-[#ea6c10] text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-colors"
          >
            <ClipboardList size={16} />
            New Observation
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <div
              key={report.id}
              className="bg-[#121217] border border-[#1F1F25] rounded-xl overflow-hidden"
            >
              <div className="p-4 flex items-start gap-3">
                {/* Icon */}
                <div className="w-10 h-10 rounded-lg bg-[#1e3a5f]/20 border border-[#1e3a5f]/30 flex items-center justify-center shrink-0">
                  <ClipboardList size={18} className="text-[#60a5fa]" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white font-bold text-sm">{report.report_number}</span>
                      {statusBadge(report.status)}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {(report.status === "generated" || report.status === "shared") && (
                        <a
                          href={`/projects/${projectId}/reports/${report.id}/print`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg bg-[#1F1F25] text-gray-400 hover:text-[#F97316] transition-colors"
                          title="View PDF"
                        >
                          <ExternalLink size={14} />
                        </a>
                      )}
                      <button
                        onClick={() => handleDelete(report.id)}
                        disabled={deletingId === report.id}
                        className="p-1.5 rounded-lg bg-[#1F1F25] text-gray-400 hover:text-[#EF4444] transition-colors disabled:opacity-40"
                        title="Delete observation"
                      >
                        {deletingId === report.id ? (
                          <RefreshCw size={14} className="animate-spin" />
                        ) : (
                          <Trash2 size={14} />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="text-gray-300 text-sm font-medium leading-tight mb-2">
                    {report.activity_name}
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <AlertTriangle size={10} className="text-[#EF4444]" />
                      {report.issue_count} issue{report.issue_count !== 1 ? "s" : ""}
                    </span>
                    <span>{formatDate(report.report_date)}</span>
                    {report.trade && <span>{report.trade}</span>}
                    {report.prepared_by && <span>By {report.prepared_by}</span>}
                  </div>
                </div>
              </div>

              {/* View link */}
              {(report.status === "generated" || report.status === "shared") && (
                <a
                  href={`/projects/${projectId}/reports/${report.id}/print`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 py-2.5 border-t border-[#1F1F25] text-xs text-gray-500 hover:text-[#F97316] hover:bg-[#F97316]/5 transition-all"
                >
                  View Observation
                  <ChevronRight size={12} />
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
