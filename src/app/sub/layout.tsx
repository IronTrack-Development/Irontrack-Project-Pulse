"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRightLeft,
  BarChart3,
  BookOpen,
  ClipboardCheck,
  HardHat,
  LayoutDashboard,
  LogOut,
  Send,
  Settings,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase-browser";
import { t } from "@/lib/i18n";
import IronTrackFieldPulseWordmark from "@/components/branding/IronTrackFieldPulseWordmark";

const subNavItems = [
  { href: "/sub/dashboard", labelKey: "subops.dashboard", icon: LayoutDashboard, helperKey: "subops.dailyCommand" },
  { href: "/sub/dispatch", labelKey: "subops.dispatch", icon: Send, helperKey: "subops.crewDirection" },
  { href: "/sub/check-in", labelKey: "subops.dailyCheckIn", icon: ClipboardCheck, helperKey: "subops.fieldReports" },
  { href: "/sub/production", labelKey: "subops.production", icon: BarChart3, helperKey: "subops.quantities" },
  { href: "/sub/blockers", labelKey: "subops.blockers", icon: AlertTriangle, helperKey: "subops.issuesToClear" },
  { href: "/sub/handoffs", labelKey: "subops.handoffs", icon: ArrowRightLeft, helperKey: "subops.areaTurnover" },
  { href: "/sub/sops", labelKey: "subops.sops", icon: BookOpen, helperKey: "subops.crewStandards" },
  { href: "/sub/crew", labelKey: "subops.crew", icon: Users, helperKey: "subops.people" },
  { href: "/sub/foremen", labelKey: "subops.foremen", icon: HardHat, helperKey: "subops.leads" },
];

const fieldLoopItems = [
  { href: "/sub/dispatch", labelKey: "subops.plan", shortKey: "subops.dispatch" },
  { href: "/sub/check-in", labelKey: "subops.start", shortKey: "subops.dailyCheckIn" },
  { href: "/sub/production", labelKey: "subops.track", shortKey: "subops.production" },
  { href: "/sub/blockers", labelKey: "subops.clear", shortKey: "subops.blockers" },
  { href: "/sub/handoffs", labelKey: "subops.handOff", shortKey: "subops.turnover" },
];

export default function SubLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,color-mix(in_srgb,var(--accent)_7%,transparent),transparent_320px),var(--bg-primary)] flex">
      <aside className="hidden md:flex h-screen w-72 shrink-0 sticky top-0 flex-col border-r border-[var(--border-primary)] bg-[var(--bg-secondary)]">
        <div className="border-b border-[var(--border-primary)] px-5 py-4">
          <Link href="/sub/dashboard" className="block min-w-0 hover:opacity-90 transition-opacity">
            <IronTrackFieldPulseWordmark variant="theme" compact className="scale-[0.92] origin-left" />
          </Link>
        </div>

        <div className="border-b border-[var(--border-primary)] px-4 py-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[color:var(--text-muted)]">{t('subops.todaysLoop')}</p>
            <span className="rounded-full bg-[#22C55E]/10 px-2 py-1 text-[10px] font-bold text-[#86EFAC]">{t('subops.fieldReady')}</span>
          </div>
          <div className="space-y-1.5">
            {fieldLoopItems.map((item, index) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 transition-colors ${
                    active ? "border-accent/40 bg-accent/15 text-[color:var(--text-primary)]" : "border-[var(--border-primary)] bg-[var(--bg-tertiary)] text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)]"
                  }`}
                >
                  <span className={`grid h-6 w-6 place-items-center rounded-full text-[10px] font-bold ${active ? "bg-accent text-white" : "bg-[var(--bg-hover)] text-[color:var(--text-muted)]"}`}>
                    {index + 1}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs font-semibold">{t(item.labelKey)}</span>
                    <span className="block text-[11px] text-[color:var(--text-muted)]">{t(item.shortKey)}</span>
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-[color:var(--text-muted)]">
            {t('subops.operations')}
          </div>
          {subNavItems.map(({ href, labelKey, helperKey, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`group flex items-center gap-3 rounded-lg border px-3 py-3 transition-all ${
                    active
                    ? "border-accent/30 bg-accent/10 text-[color:var(--text-primary)]"
                    : "border-transparent text-[color:var(--text-muted)] hover:border-[var(--border-primary)] hover:bg-[var(--bg-hover)] hover:text-[color:var(--text-primary)]"
                }`}
              >
                <span
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${
                    active ? "bg-accent text-white" : "bg-[var(--bg-tertiary)] text-[color:var(--text-muted)] group-hover:text-accent"
                  }`}
                >
                  <Icon size={16} />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">{t(labelKey)}</span>
                  <span className="block truncate text-xs text-[color:var(--text-muted)]">{t(helperKey)}</span>
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="space-y-3 border-t border-[var(--border-primary)] px-4 py-4">
          <div className="rounded-xl border border-[#22C55E]/25 bg-[#22C55E]/10 p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#86EFAC]">{t('subops.fieldReady')}</p>
            <p className="mt-1 text-xs leading-5 text-[color:var(--text-muted)]">{t('subops.fieldReadyDesc')}</p>
          </div>
          <Link
            href="/sub/settings"
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-[color:var(--text-muted)] transition-colors hover:bg-[var(--bg-hover)] hover:text-accent"
          >
            <Settings size={14} />
            {t('subops.settings')}
          </Link>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-[color:var(--text-muted)] transition-colors hover:bg-red-500/10 hover:text-red-300"
          >
            <LogOut size={14} />
            {t('subops.signOut')}
          </button>
        </div>
      </aside>

      <div className="md:hidden fixed left-0 right-0 top-0 z-50 border-b border-[var(--border-primary)] bg-[var(--bg-secondary)]/95 backdrop-blur-md">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/sub/dashboard" className="flex min-w-0 items-center gap-2">
            <img src="/irontrack-field-pulse-mark.svg" alt="" className="h-8 w-8 shrink-0" width={32} height={32} />
            <span className="min-w-0 text-sm font-bold leading-tight text-[color:var(--text-primary)]">
              IronTrack <span className="text-accent">Field Pulse</span>
              <span className="mt-0.5 block text-[9px] font-bold uppercase tracking-wider text-[color:var(--text-muted)]">{t('subops.subPortal')}</span>
            </span>
          </Link>
          <button
            onClick={handleLogout}
            className="grid h-9 w-9 place-items-center rounded-xl text-[color:var(--text-muted)] transition-colors hover:bg-red-500/10 hover:text-red-300"
            aria-label={t('subops.signOut')}
          >
            <LogOut size={16} />
          </button>
        </div>
        <div className="flex gap-1 overflow-x-auto px-3 pb-3 scrollbar-none">
          {subNavItems.map(({ href, labelKey, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex min-h-[40px] shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-xs font-bold whitespace-nowrap transition-all ${
                  active
                    ? "bg-accent text-white"
                    : "bg-[var(--bg-tertiary)] text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)]"
                }`}
              >
                <Icon size={12} />
                {t(labelKey)}
              </Link>
            );
          })}
        </div>
      </div>

      <main className="min-h-screen flex-1 pt-[104px] md:pt-0">
        {children}
      </main>
    </div>
  );
}
