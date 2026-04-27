"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import {
  Camera, Pencil, X, Tag, Image as ImageIcon,
  Thermometer, Users, TrendingUp, AlertTriangle, ImagePlus,
  CheckCircle2, AlertCircle,
} from "lucide-react";
import PhotoMarkup from "@/components/markup/PhotoMarkup";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n";

const { t } = useTranslation();
import type {
  DailyLogPhoto, DailyLogWeather, DailyLogCrewEntry,
  DailyLogProgress, DelayCode, ParsedActivity,
} from "@/types";

interface PhotosSubmitScreenProps {
  photos: (DailyLogPhoto & { localUrl?: string; file?: File })[];
  onPhotosChange: (photos: (DailyLogPhoto & { localUrl?: string; file?: File })[]) => void;
  activities: ParsedActivity[];
  // Summary data
  weather: DailyLogWeather;
  crew: DailyLogCrewEntry[];
  progress: DailyLogProgress[];
  delayCodes: DelayCode[];
  onSubmit: () => Promise<boolean>;
  isSubmitting: boolean;
  logStatus: string;
  projectId: string;
  logDate: string;
}

export default function PhotosSubmitScreen({
  photos,
  onPhotosChange,
  activities,
  weather,
  crew,
  progress,
  delayCodes,
  onSubmit,
  isSubmitting,
  logStatus,
  projectId,
  logDate,
}: PhotosSubmitScreenProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [markupPhotoId, setMarkupPhotoId] = useState<string | null>(null);
  const router = useRouter();

  const totalHeadcount = crew.reduce((sum, c) => sum + (c.headcount || 0), 0);
  const totalCrewHours = crew.reduce((sum, c) => sum + ((c.headcount || 0) * (c.hours || 0)), 0);
  const activitiesAdvanced = progress.filter(
    (p) => (p.pct_complete_after || 0) > (p.pct_complete_before || 0)
  ).length;

  // Format the log date for display
  const formattedDate = (() => {
    try {
      return new Date(logDate + "T12:00:00").toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
      });
    } catch {
      return logDate;
    }
  })();

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;

      const newPhotos: (DailyLogPhoto & { localUrl?: string; file?: File })[] = [];

      Array.from(files).forEach((file) => {
        const localUrl = URL.createObjectURL(file);
        newPhotos.push({
          id: crypto.randomUUID(),
          daily_log_id: "",
          storage_path: "",
          uploaded_at: new Date().toISOString(),
          localUrl,
          file,
          activity_id: selectedTag || undefined,
        });
      });

      onPhotosChange([...photos, ...newPhotos]);
    },
    [photos, onPhotosChange, selectedTag]
  );

  const removePhoto = (photoId: string) => {
    const photo = photos.find((p) => p.id === photoId);
    if (photo?.localUrl) URL.revokeObjectURL(photo.localUrl);
    onPhotosChange(photos.filter((p) => p.id !== photoId));
  };

  const getActivityName = (activityId?: string) => {
    if (!activityId) return null;
    return activities.find((a) => a.id === activityId)?.activity_name || null;
  };

  const handleComplete = async () => {
    const success = await onSubmit();
    if (success) {
      setToast({ type: "success", message: `✅ Log saved for ${formattedDate}` });
      // Auto-redirect after 1.5 seconds
      setTimeout(() => {
        router.push(`/projects/${projectId}`);
      }, 1500);
    } else {
      setToast({ type: "error", message: t('ui.failed.to.save.log.please.try.again') });
      // Clear error toast after 4 seconds
      setTimeout(() => setToast(null), 4000);
    }
  };

  return (
    <>
    <div className="space-y-6 relative">
      {/* Toast notification */}
      {toast && (
        <div
          className={`fixed top-4 left-4 right-4 z-50 max-w-2xl mx-auto p-4 rounded-2xl
            flex items-center gap-3 shadow-lg transition-all animate-in fade-in slide-in-from-top-2
            ${toast.type === "success"
              ? "bg-[#22C55E]/15 border border-[#22C55E]/40 text-[#22C55E]"
              : "bg-[#EF4444]/15 border border-[#EF4444]/40 text-[#EF4444]"
            }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 size={20} />
          ) : (
            <AlertCircle size={20} />
          )}
          <span className="text-sm font-medium flex-1">{toast.message}</span>
          {toast.type === "success" && (
            <button
              onClick={() => router.push(`/projects/${projectId}`)}
              className="text-xs underline underline-offset-2 hover:no-underline whitespace-nowrap"
            >{t('ui.view.log')}
            </button>
          )}
        </div>
      )}

      {/* Camera / Photo Capture — BIG prominent button */}
      <div>
        <h3 className="text-sm font-semibold text-[color:var(--text-primary)] mb-3 flex items-center gap-2">
          <Camera size={16} className="text-[#F97316]" />{t('ui.photos')}
        </h3>

        {/* Quick tag selector */}
        {activities.length > 0 && (
          <div className="mb-3">
            <label className="text-xs text-[color:var(--text-muted)] mb-1.5 block">{t('ui.auto.tag.photos.to.activity')}</label>
            <select
              value={selectedTag || ""}
              onChange={(e) => setSelectedTag(e.target.value || null)}
              className="w-full bg-[#0B0B0D] border border-[#1F1F25] rounded-xl px-3 py-2.5 text-sm text-[color:var(--text-primary)]
                focus:outline-none focus:border-[#F97316]/50 min-h-[44px]"
            >
              <option value="">{t('ui.no.tag.general')}</option>
              {activities
                .filter((a) => a.status === "in_progress" || a.status === "not_started")
                .map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.activity_name}
                  </option>
                ))}
            </select>
          </div>
        )}

        {/* Camera + Gallery buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-2 py-6 rounded-2xl
              bg-[#F97316]/10 border-2 border-dashed border-[#F97316]/40
              text-[#F97316] hover:bg-[#F97316]/15 active:scale-[0.98] transition-all min-h-[100px]"
          >
            <Camera size={28} />
            <span className="text-sm font-medium">{t('ui.take.photo')}</span>
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-2 py-6 rounded-2xl
              bg-[#3B82F6]/10 border-2 border-dashed border-[#3B82F6]/40
              text-[#3B82F6] hover:bg-[#3B82F6]/15 active:scale-[0.98] transition-all min-h-[100px]"
          >
            <ImagePlus size={28} />
            <span className="text-sm font-medium">{t('ui.gallery')}</span>
          </button>
        </div>

        {/* Hidden inputs */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        {/* Photo grid */}
        {photos.length > 0 && (
          <div className="mt-4 grid grid-cols-3 gap-2">
            {photos.map((photo) => {
              const src = photo.localUrl || (photo.storage_path
                ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/daily-log-photos/${photo.storage_path}`
                : "");
              const tagName = getActivityName(photo.activity_id);

              return (
                <div key={photo.id} className="relative aspect-square rounded-xl overflow-hidden group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt={photo.caption || t('ui.photo')}
                    className="w-full h-full object-cover"
                  />
                  {/* Activity tag */}
                  {tagName && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-2 py-1">
                      <span className="text-[10px] text-[#F97316] flex items-center gap-1">
                        <Tag size={10} />
                        {tagName}
                      </span>
                    </div>
                  )}
                  {/* Markup button */}
                  {src && (
                    <button
                      type="button"
                      onClick={() => setMarkupPhotoId(photo.id)}
                      className="absolute top-1 left-1 w-7 h-7 rounded-full bg-purple-700/80 flex items-center justify-center
                        opacity-0 group-hover:opacity-100 transition-opacity"
                      title={t('ui.annotate.photo')}
                    >
                      <Pencil size={12} className="text-[color:var(--text-primary)]" />
                    </button>
                  )}
                  {/* Remove button */}
                  <button
                    type="button"
                    onClick={() => removePhoto(photo.id)}
                    className="absolute top-1 right-1 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center
                      opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={14} className="text-[color:var(--text-primary)]" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Summary Card */}
      <div className="bg-[#121217] border border-[#1F1F25] rounded-2xl p-4 space-y-3">
        <h3 className="text-sm font-semibold text-[color:var(--text-primary)]">{t('ui.log.summary')}</h3>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="flex items-center gap-2 text-[color:var(--text-secondary)]">
            <Thermometer size={14} className="text-[#F97316]" />
            <span>
              {weather.current_temp ?? weather.high ?? "--"}{t('ui.f')}
              {(weather.conditions || []).length > 0 && (
                <span className="text-gray-600"> · {weather.conditions.join(", ")}</span>
              )}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[color:var(--text-secondary)]">
            <Users size={14} className="text-[#3B82F6]" />
            <span>{totalHeadcount}{t('ui.workers')} {totalCrewHours}{t('ui.hrs')}</span>
          </div>
          <div className="flex items-center gap-2 text-[color:var(--text-secondary)]">
            <TrendingUp size={14} className="text-[#22C55E]" />
            <span>{activitiesAdvanced}{t('ui.activities.advanced')}</span>
          </div>
          <div className="flex items-center gap-2 text-[color:var(--text-secondary)]">
            <AlertTriangle size={14} className="text-[#EAB308]" />
            <span>{delayCodes.length}{t('ui.delay.codes')}</span>
          </div>
          <div className="flex items-center gap-2 text-[color:var(--text-secondary)]">
            <ImageIcon size={14} className="text-purple-400" />
            <span>{photos.length}{t('ui.photos.2e58e0')}</span>
          </div>
        </div>
      </div>

      {/* Complete Daily Log Button */}
      <button
        type="button"
        onClick={handleComplete}
        disabled={isSubmitting || logStatus === "submitted"}
        className={`w-full py-4 rounded-2xl text-base font-bold transition-all min-h-[56px]
          ${logStatus === "submitted"
            ? "bg-[#22C55E]/20 text-[#22C55E] cursor-default"
            : isSubmitting
              ? "bg-[#F97316]/50 text-[color:var(--text-primary)] cursor-wait"
              : "bg-[#F97316] hover:bg-[#ea6c10] text-[color:var(--text-primary)] active:scale-[0.98]"
          }`}
      >
        {logStatus === "submitted"
          ? t('ui.submitted.b7757a')
          : isSubmitting
            ? t('ui.submitting')
            : t('ui.complete.daily.log')}
      </button>
    </div>

    {/* Photo markup overlay */}
    <MarkupPhotoOverlay
      markupPhotoId={markupPhotoId}
      photos={photos}
      onPhotosChange={onPhotosChange}
      onClose={() => setMarkupPhotoId(null)}
    />
    </>
  );
}

