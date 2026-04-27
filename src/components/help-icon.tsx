'use client';

import { HelpCircle } from 'lucide-react';
import { openSupportEmail } from '@/lib/support-email';
import { useTranslation } from "@/lib/i18n";

const { t } = useTranslation();

interface HelpIconProps {
  context?: string;
}

export function HelpIcon({ context }: HelpIconProps) {
  return (
    <button
      onClick={() => openSupportEmail(context)}
      className="p-2 rounded-lg bg-[#1F1F25] hover:bg-[#2a2a35] text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] transition-colors"
      title={t('ui.report.a.problem')}
    >
      <HelpCircle size={16} />
    </button>
  );
}
