"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Plus,
  RefreshCw,
  Building2,
  TrendingDown,
  Flag,
  Calendar,
  Send,
  ClipboardList,
} from "lucide-react";
import AddProjectModal from "@/components/AddProjectModal";
import DashboardOnboardingWizard from "@/components/DashboardOnboardingWizard";
import { HelpIcon } from "@/components/help-icon";
import { t } from "@/lib/i18n";

interface ProjectWithStats {
  id: string;
  name: string;
  project_number?: string;
  client_name?: string;
  location?: string;
  status: string;
  health_score: number;
  target_finish_date?: string;
  stats: {
    totalActivities: number;
    lateActivities: number;
    completeActivities: number;
    completionPercent: number;
    highRisks: number;
    daysToCompletion: number | null;
    nextMilestone: { activity_name: string; finish_date: string } | null;
    todayActivity: { activity_name: string; trade: string } | null;
  };
}

function healthColor(score: number) {
  if (score >= 85) return { dot: "bg-[#22C55E]", text: "text-[#22C55E]", border: "border-[#22C55E]/20", bg: "bg-[#22C55E]/10" };
  if (score >= 70) return { dot: "bg-[#EAB308]", text: "text-[#EAB308]", border: "border-[#EAB308]/20", bg: "bg-[#EAB308]/10" };
  return { dot: "bg-[#EF4444]", text: "text-[#EF4444]", border: "border-[#EF4444]/20", bg: "bg-[#EF4444]/10" };
}

