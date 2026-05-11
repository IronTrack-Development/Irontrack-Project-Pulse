"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderOpen,
  Upload,
  Home,
  Settings,
  Zap,
} from "lucide-react";
import { t } from "@/lib/i18n";
import IronTrackFieldPulseWordmark from "@/components/branding/IronTrackFieldPulseWordmark";

const navItems = [
  { href: "/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { href: "/projects", labelKey: "nav.projects", icon: FolderOpen },
  { href: "/upload", labelKey: "nav.upload", icon: Upload },
  { href: "/settings", labelKey: "nav.settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-64 bg-[var(--bg-secondary)] border-r border-[var(--border-primary)] h-full shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2 px-5 py-4 border-b border-[var(--border-primary)]">
        <Link href="/dashboard" className="min-w-0 hover:opacity-90 transition-opacity">
          <IronTrackFieldPulseWordmark variant="theme" compact className="scale-[0.88] origin-left" />
        </Link>
      </div>

      {/* Status pill */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-2 bg-[var(--bg-primary)] rounded-lg px-3 py-2 border border-[var(--border-primary)]">
          <Zap size={13} className="text-accent" />
          <span className="text-xs text-[color:var(--text-secondary)]">{t('nav.fieldIntelligence')}</span>
          <span className="ml-auto w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2">
        <div className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest px-2 mb-2">{t('nav.navigation')}</div>
        {navItems.map(({ href, labelKey, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 transition-all text-sm font-medium ${
                active
                  ? "bg-accent/15 text-accent border border-accent/20"
                  : "text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] hover:bg-white/5"
              }`}
            >
              <Icon size={16} />
              {t(labelKey)}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-[var(--border-primary)] space-y-3">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm text-[color:var(--text-muted)] hover:text-accent transition-colors"
        >
          <Home size={14} />
          {t('nav.landingPage')}
        </Link>
        <div className="text-xs text-gray-600">v1.4.0</div>
      </div>
    </aside>
  );
}
