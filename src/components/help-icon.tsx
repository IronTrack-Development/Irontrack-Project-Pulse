'use client';

import { HelpCircle } from 'lucide-react';
import { openSupportEmail } from '@/lib/support-email';
import { t } from "@/lib/i18n";

interface HelpIconProps {
  context?: string;
}

export function HelpIcon({ context }: HelpIconProps) {
  return (
    <button
      onClick={() => openSupportEmail(context)}
      className="p-2 rounded-lg bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] transition-colors"
      title={t('ui.report.a.problem')}
    >
      <HelpCircle size={16} />
    </button>
  );
}
