"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Loader2,
  AlertCircle,
  ArrowLeft,
  FolderOpen,
  ChevronDown,
  Users,
  Timer,
  CalendarDays,
  BarChart3,
  ClipboardList,
  RefreshCw,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface SubCompany {
  id: string;
  company_name: string;
  contact_name: string | null;
  contact_email: string | null;
}

interface ProjectSummary {
  sub_id: string;
  project_id: string;
  project_name: string;
  location: string | null;
  sub_name: string;
  trades: string[];
  tasks_count: number;
  last_report_date: string | null;
  last_report_by: string | null;
  avg_percent: number;
  report_count: number;
}

interface ReportEntry {
  id: string;
  report_date: string;
  submitted_at: string;
  submitted_by: string;
  project_id: string;
  project_name: string;
  manpower_count: number | null;
  total_hours: number | null;
  delay_reasons: string[];
  notes: string | null;
  worked_on_activities: Array<{ activity_id: string; status: string }>;
}

interface DashboardData {
  company: SubCompany | null;
  projects: ProjectSummary[];
  recentReports: ReportEntry[];
  stats: {
    activeProjects: number;
    reportsThisWeek: number;
    uniqueForemen: number;
  };
  totalReports: number;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr + (dateStr.includes("T") ? "" : "T12:00:00"));
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatDateShort(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr + (dateStr.includes("T") ? "" : "T12:00:00"));
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function timeAgo(isoStr: string): string {
  const diff = Date.now() - new Date(isoStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 2) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

// ─── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon,
  accent = false,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="bg-[#121217] border border-[#1F1F25] rounded-xl p-4 flex flex-col gap-2">
      <div className="flex items-center gap-2 text-gray-500">
        {icon}
        <span className="text-xs uppercase tracking-wide">{label}</span>
      </div>
      <span className={`text-2xl font-bold ${accent ? "text-[#F97316]" : "text-white"}`}>
        {value}
      </span>
    </div>
  );
}

// ─── Project Card ──────────────────────────────────────────────────────────────

