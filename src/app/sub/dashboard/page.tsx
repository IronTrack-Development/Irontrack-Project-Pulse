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
  Package,
  Send,
  AlertTriangle,
  CheckCircle2,
  ArrowUpRight,
  MapPin,
  Gauge,
  HardHat,
  ShieldCheck,
  Sparkles,
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

// ─── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon,
  accent = false,
  helper,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  accent?: boolean;
  helper?: string;
}) {
  return (
    <div className="group relative overflow-hidden bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-4 flex flex-col gap-2 shadow-[0_18px_60px_rgba(0,0,0,0.18)]">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#3B82F6]/70 to-transparent opacity-70" />
      <div className="flex items-center gap-2 text-[color:var(--text-muted)]">
        <span className={`grid h-8 w-8 place-items-center rounded-lg ${accent ? "bg-[#3B82F6]/15 text-[#60A5FA]" : "bg-[var(--bg-tertiary)] text-[#F97316]"}`}>
          {icon}
        </span>
        <span className="text-[10px] uppercase tracking-[0.18em] font-bold">{label}</span>
      </div>
      <span className={`text-2xl font-bold ${accent ? "text-[#F97316]" : "text-[color:var(--text-primary)]"}`}>
        {value}
      </span>
      {helper && <span className="text-xs text-[color:var(--text-muted)]">{helper}</span>}
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
            <span className="text-[color:var(--text-secondary)] font-medium">{project.tasks_count}</span> schedule tasks
          </span>
        )}
        <span>
          <span className="text-[color:var(--text-secondary)] font-medium">{project.report_count}</span> proof logs
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
          <span>Avg progress (latest proof)</span>
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
        Add proof / response
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
        <Link href="/login/sub" className="text-[#F97316] hover:text-[#EA580C] text-sm underline">
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
        <Link href="/signup/sub" className="text-[#F97316] hover:text-[#EA580C] text-sm underline">
          {t('subops.registerYourCompany')}
        </Link>
      </div>
    );
  }

  const visibleReportList = recentReports.slice(0, visibleReports);
  const canLoadMore = visibleReports < totalReports && visibleReports < recentReports.length;
  const latestReport = recentReports[0];
  const projectsNeedingReports = projects.filter((project) => !project.last_report_date).length;
  const fieldPulse =
    stats.reportsThisWeek > 0
      ? "Proof logs are active this week."
      : "No proof logs yet this week. Capture today's first field signal.";
  const topProject = projects[0];
  const huddleCards = [
    {
      label: "Work Cards",
      icon: <CalendarDays size={15} />,
      text: topProject
        ? `${topProject.project_name}: ${topProject.tasks_count} schedule task${topProject.tasks_count === 1 ? "" : "s"} to track.`
        : "No GC requests or work cards yet.",
    },
    {
      label: "Readiness",
      icon: <HardHat size={15} />,
      text: stats.uniqueForemen > 0
        ? `${stats.uniqueForemen} foreman${stats.uniqueForemen === 1 ? "" : "en"} can signal ready, blocked, or waiting.`
        : "Add foremen so readiness has an owner.",
    },
    {
      label: "Proof Log",
      icon: <Package size={15} />,
      text: "Attach photos, quantities, and notes before proof gets buried in phones.",
    },
    {
      label: "GC Response",
      icon: <AlertTriangle size={15} />,
      text: projectsNeedingReports > 0
        ? `${projectsNeedingReports} project${projectsNeedingReports === 1 ? "" : "s"} need a first response back to the GC.`
        : "No first-response gaps right now.",
    },
    {
      label: "Owner Snapshot",
      icon: <ArrowUpRight size={15} />,
      text: "Roll up open asks, blockers, proof gaps, and responses for leadership.",
    },
  ];
  const actionSpine = [
    {
      label: "What did the GC ask for?",
      value: `${projects.length} inbox item${projects.length === 1 ? "" : "s"}`,
      href: "#job-inbox",
      icon: <FolderOpen size={15} />,
    },
    {
      label: "What work is coming?",
      value: topProject ? `${topProject.tasks_count} schedule task${topProject.tasks_count === 1 ? "" : "s"}` : "No work cards yet",
      href: "/sub/dispatch",
      icon: <Send size={15} />,
    },
    {
      label: "Are we ready?",
      value: `${stats.uniqueForemen} readiness owner${stats.uniqueForemen === 1 ? "" : "s"}`,
      href: "/sub/handoffs",
      icon: <ShieldCheck size={15} />,
    },
    {
      label: "What proof do we have?",
      value: `${stats.reportsThisWeek} proof log${stats.reportsThisWeek === 1 ? "" : "s"} this week`,
      href: "/sub/check-in",
      icon: <ClipboardList size={15} />,
    },
    {
      label: "What needs a response?",
      value: projectsNeedingReports > 0 ? `${projectsNeedingReports} first response${projectsNeedingReports === 1 ? "" : "s"} missing` : "No first-response gaps",
      href: "/sub/blockers",
      icon: <AlertTriangle size={15} />,
    },
    {
      label: "What needs owner attention?",
      value: latestReport ? `Latest proof: ${latestReport.project_name}` : "No proof captured yet",
      href: "#owner-snapshot",
      icon: <Gauge size={15} />,
    },
  ];
  const workCardConnections = [
    {
      label: "Input",
      title: "Job Inbox",
      text: "GC asks, schedule noise, PDFs, screenshots, calls, and notes start here.",
      href: "#job-inbox",
      icon: <FolderOpen size={16} />,
    },
    {
      label: "Field",
      title: "Work Card",
      text: "Scope, crew, readiness, blockers, proof, and handoff stay tied to one card.",
      href: "/sub/dispatch",
      icon: <Send size={16} />,
    },
    {
      label: "Output",
      title: "GC Response",
      text: "Proof and blocker history roll into the response or owner snapshot.",
      href: "/sub/blockers",
      icon: <AlertTriangle size={16} />,
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] pb-16">
      <div className="relative max-w-6xl mx-auto px-4 py-8 space-y-8">

        {/* ── Header ── */}
        <div className="relative overflow-hidden rounded-xl border border-[#3B82F6]/20 bg-[linear-gradient(135deg,rgba(59,130,246,0.18),rgba(15,23,42,0.92)_42%,rgba(249,115,22,0.14))] p-5 md:p-7 shadow-[0_28px_90px_rgba(0,0,0,0.28)]">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-[#3B82F6] via-[#22C55E] to-[#F97316]" />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-[#93C5FD]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E] shadow-[0_0_14px_#22C55E]" />
                Sub Job Inbox
              </div>
              <h1 className="text-3xl md:text-5xl font-black text-white">
                {displayName}
              </h1>
              <p className="mt-3 max-w-xl text-sm md:text-base text-slate-300">
                One owner view for GC requests, work cards, readiness, proof logs, responses, and the calls that need attention today.
              </p>
              {company.contact_name && (
                <p className="text-sm text-slate-400 mt-2">Signed in as {company.contact_name}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
              <Link href="/sub/check-in" className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-[#22C55E] px-4 py-3 text-sm font-black text-[#052E16] transition-transform hover:-translate-y-0.5">
                Add proof
                <CheckCircle2 size={16} />
              </Link>
              <Link href="/sub/dispatch" className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-[#3B82F6] px-4 py-3 text-sm font-black text-white transition-transform hover:-translate-y-0.5">
                Work card
                <Send size={16} />
              </Link>
              <Link href="/sub/blockers" className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/10 px-4 py-3 text-sm font-bold text-white transition-transform hover:-translate-y-0.5">
                GC notice
                <AlertTriangle size={16} />
              </Link>
            </div>
          </div>
          <button
            onClick={() => loadDashboard(true)}
            disabled={refreshing}
            className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs text-slate-300 transition-colors hover:text-white disabled:opacity-40"
          >
            <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#93C5FD]">
              <Gauge size={14} />
              Job Inbox
            </div>
            <p className="mt-2 text-sm text-[color:var(--text-secondary)]">{fieldPulse}</p>
          </div>
          <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#F97316]">
              <AlertTriangle size={14} />
              Blocked / Missing
            </div>
            <p className="mt-2 text-sm text-[color:var(--text-secondary)]">
              {projectsNeedingReports > 0
                ? `${projectsNeedingReports} project${projectsNeedingReports === 1 ? "" : "s"} need a first response back to the GC.`
                : "No first-response gaps right now."}
            </p>
          </div>
          <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#22C55E]">
              <ShieldCheck size={14} />
              Latest Proof
            </div>
            <p className="mt-2 text-sm text-[color:var(--text-secondary)]">
              {latestReport ? `${latestReport.project_name} updated ${timeAgo(latestReport.submitted_at)}.` : "No proof logs submitted yet."}
            </p>
          </div>
        </div>

        <section id="owner-snapshot" className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#F97316]">Owner Snapshot</div>
              <h2 className="text-xl font-black text-[color:var(--text-primary)]">What needs action today?</h2>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {actionSpine.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="group rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-4 transition-colors hover:border-[#F97316]/40"
              >
                <div className="flex items-start gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#F97316]/10 text-[#F97316]">
                    {item.icon}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--text-muted)]">{item.label}</span>
                    <span className="mt-1 block text-sm font-black text-[color:var(--text-primary)]">{item.value}</span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-[#F97316]/20 bg-[linear-gradient(135deg,rgba(249,115,22,0.12),rgba(18,18,23,0.96)_48%,rgba(59,130,246,0.08))] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.18)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="text-[10px] font-black uppercase tracking-[0.22em] text-[#F97316]">Source of Truth</div>
              <h2 className="mt-2 text-xl font-black text-[color:var(--text-primary)]">Every issue should land on a work card.</h2>
              <p className="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">
                Inbox items, readiness, proof, blockers, responses, reports, and handoffs should orbit the work card so nobody rebuilds the story twice.
              </p>
            </div>
            <Link
              href="/sub/dispatch"
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[#F97316] px-5 py-3 text-sm font-black text-white shadow-[0_14px_35px_rgba(249,115,22,0.22)]"
            >
              Open Work Cards
              <ArrowUpRight size={15} />
            </Link>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {workCardConnections.map((item) => (
              <Link key={item.title} href={item.href} className="rounded-xl border border-white/10 bg-black/20 p-4 transition-colors hover:border-[#F97316]/40">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#93C5FD]">
                  {item.icon}
                  {item.label}
                </div>
                <h3 className="mt-3 text-base font-black text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">{item.text}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-[#22C55E]/20 bg-[linear-gradient(135deg,rgba(34,197,94,0.1),rgba(15,23,42,0.74)_50%,rgba(59,130,246,0.1))] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.18)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[#86EFAC]">
                <Sparkles size={14} />
              Subcontractor Control Loop
              </div>
              <h2 className="mt-2 text-xl font-black text-white">One work card should carry the whole job conversation.</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Field notes feed proof logs, readiness, GC responses, and owner snapshots instead of becoming another dead-end text thread.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs font-bold text-white sm:grid-cols-4 md:min-w-[420px]">
              <span className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-center">Work Card</span>
              <span className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-center">Readiness</span>
              <span className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-center">Proof Log</span>
              <span className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-center">GC Response</span>
            </div>
          </div>
        </section>

        <section className="space-y-4" id="job-inbox">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#93C5FD]">
                <Users size={14} />
                Today's Actions
              </div>
              <h2 className="mt-1 text-xl font-black text-[color:var(--text-primary)]">Would a tired foreman or owner know what needs action in 5 seconds?</h2>
            </div>
            <Link
              href="/sub/dispatch"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#3B82F6] px-4 py-3 text-sm font-black text-white"
            >
              Build work cards
              <Send size={15} />
            </Link>
          </div>
          <div className="grid gap-3 md:grid-cols-5">
            {huddleCards.map((card) => (
              <div key={card.label} className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-4 shadow-[0_18px_55px_rgba(0,0,0,0.14)]">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#F97316]">
                  {card.icon}
                  {card.label}
                </div>
                <p className="mt-3 text-sm leading-6 text-[color:var(--text-secondary)]">{card.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Stats Row ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <StatCard
            label="Active Projects"
            value={stats.activeProjects}
            icon={<FolderOpen size={14} />}
            accent
            helper="GC requests and work cards"
          />
          <StatCard
            label="Proof Logs This Week"
            value={stats.reportsThisWeek}
            icon={<BarChart3 size={14} />}
            helper="Proof logs captured"
          />
          <StatCard
            label="Foremen"
            value={stats.uniqueForemen}
            icon={<Users size={14} />}
            helper="Readiness owners"
          />
        </div>

        {/* ── Projects Section ── */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <FolderOpen size={16} className="text-[#F97316]" />
              <h2 className="text-lg font-bold text-[color:var(--text-primary)]">Job Inbox</h2>
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
                No GC requests or work cards yet. Jobs will appear here when a GC shares scope
                or your team starts tracking work in Sub Ops.
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

        {/* ── Recent Proof Log Feed ── */}
        {recentReports.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <ClipboardList size={16} className="text-[#F97316]" />
              <h2 className="text-lg font-bold text-[color:var(--text-primary)]">Recent Proof Logs</h2>
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
            Back to IronTrack
          </Link>
        </div>
      </div>
    </div>
  );
}
