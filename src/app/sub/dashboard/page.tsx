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
  ClipboardList,
  RefreshCw,
  Send,
  AlertTriangle,
  CheckCircle2,
  ArrowUpRight,
  MapPin,
} from "lucide-react";
import { t } from "@/lib/i18n";

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
  if (mins < 2) return t('time.justNow');
  if (mins < 60) return `${mins} ${t('time.minAgo')}`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} ${t('time.hrAgo')}`;
  const days = Math.floor(hrs / 24);
  return `${days} ${t('time.dayAgo')}`;
}

// ─── KPI Tile (compact, field-readable) ───────────────────────────────────────

function KpiTile({
  label,
  value,
  accent = "default",
  helper,
}: {
  label: string;
  value: string | number;
  accent?: "default" | "warn" | "good";
  helper?: string;
}) {
  const valueColor =
    accent === "warn"
      ? "text-[#F97316]"
      : accent === "good"
        ? "text-[#22C55E]"
        : "text-[color:var(--text-primary)]";
  return (
    <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-4">
      <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[color:var(--text-muted)]">{label}</div>
      <div className={`mt-1 text-2xl font-extrabold leading-none ${valueColor}`}>{value}</div>
      {helper && <div className="mt-1.5 text-xs text-[color:var(--text-secondary)] line-clamp-2">{helper}</div>}
    </div>
  );
}

// ─── Project Card ──────────────────────────────────────────────────────────────

function ProjectCard({ project }: { project: ProjectSummary }) {
  return (
    <div className="group relative overflow-hidden bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-5 space-y-4 hover:border-[#3B82F6]/50 transition-all hover:-translate-y-0.5 shadow-[0_18px_55px_rgba(0,0,0,0.16)]">
      <div className="absolute -right-14 -top-16 h-32 w-32 rounded-full bg-[#3B82F6]/10 blur-2xl group-hover:bg-[#F97316]/10 transition-colors" />
      {/* Project name + location */}
      <div>
        <h3 className="text-base font-bold text-[color:var(--text-primary)] leading-tight">{project.project_name}</h3>
        {project.location && (
          <p className="text-xs text-[color:var(--text-muted)] mt-1 flex items-center gap-1">
            <MapPin size={11} />
            {project.location}
          </p>
        )}
      </div>

      {/* Trades */}
      {project.trades.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {project.trades.map((t) => (
            <span
              key={t}
            className="text-xs px-2.5 py-1 rounded-full bg-[#3B82F6]/10 border border-[#3B82F6]/20 text-[#93C5FD] font-semibold"
            >
              {t}
            </span>
          ))}
        </div>
      )}

      {/* Meta row */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[color:var(--text-muted)]">
        {project.tasks_count > 0 && (
          <span>
            <span className="text-[color:var(--text-secondary)] font-medium">{project.tasks_count}</span> tasks
          </span>
        )}
        <span>
          <span className="text-[color:var(--text-secondary)] font-medium">{project.report_count}</span> reports
        </span>
        {project.last_report_date && (
          <span>
            Last: <span className="text-[color:var(--text-secondary)]">{formatDateShort(project.last_report_date)}</span>
            {project.last_report_by && (
              <> by <span className="text-[color:var(--text-secondary)]">{project.last_report_by}</span></>
            )}
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-[color:var(--text-muted)]">
          <span>Avg progress (last report)</span>
          <span className="text-[color:var(--text-secondary)] font-medium">{project.avg_percent}%</span>
        </div>
        <div className="h-2 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#3B82F6] via-[#22C55E] to-[#F97316] transition-all"
            style={{ width: `${Math.min(project.avg_percent, 100)}%` }}
          />
        </div>
      </div>

      <Link
        href="/sub/check-in"
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#3B82F6] px-3 py-2.5 text-xs font-bold text-white transition-colors hover:bg-[#2563EB]"
      >
        Submit field update
        <ArrowUpRight size={13} />
      </Link>
    </div>
  );
}

// ─── Report Row ────────────────────────────────────────────────────────────────

function ReportRow({ report }: { report: ReportEntry }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl overflow-hidden">
      {/* Summary row */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left px-4 py-3 flex items-start justify-between gap-3"
      >
        <div className="flex-1 min-w-0 space-y-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-[color:var(--text-primary)]">
              {formatDate(report.report_date)}
            </span>
            <span className="text-xs text-[color:var(--text-muted)]">{timeAgo(report.submitted_at)}</span>
          </div>
          <p className="text-xs text-[#F97316] truncate">{report.project_name}</p>
          <p className="text-xs text-[color:var(--text-muted)]">by {report.submitted_by}</p>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Quick stats */}
          <div className="hidden sm:flex items-center gap-3 text-xs text-[color:var(--text-muted)]">
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
            className={`text-[color:var(--text-muted)] transition-transform ${expanded ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      {expanded && (
        <div className="border-t border-[var(--border-primary)] px-4 py-3 space-y-3 bg-[var(--bg-primary)]">
          {/* Manpower + hours on mobile */}
          <div className="flex gap-4 text-xs text-[color:var(--text-secondary)] sm:hidden">
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
                      <span className="text-[color:var(--text-secondary)] truncate pr-2">Task {i + 1}</span>
                      <span className="text-[color:var(--text-secondary)] flex-shrink-0">{displayPct}</span>
                    </div>
                    <div className="h-1 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
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
            <p className="text-xs text-[color:var(--text-muted)] italic">"{report.notes}"</p>
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
          setError(t('subops.notAuthenticated'));
        } else {
          const json = await res.json().catch(() => ({}));
          setError(json.error ?? t('subops.dashboardLoadError'));
        }
        return;
      }
      const json: DashboardData = await res.json();
      setDashData(json);
    } catch {
      setError(t('subops.unexpectedLoadError'));
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
        <div className="flex flex-col items-center gap-3 text-[color:var(--text-secondary)]">
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
          {t('auth.returnToLogin')}
        </Link>
      </div>
    );
  }

  if (!dashData) return null;

  const { company, projects, recentReports, stats, totalReports } = dashData;
  const displayName = company?.company_name ?? t('subops.yourCompany');

  // ── No company registered
  if (!company) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <FolderOpen className="w-12 h-12 text-gray-600 mx-auto" />
        <h1 className="text-xl font-bold text-[color:var(--text-primary)]">{t('subops.noCompanyFound')}</h1>
        <p className="text-[color:var(--text-secondary)] text-sm">
          {t('subops.registerCompanyAccess')}
        </p>
        <Link href="/sub/register" className="text-[#F97316] hover:text-[#EA580C] text-sm underline">
          {t('subops.registerYourCompany')}
        </Link>
      </div>
    );
  }

  const visibleReportList = recentReports.slice(0, visibleReports);
  const canLoadMore = visibleReports < totalReports && visibleReports < recentReports.length;
  const latestReport = recentReports[0];
  const projectsNeedingReports = projects.filter((project) => !project.last_report_date).length;

  const lastSignalText = latestReport
    ? `${latestReport.project_name} · ${timeAgo(latestReport.submitted_at)}`
    : "No field updates yet";
  const needsAttentionText =
    projectsNeedingReports > 0
      ? `${projectsNeedingReports} project${projectsNeedingReports === 1 ? "" : "s"} waiting on a first report`
      : "All projects have a recent report";

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] pb-16">
      <div className="relative max-w-6xl mx-auto px-4 py-6 md:py-8 space-y-6 md:space-y-8">

        {/* ── Header ── */}
        <header className="relative overflow-hidden rounded-2xl border border-[#3B82F6]/20 bg-[linear-gradient(135deg,rgba(59,130,246,0.16),rgba(15,23,42,0.92)_50%,rgba(249,115,22,0.12))] p-5 md:p-7">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-[#3B82F6] via-[#22C55E] to-[#F97316]" />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1 pr-10">
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-[#93C5FD]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E] shadow-[0_0_10px_#22C55E]" />
                Sub Command Center
              </div>
              <h1 className="text-2xl md:text-4xl font-black text-white truncate">{displayName}</h1>
              <p className="mt-2 max-w-xl text-sm text-slate-300">
                {company.contact_name ? `Signed in as ${company.contact_name}. ` : ""}
                {needsAttentionText}.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 lg:flex lg:flex-wrap lg:justify-end">
              <Link
                href="/sub/check-in"
                className="inline-flex min-h-[44px] flex-col items-center justify-center gap-1 rounded-lg bg-[#22C55E] px-3 py-2 text-xs font-bold text-[#052E16] transition-transform hover:-translate-y-0.5 sm:flex-row sm:gap-2 sm:text-sm"
              >
                <CheckCircle2 size={16} />
                Check in
              </Link>
              <Link
                href="/sub/dispatch"
                className="inline-flex min-h-[44px] flex-col items-center justify-center gap-1 rounded-lg bg-[#3B82F6] px-3 py-2 text-xs font-bold text-white transition-transform hover:-translate-y-0.5 sm:flex-row sm:gap-2 sm:text-sm"
              >
                <Send size={16} />
                Dispatch
              </Link>
              <Link
                href="/sub/blockers"
                className="inline-flex min-h-[44px] flex-col items-center justify-center gap-1 rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-xs font-bold text-white transition-transform hover:-translate-y-0.5 sm:flex-row sm:gap-2 sm:text-sm"
              >
                <AlertTriangle size={16} />
                Blocker
              </Link>
            </div>
          </div>
          <button
            onClick={() => loadDashboard(true)}
            disabled={refreshing}
            aria-label="Refresh dashboard"
            className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full border border-white/10 bg-black/20 px-2.5 py-1.5 text-xs text-slate-300 transition-colors hover:text-white disabled:opacity-40"
          >
            <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </header>

        {/* ── KPI Strip (replaces 3 separate intro sections) ── */}
        <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <KpiTile
            label="Active Projects"
            value={stats.activeProjects}
            accent="warn"
            helper={projects.length > 0 ? "Scopes connected by GCs" : "Waiting on first GC invite"}
          />
          <KpiTile
            label="Reports This Week"
            value={stats.reportsThisWeek}
            accent={stats.reportsThisWeek > 0 ? "good" : "default"}
            helper={stats.reportsThisWeek > 0 ? "Field reporting active" : "No update logged yet"}
          />
          <KpiTile
            label="Foremen Reporting"
            value={stats.uniqueForemen}
            helper={stats.uniqueForemen > 0 ? "People sending updates" : "Add foremen to assign updates"}
          />
          <KpiTile
            label="Last Signal"
            value={latestReport ? timeAgo(latestReport.submitted_at) : "—"}
            helper={lastSignalText}
          />
        </section>

        {/* ── Projects Section ── */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <FolderOpen size={16} className="text-[#F97316]" />
            <h2 className="text-lg font-bold text-[color:var(--text-primary)]">Projects</h2>
            {projects.length > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--bg-tertiary)] text-[color:var(--text-secondary)]">
                {projects.length}
              </span>
            )}
          </div>

          {projects.length === 0 ? (
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-8 text-center space-y-2">
              <CalendarDays size={32} className="mx-auto text-gray-700 mb-2" />
              <p className="text-sm text-[color:var(--text-secondary)] max-w-sm mx-auto">
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
              <h2 className="text-lg font-bold text-[color:var(--text-primary)]">Recent Reports</h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--bg-tertiary)] text-[color:var(--text-secondary)]">
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
                  className="px-5 py-2.5 bg-[var(--bg-tertiary)] hover:bg-[#2A2A33] border border-[#2A2A33] text-sm text-[color:var(--text-secondary)] rounded-xl transition-colors"
                >
                  Load More
                </button>
              </div>
            )}
          </section>
        )}

        {/* ── Back link ── */}
        <div className="pt-4 border-t border-[var(--border-primary)]">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to IronTrack Pulse
          </Link>
        </div>
      </div>
    </div>
  );
}
