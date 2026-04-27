"use client";

import { useState, useEffect, useCallback } from "react";
import { t } from "@/lib/i18n";

import {
  Users, Plus, X, ArrowLeft, Phone, Mail, Award, Calendar, Clock,
  Send, CheckCircle, TrendingUp, FileText, Edit3, UserMinus, UserPlus,
} from "lucide-react";

interface Props {
  projectId: string;
}

interface Foreman {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  trade: string;
  certifications: string[];
  hire_date: string | null;
  status: "active" | "inactive";
  active_jobs: number;
}

interface ForemanDetail extends Foreman {
  recent_dispatches: { id: string; date: string; project_name: string; status: string }[];
  recent_checkins: { id: string; date: string; crew_count: number; hours: number; notes: string | null }[];
  production_stats: { total_entries: number; this_week_hours: number };
  sop_compliance: { acknowledged: string[]; pending: string[] };
}

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  active: { label: t('status.active'), cls: "bg-green-500/20 text-green-300" },
  inactive: { label: t('status.inactive'), cls: "bg-gray-700 text-[color:var(--text-secondary)]" },
};

const DISPATCH_STATUS: Record<string, { cls: string }> = {
  pending: { cls: "bg-orange-500/20 text-orange-300" },
  acknowledged: { cls: "bg-green-500/20 text-green-300" },
  completed: { cls: "bg-blue-500/20 text-blue-300" },
  cancelled: { cls: "bg-gray-700 text-[color:var(--text-secondary)]" },
};

