"use client";

import { useState, useEffect, useRef } from "react";
import { useLanguage } from "@/components/I18nProvider";

/**
 * Fetches Spanish translations for a list of activity names.
 * - Only fires when language is 'es' AND activities are provided
 * - Never blocks initial render — translations appear after data loads
 * - Falls back gracefully: if translation missing, caller shows English
 */
export function useActivityTranslations(activityNames: string[]) {
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const fetchedRef = useRef<string>("");
  const isSpanish = useLanguage() === "es";
  const uniqueNames = [...new Set((activityNames || []).filter(Boolean))];
  const requestKey = uniqueNames.slice().sort().join("|");

  useEffect(() => {
    // Skip if not Spanish or no activities
    if (!isSpanish || uniqueNames.length === 0) return;

    // Skip if we already fetched this exact set
    if (requestKey === fetchedRef.current) return;
    fetchedRef.current = requestKey;

    // Fetch translations without blocking render
    setLoading(true);
    fetch("/api/translate-activities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activities: uniqueNames }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed");
        return res.json();
      })
      .then((data) => {
        if (data?.translations && typeof data.translations === "object") {
          setTranslations(data.translations);
        }
      })
      .catch(() => {
        // Silent fail — show English
      })
      .finally(() => setLoading(false));
  }, [isSpanish, requestKey]);

  const getActivityName = (name: string) => {
    if (!isSpanish) return name;
    return translations[name] || name;
  };

  return { translations, loading, isSpanish, getActivityName };
}
