"use client";

import { useState } from "react";
import WeeklyRollup from "./WeeklyRollup";
import MonthlyRollup from "./MonthlyRollup";
import QuarterlyRollup from "./QuarterlyRollup";
import YearlyRollup from "./YearlyRollup";
import { useTranslation } from "@/lib/i18n";

const { t } = useTranslation();

type RollupView = "weekly" | "monthly" | "quarterly" | "yearly";

const VIEWS: { id: RollupView; label: string }[] = [
  { id: "weekly", label: t('ui.weekly') },
  { id: "monthly", label: t('ui.monthly') },
  { id: "quarterly", label: t('ui.quarterly') },
  { id: "yearly", label: t('ui.yearly') },
];

interface RollupDashboardProps {
  projectId: string;
}

export default function RollupDashboard({ projectId }: RollupDashboardProps) {
  const [view, setView] = useState<RollupView>("weekly");

  return (
    <div>
      {/* View toggle */}
      <div className="flex gap-1 mb-4 bg-[var(--bg-secondary)] rounded-xl p-1 w-fit">
        {VIEWS.map((v) => (
          <button
            key={v.id}
            onClick={() => setView(v.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors min-h-[36px] ${
              view === v.id
                ? "bg-[#F97316] text-[color:var(--text-primary)]"
                : "text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]"
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {view === "weekly" && <WeeklyRollup projectId={projectId} />}
      {view === "monthly" && <MonthlyRollup projectId={projectId} />}
      {view === "quarterly" && <QuarterlyRollup projectId={projectId} />}
      {view === "yearly" && <YearlyRollup projectId={projectId} />}
    </div>
  );
}
