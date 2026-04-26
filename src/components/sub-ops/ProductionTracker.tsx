"use client";

import { useState, useEffect, useCallback } from "react";
import {
  TrendingUp, Calendar, Users, Filter, Clock,
} from "lucide-react";

interface Props {
  projectId: string;
}

interface ProductionEntry {
  id: string;
  date: string;
  foreman_name: string;
  description: string;
  quantity: number;
  unit: string;
  area: string;
  photo_url: string | null;
}

interface Summary {
  total_entries: number;
  total_crew_hours: number;
}

function getWeekAgo() {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString().split("T")[0];
}

function getToday() {
  return new Date().toISOString().split("T")[0];
}

export default function ProductionTracker({ projectId }: Props) {
  const [entries, setEntries] = useState<ProductionEntry[]>([]);
  const [summary, setSummary] = useState<Summary>({ total_entries: 0, total_crew_hours: 0 });
  const [foremen, setForemen] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const [dateFrom, setDateFrom] = useState(getWeekAgo());
  const [dateTo, setDateTo] = useState(getToday());
  const [filterForeman, setFilterForeman] = useState("");
  const [filterProject, setFilterProject] = useState("");

  const companyId = typeof window !== "undefined" ? localStorage.getItem("sub_ops_company_id") : null;

  const fetchData = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        from: dateFrom, to: dateTo,
        ...(filterForeman && { foreman: filterForeman }),
        ...(filterProject && { project: filterProject }),
      });
      const [pRes, fRes] = await Promise.all([
        fetch(`/api/sub-ops/companies/${companyId}/production?${params}`),
        fetch(`/api/sub-ops/companies/${companyId}/foremen`),
      ]);
      if (pRes.ok) {
        const d = await pRes.json();
        setEntries(Array.isArray(d) ? d : d.entries ?? []);
        setSummary(d.summary ?? { total_entries: d.entries?.length ?? 0, total_crew_hours: 0 });
      }
      if (fRes.ok) {
        const f = await fRes.json();
        setForemen(Array.isArray(f) ? f : f.foremen ?? []);
      }
    } catch {}
    setLoading(false);
  }, [companyId, dateFrom, dateTo, filterForeman, filterProject]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="w-6 h-6 border-2 border-[#F97316] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-white">Production Tracking</h2>
        <p className="text-xs text-gray-500 mt-0.5">Track what your crews install and complete</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#121217] border border-[#1F1F25] rounded-xl p-4 text-center">
          <TrendingUp size={16} className="text-[#F97316] mx-auto mb-1" />
          <p className="text-2xl font-bold text-white">{summary.total_entries}</p>
          <p className="text-xs text-gray-500">Entries This Period</p>
        </div>
        <div className="bg-[#121217] border border-[#1F1F25] rounded-xl p-4 text-center">
          <Clock size={16} className="text-[#F97316] mx-auto mb-1" />
          <p className="text-2xl font-bold text-white">{summary.total_crew_hours}</p>
          <p className="text-xs text-gray-500">Crew Hours</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 bg-[#121217] border border-[#1F1F25] rounded-lg px-2.5 py-1.5">
          <Calendar size={12} className="text-gray-500" />
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="bg-transparent text-white text-xs focus:outline-none"
          />
          <span className="text-gray-600">→</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="bg-transparent text-white text-xs focus:outline-none"
          />
        </div>
        <select
          value={filterForeman}
          onChange={(e) => setFilterForeman(e.target.value)}
          className="bg-[#121217] border border-[#1F1F25] rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none appearance-none min-h-[36px]"
        >
          <option value="">All Foremen</option>
          {foremen.map((f) => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </select>
        <input
          value={filterProject}
          onChange={(e) => setFilterProject(e.target.value)}
          placeholder="Filter by project..."
          className="bg-[#121217] border border-[#1F1F25] rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none placeholder-gray-600 min-h-[36px]"
        />
      </div>

      {/* Production Entries */}
      {entries.length === 0 ? (
        <div className="bg-[#121217] border border-[#1F1F25] rounded-xl p-8 text-center">
          <TrendingUp size={28} className="mx-auto text-gray-600 mb-2" />
          <p className="text-sm text-gray-400">No production entries for this period</p>
          <p className="text-xs text-gray-600 mt-1">Production is logged via foreman check-ins</p>
        </div>
      ) : (
        <div className="space-y-1">
          {/* Table Header */}
          <div className="hidden md:grid grid-cols-12 gap-2 px-4 py-2 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
            <div className="col-span-2">Date</div>
            <div className="col-span-2">Foreman</div>
            <div className="col-span-3">Description</div>
            <div className="col-span-2">Qty / Unit</div>
            <div className="col-span-3">Area</div>
          </div>
          {entries.map((e) => (
            <div
              key={e.id}
              className="bg-[#121217] border border-[#1F1F25] rounded-lg p-3 md:rounded-none md:border-x-0 md:border-t-0"
            >
              {/* Mobile layout */}
              <div className="md:hidden space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white">{e.description}</span>
                  <span className="text-[10px] text-gray-500">{new Date(e.date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span>{e.foreman_name}</span>
                  <span className="text-[#F97316] font-medium">{e.quantity} {e.unit}</span>
                  {e.area && <span>{e.area}</span>}
                </div>
              </div>
              {/* Desktop layout */}
              <div className="hidden md:grid grid-cols-12 gap-2 items-center text-xs">
                <div className="col-span-2 text-gray-400">{new Date(e.date).toLocaleDateString()}</div>
                <div className="col-span-2 text-gray-300">{e.foreman_name}</div>
                <div className="col-span-3 text-white truncate">{e.description}</div>
                <div className="col-span-2 text-[#F97316] font-medium">{e.quantity} {e.unit}</div>
                <div className="col-span-3 text-gray-400">{e.area || "—"}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
