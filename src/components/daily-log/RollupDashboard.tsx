"use client";

import { useState } from "react";
import WeeklyRollup from "./WeeklyRollup";
import MonthlyRollup from "./MonthlyRollup";
import QuarterlyRollup from "./QuarterlyRollup";
import YearlyRollup from "./YearlyRollup";

type RollupView = "weekly" | "monthly" | "quarterly" | "yearly";

const VIEWS: { id: RollupView; label: string }[] = [
  { id: "weekly", label: "Weekly" },
  { id: "monthly", label: "Monthly" },
  { id: "quarterly", label: "Quarterly" },
  { id: "yearly", label: "Yearly" },
];

interface RollupDashboardProps {
  projectId: string;
}

export default function RollupDashboard({ projectId }: RollupDashboardProps) {
  const [view, setView] = useState<RollupView>("weekly");

  return (
    <div>
      {/* View toggle */}
      <div className="flex gap-1 mb-4 bg-[#121217] rounded-xl p-1 w-fit">
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
