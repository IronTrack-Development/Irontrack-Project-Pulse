"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AlertTriangle,
  ArrowRightLeft,
  ArrowUpRight,
  BarChart3,
  Building2,
  BookOpen,
  Camera,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  Contact,
  FileText,
  FolderOpen,
  HardHat,
  Image as ImageIcon,
  Loader2,
  MessageSquare,
  Package,
  Phone,
  PhoneCall,
  RefreshCw,
  Send,
  Wrench,
} from "lucide-react";
import { t } from "@/lib/i18n";

interface SubProject {
  sub_id: string;
  project_id: string;
  project_name: string;
  location: string | null;
  trades: string[];
  tasks_count: number;
  report_count: number;
}

interface DashboardData {
  company: {
    id: string;
    company_name: string;
    contact_name: string | null;
  } | null;
  projects: SubProject[];
}

interface Props {
  title: string;
  eyebrow: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
  children: (projectId: string) => React.ReactNode;
}

const CONTROL_SECTIONS = [
  {
    title: "Today",
    accent: "text-[#F97316]",
    items: [
      { href: "/sub/dashboard", label: "Schedule", detail: "What work is coming", icon: CalendarDays, count: "5" },
      { href: "/sub/dashboard#job-inbox", label: "Job Inbox", detail: "GC asks and notes", icon: FolderOpen, count: "3" },
      { href: "/sub/dispatch", label: "Work Cards", detail: "Assigned scope", icon: ClipboardList },
      { href: "/sub/handoffs", label: "Readiness", detail: "Ready / blocked", icon: ClipboardCheck },
      { href: "/sub/blockers", label: "Blockers", detail: "Stops and caveats", icon: AlertTriangle, count: "1", tone: "red" },
      { href: "/sub/check-in", label: "Proof Log", detail: "Photos and notes", icon: FileText, count: "2", tone: "blue" },
      { href: "/sub/blockers", label: "GC Response", detail: "Notice needed", icon: MessageSquare },
    ],
  },
  {
    title: "Field Work",
    accent: "text-[#F97316]",
    items: [
      { href: "/sub/production", label: "Production", detail: "Quantities and hours", icon: BarChart3 },
      { href: "/sub/check-in", label: "Photos", detail: "Proof album", icon: ImageIcon },
      { href: "/sub/dispatch", label: "Equipment", detail: "Tools and rentals", icon: Wrench },
      { href: "/sub/dispatch", label: "Materials", detail: "Material status", icon: Package },
      { href: "/sub/blockers", label: "Calls / Notes", detail: "Field notes", icon: PhoneCall },
      { href: "/sub/handoffs", label: "Handoff", detail: "Next crew notes", icon: ArrowRightLeft },
    ],
  },
  {
    title: "Project Docs",
    accent: "text-[#F97316]",
    items: [
      { href: "/sub/dashboard", label: "Drawings", detail: "Latest set", icon: FileText },
      { href: "/sub/blockers", label: "RFIs", detail: "Clarifications", icon: MessageSquare, count: "1", tone: "red" },
      { href: "/sub/dashboard", label: "Submittals", detail: "Approvals", icon: ClipboardList },
      { href: "/sub/sops", label: "SOPs", detail: "Crew standards", icon: BookOpen },
      { href: "/sub/dashboard", label: "Reports", detail: "Proof packets", icon: BarChart3 },
      { href: "/sub/crew", label: "Directory", detail: "Contacts", icon: Contact },
    ],
  },
  {
    title: "Coordination",
    accent: "text-[#F97316]",
    items: [
      { href: "/sub/dashboard", label: "Meetings", detail: "Action items", icon: ClipboardCheck },
      { href: "/sub/crew", label: "Crew", detail: "People onsite", icon: HardHat },
      { href: "/sub/dashboard#owner-snapshot", label: "Owner Snapshot", detail: "Needs attention", icon: BarChart3 },
    ],
  },
];

