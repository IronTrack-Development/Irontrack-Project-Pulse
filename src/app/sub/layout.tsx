"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase-browser";
import { t } from "@/lib/i18n";

export default function SubLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col">
      {/* Top navbar */}
      <header className="border-b border-[var(--border-primary)] bg-[var(--bg-primary)] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Building2 className="w-6 h-6 text-[#F97316]" />
            <span className="text-lg font-bold text-[color:var(--text-primary)]">{t('ui.irontrack')} <span className="text-[#F97316]">{t('ui.pulse')}</span>
            </span>
            <span className="hidden sm:inline-block text-xs text-[color:var(--text-muted)] border border-[#2A2A30] rounded px-2 py-0.5 ml-1">{t('ui.sub.portal')}
            </span>
          </Link>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">{t('ui.sign.out')}</span>
          </button>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1">{children}</main>
    </div>
  );
}
