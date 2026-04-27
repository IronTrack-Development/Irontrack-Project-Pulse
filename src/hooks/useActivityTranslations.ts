import { useState, useEffect, useRef } from "react";
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
  const lastFetchKey = useRef("");

  useEffect(() => {
    if (lang !== "es" || activityNames.length === 0) {
      // Only clear if we had translations before
      if (Object.keys(translations).length > 0) {
        setTranslations({});
      }
      return;
    }

    const uniqueNames = [...new Set(activityNames.filter(Boolean))];
    if (uniqueNames.length === 0) return;

    // Avoid re-fetching the same set
    const fetchKey = uniqueNames.sort().join("|");
    if (fetchKey === lastFetchKey.current) return;
    lastFetchKey.current = fetchKey;

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
