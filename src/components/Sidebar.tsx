"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { t } from "@/lib/i18n";

import {
  LayoutDashboard,
  FolderOpen,
  Upload,
  Home,
  Settings,
  Zap,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: t('ui.dashboard'), icon: LayoutDashboard },
  { href: "/projects", label: t('ui.projects'), icon: FolderOpen },
  { href: "/upload", label: t('ui.upload'), icon: Upload },
  { href: "/settings", label: t('settings.title'), icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-64 bg-[var(--bg-secondary)] border-r border-[var(--border-primary)] h-full shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-[var(--border-primary)]">
        <div className="relative w-8 h-8">
          <Image
            src="/icon-192.png"
            alt={t('ui.irontrack.pulse.logo')}
            fill
            className="object-contain"
            onError={() => {}}
          />
        </div>
        <div>
          <div className="font-bold text-[color:var(--text-primary)] text-sm leading-none">{t('ui.irontrack')} <span className="text-[#F97316]">{t('ui.pulse')}</span></div>
          <div className="text-[10px] text-[color:var(--text-muted)] font-medium mt-0.5">{t('ui.run.your.job.don.t.chase.it')}</div>
        </div>
      </div>

      {/* Status pill */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-2 bg-[var(--bg-primary)] rounded-lg px-3 py-2 border border-[var(--border-primary)]">
          <Zap size={13} className="text-[#F97316]" />
          <span className="text-xs text-[color:var(--text-secondary)]">{t('ui.field.intelligence')}</span>
          <span className="ml-auto w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2">
        <div className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest px-2 mb-2">{t('ui.navigation')}</div>
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 transition-all text-sm font-medium ${
                active
                  ? "bg-[#F97316]/15 text-[#F97316] border border-[#F97316]/20"
                  : "text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] hover:bg-white/5"
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
          href="/"
          className="flex items-center gap-2 text-sm text-[color:var(--text-muted)] hover:text-[#F97316] transition-colors"
        >
          <Home size={14} />{t('ui.landing.page')}
        </Link>
        <div className="text-xs text-gray-600">{t('ui.v1.4.0')}</div>
      </div>
    </aside>
  );
}
