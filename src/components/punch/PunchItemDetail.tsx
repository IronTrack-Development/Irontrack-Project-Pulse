"use client";

import { useState, useRef } from "react";
import { X, Camera, Trash2, Edit3, Loader2, CheckSquare, PlayCircle, Eye, AlertTriangle } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

const { t } = useTranslation();

interface Photo {
  id: string;
  storage_path: string;
  photo_type: string;
  caption?: string | null;
  uploaded_at: string;
}

interface Contact {
  id: string;
  name: string;
  company: string | null;
  role: string;
}

interface PunchItem {
  id: string;
  item_number: string;
  description: string;
  location?: string | null;
  building?: string | null;
  floor?: string | null;
  room?: string | null;
  trade?: string | null;
  priority: string;
  status: string;
  due_date?: string | null;
  closed_date?: string | null;
  notes?: string | null;
  assigned_contact?: Contact | null;
  punch_item_photos?: Photo[];
}

interface PunchItemDetailProps {
  item: PunchItem;
  projectId: string;
  supabaseUrl: string;
  onClose: () => void;
  onUpdated: () => void;
}

const PRIORITY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  life_safety: { label: t('ui.life.safety'), color: "#EF4444", bg: "bg-red-500/15" },
  code:        { label: t('ui.code'),        color: "#F97316", bg: "bg-orange-500/15" },
  standard:    { label: t('ui.standard'),    color: "#6B7280", bg: "bg-gray-500/15" },
  cosmetic:    { label: t('ui.cosmetic'),    color: "#3B82F6", bg: "bg-blue-500/15" },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  open:               { label: t('status.open'),               color: "#EF4444", bg: "bg-red-500/15" },
  in_progress:        { label: t('status.inProgress'),        color: "#EAB308", bg: "bg-yellow-500/15" },
  ready_for_reinspect:{ label: t('ui.ready.for.re.inspect'), color: "#A855F7", bg: "bg-purple-500/15" },
  closed:             { label: t('ui.closed'),             color: "#22C55E", bg: "bg-green-500/15" },
  disputed:           { label: t('ui.disputed'),           color: "#F97316", bg: "bg-orange-500/15" },
};

