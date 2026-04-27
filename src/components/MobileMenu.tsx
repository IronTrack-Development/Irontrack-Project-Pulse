"use client";
import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { t } from "@/lib/i18n";

export default function MobileMenu() {
  const [open, setOpen] = useState(false);
  return (
    <div className="md:hidden">
      <button onClick={() => setOpen(!open)} className="text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] p-2">
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>
      {open && (
        <div className="absolute top-full left-0 right-0 bg-[var(--bg-primary)] border-b border-[var(--border-primary)] px-4 py-4 flex flex-col gap-4 z-50">
          <a href="#about" onClick={() => setOpen(false)} className="text-sm text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]">{t('ui.about.us')}</a>
          <a href="#who-we-serve" onClick={() => setOpen(false)} className="text-sm text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]">{t('ui.who.we.serve')}</a>
          <a href="#features" onClick={() => setOpen(false)} className="text-sm text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]">{t('ui.features')}</a>
          <a href="#pricing" onClick={() => setOpen(false)} className="text-sm text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]">{t('ui.pricing')}</a>
          <Link href="/status" onClick={() => setOpen(false)} className="text-sm text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]">{t('ui.status')}</Link>
          <Link href="/release-notes" onClick={() => setOpen(false)} className="text-sm text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]">{t('ui.release.notes')}</Link>
        </div>
      )}
    </div>
  );
}
