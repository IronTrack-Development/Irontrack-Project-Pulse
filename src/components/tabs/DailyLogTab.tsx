"use client";

import { useState } from "react";
import DailyLogList from "@/components/daily-log/DailyLogList";
import RollupDashboard from "@/components/daily-log/RollupDashboard";
import { t } from "@/lib/i18n";

type SubView = "logs" | "rollups";

interface DailyLogTabProps {
  projectId: string;
}

export default function DailyLogTab({ projectId }: DailyLogTabProps) {
  const [subView, setSubView] = useState<SubView>("logs");

  return (
    <div>
      {/* Sub-view toggle */}
      <div className="flex gap-1 mb-4 bg-[var(--bg-secondary)] rounded-xl p-1 w-fit">
        <button
          onClick={() => setSubView("logs")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors min-h-[36px] ${
            subView === "logs"
              ? "bg-[#F97316] text-[color:var(--text-primary)]"
              : "text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]"
          }`}
        >{t('ui.logs')}
        </button>
        <button
          onClick={() => setSubView("rollups")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors min-h-[36px] ${
            subView === "rollups"
              ? "bg-[#F97316] text-[color:var(--text-primary)]"
              : "text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]"
          }`}
        >{t('ui.rollups')}
        </button>
      </div>

      {subView === "logs" && <DailyLogList projectId={projectId} />}
      {subView === "rollups" && <RollupDashboard projectId={projectId} />}
    </div>
  );
}
