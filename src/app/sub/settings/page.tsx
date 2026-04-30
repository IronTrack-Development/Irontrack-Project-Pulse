"use client";

import { Mail, Palette, Settings } from "lucide-react";
import AppearanceSettings from "@/components/settings/AppearanceSettings";
import { t } from "@/lib/i18n";

export default function SubSettingsPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-5 px-4 py-5 md:px-6 md:py-7">
      <div className="rounded-xl border border-white/10 bg-[linear-gradient(135deg,rgba(59,130,246,0.16),rgba(15,23,42,0.72)_50%,rgba(249,115,22,0.1))] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.2)]">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#93C5FD]">{t('subops.portalSettings')}</p>
        <h1 className="mt-2 text-2xl font-black text-white md:text-3xl">{t('subops.makeIronTrackFeelRight')}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
          {t('subops.settingsIntro')}
        </p>
      </div>

      <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-5 shadow-[0_18px_55px_rgba(0,0,0,0.16)] md:p-6">
        <div className="mb-4 flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-[#3B82F6]/15 text-[#60A5FA]">
            <Palette size={18} />
          </span>
          <div>
            <h2 className="text-lg font-bold text-[color:var(--text-primary)]">{t('settings.appearance')}</h2>
            <p className="text-sm text-[color:var(--text-muted)]">{t('subops.themeControls')}</p>
          </div>
        </div>
        <AppearanceSettings />
      </div>

      <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-5 shadow-[0_18px_55px_rgba(0,0,0,0.16)] md:p-6">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-[#F97316]/15 text-[#F97316]">
            <Settings size={18} />
          </span>
          <div>
            <h2 className="text-lg font-bold text-[color:var(--text-primary)]">{t('subops.about')}</h2>
            <p className="mt-1 text-sm text-[color:var(--text-secondary)]">IronTrack Pulse v2.0 - {t('subops.subPortal')}</p>
          </div>
        </div>
        <a
          href="mailto:irontrackdevelopment@outlook.com"
          className="mt-4 inline-flex items-center gap-2 rounded-lg border border-[#3B82F6]/25 bg-[#3B82F6]/10 px-4 py-2 text-sm font-bold text-[#93C5FD] transition-colors hover:text-white"
        >
          <Mail size={14} />
          {t('subops.contactSupport')}
        </a>
      </div>
    </div>
  );
}
