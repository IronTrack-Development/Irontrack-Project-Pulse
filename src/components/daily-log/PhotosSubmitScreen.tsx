"use client";

import { useRef, useState, useCallback } from "react";
import {
  Camera, X, Tag, Image as ImageIcon,
  Thermometer, Users, TrendingUp, AlertTriangle, ImagePlus,
} from "lucide-react";
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
  onSubmit: () => void;
  isSubmitting: boolean;
  logStatus: string;
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
}: PhotosSubmitScreenProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const totalHeadcount = crew.reduce((sum, c) => sum + (c.headcount || 0), 0);
  const totalCrewHours = crew.reduce((sum, c) => sum + ((c.headcount || 0) * (c.hours || 0)), 0);
  const activitiesAdvanced = progress.filter(
    (p) => (p.pct_complete_after || 0) > (p.pct_complete_before || 0)
  ).length;

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

  const updatePhotoActivity = (photoId: string, activityId: string | undefined) => {
    onPhotosChange(
      photos.map((p) => (p.id === photoId ? { ...p, activity_id: activityId } : p))
    );
  };

  const getActivityName = (activityId?: string) => {
    if (!activityId) return null;
    return activities.find((a) => a.id === activityId)?.activity_name || null;
  };

  return (
    <div className="space-y-6">
      {/* Camera / Photo Capture — BIG prominent button */}
      <div>
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Camera size={16} className="text-[#F97316]" />
          Photos
        </h3>

        {/* Quick tag selector */}
        {activities.length > 0 && (
          <div className="mb-3">
            <label className="text-xs text-gray-500 mb-1.5 block">Auto-tag photos to activity:</label>
            <select
              value={selectedTag || ""}
              onChange={(e) => setSelectedTag(e.target.value || null)}
              className="w-full bg-[#0B0B0D] border border-[#1F1F25] rounded-xl px-3 py-2.5 text-sm text-white
                focus:outline-none focus:border-[#F97316]/50 min-h-[44px]"
            >
              <option value="">No tag (general)</option>
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
            <span className="text-sm font-medium">Take Photo</span>
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-2 py-6 rounded-2xl
              bg-[#3B82F6]/10 border-2 border-dashed border-[#3B82F6]/40
              text-[#3B82F6] hover:bg-[#3B82F6]/15 active:scale-[0.98] transition-all min-h-[100px]"
          >
            <ImagePlus size={28} />
            <span className="text-sm font-medium">Gallery</span>
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
                    alt={photo.caption || "Photo"}
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
                  {/* Remove button */}
                  <button
                    type="button"
                    onClick={() => removePhoto(photo.id)}
                    className="absolute top-1 right-1 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center
                      opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={14} className="text-white" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Summary Card */}
      <div className="bg-[#121217] border border-[#1F1F25] rounded-2xl p-4 space-y-3">
        <h3 className="text-sm font-semibold text-white">Log Summary</h3>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="flex items-center gap-2 text-gray-400">
            <Thermometer size={14} className="text-[#F97316]" />
            <span>
              {weather.high ?? "--"}°/{weather.low ?? "--"}°
              {(weather.conditions || []).length > 0 && (
                <span className="text-gray-600"> · {weather.conditions.join(", ")}</span>
              )}
            </span>
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <Users size={14} className="text-[#3B82F6]" />
            <span>{totalHeadcount} workers · {totalCrewHours} hrs</span>
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <TrendingUp size={14} className="text-[#22C55E]" />
            <span>{activitiesAdvanced} activities advanced</span>
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <AlertTriangle size={14} className="text-[#EAB308]" />
            <span>{delayCodes.length} delay codes</span>
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <ImageIcon size={14} className="text-purple-400" />
            <span>{photos.length} photos</span>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="button"
        onClick={onSubmit}
        disabled={isSubmitting || logStatus === "submitted"}
        className={`w-full py-4 rounded-2xl text-base font-bold transition-all min-h-[56px]
          ${logStatus === "submitted"
            ? "bg-[#22C55E]/20 text-[#22C55E] cursor-default"
            : isSubmitting
              ? "bg-[#F97316]/50 text-white cursor-wait"
              : "bg-[#F97316] hover:bg-[#ea6c10] text-white active:scale-[0.98]"
          }`}
      >
        {logStatus === "submitted"
          ? "✓ Submitted"
          : isSubmitting
            ? "Submitting..."
            : "Submit Daily Log"}
      </button>
    </div>
  );
}
