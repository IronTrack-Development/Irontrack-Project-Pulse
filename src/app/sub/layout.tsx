"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRightLeft,
  BarChart3,
  BookOpen,
  Building2,
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

const subNavItems = [
  { href: "/sub/dashboard", label: "Dashboard", icon: LayoutDashboard, helper: "Daily command" },
  { href: "/sub/dispatch", label: "Dispatch", icon: Send, helper: "Crew direction" },
  { href: "/sub/check-in", label: "Daily Check-In", icon: ClipboardCheck, helper: "Field reports" },
  { href: "/sub/production", label: "Production", icon: BarChart3, helper: "Quantities" },
  { href: "/sub/blockers", label: "Blockers", icon: AlertTriangle, helper: "Issues to clear" },
  { href: "/sub/handoffs", label: "Handoffs", icon: ArrowRightLeft, helper: "Area turnover" },
  { href: "/sub/sops", label: "SOPs", icon: BookOpen, helper: "Crew standards" },
  { href: "/sub/crew", label: "Crew", icon: Users, helper: "People" },
  { href: "/sub/foremen", label: "Foremen", icon: HardHat, helper: "Leads" },
];

const fieldLoopItems = [
  { href: "/sub/dispatch", labelKey: "subops.plan", short: "Dispatch" },
  { href: "/sub/check-in", labelKey: "subops.start", short: "Check in" },
  { href: "/sub/production", labelKey: "subops.track", short: "Production" },
  { href: "/sub/blockers", labelKey: "subops.clear", short: "Blockers" },
  { href: "/sub/handoffs", labelKey: "subops.handOff", short: "Turnover" },
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
    <div className="min-h-screen bg-[linear-gradient(180deg,rgba(59,130,246,0.08),transparent_260px),var(--bg-primary)] flex">
      <aside className="hidden md:flex h-screen w-72 shrink-0 sticky top-0 flex-col border-r border-white/10 bg-[rgba(15,23,42,0.88)] shadow-[18px_0_70px_rgba(0,0,0,0.22)] backdrop-blur-xl">
        <div className="border-b border-white/10 px-5 py-5">
          <Link href="/sub/dashboard" className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-lg border border-[#3B82F6]/30 bg-[#3B82F6]/15 shadow-[0_14px_40px_rgba(59,130,246,0.18)]">
              <Building2 className="h-5 w-5 text-[#60A5FA]" />
            </span>
            <span>
              <span className="block text-sm font-black leading-none text-white">
                IronTrack <span className="text-[#60A5FA]">Pulse</span>
              </span>
              <span className="mt-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-[#F97316]">
                Sub Portal
              </span>
            </span>
          </Link>
        </div>

        <div className="border-b border-white/10 px-4 py-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">{t('subops.todaysLoop')}</p>
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
                    active ? "border-[#F97316]/40 bg-[#F97316]/15 text-white" : "border-white/10 bg-white/[0.03] text-slate-400 hover:text-white"
                  }`}
                >
                  <span className={`grid h-6 w-6 place-items-center rounded-full text-[10px] font-black ${active ? "bg-[#F97316] text-white" : "bg-white/10 text-slate-500"}`}>
                    {index + 1}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs font-black">{t(item.labelKey)}</span>
                    <span className="block text-[11px] text-slate-500">{item.short}</span>
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">
            Operations
          </div>
          {subNavItems.map(({ href, label, helper, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`group flex items-center gap-3 rounded-lg border px-3 py-3 transition-all ${
                  active
                    ? "border-[#3B82F6]/40 bg-[#3B82F6]/15 text-white shadow-[0_16px_45px_rgba(59,130,246,0.16)]"
                    : "border-transparent text-slate-400 hover:border-white/10 hover:bg-white/5 hover:text-white"
                }`}
              >
                <span
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${
                    active ? "bg-[#3B82F6] text-white" : "bg-white/5 text-slate-400 group-hover:text-[#93C5FD]"
                  }`}
                >
                  <Icon size={16} />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-bold">{label}</span>
                  <span className="block truncate text-xs text-slate-500">{helper}</span>
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="space-y-3 border-t border-white/10 px-4 py-4">
          <div className="rounded-lg border border-[#22C55E]/20 bg-[#22C55E]/10 p-3">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#86EFAC]">{t('subops.fieldReady')}</p>
            <p className="mt-1 text-xs leading-5 text-slate-400">Built for fast updates, clear blockers, and clean GC reports.</p>
          </div>
          <Link
            href="/sub/settings"
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-400 transition-colors hover:bg-white/5 hover:text-[#93C5FD]"
          >
            <Settings size={14} />
            Settings
          </Link>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-400 transition-colors hover:bg-red-500/10 hover:text-red-300"
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      </aside>

      <div className="md:hidden fixed left-0 right-0 top-0 z-50 border-b border-white/10 bg-[rgba(15,23,42,0.92)] backdrop-blur-xl">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/sub/dashboard" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg border border-[#3B82F6]/25 bg-[#3B82F6]/15">
              <Building2 className="h-4 w-4 text-[#60A5FA]" />
            </span>
            <span className="text-sm font-black text-white">
              Iron<span className="text-[#60A5FA]">Track</span>
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#F97316]">Sub</span>
          </Link>
          <button
            onClick={handleLogout}
            className="grid h-9 w-9 place-items-center rounded-xl text-slate-400 transition-colors hover:bg-red-500/10 hover:text-red-300"
            aria-label="Sign out"
          >
            <LogOut size={16} />
          </button>
        </div>
        <div className="flex gap-1 overflow-x-auto px-3 pb-3 scrollbar-none">
          {subNavItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex min-h-[40px] shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-xs font-bold whitespace-nowrap transition-all ${
                  active
                    ? "bg-[#3B82F6] text-white shadow-[0_8px_24px_rgba(59,130,246,0.28)]"
                    : "bg-white/5 text-slate-400 hover:text-white"
                }`}
              >
                <Icon size={12} />
                {label}
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
