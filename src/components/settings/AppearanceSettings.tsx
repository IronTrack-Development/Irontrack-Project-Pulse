"use client";

import { useState, useEffect } from "react";
import { Sun, Moon, Globe } from "lucide-react";
import { getTheme, setTheme, type Theme } from "@/lib/theme";
import { setLanguage, type Language } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { useLanguage } from "@/components/I18nProvider";

export default function AppearanceSettings() {
  const [currentTheme, setCurrentTheme] = useState<Theme>("dark");
  const currentLang = useLanguage();

  useEffect(() => {
    setCurrentTheme(getTheme());
  }, []);

  const handleThemeChange = (theme: Theme) => {
    setTheme(theme);
    setCurrentTheme(theme);
  };

  const handleLangChange = (lang: Language) => {
    setLanguage(lang);
  };

  return (
    <div className="space-y-6">
      {/* Theme */}
      <div>
        <p className="text-sm font-medium text-[color:var(--text-primary)] mb-3">{t('settings.theme')}</p>
        <div className="flex gap-2">
          <button
            onClick={() => handleThemeChange("dark")}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all"
            style={{
              backgroundColor: currentTheme === "dark" ? "#F97316" : "var(--bg-tertiary)",
              color: currentTheme === "dark" ? "#FFFFFF" : "var(--text-secondary)",
            }}
          >
            <Moon size={16} />{t('settings.dark')}
          </button>
          <button
            onClick={() => handleThemeChange("light")}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all"
            style={{
              backgroundColor: currentTheme === "light" ? "#F97316" : "var(--bg-tertiary)",
              color: currentTheme === "light" ? "#FFFFFF" : "var(--text-secondary)",
            }}
          >
            <Sun size={16} />{t('settings.light')}
          </button>
        </div>
      </div>

      {/* Language */}
      <div>
        <p className="text-sm font-medium text-[color:var(--text-primary)] mb-3">{t('settings.language')}</p>
        <div className="flex gap-2">
          <button
            onClick={() => handleLangChange("en")}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all"
            style={{
              backgroundColor: currentLang === "en" ? "#F97316" : "var(--bg-tertiary)",
              color: currentLang === "en" ? "#FFFFFF" : "var(--text-secondary)",
            }}
          >{t('ui.english')}
          </button>
          <button
            onClick={() => handleLangChange("es")}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all"
            style={{
              backgroundColor: currentLang === "es" ? "#F97316" : "var(--bg-tertiary)",
              color: currentLang === "es" ? "#FFFFFF" : "var(--text-secondary)",
            }}
          >{t('ui.espanol')}
          </button>
        </div>
        <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>{t('ui.field.facing.features.will.display.in.the.selected.language')}
        </p>
      </div>
    </div>
  );
}
