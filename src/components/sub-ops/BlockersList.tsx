"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  AlertTriangle, Plus, X, Check, ChevronDown, ChevronUp,
  Filter, Clock, CheckCircle, Camera,
} from "lucide-react";

interface Props {
  projectId: string;
}

interface Blocker {
  id: string;
  category: string;
  description: string;
  impact: string | null;
  foreman_name: string;
  date: string;
  status: "open" | "resolved";
  photo_url: string | null;
  photo_path?: string | null;
  resolution_notes: string | null;
  resolved_at: string | null;
}

const CATEGORY_STYLES: Record<string, { cls: string }> = {
  material: { cls: "bg-blue-500/20 text-blue-300" },
  manpower: { cls: "bg-purple-500/20 text-purple-300" },
  equipment: { cls: "bg-yellow-500/20 text-yellow-300" },
  weather: { cls: "bg-cyan-500/20 text-cyan-300" },
  drawing: { cls: "bg-pink-500/20 text-pink-300" },
  inspection: { cls: "bg-green-500/20 text-green-300" },
  gc_delay: { cls: "bg-orange-500/20 text-orange-300" },
  access: { cls: "bg-indigo-500/20 text-indigo-300" },
  other: { cls: "bg-gray-700 text-[color:var(--text-secondary)]" },
};

const STATUS_STYLES: Record<string, { label: string; cls: string }> = {
  open: { label: "Open", cls: "bg-orange-500/20 text-orange-300" },
  resolved: { label: "Resolved", cls: "bg-green-500/20 text-green-300" },
};

