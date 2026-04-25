"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Plus, RefreshCw, CheckSquare, Camera, AlertTriangle, ChevronDown
} from "lucide-react";
import PunchProgressRing from "@/components/punch/PunchProgressRing";
import PunchItemForm from "@/components/punch/PunchItemForm";
import PunchItemDetail from "@/components/punch/PunchItemDetail";

interface Contact {
  id: string;
  name: string;
  company: string | null;
  role: string;
}

interface PunchItem {
  id: string;
  item_number: string;
  description: string;
  location?: string | null;
  building?: string | null;
  floor?: string | null;
  room?: string | null;
  trade?: string | null;
  priority: string;
  status: string;
  due_date?: string | null;
  closed_date?: string | null;
  notes?: string | null;
  photo_count: number;
  assigned_contact?: Contact | null;
  punch_item_photos?: Array<{ id: string; storage_path: string; photo_type: string; caption?: string | null; uploaded_at: string }>;
}

interface Summary {
  total: number;
  open: number;
  in_progress: number;
  ready_for_reinspect: number;
  closed: number;
  disputed: number;
  by_trade: Array<{ trade: string; count: number }>;
  by_sub: Array<{ name: string; company: string; count: number }>;
}

interface Props {
  projectId: string;
}

const STATUS_FILTERS = [
  { value: "", label: "All" },
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "ready_for_reinspect", label: "Re-inspect" },
  { value: "closed", label: "Closed" },
  { value: "disputed", label: "Disputed" },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  open:               { label: "Open",        color: "#EF4444", bg: "bg-red-500/15" },
  in_progress:        { label: "In Progress", color: "#EAB308", bg: "bg-yellow-500/15" },
  ready_for_reinspect:{ label: "Re-inspect",  color: "#A855F7", bg: "bg-purple-500/15" },
  closed:             { label: "Closed",      color: "#22C55E", bg: "bg-green-500/15" },
  disputed:           { label: "Disputed",    color: "#F97316", bg: "bg-orange-500/15" },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string; pulse: boolean }> = {
  life_safety: { label: "Life Safety", color: "#EF4444", pulse: true },
  code:        { label: "Code",        color: "#F97316", pulse: false },
  standard:    { label: "Standard",    color: "#6B7280", pulse: false },
  cosmetic:    { label: "Cosmetic",    color: "#3B82F6", pulse: false },
};

