"use client";

import { useEffect, useState } from "react";
import { Search, SlidersHorizontal, RefreshCw, ChevronUp, ChevronDown } from "lucide-react";
import type { ParsedActivity } from "@/types";
import ActivityDrawer from "@/components/ActivityDrawer";

function statusStyle(status: string) {
  switch (status) {
    case "complete": return "text-[#22C55E] bg-[#22C55E]/10";
    case "in_progress": return "text-[#3B82F6] bg-[#3B82F6]/10";
    case "late": return "text-[#EF4444] bg-[#EF4444]/10";
    default: return "text-gray-400 bg-gray-800/50";
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

export default function ActivitiesTab({ projectId }: { projectId: string }) {
  const [activities, setActivities] = useState<ParsedActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [tradeFilter, setTradeFilter] = useState("");
  const [sort, setSort] = useState("start_date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [selected, setSelected] = useState<ParsedActivity | null>(null);
  const [trades, setTrades] = useState<string[]>([]);

  const fetchData = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    if (tradeFilter) params.set("trade", tradeFilter);
    params.set("sort", sort);
    params.set("dir", sortDir);

    const res = await fetch(`/api/projects/${projectId}/activities?${params}`);
    if (res.ok) {
      const data: ParsedActivity[] = await res.json();
      setActivities(data);
      const uniqueTrades = [...new Set(data.map((a) => a.trade || "").filter(Boolean))].sort();
      setTrades(uniqueTrades);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [projectId, search, statusFilter, tradeFilter, sort, sortDir]);

  const handleSort = (col: string) => {
    if (sort === col) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSort(col); setSortDir("asc"); }
  };

  const SortIcon = ({ col }: { col: string }) => {
    if (sort !== col) return <ChevronUp size={12} className="text-gray-700" />;
    return sortDir === "asc" ? <ChevronUp size={12} className="text-[#F97316]" /> : <ChevronDown size={12} className="text-[#F97316]" />;
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-48 bg-[#121217] border border-[#1F1F25] rounded-lg px-3 py-2">
          <Search size={14} className="text-gray-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search activities..."
            className="flex-1 bg-transparent text-white text-sm placeholder-gray-600 focus:outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-[#121217] border border-[#1F1F25] rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none"
        >
          <option value="">All Statuses</option>
          <option value="not_started">Not Started</option>
          <option value="in_progress">In Progress</option>
          <option value="complete">Complete</option>
          <option value="late">Overdue</option>
        </select>
        <select
          value={tradeFilter}
          onChange={(e) => setTradeFilter(e.target.value)}
          className="bg-[#121217] border border-[#1F1F25] rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none"
        >
          <option value="">All Trades</option>
          {trades.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <div className="text-xs text-gray-500">
          {activities.length} activit{activities.length !== 1 ? "ies" : "y"}
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#121217] border border-[#1F1F25] rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <RefreshCw size={18} className="text-[#F97316] animate-spin" />
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-12 text-gray-600 text-sm">
            <SlidersHorizontal size={28} className="mx-auto mb-3 opacity-30" />
            No activities match your filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1F1F25]">
                  {[
                    { label: "ID", col: "activity_id" },
                    { label: "Activity", col: "activity_name" },
                    { label: "Trade", col: "trade" },
                    { label: "Start", col: "start_date" },
                    { label: "Finish", col: "finish_date" },
                    { label: "Dur", col: "original_duration" },
                    { label: "Status", col: "status" },
                    { label: "%", col: "percent_complete" },
                  ].map(({ label, col }) => (
                    <th
                      key={col}
                      onClick={() => handleSort(col)}
                      className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer hover:text-gray-300 select-none"
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
                    className={`border-b border-[#1F1F25] cursor-pointer hover:bg-[#1F1F25]/50 transition-colors ${
                      i % 2 === 0 ? "" : "bg-[#0B0B0D]/30"
                    }`}
                  >
                    <td className="px-4 py-3 text-xs text-gray-500 font-mono">{a.activity_id || "—"}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-white max-w-xs truncate">{a.activity_name}</div>
                      {a.milestone && <span className="text-[10px] text-[#F97316] font-bold">MILESTONE</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">{a.trade || "—"}</td>
                    <td className="px-4 py-3 text-xs text-gray-400">{fmt(a.start_date)}</td>
                    <td className="px-4 py-3 text-xs text-gray-400">{fmt(a.finish_date)}</td>
                    <td className="px-4 py-3 text-xs text-gray-400">{a.original_duration ?? "—"}d</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${statusStyle(a.status)}`}>
                        {statusLabel(a.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-300">{a.percent_complete}%</td>
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