export default function BlockersList({ projectId }: Props) {
  const [blockers, setBlockers] = useState<Blocker[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState("open");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterForeman, setFilterForeman] = useState("");
  const [foremen, setForemen] = useState<{ id: string; name: string }[]>([]);

  // Quick add form
  const [showAdd, setShowAdd] = useState(false);
  const [addCategory, setAddCategory] = useState("material");
  const [addForemanId, setAddForemanId] = useState("");
  const [addDescription, setAddDescription] = useState("");
  const [addImpact, setAddImpact] = useState("");
  const [addPhoto, setAddPhoto] = useState<File | null>(null);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const blockerPhotoRef = useRef<HTMLInputElement>(null);

  // Resolve
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolveNotes, setResolveNotes] = useState("");

  const companyId = typeof window !== "undefined" ? localStorage.getItem("sub_ops_company_id") : null;
  const getBlockerPhotoUrl = (blocker: Blocker) => {
    if (blocker.photo_url) return blocker.photo_url;
    if (!blocker.photo_path) return "";
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
    return `${base}/storage/v1/object/public/sub-blocker-photos/${blocker.photo_path}`;
  };

  const fetchData = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        status: filterStatus,
        ...(filterCategory && { category: filterCategory }),
        ...(filterForeman && { foreman_id: filterForeman }),
      });
      const [bRes, fRes] = await Promise.all([
        fetch(`/api/sub-ops/companies/${companyId}/blockers?${params}`),
        fetch(`/api/sub-ops/companies/${companyId}/foremen`),
      ]);
      if (bRes.ok) {
        const d = await bRes.json();
        setBlockers(Array.isArray(d) ? d : d.data ?? d.blockers ?? []);
      }
      if (fRes.ok) {
        const f = await fRes.json();
        const nextForemen = Array.isArray(f) ? f : f.data ?? f.foremen ?? [];
        setForemen(nextForemen);
        setAddForemanId((current) => current || nextForemen[0]?.id || "");
      }
    } catch {}
    setLoading(false);
  }, [companyId, filterStatus, filterCategory, filterForeman]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAdd = async () => {
    if (!addDescription.trim()) { setError("Description is required"); return; }
    if (!addForemanId) { setError("Choose a foreman first"); return; }
    setAdding(true);
    setError("");
    try {
      const res = await fetch(`/api/sub-ops/companies/${companyId}/blockers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          foreman_id: addForemanId,
          blocker_date: new Date().toISOString().split("T")[0],
          category: addCategory,
          description: addDescription.trim(),
          impact: addImpact.trim() || null,
        }),
      });
      if (res.ok) {
        const blocker = await res.json();
        if (addPhoto && blocker?.id) {
          const photoData = new FormData();
          photoData.append("file", addPhoto);
          await fetch(`/api/sub-ops/companies/${companyId}/blockers/${blocker.id}/photo`, {
            method: "POST",
            body: photoData,
          });
        }
        setAddDescription("");
        setAddImpact("");
        setAddPhoto(null);
        setShowAdd(false);
        await fetchData();
      } else {
        const d = await res.json().catch(() => ({}));
        setError(d.error || "Failed to add blocker");
      }
    } catch {
      setError("Network error");
    }
    setAdding(false);
  };

  const handleResolve = async (id: string) => {
    try {
      await fetch(`/api/sub-ops/companies/${companyId}/blockers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "resolved", resolution_notes: resolveNotes.trim() || null }),
      });
      setResolvingId(null);
      setResolveNotes("");
      await fetchData();
    } catch {}
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="w-6 h-6 border-2 border-[#F97316] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-[color:var(--text-primary)]">Blockers</h2>
          <p className="text-xs text-[color:var(--text-muted)] mt-0.5">Track and resolve field issues</p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-1.5 px-3 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg text-xs font-semibold transition-colors min-h-[44px]"
        >
          {showAdd ? <><X size={14} /> Cancel</> : <><Plus size={14} /> Report Blocker</>}
        </button>
      </div>

      {/* Quick Add */}
      {showAdd && (
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-[color:var(--text-secondary)] mb-1 block">Category</label>
              <select
                value={addCategory}
                onChange={(e) => setAddCategory(e.target.value)}
                className="w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg px-3 py-2.5 text-[color:var(--text-primary)] text-sm focus:outline-none focus:border-[#F97316]/50 appearance-none min-h-[44px]"
              >
                <option value="material">Material</option>
                <option value="manpower">Manpower</option>
                <option value="equipment">Equipment</option>
                <option value="weather">Weather</option>
                <option value="drawing">Drawing/RFI</option>
                <option value="inspection">Inspection</option>
                <option value="gc_delay">GC Delay</option>
                <option value="access">Site Access</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-[color:var(--text-secondary)] mb-1 block">
                Foreman <span className="text-red-400">*</span>
              </label>
              <select
                value={addForemanId}
                onChange={(e) => setAddForemanId(e.target.value)}
                className="w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg px-3 py-2.5 text-[color:var(--text-primary)] text-sm focus:outline-none focus:border-[#F97316]/50 appearance-none min-h-[44px]"
              >
                {foremen.length === 0 && <option value="">Add a foreman first</option>}
                {foremen.map((foreman) => (
                  <option key={foreman.id} value={foreman.id}>{foreman.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-[color:var(--text-secondary)] mb-1 block">
              Description <span className="text-red-400">*</span>
            </label>
            <textarea
              value={addDescription}
              onChange={(e) => setAddDescription(e.target.value)}
              placeholder="What's the issue?"
              rows={2}
              className="w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg px-3 py-2.5 text-[color:var(--text-primary)] text-sm focus:outline-none focus:border-[#F97316]/50 placeholder-gray-600 resize-none"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[color:var(--text-secondary)] mb-1 block">Impact</label>
            <textarea
              value={addImpact}
              onChange={(e) => setAddImpact(e.target.value)}
              placeholder="How does this affect work?"
              rows={2}
              className="w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg px-3 py-2.5 text-[color:var(--text-primary)] text-sm focus:outline-none focus:border-[#F97316]/50 placeholder-gray-600 resize-none"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[color:var(--text-secondary)] mb-1 block">Photo</label>
            <button
              type="button"
              onClick={() => blockerPhotoRef.current?.click()}
              className="flex min-h-[44px] w-full items-center gap-2 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] px-3 py-2.5 text-sm text-[color:var(--text-secondary)] transition-colors hover:border-[#F97316]/40 hover:text-[color:var(--text-primary)]"
            >
              <Camera size={16} />
              {addPhoto ? addPhoto.name : "Capture or upload blocker photo"}
            </button>
            <input
              ref={blockerPhotoRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => setAddPhoto(e.target.files?.[0] ?? null)}
              className="hidden"
            />
          </div>
          {error && (
            <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</div>
          )}
          <button
            onClick={handleAdd}
            disabled={adding}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-[color:var(--text-primary)] rounded-lg text-sm font-semibold transition-colors min-h-[44px]"
          >
            <AlertTriangle size={14} />
            {adding ? "Submitting..." : "Submit Blocker"}
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg px-2.5 py-2 text-xs text-[color:var(--text-primary)] focus:outline-none appearance-none min-h-[36px]"
        >
          <option value="">All Status</option>
          <option value="open">Open</option>
          <option value="resolved">Resolved</option>
        </select>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg px-2.5 py-2 text-xs text-[color:var(--text-primary)] focus:outline-none appearance-none min-h-[36px]"
        >
          <option value="">All Categories</option>
          <option value="material">Material</option>
          <option value="manpower">Manpower</option>
          <option value="equipment">Equipment</option>
          <option value="weather">Weather</option>
          <option value="drawing">Drawing/RFI</option>
          <option value="inspection">Inspection</option>
          <option value="gc_delay">GC Delay</option>
          <option value="access">Site Access</option>
          <option value="other">Other</option>
        </select>
        <select
          value={filterForeman}
          onChange={(e) => setFilterForeman(e.target.value)}
          className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg px-2.5 py-2 text-xs text-[color:var(--text-primary)] focus:outline-none appearance-none min-h-[36px]"
        >
          <option value="">All Foremen</option>
          {foremen.map((f) => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </select>
      </div>

      {/* Blocker Cards */}
      {blockers.length === 0 ? (
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-8 text-center">
          <CheckCircle size={28} className="mx-auto text-green-500/50 mb-2" />
          <p className="text-sm text-[color:var(--text-secondary)]">No blockers found</p>
          <p className="text-xs text-gray-600 mt-1">
            {filterStatus === "open" ? "All clear — no open blockers!" : "No matching blockers"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {blockers.map((b) => {
            const catStyle = CATEGORY_STYLES[b.category] ?? CATEGORY_STYLES.other;
            const statusStyle = STATUS_STYLES[b.status] ?? STATUS_STYLES.open;
            const isExpanded = expandedId === b.id;

            return (
              <div key={b.id} className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl overflow-hidden">
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-[#1a1a20] transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : b.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded capitalize ${catStyle.cls}`}>
                        {b.category}
                      </span>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${statusStyle.cls}`}>
                        {statusStyle.label}
                      </span>
                    </div>
                    <p className="text-sm text-[color:var(--text-primary)] truncate">{b.description}</p>
                    <p className="text-xs text-[color:var(--text-muted)] mt-0.5">
                      {b.foreman_name} · {new Date(b.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="ml-3 flex-shrink-0">
                    {isExpanded ? <ChevronUp size={14} className="text-[color:var(--text-muted)]" /> : <ChevronDown size={14} className="text-[color:var(--text-muted)]" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-[var(--border-primary)] p-4 space-y-3 bg-[#0e0e12] text-xs">
                    <div>
                      <span className="text-[color:var(--text-muted)] font-medium">Description:</span>
                      <p className="text-[color:var(--text-secondary)] mt-1 whitespace-pre-wrap">{b.description}</p>
                    </div>
                    {b.impact && (
                      <div>
                        <span className="text-[color:var(--text-muted)] font-medium">Impact:</span>
                        <p className="text-[color:var(--text-secondary)] mt-1">{b.impact}</p>
                      </div>
                    )}
                    {getBlockerPhotoUrl(b) && (
                      <div>
                        <a href={getBlockerPhotoUrl(b)} target="_blank" rel="noopener noreferrer">
                          <img
                            src={getBlockerPhotoUrl(b)}
                            alt="Blocker photo"
                            className="w-32 h-32 object-cover rounded-lg border border-[var(--border-primary)] hover:border-[#F97316]/50 transition-colors"
                            loading="lazy"
                          />
                        </a>
                      </div>
                    )}
                    {b.status === "resolved" && b.resolution_notes && (
                      <div>
                        <span className="text-green-400 font-medium">Resolution:</span>
                        <p className="text-[color:var(--text-secondary)] mt-1">{b.resolution_notes}</p>
                        {b.resolved_at && (
                          <p className="text-gray-600 mt-0.5">Resolved {new Date(b.resolved_at).toLocaleString()}</p>
                        )}
                      </div>
                    )}

                    {b.status === "open" && (
                      <>
                        {resolvingId === b.id ? (
                          <div className="space-y-2">
                            <textarea
                              value={resolveNotes}
                              onChange={(e) => setResolveNotes(e.target.value)}
                              placeholder="Resolution notes (optional)"
                              rows={2}
                              className="w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg px-3 py-2 text-[color:var(--text-primary)] text-sm focus:outline-none focus:border-[#F97316]/50 placeholder-gray-600 resize-none"
                            />
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleResolve(b.id)}
                                className="flex items-center gap-1 px-3 py-1.5 bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded-lg text-xs font-medium transition-colors min-h-[36px]"
                              >
                                <Check size={12} /> Confirm Resolve
                              </button>
                              <button
                                onClick={() => { setResolvingId(null); setResolveNotes(""); }}
                                className="px-3 py-1.5 text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)] text-xs min-h-[36px]"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setResolvingId(b.id)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-green-500/10 text-green-400 hover:bg-green-500/20 rounded-lg text-xs font-medium transition-colors min-h-[36px]"
                          >
                            <CheckCircle size={12} /> Resolve
                          </button>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
