"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Plus, Link2, Copy, Check, Trash2, UserPlus, Send,
  Eye, CheckCircle, AlertTriangle, Clock, X, ChevronDown, ChevronUp,
  ListChecks, Search, ChevronsUpDown, FileText, QrCode, Printer, ExternalLink
} from "lucide-react";
import { extractPhotoTimestamp } from "@/lib/photo-utils";

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface Activity {
  id: string;
  name: string;
  trade: string;
  start_date: string | null;
  finish_date: string | null;
  status: string;
}

interface Sub {
  id: string;
  sub_name: string;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  trades: string[];
  activity_ids: string[];
  notes: string | null;
  created_at: string;
}

interface SubStatus {
  id: string;
  sub_name: string;
  trades: string[];
  status: "not_sent" | "sent" | "viewed" | "acknowledged";
  latest_active_link: {
    id: string;
    token: string;
    label: string | null;
    created_at: string;
    expires_at: string | null;
    share_url: string;
  } | null;
  last_viewed_at: string | null;
  acknowledged_at: string | null;
  acknowledged_by: string | null;
}

interface Props {
  projectId: string;
}

interface SubReport {
  id: string;
  report_date: string;
  submitted_by: string;
  manpower_count: number | null;
  total_hours: number | null;
  delay_reasons: string[];
  notes: string | null;
  worked_on_activities: { activity_id: string; activity_name?: string; status: string }[];
  photo_urls?: string[];
  submitted_at: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? "—" : d.toLocaleString();
}

