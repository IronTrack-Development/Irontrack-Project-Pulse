"use client";

import { useState, useEffect, useRef } from "react";
import {
  CalendarDays,
  CalendarCheck,
  CalendarPlus,
  Flag,
  Zap,
  ClipboardList,
  Binoculars,
  GitBranch,
  ShieldCheck,
  CheckSquare,
  FileText,
  Handshake,
  FileCheck,
  MessageCircleQuestion,
  Layers,
  Receipt,
  BarChart3,
  TrendingUp,
  Eye,
  Users,
  Shield,
  HardHat,
  Camera,
  Send,
  CheckCircle,
  AlertTriangle,
  ArrowRightLeft,
} from "lucide-react";
import MobileBottomNav from "./MobileBottomNav";

// ─── Group & Tab Definitions ──────────────────────────────────────────────────

interface TabDef {
  id: string;
  label: string;
  icon: React.ElementType;
}

interface GroupDef {
  id: string;
  label: string;
  icon: React.ElementType;
  tabs: TabDef[];
}

const NAV_GROUPS: GroupDef[] = [
  {
    id: "schedule",
    label: "Schedule",
    icon: CalendarDays,
    tabs: [
      { id: "priority", label: "Priority", icon: Zap },
      { id: "today", label: "Today", icon: CalendarCheck },
      { id: "tomorrow", label: "Tomorrow", icon: CalendarPlus },
      { id: "week1", label: "Week 1", icon: CalendarDays },
      { id: "week2", label: "Week 2", icon: CalendarDays },
      { id: "week3", label: "Week 3", icon: CalendarDays },
      { id: "6week", label: "6-Week", icon: Binoculars },
      { id: "milestones", label: "Milestones", icon: Flag },
      { id: "reforecast", label: "Reforecast", icon: GitBranch },
    ],
  },
  {
    id: "fieldops",
    label: "Field Ops",
    icon: ClipboardList,
    tabs: [
      { id: "dailylog", label: "Daily Log", icon: ClipboardList },
      { id: "inspections", label: "Inspections", icon: ShieldCheck },
      { id: "field-reports", label: "Reports", icon: Camera },
      { id: "punch", label: "Punch List", icon: CheckSquare },
      { id: "reports", label: "Observations", icon: Eye },
    ],
  },
  {
    id: "coordination",
    label: "Coordination",
    icon: Handshake,
    tabs: [
      { id: "coordination", label: "Meetings", icon: Handshake },
      { id: "action-tracker", label: "Action Items", icon: CheckSquare },
    ],
  },
  {
    id: "documents",
    label: "Documents",
    icon: FileText,
    tabs: [
      { id: "submittals", label: "Submittals", icon: FileCheck },
      { id: "rfis", label: "RFIs", icon: MessageCircleQuestion },
      { id: "drawings", label: "Drawings", icon: Layers },
    ],
  },
  {
    id: "money",
    label: "Money",
    icon: Receipt,
    tabs: [
      { id: "tm", label: "T&M", icon: Receipt },
    ],
  },
  {
    id: "safety",
    label: "Safety",
    icon: Shield,
    tabs: [
      { id: "safety", label: "Toolbox Talks", icon: Shield },
    ],
  },
  {
    id: "project",
    label: "Project",
    icon: BarChart3,
    tabs: [
      { id: "progress", label: "Progress", icon: TrendingUp },
      { id: "directory", label: "Directory", icon: Users },
      { id: "subs", label: "Subs", icon: Users },
    ],
  },
  {
    id: "subops",
    label: "Sub Ops",
    icon: HardHat,
    tabs: [
      { id: "sub-dashboard", label: "Dashboard", icon: BarChart3 },
      { id: "sub-dispatch", label: "Dispatch", icon: Send },
      { id: "sub-foremen", label: "Foremen", icon: Users },
      { id: "sub-checkins", label: "Check-Ins", icon: CheckCircle },
      { id: "sub-production", label: "Production", icon: TrendingUp },
      { id: "sub-blockers", label: "Blockers", icon: AlertTriangle },
      { id: "sub-handoffs", label: "Handoffs", icon: ArrowRightLeft },
      { id: "sub-crew", label: "Crew", icon: HardHat },
      { id: "sub-sops", label: "SOPs", icon: FileText },
    ],
  },
];

