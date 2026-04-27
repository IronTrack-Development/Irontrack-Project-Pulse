import { useState, useEffect } from "react";
import { getLanguage } from "@/lib/i18n";

/**
 * Fetches Spanish translations for a list of activity names.
 * - Only fires when language is 'es'
 * - Caches results in component state (no re-fetch on re-render)
 * - Falls back gracefully: if translation missing, caller shows English
 */
export function useActivityTranslations(activityNames: string[]) {
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const lang = getLanguage();

  // Stable key: number of unique names + language
  // (using activityNames.length as dep keeps the hook simple; deduplication is done inside)
  useEffect(() => {
    if (lang !== "es" || activityNames.length === 0) {
      setTranslations({});
      return;
    }

    const uniqueNames = [...new Set(activityNames.filter(Boolean))];
    if (uniqueNames.length === 0) return;

    setLoading(true);

    fetch("/api/translate-activities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activities: uniqueNames }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.translations) setTranslations(data.translations);
      })
      .catch(() => {
        // Silent fail — components will show English fallback
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, activityNames.length]);

  return { translations, loading, isSpanish: lang === "es" };
}
