"use client";

import { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";

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
  { value: "contractor", label: "Contractor" },
  { value: "architect", label: "Architect" },
  { value: "engineer", label: "Engineer" },
  { value: "owner", label: "Owner" },
  { value: "sub", label: "Sub" },
];

const STATUS_OPTIONS = [
  { value: "not_started", label: "Not Started" },
  { value: "in_preparation", label: "In Preparation" },
  { value: "submitted", label: "Submitted" },
  { value: "under_review", label: "Under Review" },
  { value: "approved", label: "Approved" },
  { value: "approved_as_noted", label: "Approved as Noted" },
  { value: "revise_resubmit", label: "Revise & Resubmit" },
  { value: "rejected", label: "Rejected" },
];

const PRIORITY_OPTIONS = [
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "normal", label: "Normal" },
  { value: "low", label: "Low" },
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
      setError("Network error");
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-[#121217] border border-[#1F1F25] rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[92dvh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-[#121217] border-b border-[#1F1F25] px-5 py-4 flex items-center justify-between z-10">
          <h2 className="text-base font-bold text-[color:var(--text-primary)]">
            {isEdit ? "Edit Submittal" : "New Submittal"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] hover:bg-[#1F1F25] transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Number + Spec Section */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[color:var(--text-secondary)] mb-1.5 font-medium">Number *</label>
              <input
                value={form.submittal_number}
                onChange={(e) => setForm((f) => ({ ...f, submittal_number: e.target.value }))}
                placeholder="S-001"
                required
                className="w-full bg-[#0B0B0D] border border-[#1F1F25] rounded-xl px-3 py-2.5 text-[color:var(--text-primary)] text-sm focus:outline-none focus:border-[#F97316]/50 placeholder-gray-600"
              />
            </div>
            <div>
              <label className="block text-xs text-[color:var(--text-secondary)] mb-1.5 font-medium">Spec Section</label>
              <input
                value={form.spec_section}
                onChange={(e) => setForm((f) => ({ ...f, spec_section: e.target.value }))}
                placeholder="03 30 00"
                className="w-full bg-[#0B0B0D] border border-[#1F1F25] rounded-xl px-3 py-2.5 text-[color:var(--text-primary)] text-sm focus:outline-none focus:border-[#F97316]/50 placeholder-gray-600"
              />
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs text-[color:var(--text-secondary)] mb-1.5 font-medium">Title *</label>
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Concrete Mix Design"
              required
              className="w-full bg-[#0B0B0D] border border-[#1F1F25] rounded-xl px-3 py-2.5 text-[color:var(--text-primary)] text-sm focus:outline-none focus:border-[#F97316]/50 placeholder-gray-600"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs text-[color:var(--text-secondary)] mb-1.5 font-medium">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Optional details…"
              rows={2}
              className="w-full bg-[#0B0B0D] border border-[#1F1F25] rounded-xl px-3 py-2.5 text-[color:var(--text-primary)] text-sm focus:outline-none focus:border-[#F97316]/50 placeholder-gray-600 resize-none"
            />
          </div>

          {/* Priority */}
          <div>
            <label className="block text-xs text-[color:var(--text-secondary)] mb-1.5 font-medium">Priority</label>
            <div className="flex gap-2 flex-wrap">
              {PRIORITY_OPTIONS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, priority: p.value }))}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors min-h-[36px] ${
                    form.priority === p.value
                      ? "bg-[#F97316] text-[color:var(--text-primary)]"
                      : "bg-[#0B0B0D] border border-[#1F1F25] text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]"
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
              <label className="block text-xs text-[color:var(--text-secondary)] mb-1.5 font-medium">Required By</label>
              <input
                type="date"
                value={form.required_by}
                onChange={(e) => setForm((f) => ({ ...f, required_by: e.target.value }))}
                className="w-full bg-[#0B0B0D] border border-[#1F1F25] rounded-xl px-3 py-2.5 text-[color:var(--text-primary)] text-sm focus:outline-none focus:border-[#F97316]/50"
              />
            </div>
            <div>
              <label className="block text-xs text-[color:var(--text-secondary)] mb-1.5 font-medium">Lead Time (days)</label>
              <input
                type="number"
                min={0}
                value={form.lead_time_days}
                onChange={(e) => setForm((f) => ({ ...f, lead_time_days: e.target.value }))}
                placeholder="14"
                className="w-full bg-[#0B0B0D] border border-[#1F1F25] rounded-xl px-3 py-2.5 text-[color:var(--text-primary)] text-sm focus:outline-none focus:border-[#F97316]/50 placeholder-gray-600"
              />
            </div>
          </div>

          {/* Assigned To */}
          <div>
            <label className="block text-xs text-[color:var(--text-secondary)] mb-1.5 font-medium">Assigned To (Sub/Supplier)</label>
            <select
              value={form.assigned_to}
              onChange={(e) => setForm((f) => ({ ...f, assigned_to: e.target.value }))}
              className="w-full bg-[#0B0B0D] border border-[#1F1F25] rounded-xl px-3 py-2.5 text-[color:var(--text-primary)] text-sm focus:outline-none focus:border-[#F97316]/50"
            >
              <option value="">— None —</option>
              {subs.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}{c.company ? ` · ${c.company}` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Reviewer */}
          <div>
            <label className="block text-xs text-[color:var(--text-secondary)] mb-1.5 font-medium">Reviewer (Architect/Engineer)</label>
            <select
              value={form.reviewer_id}
              onChange={(e) => setForm((f) => ({ ...f, reviewer_id: e.target.value }))}
              className="w-full bg-[#0B0B0D] border border-[#1F1F25] rounded-xl px-3 py-2.5 text-[color:var(--text-primary)] text-sm focus:outline-none focus:border-[#F97316]/50"
            >
              <option value="">— None —</option>
              {reviewers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}{c.company ? ` · ${c.company}` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Ball in Court */}
          <div>
            <label className="block text-xs text-[color:var(--text-secondary)] mb-1.5 font-medium">Ball in Court</label>
            <div className="flex gap-2 flex-wrap">
              {BALL_IN_COURT_OPTIONS.map((b) => (
                <button
                  key={b.value}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, ball_in_court: b.value }))}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors min-h-[36px] ${
                    form.ball_in_court === b.value
                      ? "bg-[#F97316] text-[color:var(--text-primary)]"
                      : "bg-[#0B0B0D] border border-[#1F1F25] text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]"
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
              <label className="block text-xs text-[color:var(--text-secondary)] mb-1.5 font-medium">Status</label>
              <div className="flex gap-2 flex-wrap">
                {STATUS_OPTIONS.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, status: s.value }))}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors min-h-[36px] ${
                      form.status === s.value
                        ? "bg-[#F97316] text-[color:var(--text-primary)]"
                        : "bg-[#0B0B0D] border border-[#1F1F25] text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]"
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
            <label className="block text-xs text-[color:var(--text-secondary)] mb-1.5 font-medium">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Any additional notes…"
              rows={2}
              className="w-full bg-[#0B0B0D] border border-[#1F1F25] rounded-xl px-3 py-2.5 text-[color:var(--text-primary)] text-sm focus:outline-none focus:border-[#F97316]/50 placeholder-gray-600 resize-none"
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
              className="flex-1 py-3 rounded-xl bg-[#1F1F25] text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] text-sm font-medium transition-colors min-h-[44px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 rounded-xl bg-[#F97316] hover:bg-[#ea6c10] disabled:opacity-50 text-[color:var(--text-primary)] text-sm font-bold transition-colors min-h-[44px] flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : null}
              {isEdit ? "Save Changes" : "Create Submittal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
