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
import { useTranslation } from "@/lib/i18n";

const { t } = useTranslation();

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
    label: t('nav.schedule'),
    icon: CalendarDays,
    tabs: [
      { id: "priority", label: t('ui.priority'), icon: Zap },
      { id: "today", label: t('ui.today'), icon: CalendarCheck },
      { id: "tomorrow", label: t('ui.tomorrow'), icon: CalendarPlus },
      { id: "week1", label: t('ui.week.1'), icon: CalendarDays },
      { id: "week2", label: t('ui.week.2'), icon: CalendarDays },
      { id: "week3", label: t('ui.week.3'), icon: CalendarDays },
      { id: "6week", label: t('ui.6.week'), icon: Binoculars },
      { id: "milestones", label: t('ui.milestones'), icon: Flag },
      { id: "reforecast", label: t('ui.reforecast'), icon: GitBranch },
    ],
  },
  {
    id: "fieldops",
    label: t('nav.fieldOps'),
    icon: ClipboardList,
    tabs: [
      { id: "dailylog", label: t('ui.daily.log'), icon: ClipboardList },
      { id: "inspections", label: t('ui.inspections'), icon: ShieldCheck },
      { id: "field-reports", label: t('ui.reports'), icon: Camera },
      { id: "punch", label: t('ui.punch.list'), icon: CheckSquare },
      { id: "reports", label: t('ui.observations'), icon: Eye },
    ],
  },
  {
    id: "coordination",
    label: t('nav.coordination'),
    icon: Handshake,
    tabs: [
      { id: "coordination", label: t('ui.meetings.b23a19'), icon: Handshake },
      { id: "action-tracker", label: t('ui.action.items'), icon: CheckSquare },
    ],
  },
  {
    id: "documents",
    label: t('nav.documents'),
    icon: FileText,
    tabs: [
      { id: "submittals", label: t('ui.submittals'), icon: FileCheck },
      { id: "rfis", label: t('ui.rfis'), icon: MessageCircleQuestion },
      { id: "drawings", label: t('ui.drawings'), icon: Layers },
    ],
  },
  {
    id: "money",
    label: t('nav.money'),
    icon: Receipt,
    tabs: [
      { id: "tm", label: t('ui.t.and.m'), icon: Receipt },
    ],
  },
  {
    id: "safety",
    label: t('nav.safety'),
    icon: Shield,
    tabs: [
      { id: "safety", label: t('safety.toolboxTalks'), icon: Shield },
    ],
  },
  {
    id: "project",
    label: t('nav.project'),
    icon: BarChart3,
    tabs: [
      { id: "progress", label: t('ui.progress.1b9027'), icon: TrendingUp },
      { id: "directory", label: t('ui.directory'), icon: Users },
      { id: "subs", label: t('ui.subs'), icon: Users },
    ],
  },
  {
    id: "subops",
    label: t('nav.subOps'),
    icon: HardHat,
    tabs: [
      { id: "sub-dashboard", label: t('ui.dashboard'), icon: BarChart3 },
      { id: "sub-dispatch", label: t('ui.dispatch'), icon: Send },
      { id: "sub-foremen", label: t('ui.foremen'), icon: Users },
      { id: "sub-checkins", label: t('ui.check.ins'), icon: CheckCircle },
      { id: "sub-production", label: t('ui.production'), icon: TrendingUp },
      { id: "sub-blockers", label: t('ui.blockers'), icon: AlertTriangle },
      { id: "sub-handoffs", label: t('ui.handoffs'), icon: ArrowRightLeft },
      { id: "sub-crew", label: t('ui.crew.de463b'), icon: HardHat },
      { id: "sub-sops", label: t('ui.sops'), icon: FileText },
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
