"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Plus, RefreshCw, CheckSquare, Camera, AlertTriangle, ChevronDown
} from "lucide-react";
import PunchProgressRing from "@/components/punch/PunchProgressRing";
import PunchItemForm from "@/components/punch/PunchItemForm";
import PunchItemDetail from "@/components/punch/PunchItemDetail";
import { t } from "@/lib/i18n";

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
  { value: "", label: t('ui.all.6a7208') },
  { value: "open", label: t('status.open') },
  { value: "in_progress", label: t('status.inProgress') },
  { value: "ready_for_reinspect", label: t('ui.re.inspect') },
  { value: "closed", label: t('ui.closed') },
  { value: "disputed", label: t('ui.disputed') },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  open:               { label: t('status.open'),        color: "#EF4444", bg: "bg-red-500/15" },
  in_progress:        { label: t('status.inProgress'), color: "#EAB308", bg: "bg-yellow-500/15" },
  ready_for_reinspect:{ label: t('ui.re.inspect'),  color: "#A855F7", bg: "bg-purple-500/15" },
  closed:             { label: t('ui.closed'),      color: "#22C55E", bg: "bg-green-500/15" },
  disputed:           { label: t('ui.disputed'),    color: "#F97316", bg: "bg-orange-500/15" },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string; pulse: boolean }> = {
  life_safety: { label: t('ui.life.safety'), color: "#EF4444", pulse: true },
  code:        { label: t('ui.code'),        color: "#F97316", pulse: false },
  standard:    { label: t('ui.standard'),    color: "var(--text-muted)", pulse: false },
  cosmetic:    { label: t('ui.cosmetic'),    color: "#3B82F6", pulse: false },
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
  const trades = summary?.by_trade.map((item) => item.trade) || [];
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
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-2xl p-4">
          <div className="flex items-center gap-4">
            <PunchProgressRing total={summary.total} closed={summary.closed} size={100} />
            <div className="flex-1 grid grid-cols-2 gap-2">
              {[
                { label: t('status.open'), value: summary.open, color: "#EF4444" },
                { label: t('status.inProgress'), value: summary.in_progress, color: "#EAB308" },
                { label: t('ui.re.inspect'), value: summary.ready_for_reinspect, color: "#A855F7" },
                { label: t('ui.closed'), value: summary.closed, color: "#22C55E" },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-[var(--bg-primary)] rounded-xl p-2.5 text-center">
                  <p className="text-lg font-bold leading-none" style={{ color }}>{value}</p>
                  <p className="text-xs text-[color:var(--text-muted)] mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bulk actions */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 bg-[var(--bg-tertiary)] rounded-2xl px-4 py-3">
          <span className="text-sm text-[color:var(--text-secondary)] flex-1">{selectedIds.size}{t('ui.selected')}</span>
          <button onClick={() => setSelectedIds(new Set())} className="text-xs text-[color:var(--text-muted)] min-h-[40px] px-3">{t('ui.clear')}
          </button>
          <button
            onClick={bulkClose}
            disabled={bulkClosing}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-green-500/20 text-green-400
              text-xs font-semibold hover:bg-green-500/30 transition-all min-h-[44px]"
          >
            {bulkClosing ? <RefreshCw size={12} className="animate-spin" /> : <CheckSquare size={12} />}{t('ui.close.selected')}
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
                  ? "bg-[#F97316] text-[color:var(--text-primary)]"
                  : "bg-[var(--bg-tertiary)] text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]"
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
                  className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-xl px-3 py-2.5 text-xs text-[color:var(--text-secondary)] appearance-none focus:outline-none min-h-[40px]"
                >
                  <option value="">{t('ui.all.trades')}</option>
                  {trades.map((item) => <option key={t} value={t}>{t}</option>)}
                </select>
                <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[color:var(--text-muted)] pointer-events-none" />
              </div>
            )}
            {subs.length > 0 && (
              <div className="relative flex-1">
                <select
                  value={subFilter}
                  onChange={(e) => setSubFilter(e.target.value)}
                  className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-xl px-3 py-2.5 text-xs text-[color:var(--text-secondary)] appearance-none focus:outline-none min-h-[40px]"
                >
                  <option value="">{t('ui.all.subs')}</option>
                  {subs.map((s) => <option key={s.name} value={contacts.find((c) => c.name === s.name)?.id || ""}>{s.name}</option>)}
                </select>
                <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[color:var(--text-muted)] pointer-events-none" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Item list */}
      {filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <CheckSquare size={44} className="text-gray-700 mb-4" />
          <p className="text-sm font-semibold text-[color:var(--text-muted)] mb-1">
            {statusFilter || tradeFilter || subFilter ? t('ui.no.items.match.the.filter') : t('ui.no.punch.items.yet')}
          </p>
          <p className="text-xs text-gray-600 mb-6">
            {!(statusFilter || tradeFilter || subFilter) && t('ui.start.your.punch.walk.tap.to.add.the.first.item')}
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
                className={`bg-[var(--bg-secondary)] border rounded-2xl p-4 transition-all cursor-pointer
                  active:scale-[0.99] ${isSelected ? "border-[#F97316]/50" : "border-[var(--border-primary)] hover:border-[#F97316]/30"}`}
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
                    {isSelected && <CheckSquare size={10} className="text-[color:var(--text-primary)]" />}
                  </button>

                  <span className="text-xs font-mono text-[color:var(--text-muted)] shrink-0">{item.item_number}</span>

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
                <p className="text-sm text-[color:var(--text-primary)] font-medium mb-2 line-clamp-2 leading-snug">
                  {item.description}
                </p>

                {/* Meta row */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[color:var(--text-muted)]">
                  {locationParts.length > 0 && (
                    <span>{locationParts.join(" · ")}</span>
                  )}
                  {item.trade && (
                    <span className="px-1.5 py-0.5 rounded-md bg-[var(--bg-tertiary)] text-[color:var(--text-secondary)]">{item.trade}</span>
                  )}
                  {item.assigned_contact && (
                    <span className="text-[color:var(--text-muted)] truncate max-w-[120px]">
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
        className="fixed bottom-24 right-6 w-14 h-14 rounded-full bg-[#F97316] text-[color:var(--text-primary)]
          shadow-lg shadow-[#F97316]/30 flex items-center justify-center
          hover:bg-[#ea6c10] active:scale-95 transition-all z-40"
        aria-label={t('ui.add.punch.item.338c9f')}
      >
        <Plus size={24} />
      </button>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-40 left-1/2 -translate-x-1/2 z-50 bg-[var(--bg-tertiary)] border border-[#F97316]/30
          text-[color:var(--text-primary)] text-sm font-medium px-4 py-3 rounded-2xl shadow-xl animate-fade-in">
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