// Helper: find which group owns a given tab id
function findGroupForTab(tabId: string): string {
  for (const group of NAV_GROUPS) {
    if (group.tabs.some((t) => t.id === tabId)) return group.id;
  }
  return "schedule";
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface ProjectNavProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProjectNav({ activeTab, onTabChange }: ProjectNavProps) {
  // Which group is currently open — auto-detect from activeTab
  const [activeGroupId, setActiveGroupId] = useState<string>(
    () => findGroupForTab(activeTab)
  );

  // Remember last selected tab per group so switching back restores position
  const lastTabPerGroup = useRef<Record<string, string>>({
    schedule: "priority",
    fieldops: "dailylog",
    coordination: "coordination",
    documents: "submittals",
    money: "tm",
    safety: "safety",
    project: "progress",
    subops: "sub-dashboard",
  });

  // Keep activeGroupId in sync when parent changes activeTab externally
  useEffect(() => {
    const group = findGroupForTab(activeTab);
    if (group !== activeGroupId) {
      setActiveGroupId(group);
    }
    // Also keep last-tab memory updated
    lastTabPerGroup.current[group] = activeTab;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  function handleGroupClick(groupId: string) {
    setActiveGroupId(groupId);
    // Restore last selected tab for this group, or fall back to first
    const group = NAV_GROUPS.find((g) => g.id === groupId)!;
    const remembered = lastTabPerGroup.current[groupId];
    const target =
      remembered && group.tabs.some((t) => t.id === remembered)
        ? remembered
        : group.tabs[0].id;
    onTabChange(target);
  }

  const activeGroup = NAV_GROUPS.find((g) => g.id === activeGroupId) ?? NAV_GROUPS[0];

  return (
    <>
      {/* ── Desktop: two-row nav (hidden on mobile) ─────────────────────────── */}
      <div className="hidden md:block">
        {/* Row 1: Group pills */}
        <div className="flex items-center gap-2 pb-2 border-b border-[#1F1F25]">
          {NAV_GROUPS.map(({ id, label, icon: Icon }) => {
            const isActive = activeGroupId === id;
            return (
              <button
                key={id}
                onClick={() => handleGroupClick(id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all min-h-[36px] whitespace-nowrap"
                style={{
                  background: isActive ? "#F97316" : "#1F1F25",
                  color: isActive ? "#fff" : "#9CA3AF",
                }}
              >
                <Icon size={13} />
                {label}
              </button>
            );
          })}
        </div>

        {/* Row 2: Tab row for active group */}
        <div className="flex gap-0 overflow-x-auto scrollbar-none">
          {activeGroup.tabs.map(({ id: tabId, label, icon: Icon }) => {
            const isActive = activeTab === tabId;
            return (
              <button
                key={tabId}
                onClick={() => {
                  lastTabPerGroup.current[activeGroupId] = tabId;
                  onTabChange(tabId);
                }}
                className="flex items-center gap-1.5 px-3 md:px-4 py-2.5 text-xs md:text-sm font-medium border-b-2 transition-all whitespace-nowrap min-h-[44px]"
                style={{
                  borderBottomColor: isActive ? "#F97316" : "transparent",
                  color: isActive ? "#F97316" : "#6B7280",
                }}
              >
                <Icon size={14} />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Mobile: group pills + sub-tab strip ──────────────────────────── */}
      <div className="md:hidden">
        {/* Group selector pills */}
        <div className="flex items-center gap-2 pb-2 overflow-x-auto scrollbar-none">
          {NAV_GROUPS.map(({ id, label, icon: Icon }) => {
            const isActive = activeGroupId === id;
            return (
              <button
                key={id}
                onClick={() => handleGroupClick(id)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold transition-all min-h-[36px] whitespace-nowrap shrink-0"
                style={{
                  background: isActive ? "#F97316" : "#1F1F25",
                  color: isActive ? "#fff" : "#9CA3AF",
                }}
              >
                <Icon size={13} />
                {label}
              </button>
            );
          })}
        </div>

        {/* Sub-tab strip for active group (skip if only 1 tab) */}
        {activeGroup.tabs.length > 1 && (
          <div className="flex gap-0 overflow-x-auto scrollbar-none -mx-1 px-1 border-b border-[#1F1F25]">
            {activeGroup.tabs.map(({ id: tabId, label, icon: Icon }) => {
              const isActive = activeTab === tabId;
              return (
                <button
                  key={tabId}
                  onClick={() => {
                    lastTabPerGroup.current[activeGroupId] = tabId;
                    onTabChange(tabId);
                  }}
                  className="flex items-center gap-1.5 px-3 py-3 text-xs font-medium border-b-2 transition-all whitespace-nowrap min-h-[44px]"
                  style={{
                    borderBottomColor: isActive ? "#F97316" : "transparent",
                    color: isActive ? "#F97316" : "#6B7280",
                  }}
                >
                  <Icon size={14} />
                  {label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
