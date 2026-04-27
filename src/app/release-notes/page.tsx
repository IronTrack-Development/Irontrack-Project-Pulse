"use client";

import { useState } from "react";
import Link from "next/link";
import { Building2 } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

const { t } = useTranslation();

type Platform = "Web" | "iOS" | "Android";

interface ReleaseNote {
  version: string;
  date: string;
  platform: Platform;
  title: string;
  changes: string[];
}

const releases: ReleaseNote[] = [
  {
    version: "v1.6.0",
    date: "April 16, 2026",
    platform: "Web",
    title: t('ui.subcontractor.schedule.views'),
    changes: [
      "New Sub Management — add subcontractors to projects and assign their trades",
      "Shareable Sub Schedule Links — generate unique URLs for each sub with one click",
      "Filtered sub views show only tasks relevant to that sub's trades",
      "Schedule Receipt Verification — track when subs open their link with timestamps",
      "Acknowledge button — subs confirm receipt with their name and timestamp (CYA documentation)",
      "Ack Status Dashboard — see at a glance which subs have viewed and acknowledged their schedule",
      "Dependency visibility — subs see which other trades must finish before they can start",
      "Mobile-first sub view — designed for field use on phones, no login required",
    ],
  },
  {
    version: "v1.5.0",
    date: "April 16, 2026",
    platform: "Web",
    title: t('ui.mobile.upload.and.login.reliability'),
    changes: [
      "Fixed mobile file upload — iOS and Android users can now select and upload schedule files",
      "Fixed .mpp file selection on iOS — Microsoft Project files no longer greyed out in file picker",
      "Mobile-optimized upload UI — \"Tap to Select Schedule\" with device-appropriate layout",
      "Upload file size limit raised to 100MB (was 10MB on client)",
      "Added automatic retry on upload failures — recovers from flaky mobile connections",
      "Better upload progress — shows stage-by-stage status (Preparing → Uploading → Parsing)",
      "Fixed login refresh issue — users no longer need to refresh page after signing in",
      "Improved auth reliability — graceful handling of subscription check failures",
      "Added .pdf to accepted upload formats",
    ],
  },
  {
    version: "v1.4.0",
    date: "April 13, 2026",
    platform: "Web",
    title: t('ui.priority.intelligence.and.task.relationships'),
    changes: [
      "Added Priority tab — critical path tracking, upcoming inspections, behind-schedule tasks",
      "Added task relationship chains — click any activity to see predecessors and successors",
      "Activity Drawer now available on all tabs (Today, Tomorrow, Week 1-3, Priority)",
      "Added Executive Snapshot sharing — one-click project summaries for stakeholders",
      "Mobile responsive redesign — hamburger menu, scaled layouts, optimized for phones",
    ],
  },
  {
    version: "v1.3.0",
    date: "April 12, 2026",
    platform: "Web",
    title: t('ui.visual.identity.and.landing.page'),
    changes: [
      "New animated hero video on landing page",
      "Updated favicon and app icons with IronTrack metallic monogram",
      "Added About Us and Who We Serve sections",
      "Updated Open Graph metadata for link previews",
      "New navigation with smooth-scroll section links",
    ],
  },
  {
    version: "v1.2.0",
    date: "April 10, 2026",
    platform: "Web",
    title: t('ui.schedule.intelligence'),
    changes: [
      "3-week lookahead with day-grouped activities",
      "Milestone tracking and progress monitoring",
      "Risk detection engine — 6 automated risk rules",
      "Daily briefing generator",
      "Health score calculation (0-100)",
    ],
  },
  {
    version: "v1.1.0",
    date: "April 8, 2026",
    platform: "Web",
    title: t('ui.upload.and.parse'),
    changes: [
      "Multi-format schedule upload (MPP, XLSX, CSV, XML, XER)",
      "Automatic column mapping",
      "Trade inference from activity names",
      "Project command center dashboard",
    ],
  },
  {
    version: "v1.0.0",
    date: "April 5, 2026",
    platform: "Web",
    title: t('ui.initial.launch'),
    changes: [
      "IronTrack Project Pulse beta launch",
      "Single project upload and view",
      "Basic activity list and search",
      "Supabase backend with RLS policies",
    ],
  },
];

