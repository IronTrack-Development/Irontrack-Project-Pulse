"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Camera, Pencil, X, Loader2 } from "lucide-react";
import PhotoMarkup from "@/components/markup/PhotoMarkup";
import VoiceTextArea from "@/components/daily-log/VoiceTextArea";
import { useTranslation } from "@/lib/i18n";

const { t } = useTranslation();

interface Contact {
  id: string;
  name: string;
  company: string | null;
  role: string;
}

interface PunchItemFormProps {
  projectId: string;
  contacts: Contact[];
  onSaved: (itemNumber: string, saveAndAdd: boolean) => void;
  onCancel: () => void;
}

const TRADES = [
  "General", "Concrete", "Masonry", "Structural Steel", "Carpentry", "Roofing",
  "Waterproofing", "Insulation", "Drywall", "Flooring", "Painting", "Specialties",
  "Plumbing", "HVAC", "Electrical", "Fire Protection", "Elevators", "Landscaping",
];

const PRIORITIES = [
  { value: "life_safety", label: t('ui.life.safety'), color: "bg-red-600 text-[color:var(--text-primary)]" },
  { value: "code", label: t('ui.code'), color: "bg-orange-500 text-[color:var(--text-primary)]" },
  { value: "standard", label: t('ui.standard'), color: "bg-gray-600 text-[color:var(--text-primary)]" },
  { value: "cosmetic", label: t('ui.cosmetic'), color: "bg-blue-500 text-[color:var(--text-primary)]" },
];

// Persistent last-used values across form resets (kept in module scope)
let _lastTrade = "";
let _lastAssignedTo = "";
let _lastBuilding = "";
let _lastFloor = "";

