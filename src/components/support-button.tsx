'use client';

import { Mail } from 'lucide-react';
import { openSupportEmail } from '@/lib/support-email';

interface SupportButtonProps {
  context?: string;
  variant?: 'default' | 'inline';
}

export function SupportButton({ context, variant = 'default' }: SupportButtonProps) {
  if (variant === 'inline') {
    return (
      <button
        onClick={() => openSupportEmail(context)}
        className="text-sm text-[color:var(--text-secondary)] hover:text-[color:var(--text-secondary)] underline"
      >
        Report this error →
      </button>
    );
  }

  return (
    <button
      onClick={() => openSupportEmail(context)}
      className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-[color:var(--text-secondary)] hover:bg-[#1A1A20] hover:border-[#2A2A30] transition-colors"
    >
      <Mail className="w-4 h-4" />
      Report a Problem
    </button>
  );
}
