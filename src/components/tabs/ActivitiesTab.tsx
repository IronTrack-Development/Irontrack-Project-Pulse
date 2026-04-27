"use client";

import { useEffect, useState } from "react";
import { Search, SlidersHorizontal, RefreshCw, ChevronUp, ChevronDown, Building2 } from "lucide-react";
import type { ParsedActivity } from "@/types";
import ActivityDrawer from "@/components/ActivityDrawer";
import { t } from "@/lib/i18n";

function statusStyle(status: string) {
  switch (status) {
    case "complete": return "text-[#22C55E] bg-[#22C55E]/10";
    case "in_progress": return "text-[#3B82F6] bg-[#3B82F6]/10";
    case "late": return "text-[#EF4444] bg-[#EF4444]/10";
    default: return "text-[color:var(--text-secondary)] bg-[color:var(--bg-tertiary)]/50";
  }
}

function statusLabel(status: string) {
  switch (status) {
    case "in_progress": return "In Progress";
    case "complete": return "Complete";
    case "late": return "Overdue";
    case "not_started": return "Not Started";
    default: return status;
  }
}

function fmt(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** Format a snake_case normalized value for display: "building_f" → "Building F" */
function fmtNormalized(val?: string | null): string {
  if (!val) return "—";
  return val
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default function ActivitiesTab({ projectId }: { projectId: string }) {
  const [activities, setActivities] = useState<ParsedActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [tradeFilter, setTradeFilter] = useState("");
  const [buildingFilter, setBuildingFilter] = useState("");
  const [phaseFilter, setPhaseFilter] = useState("");
  const [sort, setSort] = useState("start_date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [selected, setSelected] = useState<ParsedActivity | null>(null);
  const [trades, setTrades] = useState<string[]>([]);
  const [buildings, setBuildings] = useState<string[]>([]);
  const [phases, setPhases] = useState<string[]>([]);

  const fetchData = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    if (tradeFilter) params.set("trade", tradeFilter);
    if (buildingFilter) params.set("building", buildingFilter);
    if (phaseFilter) params.set("phase", phaseFilter);
    params.set("sort", sort);
    params.set("dir", sortDir);

    const res = await fetch(`/api/projects/${projectId}/activities?${params}`);
    if (res.ok) {
      const data: ParsedActivity[] = await res.json();
      setActivities(data);

      // Derive filter options from full (unfiltered) dataset when no filter is active
      // Always pull unique values from all returned data
      const uniqueTrades = [...new Set(data.map((a) => a.trade || "").filter(Boolean))].sort();
      setTrades(uniqueTrades);

      const uniqueBuildings = [
        ...new Set(data.map((a) => a.normalized_building || "").filter(Boolean)),
      ].sort();
      setBuildings(uniqueBuildings);

      const uniquePhases = [
        ...new Set(data.map((a) => a.normalized_phase || "").filter(Boolean)),
      ].sort();
      setPhases(uniquePhases);
    }
    setLoading(false);
  };

  // Fetch all activities once on mount to populate filter options (unfiltered)
  useEffect(() => {
    const fetchFilterOptions = async () => {
      const res = await fetch(`/api/projects/${projectId}/activities?sort=start_date&dir=asc`);
      if (res.ok) {
        const data: ParsedActivity[] = await res.json();
        setTrades([...new Set(data.map((a) => a.trade || "").filter(Boolean))].sort());
        setBuildings([...new Set(data.map((a) => a.normalized_building || "").filter(Boolean))].sort());
        setPhases([...new Set(data.map((a) => a.normalized_phase || "").filter(Boolean))].sort());
      }
    };
    fetchFilterOptions();
  }, [projectId]);

  useEffect(() => {
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, search, statusFilter, tradeFilter, buildingFilter, phaseFilter, sort, sortDir]);

  const handleSort = (col: string) => {
    if (sort === col) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSort(col); setSortDir("asc"); }
  };

  const SortIcon = ({ col }: { col: string }) => {
    if (sort !== col) return <ChevronUp size={12} className="text-gray-700" />;
    return sortDir === "asc" ? <ChevronUp size={12} className="text-[#F97316]" /> : <ChevronDown size={12} className="text-[#F97316]" />;
  };

  const hasHierarchy = buildings.length > 0 || phases.length > 0;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-48 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg px-3 py-2">
          <Search size={14} className="text-[color:var(--text-muted)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('ui.search.activities')}
            className="flex-1 bg-transparent text-[color:var(--text-primary)] text-sm placeholder-gray-600 focus:outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg px-3 py-2 text-sm text-[color:var(--text-secondary)] focus:outline-none"
        >
          <option value="">{t('ui.all.statuses')}</option>
          <option value="not_started">{t('ui.not.started')}</option>
          <option value="in_progress">{t('status.inProgress')}</option>
          <option value="complete">{t('ui.complete.1f5a1a')}</option>
          <option value="late">{t('ui.overdue.07217c')}</option>
        </select>
        <select
          value={tradeFilter}
          onChange={(e) => setTradeFilter(e.target.value)}
          className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg px-3 py-2 text-sm text-[color:var(--text-secondary)] focus:outline-none"
        >
          <option value="">{t('ui.all.trades')}</option>
          {trades.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>

        {/* Building filter — only shown when hierarchy data is present */}
        {buildings.length > 0 && (
          <select
            value={buildingFilter}
            onChange={(e) => setBuildingFilter(e.target.value)}
            className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg px-3 py-2 text-sm text-[color:var(--text-secondary)] focus:outline-none"
          >
            <option value="">{t('ui.all.buildings')}</option>
            {buildings.map((b) => (
              <option key={b} value={b}>{fmtNormalized(b)}</option>
            ))}
          </select>
        )}

        {/* Phase filter — only shown when hierarchy data is present */}
        {phases.length > 0 && (
          <select
            value={phaseFilter}
            onChange={(e) => setPhaseFilter(e.target.value)}
            className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg px-3 py-2 text-sm text-[color:var(--text-secondary)] focus:outline-none"
          >
            <option value="">{t('ui.all.phases')}</option>
            {phases.map((p) => (
              <option key={p} value={p}>{fmtNormalized(p)}</option>
            ))}
          </select>
        )}

        <div className="text-xs text-[color:var(--text-muted)]">
          {activities.length}{t('ui.activit')}{activities.length !== 1 ? t('ui.ies') : t('ui.y')}
        </div>
      </div>

      {/* Table */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <RefreshCw size={18} className="text-[#F97316] animate-spin" />
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-12 text-gray-600 text-sm">
            <SlidersHorizontal size={28} className="mx-auto mb-3 opacity-30" />{t('ui.no.activities.match.your.filters')}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-primary)]">
                  {[
                    { label: "ID", col: "activity_id" },
                    { label: t('ui.activity.81c0d9'), col: "activity_name" },
                    ...(hasHierarchy ? [{ label: t('ui.building'), col: "normalized_building" }] : []),
                    { label: t('ui.trade'), col: "trade" },
                    { label: t('ui.start.952f37'), col: "start_date" },
                    { label: t('ui.finish.b74bde'), col: "finish_date" },
                    { label: t('ui.dur'), col: "original_duration" },
                    { label: t('ui.status'), col: "status" },
                    { label: "%", col: "percent_complete" },
                  ].map(({ label, col }) => (
                    <th
                      key={col}
                      onClick={() => handleSort(col)}
                      className="text-left px-4 py-3 text-xs font-semibold text-[color:var(--text-muted)] uppercase tracking-wide cursor-pointer hover:text-[color:var(--text-secondary)] select-none"
                    >
                      <div className="flex items-center gap-1">
                        {label}
                        <SortIcon col={col} />
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activities.map((a, i) => (
                  <tr
                    key={a.id}
                    onClick={() => setSelected(a)}
                    className={`border-b border-[var(--border-primary)] cursor-pointer hover:bg-[var(--bg-tertiary)]/50 transition-colors ${
                      i % 2 === 0 ? "" : "bg-[var(--bg-primary)]/30"
                    }`}
                  >
                    <td className="px-4 py-3 text-xs text-[color:var(--text-muted)] font-mono">{a.activity_id || "—"}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-[color:var(--text-primary)] max-w-xs truncate">{a.activity_name}</div>
                      {a.milestone && <span className="text-[10px] text-[#F97316] font-bold">{t('ui.milestone').toUpperCase()}</span>}
                    </td>
                    {/* Building column — only rendered when hierarchy data exists */}
                    {hasHierarchy && (
                      <td className="px-4 py-3">
                        {a.normalized_building ? (
                          <div className="flex items-center gap-1">
                            <Building2 size={11} className="text-gray-600 shrink-0" />
                            <span className="text-xs text-[color:var(--text-secondary)] truncate max-w-[100px]">
                              {fmtNormalized(a.normalized_building)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-700">—</span>
                        )}
                      </td>
                    )}
                    <td className="px-4 py-3 text-xs text-[color:var(--text-secondary)]">{a.trade || "—"}</td>
                    <td className="px-4 py-3 text-xs text-[color:var(--text-secondary)]">{fmt(a.start_date)}</td>
                    <td className="px-4 py-3 text-xs text-[color:var(--text-secondary)]">{fmt(a.finish_date)}</td>
                    <td className="px-4 py-3 text-xs text-[color:var(--text-secondary)]">{a.original_duration ?? "—"}{t('ui.d')}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${statusStyle(a.status)}`}>
                        {statusLabel(a.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-[color:var(--text-secondary)]">{a.percent_complete}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Drawer */}
      {selected && (
        <ActivityDrawer
          activity={selected}
          projectId={projectId}
          onClose={() => setSelected(null)}
          onActivityChange={(a) => setSelected(a)}
        />
      )}
    </div>
  );
}
