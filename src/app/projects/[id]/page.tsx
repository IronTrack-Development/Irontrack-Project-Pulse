"use client";

import { useEffect, useState, use, Suspense } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  ArrowLeft,
  RefreshCw, ClipboardList, FileBarChart2, Settings,
} from "lucide-react";
import SettingsPanel from "@/components/settings/SettingsPanel";
import ProjectNav from "@/components/navigation/ProjectNav";
import { SupportButton } from "@/components/support-button";
import NotificationBell from "@/components/NotificationBell";
import { ProjectDataProvider } from "@/lib/ProjectDataContext";
import { t } from "@/lib/i18n";

// ---------------------------------------------------------------------------
// Lazy-loaded tab components — only fetched when the user navigates to them
// ---------------------------------------------------------------------------
const WeekTab = dynamic(() => import("@/components/tabs/WeekTab"), { ssr: false });
const MilestonesTab = dynamic(() => import("@/components/tabs/MilestonesTab"), { ssr: false });
const ProgressTab = dynamic(() => import("@/components/tabs/ProgressTab"), { ssr: false });
const DayPlanTab = dynamic(() => import("@/components/tabs/DayPlanTab"), { ssr: false });
const PriorityTab = dynamic(() => import("@/components/tabs/PriorityTab"), { ssr: false });
const ReportsTab = dynamic(() => import("@/components/tabs/ReportsTab"), { ssr: false });
const ReforecastTab = dynamic(() => import("@/components/tabs/ReforecastTab"), { ssr: false });
const SubsTab = dynamic(() => import("@/components/tabs/SubsTab"), { ssr: false });
const SixWeekTab = dynamic(() => import("@/components/tabs/SixWeekTab"), { ssr: false });
const DailyLogTab = dynamic(() => import("@/components/tabs/DailyLogTab"), { ssr: false });
const InspectionsTab = dynamic(() => import("@/components/tabs/InspectionsTab"), { ssr: false });
const DirectoryTab = dynamic(() => import("@/components/tabs/DirectoryTab"), { ssr: false });
const SubmittalsTab = dynamic(() => import("@/components/tabs/SubmittalsTab"), { ssr: false });
const TMTab = dynamic(() => import("@/components/tabs/TMTab"), { ssr: false });
const RFIsTab = dynamic(() => import("@/components/tabs/RFIsTab"), { ssr: false });
const DrawingsTab = dynamic(() => import("@/components/tabs/DrawingsTab"), { ssr: false });
const PunchListTab = dynamic(() => import("@/components/tabs/PunchListTab"), { ssr: false });
const SafetyTab = dynamic(() => import("@/components/tabs/SafetyTab"), { ssr: false });
const CoordinationTab = dynamic(() => import("@/components/tabs/CoordinationTab"), { ssr: false });
const FieldReportsTab = dynamic(() => import("@/components/tabs/FieldReportsTab"), { ssr: false });