export default function PunchItemDetail({ item, projectId, supabaseUrl, onClose, onUpdated }: PunchItemDetailProps) {
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [notes, setNotes] = useState(item.notes || "");
  const [editingNotes, setEditingNotes] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const completionPhotoRef = useRef<HTMLInputElement>(null);

  const issuePhotos = (item.punch_item_photos || []).filter((p) => p.photo_type === "issue");
  const completedPhotos = (item.punch_item_photos || []).filter((p) => p.photo_type === "completed");

  const photoUrl = (path: string) =>
    `${supabaseUrl}/storage/v1/object/public/punch-photos/${path}`;

  const updateStatus = async (status: string) => {
    setSaving(true);
    try {
      await fetch(`/api/projects/${projectId}/punch-list/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      onUpdated();
    } finally {
      setSaving(false);
    }
  };

  const saveNotes = async () => {
    setSaving(true);
    try {
      await fetch(`/api/projects/${projectId}/punch-list/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      setEditingNotes(false);
      onUpdated();
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = async () => {
    if (!confirm(`Delete ${item.item_number}? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await fetch(`/api/projects/${projectId}/punch-list/${item.id}`, { method: "DELETE" });
      onClose();
      onUpdated();
    } finally {
      setDeleting(false);
    }
  };

  const addCompletionPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("photo_type", "completed");
      await fetch(`/api/projects/${projectId}/punch-list/${item.id}/photos`, {
        method: "POST",
        body: fd,
      });
      onUpdated();
    } finally {
      setUploadingPhoto(false);
      if (completionPhotoRef.current) completionPhotoRef.current.value = "";
    }
  };

  const deletePhoto = async (photoId: string) => {
    await fetch(`/api/projects/${projectId}/punch-list/${item.id}/photos?photoId=${photoId}`, {
      method: "DELETE",
    });
    onUpdated();
  };

  const priorityCfg = PRIORITY_CONFIG[item.priority] || PRIORITY_CONFIG.standard;
  const statusCfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.open;
  const isLifeSafety = item.priority === "life_safety";

  const locationParts = [item.building, item.floor && `Floor ${item.floor}`, item.room && `Rm ${item.room}`].filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full sm:max-w-lg bg-[var(--bg-secondary)] rounded-t-3xl sm:rounded-3xl border border-[var(--border-primary)] overflow-y-auto max-h-[95dvh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-[var(--border-primary)]">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-mono text-[color:var(--text-muted)] shrink-0">{item.item_number}</span>
            {isLifeSafety && <AlertTriangle size={14} className="text-red-400 animate-pulse shrink-0" />}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={deleteItem}
              disabled={deleting}
              className="p-2 rounded-xl text-gray-600 hover:text-red-400 min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors"
            >
              {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="px-5 pt-4 pb-6 space-y-4">
          {/* Description */}
          <p className="text-sm font-semibold text-[color:var(--text-primary)] leading-snug">{item.description}</p>

          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusCfg.bg}`} style={{ color: statusCfg.color }}>
              {statusCfg.label}
            </span>
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${priorityCfg.bg} ${isLifeSafety ? "animate-pulse" : ""}`} style={{ color: priorityCfg.color }}>
              {priorityCfg.label}
            </span>
            {item.trade && (
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-700/40 text-[color:var(--text-secondary)]">
                {item.trade}
              </span>
            )}
          </div>

          {/* Meta */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            {locationParts.length > 0 && (
              <div className="bg-[#0B0B0D] rounded-xl px-3 py-2.5">
                <p className="text-[color:var(--text-muted)] mb-0.5">{t('ui.location')}</p>
                <p className="text-[color:var(--text-primary)] font-medium">{locationParts.join(" · ")}</p>
              </div>
            )}
            {item.assigned_contact && (
              <div className="bg-[#0B0B0D] rounded-xl px-3 py-2.5">
                <p className="text-[color:var(--text-muted)] mb-0.5">{t('ui.assigned.to.d00c2e')}</p>
                <p className="text-[color:var(--text-primary)] font-medium truncate">{item.assigned_contact.name}</p>
                {item.assigned_contact.company && (
                  <p className="text-[color:var(--text-muted)] truncate">{item.assigned_contact.company}</p>
                )}
              </div>
            )}
            {item.due_date && (
              <div className="bg-[#0B0B0D] rounded-xl px-3 py-2.5">
                <p className="text-[color:var(--text-muted)] mb-0.5">{t('ui.due.date')}</p>
                <p className="text-[color:var(--text-primary)] font-medium">{new Date(item.due_date + t('ui.t12.00.00')).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
              </div>
            )}
            {item.closed_date && (
              <div className="bg-[#0B0B0D] rounded-xl px-3 py-2.5">
                <p className="text-[color:var(--text-muted)] mb-0.5">{t('ui.closed')}</p>
                <p className="text-green-400 font-medium">{new Date(item.closed_date + t('ui.t12.00.00')).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
              </div>
            )}
          </div>

          {/* Photos — issue + completed side by side */}
          {(issuePhotos.length > 0 || completedPhotos.length > 0) && (
            <div className="space-y-2">
              {issuePhotos.length > 0 && completedPhotos.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-[color:var(--text-muted)] mb-1.5 font-medium">{t('ui.issue')}</p>
                    <div className="grid gap-1.5">
                      {issuePhotos.map((photo) => (
                        <div key={photo.id} className="relative rounded-xl overflow-hidden aspect-video">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={photoUrl(photo.storage_path)} alt={t('ui.issue')} className="w-full h-full object-cover" loading="lazy" />
                          <button
                            onClick={() => deletePhoto(photo.id)}
                            className="absolute top-1 right-1 p-1 bg-black/60 rounded-full text-[color:var(--text-primary)]"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-[color:var(--text-muted)] mb-1.5 font-medium">{t('status.completed')}</p>
                    <div className="grid gap-1.5">
                      {completedPhotos.map((photo) => (
                        <div key={photo.id} className="relative rounded-xl overflow-hidden aspect-video">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={photoUrl(photo.storage_path)} alt={t('status.completed')} className="w-full h-full object-cover" loading="lazy" />
                          <button
                            onClick={() => deletePhoto(photo.id)}
                            className="absolute top-1 right-1 p-1 bg-black/60 rounded-full text-[color:var(--text-primary)]"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-xs text-[color:var(--text-muted)] mb-1.5 font-medium">{issuePhotos.length > 0 ? t('ui.issue.photos') : t('ui.completion.photos')}</p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[...issuePhotos, ...completedPhotos].map((photo) => (
                      <div key={photo.id} className="relative rounded-xl overflow-hidden aspect-square">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={photoUrl(photo.storage_path)} alt={t('ui.photo')} className="w-full h-full object-cover" loading="lazy" />
                        <button
                          onClick={() => deletePhoto(photo.id)}
                          className="absolute top-1 right-1 p-1 bg-black/60 rounded-full text-[color:var(--text-primary)]"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Add completion photo */}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            ref={completionPhotoRef}
            className="hidden"
            onChange={addCompletionPhoto}
          />
          <button
            onClick={() => completionPhotoRef.current?.click()}
            disabled={uploadingPhoto}
            className="w-full py-3 rounded-xl border border-dashed border-green-500/30 bg-green-500/5
              text-green-400 text-sm font-medium flex items-center justify-center gap-2
              hover:bg-green-500/10 hover:border-green-500/50 transition-all min-h-[44px]"
          >
            {uploadingPhoto ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
            {uploadingPhoto ? t('ui.uploading') : t('ui.add.completion.photo')}
          </button>

          {/* Notes */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs text-[color:var(--text-secondary)] font-medium">{t('ui.notes')}</label>
              {!editingNotes && (
                <button onClick={() => setEditingNotes(true)} className="p-1.5 text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)]">
                  <Edit3 size={12} />
                </button>
              )}
            </div>
            {editingNotes ? (
              <div className="space-y-2">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl px-3 py-2.5 text-sm text-[color:var(--text-primary)]
                    placeholder-gray-600 focus:outline-none focus:border-[#F97316]/50 resize-none"
                  placeholder={t('ui.add.notes')}
                />
                <div className="flex gap-2">
                  <button onClick={() => setEditingNotes(false)} className="flex-1 py-2 text-xs text-[color:var(--text-secondary)] rounded-lg bg-[#1F1F25]">{t('action.cancel')}</button>
                  <button onClick={saveNotes} disabled={saving} className="flex-1 py-2 text-xs text-[color:var(--text-primary)] rounded-lg bg-[#F97316]">
                    {saving ? t('ui.saving') : t('ui.save.notes')}
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-[color:var(--text-secondary)]">{notes || <span className="text-gray-600 italic">{t('ui.no.notes')}</span>}</p>
            )}
          </div>

          {/* Status action buttons */}
          <div className="border-t border-[#1F1F25] pt-4 space-y-2">
            <p className="text-xs text-[color:var(--text-muted)] font-medium mb-2">{t('ui.update.status')}</p>
            <div className="grid grid-cols-1 gap-2">
              {item.status === "open" && (
                <button
                  onClick={() => updateStatus("in_progress")}
                  disabled={saving}
                  className="w-full py-3.5 rounded-xl bg-yellow-500/15 text-yellow-400 font-semibold text-sm
                    hover:bg-yellow-500/25 transition-all min-h-[52px] flex items-center justify-center gap-2"
                >
                  <PlayCircle size={16} />{t('ui.start.work')}
                </button>
              )}
              {(item.status === "open" || item.status === "in_progress") && (
                <button
                  onClick={() => updateStatus("ready_for_reinspect")}
                  disabled={saving}
                  className="w-full py-3.5 rounded-xl bg-purple-500/15 text-purple-400 font-semibold text-sm
                    hover:bg-purple-500/25 transition-all min-h-[52px] flex items-center justify-center gap-2"
                >
                  <Eye size={16} />{t('ui.ready.for.re.inspect')}
                </button>
              )}
              {item.status !== "closed" && (
                <button
                  onClick={() => updateStatus("closed")}
                  disabled={saving}
                  className="w-full py-3.5 rounded-xl bg-green-500/15 text-green-400 font-bold text-sm
                    hover:bg-green-500/25 transition-all min-h-[52px] flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckSquare size={16} />}{t('ui.close.item')}
                </button>
              )}
              {item.status === "closed" && (
                <button
                  onClick={() => updateStatus("open")}
                  disabled={saving}
                  className="w-full py-3.5 rounded-xl bg-[#1F1F25] text-[color:var(--text-secondary)] font-medium text-sm
                    hover:bg-[#2a2a35] transition-all min-h-[52px]"
                >{t('ui.reopen.item')}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
