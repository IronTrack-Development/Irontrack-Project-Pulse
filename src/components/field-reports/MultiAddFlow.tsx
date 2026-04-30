"use client";

import { useState, useRef } from "react";
import { ArrowLeft, X, ImagePlus } from "lucide-react";
import { t } from "@/lib/i18n";

interface PhotoItem {
  file: File;
  preview: string;
  title: string;
}

interface Props {
  projectId: string;
  onBack: () => void;
  getPhotoUrl: (path: string) => string;
}

export default function MultiAddFlow({ projectId, onBack }: Props) {
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newPhotos: PhotoItem[] = [];
    const startNum = photos.length + 1;

    Array.from(files).forEach((file, i) => {
      newPhotos.push({
        file,
        preview: URL.createObjectURL(file),
        title: `Issue ${startNum + i}`,
      });
    });

    setPhotos((prev) => [...prev, ...newPhotos]);
    // Reset input
    if (fileRef.current) fileRef.current.value = "";
  };

  const removePhoto = (idx: number) => {
    setPhotos((prev) => {
      URL.revokeObjectURL(prev[idx].preview);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const updateTitle = (idx: number, title: string) => {
    setPhotos((prev) => prev.map((p, i) => (i === idx ? { ...p, title } : p)));
  };

  const handleCreateAll = async () => {
    if (photos.length === 0) return;
    setCreating(true);
    setError(null);

    try {
      for (const photo of photos) {
        const createRes = await fetch(`/api/projects/${projectId}/field-reports`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: photo.title }),
        });
        if (!createRes.ok) throw new Error("Failed to create report");

        const report = await createRes.json();
        const photoFormData = new FormData();
        photoFormData.append("file", photo.file);
        const uploadRes = await fetch(`/api/projects/${projectId}/field-reports/${report.id}/photo`, {
          method: "POST",
          body: photoFormData,
        });
        if (!uploadRes.ok) throw new Error("Failed to upload photo");
      }

      // Clean up previews
      photos.forEach((p) => URL.revokeObjectURL(p.preview));
      onBack();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setCreating(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      {/* Header */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] text-sm mb-4 min-h-[44px] transition-colors"
      >
        <ArrowLeft size={16} />
        {t('reports.backToReports')}
      </button>

      <h2 className="text-lg font-bold text-[color:var(--text-primary)] mb-4">{t('reports.multiAddReports')}</h2>

      {error && <p className="text-red-400 text-xs mb-3">{error}</p>}

      {/* File picker */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFiles}
        className="hidden"
      />
      <button
        onClick={() => fileRef.current?.click()}
        className="w-full flex items-center justify-center gap-2 py-4 mb-4 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] text-[color:var(--text-secondary)] rounded-xl text-sm font-medium transition-colors min-h-[56px] border border-dashed border-[#333]"
      >
        <ImagePlus size={18} />
        {photos.length === 0 ? t('reports.selectPhotos') : t('reports.addMorePhotos')}
      </button>

      {/* Grid preview */}
      {photos.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {photos.map((photo, idx) => (
              <div key={idx} className="relative bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl overflow-hidden">
                <img
                  src={photo.preview}
                  alt=""
                  className="w-full h-32 object-cover"
                />
                <button
                  onClick={() => removePhoto(idx)}
                  className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-red-600 flex items-center justify-center"
                >
                  <X size={12} className="text-[color:var(--text-primary)]" />
                </button>
                <div className="p-2">
                  <input
                    type="text"
                    value={photo.title}
                    onChange={(e) => updateTitle(idx, e.target.value)}
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded px-2 py-1.5 text-[color:var(--text-primary)] text-xs focus:outline-none focus:border-[#F97316] transition-colors"
                  />
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleCreateAll}
            disabled={creating}
            className="w-full flex items-center justify-center gap-2 py-3 bg-[#F97316] hover:bg-[#ea6c10] text-[color:var(--text-primary)] rounded-xl text-sm font-bold transition-colors min-h-[48px] disabled:opacity-50"
          >
            {creating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {t('reports.creatingReports')}
              </>
            ) : (
              `${t('reports.createAll')} (${photos.length})`
            )}
          </button>
        </>
      )}
    </div>
  );
}
