"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  CheckCircle, Camera, Plus, X, AlertTriangle, Send, Clock,
  Users, Shield, Package, FileText,
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

export default function CheckInView({ projectId }: Props) {
  const [dispatch, setDispatch] = useState<TodayDispatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<"dispatch" | "checkin" | "production" | "blocker">("dispatch");
  const [checkedIn, setCheckedIn] = useState(false);

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
  const companyId = typeof window !== "undefined" ? localStorage.getItem("sub_ops_company_id") : null;

  const fetchDispatch = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/sub-ops/companies/${companyId}/dispatches/today`);
      if (res.ok) {
        const d = await res.json();
        setDispatch(d);
        if (d?.status === "checked_in") {
          setCheckedIn(true);
          setStep("production");
        }
      }
    } catch {}
    setLoading(false);
  }, [companyId]);

  useEffect(() => { fetchDispatch(); }, [fetchDispatch]);

  const handleCheckIn = async () => {
    if (!crewCount) { setError("Crew count is required"); return; }
    setSubmitting(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("crew_count", crewCount);
      formData.append("hours_worked", hoursWorked || "0");
      formData.append("notes", notes);
      if (sitePhoto) formData.append("photo", sitePhoto);
      if (dispatch) formData.append("dispatch_id", dispatch.id);

      const res = await fetch(`/api/sub-ops/companies/${companyId}/checkins`, {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        setCheckedIn(true);
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
    setSubmitting(true);
    setError("");
    try {
      for (const entry of validEntries) {
        const formData = new FormData();
        formData.append("description", entry.description);
        formData.append("quantity", entry.quantity || "0");
        formData.append("unit", entry.unit);
        formData.append("area", entry.area);
        if (entry.photo) formData.append("photo", entry.photo);

        await fetch(`/api/sub-ops/companies/${companyId}/production`, {
          method: "POST",
          body: formData,
        });
      }
      setEntries([{ description: "", quantity: "", unit: "LF", photo: null, area: "" }]);
      setStep("dispatch");
    } catch {
      setError("Failed to submit production data");
    }
    setSubmitting(false);
  };

  const handleSubmitBlocker = async () => {
    if (!blockerDescription.trim()) { setError("Description is required"); return; }
    setSubmitting(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("category", blockerCategory);
      formData.append("description", blockerDescription);
      formData.append("impact", blockerImpact);
      if (blockerPhoto) formData.append("photo", blockerPhoto);

      const res = await fetch(`/api/sub-ops/companies/${companyId}/blockers`, {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        setBlockerDescription("");
        setBlockerImpact("");
        setBlockerPhoto(null);
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
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-[color:var(--text-primary)]">Field Check-In</h2>
        <button
          onClick={() => setStep("blocker")}
          className="flex items-center gap-1.5 px-3 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg text-xs font-semibold transition-colors min-h-[44px]"
        >
          <AlertTriangle size={14} /> Report Blocker
        </button>
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
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-[#F97316] hover:bg-[#ea6c0a] text-[color:var(--text-primary)] rounded-lg text-sm font-bold transition-colors w-full min-h-[44px]"
                >
                  <CheckCircle size={16} /> Check In
                </button>
              )}
            </div>
          ) : (
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-6 text-center space-y-3">
              <Clock size={28} className="mx-auto text-gray-600" />
              <p className="text-sm text-[color:var(--text-secondary)]">No dispatch for today</p>
              <p className="text-xs text-gray-600">You can still check in manually</p>
              <button
                onClick={() => setStep("checkin")}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#F97316] hover:bg-[#ea6c0a] text-[color:var(--text-primary)] rounded-lg text-xs font-semibold transition-colors min-h-[44px] mx-auto"
              >
                <CheckCircle size={14} /> Check In Anyway
              </button>
            </div>
          )}
        </>
      )}

      {/* ── Check-In Form ── */}
      {step === "checkin" && (
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-4 md:p-6 space-y-4">
          <h3 className="text-sm font-bold text-[color:var(--text-primary)] flex items-center gap-2">
            <CheckCircle size={14} className="text-[#F97316]" /> Check-In Form
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-[color:var(--text-secondary)] mb-1.5 block">
                Crew Count <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={crewCount}
                onChange={(e) => setCrewCount(e.target.value)}
                placeholder="e.g., 4"
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
            <label className="text-xs font-medium text-[color:var(--text-secondary)] mb-1.5 block">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any notes about today..."
              rows={3}
              className="w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg px-3 py-2.5 text-[color:var(--text-primary)] text-sm focus:outline-none focus:border-[#F97316]/50 placeholder-gray-600 resize-none"
            />
          </div>

          {error && (
            <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</div>
          )}

          <button
            onClick={handleCheckIn}
            disabled={submitting}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-[#F97316] hover:bg-[#ea6c0a] disabled:opacity-50 text-[color:var(--text-primary)] rounded-lg text-sm font-bold transition-colors w-full min-h-[44px]"
          >
            <CheckCircle size={16} />
            {submitting ? "Checking in..." : "Check In"}
          </button>
        </div>
      )}

      {/* ── Production Log ── */}
      {step === "production" && (
        <div className="space-y-3">
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 flex items-center gap-2">
            <CheckCircle size={16} className="text-green-400" />
            <span className="text-sm text-green-300 font-medium">Checked in! Log your production below.</span>
          </div>

          {entries.map((entry, idx) => (
            <div key={idx} className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[color:var(--text-secondary)]">Entry #{idx + 1}</span>
                {entries.length > 1 && (
                  <button onClick={() => removeEntry(idx)} className="text-gray-600 hover:text-red-400">
                    <X size={14} />
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
            className="flex items-center gap-1.5 px-3 py-2 bg-[var(--bg-tertiary)] text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] rounded-lg text-xs font-medium transition-colors w-full justify-center min-h-[44px]"
          >
            <Plus size={14} /> Add Another Entry
          </button>

          {error && (
            <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</div>
          )}

          <button
            onClick={handleSubmitProduction}
            disabled={submitting}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-[#F97316] hover:bg-[#ea6c0a] disabled:opacity-50 text-[color:var(--text-primary)] rounded-lg text-sm font-bold transition-colors w-full min-h-[44px]"
          >
            {submitting ? "Submitting..." : "Done"}
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
              <option value="labor">Labor</option>
              <option value="equipment">Equipment</option>
              <option value="weather">Weather</option>
              <option value="design">Design/RFI</option>
              <option value="access">Site Access</option>
              <option value="safety">Safety</option>
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
