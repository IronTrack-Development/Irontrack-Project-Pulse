"use client";

import { useState, useEffect } from "react";
import { X, Settings, Save } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

const { t } = useTranslation();

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
          <h3 className="text-base font-bold text-[color:var(--text-primary)] flex items-center gap-2">
            <Settings size={16} className="text-[#F97316]" />{t('ui.safety.settings')}
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          <div>
            <label className="text-xs text-[color:var(--text-muted)] mb-1 block">{t('ui.company.name.8599f5')}
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder={t('ui.your.company.name.for.pdf.headers')}
              className="w-full bg-[#0B0B0D] border border-[#1F1F25] rounded-lg px-3 py-2.5 text-sm text-[color:var(--text-primary)] placeholder-gray-600 focus:outline-none focus:border-[#F97316] min-h-[44px]"
            />
            <p className="text-[10px] text-gray-600 mt-1">{t('ui.used.in.exported.pdf.headers')}
            </p>
          </div>

          <div>
            <label className="text-xs text-[color:var(--text-muted)] mb-1 block">{t('ui.default.presenter')}
            </label>
            <input
              type="text"
              value={defaultPresenter}
              onChange={(e) => setDefaultPresenter(e.target.value)}
              placeholder={t('ui.auto.fill.presenter.name.on.new.talks')}
              className="w-full bg-[#0B0B0D] border border-[#1F1F25] rounded-lg px-3 py-2.5 text-sm text-[color:var(--text-primary)] placeholder-gray-600 focus:outline-none focus:border-[#F97316] min-h-[44px]"
            />
            <p className="text-[10px] text-gray-600 mt-1">{t('ui.pre.fills.the.presenter.field.when.creating.new.talks')}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--border-primary)] flex gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-[#1F1F25] text-[color:var(--text-secondary)] rounded-xl text-sm font-medium hover:bg-[#2a2a35] transition-colors min-h-[44px]"
          >{t('action.cancel')}
          </button>
          <button
            onClick={handleSave}
            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#F97316] hover:bg-[#ea6c10] text-[color:var(--text-primary)] rounded-xl text-sm font-bold transition-colors min-h-[44px]"
          >
            <Save size={14} />{t('ui.save.settings')}
          </button>
        </div>
      </div>
    </div>
  );
}
