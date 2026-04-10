"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  ArrowLeft, Activity, CalendarDays, List, AlertTriangle, Flag,
  RefreshCw, Zap
} from "lucide-react";
import OverviewTab from "@/components/tabs/OverviewTab";
import TodayTab from "@/components/tabs/TodayTab";
import LookaheadTab from "@/components/tabs/LookaheadTab";
import ActivitiesTab from "@/components/tabs/ActivitiesTab";
import RisksTab from "@/components/tabs/RisksTab";
import MilestonesTab from "@/components/tabs/MilestonesTab";

const TABS = [
  { id: "overview", label: "Overview", icon: Activity },
  { id: "today", label: "Today", icon: Zap },
  { id: "lookahead", label: "Lookahead", icon: CalendarDays },
  { id: "activities", label: "Activities", icon: List },
  { id: "risks", label: "Risks", icon: AlertTriangle },
  { id: "milestones", label: "Milestones", icon: Flag },
];

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
  const [activeTab, setActiveTab] = useState("overview");
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

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
      <div className="p-8 text-center text-gray-500">
        Project not found.{" "}
        <Link href="/" className="text-[#F97316]">Go back</Link>
      </div>
    );
  }

  const color = healthColor(project.health_score);

  return (
    <div className="min-h-screen bg-[#0B0B0D]">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-[#0B0B0D]/95 backdrop-blur border-b border-[#1F1F25]">
        <div className="px-6 pt-4 pb-0 max-w-7xl mx-auto">
          <div className="flex items-start justify-between mb-4">
            <div>
              <Link
                href="/"
                className="flex items-center gap-1.5 text-gray-500 hover:text-white text-sm mb-2 transition-colors"
              >
                <ArrowLeft size={14} />
                Dashboard
              </Link>
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }}
                />
                <h1 className="text-xl font-bold text-white">{project.name}</h1>
                <span className="text-xs text-gray-500 font-mono">{project.project_number}</span>
              </div>
              <p className="text-sm text-gray-500 mt-0.5 ml-6">
                {project.client_name} · {project.location}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchProject}
                className="p-2 rounded-lg bg-[#1F1F25] text-gray-400 hover:text-white transition-colors"
              >
                <RefreshCw size={15} />
              </button>
              <Link
                href={`/upload?project=${id}`}
                className="px-3 py-1.5 bg-[#1F1F25] hover:bg-[#2a2a35] text-gray-300 rounded-lg text-xs font-medium transition-colors"
              >
                Upload Schedule
              </Link>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-0 overflow-x-auto scrollbar-none -mx-1 px-1">
            {TABS.map(({ id: tabId, label, icon: Icon }) => (
              <button
                key={tabId}
                onClick={() => setActiveTab(tabId)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                  activeTab === tabId
                    ? "border-[#F97316] text-[#F97316]"
                    : "border-transparent text-gray-500 hover:text-gray-300"
                }`}
              >
                <Icon size={14} />
                {label}
                {tabId === "risks" && project.stats.highRisks > 0 && (
                  <span className="bg-[#EF4444] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-0.5">
                    {project.stats.highRisks}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {activeTab === "overview" && <OverviewTab project={project} />}
        {activeTab === "today" && <TodayTab projectId={id} />}
        {activeTab === "lookahead" && <LookaheadTab projectId={id} />}
        {activeTab === "activities" && <ActivitiesTab projectId={id} />}
        {activeTab === "risks" && <RisksTab projectId={id} onUpdate={fetchProject} />}
        {activeTab === "milestones" && <MilestonesTab projectId={id} />}
      </div>
    </div>
  );
}
