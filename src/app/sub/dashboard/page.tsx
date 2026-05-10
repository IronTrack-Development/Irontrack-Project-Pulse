"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Bell,
  Briefcase,
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  FileText,
  FolderOpen,
  Loader2,
  Mail,
  MessageSquare,
  Phone,
  RefreshCw,
  Send,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";
import { t } from "@/lib/i18n";

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

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "No proof yet";
  const d = new Date(dateStr + (dateStr.includes("T") ? "" : "T12:00:00"));
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function timeAgo(isoStr: string): string {
  const diff = Date.now() - new Date(isoStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 2) return t("time.justNow");
  if (mins < 60) return `${mins} ${t("time.minAgo")}`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} ${t("time.hrAgo")}`;
  return `${Math.floor(hrs / 24)} ${t("time.dayAgo")}`;
}

function SourcePanel({
  eyebrow,
  title,
  items,
  icon,
}: {
  eyebrow: string;
  title: string;
  items: string[];
  icon: React.ReactNode;
}) {
  return (
    <div className="relative rounded-xl border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.055),rgba(255,255,255,0.018))] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
      <div className="mb-4 flex items-center gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-xl border border-[#F97316]/25 bg-[#F97316]/10 text-[#F97316]">
          {icon}
        </span>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{eyebrow}</p>
          <h3 className="text-xl font-black text-white">{title}</h3>
        </div>
      </div>
      <ul className="space-y-2 text-sm text-slate-400">
        {items.map((item) => (
          <li key={item} className="flex items-center gap-2">
            <CheckCircle2 size={13} className="text-[#F97316]" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function SnapshotCard({
  label,
  value,
  primary,
  secondary,
  href,
  icon,
}: {
  label: string;
  value: string | number;
  primary: string;
  secondary: string;
  href: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group relative min-h-[190px] overflow-hidden rounded-xl border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.055),rgba(255,255,255,0.018))] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.2)] transition-all hover:-translate-y-0.5 hover:border-[#F97316]/45"
    >
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#F97316]/80 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="mb-6 flex items-center justify-between gap-3">
        <span className="text-[#F97316]">{icon}</span>
        <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{label}</span>
      </div>
      <div className="text-5xl font-black leading-none tracking-[-0.04em] text-[#F97316]">{value}</div>
      <p className="mt-3 text-sm font-semibold text-slate-300">{primary}</p>
      <p className="mt-1 text-xs font-semibold text-[#F97316]">{secondary}</p>
      <div className="mt-5 flex min-h-[38px] items-center justify-between rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs font-bold text-slate-300">
        View All
        <ArrowRight size={13} className="text-[#F97316]" />
      </div>
    </Link>
  );
}

export default function SubDashboardPage() {
  const [dashData, setDashData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboard = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/sub/dashboard");
      if (!res.ok) {
        if (res.status === 401) setError(t("subops.notAuthenticated"));
        else {
          const json = await res.json().catch(() => ({}));
          setError(json.error ?? t("subops.dashboardLoadError"));
        }
        return;
      }
      const json: DashboardData = await res.json();
      setDashData(json);
    } catch {
      setError(t("subops.unexpectedLoadError"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin text-[#F97316]" />
          <p className="text-sm">Loading Owner Snapshot...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
        <p className="mt-4 text-red-400">{error}</p>
        <Link href="/login/sub" className="mt-4 inline-flex text-sm font-bold text-[#F97316]">
          {t("auth.returnToLogin")}
        </Link>
      </div>
    );
  }

  if (!dashData) return null;

  const { company, projects, recentReports, stats, totalReports } = dashData;
  const displayName = company?.company_name ?? t("subops.yourCompany");

  if (!company) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <FolderOpen className="mx-auto h-12 w-12 text-slate-600" />
        <h1 className="mt-4 text-xl font-black text-white">{t("subops.noCompanyFound")}</h1>
        <p className="mt-2 text-sm text-slate-400">{t("subops.registerCompanyAccess")}</p>
        <Link href="/signup/sub" className="mt-4 inline-flex text-sm font-bold text-[#F97316]">
          {t("subops.registerYourCompany")}
        </Link>
      </div>
    );
  }

  const latestReport = recentReports[0];
  const projectsNeedingReports = projects.filter((project) => !project.last_report_date).length;
  const totalScheduleTasks = projects.reduce((sum, project) => sum + (project.tasks_count || 0), 0);
  const averageReadiness = projects.length
    ? Math.round(projects.reduce((sum, project) => sum + (project.avg_percent || 0), 0) / projects.length)
    : 0;
  const ownerAttentionCount = projectsNeedingReports + (latestReport ? 0 : 1);
  const now = new Date();

  const snapshotCards = [
    {
      label: "GC Asks",
      value: Math.max(projects.length, 0),
      primary: "Inbox items",
      secondary: `${projectsNeedingReports} need first proof`,
      href: "#job-inbox",
      icon: <MessageSquare size={26} />,
    },
    {
      label: "Coming Work",
      value: totalScheduleTasks,
      primary: "Schedule tasks",
      secondary: `${Math.min(projectsNeedingReports + 1, 9)} at risk`,
      href: "/sub/dispatch",
      icon: <CalendarDays size={26} />,
    },
    {
      label: "Readiness",
      value: `${averageReadiness}%`,
      primary: "Projects ready",
      secondary: `${stats.uniqueForemen} readiness owners`,
      href: "/sub/handoffs",
      icon: <ShieldCheck size={26} />,
    },
    {
      label: "Proof",
      value: stats.reportsThisWeek,
      primary: "Proof logs",
      secondary: latestReport ? "latest captured" : "needs first log",
      href: "/sub/check-in",
      icon: <ClipboardList size={26} />,
    },
    {
      label: "Response Gaps",
      value: projectsNeedingReports,
      primary: "Need response",
      secondary: projectsNeedingReports > 0 ? "critical follow-up" : "clear",
      href: "/sub/blockers",
      icon: <AlertTriangle size={26} />,
    },
    {
      label: "Owner Attention",
      value: ownerAttentionCount,
      primary: "Needs review",
      secondary: ownerAttentionCount > 0 ? "call today" : "no calls",
      href: "#owner-snapshot",
      icon: <UserRound size={26} />,
    },
  ];

  return (
    <div className="px-4 py-5 md:px-7 md:py-7">
      <div className="mx-auto max-w-[1280px] space-y-5">
        <section
          id="owner-snapshot"
          className="relative overflow-hidden rounded-xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.018))] p-4 shadow-[0_28px_100px_rgba(0,0,0,0.28)] md:p-7"
        >
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#F97316]/80 to-transparent" />
          <div className="mb-5 flex flex-col gap-4 border-b border-white/10 pb-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h1 className="text-4xl font-black tracking-[-0.04em] text-white md:text-5xl">Owner Snapshot</h1>
              <div className="mt-2 flex items-center gap-2 text-[#F97316]">
                <Building2 size={18} />
                <span className="font-black">{displayName}</span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
              <span className="inline-flex items-center gap-2">
                <CalendarDays size={15} />
                {now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </span>
              <span className="inline-flex items-center gap-2">
                <Bell size={15} />
                Updated {now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
              </span>
              <button
                onClick={() => loadDashboard(true)}
                disabled={refreshing}
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-bold text-slate-300 hover:text-white disabled:opacity-40"
              >
                <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
                Refresh
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-white/12 bg-black/20 p-4 md:p-6">
            <p className="mb-4 text-center text-[11px] font-black uppercase tracking-[0.24em] text-[#F97316]">Source of Truth</p>
            <div className="grid gap-4 lg:grid-cols-[1fr_auto_1fr_auto_1fr] lg:items-center">
              <SourcePanel
                eyebrow="Input"
                title="Job Inbox"
                icon={<FolderOpen size={28} />}
                items={["GC asks", "Emails", "PDFs", "Screenshots", "Calls"]}
              />
              <ArrowRight className="mx-auto hidden text-[#F97316] lg:block" size={34} />
              <SourcePanel
                eyebrow="Field"
                title="Work Card"
                icon={<ClipboardList size={30} />}
                items={["Scope", "Readiness", "Blockers", "Proof", "Handoff"]}
              />
              <ArrowRight className="mx-auto hidden text-[#F97316] lg:block" size={34} />
              <SourcePanel
                eyebrow="Output"
                title="GC Response"
                icon={<Send size={32} />}
                items={["Proof packet", "Notice", "Owner snapshot"]}
              />
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-white/12 bg-black/20 p-4 md:p-5">
            <p className="mb-4 text-[11px] font-black uppercase tracking-[0.22em] text-[#F97316]">What needs action today?</p>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
              {snapshotCards.map((card) => (
                <SnapshotCard key={card.label} {...card} />
              ))}
            </div>
          </div>

          <div className="mt-4 overflow-hidden rounded-xl border border-white/10 bg-[linear-gradient(90deg,rgba(255,255,255,0.06),rgba(249,115,22,0.12))] p-4">
            <div className="flex items-center gap-4">
              <span className="grid h-12 w-12 place-items-center rounded-xl border border-white/15 bg-white/[0.04] text-white">
                <ShieldCheck size={24} />
              </span>
              <div>
                <p className="text-lg font-black text-white">Clarity. Accountability. Proof.</p>
                <p className="text-sm text-slate-400">IronTrack Field Pulse keeps every job moving forward.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="job-inbox" className="grid gap-5 xl:grid-cols-[1fr_0.8fr]">
          <div className="rounded-xl border border-white/10 bg-[rgba(10,12,15,0.92)] p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#F97316]">Job Inbox</p>
                <h2 className="mt-1 text-2xl font-black text-white">Active project queue</h2>
              </div>
              <Link href="/sub/dispatch" className="rounded-lg bg-[#F97316] px-4 py-2 text-sm font-black text-white">
                New Work Card
              </Link>
            </div>
            {projects.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-8 text-center">
                <FolderOpen className="mx-auto h-8 w-8 text-slate-600" />
                <p className="mt-3 text-sm text-slate-400">No inbox items yet. Add scope from a GC request, email, PDF, screenshot, call, or manual note.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {projects.map((project) => (
                  <Link
                    key={project.sub_id}
                    href="/sub/dispatch"
                    className="block rounded-xl border border-white/10 bg-white/[0.03] p-4 transition-colors hover:border-[#F97316]/40"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <h3 className="text-base font-black text-white">{project.project_name}</h3>
                        <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                          <Briefcase size={12} />
                          {project.location || "Location TBD"}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs font-bold">
                        <span className="rounded-full bg-[#F97316]/15 px-3 py-1 text-[#FDBA74]">{project.tasks_count} schedule tasks</span>
                        <span className="rounded-full bg-sky-500/15 px-3 py-1 text-sky-300">{project.report_count} proof logs</span>
                        <span className="rounded-full bg-green-500/15 px-3 py-1 text-green-300">{project.avg_percent}% ready</span>
                      </div>
                    </div>
                    <p className="mt-3 text-xs text-slate-500">Last proof: {formatDate(project.last_report_date)}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div id="reports" className="rounded-xl border border-white/10 bg-[rgba(10,12,15,0.92)] p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#F97316]">Proof Center</p>
                <h2 className="mt-1 text-2xl font-black text-white">Recent proof logs</h2>
              </div>
              <span className="rounded-full bg-white/[0.05] px-3 py-1 text-xs font-black text-slate-400">{totalReports}</span>
            </div>
            {recentReports.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-8 text-center">
                <FileText className="mx-auto h-8 w-8 text-slate-600" />
                <p className="mt-3 text-sm text-slate-400">No proof captured yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentReports.slice(0, 8).map((report) => (
                  <div key={report.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-black text-white">{report.project_name}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {formatDate(report.report_date)} · {timeAgo(report.submitted_at)} · by {report.submitted_by}
                        </p>
                      </div>
                      <div className="flex gap-2 text-xs text-slate-400">
                        {report.manpower_count != null && (
                          <span className="inline-flex items-center gap-1">
                            <Users size={12} className="text-[#F97316]" />
                            {report.manpower_count}
                          </span>
                        )}
                        {report.total_hours != null && (
                          <span className="inline-flex items-center gap-1">
                            <ClockIcon />
                            {report.total_hours}h
                          </span>
                        )}
                      </div>
                    </div>
                    {report.notes && <p className="mt-3 text-xs italic leading-5 text-slate-500">"{report.notes}"</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function ClockIcon() {
  return <span className="inline-block h-3 w-3 rounded-full border border-[#F97316]" />;
}
