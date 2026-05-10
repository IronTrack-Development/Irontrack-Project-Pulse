"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  Bell,
  Briefcase,
  ClipboardList,
  FolderOpen,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Mail,
  Plus,
  Settings,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase-browser";

const navItems = [
  { href: "/sub/dashboard", label: "Owner Snapshot", icon: BarChart3 },
  { href: "/sub/dispatch", label: "Work Cards", icon: ClipboardList },
  { href: "/sub/dashboard#job-inbox", label: "Job Inbox", icon: Mail },
  { href: "/sub/check-in", label: "Proof Center", icon: ShieldCheck },
  { href: "/sub/blockers", label: "Responses", icon: LayoutDashboard },
  { href: "/sub/dashboard#reports", label: "Reports", icon: BarChart3 },
  { href: "/sub/dashboard#job-inbox", label: "Projects", icon: Briefcase },
  { href: "/sub/crew", label: "Team", icon: Users },
  { href: "/sub/settings", label: "Settings", icon: Settings },
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
    <div className="min-h-screen bg-[#050607] text-white">
      <div className="flex min-h-screen">
        <aside className="hidden w-[260px] shrink-0 border-r border-white/10 bg-[linear-gradient(180deg,#080B0E,#050607_48%,#0D0A07)] md:flex md:flex-col">
          <div className="border-b border-white/10 px-5 py-4">
            <Link href="/sub/dashboard" className="flex items-center gap-3">
              <img src="/irontrack-field-pulse-logo-dark.svg" alt="IronTrack Field Pulse" className="h-12 w-auto" />
            </Link>
            <div className="mt-3 flex items-center gap-3">
              <span className="h-px flex-1 bg-white/15" />
              <span className="text-[10px] font-black uppercase tracking-[0.24em] text-white/45">Admin Portal</span>
            </div>
          </div>

          <nav className="flex-1 space-y-1 px-3 py-4">
            {navItems.map(({ href, label, icon: Icon }) => {
              const pathOnly = href.split("#")[0];
              const active = href.includes("#") ? false : pathname === pathOnly;
              return (
                <Link
                  key={`${href}-${label}`}
                  href={href}
                  className={`group flex min-h-[44px] items-center gap-3 rounded-lg border px-3 py-2.5 text-sm font-semibold transition-all ${
                    active
                      ? "border-[#F97316]/40 bg-[#F97316]/15 text-[#F97316] shadow-[inset_3px_0_0_#F97316]"
                      : "border-transparent text-slate-400 hover:border-white/10 hover:bg-white/[0.04] hover:text-white"
                  }`}
                >
                  <Icon size={17} className={active ? "text-[#F97316]" : "text-slate-500 group-hover:text-slate-300"} />
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="space-y-3 border-t border-white/10 p-4">
            <Link
              href="/sub/dispatch"
              className="flex min-h-[52px] items-center justify-center gap-2 rounded-lg bg-[#F97316] px-4 py-3 text-sm font-black text-white shadow-[0_16px_38px_rgba(249,115,22,0.24)]"
            >
              <Plus size={18} />
              New Work Card
            </Link>
            <Link
              href="mailto:irontrackdevelopment@outlook.com"
              className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-400 hover:text-white"
            >
              <HelpCircle size={18} />
              <span>
                <span className="block font-semibold">Need Help?</span>
                <span className="block text-xs text-slate-500">Contact Support</span>
              </span>
            </Link>
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-500 transition-colors hover:bg-red-500/10 hover:text-red-300"
            >
              <LogOut size={15} />
              Sign out
            </button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-40 border-b border-white/10 bg-[#07090B]/92 backdrop-blur-xl">
            <div className="flex min-h-[72px] items-center justify-between gap-4 px-4 md:px-6">
              <div className="flex items-center gap-3 md:hidden">
                <img src="/irontrack-field-pulse-logo-dark.svg" alt="IronTrack Field Pulse" className="h-9 w-auto" />
              </div>
              <div className="hidden items-center gap-3 md:flex">
                <span className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                  Admin Portal
                </span>
              </div>

              <div className="ml-auto flex items-center gap-3">
                <Link
                  href="/sub/dashboard"
                  className="hidden min-h-[38px] items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-bold text-white md:flex"
                >
                  <Briefcase size={15} className="text-slate-400" />
                  Summit Electrical
                </Link>
                <button className="relative grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/[0.03] text-slate-300">
                  <Bell size={17} />
                  <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-[#F97316] px-1 text-[10px] font-black text-white">
                    7
                  </span>
                </button>
                <button className="hidden h-10 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] pl-1 pr-3 text-sm font-bold text-white sm:flex">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-slate-700 text-xs">AD</span>
                  <UserRound size={14} className="text-slate-400" />
                </button>
              </div>
            </div>
          </header>

          <main className="flex-1 bg-[radial-gradient(circle_at_80%_0%,rgba(249,115,22,0.08),transparent_28%),#050607]">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
