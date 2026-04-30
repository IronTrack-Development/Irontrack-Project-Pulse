"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  CheckCircle, Camera, Plus, X, AlertTriangle, Send, Clock,
  Users, Shield, Package, FileText, BellRing,
} from "lucide-react";

interface Props {
  projectId: string;
}

interface TodayDispatch {
  id: string;
  project_name: string;
  scope_of_work: string;
  priority_notes: string | null;
  safety_focus: string | null;
  material_notes: string | null;
  expected_crew_size: number | null;
  expected_hours: number | null;
  status: string;
}

interface ProductionEntry {
  description: string;
  quantity: string;
  unit: string;
  photo: File | null;
  area: string;
}

interface Foreman {
  id: string;
  name: string;
}

export default function CheckInView({ projectId }: Props) {
  const [dispatch, setDispatch] = useState<TodayDispatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<"dispatch" | "checkin" | "production" | "blocker">("dispatch");
  const [checkedIn, setCheckedIn] = useState(false);
  const [currentCheckinId, setCurrentCheckinId] = useState("");
  const [foremen, setForemen] = useState<Foreman[]>([]);
  const [foremanId, setForemanId] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Check-in form
  const [crewCount, setCrewCount] = useState("");
  const [hoursWorked, setHoursWorked] = useState("");
  const [sitePhoto, setSitePhoto] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Production entries
  const [entries, setEntries] = useState<ProductionEntry[]>([
    { description: "", quantity: "", unit: "LF", photo: null, area: "" },
  ]);

  // Blocker form
  const [blockerCategory, setBlockerCategory] = useState("material");
  const [blockerDescription, setBlockerDescription] = useState("");
  const [blockerImpact, setBlockerImpact] = useState("");
  const [blockerPhoto, setBlockerPhoto] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const blockerPhotoInputRef = useRef<HTMLInputElement>(null);
  const companyId = typeof window !== "undefined" ? localStorage.getItem("sub_ops_company_id") : null;
  const draftKey = companyId ? `irontrack_checkin_draft_${companyId}_${projectId}` : "";
  const steps = [
    { id: "dispatch", label: "Plan" },
    { id: "checkin", label: "Crew" },
    { id: "production", label: "Work" },
    { id: "blocker", label: "Blocker" },
  ] as const;
  const noteChips = [
    "Material missing",
    "Area not ready",
    "Need layout",
    "Crew short",
    "Waiting on GC",
    "Ready for next crew",
  ];

  const appendNote = (note: string) => {
    setNotes((current) => {
      if (current.includes(note)) return current;
      return current.trim() ? `${current.trim()}\n${note}` : note;
    });
  };

  const fetchDispatch = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const [dispatchRes, foremenRes] = await Promise.all([
        fetch(`/api/sub-ops/companies/${companyId}/dispatches?date=${today}`),
        fetch(`/api/sub-ops/companies/${companyId}/foremen`),
      ]);
      if (foremenRes.ok) {
        const foremenJson = await foremenRes.json();
        const nextForemen = Array.isArray(foremenJson) ? foremenJson : foremenJson.data ?? foremenJson.foremen ?? [];
        setForemen(nextForemen);
        setForemanId((current) => current || nextForemen[0]?.id || "");
      }
      if (dispatchRes.ok) {
        const d = await dispatchRes.json();
        const dispatches = Array.isArray(d) ? d : d.data ?? d.dispatches ?? [];
        const todayDispatch = dispatches[0] ?? null;
        setDispatch(todayDispatch);
        if (todayDispatch?.foreman_id) setForemanId((current) => current || todayDispatch.foreman_id);
        if (todayDispatch?.status === "checked_in") {
          setCheckedIn(true);
          setStep("production");
        }
      }
    } catch {}
    setLoading(false);
  }, [companyId]);

  useEffect(() => { fetchDispatch(); }, [fetchDispatch]);

  useEffect(() => {
    if (!draftKey) return;
    const rawDraft = window.localStorage.getItem(draftKey);
    if (!rawDraft) return;
    try {
      const draft = JSON.parse(rawDraft) as {
        crewCount?: string;
        hoursWorked?: string;
        notes?: string;
      };
      if (draft.crewCount) setCrewCount(draft.crewCount);
      if (draft.hoursWorked) setHoursWorked(draft.hoursWorked);
      if (draft.notes) setNotes(draft.notes);
    } catch {
      window.localStorage.removeItem(draftKey);
    }
  }, [draftKey]);

  useEffect(() => {
    if (!draftKey || checkedIn) return;
    const hasDraft = crewCount || hoursWorked || notes;
    if (!hasDraft) return;
    const timer = window.setTimeout(() => {
      window.localStorage.setItem(
        draftKey,
        JSON.stringify({ crewCount, hoursWorked, notes })
      );
    }, 400);
    return () => window.clearTimeout(timer);
  }, [checkedIn, crewCount, draftKey, hoursWorked, notes]);

  const handleCheckIn = async () => {
    if (!crewCount) { setError("Crew count is required"); return; }
    if (!foremanId) { setError("Choose a foreman first"); return; }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/sub-ops/companies/${companyId}/checkins`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          foreman_id: foremanId,
          dispatch_id: dispatch?.id || null,
          checkin_date: new Date().toISOString().split("T")[0],
          crew_count: Number(crewCount),
          crew_hours: hoursWorked ? Number(hoursWorked) : null,
          notes: notes.trim() || null,
        }),
      });
      if (res.ok) {
        const checkin = await res.json();
        setCurrentCheckinId(checkin.id);
        if (sitePhoto) {
          const photoData = new FormData();
          photoData.append("file", sitePhoto);
          await fetch(`/api/sub-ops/companies/${companyId}/checkins/${checkin.id}/photo`, {
            method: "POST",
            body: photoData,
          });
        }
        setCheckedIn(true);
        if (draftKey) window.localStorage.removeItem(draftKey);
        setSuccessMessage("Office notified. Your crew count and huddle notes are saved to today's record.");
        setStep("production");
      } else {
        const d = await res.json().catch(() => ({}));
        setError(d.error || "Failed to check in");
      }
    } catch {
      setError("Network error");
    }
    setSubmitting(false);
  };

  const addEntry = () => {
    setEntries([...entries, { description: "", quantity: "", unit: "LF", photo: null, area: "" }]);
  };

  const updateEntry = (idx: number, field: keyof ProductionEntry, value: string | File | null) => {
    const updated = [...entries];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (updated[idx] as any)[field] = value;
    setEntries(updated);
  };

  const removeEntry = (idx: number) => {
    if (entries.length > 1) setEntries(entries.filter((_, i) => i !== idx));
  };

  const handleSubmitProduction = async () => {
    const validEntries = entries.filter((e) => e.description.trim());
    if (validEntries.length === 0) { setError("Add at least one production entry"); return; }
    if (!foremanId) { setError("Choose a foreman first"); return; }
    setSubmitting(true);
    setError("");
    try {
      for (const entry of validEntries) {
        const endpoint = currentCheckinId
          ? `/api/sub-ops/companies/${companyId}/checkins/${currentCheckinId}/production`
          : `/api/sub-ops/companies/${companyId}/production`;
        await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            foreman_id: foremanId,
            log_date: new Date().toISOString().split("T")[0],
            description: entry.description.trim(),
            quantity: entry.quantity ? Number(entry.quantity) : null,
            unit: entry.unit,
            area: entry.area.trim() || null,
          }),
        });
      }
      setEntries([{ description: "", quantity: "", unit: "LF", photo: null, area: "" }]);
      setSuccessMessage("Production saved. The office can see what was completed without chasing a text.");
      setStep("dispatch");
    } catch {
      setError("Failed to submit production data");
    }
    setSubmitting(false);
  };

  const handleSubmitBlocker = async () => {
    if (!blockerDescription.trim()) { setError("Description is required"); return; }
    if (!foremanId) { setError("Choose a foreman first"); return; }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/sub-ops/companies/${companyId}/blockers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          foreman_id: foremanId,
          dispatch_id: dispatch?.id || null,
          blocker_date: new Date().toISOString().split("T")[0],
          category: blockerCategory,
          description: blockerDescription.trim(),
          impact: blockerImpact.trim() || null,
        }),
      });
      if (res.ok) {
        const blocker = await res.json();
        if (blockerPhoto && blocker?.id) {
          const photoData = new FormData();
          photoData.append("file", blockerPhoto);
          await fetch(`/api/sub-ops/companies/${companyId}/blockers/${blocker.id}/photo`, {
            method: "POST",
            body: photoData,
          });
        }
        setBlockerDescription("");
        setBlockerImpact("");
        setBlockerPhoto(null);
        setSuccessMessage("Blocker reported. The issue is now visible to the office with a timestamp.");
        setStep(checkedIn ? "production" : "dispatch");
      } else {
        const d = await res.json().catch(() => ({}));
        setError(d.error || "Failed to report blocker");
      }
    } catch {
      setError("Network error");
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="w-6 h-6 border-2 border-[#F97316] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const UNITS = ["LF", "SF", "EA", "CY", "SY", "TON", "GAL", "HR"];

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#93C5FD]">60-second field update</p>
          <h2 className="mt-1 text-xl font-black text-[color:var(--text-primary)]">Field Check-In</h2>
          <p className="mt-1 text-sm text-[color:var(--text-secondary)]">
            Tell the office who is here, what changed, and what is blocking work.
          </p>
        </div>
        <button
          onClick={() => setStep("blocker")}
          className="flex min-h-[48px] items-center justify-center gap-2 rounded-lg bg-red-500/10 px-4 py-3 text-sm font-black text-red-300 transition-colors hover:bg-red-500/20"
        >
          <AlertTriangle size={16} /> Report Blocker
        </button>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        {[
          { icon: BellRing, label: "Office sees it", detail: "No extra call needed" },
          { icon: FileText, label: "Record is saved", detail: "Timestamped field truth" },
          { icon: Users, label: "Next crew benefits", detail: "Less starting from zero" },
        ].map((item) => {
          const ItemIcon = item.icon;
          return (
            <div key={item.label} className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-3">
              <div className="flex items-center gap-2 text-sm font-black text-[color:var(--text-primary)]">
                <ItemIcon size={15} className="text-[#F97316]" />
                {item.label}
              </div>
              <p className="mt-1 text-xs text-[color:var(--text-muted)]">{item.detail}</p>
            </div>
          );
        })}
      </div>

      {successMessage && (
        <div className="flex items-start gap-2 rounded-xl border border-[#22C55E]/25 bg-[#22C55E]/10 p-3 text-sm font-bold text-[#86EFAC]">
          <CheckCircle size={16} className="mt-0.5 shrink-0" />
          <span>{successMessage}</span>
          <button
            type="button"
            onClick={() => setSuccessMessage("")}
            className="ml-auto text-[#86EFAC]/70 transition-colors hover:text-[#86EFAC]"
            aria-label="Dismiss confirmation"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className="grid grid-cols-4 gap-2">
        {steps.map((item, index) => {
          const active = step === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setStep(item.id)}
              className={`rounded-lg border px-2 py-2 text-center transition-colors ${
                active
                  ? "border-[#3B82F6]/50 bg-[#3B82F6]/15 text-white"
                  : "border-[var(--border-primary)] bg-[var(--bg-secondary)] text-[color:var(--text-muted)]"
              }`}
            >
              <span className="block text-[10px] font-black uppercase tracking-[0.16em]">{index + 1}</span>
              <span className="block text-xs font-bold">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Dispatch Details ── */}
      {step === "dispatch" && (
        <>
          {dispatch ? (
            <div className="space-y-3">
              <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Send size={14} className="text-[#F97316]" />
                  <span className="text-sm font-bold text-[color:var(--text-primary)]">Today&apos;s Dispatch</span>
                </div>
                <p className="text-xs text-[color:var(--text-secondary)]">{dispatch.project_name}</p>

                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-[color:var(--text-muted)] font-medium">Scope:</span>
                    <p className="text-[color:var(--text-secondary)] mt-0.5 whitespace-pre-wrap">{dispatch.scope_of_work}</p>
                  </div>
                  {dispatch.priority_notes && (
                    <div>
                      <span className="text-orange-400 font-medium flex items-center gap-1"><AlertTriangle size={10} /> Priority:</span>
                      <p className="text-[color:var(--text-secondary)] mt-0.5">{dispatch.priority_notes}</p>
                    </div>
                  )}
                  {dispatch.safety_focus && (
                    <div>
                      <span className="text-green-400 font-medium flex items-center gap-1"><Shield size={10} /> Safety:</span>
                      <p className="text-[color:var(--text-secondary)] mt-0.5">{dispatch.safety_focus}</p>
                    </div>
                  )}
                  {dispatch.material_notes && (
                    <div>
                      <span className="text-blue-400 font-medium flex items-center gap-1"><Package size={10} /> Materials:</span>
                      <p className="text-[color:var(--text-secondary)] mt-0.5">{dispatch.material_notes}</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4 text-xs text-[color:var(--text-secondary)]">
                  {dispatch.expected_crew_size && <span>👷 {dispatch.expected_crew_size} crew</span>}
                  {dispatch.expected_hours && <span>⏱ {dispatch.expected_hours}h expected</span>}
                </div>
              </div>

              {!checkedIn && (
                <button
                  onClick={() => setStep("checkin")}
                  className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-lg bg-[#22C55E] px-4 py-3 text-base font-black text-[#052E16] transition-colors hover:bg-[#16A34A]"
                >
                  <CheckCircle size={16} /> Check In
                </button>
              )}
            </div>
          ) : (
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-6 text-center space-y-3">
              <Clock size={28} className="mx-auto text-gray-600" />
              <p className="text-sm text-[color:var(--text-secondary)]">No dispatch for today</p>
              <p className="text-xs text-[color:var(--text-muted)]">You can still check in manually and leave notes for the office.</p>
              <button
                onClick={() => setStep("checkin")}
                className="mx-auto flex min-h-[52px] items-center justify-center gap-2 rounded-lg bg-[#22C55E] px-5 py-3 text-sm font-black text-[#052E16] transition-colors hover:bg-[#16A34A]"
              >
                <CheckCircle size={16} /> Start Check-In
              </button>
            </div>
          )}
        </>
      )}

      {/* ── Check-In Form ── */}
      {step === "checkin" && (
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-4 md:p-6 space-y-4">
          <h3 className="text-base font-black text-[color:var(--text-primary)] flex items-center gap-2">
            <CheckCircle size={16} className="text-[#22C55E]" /> Who is here right now?
          </h3>

          {foremen.length > 1 && (
            <div>
              <label className="text-xs font-medium text-[color:var(--text-secondary)] mb-1.5 block">
                Foreman <span className="text-red-400">*</span>
              </label>
              <select
                value={foremanId}
                onChange={(e) => setForemanId(e.target.value)}
                className="w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg px-3 py-2.5 text-[color:var(--text-primary)] text-sm focus:outline-none focus:border-[#F97316]/50 appearance-none min-h-[44px]"
              >
                {foremen.map((foreman) => (
                  <option key={foreman.id} value={foreman.id}>{foreman.name}</option>
                ))}
              </select>
            </div>
          )}

          {foremen.length === 0 && (
            <div className="rounded-lg border border-[#EAB308]/25 bg-[#EAB308]/10 px-3 py-2 text-xs font-semibold text-[#FACC15]">
              Add a foreman before submitting field updates.
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {["2", "3", "4", "6"].map((count) => (
              <button
                key={count}
                onClick={() => setCrewCount(count)}
                className={`min-h-[52px] rounded-lg border text-lg font-black transition-colors ${
                  crewCount === count
                    ? "border-[#22C55E]/50 bg-[#22C55E]/15 text-[#86EFAC]"
                    : "border-[var(--border-primary)] bg-[var(--bg-primary)] text-[color:var(--text-secondary)]"
                }`}
              >
                {count}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-[color:var(--text-secondary)] mb-1.5 block">
                Crew Count <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={crewCount}
                onChange={(e) => setCrewCount(e.target.value)}
                placeholder="Other number"
                className="w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg px-3 py-2.5 text-[color:var(--text-primary)] text-sm focus:outline-none focus:border-[#F97316]/50 placeholder-gray-600 min-h-[44px]"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[color:var(--text-secondary)] mb-1.5 block">Hours Worked</label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={hoursWorked}
                onChange={(e) => setHoursWorked(e.target.value)}
                placeholder="e.g., 8"
                className="w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg px-3 py-2.5 text-[color:var(--text-primary)] text-sm focus:outline-none focus:border-[#F97316]/50 placeholder-gray-600 min-h-[44px]"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-[color:var(--text-secondary)] mb-1.5 block">Site Photo</label>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-3 py-2.5 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg text-sm text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] hover:border-[#F97316]/30 transition-colors w-full min-h-[44px]"
            >
              <Camera size={16} />
              {sitePhoto ? sitePhoto.name : "Capture or upload photo"}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => setSitePhoto(e.target.files?.[0] ?? null)}
              className="hidden"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-[color:var(--text-secondary)] mb-1.5 block">Huddle Notes</label>
            <div className="mb-2 flex flex-wrap gap-2">
              {noteChips.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => appendNote(chip)}
                  className="rounded-full border border-[var(--border-primary)] bg-[var(--bg-primary)] px-3 py-2 text-xs font-bold text-[color:var(--text-secondary)] transition-colors hover:border-[#F97316]/40 hover:text-[color:var(--text-primary)]"
                >
                  {chip}
                </button>
              ))}
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Materials, schedule, manpower, hurdles, handoff notes..."
              rows={3}
              className="w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg px-3 py-2.5 text-[color:var(--text-primary)] text-sm focus:outline-none focus:border-[#F97316]/50 placeholder-gray-600 resize-none"
            />
            {(crewCount || hoursWorked || notes) && (
              <p className="mt-1 text-[11px] font-medium text-[color:var(--text-muted)]">
                Draft saved on this device until check-in is submitted.
              </p>
            )}
          </div>

          {error && (
            <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</div>
          )}

          <button
            onClick={handleCheckIn}
            disabled={submitting}
            className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-lg bg-[#22C55E] px-4 py-3 text-base font-black text-[#052E16] transition-colors hover:bg-[#16A34A] disabled:opacity-50"
          >
            <CheckCircle size={16} />
            {submitting ? "Checking in..." : "Check In Crew"}
          </button>
        </div>
      )}

      {/* ── Production Log ── */}
      {step === "production" && (
        <div className="space-y-3">
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 flex items-center gap-2">
            <CheckCircle size={16} className="text-green-400" />
            <span className="text-sm text-green-300 font-bold">Checked in. Add production now, or come back later.</span>
          </div>

          {entries.map((entry, idx) => (
            <div key={idx} className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[color:var(--text-secondary)]">Entry #{idx + 1}</span>
                {entries.length > 1 && (
                  <button onClick={() => removeEntry(idx)} className="text-gray-600 hover:text-red-400">
                    <X size={18} />
                  </button>
                )}
              </div>
              <div>
                <label className="text-xs font-medium text-[color:var(--text-secondary)] mb-1 block">What did you install/complete?</label>
                <input
                  value={entry.description}
                  onChange={(e) => updateEntry(idx, "description", e.target.value)}
                  placeholder="e.g., Ran conduit on 3rd floor east wing"
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg px-3 py-2.5 text-[color:var(--text-primary)] text-sm focus:outline-none focus:border-[#F97316]/50 placeholder-gray-600 min-h-[44px]"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-[color:var(--text-secondary)] mb-1 block">Qty</label>
                  <input
                    type="number"
                    value={entry.quantity}
                    onChange={(e) => updateEntry(idx, "quantity", e.target.value)}
                    placeholder="45"
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg px-3 py-2.5 text-[color:var(--text-primary)] text-sm focus:outline-none focus:border-[#F97316]/50 placeholder-gray-600 min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-[color:var(--text-secondary)] mb-1 block">Unit</label>
                  <select
                    value={entry.unit}
                    onChange={(e) => updateEntry(idx, "unit", e.target.value)}
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg px-3 py-2.5 text-[color:var(--text-primary)] text-sm focus:outline-none focus:border-[#F97316]/50 appearance-none min-h-[44px]"
                  >
                    {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-[color:var(--text-secondary)] mb-1 block">Area</label>
                  <input
                    value={entry.area}
                    onChange={(e) => updateEntry(idx, "area", e.target.value)}
                    placeholder="3rd Floor"
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg px-3 py-2.5 text-[color:var(--text-primary)] text-sm focus:outline-none focus:border-[#F97316]/50 placeholder-gray-600 min-h-[44px]"
                  />
                </div>
              </div>
            </div>
          ))}

          <button
            onClick={addEntry}
            className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-lg bg-[var(--bg-tertiary)] px-3 py-2 text-sm font-bold text-[color:var(--text-secondary)] transition-colors hover:text-[color:var(--text-primary)]"
          >
            <Plus size={14} /> Add Another Entry
          </button>

          {error && (
            <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</div>
          )}

          <button
            onClick={handleSubmitProduction}
            disabled={submitting}
            className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-lg bg-[#F97316] px-4 py-3 text-base font-black text-white transition-colors hover:bg-[#ea6c0a] disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit Production"}
          </button>
        </div>
      )}

      {/* ── Blocker Form ── */}
      {step === "blocker" && (
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-4 md:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[color:var(--text-primary)] flex items-center gap-2">
              <AlertTriangle size={14} className="text-red-400" /> Report Blocker
            </h3>
            <button
              onClick={() => { setStep(checkedIn ? "production" : "dispatch"); setError(""); }}
              className="text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)]"
            >
              <X size={16} />
            </button>
          </div>

          <div>
            <label className="text-xs font-medium text-[color:var(--text-secondary)] mb-1.5 block">Category</label>
            <select
              value={blockerCategory}
              onChange={(e) => setBlockerCategory(e.target.value)}
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
            <label className="text-xs font-medium text-[color:var(--text-secondary)] mb-1.5 block">
              Description <span className="text-red-400">*</span>
            </label>
            <textarea
              value={blockerDescription}
              onChange={(e) => setBlockerDescription(e.target.value)}
              placeholder="What's the issue?"
              rows={3}
              className="w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg px-3 py-2.5 text-[color:var(--text-primary)] text-sm focus:outline-none focus:border-[#F97316]/50 placeholder-gray-600 resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-[color:var(--text-secondary)] mb-1.5 block">Impact</label>
            <textarea
              value={blockerImpact}
              onChange={(e) => setBlockerImpact(e.target.value)}
              placeholder="How does this affect work?"
              rows={2}
              className="w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg px-3 py-2.5 text-[color:var(--text-primary)] text-sm focus:outline-none focus:border-[#F97316]/50 placeholder-gray-600 resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-[color:var(--text-secondary)] mb-1.5 block">Photo</label>
            <button
              type="button"
              onClick={() => blockerPhotoInputRef.current?.click()}
              className="flex min-h-[44px] w-full items-center gap-2 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] px-3 py-2.5 text-sm text-[color:var(--text-secondary)] transition-colors hover:border-[#F97316]/40 hover:text-[color:var(--text-primary)]"
            >
              <Camera size={16} />
              {blockerPhoto ? blockerPhoto.name : "Capture or upload blocker photo"}
            </button>
            <input
              ref={blockerPhotoInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => setBlockerPhoto(e.target.files?.[0] ?? null)}
              className="hidden"
            />
          </div>

          {error && (
            <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</div>
          )}

          <button
            onClick={handleSubmitBlocker}
            disabled={submitting}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-[color:var(--text-primary)] rounded-lg text-sm font-bold transition-colors w-full min-h-[44px]"
          >
            <AlertTriangle size={16} />
            {submitting ? "Submitting..." : "Submit Blocker"}
          </button>
        </div>
      )}
    </div>
  );
}