// ---------------------------------------------------------------------------
// TabLoader — shown while a lazy-loaded tab chunk is downloading
// ---------------------------------------------------------------------------
function TabLoader() {
  return (
    <div className="flex items-center justify-center py-20">
      <RefreshCw size={20} className="text-[#F97316] animate-spin" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// KeepAliveTab — keeps frequently-used tabs mounted (hidden) to avoid
// re-fetching data on every tab switch. Only used for the busiest tabs.
// ---------------------------------------------------------------------------
function KeepAliveTab({ active, children }: { active: boolean; children: React.ReactNode }) {
  const [hasBeenActive, setHasBeenActive] = useState(false);

  useEffect(() => {
    if (active && !hasBeenActive) setHasBeenActive(true);
  }, [active, hasBeenActive]);

  if (!hasBeenActive) return null;

  return (
    <div style={{ display: active ? "block" : "none" }}>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tabs that use KeepAlive (high-frequency, data-heavy)
// ---------------------------------------------------------------------------
const KEEP_ALIVE_TABS = new Set([
  "priority", "today", "tomorrow", "week1", "week2", "week3", "dailylog", "progress",
]);

interface Project {
  id: string;
  name: string;
  project_number?: string;
  client_name?: string;
  location?: string;
  status: string;
  health_score: number;
  start_date?: string;
  target_finish_date?: string;
  stats: {
    totalActivities: number;
    completeActivities: number;
    inProgressActivities: number;
    lateActivities: number;
    milestoneCount: number;
    highRisks: number;
    mediumRisks: number;
    completionPercent: number;
    daysToCompletion: number | null;
    nextMilestone: { activity_name: string; finish_date: string } | null;
  };
}

function healthColor(score: number): string {
  if (score >= 85) return "#22C55E";
  if (score >= 70) return "#EAB308";
  return "#EF4444";
}

export default function ProjectDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [activeTab, setActiveTab] = useState("priority");
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [projectError, setProjectError] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const fetchProject = async () => {
    setLoading(true);
    setProjectError(null);
    try {
      const res = await fetch(`/api/projects/${id}`);
      if (!res.ok) {
        setProject(null);
        setProjectError(res.status === 404 ? "Project not found." : "Could not load this project right now.");
        return;
      }
      setProject(await res.json());
    } catch {
      setProject(null);
      setProjectError("Network error while loading this project.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProject();
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto flex min-h-[55vh] max-w-md items-center justify-center px-6">
        <div className="w-full rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-6 text-center shadow-[0_18px_60px_rgba(0,0,0,0.18)]">
          <RefreshCw size={26} className="mx-auto mb-4 text-[#F97316] animate-spin" />
          <h1 className="text-lg font-bold text-[color:var(--text-primary)]">Loading project command center</h1>
          <p className="mt-2 text-sm text-[color:var(--text-muted)]">
            Pulling today&apos;s plan, ready checks, field status, and reports.
          </p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="mx-auto max-w-xl px-6 py-16 text-center">
        <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-6">
          <h1 className="text-xl font-bold text-[color:var(--text-primary)]">
            {projectError ?? "Project not found."}
          </h1>
          <p className="mt-2 text-sm text-[color:var(--text-muted)]">
            If this project should be available, refresh once or contact support so we can trace the issue.
          </p>
          <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              onClick={fetchProject}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#F97316] px-4 py-2 text-sm font-bold text-white"
            >
              <RefreshCw size={15} />
              Retry
            </button>
            <Link href="/dashboard" className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-[var(--border-primary)] px-4 py-2 text-sm font-semibold text-[color:var(--text-secondary)]">
              Back to dashboard
            </Link>
          </div>
        </div>
        <div className="mt-5">
          <SupportButton context="Project command center load error" variant="inline" />
        </div>
      </div>
    );
  }

  const color = healthColor(project.health_score);

  // Helper: render a tab with Suspense. KeepAlive tabs stay mounted; others unmount.
  function renderTab(tabKey: string, node: React.ReactNode) {
    if (KEEP_ALIVE_TABS.has(tabKey)) {
      return (
        <KeepAliveTab active={activeTab === tabKey}>
          <Suspense fallback={<TabLoader />}>{node}</Suspense>
        </KeepAliveTab>
      );
    }
    if (activeTab !== tabKey) return null;
    return <Suspense fallback={<TabLoader />}>{node}</Suspense>;
  }

  return (
    <div className="min-h-screen overflow-x-hidden pb-20 md:pb-0" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Header */}
      <div className="sticky top-0 z-20 backdrop-blur border-b" style={{ backgroundColor: 'color-mix(in srgb, var(--bg-primary) 95%, transparent)', borderColor: 'var(--border-primary)' }}>
        <div className="px-4 md:px-6 pt-3 md:pt-4 pb-0 max-w-7xl mx-auto">
          {/* Top row: back + action buttons */}
          <div className="flex items-center justify-between mb-2">
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)] text-sm transition-colors min-h-[44px]"
            >
              <ArrowLeft size={16} />
              {t('action.back')}
            </Link>
            <div className="flex items-center gap-1.5 md:gap-3">
              <button
                onClick={fetchProject}
                aria-label="Refresh project"
                className="p-2.5 rounded-lg bg-[var(--bg-tertiary)] text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                <RefreshCw size={16} />
              </button>
              <NotificationBell projectId={id} />
              <button
                onClick={() => setSettingsOpen(true)}
                className="md:hidden p-2.5 rounded-lg bg-[var(--bg-tertiary)] text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                <Settings size={16} />
              </button>
              <Link
                href={`/projects/${id}/weekly-summary`}
                className="hidden sm:flex items-center gap-1.5 px-3 py-2.5 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] text-[color:var(--text-secondary)] rounded-lg text-xs font-medium transition-colors min-h-[44px]"
              >
                <FileBarChart2 size={14} />
                <span>{t('action.weeklySummary')}</span>
              </Link>
              <Link
                href={`/projects/${id}/report`}
                className="flex items-center gap-1.5 px-3 py-2.5 bg-[#F97316] hover:bg-[#ea6c10] text-[color:var(--text-primary)] rounded-lg text-xs font-bold transition-colors min-h-[44px]"
              >
                <ClipboardList size={14} />
                <span className="hidden sm:inline">{t('action.observe')}</span>
              </Link>
              <Link
                href={`/upload?project=${id}`}
                className="hidden md:flex px-3 py-2.5 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] text-[color:var(--text-secondary)] rounded-lg text-xs font-medium transition-colors min-h-[44px] items-center"
              >
                {t('action.uploadSchedule')}
              </Link>
            </div>
          </div>

          {/* Project name + info */}
          <div className="mb-3">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }}
              />
              <h1 className="text-lg md:text-xl font-bold text-[color:var(--text-primary)] truncate">{project.name}</h1>
            </div>
            {(project.client_name || project.location) && (
              <p className="text-xs md:text-sm text-[color:var(--text-muted)] mt-0.5 ml-5 truncate">
                {[project.client_name, project.location].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>

          {/* Grouped navigation */}
          <ProjectNav activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
      </div>

      {/* Tab content — wrapped in shared data provider */}
      <ProjectDataProvider projectId={id}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-6">
          {/* KeepAlive tabs (stay mounted once visited) */}
          {renderTab("priority", <PriorityTab projectId={id} />)}
          {renderTab("dailylog", <DailyLogTab projectId={id} />)}
          {renderTab("today", <DayPlanTab projectId={id} day="today" />)}
          {renderTab("tomorrow", <DayPlanTab projectId={id} day="tomorrow" />)}
          {renderTab("week1", <WeekTab projectId={id} weekNumber={1} />)}
          {renderTab("week2", <WeekTab projectId={id} weekNumber={2} />)}
          {renderTab("week3", <WeekTab projectId={id} weekNumber={3} />)}
          {renderTab("progress", <ProgressTab projectId={id} />)}

          {/* Standard tabs (unmount when switching away) */}
          {renderTab("inspections", <InspectionsTab projectId={id} />)}
          {renderTab("milestones", <MilestonesTab projectId={id} />)}
          {renderTab("reforecast", <ReforecastTab projectId={id} />)}
          {renderTab("reports", <ReportsTab projectId={id} />)}
          {renderTab("6week", <SixWeekTab projectId={id} />)}
          {renderTab("subs", <SubsTab projectId={id} />)}
          {renderTab("directory", <DirectoryTab projectId={id} />)}
          {renderTab("submittals", <SubmittalsTab projectId={id} />)}
          {renderTab("rfis", <RFIsTab projectId={id} />)}
          {renderTab("tm", <TMTab projectId={id} />)}
          {renderTab("drawings", <DrawingsTab projectId={id} />)}
          {renderTab("punch", <PunchListTab projectId={id} />)}
          {renderTab("safety", <SafetyTab projectId={id} />)}
          {renderTab("field-reports", <FieldReportsTab projectId={id} />)}
          {renderTab("coordination", <CoordinationTab projectId={id} />)}
          {renderTab("action-tracker", <CoordinationTab projectId={id} defaultView="actions" />)}
        </div>
      </ProjectDataProvider>

      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
