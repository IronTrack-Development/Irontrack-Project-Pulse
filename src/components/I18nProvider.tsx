"use client";

import {
  createContext,
  Fragment,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { setClientLanguage, type Language } from "@/lib/i18n";

const I18nContext = createContext<Language>("en");

function readStoredLanguage(): Language {
  return localStorage.getItem("pulse_language") === "es" ? "es" : "en";
}

export function useLanguage(): Language {
  return useContext(I18nContext);
}

export default function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    const applyLanguage = (nextLanguage: Language) => {
      setClientLanguage(nextLanguage);
      setLanguageState(nextLanguage);
    };

    applyLanguage(readStoredLanguage());

    const handleLanguageChange = (event: Event) => {
      const nextLanguage =
        event instanceof CustomEvent && event.detail === "es" ? "es" : readStoredLanguage();
      applyLanguage(nextLanguage);
    };

    window.addEventListener("pulse-language-change", handleLanguageChange);
    window.addEventListener("storage", handleLanguageChange);

    return () => {
      window.removeEventListener("pulse-language-change", handleLanguageChange);
      window.removeEventListener("storage", handleLanguageChange);
    };
  }, []);

  return (
    <I18nContext.Provider value={language}>
      <Fragment key={language}>{children}</Fragment>
    </I18nContext.Provider>
  );
}