export default function ForemanManager({ projectId }: Props) {
  const [foremen, setForemen] = useState<Foreman[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedForeman, setSelectedForeman] = useState<ForemanDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [editing, setEditing] = useState(false);

  // Add form
  const [form, setForm] = useState({
    name: "", phone: "", email: "", trade: "", certifications: "", hire_date: "",
  });
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  const companyId = typeof window !== "undefined" ? localStorage.getItem("sub_ops_company_id") : null;

  const fetchForemen = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/sub-ops/companies/${companyId}/foremen`);
      if (res.ok) {
        const d = await res.json();
        setForemen(Array.isArray(d) ? d : d.foremen ?? []);
      }
    } catch {}
    setLoading(false);
  }, [companyId]);

  useEffect(() => { fetchForemen(); }, [fetchForemen]);

  const fetchDetail = async (id: string) => {
    if (!companyId) return;
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/sub-ops/companies/${companyId}/foremen/${id}`);
      if (res.ok) setSelectedForeman(await res.json());
    } catch {}
    setDetailLoading(false);
  };

  const handleAdd = async () => {
    if (!form.name.trim()) { setError(t('ui.name.is.required')); return; }
    setAdding(true);
    setError("");
    try {
      const res = await fetch(`/api/sub-ops/companies/${companyId}/foremen`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          phone: form.phone.trim() || null,
          email: form.email.trim() || null,
          trade: form.trade.trim() || null,
          certifications: form.certifications ? form.certifications.split(",").map((c) => c.trim()).filter(Boolean) : [],
          hire_date: form.hire_date || null,
        }),
      });
      if (res.ok) {
        setForm({ name: "", phone: "", email: "", trade: "", certifications: "", hire_date: "" });
        setShowAdd(false);
        await fetchForemen();
      } else {
        const d = await res.json().catch(() => ({}));
        setError(d.error || "Failed to add foreman");
      }
    } catch {
      setError(t('ui.network.error'));
    }
    setAdding(false);
  };

  const handleDeactivate = async (id: string) => {
    if (!confirm(t('ui.deactivate.this.foreman'))) return;
    try {
      await fetch(`/api/sub-ops/companies/${companyId}/foremen/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "inactive" }),
      });
      setSelectedForeman(null);
      await fetchForemen();
    } catch {}
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="w-6 h-6 border-2 border-[#F97316] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ── Foreman Profile View ──
  if (selectedForeman) {
    const f = selectedForeman;
    const sBadge = STATUS_BADGE[f.status] ?? STATUS_BADGE.active;

    return (
      <div className="space-y-4">
        <button
          onClick={() => { setSelectedForeman(null); setEditing(false); }}
          className="flex items-center gap-1.5 text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)] text-sm transition-colors min-h-[44px]"
        >
          <ArrowLeft size={16} />{t('ui.back.to.roster')}
        </button>

        {detailLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-2 border-[#F97316] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Info Card */}
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-4 md:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-lg font-bold text-[color:var(--text-primary)]">{f.name}</h2>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${sBadge.cls}`}>{sBadge.label}</span>
                  </div>
                  <p className="text-xs text-[color:var(--text-muted)] capitalize">{f.trade?.replace(/_/g, " ") || "—"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDeactivate(f.id)}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg text-xs transition-colors min-h-[36px]"
                  >
                    <UserMinus size={12} />{t('ui.deactivate')}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="flex items-center gap-2 text-[color:var(--text-secondary)]">
                  <Phone size={12} /> {f.phone || "—"}
                </div>
                <div className="flex items-center gap-2 text-[color:var(--text-secondary)]">
                  <Mail size={12} /> {f.email || "—"}
                </div>
                <div className="flex items-center gap-2 text-[color:var(--text-secondary)]">
                  <Calendar size={12} />{t('ui.hired')} {f.hire_date ? new Date(f.hire_date).toLocaleDateString() : "—"}
                </div>
              </div>

              {f.certifications && f.certifications.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {f.certifications.map((c) => (
                    <span key={c} className="flex items-center gap-1 text-[10px] bg-[#F97316]/15 text-[#F97316] px-2 py-0.5 rounded font-medium">
                      <Award size={10} /> {c}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Production Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-[color:var(--text-primary)]">{f.production_stats?.total_entries ?? 0}</p>
                <p className="text-xs text-[color:var(--text-muted)]">{t('ui.production.entries')}</p>
              </div>
              <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-[color:var(--text-primary)]">{f.production_stats?.this_week_hours ?? 0}</p>
                <p className="text-xs text-[color:var(--text-muted)]">{t('ui.hours.this.week')}</p>
              </div>
            </div>

            {/* Recent Dispatches */}
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-4 space-y-3">
              <h3 className="text-sm font-semibold text-[color:var(--text-primary)] flex items-center gap-2">
                <Send size={14} className="text-[#F97316]" />{t('ui.recent.dispatches')}
              </h3>
              {(f.recent_dispatches?.length ?? 0) === 0 ? (
                <p className="text-xs text-gray-600">{t('ui.no.dispatches.yet')}</p>
              ) : (
                <div className="space-y-2">
                  {f.recent_dispatches.map((d) => {
                    const ds = DISPATCH_STATUS[d.status] ?? DISPATCH_STATUS.pending;
                    return (
                      <div key={d.id} className="flex items-center justify-between py-1.5 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-[color:var(--text-secondary)]">{new Date(d.date).toLocaleDateString()}</span>
                          <span className="text-gray-200">{d.project_name}</span>
                        </div>
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${ds.cls}`}>{d.status}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Recent Check-ins */}
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-4 space-y-3">
              <h3 className="text-sm font-semibold text-[color:var(--text-primary)] flex items-center gap-2">
                <CheckCircle size={14} className="text-[#F97316]" />{t('ui.recent.check.ins')}
              </h3>
              {(f.recent_checkins?.length ?? 0) === 0 ? (
                <p className="text-xs text-gray-600">{t('ui.no.check.ins.yet')}</p>
              ) : (
                <div className="space-y-2">
                  {f.recent_checkins.map((c) => (
                    <div key={c.id} className="flex items-center justify-between py-1.5 text-xs">
                      <div>
                        <span className="text-[color:var(--text-secondary)]">{new Date(c.date).toLocaleDateString()}</span>
                        <span className="text-[color:var(--text-muted)] ml-2">👷 {c.crew_count} · ⏱ {c.hours}{t('ui.h')}</span>
                      </div>
                      {c.notes && <span className="text-gray-600 truncate max-w-[150px]">{c.notes}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SOP Compliance */}
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-4 space-y-3">
              <h3 className="text-sm font-semibold text-[color:var(--text-primary)] flex items-center gap-2">
                <FileText size={14} className="text-[#F97316]" />{t('ui.sop.compliance')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-green-400 font-medium">{t('ui.acknowledged')}{f.sop_compliance?.acknowledged?.length ?? 0})</span>
                  {(f.sop_compliance?.acknowledged?.length ?? 0) === 0 ? (
                    <p className="text-gray-600 mt-1">{t('ui.none.6eef66')}</p>
                  ) : (
                    <ul className="mt-1 space-y-0.5">
                      {f.sop_compliance.acknowledged.map((s) => (
                        <li key={s} className="text-[color:var(--text-secondary)] flex items-center gap-1">
                          <CheckCircle size={10} className="text-green-400" /> {s}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <span className="text-orange-400 font-medium">{t('ui.pending')}{f.sop_compliance?.pending?.length ?? 0})</span>
                  {(f.sop_compliance?.pending?.length ?? 0) === 0 ? (
                    <p className="text-gray-600 mt-1">{t('ui.all.clear')}</p>
                  ) : (
                    <ul className="mt-1 space-y-0.5">
                      {f.sop_compliance.pending.map((s) => (
                        <li key={s} className="text-[color:var(--text-secondary)] flex items-center gap-1">
                          <Clock size={10} className="text-orange-400" /> {s}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // ── Foreman List View ──
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-[color:var(--text-primary)]">{t('ui.foremen')}</h2>
          <p className="text-xs text-[color:var(--text-muted)] mt-0.5">{foremen.length}{t('ui.foremen.on.roster')}</p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-1.5 px-3 py-2 bg-[#F97316] hover:bg-[#ea6c0a] text-[color:var(--text-primary)] rounded-lg text-xs font-semibold transition-colors min-h-[44px]"
        >
          {showAdd ? <><X size={14} />{t('action.cancel')}</> : <><UserPlus size={14} />{t('ui.add.foreman')}</>}
        </button>
      </div>

      {/* Add Form */}
      {showAdd && (
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-bold text-[color:var(--text-primary)]">{t('ui.new.foreman')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-[color:var(--text-secondary)] mb-1 block">{t('ui.name.709a23')} <span className="text-red-400">*</span></label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder={t('ui.e.g.mike.rodriguez')}
                className="w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg px-3 py-2.5 text-[color:var(--text-primary)] text-sm focus:outline-none focus:border-[#F97316]/50 placeholder-gray-600 min-h-[44px]"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[color:var(--text-secondary)] mb-1 block">{t('ui.trade')}</label>
              <input
                value={form.trade}
                onChange={(e) => setForm({ ...form, trade: e.target.value })}
                placeholder={t('ui.e.g.electrical')}
                className="w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg px-3 py-2.5 text-[color:var(--text-primary)] text-sm focus:outline-none focus:border-[#F97316]/50 placeholder-gray-600 min-h-[44px]"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[color:var(--text-secondary)] mb-1 block">{t('ui.phone')}</label>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="602-555-1234"
                className="w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg px-3 py-2.5 text-[color:var(--text-primary)] text-sm focus:outline-none focus:border-[#F97316]/50 placeholder-gray-600 min-h-[44px]"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[color:var(--text-secondary)] mb-1 block">{t('ui.email')}</label>
              <input
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="mike@company.com"
                className="w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg px-3 py-2.5 text-[color:var(--text-primary)] text-sm focus:outline-none focus:border-[#F97316]/50 placeholder-gray-600 min-h-[44px]"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[color:var(--text-secondary)] mb-1 block">{t('ui.certifications')}</label>
              <input
                value={form.certifications}
                onChange={(e) => setForm({ ...form, certifications: e.target.value })}
                placeholder={t('ui.osha.30.first.aid.comma.separated')}
                className="w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg px-3 py-2.5 text-[color:var(--text-primary)] text-sm focus:outline-none focus:border-[#F97316]/50 placeholder-gray-600 min-h-[44px]"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[color:var(--text-secondary)] mb-1 block">{t('ui.hire.date')}</label>
              <input
                type="date"
                value={form.hire_date}
                onChange={(e) => setForm({ ...form, hire_date: e.target.value })}
                className="w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg px-3 py-2.5 text-[color:var(--text-primary)] text-sm focus:outline-none focus:border-[#F97316]/50 min-h-[44px]"
              />
            </div>
          </div>
          {error && (
            <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</div>
          )}
          <button
            onClick={handleAdd}
            disabled={adding}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-[#F97316] hover:bg-[#ea6c0a] disabled:opacity-50 text-[color:var(--text-primary)] rounded-lg text-sm font-semibold transition-colors min-h-[44px]"
          >
            <Plus size={14} />
            {adding ? t('ui.adding') : t('ui.add.foreman')}
          </button>
        </div>
      )}

      {/* Foreman Cards */}
      {foremen.length === 0 ? (
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-8 text-center">
          <Users size={28} className="mx-auto text-gray-600 mb-2" />
          <p className="text-sm text-[color:var(--text-secondary)]">{t('ui.no.foremen.on.your.roster')}</p>
          <p className="text-xs text-gray-600 mt-1">{t('ui.add.foremen.to.start.dispatching.work')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {foremen.map((f) => {
            const badge = STATUS_BADGE[f.status] ?? STATUS_BADGE.active;
            return (
              <div
                key={f.id}
                onClick={() => fetchDetail(f.id)}
                className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-4 hover:border-[#F97316]/30 transition-colors cursor-pointer space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-[color:var(--text-primary)] truncate">{f.name}</span>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${badge.cls}`}>{badge.label}</span>
                </div>
                <p className="text-xs text-[color:var(--text-muted)] capitalize">{f.trade?.replace(/_/g, " ") || "—"}</p>
                <div className="flex items-center justify-between text-xs text-[color:var(--text-secondary)]">
                  <span className="flex items-center gap-1">
                    <Award size={10} /> {f.certifications?.length ?? 0}{t('ui.certs')}
                  </span>
                  <span>{t('ui.active.on')} {f.active_jobs ?? 0}{t('ui.jobs')}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
