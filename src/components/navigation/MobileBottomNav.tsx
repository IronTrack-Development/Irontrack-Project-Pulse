"use client";

import {
  CalendarDays,
  ClipboardList,
  FileText,
  Receipt,
  BarChart3,
} from "lucide-react";
import { t } from "@/lib/i18n";

interface NavGroup {
  id: string;
  label: string;
  icon: React.ElementType;
}

const GROUPS: NavGroup[] = [
  { id: "schedule", label: "nav.schedule", icon: CalendarDays },
  { id: "fieldops", label: "nav.fieldOps", icon: ClipboardList },
  { id: "documents", label: "nav.documents", icon: FileText },
  { id: "money", label: "nav.money", icon: Receipt },
  { id: "project", label: "nav.project", icon: BarChart3 },
];

interface MobileBottomNavProps {
  activeGroupId: string;
  onGroupChange: (groupId: string) => void;
}

export default function MobileBottomNav({
  activeGroupId,
  onGroupChange,
}: MobileBottomNavProps) {
  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
      style={{
        background: "#0B0B0D",
        borderTop: "1px solid #1F1F25",
      }}
    >
      <div className="flex items-stretch">
        {GROUPS.map(({ id, label, icon: Icon }) => {
          const isActive = activeGroupId === id;
          return (
            <button
              key={id}
              onClick={() => onGroupChange(id)}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-colors"
              style={{
                minHeight: "56px",
                color: isActive ? "#F97316" : "var(--text-muted)",
              }}
            >
              <Icon size={20} />
              <span
                style={{
                  fontSize: "9px",
                  fontWeight: isActive ? 600 : 400,
                  letterSpacing: "0.02em",
                  lineHeight: 1.2,
                }}
              >
                {t(label)}
              </span>
            </button>
          );
        })}
      </div>
      {/* Safe area spacer for devices with home indicator */}
      <div style={{ height: "env(safe-area-inset-bottom, 0px)" }} />
    </div>
  );
}
