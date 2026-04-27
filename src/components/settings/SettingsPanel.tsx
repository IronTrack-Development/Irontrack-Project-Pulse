"use client";

import { useState, useEffect } from "react";
import { X, Sun, Moon } from "lucide-react";
import { getTheme, setTheme, type Theme } from "@/lib/theme";
import { getLanguage, setLanguage, type Language } from "@/lib/i18n";
import { t } from "@/lib/i18n";

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
}

export default function SettingsPanel({ open, onClose }: SettingsPanelProps) {
  const [currentTheme, setCurrentTheme] = useState<Theme>("dark");
  const [currentLang, setCurrentLang] = useState<Language>("en");
  const [companyName, setCompanyName] = useState<string | null>(null);

  useEffect(() => {
    setCurrentTheme(getTheme());
    setCurrentLang(getLanguage());
    // Check for company info
    const companyId = localStorage.getItem("sub_ops_company_id");
    if (companyId) {
      setCompanyName(localStorage.getItem("sub_ops_company_name") || "Company");
    }
  }, [open]);

  const handleThemeChange = (theme: Theme) => {
    setTheme(theme);
    setCurrentTheme(theme);
  };

  const handleLangChange = (lang: Language) => {
    setLanguage(lang);
    setCurrentLang(lang);
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="fixed z-50 inset-0 md:inset-auto md:right-0 md:top-0 md:bottom-0 md:w-[400px] flex flex-col overflow-y-auto"
        style={{
          backgroundColor: "var(--bg-secondary)",
          color: "var(--text-primary)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: "var(--border-primary)" }}
        >
          <h2 className="text-lg font-bold">{t('ui.settings.title')}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors"
            style={{ color: "var(--text-secondary)" }}
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Appearance */}
          <section>
            <h3
              className="text-xs font-semibold uppercase tracking-wider mb-3"
              style={{ color: "var(--text-muted)" }}
            >
              {t('ui.settings.appearance')}
            </h3>
            <div
              className="rounded-xl p-4"
              style={{ backgroundColor: "var(--bg-tertiary)" }}
            >
              <p className="text-sm font-medium mb-3">{t('ui.settings.theme')}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleThemeChange("dark")}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all"
                  style={{
                    backgroundColor:
                      currentTheme === "dark" ? "var(--accent)" : "var(--bg-hover)",
                    color: currentTheme === "dark" ? "#FFFFFF" : "var(--text-secondary)",
                  }}
                >
                  <Moon size={16} />
                  {t('ui.settings.dark')}
                </button>
                <button
                  onClick={() => handleThemeChange("light")}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all"
                  style={{
                    backgroundColor:
                      currentTheme === "light" ? "var(--accent)" : "var(--bg-hover)",
                    color: currentTheme === "light" ? "#FFFFFF" : "var(--text-secondary)",
                  }}
                >
                  <Sun size={16} />
                  {t('ui.settings.light')}
                </button>
              </div>
            </div>
          </section>

          {/* Language */}
          <section>
            <h3
              className="text-xs font-semibold uppercase tracking-wider mb-3"
              style={{ color: "var(--text-muted)" }}
            >
              {t('ui.settings.language')}
            </h3>
            <div
              className="rounded-xl p-4"
              style={{ backgroundColor: "var(--bg-tertiary)" }}
            >
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => handleLangChange("en")}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all"
                  style={{
                    backgroundColor:
                      currentLang === "en" ? "var(--accent)" : "var(--bg-hover)",
                    color: currentLang === "en" ? "#FFFFFF" : "var(--text-secondary)",
                  }}
                >
                  ðŸ‡ºðŸ‡¸ {t('ui.settings.english')}
                </button>
                <button
                  onClick={() => handleLangChange("es")}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all"
                  style={{
                    backgroundColor:
                      currentLang === "es" ? "var(--accent)" : "var(--bg-hover)",
                    color: currentLang === "es" ? "#FFFFFF" : "var(--text-secondary)",
                  }}
                >
                  ðŸ‡²ðŸ‡½ {t('ui.settings.spanish')}
                </button>
              </div>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                {t('ui.settings.fieldnote')}
              </p>
            </div>
          </section>

          {/* Company (conditional) */}
          {companyName && (
            <section>
              <h3
                className="text-xs font-semibold uppercase tracking-wider mb-3"
                style={{ color: "var(--text-muted)" }}
              >
                {t('ui.settings.company')}
              </h3>
              <div
                className="rounded-xl p-4"
                style={{ backgroundColor: "var(--bg-tertiary)" }}
              >
                <p className="text-sm font-medium">{companyName}</p>
              </div>
            </section>
          )}

          {/* About */}
          <section>
            <h3
              className="text-xs font-semibold uppercase tracking-wider mb-3"
              style={{ color: "var(--text-muted)" }}
            >
              {t('ui.settings.about')}
            </h3>
            <div
              className="rounded-xl p-4 space-y-3"
              style={{ backgroundColor: "var(--bg-tertiary)" }}
            >
              <p className="text-sm font-medium">{t('ui.irontrack.pulse.v2.0')}</p>
              <div className="flex flex-wrap gap-3 text-xs" style={{ color: "var(--text-muted)" }}>
                <a href="mailto:support@irontrack.tech" className="hover:underline" style={{ color: "var(--accent)" }}>{t('ui.support')}
                </a>
                <span>Â·</span>
                <a href="#" className="hover:underline" style={{ color: "var(--accent)" }}>{t('ui.privacy.policy')}
                </a>
                <span>Â·</span>
                <a href="#" className="hover:underline" style={{ color: "var(--accent)" }}>{t('ui.terms.of.service')}
                </a>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