export default function PunchListTab({ projectId }: Props) {
  const [items, setItems] = useState<PunchItem[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [tradeFilter, setTradeFilter] = useState("");
  const [subFilter, setSubFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PunchItem | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkClosing, setBulkClosing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";

  const showToast = (msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  };

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      if (subFilter) params.set("assigned_to", subFilter);
      const res = await fetch(`/api/projects/${projectId}/punch-list${params.toString() ? "?" + params.toString() : ""}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      }
    } finally {
      setLoading(false);
    }
  }, [projectId, statusFilter, subFilter]);

  const fetchSummary = useCallback(async () => {
    const res = await fetch(`/api/projects/${projectId}/punch-list/summary`);
    if (res.ok) setSummary(await res.json());
  }, [projectId]);

  const fetchContacts = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/directory`);
      if (res.ok) {
        const data = await res.json();
        const flat: Contact[] = (data || [])
          .map((pc: { company_contacts: Contact | null }) => pc.company_contacts)
          .filter(Boolean) as Contact[];
        setContacts(flat);
      }
    } catch { /* ignore */ }
  }, [projectId]);

  useEffect(() => { fetchItems(); fetchSummary(); }, [fetchItems, fetchSummary]);
  useEffect(() => { fetchContacts(); }, [fetchContacts]);

  const refresh = () => { fetchItems(); fetchSummary(); };

  const openDetail = async (item: PunchItem) => {
    const res = await fetch(`/api/projects/${projectId}/punch-list/${item.id}`);
    if (res.ok) setSelectedItem(await res.json());
    else setSelectedItem(item);
  };

  const toggleSelect = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const bulkClose = async () => {
    if (selectedIds.size === 0) return;
    setBulkClosing(true);
    try {
      await Promise.all(
        Array.from(selectedIds).map((id) =>
          fetch(`/api/projects/${projectId}/punch-list/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "closed" }),
          })
        )
      );
      setSelectedIds(new Set());
      showToast(`Closed ${selectedIds.size} items`);
      refresh();
    } finally {
      setBulkClosing(false);
    }
  };

  // Trade list from summary
  const trades = summary?.by_trade.map((t) => t.trade) || [];
  // Sub list from summary
  const subs = summary?.by_sub || [];

  // Client-side trade filter
  const filteredItems = tradeFilter
    ? items.filter((i) => i.trade === tradeFilter)
    : items;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw size={24} className="text-[#F97316] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-24">
      {/* Progress ring + summary stats */}
      {summary && (
        <div className="bg-[#121217] border border-[#1F1F25] rounded-2xl p-4">
          <div className="flex items-center gap-4">
            <PunchProgressRing total={summary.total} closed={summary.closed} size={100} />
            <div className="flex-1 grid grid-cols-2 gap-2">
              {[
                { label: "Open", value: summary.open, color: "#EF4444" },
                { label: "In Progress", value: summary.in_progress, color: "#EAB308" },
                { label: "Re-inspect", value: summary.ready_for_reinspect, color: "#A855F7" },
                { label: "Closed", value: summary.closed, color: "#22C55E" },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-[#0B0B0D] rounded-xl p-2.5 text-center">
                  <p className="text-lg font-bold leading-none" style={{ color }}>{value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bulk actions */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 bg-[#1F1F25] rounded-2xl px-4 py-3">
          <span className="text-sm text-gray-300 flex-1">{selectedIds.size} selected</span>
          <button onClick={() => setSelectedIds(new Set())} className="text-xs text-gray-500 min-h-[40px] px-3">
            Clear
          </button>
          <button
            onClick={bulkClose}
            disabled={bulkClosing}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-green-500/20 text-green-400
              text-xs font-semibold hover:bg-green-500/30 transition-all min-h-[44px]"
          >
            {bulkClosing ? <RefreshCw size={12} className="animate-spin" /> : <CheckSquare size={12} />}
            Close Selected
          </button>
        </div>
      )}

      {/* Filter bar */}
      <div className="space-y-2">
        {/* Status chips */}
        <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1">
          {STATUS_FILTERS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setStatusFilter(value)}
              className={`px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all min-h-[36px] ${
                statusFilter === value
                  ? "bg-[#F97316] text-white"
                  : "bg-[#1F1F25] text-gray-400 hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Trade + Sub filters */}
        {(trades.length > 0 || subs.length > 0) && (
          <div className="flex gap-2">
            {trades.length > 0 && (
              <div className="relative flex-1">
                <select
                  value={tradeFilter}
                  onChange={(e) => setTradeFilter(e.target.value)}
                  className="w-full bg-[#1F1F25] border border-[#1F1F25] rounded-xl px-3 py-2.5 text-xs text-gray-400 appearance-none focus:outline-none min-h-[40px]"
                >
                  <option value="">All Trades</option>
                  {trades.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              </div>
            )}
            {subs.length > 0 && (
              <div className="relative flex-1">
                <select
                  value={subFilter}
                  onChange={(e) => setSubFilter(e.target.value)}
                  className="w-full bg-[#1F1F25] border border-[#1F1F25] rounded-xl px-3 py-2.5 text-xs text-gray-400 appearance-none focus:outline-none min-h-[40px]"
                >
                  <option value="">All Subs</option>
                  {subs.map((s) => <option key={s.name} value={contacts.find((c) => c.name === s.name)?.id || ""}>{s.name}</option>)}
                </select>
                <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Item list */}
      {filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <CheckSquare size={44} className="text-gray-700 mb-4" />
          <p className="text-sm font-semibold text-gray-500 mb-1">
            {statusFilter || tradeFilter || subFilter ? "No items match the filter" : "No punch items yet"}
          </p>
          <p className="text-xs text-gray-600 mb-6">
            {!(statusFilter || tradeFilter || subFilter) && "Start your punch walk — tap + to add the first item"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredItems.map((item) => {
            const statusCfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.open;
            const priorityCfg = PRIORITY_CONFIG[item.priority] || PRIORITY_CONFIG.standard;
            const isSelected = selectedIds.has(item.id);
            const locationParts = [
              item.building,
              item.floor && `Fl ${item.floor}`,
              item.room && `Rm ${item.room}`,
            ].filter(Boolean);

            return (
              <div
                key={item.id}
                className={`bg-[#121217] border rounded-2xl p-4 transition-all cursor-pointer
                  active:scale-[0.99] ${isSelected ? "border-[#F97316]/50" : "border-[#1F1F25] hover:border-[#F97316]/30"}`}
                onClick={() => openDetail(item)}
              >
                {/* Top row */}
                <div className="flex items-center gap-2 mb-2">
                  {/* Checkbox */}
                  <button
                    onClick={(e) => toggleSelect(e, item.id)}
                    className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                      isSelected ? "bg-[#F97316] border-[#F97316]" : "border-gray-600 bg-transparent"
                    }`}
                  >
                    {isSelected && <CheckSquare size={10} className="text-white" />}
                  </button>

                  <span className="text-xs font-mono text-gray-500 shrink-0">{item.item_number}</span>

                  {/* Priority badge */}
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium border shrink-0 ${priorityCfg.pulse ? "animate-pulse" : ""}`}
                    style={{ color: priorityCfg.color, borderColor: `${priorityCfg.color}40` }}
                  >
                    {item.priority === "life_safety" && <AlertTriangle size={9} className="inline mr-0.5" />}
                    {priorityCfg.label}
                  </span>

                  {/* Status badge */}
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusCfg.bg} shrink-0`}
                    style={{ color: statusCfg.color }}
                  >
                    {statusCfg.label}
                  </span>

                  {/* Photo indicator */}
                  {item.photo_count > 0 && (
                    <span className="ml-auto flex items-center gap-0.5 text-gray-600 text-xs shrink-0">
                      <Camera size={10} />{item.photo_count}
                    </span>
                  )}
                </div>

                {/* Description */}
                <p className="text-sm text-white font-medium mb-2 line-clamp-2 leading-snug">
                  {item.description}
                </p>

                {/* Meta row */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                  {locationParts.length > 0 && (
                    <span>{locationParts.join(" · ")}</span>
                  )}
                  {item.trade && (
                    <span className="px-1.5 py-0.5 rounded-md bg-[#1F1F25] text-gray-400">{item.trade}</span>
                  )}
                  {item.assigned_contact && (
                    <span className="text-gray-500 truncate max-w-[120px]">
                      {item.assigned_contact.name}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setShowForm(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-[#F97316] text-white
          shadow-lg shadow-[#F97316]/30 flex items-center justify-center
          hover:bg-[#ea6c10] active:scale-95 transition-all z-40"
        aria-label="Add punch item"
      >
        <Plus size={24} />
      </button>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-[#1F1F25] border border-[#F97316]/30
          text-white text-sm font-medium px-4 py-3 rounded-2xl shadow-xl animate-fade-in">
          {toast}
        </div>
      )}

      {/* Add Item Form */}
      {showForm && (
        <PunchItemForm
          projectId={projectId}
          contacts={contacts}
          onSaved={(itemNumber, saveAndAdd) => {
            showToast(`Saved ${itemNumber}`);
            refresh();
            if (!saveAndAdd) setShowForm(false);
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Item Detail */}
      {selectedItem && (
        <PunchItemDetail
          item={selectedItem}
          projectId={projectId}
          supabaseUrl={supabaseUrl}
          onClose={() => setSelectedItem(null)}
          onUpdated={() => {
            refresh();
            // Re-fetch detail
            if (selectedItem) {
              fetch(`/api/projects/${projectId}/punch-list/${selectedItem.id}`)
                .then((r) => r.ok ? r.json() : null)
                .then((d) => { if (d) setSelectedItem(d); });
            }
          }}
        />
      )}
    </div>
  );
}
