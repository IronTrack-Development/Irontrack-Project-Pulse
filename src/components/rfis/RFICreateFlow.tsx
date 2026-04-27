"use client";

import { useState, useCallback } from "react";
import {
  Sparkles, ArrowLeft, ArrowRight, Check, AlertTriangle,
  Clock, DollarSign, Calendar, User, X, Loader2,
} from "lucide-react";
import VoiceTextArea from "@/components/daily-log/VoiceTextArea";
import RFIPhotoCapture, { type RFIPhoto } from "@/components/rfis/RFIPhotoCapture";

interface Contact {
  id: string;
  name: string;
  company: string;
  role: string;
}

interface RFICreateFlowProps {
  projectId: string;
  contacts: Contact[];
  onCreated: () => void;
  onCancel: () => void;
}

interface DraftFields {
  subject: string;
  question: string;
  spec_section: string;
  drawing_reference: string;
  priority: "critical" | "high" | "normal" | "low";
  cost_impact: boolean;
  schedule_impact: boolean;
  due_date: string;
  assigned_to: string;
}

export default function RFICreateFlow({ projectId, contacts, onCreated, onCancel }: RFICreateFlowProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [roughDescription, setRoughDescription] = useState("");
  const [photos, setPhotos] = useState<RFIPhoto[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [draft, setDraft] = useState<DraftFields>({
    subject: "",
    question: "",
    spec_section: "",
    drawing_reference: "",
    priority: "normal",
    cost_impact: false,
    schedule_impact: false,
    due_date: "",
    assigned_to: "",
  });

  const handleAIDraft = useCallback(async () => {
    if (!roughDescription.trim()) return;
    setIsGenerating(true);
    setGenerateError("");

    try {
      const res = await fetch(`/api/projects/${projectId}/rfis/ai-draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rough_description: roughDescription }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "AI draft failed");
      }

      const result = await res.json();
      setDraft((prev) => ({
        ...prev,
        subject: result.subject || "",
        question: result.question || "",
        spec_section: result.spec_section || "",
        cost_impact: result.cost_impact || false,
        schedule_impact: result.schedule_impact || false,
      }));
      setStep(2);
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : "AI draft failed. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }, [roughDescription, projectId]);

  const handleSkipAI = () => {
    setDraft((prev) => ({ ...prev, subject: "", question: roughDescription }));
    setStep(2);
  };

  const handleSave = async (status: "draft" | "submitted") => {
    if (!draft.subject.trim() || !draft.question.trim()) return;
    setIsSaving(true);

    try {
      const res = await fetch(`/api/projects/${projectId}/rfis`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...draft,
          status,
          assigned_to: draft.assigned_to || null,
          ai_drafted: true,
        }),
      });

      if (!res.ok) throw new Error("Failed to save RFI");
      const rfi = await res.json();

      // Upload photos if any
      for (const photo of photos) {
        const fd = new FormData();
        fd.append("file", photo.file);
        if (photo.caption) fd.append("caption", photo.caption);
        await fetch(`/api/projects/${projectId}/rfis/${rfi.id}/photos`, {
          method: "POST",
          body: fd,
        });
      }

      onCreated();
    } catch {
      setIsSaving(false);
    }
  };

  const priorityOptions: { value: DraftFields["priority"]; label: string; color: string }[] = [
    { value: "critical", label: "Critical", color: "#EF4444" },
    { value: "high", label: "High", color: "#F97316" },
    { value: "normal", label: "Normal", color: "#3B82F6" },
    { value: "low", label: "Low", color: "#6B7280" },
  ];

  const architectContacts = contacts.filter(
    (c) =>
      c.role?.toLowerCase().includes("architect") ||
      c.role?.toLowerCase().includes("engineer") ||
      c.role?.toLowerCase().includes("designer")
  );
  const allContacts = architectContacts.length > 0 ? architectContacts : contacts;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-end md:items-center justify-center">
      <div className="w-full max-w-xl bg-[#121217] rounded-t-3xl md:rounded-3xl border border-[#1F1F25] max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-[#121217] px-5 py-4 border-b border-[#1F1F25] flex items-center justify-between rounded-t-3xl md:rounded-t-3xl z-10">
          <div className="flex items-center gap-3">
            {step > 1 && (
              <button onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)} className="p-2 rounded-lg hover:bg-[#1F1F25] text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center">
                <ArrowLeft size={16} />
              </button>
            )}
            <div>
              <h2 className="text-sm font-semibold text-[color:var(--text-primary)]">
                {step === 1 && "New RFI — What's the issue?"}
                {step === 2 && "Review AI Draft"}
                {step === 3 && "Confirm & Submit"}
              </h2>
              <p className="text-xs text-[color:var(--text-muted)]">Step {step} of 3</p>
            </div>
          </div>
          <button onClick={onCancel} className="p-2 rounded-lg hover:bg-[#1F1F25] text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)] transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center">
            <X size={16} />
          </button>
        </div>

        {/* Step indicators */}
        <div className="px-5 pt-4 flex gap-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`flex-1 h-1 rounded-full transition-all ${s <= step ? "bg-[#F97316]" : "bg-[#1F1F25]"}`} />
          ))}
        </div>

        <div className="px-5 py-5 space-y-5">
          {/* ─── STEP 1: Describe the issue ─── */}
          {step === 1 && (
            <>
              <VoiceTextArea
                value={roughDescription}
                onChange={setRoughDescription}
                placeholder="Describe what you're seeing in the field... 'the plans show 4 inch slab but geotech says 6 inch'"
                label="Describe the issue"
                rows={5}
              />

              <RFIPhotoCapture photos={photos} onChange={setPhotos} compact />

              {generateError && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  <AlertTriangle size={14} />
                  {generateError}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleAIDraft}
                  disabled={!roughDescription.trim() || isGenerating}
                  className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl
                    bg-[#F97316] hover:bg-[#ea6c10] text-[color:var(--text-primary)] font-bold text-sm
                    disabled:opacity-50 disabled:cursor-not-allowed transition-all min-h-[56px]"
                >
                  {isGenerating ? (
                    <><Loader2 size={16} className="animate-spin" /> Drafting...</>
                  ) : (
                    <><Sparkles size={16} /> AI Draft</>
                  )}
                </button>
                <button
                  onClick={handleSkipAI}
                  disabled={!roughDescription.trim()}
                  className="px-4 py-4 rounded-2xl bg-[#1F1F25] text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]
                    text-sm font-medium disabled:opacity-50 transition-all min-h-[56px]"
                >
                  Manual
                </button>
              </div>
            </>
          )}

          {/* ─── STEP 2: Edit AI Draft ─── */}
          {step === 2 && (
            <>
              {/* Subject */}
              <div>
                <label className="block text-xs font-medium text-[color:var(--text-secondary)] mb-1.5">Subject *</label>
                <input
                  type="text"
                  value={draft.subject}
                  onChange={(e) => setDraft((p) => ({ ...p, subject: e.target.value }))}
                  className="w-full bg-[#0B0B0D] border border-[#1F1F25] rounded-xl px-4 py-3 text-sm text-[color:var(--text-primary)]
                    placeholder-gray-600 focus:outline-none focus:border-[#F97316]/50 min-h-[44px]"
                  placeholder="RFI subject"
                />
              </div>

              {/* Question */}
              <div>
                <label className="block text-xs font-medium text-[color:var(--text-secondary)] mb-1.5">Question *</label>
                <textarea
                  value={draft.question}
                  onChange={(e) => setDraft((p) => ({ ...p, question: e.target.value }))}
                  rows={5}
                  className="w-full bg-[#0B0B0D] border border-[#1F1F25] rounded-xl px-4 py-3 text-sm text-[color:var(--text-primary)]
                    placeholder-gray-600 resize-none focus:outline-none focus:border-[#F97316]/50"
                  placeholder="Formal question text"
                />
              </div>

              {/* Spec Section + Drawing Reference */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[color:var(--text-secondary)] mb-1.5">Spec Section</label>
                  <input
                    type="text"
                    value={draft.spec_section}
                    onChange={(e) => setDraft((p) => ({ ...p, spec_section: e.target.value }))}
                    className="w-full bg-[#0B0B0D] border border-[#1F1F25] rounded-xl px-3 py-2.5 text-sm text-[color:var(--text-primary)]
                      placeholder-gray-600 focus:outline-none focus:border-[#F97316]/50 min-h-[44px]"
                    placeholder="03 30 00"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[color:var(--text-secondary)] mb-1.5">Drawing Ref</label>
                  <input
                    type="text"
                    value={draft.drawing_reference}
                    onChange={(e) => setDraft((p) => ({ ...p, drawing_reference: e.target.value }))}
                    className="w-full bg-[#0B0B0D] border border-[#1F1F25] rounded-xl px-3 py-2.5 text-sm text-[color:var(--text-primary)]
                      placeholder-gray-600 focus:outline-none focus:border-[#F97316]/50 min-h-[44px]"
                    placeholder="Sheet S-1"
                  />
                </div>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-xs font-medium text-[color:var(--text-secondary)] mb-2">Priority</label>
                <div className="flex gap-2">
                  {priorityOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setDraft((p) => ({ ...p, priority: opt.value }))}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-medium border transition-all min-h-[44px] ${
                        draft.priority === opt.value
                          ? "border-current text-[color:var(--text-primary)]"
                          : "border-[#1F1F25] text-[color:var(--text-muted)] hover:border-gray-600"
                      }`}
                      style={draft.priority === opt.value ? { color: opt.color, borderColor: opt.color, backgroundColor: `${opt.color}15` } : {}}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cost / Schedule Impact */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setDraft((p) => ({ ...p, cost_impact: !p.cost_impact }))}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium border transition-all min-h-[44px] ${
                    draft.cost_impact
                      ? "bg-yellow-500/15 border-yellow-500/40 text-yellow-400"
                      : "bg-[#1F1F25] border-[#1F1F25] text-[color:var(--text-muted)]"
                  }`}
                >
                  <DollarSign size={14} />
                  Cost Impact
                </button>
                <button
                  type="button"
                  onClick={() => setDraft((p) => ({ ...p, schedule_impact: !p.schedule_impact }))}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium border transition-all min-h-[44px] ${
                    draft.schedule_impact
                      ? "bg-red-500/15 border-red-500/40 text-red-400"
                      : "bg-[#1F1F25] border-[#1F1F25] text-[color:var(--text-muted)]"
                  }`}
                >
                  <Clock size={14} />
                  Schedule Impact
                </button>
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-xs font-medium text-[color:var(--text-secondary)] mb-1.5">
                  <Calendar size={12} className="inline mr-1" />
                  Due Date
                </label>
                <input
                  type="date"
                  value={draft.due_date}
                  onChange={(e) => setDraft((p) => ({ ...p, due_date: e.target.value }))}
                  className="w-full bg-[#0B0B0D] border border-[#1F1F25] rounded-xl px-4 py-3 text-sm text-[color:var(--text-primary)]
                    focus:outline-none focus:border-[#F97316]/50 min-h-[44px]"
                />
              </div>

              {/* Assigned To */}
              {allContacts.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-[color:var(--text-secondary)] mb-1.5">
                    <User size={12} className="inline mr-1" />
                    Assigned To (Architect / Engineer)
                  </label>
                  <select
                    value={draft.assigned_to}
                    onChange={(e) => setDraft((p) => ({ ...p, assigned_to: e.target.value }))}
                    className="w-full bg-[#0B0B0D] border border-[#1F1F25] rounded-xl px-4 py-3 text-sm text-[color:var(--text-primary)]
                      focus:outline-none focus:border-[#F97316]/50 min-h-[44px]"
                  >
                    <option value="">Select contact...</option>
                    {allContacts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} — {c.company || c.role}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <button
                onClick={() => setStep(3)}
                disabled={!draft.subject.trim() || !draft.question.trim()}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl
                  bg-[#F97316] hover:bg-[#ea6c10] text-[color:var(--text-primary)] font-bold text-sm
                  disabled:opacity-50 disabled:cursor-not-allowed transition-all min-h-[56px]"
              >
                Review RFI <ArrowRight size={16} />
              </button>
            </>
          )}

          {/* ─── STEP 3: Review & Submit ─── */}
          {step === 3 && (
            <>
              <div className="bg-[#0B0B0D] border border-[#1F1F25] rounded-2xl p-4 space-y-4">
                <div>
                  <p className="text-xs text-[color:var(--text-muted)] mb-1">Subject</p>
                  <p className="text-sm font-semibold text-[color:var(--text-primary)]">{draft.subject}</p>
                </div>
                <div>
                  <p className="text-xs text-[color:var(--text-muted)] mb-1">Question</p>
                  <p className="text-sm text-[color:var(--text-secondary)] leading-relaxed">{draft.question}</p>
                </div>
                {draft.spec_section && (
                  <div>
                    <p className="text-xs text-[color:var(--text-muted)] mb-1">Spec Section</p>
                    <p className="text-sm text-[color:var(--text-secondary)]">{draft.spec_section}</p>
                  </div>
                )}
                {draft.drawing_reference && (
                  <div>
                    <p className="text-xs text-[color:var(--text-muted)] mb-1">Drawing Reference</p>
                    <p className="text-sm text-[color:var(--text-secondary)]">{draft.drawing_reference}</p>
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    draft.priority === "critical" ? "bg-red-500/20 text-red-400" :
                    draft.priority === "high" ? "bg-orange-500/20 text-orange-400" :
                    draft.priority === "normal" ? "bg-blue-500/20 text-blue-400" :
                    "bg-gray-700 text-[color:var(--text-secondary)]"
                  }`}>
                    {draft.priority.charAt(0).toUpperCase() + draft.priority.slice(1)} Priority
                  </span>
                  {draft.cost_impact && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400">
                      💰 Cost Impact
                    </span>
                  )}
                  {draft.schedule_impact && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400">
                      ⏱ Schedule Impact
                    </span>
                  )}
                </div>
                {photos.length > 0 && (
                  <div>
                    <p className="text-xs text-[color:var(--text-muted)] mb-2">{photos.length} photo{photos.length !== 1 ? "s" : ""} attached</p>
                    <div className="flex gap-1.5">
                      {photos.slice(0, 4).map((p) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={p.id} src={p.localUrl} alt="" className="w-10 h-10 rounded-lg object-cover" />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => handleSave("draft")}
                  disabled={isSaving}
                  className="flex-1 py-4 rounded-2xl bg-[#1F1F25] text-[color:var(--text-secondary)] font-semibold text-sm
                    hover:bg-[#2a2a35] disabled:opacity-50 transition-all min-h-[56px]"
                >
                  {isSaving ? "Saving..." : "Save as Draft"}
                </button>
                <button
                  onClick={() => handleSave("submitted")}
                  disabled={isSaving}
                  className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl
                    bg-[#F97316] hover:bg-[#ea6c10] text-[color:var(--text-primary)] font-bold text-sm
                    disabled:opacity-50 transition-all min-h-[56px]"
                >
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  Submit RFI
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
