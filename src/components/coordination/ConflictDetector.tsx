"use client";

import { useState } from "react";
import { AlertTriangle, X, Plus } from "lucide-react";
import type { ScheduleConflict } from "@/types";

interface ConflictDetectorProps {
  conflicts: ScheduleConflict[];
  onCreateAction?: (conflict: ScheduleConflict) => void;
}

export default function ConflictDetector({ conflicts, onCreateAction }: ConflictDetectorProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const visibleConflicts = conflicts.filter((c) => {
    const key = `${c.activity_a.id}-${c.activity_b.id}`;
    return !dismissed.has(key);
  });

  if (visibleConflicts.length === 0) return null;

  const dismiss = (conflict: ScheduleConflict) => {
    const key = `${conflict.activity_a.id}-${conflict.activity_b.id}`;
    setDismissed((prev) => new Set(prev).add(key));
  };

  return (
    <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle size={16} className="text-red-400" />
        <h3 className="text-red-400 font-semibold text-sm">
          {visibleConflicts.length} Schedule Conflict{visibleConflicts.length !== 1 ? "s" : ""} Detected
        </h3>
      </div>

      <div className="space-y-2">
        {visibleConflicts.map((conflict, i) => (
          <div
            key={`${conflict.activity_a.id}-${conflict.activity_b.id}`}
            className="p-3 rounded-lg bg-[#0B0B0D] border border-[#1F1F25]"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-red-500/10 text-red-400">
                    {conflict.activity_a.trade}
                  </span>
                  <span className="text-gray-500 text-xs">vs</span>
                  <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-red-500/10 text-red-400">
                    {conflict.activity_b.trade}
                  </span>
                  <span className="text-gray-600 text-xs">in {conflict.activity_a.area}</span>
                </div>
                <div className="text-xs text-gray-500 space-y-0.5">
                  <p className="truncate">{conflict.activity_a.name} ({conflict.activity_a.start} → {conflict.activity_a.finish})</p>
                  <p className="truncate">{conflict.activity_b.name} ({conflict.activity_b.start} → {conflict.activity_b.finish})</p>
                  <p className="text-red-400/70">Overlap: {conflict.overlap_start} – {conflict.overlap_end}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {onCreateAction && (
                  <button
                    onClick={() => onCreateAction(conflict)}
                    className="p-2 rounded-lg hover:bg-[#1F1F25] text-[#F97316] transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
                    title="Create action item"
                  >
                    <Plus size={14} />
                  </button>
                )}
                <button
                  onClick={() => dismiss(conflict)}
                  className="p-2 rounded-lg hover:bg-[#1F1F25] text-gray-500 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
                  title="Dismiss"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
