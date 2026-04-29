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
  Camera,
} from "lucide-react";
import MobileBottomNav from "./MobileBottomNav";
import { t } from "@/lib/i18n";

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

interface TabDefI18n {
  id: string;
  labelKey: string;
  icon: React.ElementType;
}

interface GroupDefI18n {
  id: string;
  labelKey: string;
  icon: React.ElementType;
  tabs: TabDefI18n[];
}

const NAV_GROUPS: GroupDefI18n[] = [
  {
    id: "schedule",
    labelKey: "nav.schedule",
    icon: CalendarDays,
    tabs: [
      { id: "priority", labelKey: "tab.priority", icon: Zap },
      { id: "today", labelKey: "tab.today", icon: CalendarCheck },
      { id: "tomorrow", labelKey: "tab.tomorrow", icon: CalendarPlus },
      { id: "week1", labelKey: "tab.week1", icon: CalendarDays },
      { id: "week2", labelKey: "tab.week2", icon: CalendarDays },
      { id: "week3", labelKey: "tab.week3", icon: CalendarDays },
      { id: "6week", labelKey: "tab.6week", icon: Binoculars },
      { id: "milestones", labelKey: "tab.milestones", icon: Flag },
      { id: "reforecast", labelKey: "tab.reforecast", icon: GitBranch },
    ],
  },
  {
    id: "fieldops",
    labelKey: "nav.fieldOps",
    icon: ClipboardList,
    tabs: [
      { id: "dailylog", labelKey: "tab.dailyLog", icon: ClipboardList },
      { id: "inspections", labelKey: "tab.inspections", icon: ShieldCheck },
      { id: "field-reports", labelKey: "tab.fieldReports", icon: Camera },
      { id: "punch", labelKey: "tab.punchList", icon: CheckSquare },
      { id: "reports", labelKey: "tab.observations", icon: Eye },
    ],
  },
  {
    id: "coordination",
    labelKey: "nav.coordination",
    icon: Handshake,
    tabs: [
      { id: "coordination", labelKey: "tab.meetings", icon: Handshake },
      { id: "action-tracker", labelKey: "tab.actionItems", icon: CheckSquare },
    ],
  },
  {
    id: "documents",
    labelKey: "nav.documents",
    icon: FileText,
    tabs: [
      { id: "submittals", labelKey: "tab.submittals", icon: FileCheck },
      { id: "rfis", labelKey: "tab.rfis", icon: MessageCircleQuestion },
      { id: "drawings", labelKey: "tab.drawings", icon: Layers },
    ],
  },
  {
    id: "money",
    labelKey: "nav.money",
    icon: Receipt,
    tabs: [
      { id: "tm", labelKey: "tab.tm", icon: Receipt },
    ],
  },
  {
    id: "safety",
    labelKey: "nav.safety",
    icon: Shield,
    tabs: [
      { id: "safety", labelKey: "tab.toolboxTalks", icon: Shield },
    ],
  },
  {
    id: "project",
    labelKey: "nav.project",
    icon: BarChart3,
    tabs: [
      { id: "progress", labelKey: "tab.progress", icon: TrendingUp },
      { id: "directory", labelKey: "tab.directory", icon: Users },
      { id: "subs", labelKey: "tab.subs", icon: Users },
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
        <div className="flex items-center gap-2 pb-2 border-b border-[var(--border-primary)]">
          {NAV_GROUPS.map(({ id, labelKey, icon: Icon }) => {
            const isActive = activeGroupId === id;
            return (
              <button
                key={id}
                onClick={() => handleGroupClick(id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all min-h-[36px] whitespace-nowrap"
                style={{
                  background: isActive ? "#F97316" : "var(--bg-tertiary)",
                  color: isActive ? "#fff" : "var(--text-secondary)",
                }}
              >
                <Icon size={13} />
                {t(labelKey)}
              </button>
            );
          })}
        </div>

        {/* Row 2: Tab row for active group */}
        <div className="flex gap-0 overflow-x-auto scrollbar-none">
          {activeGroup.tabs.map(({ id: tabId, labelKey, icon: Icon }) => {
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
                  color: isActive ? "#F97316" : "var(--text-muted)",
                }}
              >
                <Icon size={14} />
                {t(labelKey)}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Mobile: group pills + sub-tab strip ──────────────────────────── */}
      <div className="md:hidden">
        {/* Group selector pills */}
        <div className="flex items-center gap-2 pb-2 overflow-x-auto scrollbar-none">
          {NAV_GROUPS.map(({ id, labelKey, icon: Icon }) => {
            const isActive = activeGroupId === id;
            return (
              <button
                key={id}
                onClick={() => handleGroupClick(id)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold transition-all min-h-[36px] whitespace-nowrap shrink-0"
                style={{
                  background: isActive ? "#F97316" : "var(--bg-tertiary)",
                  color: isActive ? "#fff" : "var(--text-secondary)",
                }}
              >
                <Icon size={13} />
                {t(labelKey)}
              </button>
            );
          })}
        </div>

        {/* Sub-tab strip for active group (skip if only 1 tab) */}
        {activeGroup.tabs.length > 1 && (
          <div className="flex gap-0 overflow-x-auto scrollbar-none -mx-1 px-1 border-b border-[var(--border-primary)]">
            {activeGroup.tabs.map(({ id: tabId, labelKey, icon: Icon }) => {
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
                    color: isActive ? "#F97316" : "var(--text-muted)",
                  }}
                >
                  <Icon size={14} />
                  {t(labelKey)}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