const platformColors: Record<Platform, { bg: string; text: string; border: string; leftBorder: string }> = {
  Web: {
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    border: "border-blue-500/20",
    leftBorder: "border-l-blue-500",
  },
  iOS: {
    bg: "bg-gray-500/10",
    text: "text-[color:var(--text-secondary)]",
    border: "border-gray-500/20",
    leftBorder: "border-l-gray-400",
  },
  Android: {
    bg: "bg-green-500/10",
    text: "text-green-400",
    border: "border-green-500/20",
    leftBorder: "border-l-green-500",
  },
};

type FilterTab = "All" | Platform;
const tabs: FilterTab[] = ["All", "Web", "iOS", "Android"];

export default function ReleaseNotesPage() {
  const [activeTab, setActiveTab] = useState<FilterTab>("All");

  const filtered = activeTab === "All" ? releases : releases.filter((r) => r.platform === activeTab);

  return (
    <div className="min-h-screen bg-[#0B0B0D]">
      {/* Header */}
      <header className="border-b border-[#1F1F25] bg-[#0B0B0D] sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 md:gap-3">
            <div className="relative" style={{ marginTop: "4px", marginBottom: "-12px" }}>
              <img
                src="/logo-irontrack.png"
                alt={t('ui.irontrack.logo')}
                className="h-10 md:h-20 w-auto object-contain"
                style={{ filter: "drop-shadow(0 0 12px rgba(249,115,22,0.4))" }}
              />
            </div>
            <span className="text-lg md:text-xl font-bold text-[color:var(--text-primary)]">{t('ui.irontrack')}<span className="hidden md:inline">{t('ui.project.pulse')}</span>
            </span>
          </Link>
          <Link href="/" className="text-sm text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] transition-colors">{t('ui.back.to.home.054e10')}
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 md:px-6 py-12 md:py-16">
        {/* Page Title */}
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-[color:var(--text-primary)] mb-2">{t('ui.release.notes')}</h1>
          <p className="text-[color:var(--text-secondary)]">{t('ui.what.s.new.in.irontrack.project.pulse')}</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 mb-10 border-b border-[#1F1F25] pb-0">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab
                  ? "text-[#F97316] border-[#F97316]"
                  : "text-[color:var(--text-secondary)] border-transparent hover:text-[color:var(--text-primary)]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Release Cards */}
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-[color:var(--text-muted)] text-lg">{t('ui.no.release.notes.yet.for')} {activeTab}.</p>
            <p className="text-gray-600 text-sm mt-2">{t('ui.check.back.soon')}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filtered.map((release) => {
              const colors = platformColors[release.platform];
              return (
                <div
                  key={`${release.platform}-${release.version}`}
                  className={`bg-[#121217] border border-[#1F1F25] border-l-4 ${colors.leftBorder} rounded-2xl p-6 md:p-8`}
                >
                  {/* Card Header */}
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold ${colors.bg} ${colors.text} border ${colors.border}`}
                    >
                      {release.platform}
                    </span>
                    <span className="text-sm font-mono font-semibold text-[color:var(--text-primary)]">{release.version}</span>
                    <span className="text-gray-600">•</span>
                    <span className="text-sm text-[color:var(--text-secondary)]">{release.date}</span>
                  </div>

                  {/* Release Title */}
                  <h2 className="text-xl font-bold text-[color:var(--text-primary)] mb-4">{release.title}</h2>

                  {/* Changes */}
                  <ul className="space-y-2">
                    {release.changes.map((change, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-[color:var(--text-secondary)]">
                        <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${colors.text.replace("text-", "bg-")}`} />
                        {change}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#1F1F25] py-6 mt-12">
        <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#F97316]" />
            <span className="text-sm text-[color:var(--text-muted)]">{t('ui.2026.irontrack.development.llc.all.rights.reserved')}</span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/terms" className="text-[color:var(--text-muted)] hover:text-[#F97316] transition-colors">{t('ui.terms')}</Link>
            <span className="text-gray-700">•</span>
            <Link href="/privacy" className="text-[color:var(--text-muted)] hover:text-[#F97316] transition-colors">{t('ui.privacy')}</Link>
            <span className="text-gray-700">•</span>
            <Link href="/status" className="text-[color:var(--text-muted)] hover:text-[#F97316] transition-colors">{t('ui.status')}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
