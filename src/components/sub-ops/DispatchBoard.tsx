"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "@/lib/i18n";

const { t } = useTranslation();
import {
  Send, Plus, X, ChevronDown, ChevronUp, Calendar, MapPin,
  Clock, Users, FileText, Filter, CheckCircle,
} from "lucide-react";

interface Props {
  projectId: string;
}

interface Foreman {
  id: string;
  name: string;
  trade: string;
}

interface SOP {
  id: string;
  title: string;
}

interface Dispatch {
  id: string;
  foreman_id: string;
  foreman_name: string;
  date: string;
  project_name: string;
  project_location: string | null;
  scope_of_work: string;
  priority_notes: string | null;
  safety_focus: string | null;
  material_notes: string | null;
  special_instructions: string | null;
  expected_crew_size: number | null;
  expected_hours: number | null;
  sop_ids: string[];
  status: "pending" | "acknowledged" | "completed" | "cancelled";
  acknowledged_at: string | null;
  created_at: string;
}

const STATUS_STYLES: Record<string, { label: string; cls: string }> = {
  pending: { label: t('status.pending'), cls: "bg-orange-500/20 text-orange-300" },
  acknowledged: { label: t('dispatch.acknowledged'), cls: "bg-green-500/20 text-green-300" },
  completed: { label: t('status.completed'), cls: "bg-blue-500/20 text-blue-300" },
  cancelled: { label: t('status.cancelled'), cls: "bg-gray-700 text-[color:var(--text-secondary)]" },
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function getTomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

function getToday() {
  return new Date().toISOString().split("T")[0];
}

export default function DispatchBoard({ projectId }: Props) {
  const [view, setView] = useState<"list" | "create">("list");
  const [dispatches, setDispatches] = useState<Dispatch[]>([]);
  const [foremen, setForemen] = useState<Foreman[]>([]);
  const [sops, setSops] = useState<SOP[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Filters
  const [filterDate, setFilterDate] = useState(getToday());
  const [filterForeman, setFilterForeman] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // Create form
  const [form, setForm] = useState({
    foreman_id: "",
    date: getTomorrow(),
    project_name: "",
    project_location: "",
    scope_of_work: "",
    priority_notes: "",
    safety_focus: "",
    material_notes: "",
    special_instructions: "",
    expected_crew_size: "",
    expected_hours: "",
    sop_ids: [] as string[],
  });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const companyId = typeof window !== "undefined" ? localStorage.getItem("sub_ops_company_id") : null;

  const fetchData = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const [dRes, fRes, sRes] = await Promise.all([
        fetch(`/api/sub-ops/companies/${companyId}/dispatches?date=${filterDate}&foreman=${filterForeman}&status=${filterStatus}`),
        fetch(`/api/sub-ops/companies/${companyId}/foremen`),
        fetch(`/api/sub-ops/companies/${companyId}/sops`),
      ]);
      if (dRes.ok) {
        const d = await dRes.json();
        setDispatches(Array.isArray(d) ? d : d.dispatches ?? []);
      }
      if (fRes.ok) {
        const f = await fRes.json();
        setForemen(Array.isArray(f) ? f : f.foremen ?? []);
      }
      if (sRes.ok) {
        const s = await sRes.json();
        setSops(Array.isArray(s) ? s : s.sops ?? []);
      }
    } catch {}
    setLoading(false);
  }, [companyId, filterDate, filterForeman, filterStatus]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSend = async () => {
    if (!form.foreman_id) { setError(t('ui.select.a.foreman')); return; }
    if (!form.scope_of_work.trim()) { setError(t('ui.scope.of.work.is.required')); return; }
    if (!form.project_name.trim()) { setError(t('ui.project.name.is.required.dc3b4f')); return; }
    setSending(true);
    setError("");
    try {
      const res = await fetch(`/api/sub-ops/companies/${companyId}/dispatches`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          expected_crew_size: form.expected_crew_size ? Number(form.expected_crew_size) : null,
          expected_hours: form.expected_hours ? Number(form.expected_hours) : null,
        }),
      });
      if (res.ok) {
        setView("list");
        setForm({
          foreman_id: "", date: getTomorrow(), project_name: "", project_location: "",
          scope_of_work: "", priority_notes: "", safety_focus: "", material_notes: "",
          special_instructions: "", expected_crew_size: "", expected_hours: "", sop_ids: [],
        });
        await fetchData();
      } else {
        const d = await res.json().catch(() => ({}));
        setError(d.error || "Failed to create dispatch");
      }
    } catch {
      setError(t('ui.network.error'));
    }
    setSending(false);
  };

  const toggleSop = (id: string) => {
    setForm((prev) => ({
      ...prev,
      sop_ids: prev.sop_ids.includes(id)
        ? prev.sop_ids.filter((s) => s !== id)
        : [...prev.sop_ids, id],
    }));
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-[color:var(--text-primary)]">{t('ui.dispatch.board')}</h2>
          <p className="text-xs text-[color:var(--text-muted)] mt-0.5">{t('ui.morning.huddle.send.daily.work.assignments')}</p>
        </div>
        <button
          onClick={() => setView(view === "list" ? "create" : "list")}
          className="flex items-center gap-1.5 px-3 py-2 bg-[#F97316] hover:bg-[#ea6c0a] text-[color:var(--text-primary)] rounded-lg text-xs font-semibold transition-colors min-h-[44px]"
        >
          {view === "list" ? <><Plus size={14} />{t('ui.create.dispatch')}</> : <><X size={14} />{t('action.cancel')}</>}
        </button>
      </div>

      {view === "create" ? (
        /* ── Create Dispatch Form ── */
        <div className="bg-[#121217] border border-[#1F1F25] rounded-xl p-4 md:p-6 space-y-4">
          <h3 className="text-sm font-bold text-[color:var(--text-primary)] flex items-center gap-2">
            <Send size={14} className="text-[#F97316]" />{t('ui.new.dispatch')}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-[color:var(--text-secondary)] mb-1.5 block">{t('ui.foreman')} <span className="text-red-400">*</span>
              </label>
              <select
                value={form.foreman_id}
                onChange={(e) => setForm({ ...form, foreman_id: e.target.value })}
                className="w-full bg-[#0B0B0D] border border-[#1F1F25] rounded-lg px-3 py-2.5 text-[color:var(--text-primary)] text-sm focus:outline-none focus:border-[#F97316]/50 appearance-none min-h-[44px]"
              >
                <option value="">{t('ui.select.foreman')}</option>
                {foremen.map((f) => (
                  <option key={f.id} value={f.id}>{f.name} — {f.trade}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-[color:var(--text-secondary)] mb-1.5 block">{t('ui.date')}</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full bg-[#0B0B0D] border border-[#1F1F25] rounded-lg px-3 py-2.5 text-[color:var(--text-primary)] text-sm focus:outline-none focus:border-[#F97316]/50 min-h-[44px]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-[color:var(--text-secondary)] mb-1.5 block">{t('ui.project.name')} <span className="text-red-400">*</span>
              </label>
              <input
                value={form.project_name}
                onChange={(e) => setForm({ ...form, project_name: e.target.value })}
                placeholder={t('ui.e.g.building.a.phase.2')}
                className="w-full bg-[#0B0B0D] border border-[#1F1F25] rounded-lg px-3 py-2.5 text-[color:var(--text-primary)] text-sm focus:outline-none focus:border-[#F97316]/50 placeholder-gray-600 min-h-[44px]"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[color:var(--text-secondary)] mb-1.5 block">{t('ui.project.location')}</label>
              <input
                value={form.project_location}
                onChange={(e) => setForm({ ...form, project_location: e.target.value })}
                placeholder={t('ui.e.g.3rd.floor.east.wing')}
                className="w-full bg-[#0B0B0D] border border-[#1F1F25] rounded-lg px-3 py-2.5 text-[color:var(--text-primary)] text-sm focus:outline-none focus:border-[#F97316]/50 placeholder-gray-600 min-h-[44px]"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-[color:var(--text-secondary)] mb-1.5 block">{t('dispatch.scopeOfWork')} <span className="text-red-400">*</span>
            </label>
            <textarea
              value={form.scope_of_work}
              onChange={(e) => setForm({ ...form, scope_of_work: e.target.value })}
              placeholder={t('ui.what.are.they.doing.today')}
              rows={3}
              className="w-full bg-[#0B0B0D] border border-[#1F1F25] rounded-lg px-3 py-2.5 text-[color:var(--text-primary)] text-sm focus:outline-none focus:border-[#F97316]/50 placeholder-gray-600 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-[color:var(--text-secondary)] mb-1.5 block">{t('dispatch.priorityNotes')}</label>
              <textarea
                value={form.priority_notes}
                onChange={(e) => setForm({ ...form, priority_notes: e.target.value })}
                placeholder={t('ui.what.should.they.watch.out.for')}
                rows={2}
                className="w-full bg-[#0B0B0D] border border-[#1F1F25] rounded-lg px-3 py-2.5 text-[color:var(--text-primary)] text-sm focus:outline-none focus:border-[#F97316]/50 placeholder-gray-600 resize-none"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[color:var(--text-secondary)] mb-1.5 block">{t('dispatch.safetyFocus')}</label>
              <textarea
                value={form.safety_focus}
                onChange={(e) => setForm({ ...form, safety_focus: e.target.value })}
                placeholder={t('ui.today.s.safety.topic')}
                rows={2}
                className="w-full bg-[#0B0B0D] border border-[#1F1F25] rounded-lg px-3 py-2.5 text-[color:var(--text-primary)] text-sm focus:outline-none focus:border-[#F97316]/50 placeholder-gray-600 resize-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-[color:var(--text-secondary)] mb-1.5 block">{t('dispatch.materialNotes')}</label>
              <textarea
                value={form.material_notes}
                onChange={(e) => setForm({ ...form, material_notes: e.target.value })}
                placeholder={t('ui.what.s.being.delivered.what.to.verify')}
                rows={2}
                className="w-full bg-[#0B0B0D] border border-[#1F1F25] rounded-lg px-3 py-2.5 text-[color:var(--text-primary)] text-sm focus:outline-none focus:border-[#F97316]/50 placeholder-gray-600 resize-none"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[color:var(--text-secondary)] mb-1.5 block">{t('ui.special.instructions')}</label>
              <textarea
                value={form.special_instructions}
                onChange={(e) => setForm({ ...form, special_instructions: e.target.value })}
                placeholder={t('ui.any.other.notes')}
                rows={2}
                className="w-full bg-[#0B0B0D] border border-[#1F1F25] rounded-lg px-3 py-2.5 text-[color:var(--text-primary)] text-sm focus:outline-none focus:border-[#F97316]/50 placeholder-gray-600 resize-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-[color:var(--text-secondary)] mb-1.5 block">{t('ui.expected.crew.size')}</label>
              <input
                type="number"
                min="1"
                value={form.expected_crew_size}
                onChange={(e) => setForm({ ...form, expected_crew_size: e.target.value })}
                placeholder={t('ui.e.g.4')}
                className="w-full bg-[#0B0B0D] border border-[#1F1F25] rounded-lg px-3 py-2.5 text-[color:var(--text-primary)] text-sm focus:outline-none focus:border-[#F97316]/50 placeholder-gray-600 min-h-[44px]"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[color:var(--text-secondary)] mb-1.5 block">{t('ui.expected.hours')}</label>
              <input
                type="number"
                min="1"
                value={form.expected_hours}
                onChange={(e) => setForm({ ...form, expected_hours: e.target.value })}
                placeholder={t('ui.e.g.8')}
                className="w-full bg-[#0B0B0D] border border-[#1F1F25] rounded-lg px-3 py-2.5 text-[color:var(--text-primary)] text-sm focus:outline-none focus:border-[#F97316]/50 placeholder-gray-600 min-h-[44px]"
              />
            </div>
          </div>

          {/* SOPs multi-select */}
          {sops.length > 0 && (
            <div>
              <label className="text-xs font-medium text-[color:var(--text-secondary)] mb-1.5 block">{t('ui.attach.sops')}</label>
              <div className="flex flex-wrap gap-2">
                {sops.map((s) => {
                  const selected = form.sop_ids.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggleSop(s.id)}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors min-h-[36px] ${
                        selected
                          ? "bg-[#F97316]/20 text-[#F97316] border border-[#F97316]/30"
                          : "bg-[#1F1F25] text-[color:var(--text-secondary)] border border-[#1F1F25] hover:text-[color:var(--text-primary)]"
                      }`}
                    >
                      <FileText size={12} />
                      {s.title}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {error && (
            <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <button
            onClick={handleSend}
            disabled={sending}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-[#F97316] hover:bg-[#ea6c0a] disabled:opacity-50 text-[color:var(--text-primary)] rounded-lg text-sm font-bold transition-colors w-full min-h-[44px]"
          >
            <Send size={16} />
            {sending ? t('ui.sending') : t('dispatch.sendDispatch')}
          </button>
        </div>
      ) : (
        /* ── Dispatch List View ── */
        <>
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-[#121217] border border-[#1F1F25] rounded-lg px-2.5 py-1.5">
              <Calendar size={12} className="text-[color:var(--text-muted)]" />
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="bg-transparent text-[color:var(--text-primary)] text-xs focus:outline-none"
              />
            </div>
            <select
              value={filterForeman}
              onChange={(e) => setFilterForeman(e.target.value)}
              className="bg-[#121217] border border-[#1F1F25] rounded-lg px-2.5 py-2 text-xs text-[color:var(--text-primary)] focus:outline-none appearance-none min-h-[36px]"
            >
              <option value="">{t('ui.all.foremen')}</option>
              {foremen.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-[#121217] border border-[#1F1F25] rounded-lg px-2.5 py-2 text-xs text-[color:var(--text-primary)] focus:outline-none appearance-none min-h-[36px]"
            >
              <option value="">{t('ui.all.status')}</option>
              <option value="pending">{t('status.pending')}</option>
              <option value="acknowledged">{t('dispatch.acknowledged')}</option>
              <option value="completed">{t('status.completed')}</option>
              <option value="cancelled">{t('status.cancelled')}</option>
            </select>
          </div>

          {/* Dispatch Cards */}
          {dispatches.length === 0 ? (
            <div className="bg-[#121217] border border-[#1F1F25] rounded-xl p-8 text-center">
              <Send size={28} className="mx-auto text-gray-600 mb-2" />
              <p className="text-sm text-[color:var(--text-secondary)]">{t('ui.no.dispatches.for.this.date')}</p>
              <p className="text-xs text-gray-600 mt-1">{t('ui.create.a.dispatch.to.send.work.assignments.to.your.foremen')}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {dispatches.map((d) => {
                const style = STATUS_STYLES[d.status] ?? STATUS_STYLES.pending;
                const isExpanded = expandedId === d.id;
                return (
                  <div
                    key={d.id}
                    className="bg-[#121217] border border-[#1F1F25] rounded-xl overflow-hidden"
                  >
                    <div
                      className="flex items-center justify-between p-4 cursor-pointer hover:bg-[#1a1a20] transition-colors"
                      onClick={() => setExpandedId(isExpanded ? null : d.id)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-sm font-semibold text-[color:var(--text-primary)] truncate">{d.foreman_name}</span>
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${style.cls}`}>
                            {style.label}
                          </span>
                        </div>
                        <p className="text-xs text-[color:var(--text-secondary)] truncate">{d.project_name}</p>
                        <p className="text-xs text-gray-600 truncate mt-0.5">{d.scope_of_work}</p>
                      </div>
                      <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                        <span className="text-xs text-[color:var(--text-muted)]">{formatDate(d.date)}</span>
                        {isExpanded ? <ChevronUp size={14} className="text-[color:var(--text-muted)]" /> : <ChevronDown size={14} className="text-[color:var(--text-muted)]" />}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-[#1F1F25] p-4 space-y-3 bg-[#0e0e12] text-xs">
                        {d.project_location && (
                          <div className="flex items-start gap-2">
                            <MapPin size={12} className="text-[color:var(--text-muted)] mt-0.5 flex-none" />
                            <span className="text-[color:var(--text-secondary)]">{d.project_location}</span>
                          </div>
                        )}
                        <div>
                          <span className="text-[color:var(--text-muted)] font-medium">{t('ui.scope')}</span>
                          <p className="text-[color:var(--text-secondary)] mt-1 whitespace-pre-wrap">{d.scope_of_work}</p>
                        </div>
                        {d.priority_notes && (
                          <div>
                            <span className="text-[color:var(--text-muted)] font-medium">{t('ui.priority.notes')}</span>
                            <p className="text-[color:var(--text-secondary)] mt-1">{d.priority_notes}</p>
                          </div>
                        )}
                        {d.safety_focus && (
                          <div>
                            <span className="text-[color:var(--text-muted)] font-medium">{t('ui.safety.focus')}</span>
                            <p className="text-[color:var(--text-secondary)] mt-1">{d.safety_focus}</p>
                          </div>
                        )}
                        {d.material_notes && (
                          <div>
                            <span className="text-[color:var(--text-muted)] font-medium">{t('ui.material.notes')}</span>
                            <p className="text-[color:var(--text-secondary)] mt-1">{d.material_notes}</p>
                          </div>
                        )}
                        {d.special_instructions && (
                          <div>
                            <span className="text-[color:var(--text-muted)] font-medium">{t('ui.special.instructions.51e611')}</span>
                            <p className="text-[color:var(--text-secondary)] mt-1">{d.special_instructions}</p>
                          </div>
                        )}
                        <div className="flex items-center gap-4 text-[color:var(--text-secondary)]">
                          {d.expected_crew_size && (
                            <span className="flex items-center gap-1">
                              <Users size={12} /> {d.expected_crew_size}{t('ui.crew')}
                            </span>
                          )}
                          {d.expected_hours && (
                            <span className="flex items-center gap-1">
                              <Clock size={12} /> {d.expected_hours}{t('ui.h.expected')}
                            </span>
                          )}
                        </div>
                        {d.acknowledged_at && (
                          <div className="flex items-center gap-1 text-green-400">
                            <CheckCircle size={12} />{t('dispatch.acknowledged')} {new Date(d.acknowledged_at).toLocaleString()}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
