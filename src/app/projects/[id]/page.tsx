"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  ArrowLeft, CalendarDays, CalendarCheck, CalendarPlus, Flag, TrendingUp,
  RefreshCw, Zap
} from "lucide-react";
import WeekTab from "@/components/tabs/WeekTab";
import MilestonesTab from "@/components/tabs/MilestonesTab";
import ProgressTab from "@/components/tabs/ProgressTab";
import DayPlanTab from "@/components/tabs/DayPlanTab";
import PriorityTab from "@/components/tabs/PriorityTab";
import { SupportButton } from "@/components/support-button";

const TABS = [
  { id: "priority", label: "Priority", icon: Zap },
  { id: "today", label: "Today", icon: CalendarCheck },
  { id: "tomorrow", label: "Tomorrow", icon: CalendarPlus },
  { id: "week1", label: "Week 1", icon: CalendarDays },
  { id: "week2", label: "Week 2", icon: CalendarDays },
  { id: "week3", label: "Week 3", icon: CalendarDays },
  { id: "milestones", label: "Milestones", icon: Flag },
  { id: "progress", label: "Progress", icon: TrendingUp },
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
  const [activeTab, setActiveTab] = useState("priority");
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
    <div className="min-h-screen bg-[#0B0B0D]">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-[#0B0B0D]/95 backdrop-blur border-b border-[#1F1F25]">
        <div className="px-6 pt-4 pb-0 max-w-7xl mx-auto">
          <div className="flex items-start justify-between mb-4">
            <div>
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 text-gray-500 hover:text-white text-sm mb-2 transition-colors"
              >
                <ArrowLeft size={14} />
                Back
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
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {activeTab === "priority" && <PriorityTab projectId={id} />}
        {activeTab === "today" && <DayPlanTab projectId={id} day="today" />}
        {activeTab === "tomorrow" && <DayPlanTab projectId={id} day="tomorrow" />}
        {activeTab === "week1" && <WeekTab projectId={id} weekNumber={1} />}
        {activeTab === "week2" && <WeekTab projectId={id} weekNumber={2} />}
        {activeTab === "week3" && <WeekTab projectId={id} weekNumber={3} />}
        {activeTab === "milestones" && <MilestonesTab projectId={id} />}
        {activeTab === "progress" && <ProgressTab projectId={id} />}
      </div>
    </div>
  );
}
