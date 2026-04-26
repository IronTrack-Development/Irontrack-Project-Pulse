"use client";

import { useState, useRef } from "react";
import { X, Camera, Upload } from "lucide-react";
import { FieldReport } from "@/types";

interface Props {
  projectId: string;
  onClose: () => void;
  onCreated: (report: FieldReport) => void;
}

export default function AddReportModal({ projectId, onClose, onCreated }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setUploading(true);
    setError(null);

    try {
      // 1. Create the report first to get an ID
      const createRes = await fetch(`/api/projects/${projectId}/field-reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!createRes.ok) throw new Error("Failed to create report");
      const report: FieldReport = await createRes.json();

      // 2. Upload photo
      const formData = new FormData();
      formData.append("file", file);
      const uploadRes = await fetch(
        `/api/projects/${projectId}/field-reports/${report.id}/photo`,
        { method: "POST", body: formData }
      );
      if (!uploadRes.ok) throw new Error("Failed to upload photo");
      const { storage_path } = await uploadRes.json();

      // 3. Return report with photo
      onCreated({ ...report, photo_path: storage_path });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setUploading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="bg-[#121217] border border-[#1F1F25] rounded-2xl p-6 w-full max-w-sm">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white font-bold text-base">New Report</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white min-w-[44px] min-h-[44px] flex items-center justify-center">
            <X size={18} />
          </button>
        </div>

        {error && (
          <p className="text-red-400 text-xs mb-3">{error}</p>
        )}

        {uploading ? (
          <div className="flex flex-col items-center justify-center py-10">
            <div className="w-8 h-8 border-2 border-[#F97316] border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-gray-400 text-sm">Creating report...</p>
          </div>
        ) : (
          <div className="space-y-3">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleInputChange}
              className="hidden"
            />
            <button
              onClick={() => {
                if (fileRef.current) {
                  fileRef.current.setAttribute("capture", "environment");
                  fileRef.current.click();
                }
              }}
              className="w-full flex items-center justify-center gap-2 py-4 bg-[#F97316] hover:bg-[#ea6c10] text-white rounded-xl text-sm font-bold transition-colors min-h-[56px]"
            >
              <Camera size={18} />
              Take Photo
            </button>
            <button
              onClick={() => {
                if (fileRef.current) {
                  fileRef.current.removeAttribute("capture");
                  fileRef.current.click();
                }
              }}
              className="w-full flex items-center justify-center gap-2 py-4 bg-[#1F1F25] hover:bg-[#2a2a35] text-gray-300 rounded-xl text-sm font-medium transition-colors min-h-[56px]"
            >
              <Upload size={18} />
              Choose from Library
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
