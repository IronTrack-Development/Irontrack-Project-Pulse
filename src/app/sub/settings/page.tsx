"use client";

import AppearanceSettings from "@/components/settings/AppearanceSettings";

export default function SubSettingsPage() {
  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-[color:var(--text-primary)] mb-8">Settings</h1>

      <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-[color:var(--text-primary)] mb-4">
          Appearance
        </h2>
        <AppearanceSettings />
      </div>

      <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-6">
        <h2 className="text-lg font-semibold text-[color:var(--text-primary)] mb-2">About</h2>
        <p className="text-sm text-[color:var(--text-secondary)]">IronTrack Pulse v2.0 — Sub Portal</p>
        <a href="mailto:irontrackdevelopment@outlook.com" className="text-sm text-[#3B82F6] hover:underline mt-2 inline-block">
          Contact Support
        </a>
      </div>
    </div>
  );
}