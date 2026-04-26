"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { ArrowLeft, Pencil, Trash2, ChevronDown, ChevronUp, ImageOff } from "lucide-react";
import { FieldReport } from "@/types";

interface Props {
  projectId: string;
  report: FieldReport;
  onBack: () => void;
  getPhotoUrl: (path: string) => string;
}

export default function FieldReportDetail({ projectId, report: initialReport, onBack, getPhotoUrl }: Props) {
  const [report, setReport] = useState<FieldReport>(initialReport);
  const [showMore, setShowMore] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const save = useCallback(
    async (updates: Partial<FieldReport>) => {
      setSaving(true);
      try {
        const res = await fetch(`/api/projects/${projectId}/field-reports/${report.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        });
        if (res.ok) {
          const data = await res.json();
          setReport(data);
        }
      } finally {
        setSaving(false);
      }
    },
    [projectId, report.id]
  );

  const debouncedSave = useCallback(
    (updates: Partial<FieldReport>) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => save(updates), 800);
    },
    [save]
  );

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleFieldChange = (field: keyof FieldReport, value: string) => {
    setReport((prev) => ({ ...prev, [field]: value } as FieldReport));
    debouncedSave({ [field]: value });
  };

  const handleBlurSave = (field: keyof FieldReport) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    save({ [field]: report[field] });
  };

  const handleDelete = async () => {
    if (!confirm("Delete this report?")) return;
    setDeleting(true);
    await fetch(`/api/projects/${projectId}/field-reports/${report.id}`, { method: "DELETE" });
    onBack();
  };

  const handleDeletePhoto = async () => {
    if (!confirm("Remove photo from this report?")) return;
    await save({ photo_path: undefined });
  };

  const handleMarkup = () => {
    // V1: coming soon toast
    if (typeof window !== "undefined") {
      const el = document.createElement("div");
      el.textContent = "Markup coming soon";
      el.className =
        "fixed bottom-20 left-1/2 -translate-x-1/2 bg-[var(--bg-tertiary)] text-white px-4 py-2 rounded-lg text-sm font-medium z-50 shadow-lg";
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 2000);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm mb-4 min-h-[44px] transition-colors"
      >
        <ArrowLeft size={16} />
        Reports
      </button>

      {/* Photo */}
      <div className="relative mb-5">
        {report.photo_path ? (
          <>
            <img
              src={getPhotoUrl(report.photo_path)}
              alt={report.title}
              className="w-full rounded-xl object-cover"
              style={{ maxHeight: 400 }}
            />
            {/* Overlay buttons */}
            <button
              onClick={handleMarkup}
              className="absolute top-3 right-14 w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center shadow-lg hover:bg-blue-500 transition-colors"
            >
              <Pencil size={16} className="text-white" />
            </button>
            <button
              onClick={handleDeletePhoto}
              className="absolute top-3 right-3 w-10 h-10 rounded-full bg-red-600 flex items-center justify-center shadow-lg hover:bg-red-500 transition-colors"
            >
              <Trash2 size={16} className="text-white" />
            </button>
          </>
        ) : (
          <div className="w-full h-48 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] flex items-center justify-center">
            <ImageOff size={40} className="text-gray-600" />
          </div>
        )}
      </div>

      {/* Title */}
      <div className="mb-4">
        <label className="block text-xs text-gray-500 mb-1">Title</label>
        <input
          type="text"
          value={report.title}
          onChange={(e) => handleFieldChange("title", e.target.value)}
          onBlur={() => handleBlurSave("title")}
          className="w-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#F97316] transition-colors min-h-[44px]"
        />
      </div>

      {/* Assigned To */}
      <div className="mb-4">
        <label className="block text-xs text-gray-500 mb-1">Assigned To</label>
        <input
          type="text"
          value={report.assigned_to || ""}
          onChange={(e) => handleFieldChange("assigned_to", e.target.value)}
          onBlur={() => handleBlurSave("assigned_to")}
          placeholder="Name or company"
          className="w-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#F97316] transition-colors min-h-[44px] placeholder:text-gray-600"
        />
      </div>

      {/* Comments */}
      <div className="mb-4">
        <label className="block text-xs text-gray-500 mb-1">Comments</label>
        <textarea
          value={report.comments || ""}
          onChange={(e) => handleFieldChange("comments", e.target.value)}
          onBlur={() => handleBlurSave("comments")}
          placeholder="Notes about this issue..."
          rows={3}
          className="w-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#F97316] transition-colors placeholder:text-gray-600 resize-none"
        />
      </div>

      {/* More Details (collapsible) */}
      <button
        onClick={() => setShowMore(!showMore)}
        className="flex items-center gap-1.5 text-gray-400 hover:text-white text-xs font-medium mb-3 min-h-[44px] transition-colors"
      >
        {showMore ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        More Details
      </button>

      {showMore && (
        <div className="space-y-4 mb-6 pl-1">
          {/* Location */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Location</label>
            <input
              type="text"
              value={report.location || ""}
              onChange={(e) => handleFieldChange("location", e.target.value)}
              onBlur={() => handleBlurSave("location")}
              placeholder="Building, floor, area..."
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#F97316] transition-colors min-h-[44px] placeholder:text-gray-600"
            />
          </div>

          {/* Priority */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Priority</label>
            <select
              value={report.priority}
              onChange={(e) => {
                handleFieldChange("priority", e.target.value);
                save({ priority: e.target.value as FieldReport["priority"] });
              }}
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#F97316] transition-colors min-h-[44px]"
            >
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Status</label>
            <select
              value={report.status}
              onChange={(e) => {
                handleFieldChange("status", e.target.value);
                save({ status: e.target.value as FieldReport["status"] });
              }}
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#F97316] transition-colors min-h-[44px]"
            >
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>

          {/* Trade */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Trade</label>
            <input
              type="text"
              value={report.trade || ""}
              onChange={(e) => handleFieldChange("trade", e.target.value)}
              onBlur={() => handleBlurSave("trade")}
              placeholder="e.g. Electrical, Plumbing..."
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#F97316] transition-colors min-h-[44px] placeholder:text-gray-600"
            />
          </div>

          {/* Resolution Notes (shown when resolved) */}
          {report.status === "resolved" && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">Resolution Notes</label>
              <textarea
                value={report.resolution_notes || ""}
                onChange={(e) => handleFieldChange("resolution_notes", e.target.value)}
                onBlur={() => handleBlurSave("resolution_notes")}
                placeholder="How was this resolved?"
                rows={2}
                className="w-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#F97316] transition-colors placeholder:text-gray-600 resize-none"
              />
            </div>
          )}
        </div>
      )}

      {/* Saving indicator */}
      {saving && (
        <p className="text-xs text-gray-500 mb-3">Saving...</p>
      )}

      {/* Delete button */}
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="w-full flex items-center justify-center gap-2 py-3 mt-4 bg-red-600/10 border border-red-600/20 text-red-500 rounded-lg text-sm font-medium hover:bg-red-600/20 transition-colors min-h-[44px] disabled:opacity-50"
      >
        <Trash2 size={14} />
        {deleting ? "Deleting..." : "Delete Report"}
      </button>
    </div>
  );
}