export default function SubPortalProjectPage({
  title,
  eyebrow,
  description,
  actionHref,
  actionLabel,
  children,
}: Props) {
  const pathname = usePathname();
  const [data, setData] = useState<DashboardData | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  async function loadProjects(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/sub/dashboard");
      if (!res.ok) {
        setError(res.status === 401 ? t('subops.signInToContinue') : t('subops.loadProjectsError'));
        return;
      }

      const json: DashboardData = await res.json();
      if (json.company?.id) {
        localStorage.setItem("sub_ops_company_id", json.company.id);
      }
      setData(json);
      setSelectedProjectId((current) => {
        if (current && json.projects.some((project) => project.project_id === current)) return current;
        return json.projects.length === 1 ? json.projects[0]?.project_id ?? null : null;
      });
    } catch {
      setError(t('subops.unexpectedLoadError'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadProjects();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[58vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-[color:var(--text-secondary)]">
          <Loader2 className="h-8 w-8 animate-spin text-[#3B82F6]" />
          <p className="text-sm">{t('subops.loadingPortal')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-lg border border-[#F97316]/25 bg-[#F97316]/10">
          <Building2 className="h-6 w-6 text-[#F97316]" />
        </div>
        <h1 className="text-xl font-black text-[color:var(--text-primary)]">{error}</h1>
        <Link href="/login/sub" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#3B82F6] px-4 py-2 text-sm font-bold text-white">
          {t('subops.goToSubLogin')}
          <ArrowUpRight size={14} />
        </Link>
      </div>
    );
  }

  const projects = data?.projects ?? [];
  const selectedProject = projects.find((project) => project.project_id === selectedProjectId);

  if (!data?.company || projects.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-lg border border-white/10 bg-white/5">
          <FolderOpen className="h-6 w-6 text-slate-500" />
        </div>
        <h1 className="text-xl font-black text-[color:var(--text-primary)]">{t('subops.noProjectsTitle')}</h1>
        <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[color:var(--text-secondary)]">
          {t('subops.noProjectsDesc')}
        </p>
        <div className="mx-auto mt-5 grid max-w-xl gap-2 text-left sm:grid-cols-3">
          {[t('subops.noProjectsStep1'), t('subops.noProjectsStep2'), t('subops.noProjectsStep3')].map((step, index) => (
            <div key={step} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#F97316]">0{index + 1}</p>
              <p className="mt-2 text-xs leading-5 text-[color:var(--text-secondary)]">{step}</p>
            </div>
          ))}
        </div>
        <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
          <button
            onClick={() => loadProjects(true)}
            disabled={refreshing}
            className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-lg bg-[#3B82F6] px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            {t('subops.refreshAssignments')}
          </button>
          <Link href="/sub/dashboard" className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm font-bold text-[color:var(--text-secondary)]">
            {t('subops.backToDashboard')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5 px-4 py-5 md:px-6 md:py-7">
      <div className="rounded-xl border border-white/10 bg-[linear-gradient(135deg,rgba(59,130,246,0.16),rgba(15,23,42,0.72)_50%,rgba(249,115,22,0.1))] p-4 shadow-[0_24px_70px_rgba(0,0,0,0.2)] md:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#93C5FD]">{eyebrow}</p>
            <h1 className="mt-2 text-2xl font-black text-white md:text-3xl">{title}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">{description}</p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            {projects.length > 1 && (
              <select
                value={selectedProjectId ?? ""}
                onChange={(event) => setSelectedProjectId(event.target.value)}
                className="min-h-[42px] rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm font-semibold text-white outline-none transition-colors focus:border-[#3B82F6]"
                aria-label={t('subops.selectProject')}
              >
                <option value="">{t('subops.selectProject')}</option>
                {projects.map((project) => (
                  <option key={project.sub_id} value={project.project_id}>
                    {project.project_name}
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={() => loadProjects(true)}
              disabled={refreshing}
              className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-bold text-slate-300 transition-colors hover:text-white disabled:opacity-50"
            >
              <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
              {t('subops.refresh')}
            </button>

            {actionHref && actionLabel && (
              <Link
                href={actionHref}
                className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-lg bg-[#22C55E] px-4 py-2 text-sm font-black text-[#052E16]"
              >
                {actionLabel}
                <ArrowUpRight size={14} />
              </Link>
            )}
          </div>
        </div>

        {selectedProject && (
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <div className="rounded-lg border border-white/10 bg-black/20 p-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">{t('subops.project')}</p>
              <p className="mt-1 truncate text-sm font-bold text-white">{selectedProject.project_name}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/20 p-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">{t('subops.scope')}</p>
              <p className="mt-1 truncate text-sm font-bold text-white">
                {selectedProject.trades.length > 0 ? selectedProject.trades.join(", ") : t('subops.tradeScope')}
              </p>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/20 p-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">{t('subops.activity')}</p>
              <p className="mt-1 text-sm font-bold text-white">
                {selectedProject.tasks_count} {t('subops.tasks')} - {selectedProject.report_count} {t('subops.reports')}
              </p>
            </div>
          </div>
        )}
      </div>

      {!selectedProject && (
        <section className="rounded-xl border border-[#3B82F6]/20 bg-[#3B82F6]/10 p-5 text-center">
          <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-lg border border-[#3B82F6]/25 bg-[#3B82F6]/15">
            <FolderOpen className="h-5 w-5 text-[#93C5FD]" />
          </div>
          <h2 className="text-lg font-black text-[color:var(--text-primary)]">{t('subops.chooseProjectTitle')}</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[color:var(--text-secondary)]">{t('subops.chooseProjectDesc')}</p>
        </section>
      )}

      {selectedProject && (
      <section className="rounded-xl border border-[#F97316]/20 bg-[linear-gradient(135deg,rgba(249,115,22,0.12),rgba(18,18,23,0.96)_46%,rgba(59,130,246,0.08))] p-4 shadow-[0_18px_55px_rgba(0,0,0,0.16)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#F97316]">Start Here</p>
            <h2 className="mt-1 text-xl font-black text-[color:var(--text-primary)]">Open the work card first.</h2>
            <p className="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">
              The card carries scope, readiness, proof, blockers, handoff notes, and anything the PM may need to send back.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:min-w-[520px]">
            {[
              { href: "/sub/dispatch", label: "Open Cards", icon: Send, tone: "bg-[#F97316] text-white" },
              { href: "/sub/check-in", label: "Add Proof", icon: Camera, tone: "bg-[#22C55E] text-[#052E16]" },
              { href: "/sub/blockers", label: "Flag Blocker", icon: AlertTriangle, tone: "bg-red-500 text-white" },
              { href: "/sub/handoffs", label: "Readiness", icon: ArrowRightLeft, tone: "bg-[#3B82F6] text-white" },
            ].map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.href}
                  href={action.href}
                  className={`inline-flex min-h-[52px] items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-black shadow-[0_12px_30px_rgba(0,0,0,0.18)] ${action.tone}`}
                >
                  <Icon size={16} />
                  {action.label}
                </Link>
              );
            })}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-[color:var(--text-muted)]">
          <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1">One job</span>
          <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1">One next action</span>
          <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1">Proof stays attached</span>
          <Link href="/sub/foremen" className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[color:var(--text-secondary)] hover:text-white">
            <Phone size={12} />
            Call / assign foreman
          </Link>
        </div>
      </section>
      )}

      {selectedProject && (
      <section className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-3 shadow-[0_18px_55px_rgba(0,0,0,0.12)]">
        <div className="mb-4 flex flex-col gap-1 px-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#F97316]">Job Control</p>
            <h2 className="text-lg font-black text-[color:var(--text-primary)]">{selectedProject.project_name}</h2>
          </div>
          <p className="text-xs text-[color:var(--text-muted)]">Scroll, tap once, and go straight to the tool.</p>
        </div>
        <div className="space-y-4">
          {CONTROL_SECTIONS.map((section) => (
            <div key={section.title} className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-primary)] p-3">
              <p className={`mb-2 text-[11px] font-black uppercase tracking-[0.18em] ${section.accent}`}>{section.title}</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {section.items.map((item) => {
                  const active = pathname === item.href;
                  const Icon = item.icon;
                  const badgeClass = item.tone === "red" ? "bg-red-500 text-white" : item.tone === "blue" ? "bg-[#3B82F6] text-white" : "bg-[#F97316] text-white";
                  return (
                    <Link
                      key={`${section.title}-${item.label}`}
                      href={item.href}
                      className={`relative min-h-[76px] rounded-xl border p-3 transition-all ${
                        active
                          ? "border-[#F97316]/50 bg-[#F97316]/10 shadow-[0_12px_35px_rgba(249,115,22,0.12)]"
                          : "border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015))] hover:border-[#F97316]/35"
                      }`}
                    >
                      {item.count && (
                        <span className={`absolute right-2 top-2 grid h-6 min-w-6 place-items-center rounded-full px-1.5 text-xs font-black ${badgeClass}`}>
                          {item.count}
                        </span>
                      )}
                      <Icon size={20} className="text-[#F97316]" />
                      <p className="mt-2 text-sm font-black text-[color:var(--text-primary)]">{item.label}</p>
                      <p className="mt-0.5 text-[11px] leading-4 text-[color:var(--text-muted)]">{item.detail}</p>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>
      )}

      {selectedProject && children(selectedProject.project_id)}
    </div>
  );
}
