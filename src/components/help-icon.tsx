'use client';

import { HelpCircle } from 'lucide-react';
import { openSupportEmail } from '@/lib/support-email';

interface HelpIconProps {
  context?: string;
}

export function HelpIcon({ context }: HelpIconProps) {
  return (
    <button
      onClick={() => openSupportEmail(context)}
      className="p-2 rounded-lg bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] text-gray-400 hover:text-white transition-colors"
      title="Report a problem"
    >
      <HelpCircle size={16} />
    </button>
  );
}