function activityStatusChip(status: string) {
  const s = status?.toLowerCase() ?? "";
  const map: Record<string, { label: string; cls: string }> = {
    "not started": { label: "Not Started", cls: "bg-gray-700 text-[color:var(--text-secondary)]" },
    "in progress":  { label: "In Progress",  cls: "bg-blue-500/20 text-blue-300" },
    "complete":     { label: "Complete",      cls: "bg-green-500/20 text-green-300" },
    "completed":    { label: "Complete",      cls: "bg-green-500/20 text-green-300" },
    "delayed":      { label: "Delayed",       cls: "bg-red-500/20 text-red-300" },
    "on hold":      { label: "On Hold",       cls: "bg-yellow-500/20 text-yellow-300" },
  };
  const hit = map[s] ?? { label: status ?? "Unknown", cls: "bg-gray-700 text-[color:var(--text-secondary)]" };
  return (
    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${hit.cls}`}>
      {hit.label}
    </span>
  );
}

// ─── Activity Picker Modal ────────────────────────────────────────────────────

interface ActivityPickerProps {
  activities: Activity[];
  initialSelected: string[];
  onSave: (ids: string[]) => Promise<void>;
  onClose: () => void;
}

function ActivityPicker({ activities, initialSelected, onSave, onClose }: ActivityPickerProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set(initialSelected));
  const [search, setSearch] = useState("");
  const [collapsedTrades, setCollapsedTrades] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  // Group activities by trade
  const grouped = useMemo(() => {
    const lower = search.toLowerCase();
    const filtered = search
      ? activities.filter(a =>
          a.name.toLowerCase().includes(lower) ||
          a.trade.toLowerCase().includes(lower)
        )
      : activities;

    const map = new Map<string, Activity[]>();
    for (const act of filtered) {
      const trade = act.trade || "General";
      if (!map.has(trade)) map.set(trade, []);
      map.get(trade)!.push(act);
    }
    // Sort: trades alphabetically
    return new Map([...map.entries()].sort((a, b) => a[0].localeCompare(b[0])));
  }, [activities, search]);

  const totalFiltered = useMemo(() => [...grouped.values()].reduce((n, g) => n + g.length, 0), [grouped]);

  const toggleActivity = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleTrade = (trade: string, acts: Activity[]) => {
    const ids = acts.map(a => a.id);
    const allSelected = ids.every(id => selected.has(id));
    setSelected(prev => {
      const next = new Set(prev);
      if (allSelected) ids.forEach(id => next.delete(id));
      else ids.forEach(id => next.add(id));
      return next;
    });
  };

  const toggleTradeCollapse = (trade: string) => {
    setCollapsedTrades(prev => {
      const next = new Set(prev);
      next.has(trade) ? next.delete(trade) : next.add(trade);
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave([...selected]);
    setSaving(false);
  };

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-stretch justify-end bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Panel */}
      <div className="flex flex-col w-full max-w-lg bg-[#0B0B0D] border-l border-[#1F1F25] h-full shadow-2xl">

        {/* Header */}
        <div className="flex-none px-5 py-4 border-b border-[#1F1F25] bg-[#121217]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ListChecks size={18} className="text-[#F97316]" />
              <h2 className="text-sm font-bold text-[color:var(--text-primary)]">Select Tasks</h2>
            </div>
            <button onClick={onClose} className="text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)] transition-colors">
              <X size={18} />
            </button>
          </div>
          <p className="text-xs text-[color:var(--text-muted)] mb-3">
            <span className="text-[#F97316] font-semibold">{selected.size}</span> of{" "}
            <span className="font-semibold text-[color:var(--text-secondary)]">{activities.length}</span> activities selected
          </p>
          {/* Search */}
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--text-muted)] pointer-events-none" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search activities or trades..."
              className="w-full bg-[#0B0B0D] border border-[#1F1F25] rounded-lg pl-8 pr-3 py-2 text-[color:var(--text-primary)] text-xs placeholder-gray-600 focus:outline-none focus:border-[#F97316]/50"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)]"
              >
                <X size={12} />
              </button>
            )}
          </div>
          {search && (
            <p className="text-[10px] text-gray-600 mt-1.5">{totalFiltered} matching activities</p>
          )}
        </div>

        {/* Trade Groups */}
        <div className="flex-1 overflow-y-auto">
          {grouped.size === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center px-6">
              <p className="text-[color:var(--text-muted)] text-sm">No activities match your search</p>
            </div>
          ) : (
            [...grouped.entries()].map(([trade, acts]) => {
              const isCollapsed = collapsedTrades.has(trade);
              const tradeIds = acts.map(a => a.id);
              const selectedCount = tradeIds.filter(id => selected.has(id)).length;
              const allSelected = selectedCount === acts.length;
              const someSelected = selectedCount > 0 && selectedCount < acts.length;

              return (
                <div key={trade} className="border-b border-[#1F1F25]">
                  {/* Trade header */}
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-[#121217] sticky top-0 z-10">
                    <button
                      onClick={() => toggleTradeCollapse(trade)}
                      className="flex items-center gap-2 flex-1 min-w-0 text-left hover:text-[color:var(--text-primary)] transition-colors"
                    >
                      {isCollapsed
                        ? <ChevronDown size={14} className="text-[color:var(--text-muted)] flex-none" />
                        : <ChevronUp size={14} className="text-[color:var(--text-muted)] flex-none" />
                      }
                      <span className="text-xs font-semibold text-gray-200 truncate">{trade}</span>
                      <span className="text-[10px] text-gray-600 flex-none">
                        ({selectedCount}/{acts.length})
                      </span>
                    </button>
                    <button
                      onClick={() => toggleTrade(trade, acts)}
                      className={`flex-none text-[10px] font-medium px-2 py-0.5 rounded transition-colors ${
                        allSelected
                          ? "bg-[#F97316]/20 text-[#F97316] hover:bg-[#F97316]/10"
                          : someSelected
                          ? "bg-[#1F1F25] text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]"
                          : "bg-[#1F1F25] text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]"
                      }`}
                    >
                      {allSelected ? "Deselect All" : "Select All"}
                    </button>
                  </div>

                  {/* Activities */}
                  {!isCollapsed && (
                    <div>
                      {acts.map(act => {
                        const checked = selected.has(act.id);
                        return (
                          <label
                            key={act.id}
                            className={`flex items-start gap-3 px-4 py-2.5 cursor-pointer transition-colors ${
                              checked ? "bg-[#F97316]/5 hover:bg-[#F97316]/8" : "hover:bg-[#1a1a20]"
                            }`}
                          >
                            {/* Checkbox */}
                            <div className={`flex-none mt-0.5 w-4 h-4 rounded border transition-colors flex items-center justify-center ${
                              checked
                                ? "bg-[#F97316] border-[#F97316]"
                                : "border-[#3a3a45] bg-[#0B0B0D]"
                            }`}>
                              {checked && <Check size={10} className="text-[color:var(--text-primary)]" strokeWidth={3} />}
                            </div>
                            <input
                              type="checkbox"
                              className="sr-only"
                              checked={checked}
                              onChange={() => toggleActivity(act.id)}
                            />
                            {/* Activity info */}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-gray-200 leading-snug truncate">{act.name}</p>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <span className="text-[10px] text-gray-600">
                                  {formatDate(act.start_date)} → {formatDate(act.finish_date)}
                                </span>
                                {activityStatusChip(act.status)}
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer — pb-20 to clear MobileNav on phones */}
        <div className="flex-none px-5 py-4 pb-20 md:pb-4 border-t border-[#1F1F25] bg-[#121217]">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-[#1F1F25] text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] rounded-lg text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#F97316] hover:bg-[#ea6c0a] disabled:opacity-50 text-[color:var(--text-primary)] rounded-lg text-sm font-semibold transition-colors"
            >
              <Check size={14} />
              {saving ? "Saving…" : `Save Selection (${selected.size})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SubsTab({ projectId }: Props) {
  const [subs, setSubs] = useState<Sub[]>([]);
  const [statuses, setStatuses] = useState<SubStatus[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  const [showAddForm, setShowAddForm] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedSub, setExpandedSub] = useState<string | null>(null);
  const [generating, setGenerating] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  // QR Code modal state
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrData, setQrData] = useState<{ url: string; project_name: string } | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrCopied, setQrCopied] = useState(false);

  // Activity picker state
  const [pickerSubId, setPickerSubId] = useState<string | null>(null);
  const [activitiesLoading, setActivitiesLoading] = useState(false);

  // Add form state
  const [newName, setNewName] = useState("");
  const [newContact, setNewContact] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [addError, setAddError] = useState("");
  const [adding, setAdding] = useState(false);

  // Company code lookup (Fix 2)
  const [companyCode, setCompanyCode] = useState("");
  const [codeLookupStatus, setCodeLookupStatus] = useState<"idle" | "loading" | "found" | "not_found">("idle");

  // Sub reports (Fix 3)
  const [subReports, setSubReports] = useState<Record<string, SubReport[]>>({});
  const [reportsLoading, setReportsLoading] = useState<Set<string>>(new Set());
  const [reportsOpen, setReportsOpen] = useState<Record<string, boolean>>({});

  // ── Data Fetching ──────────────────────────────────────────────────────────

  // ── QR Code ─────────────────────────────────────────────────────────────────

  const handleOpenQrModal = async () => {
    setShowQrModal(true);
    if (qrData) return; // Already loaded
    setQrLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/qr`);
      if (res.ok) {
        const data = await res.json();
        setQrData(data);
      }
    } catch {
      // ignore
    }
    setQrLoading(false);
  };

  const handleCopyQrLink = async () => {
    if (!qrData?.url) return;
    await navigator.clipboard.writeText(qrData.url);
    setQrCopied(true);
    setTimeout(() => setQrCopied(false), 2000);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [subsRes, statusRes] = await Promise.all([
        fetch(`/api/projects/${projectId}/subs`),
        fetch(`/api/projects/${projectId}/sub-status`),
      ]);
      if (subsRes.ok) {
        const data = await subsRes.json();
        setSubs(Array.isArray(data) ? data : (data.subs ?? []));
      }
      if (statusRes.ok) {
        const data = await statusRes.json();
        setStatuses(Array.isArray(data) ? data : (data.subs ?? []));
      }
    } catch {}
    setLoading(false);
  };

  const fetchActivities = async (): Promise<Activity[]> => {
    if (activities.length > 0) return activities;
    setActivitiesLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/activities`);
      if (res.ok) {
        const data = await res.json();
        const raw = Array.isArray(data) ? data : (data.activities ?? []);
        const list: Activity[] = raw.map((a: Record<string, unknown>) => ({
          id: a.id as string,
          name: (a.activity_name ?? a.name ?? "Unnamed") as string,
          trade: (a.trade ?? "General") as string,
          start_date: (a.start_date ?? null) as string | null,
          finish_date: (a.finish_date ?? null) as string | null,
          status: (a.status ?? "not_started") as string,
        }));
        setActivities(list);
        setActivitiesLoading(false);
        return list;
      }
    } catch {}
    setActivitiesLoading(false);
    return [];
  };

  useEffect(() => { fetchData(); }, [projectId]);

  // ── Company Code Lookup (Fix 2) ─────────────────────────────────────────────

  const handleCodeLookup = async (code: string) => {
    const trimmed = code.trim();
    if (!trimmed) { setCodeLookupStatus("idle"); return; }
    setCodeLookupStatus("loading");
    try {
      const res = await fetch(`/api/sub/lookup?code=${encodeURIComponent(trimmed)}`);
      if (res.ok) {
        const data = await res.json();
        setNewName(data.company_name || "");
        setNewContact(data.contact_name || "");
        setNewPhone(data.contact_phone || "");
        setNewEmail(data.contact_email || "");
        setCodeLookupStatus("found");
      } else {
        setCodeLookupStatus("not_found");
      }
    } catch {
      setCodeLookupStatus("not_found");
    }
  };

  // ── Sub Reports (Fix 3) ────────────────────────────────────────────────────

  const fetchSubReports = async (subId: string) => {
    if (subReports[subId] !== undefined || reportsLoading.has(subId)) return;
    setReportsLoading(prev => new Set([...prev, subId]));
    try {
      const res = await fetch(`/api/projects/${projectId}/subs/${subId}/reports`);
      if (res.ok) {
        const data = await res.json();
        const list: SubReport[] = Array.isArray(data) ? data : [];
        setSubReports(prev => ({ ...prev, [subId]: list }));
        if (list.length > 0) {
          setReportsOpen(prev => ({ ...prev, [subId]: true }));
        }
      } else {
        setSubReports(prev => ({ ...prev, [subId]: [] }));
      }
    } catch {
      setSubReports(prev => ({ ...prev, [subId]: [] }));
    }
    setReportsLoading(prev => { const n = new Set(prev); n.delete(subId); return n; });
  };

  // ── Add Sub ────────────────────────────────────────────────────────────────

  const handleAddSub = async () => {
    if (!newName.trim()) { setAddError("Sub name is required"); return; }
    setAdding(true);
    setAddError("");

    const res = await fetch(`/api/projects/${projectId}/subs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sub_name: newName.trim(),
        contact_name: newContact.trim() || null,
        contact_phone: newPhone.trim() || null,
        contact_email: newEmail.trim() || null,
        trades: [],
        activity_ids: [],
        company_code: companyCode.trim() || undefined,
      }),
    });

    if (res.ok) {
      setNewName(""); setNewContact(""); setNewPhone(""); setNewEmail("");
      setCompanyCode(""); setCodeLookupStatus("idle");
      setShowAddForm(false);
      await fetchData();
    } else {
      const data = await res.json().catch(() => ({}));
      setAddError(data.error || "Failed to add subcontractor");
    }
    setAdding(false);
  };

  // ── Activity Selection ─────────────────────────────────────────────────────

  const openActivityPicker = async (subId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await fetchActivities();
    setPickerSubId(subId);
  };

  const handleSaveActivities = async (ids: string[]) => {
    if (!pickerSubId) return;
    const res = await fetch(`/api/projects/${projectId}/subs/${pickerSubId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activity_ids: ids }),
    });
    if (res.ok) {
      setPickerSubId(null);
      await fetchData();
    }
  };

  // ── Links ──────────────────────────────────────────────────────────────────

  const handleGenerateLink = async (subId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setGenerating(subId);
    await fetch(`/api/projects/${projectId}/subs/${subId}/share`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    await fetchData();
    setGenerating(null);
  };

  const handleCopyLink = async (token: string, subId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/view/${token}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(subId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // ── Delete ─────────────────────────────────────────────────────────────────

  const handleDeleteSub = async (subId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this subcontractor? This will also remove their share links.")) return;
    setDeleting(subId);
    await fetch(`/api/projects/${projectId}/subs/${subId}`, { method: "DELETE" });
    await fetchData();
    setDeleting(null);
  };

  // ── Helpers ────────────────────────────────────────────────────────────────

  const getStatusForSub = (subId: string) => statuses.find(s => s.id === subId);
  const getSubById = (subId: string) => subs.find(s => s.id === subId);

  const statusBadge = (status?: SubStatus) => {
    if (!status || status.status === "not_sent") {
      return (
        <span className="flex items-center gap-1 text-xs text-[color:var(--text-muted)]">
          <Clock size={12} /> No link sent
        </span>
      );
    }
    if (status.status === "acknowledged") {
      return (
        <span className="flex items-center gap-1 text-xs text-[#22C55E]">
          <CheckCircle size={12} />
          Acknowledged{status.acknowledged_by ? ` by ${status.acknowledged_by}` : ""}
        </span>
      );
    }
    if (status.status === "viewed") {
      return (
        <span className="flex items-center gap-1 text-xs text-[#F97316]">
          <Eye size={12} /> Viewed, not acknowledged
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-xs text-yellow-500">
        <AlertTriangle size={12} /> Link sent, not opened
      </span>
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="w-6 h-6 border-2 border-[#F97316] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const pickerSub = pickerSubId ? getSubById(pickerSubId) : null;

  return (
    <>
      <div className="space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[color:var(--text-primary)]">Subcontractors</h2>
            <p className="text-xs text-[color:var(--text-muted)] mt-0.5">
              {subs.length} sub{subs.length !== 1 ? "s" : ""} on this project
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenQrModal}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1F1F25] hover:bg-[#2a2a35] text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] border border-[#2a2a35] rounded-lg text-xs font-semibold transition-colors"
            >
              <QrCode size={14} />
              QR Code
            </button>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F97316] hover:bg-[#ea6c0a] text-[color:var(--text-primary)] rounded-lg text-xs font-semibold transition-colors"
            >
              <UserPlus size={14} />
              Add Sub
            </button>
          </div>
        </div>

        {/* Add Sub Form */}
        {showAddForm && (
          <div className="bg-[#121217] border border-[#1F1F25] rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[color:var(--text-primary)]">Add Subcontractor</h3>
              <button
                onClick={() => { setShowAddForm(false); setAddError(""); }}
                className="text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)] transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Company Code field (Fix 2) */}
            <div className="space-y-1">
              <label className="text-xs text-[color:var(--text-secondary)] mb-1 block font-medium">Company Code <span className="text-gray-600 font-normal">(optional)</span></label>
              <div className="relative">
                <input
                  value={companyCode}
                  onChange={e => { setCompanyCode(e.target.value); setCodeLookupStatus("idle"); }}
                  onBlur={e => handleCodeLookup(e.target.value)}
                  placeholder="e.g., IT-482916"
                  className="w-full bg-[#0B0B0D] border border-[#1F1F25] rounded-lg px-3 py-2 text-[color:var(--text-primary)] text-sm focus:outline-none focus:border-[#F97316]/50 placeholder-gray-600 pr-20"
                />
                {codeLookupStatus === "loading" && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 border border-[#F97316] border-t-transparent rounded-full animate-spin" />
                )}
                {codeLookupStatus === "found" && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-green-400 font-semibold flex items-center gap-1">
                    <Check size={10} /> Found
                  </span>
                )}
              </div>
              <p className="text-[10px] text-gray-600">Ask your sub for their IronTrack code for instant matching</p>
              {codeLookupStatus === "not_found" && (
                <p className="text-[10px] text-red-400">No company found with this code</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[color:var(--text-secondary)] mb-1 block">Company Name *</label>
                <input
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleAddSub()}
                  placeholder="e.g., ABC Plumbing"
                  className="w-full bg-[#0B0B0D] border border-[#1F1F25] rounded-lg px-3 py-2 text-[color:var(--text-primary)] text-sm focus:outline-none focus:border-[#F97316]/50 placeholder-gray-600"
                />
              </div>
              <div>
                <label className="text-xs text-[color:var(--text-secondary)] mb-1 block">Contact Name</label>
                <input
                  value={newContact}
                  onChange={e => setNewContact(e.target.value)}
                  placeholder="e.g., Joe Martinez"
                  className="w-full bg-[#0B0B0D] border border-[#1F1F25] rounded-lg px-3 py-2 text-[color:var(--text-primary)] text-sm focus:outline-none focus:border-[#F97316]/50 placeholder-gray-600"
                />
              </div>
              <div>
                <label className="text-xs text-[color:var(--text-secondary)] mb-1 block">Phone</label>
                <input
                  value={newPhone}
                  onChange={e => setNewPhone(e.target.value)}
                  placeholder="602-555-1234"
                  className="w-full bg-[#0B0B0D] border border-[#1F1F25] rounded-lg px-3 py-2 text-[color:var(--text-primary)] text-sm focus:outline-none focus:border-[#F97316]/50 placeholder-gray-600"
                />
              </div>
              <div>
                <label className="text-xs text-[color:var(--text-secondary)] mb-1 block">Email</label>
                <input
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  placeholder="joe@abcplumbing.com"
                  className="w-full bg-[#0B0B0D] border border-[#1F1F25] rounded-lg px-3 py-2 text-[color:var(--text-primary)] text-sm focus:outline-none focus:border-[#F97316]/50 placeholder-gray-600"
                />
              </div>
            </div>

            <p className="text-[11px] text-gray-600">
              You can assign specific schedule tasks after adding the sub.
            </p>

            {addError && (
              <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {addError}
              </div>
            )}

            <button
              onClick={handleAddSub}
              disabled={adding}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#F97316] hover:bg-[#ea6c0a] disabled:opacity-50 text-[color:var(--text-primary)] rounded-lg text-sm font-semibold transition-colors"
            >
              <Plus size={14} />
              {adding ? "Adding…" : "Add Subcontractor"}
            </button>
          </div>
        )}

        {/* Sub List */}
        {subs.length === 0 ? (
          <div className="bg-[#121217] border border-[#1F1F25] rounded-xl p-8 text-center">
            <UserPlus size={32} className="mx-auto text-gray-600 mb-3" />
            <p className="text-[color:var(--text-secondary)] text-sm mb-1">No subcontractors added yet</p>
            <p className="text-gray-600 text-xs">Add a sub to share their filtered schedule view</p>
          </div>
        ) : (
          <div className="space-y-2">
            {subs.map(sub => {
              const status = getStatusForSub(sub.id);
              const isExpanded = expandedSub === sub.id;
              const activityCount = sub.activity_ids?.length ?? 0;

              return (
                <div
                  key={sub.id}
                  className="bg-[#121217] border border-[#1F1F25] rounded-xl overflow-hidden"
                >
                  {/* Sub Header Row */}
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-[#1a1a20] transition-colors"
                    onClick={() => {
                      const expanding = !isExpanded;
                      setExpandedSub(expanding ? sub.id : null);
                      if (expanding) fetchSubReports(sub.id);
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-sm font-semibold text-[color:var(--text-primary)] truncate">{sub.sub_name}</span>
                        {sub.contact_name && (
                          <span className="text-xs text-[color:var(--text-muted)]">({sub.contact_name})</span>
                        )}
                      </div>

                      {/* Task count badge */}
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded ${
                          activityCount > 0
                            ? "bg-[#F97316]/15 text-[#F97316]"
                            : "bg-[#1F1F25] text-[color:var(--text-muted)]"
                        }`}>
                          <ListChecks size={10} />
                          {activityCount > 0 ? `${activityCount} task${activityCount !== 1 ? "s" : ""} assigned` : "No tasks assigned"}
                        </span>
                      </div>

                      <div className="mt-0.5">
                        {statusBadge(status)}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                      {status?.latest_active_link?.token ? (
                        <button
                          onClick={(e) => handleCopyLink(status.latest_active_link!.token, sub.id, e)}
                          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            copiedId === sub.id
                              ? "bg-[#22C55E]/20 text-[#22C55E]"
                              : "bg-[#1F1F25] text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] hover:bg-[#2a2a35]"
                          }`}
                        >
                          {copiedId === sub.id ? <Check size={12} /> : <Copy size={12} />}
                          {copiedId === sub.id ? "Copied!" : "Copy Link"}
                        </button>
                      ) : (
                        <button
                          onClick={(e) => handleGenerateLink(sub.id, e)}
                          disabled={generating === sub.id}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-[#F97316] hover:bg-[#ea6c0a] disabled:opacity-50 text-[color:var(--text-primary)] rounded-lg text-xs font-medium transition-colors"
                        >
                          <Send size={12} />
                          {generating === sub.id ? "…" : "Generate Link"}
                        </button>
                      )}
                      {isExpanded
                        ? <ChevronUp size={16} className="text-[color:var(--text-muted)]" />
                        : <ChevronDown size={16} className="text-[color:var(--text-muted)]" />
                      }
                    </div>
                  </div>

                  {/* Expanded Detail */}
                  {isExpanded && (
                    <div className="border-t border-[#1F1F25] p-4 space-y-3 bg-[#0e0e12]">

                      {/* Contact Info */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                        <div>
                          <span className="text-[color:var(--text-muted)]">Contact:</span>
                          <span className="text-[color:var(--text-secondary)] ml-1">{sub.contact_name || "—"}</span>
                        </div>
                        <div>
                          <span className="text-[color:var(--text-muted)]">Phone:</span>
                          <span className="text-[color:var(--text-secondary)] ml-1">{sub.contact_phone || "—"}</span>
                        </div>
                        <div>
                          <span className="text-[color:var(--text-muted)]">Email:</span>
                          <span className="text-[color:var(--text-secondary)] ml-1">{sub.contact_email || "—"}</span>
                        </div>
                      </div>

                      {/* Select Tasks Button */}
                      <div className="flex items-center gap-2 py-1">
                        <button
                          onClick={(e) => openActivityPicker(sub.id, e)}
                          disabled={activitiesLoading}
                          className="flex items-center gap-1.5 px-3 py-2 bg-[#1F1F25] hover:bg-[#2a2a35] disabled:opacity-50 text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] rounded-lg text-xs font-medium transition-colors border border-[#2a2a35] hover:border-[#F97316]/30"
                        >
                          {activitiesLoading ? (
                            <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <ListChecks size={13} className="text-[#F97316]" />
                          )}
                          {activitiesLoading ? "Loading…" : "Select Tasks"}
                          {activityCount > 0 && (
                            <span className="ml-0.5 bg-[#F97316]/20 text-[#F97316] text-[10px] font-bold px-1.5 py-0.5 rounded">
                              {activityCount}
                            </span>
                          )}
                        </button>
                        <p className="text-[10px] text-gray-600">
                          {activityCount > 0
                            ? "Sub sees only their assigned tasks"
                            : "Assign tasks for this sub to see in their shared link"
                          }
                        </p>
                      </div>

                      {/* Link Tracking Info */}
                      {status && status.status !== "not_sent" && (
                        <div className="bg-[#121217] border border-[#1F1F25] rounded-lg p-3 space-y-1.5 text-xs">
                          <div className="flex items-center gap-2">
                            <Link2 size={11} className="text-[color:var(--text-muted)] flex-none" />
                            <span className="text-[color:var(--text-muted)]">Link sent:</span>
                            <span className="text-[color:var(--text-secondary)]">
                              {formatDateTime(status.latest_active_link?.created_at ?? null)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Eye size={11} className="text-[color:var(--text-muted)] flex-none" />
                            <span className="text-[color:var(--text-muted)]">Last viewed:</span>
                            <span className={status.last_viewed_at ? "text-[#F97316]" : "text-gray-600"}>
                              {status.last_viewed_at ? formatDateTime(status.last_viewed_at) : "Not yet"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle size={11} className="text-[color:var(--text-muted)] flex-none" />
                            <span className="text-[color:var(--text-muted)]">Acknowledged:</span>
                            <span className={status.acknowledged_at ? "text-[#22C55E]" : "text-gray-600"}>
                              {status.acknowledged_at
                                ? `${formatDateTime(status.acknowledged_at)}${status.acknowledged_by ? ` by ${status.acknowledged_by}` : ""}`
                                : "Not yet"
                              }
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Recent Reports (Fix 3) */}
                      {(() => {
                        const reports = subReports[sub.id];
                        const isLoadingReports = reportsLoading.has(sub.id);
                        const isOpen = reportsOpen[sub.id] ?? false;
                        return (
                          <div className="bg-[#121217] border border-[#1F1F25] rounded-lg overflow-hidden">
                            <button
                              className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-semibold text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] transition-colors"
                              onClick={() => setReportsOpen(prev => ({ ...prev, [sub.id]: !isOpen }))}
                            >
                              <span className="flex items-center gap-1.5">
                                <FileText size={12} className="text-[#F97316]" />
                                Recent Reports
                                {reports && reports.length > 0 && (
                                  <span className="ml-1 bg-[#F97316]/20 text-[#F97316] text-[10px] font-bold px-1.5 py-0.5 rounded">
                                    {reports.length}
                                  </span>
                                )}
                              </span>
                              {isOpen
                                ? <ChevronUp size={13} className="text-[color:var(--text-muted)]" />
                                : <ChevronDown size={13} className="text-[color:var(--text-muted)]" />
                              }
                            </button>
                            {isOpen && (
                              <div className="border-t border-[#1F1F25] divide-y divide-[#1F1F25]">
                                {isLoadingReports ? (
                                  <div className="flex items-center justify-center py-5">
                                    <div className="w-4 h-4 border border-[#F97316] border-t-transparent rounded-full animate-spin" />
                                  </div>
                                ) : !reports || reports.length === 0 ? (
                                  <div className="px-3 py-4 text-center text-xs text-gray-600">No reports yet</div>
                                ) : (
                                  reports.slice(0, 5).map(report => (
                                    <div key={report.id} className="px-3 py-3 space-y-1.5">
                                      <div className="flex items-center justify-between">
                                        <span className="text-xs font-medium text-gray-200">{formatDate(report.report_date)}</span>
                                        <span className="text-[10px] text-[color:var(--text-muted)]">{report.submitted_by}</span>
                                      </div>
                                      {(report.manpower_count != null || report.total_hours != null) && (
                                        <div className="flex items-center gap-3 text-[10px] text-[color:var(--text-secondary)]">
                                          {report.manpower_count != null && <span>👷 {report.manpower_count} worker{report.manpower_count !== 1 ? "s" : ""}</span>}
                                          {report.total_hours != null && <span>⏱ {report.total_hours}h</span>}
                                        </div>
                                      )}
                                      {report.delay_reasons && report.delay_reasons.length > 0 && (
                                        <div className="flex flex-wrap gap-1">
                                          {report.delay_reasons.map((d: string) => (
                                            <span key={d} className="text-[10px] bg-red-500/15 text-red-400 px-1.5 py-0.5 rounded">{d}</span>
                                          ))}
                                        </div>
                                      )}
                                      {report.worked_on_activities && report.worked_on_activities.length > 0 && (
                                        <div className="space-y-1 mt-1">
                                          {report.worked_on_activities.map((wa) => (
                                            <div key={wa.activity_id} className="flex items-center justify-between text-[10px]">
                                              <span className="text-[color:var(--text-secondary)] truncate flex-1 mr-2">{wa.activity_name ?? "Unknown"}</span>
                                              <span className={`flex-none px-1.5 py-0.5 rounded font-medium ${
                                                wa.status === "100" ? "bg-green-500/15 text-green-400" :
                                                wa.status === "75"  ? "bg-blue-500/15 text-blue-400" :
                                                wa.status === "50"  ? "bg-yellow-500/15 text-yellow-400" :
                                                wa.status === "25"  ? "bg-orange-500/15 text-orange-400" :
                                                "bg-gray-700 text-[color:var(--text-secondary)]"
                                              }`}>{wa.status}%</span>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                      {report.notes && (
                                        <p className="text-[10px] text-[color:var(--text-muted)] italic mt-1">"{report.notes}"</p>
                                      )}
                                      {report.photo_urls && report.photo_urls.length > 0 && (
                                        <div className="flex gap-1.5 mt-2 overflow-x-auto scrollbar-none">
                                          {report.photo_urls.map((url: string, i: number) => {
                                            const ts = extractPhotoTimestamp(url);
                                            return (
                                              <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="flex-none relative">
                                                <img
                                                  src={url}
                                                  alt={`Report photo ${i + 1}`}
                                                  className="w-14 h-14 object-cover rounded-lg border border-[#1F1F25] hover:border-[#F97316]/50 transition-colors"
                                                  loading="lazy"
                                                />
                                                {ts && (
                                                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 rounded-b-lg px-0.5 py-0.5 text-center">
                                                    <span className="text-[color:var(--text-primary)] text-[8px] leading-none font-medium">{ts}</span>
                                                  </div>
                                                )}
                                              </a>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  ))
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* Actions Row */}
                      <div className="flex items-center gap-2 pt-1">
                        {status?.latest_active_link && (
                          <button
                            onClick={(e) => handleGenerateLink(sub.id, e)}
                            disabled={generating === sub.id}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-[#1F1F25] text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] rounded-lg text-xs transition-colors disabled:opacity-50"
                          >
                            <Link2 size={12} />
                            {generating === sub.id ? "…" : "Regenerate Link"}
                          </button>
                        )}
                        <button
                          onClick={(e) => handleDeleteSub(sub.id, e)}
                          disabled={deleting === sub.id}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg text-xs transition-colors ml-auto disabled:opacity-50"
                        >
                          <Trash2 size={12} />
                          {deleting === sub.id ? "…" : "Remove"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Activity Picker Modal */}
      {pickerSubId && pickerSub && (
        <ActivityPicker
          activities={activities}
          initialSelected={pickerSub.activity_ids ?? []}
          onSave={handleSaveActivities}
          onClose={() => setPickerSubId(null)}
        />
      )}

      {/* QR Code Modal */}
      {showQrModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowQrModal(false); }}
        >
          <div className="w-full max-w-sm bg-[#0B0B0D] border border-[#1F1F25] rounded-2xl shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#1F1F25] bg-[#121217]">
              <div className="flex items-center gap-2">
                <QrCode size={16} className="text-[#F97316]" />
                <h3 className="text-sm font-bold text-[color:var(--text-primary)]">Sub Self-Registration QR</h3>
              </div>
              <button
                onClick={() => setShowQrModal(false)}
                className="text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              {qrLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-2 border-[#F97316] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : qrData ? (
                <>
                  {/* Description */}
                  <p className="text-xs text-[color:var(--text-secondary)] text-center leading-relaxed">
                    Post this in the job trailer. Subs scan to self-register and see their schedule.
                  </p>

                  {/* QR Code Image */}
                  <div className="flex flex-col items-center gap-3">
                    <div className="bg-white p-3 rounded-xl inline-block">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(qrData.url)}&bgcolor=ffffff&color=000000&margin=4`}
                        alt="QR Code for sub registration"
                        width={260}
                        height={260}
                        className="rounded-lg"
                      />
                    </div>
                    <p className="text-sm font-semibold text-[color:var(--text-primary)] text-center">{qrData.project_name}</p>
                  </div>

                  {/* Join URL */}
                  <div className="bg-[#121217] border border-[#1F1F25] rounded-lg px-3 py-2">
                    <p className="text-[10px] text-gray-600 mb-1 uppercase tracking-wide font-medium">Registration Link</p>
                    <p className="text-xs text-[color:var(--text-secondary)] break-all font-mono leading-relaxed">{qrData.url}</p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={handleCopyQrLink}
                      className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                        qrCopied
                          ? "bg-green-500/20 text-green-400 border border-green-500/30"
                          : "bg-[#1F1F25] text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] border border-[#2a2a35] hover:border-[#F97316]/30"
                      }`}
                    >
                      {qrCopied ? <Check size={13} /> : <ExternalLink size={13} />}
                      {qrCopied ? "Copied!" : "Copy Link"}
                    </button>
                    <button
                      onClick={() => window.print()}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-[#1F1F25] text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] border border-[#2a2a35] hover:border-[#F97316]/30 rounded-lg text-xs font-semibold transition-colors"
                    >
                      <Printer size={13} />
                      Print
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-red-400">Failed to load QR code. Please try again.</p>
                  <button
                    onClick={() => { setQrData(null); handleOpenQrModal(); }}
                    className="mt-3 text-xs text-[#F97316] underline"
                  >
                    Retry
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
