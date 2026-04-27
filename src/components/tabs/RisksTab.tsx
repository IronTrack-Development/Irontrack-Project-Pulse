"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle, Clock, RefreshCw } from "lucide-react";
import type { DailyRisk } from "@/types";

const SEVERITY_FILTERS = ["all", "high", "medium", "low"] as const;

function severityStyle(severity: string) {
  switch (severity) {
    case "high": return { badge: "bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/30", border: "border-l-[#EF4444]", icon: "#EF4444" };
    case "medium": return { badge: "bg-[#EAB308]/15 text-[#EAB308] border-[#EAB308]/30", border: "border-l-[#EAB308]", icon: "#EAB308" };
    default: return { badge: "bg-[color:var(--bg-tertiary)] text-[color:var(--text-secondary)] border-gray-700", border: "border-l-gray-600", icon: "#6B7280" };
  }
}

function riskTypeLabel(type: string): string {
  switch (type) {
    case "DELAYED_START": return "Delayed Start";
    case "SUCCESSOR_COMPRESSION": return "Schedule Compression";
    case "MILESTONE_AT_RISK": return "Milestone At Risk";
    case "INSPECTION_RISK": return "Inspection Risk";
    case "MISSING_LOGIC": return "Missing Logic";
    case "LONG_DURATION": return "Long Duration";
    case "WEATHER_PATTERN": return "Weather Pattern";
    case "LABOR_SHORTAGE": return "Labor Shortage";
    case "LOST_TIME_ACCUMULATION": return "Lost Time";
    default: return type.replace(/_/g, " ");
  }
}

interface RiskCardProps {
  risk: DailyRisk;
  onResolve: () => void;
  onSnooze: () => void;
}

function RiskCard({ risk, onResolve, onSnooze }: RiskCardProps) {
  const style = severityStyle(risk.severity);
  const activity = risk.parsed_activities as { activity_name?: string; trade?: string; start_date?: string } | undefined;

  return (
    <div className={`bg-[var(--bg-secondary)] border border-[var(--border-primary)] border-l-4 ${style.border} rounded-xl p-5`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wide ${style.badge}`}>
              {risk.severity}
            </span>
            <span className="text-[10px] text-gray-600 uppercase tracking-wide">{riskTypeLabel(risk.risk_type)}</span>
          </div>
          <h4 className="text-sm font-bold text-[color:var(--text-primary)] leading-tight">{risk.title}</h4>
        </div>
        <AlertTriangle size={16} style={{ color: style.icon }} className="shrink-0 mt-0.5" />
      </div>

      {risk.description && (
        <p className="text-xs text-[color:var(--text-secondary)] mb-3 leading-relaxed">{risk.description}</p>
      )}

      {risk.suggested_action && (
        <div className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg px-3 py-2 mb-3">
          <div className="text-[10px] text-gray-600 uppercase tracking-wide mb-0.5">Recommended Action</div>
          <div className="text-xs text-[color:var(--text-secondary)]">{risk.suggested_action}</div>
        </div>
      )}

      {activity?.activity_name && (
        <div className="text-xs text-gray-600 mb-3">
          Source: <span className="text-[color:var(--text-secondary)]">{activity.activity_name}</span>
          {activity.trade && <span className="ml-2 text-[#F97316]">{activity.trade}</span>}
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          onClick={onResolve}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#22C55E]/10 hover:bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/20 rounded-lg text-xs font-semibold transition-colors"
        >
          <CheckCircle size={12} />
          Resolve
        </button>
        <button
          onClick={onSnooze}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] rounded-lg text-xs font-medium transition-colors"
        >
          <Clock size={12} />
          Snooze
        </button>
        <span className="ml-auto text-[10px] text-gray-600">
          {new Date(risk.detected_at).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
}

export default function RisksTab({ projectId, onUpdate }: { projectId: string; onUpdate: () => void }) {
  const [risks, setRisks] = useState<DailyRisk[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "high" | "medium" | "low">("all");

  const fetchRisks = async () => {
    setLoading(true);
    const res = await fetch(`/api/projects/${projectId}/risks`);
    if (res.ok) setRisks(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchRisks(); }, [projectId]);

  const updateRisk = async (riskId: string, status: string) => {
    await fetch(`/api/projects/${projectId}/risks`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ riskId, status }),
    });
    fetchRisks();
    onUpdate();
  };

  const openRisks = risks.filter((r) => r.status === "open");
  const filtered = filter === "all" ? openRisks : openRisks.filter((r) => r.severity === filter);

  const highCount = openRisks.filter((r) => r.severity === "high").length;
  const medCount = openRisks.filter((r) => r.severity === "medium").length;
  const lowCount = openRisks.filter((r) => r.severity === "low").length;

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "High", count: highCount, color: "text-[#EF4444]", bg: "bg-[#EF4444]/10" },
          { label: "Medium", count: medCount, color: "text-[#EAB308]", bg: "bg-[#EAB308]/10" },
          { label: "Low", count: lowCount, color: "text-[color:var(--text-secondary)]", bg: "bg-[color:var(--bg-tertiary)]" },
        ].map(({ label, count, color, bg }) => (
          <div key={label} className={`rounded-xl p-4 ${bg} text-center`}>
            <div className={`text-2xl font-bold ${color}`}>{count}</div>
            <div className="text-xs text-[color:var(--text-muted)] mt-0.5">{label} Risk{count !== 1 ? "s" : ""}</div>
          </div>
        ))}
      </div>

      {/* Filter + refresh */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-1">
          {SEVERITY_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded text-xs font-semibold capitalize transition-colors ${
                filter === f ? "bg-[#F97316] text-[color:var(--text-primary)]" : "text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)]"
              }`}
            >
              {f === "all" ? "All Open" : f}
            </button>
          ))}
        </div>
        <button onClick={fetchRisks} className="p-2 rounded-lg bg-[var(--bg-tertiary)] text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] transition-colors">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Risk cards */}
      {loading ? (
        <div className="flex justify-center py-12">
          <RefreshCw size={20} className="text-[#F97316] animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <CheckCircle size={32} className="mx-auto text-[#22C55E] mb-3" />
          <p className="text-[color:var(--text-primary)] font-semibold">No {filter !== "all" ? filter + " " : ""}risks detected</p>
          <p className="text-gray-600 text-sm mt-1">
            {openRisks.length === 0
              ? "All clear — no open risks on this project."
              : `Showing ${filter} risks only. ${openRisks.length - filtered.length} other risks exist.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((risk) => (
            <RiskCard
              key={risk.id}
              risk={risk}
              onResolve={() => updateRisk(risk.id, "resolved")}
              onSnooze={() => updateRisk(risk.id, "snoozed")}
            />
          ))}
        </div>
      )}

      {/* Resolved/snoozed section */}
      {risks.filter((r) => r.status !== "open").length > 0 && (
        <div className="pt-4 border-t border-[var(--border-primary)]">
          <div className="text-xs text-gray-600 mb-3">
            {risks.filter((r) => r.status !== "open").length} resolved/snoozed risks
          </div>
        </div>
      )}
    </div>
  );
}
