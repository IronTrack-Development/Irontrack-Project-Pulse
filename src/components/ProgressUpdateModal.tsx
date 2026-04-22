"use client";

import { useState } from "react";
import { X, Clock, CheckCircle, Play, AlertTriangle } from "lucide-react";
import type { ParsedActivity } from "@/types";

interface Props {
  task: ParsedActivity;
  projectId: string;
  onClose: () => void;
  onSaved: () => void;
}

function fmt(d?: string | null) {
  if (!d) return "—";
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function ProgressUpdateModal({ task, projectId, onClose, onSaved }: Props) {
  const [percentComplete, setPercentComplete] = useState(task.percent_complete);
  const [remainingDuration, setRemainingDuration] = useState(task.remaining_duration || 0);
  const [manualOverride, setManualOverride] = useState(false);
  const [status, setStatus] = useState(task.status);
  const [actualStart, setActualStart] = useState(task.actual_start || "");
  const [actualFinish, setActualFinish] = useState(task.actual_finish || "");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // Auto-calc remaining when % changes (unless manual override)
  const handlePercentChange = (val: number) => {
    setPercentComplete(val);
    if (!manualOverride && task.original_duration) {
      setRemainingDuration(Math.ceil(task.original_duration * (1 - val / 100)));
    }
    if (val > 0 && status === "not_started") setStatus("in_progress");
    if (val >= 100) setStatus("complete");
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const update: Record<string, any> = {
        activity_id: task.id,
        percent_complete: percentComplete,
        notes: notes || undefined,
      };

      if (manualOverride) {
        update.remaining_duration = remainingDuration;
        update.manual_override = true;
      }

      if (status !== task.status) {
        update.status = status;
      }

      if (actualStart && actualStart !== task.actual_start) {
        update.actual_start = actualStart;
      }

      if (actualFinish && actualFinish !== task.actual_finish) {
        update.actual_finish = actualFinish;
      }

      const res = await fetch(`/api/projects/${projectId}/schedule/update-progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates: [update] }),
      });

      if (res.ok) {
        onSaved();
      } else {
        const err = await res.json();
        alert(`Failed: ${err.error || "Unknown error"}`);
      }
    } finally {
      setSaving(false);
    }
  };

  const quickButtons = [0, 25, 50, 75, 100];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />

      <div className="relative bg-[#121217] rounded-t-2xl sm:rounded-2xl border border-[#1F1F25] w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-[#121217] flex items-start justify-between gap-3 px-5 py-4 border-b border-[#1F1F25] z-10">
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-bold text-base leading-tight">Update Progress</h3>
            <p className="text-xs text-gray-500 mt-0.5 truncate">{task.activity_name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-[#1F1F25] text-gray-400 hover:text-white transition-colors shrink-0">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Task info */}
          <div className="bg-[#0B0B0D] border border-[#1F1F25] rounded-xl p-3">
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-gray-600">Trade:</span>{" "}
                <span className="text-[#F97316] font-medium">{task.trade || "General"}</span>
              </div>
              <div>
                <span className="text-gray-600">Duration:</span>{" "}
                <span className="text-white font-medium">{task.original_duration || 0}d</span>
              </div>
              <div>
                <span className="text-gray-600">Start:</span>{" "}
                <span className="text-white">{fmt(task.start_date)}</span>
              </div>
              <div>
                <span className="text-gray-600">Finish:</span>{" "}
                <span className="text-white">{fmt(task.finish_date)}</span>
              </div>
              {task.is_critical && (
                <div className="col-span-2">
                  <span className="text-[10px] bg-[#EF4444]/15 text-[#EF4444] px-2 py-0.5 rounded font-bold">
                    ⚠ CRITICAL PATH
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Percent Complete */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              Percent Complete: <span className="text-white text-sm">{percentComplete}%</span>
            </label>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={percentComplete}
              onChange={(e) => handlePercentChange(parseInt(e.target.value))}
              className="w-full h-2 bg-[#1F1F25] rounded-full appearance-none cursor-pointer accent-[#F97316]"
            />
            <div className="flex gap-2 mt-2">
              {quickButtons.map((val) => (
                <button
                  key={val}
                  onClick={() => handlePercentChange(val)}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                    percentComplete === val
                      ? "bg-[#F97316] text-white"
                      : "bg-[#1F1F25] text-gray-400 hover:text-white"
                  }`}
                >
                  {val}%
                </button>
              ))}
            </div>
          </div>

          {/* Remaining Duration */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                Remaining Duration
              </label>
              <button
                onClick={() => setManualOverride(!manualOverride)}
                className={`text-[10px] px-2 py-1 rounded transition-colors ${
                  manualOverride
                    ? "bg-[#F97316]/15 text-[#F97316] font-bold"
                    : "bg-[#1F1F25] text-gray-500"
                }`}
              >
                {manualOverride ? "Manual Override ✓" : "Auto-calculated"}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                value={remainingDuration}
                onChange={(e) => {
                  setManualOverride(true);
                  setRemainingDuration(parseInt(e.target.value) || 0);
                }}
                disabled={!manualOverride}
                className="w-24 bg-[#0B0B0D] border border-[#1F1F25] rounded-lg px-3 py-2 text-white text-sm text-center focus:outline-none focus:border-[#F97316]/50 disabled:opacity-50"
              />
              <span className="text-xs text-gray-500">business days</span>
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Status</label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { val: "not_started", label: "Not Started", icon: Clock, color: "gray" },
                { val: "in_progress", label: "In Progress", icon: Play, color: "#3B82F6" },
                { val: "complete", label: "Complete", icon: CheckCircle, color: "#22C55E" },
                { val: "late", label: "Delayed", icon: AlertTriangle, color: "#EF4444" },
              ].map(({ val, label, icon: Icon, color }) => (
                <button
                  key={val}
                  onClick={() => setStatus(val)}
                  className={`flex flex-col items-center gap-1 py-2.5 rounded-lg text-[10px] font-semibold transition-all ${
                    status === val
                      ? "ring-2 ring-[#F97316] bg-[#F97316]/10 text-white"
                      : "bg-[#1F1F25] text-gray-500 hover:text-gray-300"
                  }`}
                >
                  <Icon size={16} style={{ color: status === val ? color : undefined }} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Actual Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Actual Start</label>
              <input
                type="date"
                value={actualStart}
                onChange={(e) => setActualStart(e.target.value)}
                className="w-full bg-[#0B0B0D] border border-[#1F1F25] rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-[#F97316]/50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Actual Finish</label>
              <input
                type="date"
                value={actualFinish}
                onChange={(e) => setActualFinish(e.target.value)}
                className="w-full bg-[#0B0B0D] border border-[#1F1F25] rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-[#F97316]/50"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Notes (optional)</label>
            <textarea
              rows={2}
              placeholder="e.g. Weather delay, crew size reduced..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-[#0B0B0D] border border-[#1F1F25] rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#F97316]/50 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-[#121217] px-5 py-4 border-t border-[#1F1F25]">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-[#F97316] hover:bg-[#ea6c10] disabled:bg-[#F97316]/40 disabled:cursor-not-allowed text-white rounded-xl py-3.5 text-sm font-bold transition-all"
          >
            {saving ? "Saving & Recalculating…" : "Save & Reforecast"}
          </button>
        </div>
      </div>
    </div>
  );
}
