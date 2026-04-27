"use client";

import { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { t } from "@/lib/i18n";

interface Contact {
  id: string;
  name: string;
  company: string | null;
  role: string;
}

interface Submittal {
  id: string;
  submittal_number: string;
  spec_section: string | null;
  title: string;
  description: string | null;
  assigned_to: string | null;
  reviewer_id: string | null;
  ball_in_court: string;
  status: string;
  required_by: string | null;
  lead_time_days: number | null;
  priority: string;
  notes: string | null;
}

interface Props {
  projectId: string;
  editSubmittal?: Submittal | null;
  onClose: () => void;
  onSaved: () => void;
}

const BALL_IN_COURT_OPTIONS = [
  { value: "contractor", label: t('ui.contractor') },
  { value: "architect", label: t('ui.architect') },
  { value: "engineer", label: t('ui.engineer') },
  { value: "owner", label: t('ui.owner') },
  { value: "sub", label: t('ui.sub') },
];

const STATUS_OPTIONS = [
  { value: "not_started", label: t('ui.not.started') },
  { value: "in_preparation", label: t('ui.in.preparation') },
  { value: "submitted", label: t('ui.submitted') },
  { value: "under_review", label: t('ui.under.review') },
  { value: "approved", label: t('ui.approved.41b81e') },
  { value: "approved_as_noted", label: t('ui.approved.as.noted') },
  { value: "revise_resubmit", label: t('ui.revise.and.resubmit') },
  { value: "rejected", label: t('ui.rejected.27eeb7') },
];

const PRIORITY_OPTIONS = [
  { value: "critical", label: t('ui.critical') },
  { value: "high", label: t('ui.high') },
  { value: "normal", label: t('ui.normal') },
  { value: "low", label: t('ui.low') },
];

export default function SubmittalForm({ projectId, editSubmittal, onClose, onSaved }: Props) {
  const isEdit = !!editSubmittal;

  const [form, setForm] = useState({
    submittal_number: editSubmittal?.submittal_number ?? "",
    title: editSubmittal?.title ?? "",
    spec_section: editSubmittal?.spec_section ?? "",
    description: editSubmittal?.description ?? "",
    priority: editSubmittal?.priority ?? "normal",
    required_by: editSubmittal?.required_by ?? "",
    lead_time_days: editSubmittal?.lead_time_days?.toString() ?? "",
    assigned_to: editSubmittal?.assigned_to ?? "",
    reviewer_id: editSubmittal?.reviewer_id ?? "",
    ball_in_court: editSubmittal?.ball_in_court ?? "contractor",
    status: editSubmittal?.status ?? "not_started",
    notes: editSubmittal?.notes ?? "",
  });

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load project directory for dropdowns
    fetch(`/api/projects/${projectId}/directory`)
      .then((r) => r.json())
      .then((data: Array<{ company_contacts: Contact }>) => {
        setContacts(Array.isArray(data) ? data.map((d) => d.company_contacts) : []);
      })
      .catch(() => setContacts([]));

    // Auto-suggest next submittal number if creating
    if (!isEdit) {
      fetch(`/api/projects/${projectId}/submittals`)
        .then((r) => r.json())
        .then((data: Array<{ submittal_number: string }>) => {
          if (!Array.isArray(data) || data.length === 0) {
            setForm((f) => ({ ...f, submittal_number: "S-001" }));
            return;
          }
          // Find max S-XXX number
          let max = 0;
          for (const s of data) {
            const match = s.submittal_number.match(/^S-(\d+)$/);
            if (match) {
              const n = parseInt(match[1], 10);
              if (n > max) max = n;
            }
          }
          setForm((f) => ({ ...f, submittal_number: `S-${String(max + 1).padStart(3, "0")}` }));
        })
        .catch(() => {});
    }
  }, [projectId, isEdit]);

  const subs = contacts.filter((c) => c.role === "subcontractor" || c.role === "supplier");
  const reviewers = contacts.filter((c) => c.role === "architect" || c.role === "engineer");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const payload = {
      submittal_number: form.submittal_number.trim(),
      title: form.title.trim(),
      spec_section: form.spec_section.trim() || null,
      description: form.description.trim() || null,
      priority: form.priority,
      required_by: form.required_by || null,
      lead_time_days: form.lead_time_days ? parseInt(form.lead_time_days, 10) : null,
      assigned_to: form.assigned_to || null,
      reviewer_id: form.reviewer_id || null,
      ball_in_court: form.ball_in_court,
      status: form.status,
      notes: form.notes.trim() || null,
    };

    try {
      let res: Response;
      if (isEdit) {
        res = await fetch(`/api/projects/${projectId}/submittals/${editSubmittal!.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`/api/projects/${projectId}/submittals`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Failed to save");
        setSaving(false);
        return;
      }

      onSaved();
      onClose();
    } catch {
      setError(t('ui.network.error'));
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[92dvh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-[var(--bg-secondary)] border-b border-[var(--border-primary)] px-5 py-4 flex items-center justify-between z-10">
          <h2 className="text-base font-bold text-[color:var(--text-primary)]">
            {isEdit ? t('ui.edit.submittal') : t('ui.new.submittal')}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Number + Spec Section */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[color:var(--text-secondary)] mb-1.5 font-medium">{t('ui.number')}</label>
              <input
                value={form.submittal_number}
                onChange={(e) => setForm((f) => ({ ...f, submittal_number: e.target.value }))}
                placeholder={t('ui.s.001')}
                required
                className="w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl px-3 py-2.5 text-[color:var(--text-primary)] text-sm focus:outline-none focus:border-[#F97316]/50 placeholder-gray-600"
              />
            </div>
            <div>
              <label className="block text-xs text-[color:var(--text-secondary)] mb-1.5 font-medium">{t('ui.spec.section')}</label>
              <input
                value={form.spec_section}
                onChange={(e) => setForm((f) => ({ ...f, spec_section: e.target.value }))}
                placeholder="03 30 00"
                className="w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl px-3 py-2.5 text-[color:var(--text-primary)] text-sm focus:outline-none focus:border-[#F97316]/50 placeholder-gray-600"
              />
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs text-[color:var(--text-secondary)] mb-1.5 font-medium">{t('ui.title.961697')}</label>
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder={t('ui.concrete.mix.design')}
              required
              className="w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl px-3 py-2.5 text-[color:var(--text-primary)] text-sm focus:outline-none focus:border-[#F97316]/50 placeholder-gray-600"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs text-[color:var(--text-secondary)] mb-1.5 font-medium">{t('blocker.description')}</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder={t('ui.optional.details')}
              rows={2}
              className="w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl px-3 py-2.5 text-[color:var(--text-primary)] text-sm focus:outline-none focus:border-[#F97316]/50 placeholder-gray-600 resize-none"
            />
          </div>

          {/* Priority */}
          <div>
            <label className="block text-xs text-[color:var(--text-secondary)] mb-1.5 font-medium">{t('ui.priority')}</label>
            <div className="flex gap-2 flex-wrap">
              {PRIORITY_OPTIONS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, priority: p.value }))}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors min-h-[36px] ${
                    form.priority === p.value
                      ? "bg-[#F97316] text-[color:var(--text-primary)]"
                      : "bg-[var(--bg-primary)] border border-[var(--border-primary)] text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Required By + Lead Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[color:var(--text-secondary)] mb-1.5 font-medium">{t('ui.required.by')}</label>
              <input
                type="date"
                value={form.required_by}
                onChange={(e) => setForm((f) => ({ ...f, required_by: e.target.value }))}
                className="w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl px-3 py-2.5 text-[color:var(--text-primary)] text-sm focus:outline-none focus:border-[#F97316]/50"
              />
            </div>
            <div>
              <label className="block text-xs text-[color:var(--text-secondary)] mb-1.5 font-medium">{t('ui.lead.time.days')}</label>
              <input
                type="number"
                min={0}
                value={form.lead_time_days}
                onChange={(e) => setForm((f) => ({ ...f, lead_time_days: e.target.value }))}
                placeholder="14"
                className="w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl px-3 py-2.5 text-[color:var(--text-primary)] text-sm focus:outline-none focus:border-[#F97316]/50 placeholder-gray-600"
              />
            </div>
          </div>

          {/* Assigned To */}
          <div>
            <label className="block text-xs text-[color:var(--text-secondary)] mb-1.5 font-medium">{t('ui.assigned.to.sub.supplier')}</label>
            <select
              value={form.assigned_to}
              onChange={(e) => setForm((f) => ({ ...f, assigned_to: e.target.value }))}
              className="w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl px-3 py-2.5 text-[color:var(--text-primary)] text-sm focus:outline-none focus:border-[#F97316]/50"
            >
              <option value="">{t('ui.none')}</option>
              {subs.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}{c.company ? ` · ${c.company}` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Reviewer */}
          <div>
            <label className="block text-xs text-[color:var(--text-secondary)] mb-1.5 font-medium">{t('ui.reviewer.architect.engineer')}</label>
            <select
              value={form.reviewer_id}
              onChange={(e) => setForm((f) => ({ ...f, reviewer_id: e.target.value }))}
              className="w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl px-3 py-2.5 text-[color:var(--text-primary)] text-sm focus:outline-none focus:border-[#F97316]/50"
            >
              <option value="">{t('ui.none')}</option>
              {reviewers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}{c.company ? ` · ${c.company}` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Ball in Court */}
          <div>
            <label className="block text-xs text-[color:var(--text-secondary)] mb-1.5 font-medium">{t('ui.ball.in.court')}</label>
            <div className="flex gap-2 flex-wrap">
              {BALL_IN_COURT_OPTIONS.map((b) => (
                <button
                  key={b.value}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, ball_in_court: b.value }))}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors min-h-[36px] ${
                    form.ball_in_court === b.value
                      ? "bg-[#F97316] text-[color:var(--text-primary)]"
                      : "bg-[var(--bg-primary)] border border-[var(--border-primary)] text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]"
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          {/* Status (edit only) */}
          {isEdit && (
            <div>
              <label className="block text-xs text-[color:var(--text-secondary)] mb-1.5 font-medium">{t('ui.status')}</label>
              <div className="flex gap-2 flex-wrap">
                {STATUS_OPTIONS.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, status: s.value }))}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors min-h-[36px] ${
                      form.status === s.value
                        ? "bg-[#F97316] text-[color:var(--text-primary)]"
                        : "bg-[var(--bg-primary)] border border-[var(--border-primary)] text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs text-[color:var(--text-secondary)] mb-1.5 font-medium">{t('ui.notes')}</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder={t('ui.any.additional.notes')}
              rows={2}
              className="w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl px-3 py-2.5 text-[color:var(--text-primary)] text-sm focus:outline-none focus:border-[#F97316]/50 placeholder-gray-600 resize-none"
            />
          </div>

          {error && (
            <p className="text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-[var(--bg-tertiary)] text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] text-sm font-medium transition-colors min-h-[44px]"
            >{t('action.cancel')}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 rounded-xl bg-[#F97316] hover:bg-[#ea6c10] disabled:opacity-50 text-[color:var(--text-primary)] text-sm font-bold transition-colors min-h-[44px] flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : null}
              {isEdit ? t('ui.save.changes') : t('ui.create.submittal')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
