"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, ImagePlus, ChevronRight, ImageOff, FileText, Table2 } from "lucide-react";
import { FieldReport, FieldReportStatus } from "@/types";
import FieldReportDetail from "./FieldReportDetail";
import AddReportModal from "./AddReportModal";
import MultiAddFlow from "./MultiAddFlow";
import { t } from "@/lib/i18n";

interface Props {
  projectId: string;
  defaultView?: "list" | "detail";
}

const STATUS_COLORS: Record<string, string> = {
  open: "#F97316",
  in_progress: "#3B82F6",
  resolved: "#22C55E",
};

const PRIORITY_COLORS: Record<string, string> = {
  high: "#EF4444",
  medium: "#EAB308",
  low: "var(--text-muted)",
};

type FilterStatus = "all" | FieldReportStatus;

export default function FieldReportsDashboard({ projectId }: Props) {
  const [reports, setReports] = useState<FieldReport[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [selectedReport, setSelectedReport] = useState<FieldReport | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showMultiAdd, setShowMultiAdd] = useState(false);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    const params = filter !== "all" ? `?status=${filter}` : "";
    const res = await fetch(`/api/projects/${projectId}/field-reports${params}`);
    if (res.ok) {
      const data = await res.json();
      setReports(data.reports);
      setCount(data.count);
    }
    setLoading(false);
  }, [projectId, filter]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const getPhotoUrl = (path: string) => {
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
    return `${base}/storage/v1/object/public/field-report-photos/${path}`;
  };

  const openExport = (format: "pdf" | "csv") => {
    const endpoint = format === "pdf" ? "pdf" : "csv";
    window.open(`/api/projects/${projectId}/field-reports/${endpoint}`, "_blank", "noopener,noreferrer");
  };

  // Detail view
  if (selectedReport) {
    return (
      <FieldReportDetail
        projectId={projectId}
        report={selectedReport}
        onBack={() => {
          setSelectedReport(null);
          fetchReports();
        }}
        getPhotoUrl={getPhotoUrl}
      />
    );
  }

  // Multi-add flow
  if (showMultiAdd) {
    return (
      <MultiAddFlow
        projectId={projectId}
        onBack={() => {
          setShowMultiAdd(false);
          fetchReports();
        }}
        getPhotoUrl={getPhotoUrl}
      />
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-[color:var(--text-primary)]">{t('reports.reports')}</h2>
          <span className="px-2 py-0.5 bg-[var(--bg-tertiary)] text-[color:var(--text-secondary)] text-xs font-medium rounded-full">
            {count}
          </span>
        </div>
      </div>

      <div className="mb-4 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#F97316]">{t('reports.reportGenerator')}</p>
            <p className="mt-1 text-xs leading-5 text-[color:var(--text-secondary)]">{t('reports.reportGeneratorDesc')}</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => openExport("pdf")}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-[#F97316] px-3 py-2 text-xs font-black text-white"
            >
              <FileText size={14} />
              {t('reports.exportOpenPdf')}
            </button>
            <button
              type="button"
              onClick={() => openExport("csv")}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-white/10 bg-[var(--bg-tertiary)] px-3 py-2 text-xs font-bold text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]"
            >
              <Table2 size={14} />
              {t('reports.exportOpenCsv')}
            </button>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <div className="flex gap-1">
          {(["all", "open", "resolved"] as FilterStatus[]).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className="px-3 py-1.5 rounded-full text-xs font-medium transition-all min-h-[36px]"
              style={{
                background: filter === s ? "#F97316" : "var(--bg-tertiary)",
                color: filter === s ? "#fff" : "var(--text-secondary)",
              }}
            >
              {s === "all" ? t('reports.all') : s === "open" ? t('status.open') : t('status.resolved')}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-[#F97316] hover:bg-[#ea6c10] text-[color:var(--text-primary)] rounded-lg text-xs font-bold transition-colors min-h-[44px]"
        >
          <Plus size={14} />
          {t('reports.add')}
        </button>
        <button
          onClick={() => setShowMultiAdd(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] text-[color:var(--text-secondary)] rounded-lg text-xs font-medium transition-colors min-h-[44px]"
        >
          <ImagePlus size={14} />
          {t('reports.multiAdd')}
        </button>
      </div>

      {/* Report list */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-6 h-6 border-2 border-[#F97316] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-16">
          <ImageOff size={40} className="mx-auto mb-3 text-gray-600" />
          <p className="text-[color:var(--text-muted)] text-sm">{t('reports.noReportsYet')}</p>
          <p className="text-gray-600 text-xs mt-1">{t('reports.tapAdd')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {reports.map((report) => (
            <button
              key={report.id}
              onClick={() => setSelectedReport(report)}
              className="w-full flex items-center gap-3 p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl hover:border-[var(--border-secondary)] transition-colors min-h-[44px]"
            >
              {/* Photo thumbnail */}
              {report.photo_path ? (
                <img
                  src={getPhotoUrl(report.photo_path)}
                  alt=""
                  className="w-[60px] h-[60px] rounded-xl object-cover shrink-0"
                />
              ) : (
                <div className="w-[60px] h-[60px] rounded-xl bg-[var(--bg-tertiary)] flex items-center justify-center shrink-0">
                  <ImageOff size={20} className="text-gray-600" />
                </div>
              )}

              {/* Info */}
              <div className="flex-1 text-left min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-medium text-[color:var(--text-primary)] truncate">
                    #{report.report_number} — {report.title}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                    style={{
                      background: `${STATUS_COLORS[report.status]}20`,
                      color: STATUS_COLORS[report.status],
                    }}
                  >
                    {report.status === "in_progress" ? t('status.inProgress') : report.status === "resolved" ? t('status.resolved') : t('status.open')}
                  </span>
                  <span
                    className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                    style={{
                      background: `${PRIORITY_COLORS[report.priority]}20`,
                      color: PRIORITY_COLORS[report.priority],
                    }}
                  >
                    {report.priority === "high" ? t('coordination.high') : report.priority === "medium" ? t('coordination.medium') : t('coordination.low')}
                  </span>
                  {report.assigned_to && (
                    <span className="text-[10px] text-[color:var(--text-muted)] truncate">{report.assigned_to}</span>
                  )}
                </div>
              </div>

              <ChevronRight size={16} className="text-gray-600 shrink-0" />
            </button>
          ))}
        </div>
      )}

      {/* Add modal */}
      {showAddModal && (
        <AddReportModal
          projectId={projectId}
          onClose={() => setShowAddModal(false)}
          onCreated={(report) => {
            setShowAddModal(false);
            setSelectedReport(report);
            fetchReports();
          }}
        />
      )}
    </div>
  );
}
