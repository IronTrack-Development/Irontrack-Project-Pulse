"use client";

import { useRef, useCallback } from "react";
import { Camera, ImagePlus, X } from "lucide-react";

export interface RFIPhoto {
  id: string;
  localUrl: string;
  file: File;
  caption?: string;
}

interface RFIPhotoCaptureProps {
  photos: RFIPhoto[];
  onChange: (photos: RFIPhoto[]) => void;
  compact?: boolean;
}

export default function RFIPhotoCapture({ photos, onChange, compact = false }: RFIPhotoCaptureProps) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;
      const newPhotos: RFIPhoto[] = Array.from(files).map((file) => ({
        id: crypto.randomUUID(),
        localUrl: URL.createObjectURL(file),
        file,
      }));
      onChange([...photos, ...newPhotos]);
    },
    [photos, onChange]
  );

  const removePhoto = (id: string) => {
    const photo = photos.find((p) => p.id === id);
    if (photo?.localUrl) URL.revokeObjectURL(photo.localUrl);
    onChange(photos.filter((p) => p.id !== id));
  };

  if (compact) {
    return (
      <div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => cameraRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1F1F25] text-gray-400
              hover:text-white hover:bg-[#2a2a35] transition-colors text-xs min-h-[44px]"
          >
            <Camera size={14} />
            Camera
          </button>
          <button
            type="button"
            onClick={() => galleryRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1F1F25] text-gray-400
              hover:text-white hover:bg-[#2a2a35] transition-colors text-xs min-h-[44px]"
          >
            <ImagePlus size={14} />
            Gallery
          </button>
        </div>
        <input ref={cameraRef} type="file" accept="image/*" capture="environment"
          className="hidden" onChange={(e) => handleFiles(e.target.files)} />
        <input ref={galleryRef} type="file" accept="image/*" multiple
          className="hidden" onChange={(e) => handleFiles(e.target.files)} />
        {photos.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {photos.map((photo) => (
              <div key={photo.id} className="relative w-16 h-16 rounded-lg overflow-hidden group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.localUrl} alt="RFI photo" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removePhoto(photo.id)}
                  className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/70
                    flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={10} className="text-white" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => cameraRef.current?.click()}
          className="flex flex-col items-center justify-center gap-2 py-5 rounded-2xl
            bg-[#F97316]/10 border-2 border-dashed border-[#F97316]/40
            text-[#F97316] hover:bg-[#F97316]/15 active:scale-[0.98] transition-all min-h-[90px]"
        >
          <Camera size={24} />
          <span className="text-xs font-medium">Take Photo</span>
        </button>
        <button
          type="button"
          onClick={() => galleryRef.current?.click()}
          className="flex flex-col items-center justify-center gap-2 py-5 rounded-2xl
            bg-[#3B82F6]/10 border-2 border-dashed border-[#3B82F6]/40
            text-[#3B82F6] hover:bg-[#3B82F6]/15 active:scale-[0.98] transition-all min-h-[90px]"
        >
          <ImagePlus size={24} />
          <span className="text-xs font-medium">Gallery</span>
        </button>
      </div>
      <input ref={cameraRef} type="file" accept="image/*" capture="environment"
        className="hidden" onChange={(e) => handleFiles(e.target.files)} />
      <input ref={galleryRef} type="file" accept="image/*" multiple
        className="hidden" onChange={(e) => handleFiles(e.target.files)} />

      {photos.length > 0 && (
        <div className="mt-4 grid grid-cols-3 gap-2">
          {photos.map((photo) => (
            <div key={photo.id} className="relative aspect-square rounded-xl overflow-hidden group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.localUrl} alt="RFI photo" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removePhoto(photo.id)}
                className="absolute top-1 right-1 w-7 h-7 rounded-full bg-black/60
                  flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={14} className="text-white" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