function formatDate(dateStr?: string) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function Dashboard() {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [dbError, setDbError] = useState(false);
  const [userId, setUserId] = useState<string>();
  const [loopProjectId, setLoopProjectId] = useState<string>("");

  // Redirect sub users to their dashboard
  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const { data: subCompany } = await supabase
        .from("sub_companies")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (subCompany) {
        router.replace("/sub/dashboard");
      }
    })();
  }, [router]);

  const triggerNotificationCheck = async () => {
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
      const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD in local tz
      // Non-blocking: we don't await or handle the response
      fetch(`/api/notifications/check?clientDate=${today}`).catch(() => {});
    } catch {
      // Silently ignore — notifications are best-effort
    }
  };

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/projects");
      if (res.ok) {
        const data = await res.json();
        // Check if response is an array (valid) or an error object
        if (Array.isArray(data)) {
          setProjects(data);
          setDbError(false);
        } else if (data.error) {
          setDbError(true);
        }
      } else {
        setDbError(true);
      }
    } catch {
      setDbError(true);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProjects();
    // Fire-and-forget notification check on dashboard load.
    // Triggers push notifications for inspections and overdue activities.
    void triggerNotificationCheck();
  }, []);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[var(--bg-primary)]/95 backdrop-blur border-b border-[var(--border-primary)] px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div>
            <h1 className="text-xl font-bold text-[color:var(--text-primary)]">{t('dashboard.commandCenter')}</h1>
            <p className="text-sm text-[color:var(--text-muted)] mt-0.5">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <HelpIcon context="Dashboard" />
            <button
              onClick={fetchProjects}
              className="p-2 rounded-lg bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] transition-colors"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#F97316] hover:bg-[#ea6c0a] text-[color:var(--text-primary)] rounded-lg text-sm font-semibold transition-colors"
            >
              <Plus size={16} />
              {t('action.addProject')}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* DB setup banner */}
        {dbError && (
          <div className="bg-[#EAB308]/10 border border-[#EAB308]/30 rounded-xl px-5 py-4 mb-6 flex items-center justify-between">
            <div>
              <div className="text-[#EAB308] font-semibold text-sm">{t('dashboard.dbSetupRequired')}</div>
              <div className="text-[color:var(--text-secondary)] text-xs mt-0.5">{t('dashboard.dbSetupDesc')}</div>
            </div>
            <Link href="/setup" className="text-xs px-3 py-1.5 bg-[#EAB308]/20 text-[#EAB308] rounded-lg font-semibold hover:bg-[#EAB308]/30 transition-colors">
              {t('dashboard.viewSetup')}
            </Link>
          </div>
        )}

        {!loading && projects.length > 0 && (
          <section className="mb-8 overflow-hidden rounded-2xl border border-[#F97316]/20 bg-[linear-gradient(135deg,rgba(249,115,22,0.12),rgba(15,23,42,0.72)_48%,rgba(59,130,246,0.12))] p-5 shadow-[0_24px_75px_rgba(0,0,0,0.2)]">
            <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[#F97316]">
                  <Calendar size={14} />
                  Today&apos;s Operating Loop
                </div>
                <h2 className="mt-2 text-xl font-black text-white">Choose the job, then run the day.</h2>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-300">
                  Pick the project you are working on now. Then review the plan, capture field changes, and keep the next handoff clean.
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:min-w-[300px]">
                <label className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                  Active job
                </label>
                <select
                  id="dashboard-loop-project"
                  value={loopProjectId}
                  onChange={(event) => setLoopProjectId(event.target.value)}
                  className="min-h-[44px] rounded-lg border border-white/10 bg-black/35 px-3 py-2 text-sm font-bold text-white outline-none transition-colors focus:border-[#F97316]"
                >
                  <option value="">Select a project...</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {(() => {
              const loopProject = projects.find((project) => project.id === loopProjectId) ?? null;
              const loopItems = [
                {
                  href: loopProject ? `/projects/${loopProject.id}` : "",
                  label: "Review Today",
                  body: loopProject?.stats.todayActivity?.activity_name ?? "Choose a project to open its day plan.",
                  icon: Calendar,
                  color: "#3B82F6",
                },
                {
                  href: loopProject ? `/projects/${loopProject.id}/daily-log` : "",
                  label: "Log The Field",
                  body: "Weather, manpower, delays, work performed, and photos.",
                  icon: ClipboardList,
                  color: "#22C55E",
                },
                {
                  href: loopProject ? `/projects/${loopProject.id}/report` : "",
                  label: "Capture Issue",
                  body: "Create a report before the detail gets lost.",
                  icon: AlertTriangle,
                  color: "#F97316",
                },
                {
                  href: loopProject ? `/projects/${loopProject.id}` : "",
                  label: "Align Subs",
                  body: "Check readiness, reports, caveats, and the next handoff.",
                  icon: Send,
                  color: "#EAB308",
                },
              ];

              return (
                <>
                  {loopProject && (
                    <div className="mb-3 flex flex-col gap-2 rounded-xl border border-white/10 bg-black/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Selected project</p>
                        <p className="mt-1 text-sm font-black text-white">{loopProject.name}</p>
                      </div>
                      <Link
                        href={`/projects/${loopProject.id}`}
                        className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-lg bg-[#F97316] px-4 py-2 text-sm font-black text-white"
                      >
                        Open command center
                        <Flag size={15} />
                      </Link>
                    </div>
                  )}

            <div className="grid gap-3 md:grid-cols-4">
              {loopItems.map((item) => {
                const content = (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="grid h-10 w-10 place-items-center rounded-lg bg-white/10" style={{ color: item.color }}>
                        <item.icon size={18} />
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                        {loopProject ? "Next" : "Pick job"}
                      </span>
                    </div>
                    <h3 className="mt-4 text-sm font-black text-white">{item.label}</h3>
                    <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-400">{item.body}</p>
                  </>
                );

                if (!loopProject) {
                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => document.getElementById("dashboard-loop-project")?.focus()}
                      className="group rounded-xl border border-white/10 bg-black/20 p-4 text-left opacity-70 transition-all hover:border-white/20"
                    >
                      {content}
                    </button>
                  );
                }

                return (
                  <Link
                  key={item.label}
                  href={item.href}
                  className="group rounded-xl border border-white/10 bg-black/20 p-4 transition-all hover:-translate-y-0.5 hover:border-white/20"
                >
                  {content}
                </Link>
                );
              })}
            </div>
                </>
              );
            })()}
          </section>
        )}

        {/* Summary bar */}
        {projects.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-4">
              <div className="text-xs text-[color:var(--text-muted)] mb-1 uppercase tracking-wide">{t('dashboard.activeProjects')}</div>
              <div className="text-2xl font-bold text-[color:var(--text-primary)]">{projects.length}</div>
            </div>
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-4">
              <div className="text-xs text-[color:var(--text-muted)] mb-1 uppercase tracking-wide">{t('dashboard.highRisks')}</div>
              <div className="text-2xl font-bold text-[#EF4444]">
                {projects.reduce((s, p) => s + p.stats.highRisks, 0)}
              </div>
            </div>
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-4">
              <div className="text-xs text-[color:var(--text-muted)] mb-1 uppercase tracking-wide">{t('dashboard.overdueActivities')}</div>
              <div className="text-2xl font-bold text-[#EAB308]">
                {projects.reduce((s, p) => s + p.stats.lateActivities, 0)}
              </div>
            </div>
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-4">
              <div className="text-xs text-[color:var(--text-muted)] mb-1 uppercase tracking-wide">{t('dashboard.avgCompletion')}</div>
              <div className="text-2xl font-bold text-[#22C55E]">
                {projects.length > 0
                  ? Math.round(projects.reduce((s, p) => s + p.stats.completionPercent, 0) / projects.length)
                  : 0}%
              </div>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-3">
              <RefreshCw size={24} className="text-[#F97316] animate-spin" />
              <span className="text-[color:var(--text-muted)] text-sm">{t('dashboard.loadingProjects')}</span>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && projects.length === 0 && (
          <div className="flex flex-col items-center justify-center h-80 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#F97316]/10 border border-[#F97316]/20 flex items-center justify-center mb-4">
              <Building2 size={28} className="text-[#F97316]" />
            </div>
            <h2 className="text-xl font-bold text-[color:var(--text-primary)] mb-2">{t('dashboard.noProjectsYet')}</h2>
            <p className="text-[color:var(--text-muted)] text-sm max-w-sm mb-6">
              {t('dashboard.createFirstProject')}
            </p>
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-2 px-6 py-3 bg-[#F97316] hover:bg-[#ea6c0a] text-[color:var(--text-primary)] rounded-lg font-semibold transition-colors"
            >
              <Plus size={18} />
              {t('action.createFirstProject')}
            </button>
          </div>
        )}

        {/* Project cards grid */}
        {!loading && projects.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
            {projects.map((project) => {
              const colors = healthColor(project.health_score);
              return (
                <div
                  key={project.id}
                  className="group relative bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-2xl p-5 hover:border-[#F97316]/30 hover:shadow-lg hover:shadow-[#F97316]/5 transition-all"
                >
                  {/* Delete button */}
                  <button
                    onClick={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (!confirm(`Delete "${project.name}"? This will remove all activities, risks, and briefs for this project.`)) return;
                      const res = await fetch(`/api/projects?id=${project.id}`, { method: 'DELETE' });
                      if (res.ok) fetchProjects();
                      else alert('Failed to delete project');
                    }}
                    className="absolute top-3 right-3 w-7 h-7 rounded-lg bg-[var(--bg-tertiary)] hover:bg-red-500/20 flex items-center justify-center text-gray-600 hover:text-red-400 transition-all opacity-0 group-hover:opacity-100 z-10"
                    title="Delete project"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                  </button>
                  <Link href={`/projects/${project.id}`} className="block">
                  {/* Card header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${colors.dot}`} />
                        <span className="text-xs text-[color:var(--text-muted)] font-mono">
                          {project.project_number || "—"}
                        </span>
                      </div>
                      <h3 className="font-bold text-[color:var(--text-primary)] text-lg leading-tight truncate group-hover:text-[#F97316] transition-colors">
                        {project.name}
                      </h3>
                      <p className="text-sm text-[color:var(--text-muted)] mt-0.5 truncate">
                        {project.client_name} · {project.location}
                      </p>
                    </div>
                    <div className={`ml-3 px-2 py-1 rounded-lg text-xs font-bold ${colors.bg} ${colors.text} ${colors.border} border`}>
                      {project.health_score}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-[color:var(--text-muted)]">{t('dashboard.scheduleProgress')}</span>
                      <span className="text-[color:var(--text-secondary)] font-semibold">{project.stats.completionPercent}%</span>
                    </div>
                    <div className="h-1.5 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#F97316] to-[#3B82F6] rounded-full transition-all"
                        style={{ width: `${project.stats.completionPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Today's activity */}
                  {project.stats.todayActivity && (
                    <div className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg px-3 py-2 mb-4">
                      <div className="text-[10px] text-gray-600 uppercase tracking-wide mb-0.5">{t('dashboard.today')}</div>
                      <div className="text-xs text-[color:var(--text-secondary)] truncate">{project.stats.todayActivity.activity_name}</div>
                      <div className="text-[10px] text-[#F97316] mt-0.5">{project.stats.todayActivity.trade}</div>
                    </div>
                  )}

                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-0.5">
                        <AlertTriangle size={11} className="text-[#EF4444]" />
                        <span className="text-sm font-bold text-[color:var(--text-primary)]">{project.stats.highRisks}</span>
                      </div>
                      <div className="text-[10px] text-gray-600">{t('dashboard.risks')}</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-0.5">
                        <TrendingDown size={11} className="text-[#EAB308]" />
                        <span className="text-sm font-bold text-[color:var(--text-primary)]">{project.stats.lateActivities}</span>
                      </div>
                      <div className="text-[10px] text-gray-600">{t('dashboard.overdue')}</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-0.5">
                        <Clock size={11} className="text-[#3B82F6]" />
                        <span className="text-sm font-bold text-[color:var(--text-primary)]">
                          {project.stats.daysToCompletion !== null
                            ? project.stats.daysToCompletion > 0
                              ? `${project.stats.daysToCompletion}d`
                              : "OVR"
                            : "—"}
                        </span>
                      </div>
                      <div className="text-[10px] text-gray-600">{t('dashboard.toFinish')}</div>
                    </div>
                  </div>

                  {/* Next milestone */}
                  {project.stats.nextMilestone && (
                    <div className="mt-3 pt-3 border-t border-[var(--border-primary)] flex items-center gap-2">
                      <Flag size={11} className="text-[#F97316] shrink-0" />
                      <span className="text-xs text-[color:var(--text-muted)] truncate flex-1">
                        {project.stats.nextMilestone.activity_name}
                      </span>
                      <span className="text-xs text-[color:var(--text-secondary)] shrink-0">
                        {formatDate(project.stats.nextMilestone.finish_date)}
                      </span>
                    </div>
                  )}
                </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showAdd && (
        <AddProjectModal
          onClose={() => setShowAdd(false)}
          onCreated={() => {
            setShowAdd(false);
            fetchProjects();
          }}
        />
      )}

      {!loading && !dbError && (
        <DashboardOnboardingWizard
          projectCount={projects.length}
          userId={userId}
          onCreateProject={() => setShowAdd(true)}
        />
      )}
    </div>
  );
}