export default function PunchItemForm({ projectId, contacts, onSaved, onCancel }: PunchItemFormProps) {
  const [description, setDescription] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [showPhotoMarkup, setShowPhotoMarkup] = useState(false);
  const [building, setBuilding] = useState(_lastBuilding);
  const [floor, setFloor] = useState(_lastFloor);
  const [room, setRoom] = useState("");
  const [trade, setTrade] = useState(_lastTrade);
  const [assignedTo, setAssignedTo] = useState(_lastAssignedTo);
  const [priority, setPriority] = useState("standard");
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Reset form for "Save & Add Another" — keep sticky fields
  const resetForNext = useCallback(() => {
    setDescription("");
    setPhotoFile(null);
    setPhotoPreview(null);
    setRoom("");
    setPriority("standard");
    setDueDate("");
    setError(null);
    // Keep: building, floor, trade, assignedTo
  }, []);

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const url = URL.createObjectURL(file);
    setPhotoPreview(url);
  };

  const handleSave = async (saveAndAdd: boolean) => {
    if (!description.trim()) { setError(t('ui.description.is.required')); return; }
    setSaving(true);
    setError(null);

    try {
      // Persist sticky values
      _lastTrade = trade;
      _lastAssignedTo = assignedTo;
      _lastBuilding = building;
      _lastFloor = floor;

      const res = await fetch(`/api/projects/${projectId}/punch-list`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: description.trim(),
          building: building || null,
          floor: floor || null,
          room: room || null,
          trade: trade || null,
          assigned_to: assignedTo || null,
          priority,
          due_date: dueDate || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save");
      }

      const item = await res.json();

      // Upload photo if attached
      if (photoFile) {
        const fd = new FormData();
        fd.append("file", photoFile);
        fd.append("photo_type", "issue");
        await fetch(`/api/projects/${projectId}/punch-list/${item.id}/photos`, {
          method: "POST",
          body: fd,
        });
      }

      if (saveAndAdd) {
        resetForNext();
        onSaved(item.item_number, true);
      } else {
        onSaved(item.item_number, false);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  };

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => { if (photoPreview) URL.revokeObjectURL(photoPreview); };
  }, [photoPreview]);

  return (
    <>
    <div className="fixed inset-0 z-50 bg-black/80 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full sm:max-w-lg bg-[#121217] rounded-t-3xl sm:rounded-3xl border border-[#1F1F25] overflow-y-auto max-h-[95dvh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-[#1F1F25]">
          <h2 className="text-base font-bold text-[color:var(--text-primary)]">{t('ui.add.punch.item')}</h2>
          <button
            onClick={onCancel}
            className="p-2 rounded-xl text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-5 pt-4 pb-6 space-y-4">
          {/* Photo first — biggest element */}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            ref={fileRef}
            className="hidden"
            onChange={handlePhoto}
          />
          {photoPreview ? (
            <div className="relative rounded-2xl overflow-hidden aspect-video w-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photoPreview} alt={t('ui.issue.photo')} className="w-full h-full object-cover" />
              {/* Markup button */}
              <button
                onClick={() => setShowPhotoMarkup(true)}
                className="absolute top-2 left-2 p-2 bg-black/60 hover:bg-purple-600/80 rounded-full text-[color:var(--text-primary)] transition-colors"
                title={t('ui.annotate.photo')}
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={() => { setPhotoFile(null); setPhotoPreview(null); if (fileRef.current) fileRef.current.value = ""; }}
                className="absolute top-2 right-2 p-2 bg-black/60 rounded-full text-[color:var(--text-primary)]"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full h-24 rounded-2xl border-2 border-dashed border-[#F97316]/40 bg-[#F97316]/5
                flex flex-col items-center justify-center gap-2 text-[#F97316] hover:border-[#F97316]/70
                hover:bg-[#F97316]/10 transition-all min-h-[96px] active:scale-[0.98]"
            >
              <Camera size={28} />
              <span className="text-sm font-semibold">{t('ui.take.photo')}</span>
            </button>
          )}

          {/* Description */}
          <div>
            <label className="text-xs text-[color:var(--text-secondary)] mb-1.5 block font-medium">{t('ui.description')}</label>
            <VoiceTextArea
              value={description}
              onChange={setDescription}
              placeholder={t('ui.describe.the.deficiency')}
              rows={2}
            />
          </div>

          {/* Location: Building / Floor / Room */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs text-[color:var(--text-secondary)] mb-1 block">{t('ui.building')}</label>
              <input
                value={building}
                onChange={(e) => setBuilding(e.target.value)}
                placeholder="A"
                className="w-full bg-[#0B0B0D] border border-[#1F1F25] rounded-xl px-3 py-3 text-sm text-[color:var(--text-primary)] placeholder-gray-600 focus:outline-none focus:border-[#F97316]/50 min-h-[44px]"
              />
            </div>
            <div>
              <label className="text-xs text-[color:var(--text-secondary)] mb-1 block">{t('ui.floor')}</label>
              <input
                value={floor}
                onChange={(e) => setFloor(e.target.value)}
                placeholder="3"
                className="w-full bg-[#0B0B0D] border border-[#1F1F25] rounded-xl px-3 py-3 text-sm text-[color:var(--text-primary)] placeholder-gray-600 focus:outline-none focus:border-[#F97316]/50 min-h-[44px]"
              />
            </div>
            <div>
              <label className="text-xs text-[color:var(--text-secondary)] mb-1 block">{t('ui.room')}</label>
              <input
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                placeholder="301"
                className="w-full bg-[#0B0B0D] border border-[#1F1F25] rounded-xl px-3 py-3 text-sm text-[color:var(--text-primary)] placeholder-gray-600 focus:outline-none focus:border-[#F97316]/50 min-h-[44px]"
              />
            </div>
          </div>

          {/* Trade */}
          <div>
            <label className="text-xs text-[color:var(--text-secondary)] mb-1.5 block font-medium">{t('ui.trade')}</label>
            <select
              value={trade}
              onChange={(e) => setTrade(e.target.value)}
              className="w-full bg-[#0B0B0D] border border-[#1F1F25] rounded-xl px-3 py-3 text-sm text-[color:var(--text-primary)] focus:outline-none focus:border-[#F97316]/50 min-h-[44px] appearance-none"
            >
              <option value="">{t('ui.select.trade')}</option>
              {TRADES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Assigned To */}
          <div>
            <label className="text-xs text-[color:var(--text-secondary)] mb-1.5 block font-medium">{t('ui.assign.to')}</label>
            <select
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className="w-full bg-[#0B0B0D] border border-[#1F1F25] rounded-xl px-3 py-3 text-sm text-[color:var(--text-primary)] focus:outline-none focus:border-[#F97316]/50 min-h-[44px] appearance-none"
            >
              <option value="">{t('ui.unassigned')}</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>{c.name}{c.company ? ` — ${c.company}` : ""}</option>
              ))}
            </select>
          </div>

          {/* Priority chips */}
          <div>
            <label className="text-xs text-[color:var(--text-secondary)] mb-1.5 block font-medium">{t('ui.priority')}</label>
            <div className="flex gap-2 flex-wrap">
              {PRIORITIES.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPriority(p.value)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all min-h-[40px] border-2 ${
                    priority === p.value
                      ? `${p.color} border-transparent`
                      : "bg-transparent text-[color:var(--text-secondary)] border-[#1F1F25] hover:border-gray-500"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Due date */}
          <div>
            <label className="text-xs text-[color:var(--text-secondary)] mb-1.5 block font-medium">{t('ui.due.date.optional')}</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full bg-[#0B0B0D] border border-[#1F1F25] rounded-xl px-3 py-3 text-sm text-[color:var(--text-primary)] focus:outline-none focus:border-[#F97316]/50 min-h-[44px] [color-scheme:dark]"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 rounded-xl px-3 py-2">{error}</p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={() => handleSave(false)}
              disabled={saving}
              className="flex-1 py-3.5 rounded-xl bg-[#1F1F25] text-[color:var(--text-primary)] text-sm font-semibold
                hover:bg-[#2a2a35] transition-all min-h-[52px] disabled:opacity-50"
            >
              {saving ? <Loader2 size={16} className="animate-spin mx-auto" /> : t('action.save')}
            </button>
            <button
              onClick={() => handleSave(true)}
              disabled={saving}
              className="flex-[2] py-3.5 rounded-xl bg-[#F97316] text-[color:var(--text-primary)] text-sm font-bold
                hover:bg-[#ea6c10] transition-all min-h-[52px] disabled:opacity-50 active:scale-[0.98]"
            >
              {saving ? <Loader2 size={16} className="animate-spin mx-auto" /> : t('ui.save.and.add.another')}
            </button>
          </div>
        </div>
      </div>
    </div>

    {/* Photo markup overlay */}
    {showPhotoMarkup && photoPreview && (
      <PhotoMarkup
        imageUrl={photoPreview}
        onSave={(annotatedUrl) => {
          setPhotoPreview(annotatedUrl);
          // Convert data URL back to a File for upload
          fetch(annotatedUrl)
            .then((r) => r.blob())
            .then((blob) => {
              const f = new File([blob], "punch-photo-markup.jpg", { type: "image/jpeg" });
              setPhotoFile(f);
            })
            .catch(() => {});
          setShowPhotoMarkup(false);
        }}
        onClose={() => setShowPhotoMarkup(false)}
      />
    )}
    </>
  );
}