// ─── Helper component for photo markup overlay ──────────────────────────────

interface MarkupPhotoOverlayProps {
  markupPhotoId: string | null;
  photos: (import("@/types").DailyLogPhoto & { localUrl?: string; file?: File })[];
  onPhotosChange: (photos: (import("@/types").DailyLogPhoto & { localUrl?: string; file?: File })[]) => void;
  onClose: () => void;
}

function MarkupPhotoOverlay({
  markupPhotoId,
  photos,
  onPhotosChange,
  onClose,
}: MarkupPhotoOverlayProps) {
  if (!markupPhotoId) return null;
  const photo = photos.find((p) => p.id === markupPhotoId);
  const src = photo?.localUrl || (photo?.storage_path
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/daily-log-photos/${photo.storage_path}`
    : null);
  if (!src || !photo) return null;

  return (
    <PhotoMarkup
      imageUrl={src}
      onSave={(annotatedUrl) => {
        // Update photo with annotated version
        onPhotosChange(
          photos.map((p) => (p.id === markupPhotoId ? { ...p, localUrl: annotatedUrl } : p))
        );
        // Also update the underlying file for upload
        fetch(annotatedUrl)
          .then((r) => r.blob())
          .then((blob) => {
            const f = new File([blob], "daily-log-markup.jpg", { type: "image/jpeg" });
            onPhotosChange(
              photos.map((p) => (p.id === markupPhotoId ? { ...p, localUrl: annotatedUrl, file: f } : p))
            );
          })
          .catch(() => {});
        onClose();
      }}
      onClose={onClose}
    />
  );
}
