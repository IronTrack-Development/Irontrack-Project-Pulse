"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, TrendingUp, AlertTriangle } from "lucide-react";
import VoiceTextArea from "./VoiceTextArea";
import type { DailyLogProgress, DelayCode } from "@/types";
import type { ParsedActivity } from "@/types";

const DELAY_CHIPS: DelayCode[] = [
  "Weather", "Manpower", "RFI", "Inspection",
  "Change Order", "Equipment", "Material", "Other",
];

interface WorkIssuesScreenProps {
  activities: ParsedActivity[];
  progress: DailyLogProgress[];
  onProgressChange: (progress: DailyLogProgress[]) => void;
  delayCodes: DelayCode[];
  onDelayCodesChange: (codes: DelayCode[]) => void;
  delayNarrative: string;
  onDelayNarrativeChange: (text: string) => void;
  lostCrewHours: number;
  onLostCrewHoursChange: (hours: number) => void;
}

function ActivityProgressCard({
  activity,
  progressEntry,
  onUpdate,
}: {
  activity: ParsedActivity;
  progressEntry: DailyLogProgress | undefined;
  onUpdate: (entry: Partial<DailyLogProgress>) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const pctBefore = progressEntry?.pct_complete_before ?? activity.percent_complete;
  const pctAfter = progressEntry?.pct_complete_after ?? activity.percent_complete;
  const delta = pctAfter - pctBefore;

  return (
    <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center gap-3 min-h-[52px]"
      >
        <div className="flex-1 min-w-0 text-left">
          <div className="text-sm font-medium text-white truncate">
            {activity.activity_name}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            {activity.trade && (
              <span className="text-xs text-[#F97316]">{activity.trade}</span>
            )}
            <span className="text-xs text-gray-500">{pctBefore}%</span>
            {delta !== 0 && (
              <span className={`text-xs font-medium ${delta > 0 ? "text-[#22C55E]" : "text-[#EF4444]"}`}>
                → {pctAfter}% ({delta > 0 ? "+" : ""}{delta}%)
              </span>
            )}
          </div>
        </div>
        {expanded ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-[var(--border-primary)] pt-3">
          {/* Percent complete slider */}
          <div>
            <label className="text-xs text-gray-500 mb-2 block">
              Update % Complete: <span className="text-white font-medium">{pctAfter}%</span>
            </label>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={pctAfter}
              onChange={(e) =>
                onUpdate({
                  pct_complete_before: pctBefore,
                  pct_complete_after: parseInt(e.target.value),
                })
              }
              className="w-full h-2 bg-[var(--bg-tertiary)] rounded-full appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6
                [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#F97316]
                [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-gray-600 mt-1">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Activity note */}
          <VoiceTextArea
            value={progressEntry?.note || ""}
            onChange={(text) => onUpdate({ note: text })}
            placeholder="Activity note — tap mic or type..."
            rows={2}
          />
        </div>
      )}
    </div>
  );
}

export default function WorkIssuesScreen({
  activities,
  progress,
  onProgressChange,
  delayCodes,
  onDelayCodesChange,
  delayNarrative,
  onDelayNarrativeChange,
  lostCrewHours,
  onLostCrewHoursChange,
}: WorkIssuesScreenProps) {
  const updateProgress = (activityId: string, updates: Partial<DailyLogProgress>) => {
    const existing = progress.find((p) => p.activity_id === activityId);
    if (existing) {
      onProgressChange(
        progress.map((p) =>
          p.activity_id === activityId ? { ...p, ...updates } : p
        )
      );
    } else {
      const activity = activities.find((a) => a.id === activityId);
      onProgressChange([
        ...progress,
        {
          id: crypto.randomUUID(),
          daily_log_id: "",
          activity_id: activityId,
          pct_complete_before: activity?.percent_complete || 0,
          pct_complete_after: activity?.percent_complete || 0,
          activity_name: activity?.activity_name,
          trade: activity?.trade,
          ...updates,
        },
      ]);
    }
  };

  const toggleDelayCode = (code: DelayCode) => {
    if (delayCodes.includes(code)) {
      onDelayCodesChange(delayCodes.filter((c) => c !== code));
    } else {
      onDelayCodesChange([...delayCodes, code]);
    }
  };

  // Filter to in-progress activities for quick access
  const inProgress = activities.filter(
    (a) => a.status === "in_progress" || a.status === "not_started"
  );

  return (
    <div className="space-y-6">
      {/* Activity Progress */}
      <div>
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <TrendingUp size={16} className="text-[#22C55E]" />
          Work Performed
          <span className="text-xs text-gray-500 font-normal">({inProgress.length} activities)</span>
        </h3>

        {inProgress.length === 0 ? (
          <p className="text-sm text-gray-600 py-4 text-center">No active activities found</p>
        ) : (
          <div className="space-y-2">
            {inProgress.map((activity) => (
              <ActivityProgressCard
                key={activity.id}
                activity={activity}
                progressEntry={progress.find((p) => p.activity_id === activity.id)}
                onUpdate={(updates) => updateProgress(activity.id, updates)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Delays & Issues */}
      <div>
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <AlertTriangle size={16} className="text-[#EAB308]" />
          Delays & Issues
        </h3>

        {/* Delay code chips */}
        <div className="flex flex-wrap gap-2 mb-3">
          {DELAY_CHIPS.map((code) => {
            const active = delayCodes.includes(code);
            return (
              <button
                key={code}
                type="button"
                onClick={() => toggleDelayCode(code)}
                className={`px-3 py-2 rounded-full text-xs font-medium border transition-all min-h-[36px]
                  ${active
                    ? "bg-[#EAB308]/15 text-[#EAB308] border-[#EAB308]/40"
                    : "bg-[var(--bg-secondary)] text-gray-400 border-[var(--border-primary)] hover:border-[var(--border-secondary)]"
                  }`}
              >
                {code}
              </button>
            );
          })}
        </div>

        {/* Delay narrative */}
        <VoiceTextArea
          value={delayNarrative}
          onChange={onDelayNarrativeChange}
          placeholder="Describe delays — tap mic or type..."
          label="Delay Details"
          rows={3}
        />

        {/* Lost crew hours */}
        <div className="mt-3">
          <label className="text-xs text-gray-400 mb-1.5 block">Lost Crew Hours</label>
          <input
            type="number"
            inputMode="decimal"
            value={lostCrewHours || ""}
            onChange={(e) => onLostCrewHoursChange(parseFloat(e.target.value) || 0)}
            placeholder="0"
            className="w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl px-4 py-3 text-sm text-white
              focus:outline-none focus:border-[#F97316]/50 min-h-[44px]"
          />
        </div>
      </div>
    </div>
  );
}
