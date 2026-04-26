"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  RefreshCw, ClipboardList, FileBarChart2, Settings,
} from "lucide-react";
import SettingsPanel from "@/components/settings/SettingsPanel";
import ProjectNav from "@/components/navigation/ProjectNav";
import WeekTab from "@/components/tabs/WeekTab";
import MilestonesTab from "@/components/tabs/MilestonesTab";
import ProgressTab from "@/components/tabs/ProgressTab";
import DayPlanTab from "@/components/tabs/DayPlanTab";
import PriorityTab from "@/components/tabs/PriorityTab";
import ReportsTab from "@/components/tabs/ReportsTab";
import ReforecastTab from "@/components/tabs/ReforecastTab";
import SubsTab from "@/components/tabs/SubsTab";
import SixWeekTab from "@/components/tabs/SixWeekTab";
import { SupportButton } from "@/components/support-button";
import ShareSnapshot from "@/components/ShareSnapshot";
import NotificationBell from "@/components/NotificationBell";
import DailyLogTab from "@/components/tabs/DailyLogTab";
import InspectionsTab from "@/components/tabs/InspectionsTab";
import DirectoryTab from "@/components/tabs/DirectoryTab";
import SubmittalsTab from "@/components/tabs/SubmittalsTab";
import TMTab from "@/components/tabs/TMTab";
import RFIsTab from "@/components/tabs/RFIsTab";
import DrawingsTab from "@/components/tabs/DrawingsTab";
import PunchListTab from "@/components/tabs/PunchListTab";
import SafetyTab from "@/components/tabs/SafetyTab";
import CoordinationTab from "@/components/tabs/CoordinationTab";
import FieldReportsTab from "@/components/tabs/FieldReportsTab";
import SubDashboardTab from "@/components/tabs/SubDashboardTab";
import SubDispatchTab from "@/components/tabs/SubDispatchTab";
import SubForemenTab from "@/components/tabs/SubForemenTab";
import SubCheckinsTab from "@/components/tabs/SubCheckinsTab";
import SubProductionTab from "@/components/tabs/SubProductionTab";
import SubBlockersTab from "@/components/tabs/SubBlockersTab";
import SubSOPsTab from "@/components/tabs/SubSOPsTab";
import SubHandoffsTab from "@/components/tabs/SubHandoffsTab";
import SubCrewTab from "@/components/tabs/SubCrewTab";

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
  const [settingsOpen, setSettingsOpen] = useState(false);

  const fetchProject = async () => {
    setLoading(true);
    const res = await fetch(`/api/projects/${id}`);
    if (res.ok) setProject(await res.json());
    setLoading(false);
  };

  useEffect(() => {
    fetchProject();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw size={24} className="text-[#F97316] animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500 mb-4">
          Project not found.{" "}
          <Link href="/dashboard" className="text-[#F97316]">Go back</Link>
        </p>
        <SupportButton context="Project not found error" variant="inline" />
      </div>
    );
  }

  const color = healthColor(project.health_score);

  return (
    <div className="min-h-screen overflow-x-hidden pb-16 md:pb-0" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Header */}
      <div className="sticky top-0 z-20 backdrop-blur border-b" style={{ backgroundColor: 'color-mix(in srgb, var(--bg-primary) 95%, transparent)', borderColor: 'var(--border-primary)' }}>
        <div className="px-4 md:px-6 pt-3 md:pt-4 pb-0 max-w-7xl mx-auto">
          {/* Top row: back + action buttons */}
          <div className="flex items-center justify-between mb-2">
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 text-gray-500 hover:text-white text-sm transition-colors min-h-[44px]"
            >
              <ArrowLeft size={16} />
              Back
            </Link>
            <div className="flex items-center gap-1.5 md:gap-3">
              <button
                onClick={fetchProject}
                className="p-2.5 rounded-lg bg-[#1F1F25] text-gray-400 hover:text-white transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                <RefreshCw size={16} />
              </button>
              <NotificationBell projectId={id} />
              <ShareSnapshot projectId={id} />
              <button
                onClick={() => setSettingsOpen(true)}
                className="p-2.5 rounded-lg bg-[#1F1F25] text-gray-400 hover:text-white transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                <Settings size={16} />
              </button>
              <Link
                href={`/projects/${id}/weekly-summary`}
                className="hidden sm:flex items-center gap-1.5 px-3 py-2.5 bg-[#1F1F25] hover:bg-[#2a2a35] text-gray-300 rounded-lg text-xs font-medium transition-colors min-h-[44px]"
              >
                <FileBarChart2 size={14} />
                <span>Weekly Summary</span>
              </Link>
              <Link
                href={`/projects/${id}/report`}
                className="flex items-center gap-1.5 px-3 py-2.5 bg-[#F97316] hover:bg-[#ea6c10] text-white rounded-lg text-xs font-bold transition-colors min-h-[44px]"
              >
                <ClipboardList size={14} />
                <span className="hidden sm:inline">Observe</span>
              </Link>
              <Link
                href={`/upload?project=${id}`}
                className="hidden md:flex px-3 py-2.5 bg-[#1F1F25] hover:bg-[#2a2a35] text-gray-300 rounded-lg text-xs font-medium transition-colors min-h-[44px] items-center"
              >
                Upload Schedule
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
              <h1 className="text-lg md:text-xl font-bold text-white truncate">{project.name}</h1>
            </div>
            {(project.client_name || project.location) && (
              <p className="text-xs md:text-sm text-gray-500 mt-0.5 ml-5 truncate">
                {[project.client_name, project.location].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>

          {/* Grouped navigation */}
          <ProjectNav activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
      </div>

      {/* Tab content */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-6">
        {activeTab === "priority" && <PriorityTab projectId={id} />}
        {activeTab === "dailylog" && <DailyLogTab projectId={id} />}
        {activeTab === "inspections" && <InspectionsTab projectId={id} />}
        {activeTab === "today" && <DayPlanTab projectId={id} day="today" />}
        {activeTab === "tomorrow" && <DayPlanTab projectId={id} day="tomorrow" />}
        {activeTab === "week1" && <WeekTab projectId={id} weekNumber={1} />}
        {activeTab === "week2" && <WeekTab projectId={id} weekNumber={2} />}
        {activeTab === "week3" && <WeekTab projectId={id} weekNumber={3} />}
        {activeTab === "milestones" && <MilestonesTab projectId={id} />}
        {activeTab === "progress" && <ProgressTab projectId={id} />}
        {activeTab === "reforecast" && <ReforecastTab projectId={id} />}
        {activeTab === "reports" && <ReportsTab projectId={id} />}
        {activeTab === "6week" && <SixWeekTab projectId={id} />}
        {activeTab === "subs" && <SubsTab projectId={id} />}
        {activeTab === "directory" && <DirectoryTab projectId={id} />}
        {activeTab === "submittals" && <SubmittalsTab projectId={id} />}
        {activeTab === "rfis" && <RFIsTab projectId={id} />}
        {activeTab === "tm" && <TMTab projectId={id} />}
        {activeTab === "drawings" && <DrawingsTab projectId={id} />}
        {activeTab === "punch" && <PunchListTab projectId={id} />}
        {activeTab === "safety" && <SafetyTab projectId={id} />}
        {activeTab === "field-reports" && <FieldReportsTab projectId={id} />}
        {activeTab === "coordination" && <CoordinationTab projectId={id} />}
        {activeTab === "action-tracker" && <CoordinationTab projectId={id} defaultView="actions" />}
        {activeTab === "sub-dashboard" && <SubDashboardTab projectId={id} />}
        {activeTab === "sub-dispatch" && <SubDispatchTab projectId={id} />}
        {activeTab === "sub-foremen" && <SubForemenTab projectId={id} />}
        {activeTab === "sub-checkins" && <SubCheckinsTab projectId={id} />}
        {activeTab === "sub-production" && <SubProductionTab projectId={id} />}
        {activeTab === "sub-blockers" && <SubBlockersTab projectId={id} />}
        {activeTab === "sub-handoffs" && <SubHandoffsTab projectId={id} />}
        {activeTab === "sub-crew" && <SubCrewTab projectId={id} />}
        {activeTab === "sub-sops" && <SubSOPsTab projectId={id} />}
      </div>

      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
