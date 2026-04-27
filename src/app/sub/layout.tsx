"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Building2, LogOut, LayoutDashboard, Send, ClipboardCheck,
  BarChart3, AlertTriangle, BookOpen, ArrowRightLeft, Users,
  HardHat, FileText, Settings,
} from "lucide-react";
import { createClient } from "@/lib/supabase-browser";

const subNavItems = [
  { href: "/sub/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/sub/dispatch", label: "Dispatch", icon: Send },
  { href: "/sub/check-in", label: "Daily Check-In", icon: ClipboardCheck },
  { href: "/sub/production", label: "Production", icon: BarChart3 },
  { href: "/sub/blockers", label: "Blockers", icon: AlertTriangle },
  { href: "/sub/sops", label: "SOPs", icon: BookOpen },
  { href: "/sub/handoffs", label: "Handoffs", icon: ArrowRightLeft },
  { href: "/sub/crew", label: "Crew", icon: Users },
  { href: "/sub/foremen", label: "Foremen", icon: HardHat },
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
    <div className="min-h-screen bg-[var(--bg-primary)] flex">
      {/* Sidebar — Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-[var(--bg-secondary)] border-r border-[var(--border-primary)] h-screen sticky top-0 shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-[var(--border-primary)]">
          <Building2 className="w-7 h-7 text-[#3B82F6]" />
          <div>
            <div className="font-bold text-[color:var(--text-primary)] text-sm leading-none">
              IronTrack <span className="text-[#3B82F6]">Pulse</span>
            </div>
            <div className="text-[10px] text-[#3B82F6] font-semibold mt-0.5 uppercase tracking-wider">
              Sub Portal
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <div className="text-[10px] font-semibold text-[color:var(--text-muted)] uppercase tracking-widest px-2 mb-2">
            Operations
          </div>
          {subNavItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 transition-all text-sm font-medium ${
                  active
                    ? "bg-[#3B82F6]/15 text-[#3B82F6] border border-[#3B82F6]/20"
                    : "text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] hover:bg-[var(--bg-hover)]"
                }`}
              >
                <Icon size={16} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-[var(--border-primary)] space-y-3">
          <Link
            href="/sub/settings"
            className="flex items-center gap-2 text-sm text-[color:var(--text-muted)] hover:text-[#3B82F6] transition-colors"
          >
            <Settings size={14} />
            Settings
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-[color:var(--text-muted)] hover:text-red-400 transition-colors w-full"
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-[var(--bg-primary)] border-b border-[var(--border-primary)]">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#3B82F6]" />
            <span className="text-sm font-bold text-[color:var(--text-primary)]">
              Iron<span className="text-[#3B82F6]">Track</span>
            </span>
            <span className="text-[10px] text-[#3B82F6] font-semibold uppercase">Sub</span>
          </div>
          <button
            onClick={handleLogout}
            className="text-[color:var(--text-muted)] hover:text-red-400"
          >
            <LogOut size={16} />
          </button>
        </div>
        {/* Mobile nav scroll */}
        <div className="flex gap-1 px-3 pb-2 overflow-x-auto scrollbar-none">
          {subNavItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition-all ${
                  active
                    ? "bg-[#3B82F6] text-white"
                    : "bg-[var(--bg-tertiary)] text-[color:var(--text-secondary)]"
                }`}
              >
                <Icon size={12} />
                {label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 min-h-screen md:pt-0 pt-[100px]">
        {children}
      </main>
    </div>
  );
}
