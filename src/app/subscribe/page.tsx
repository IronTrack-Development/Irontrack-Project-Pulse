"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Loader2, CheckCircle } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

const { t } = useTranslation();

export default function SubscribePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubscribe = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create checkout session");
        setLoading(false);
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setError(t('ui.something.went.wrong.please.try.again'));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center mb-8">
          <Building2 className="w-8 h-8 text-[#F97316] mr-2" />
          <span className="text-2xl font-bold text-[color:var(--text-primary)]">{t('ui.irontrack.project.pulse')}</span>
        </div>

        {/* Subscription Card */}
        <div className="bg-[#1F1F25] border border-[#2A2A30] rounded-lg p-8">
          <h1 className="text-2xl font-bold text-[color:var(--text-primary)] mb-2">{t('ui.subscribe.to.project.pulse')}</h1>
          <p className="text-[color:var(--text-secondary)] mb-6">{t('ui.get.instant.schedule.intelligence.for.your.construction.projects')}
          </p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm mb-6">
              {error}
            </div>
          )}

          <div className="bg-[var(--bg-primary)] border border-[#2A2A30] rounded-lg p-6 mb-6">
            <div className="text-center mb-6">
              <div className="text-4xl font-bold text-[color:var(--text-primary)] mb-2">
                $19.99<span className="text-xl text-[color:var(--text-muted)]">/mo</span>
              </div>
              <p className="text-[color:var(--text-secondary)]">{t('ui.per.project')}</p>
            </div>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-[#22C55E] shrink-0 mt-0.5" />
                <span className="text-[color:var(--text-secondary)] text-sm">{t('ui.unlimited.schedule.uploads')}</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-[#22C55E] shrink-0 mt-0.5" />
                <span className="text-[color:var(--text-secondary)] text-sm">{t('ui.daily.risk.detection.and.health.scores')}</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-[#22C55E] shrink-0 mt-0.5" />
                <span className="text-[color:var(--text-secondary)] text-sm">{t('ui.lookahead.intelligence.and.briefs')}</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-[#22C55E] shrink-0 mt-0.5" />
                <span className="text-[color:var(--text-secondary)] text-sm">{t('ui.mobile.app.access')}</span>
              </li>
            </ul>
          </div>

          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="w-full bg-[#F97316] hover:bg-[#EA580C] disabled:bg-gray-600 disabled:cursor-not-allowed text-[color:var(--text-primary)] font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center mb-4"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />{t('ui.loading.b04ba4')}
              </>
            ) : (
              t('ui.subscribe.now')
            )}
          </button>

          <p className="text-center text-[color:var(--text-muted)] text-xs">{t('ui.secure.payment.powered.by.stripe.cancel.anytime')}
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-[color:var(--text-muted)] text-sm mt-8">{t('ui.2026.irontrack.development.llc.all.rights.reserved')}
        </p>
      </div>
    </div>
  );
}
