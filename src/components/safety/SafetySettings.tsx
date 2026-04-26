"use client";

import { useState, useEffect } from "react";
import { X, Settings, Save } from "lucide-react";

interface SafetySettingsProps {
  projectId: string;
  onClose: () => void;
}

export default function SafetySettings({ projectId, onClose }: SafetySettingsProps) {
  const [companyName, setCompanyName] = useState("");
  const [defaultPresenter, setDefaultPresenter] = useState("");

  useEffect(() => {
    setCompanyName(localStorage.getItem("pulse_company_name") || "");
    setDefaultPresenter(
      localStorage.getItem(`pulse_default_presenter_${projectId}`) || ""
    );
  }, [projectId]);

  const handleSave = () => {
    if (companyName.trim()) {
      localStorage.setItem("pulse_company_name", companyName.trim());
    } else {
      localStorage.removeItem("pulse_company_name");
    }
    if (defaultPresenter.trim()) {
      localStorage.setItem(
        `pulse_default_presenter_${projectId}`,
        defaultPresenter.trim()
      );
    } else {
      localStorage.removeItem(`pulse_default_presenter_${projectId}`);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
      <div className="bg-[var(--bg-secondary)] w-full max-w-sm rounded-2xl border border-[var(--border-primary)] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border-primary)]">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Settings size={16} className="text-[#F97316]" />
            Safety Settings
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-white transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">
              Company Name
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Your company name (for PDF headers)"
              className="w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#F97316] min-h-[44px]"
            />
            <p className="text-[10px] text-gray-600 mt-1">
              Used in exported PDF headers
            </p>
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">
              Default Presenter
            </label>
            <input
              type="text"
              value={defaultPresenter}
              onChange={(e) => setDefaultPresenter(e.target.value)}
              placeholder="Auto-fill presenter name on new talks"
              className="w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#F97316] min-h-[44px]"
            />
            <p className="text-[10px] text-gray-600 mt-1">
              Pre-fills the presenter field when creating new talks
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--border-primary)] flex gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-[var(--bg-tertiary)] text-gray-300 rounded-xl text-sm font-medium hover:bg-[var(--bg-hover)] transition-colors min-h-[44px]"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#F97316] hover:bg-[#ea6c10] text-white rounded-xl text-sm font-bold transition-colors min-h-[44px]"
          >
            <Save size={14} />
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