function ProjectCard({ project }: { project: ProjectSummary }) {
  return (
    <div className="bg-[#121217] border border-[#1F1F25] rounded-xl p-5 space-y-3 hover:border-[#F97316]/30 transition-colors">
      {/* Project name + location */}
      <div>
        <h3 className="text-base font-bold text-white leading-tight">{project.project_name}</h3>
        {project.location && (
          <p className="text-xs text-gray-500 mt-0.5">{project.location}</p>
        )}
      </div>

      {/* Trades */}
      {project.trades.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {project.trades.map((t) => (
            <span
              key={t}
              className="text-xs px-2 py-0.5 rounded-full bg-[#F97316]/10 border border-[#F97316]/20 text-[#F97316]"
            >
              {t}
            </span>
          ))}
        </div>
      )}

      {/* Meta row */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
        {project.tasks_count > 0 && (
          <span>
            <span className="text-gray-300 font-medium">{project.tasks_count}</span> tasks
          </span>
        )}
        <span>
          <span className="text-gray-300 font-medium">{project.report_count}</span> reports
        </span>
        {project.last_report_date && (
          <span>
            Last: <span className="text-gray-300">{formatDateShort(project.last_report_date)}</span>
            {project.last_report_by && (
              <> by <span className="text-gray-300">{project.last_report_by}</span></>
            )}
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-gray-500">
          <span>Avg progress (last report)</span>
          <span className="text-gray-300 font-medium">{project.avg_percent}%</span>
        </div>
        <div className="h-1.5 bg-[#1F1F25] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-[#F97316] transition-all"
            style={{ width: `${Math.min(project.avg_percent, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Report Row ────────────────────────────────────────────────────────────────

function ReportRow({ report }: { report: ReportEntry }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-[#121217] border border-[#1F1F25] rounded-xl overflow-hidden">
      {/* Summary row */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left px-4 py-3 flex items-start justify-between gap-3"
      >
        <div className="flex-1 min-w-0 space-y-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-white">
              {formatDate(report.report_date)}
            </span>
            <span className="text-xs text-gray-500">{timeAgo(report.submitted_at)}</span>
          </div>
          <p className="text-xs text-[#F97316] truncate">{report.project_name}</p>
          <p className="text-xs text-gray-500">by {report.submitted_by}</p>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Quick stats */}
          <div className="hidden sm:flex items-center gap-3 text-xs text-gray-500">
            {report.manpower_count != null && (
              <span className="flex items-center gap-1">
                <Users size={11} className="text-[#F97316]" />
                {report.manpower_count}
              </span>
            )}
            {report.total_hours != null && (
              <span className="flex items-center gap-1">
                <Timer size={11} className="text-[#F97316]" />
                {report.total_hours}h
              </span>
            )}
          </div>
          <ChevronDown
            size={15}
            className={`text-gray-500 transition-transform ${expanded ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      {expanded && (
        <div className="border-t border-[#1F1F25] px-4 py-3 space-y-3 bg-[#0B0B0D]">
          {/* Manpower + hours on mobile */}
          <div className="flex gap-4 text-xs text-gray-400 sm:hidden">
            {report.manpower_count != null && (
              <span className="flex items-center gap-1">
                <Users size={11} className="text-[#F97316]" /> {report.manpower_count} workers
              </span>
            )}
            {report.total_hours != null && (
              <span className="flex items-center gap-1">
                <Timer size={11} className="text-[#F97316]" /> {report.total_hours}h total
              </span>
            )}
          </div>

          {/* Delay chips */}
          {report.delay_reasons.length > 0 && !report.delay_reasons.includes("None") && (
            <div className="flex flex-wrap gap-1.5">
              {report.delay_reasons.map((d) => (
                <span
                  key={d}
                  className="text-xs px-2 py-0.5 rounded-full bg-red-900/30 border border-red-700/30 text-red-400"
                >
                  {d}
                </span>
              ))}
            </div>
          )}

          {/* Task progress */}
          {report.worked_on_activities.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs text-gray-600 uppercase tracking-wide">Tasks</p>
              {report.worked_on_activities.map((task, i) => {
                const pct = parseInt(task.status, 10);
                const displayPct = isNaN(pct) ? task.status : `${pct}%`;
                const barWidth = isNaN(pct) ? 0 : Math.min(pct, 100);
                return (
                  <div key={i} className="space-y-0.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400 truncate pr-2">Task {i + 1}</span>
                      <span className="text-gray-300 flex-shrink-0">{displayPct}</span>
                    </div>
                    <div className="h-1 bg-[#1F1F25] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#F97316]/70"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Notes */}
          {report.notes && (
            <p className="text-xs text-gray-500 italic">"{report.notes}"</p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function SubDashboardPage() {
  const [dashData, setDashData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [visibleReports, setVisibleReports] = useState(10);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboard = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await fetch("/api/sub/dashboard");
      if (!res.ok) {
        if (res.status === 401) {
          setError("Not authenticated. Please sign in.");
        } else {
          const json = await res.json().catch(() => ({}));
          setError(json.error ?? "Could not load dashboard. Please try again.");
        }
        return;
      }
      const json: DashboardData = await res.json();
      setDashData(json);
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // ── Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <Loader2 className="w-8 h-8 text-[#F97316] animate-spin" />
          <p className="text-sm">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  // ── Error state
  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-16 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
        <p className="text-red-400">{error}</p>
        <Link href="/login" className="text-[#F97316] hover:text-[#EA580C] text-sm underline">
          Return to login
        </Link>
      </div>
    );
  }

  if (!dashData) return null;

  const { company, projects, recentReports, stats, totalReports } = dashData;
  const displayName = company?.company_name ?? "Your Company";

  // ── No company registered
  if (!company) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <FolderOpen className="w-12 h-12 text-gray-600 mx-auto" />
        <h1 className="text-xl font-bold text-white">No Sub Company Found</h1>
        <p className="text-gray-400 text-sm">
          Register your subcontractor company to access the dashboard.
        </p>
        <Link href="/sub/register" className="text-[#F97316] hover:text-[#EA580C] text-sm underline">
          Register your company
        </Link>
      </div>
    );
  }

  const visibleReportList = recentReports.slice(0, visibleReports);
  const canLoadMore = visibleReports < totalReports && visibleReports < recentReports.length;

  return (
    <div className="min-h-screen bg-[#0B0B0D] pb-16">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">

        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-gray-500 mb-1">Sub Dashboard</p>
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              <span className="text-[#F97316]">{displayName}</span>
            </h1>
            {company.contact_name && (
              <p className="text-gray-400 text-sm mt-1">{company.contact_name}</p>
            )}
          </div>
          <button
            onClick={() => loadDashboard(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors disabled:opacity-40 mt-1"
          >
            <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {/* ── Stats Row ── */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            label="Active Projects"
            value={stats.activeProjects}
            icon={<FolderOpen size={14} />}
            accent
          />
          <StatCard
            label="Reports This Week"
            value={stats.reportsThisWeek}
            icon={<BarChart3 size={14} />}
          />
          <StatCard
            label="Foremen"
            value={stats.uniqueForemen}
            icon={<Users size={14} />}
          />
        </div>

        {/* ── Projects Section ── */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <FolderOpen size={16} className="text-[#F97316]" />
            <h2 className="text-lg font-bold text-white">Projects</h2>
            {projects.length > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#1F1F25] text-gray-400">
                {projects.length}
              </span>
            )}
          </div>

          {projects.length === 0 ? (
            <div className="bg-[#121217] border border-[#1F1F25] rounded-xl p-8 text-center space-y-2">
              <CalendarDays size={32} className="mx-auto text-gray-700 mb-2" />
              <p className="text-sm text-gray-400 max-w-sm mx-auto">
                No projects yet. Your projects will appear here when a general contractor
                shares a schedule with your company.
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {projects.map((project) => (
                <ProjectCard key={project.sub_id} project={project} />
              ))}
            </div>
          )}
        </section>

        {/* ── Recent Reports Feed ── */}
        {recentReports.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <ClipboardList size={16} className="text-[#F97316]" />
              <h2 className="text-lg font-bold text-white">Recent Reports</h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#1F1F25] text-gray-400">
                {totalReports}
              </span>
            </div>

            <div className="space-y-3">
              {visibleReportList.map((report) => (
                <ReportRow key={report.id} report={report} />
              ))}
            </div>

            {canLoadMore && (
              <div className="flex justify-center pt-2">
                <button
                  onClick={() => setVisibleReports((v) => v + 10)}
                  className="px-5 py-2.5 bg-[#1F1F25] hover:bg-[#2A2A33] border border-[#2A2A33] text-sm text-gray-300 rounded-xl transition-colors"
                >
                  Load More
                </button>
              </div>
            )}
          </section>
        )}

        {/* ── Back link ── */}
        <div className="pt-4 border-t border-[#1F1F25]">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to IronTrack Pulse
          </Link>
        </div>
      </div>
    </div>
  );
}
