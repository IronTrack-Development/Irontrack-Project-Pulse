"use client";

import type { ReadyCheckStatus } from "@/types";
import { useTranslation } from "@/lib/i18n";

const { t } = useTranslation();

interface ReadyCheckBadgeProps {
  status: ReadyCheckStatus;
  sentAt?: string;
  followUpCount?: number;
  onClick?: () => void;
}

const STATUS_CONFIG: Record<
  ReadyCheckStatus,
  { label: string; bg: string; text: string; dot: string }
> = {
  draft: {
    label: t('status.draft'),
    bg: "bg-[color:var(--bg-tertiary)]",
    text: "text-[color:var(--text-secondary)]",
    dot: "bg-gray-500",
  },
  sent: {
    label: t('ui.sent.35f49d'),
    bg: "bg-[#3B82F6]/15",
    text: "text-[#3B82F6]",
    dot: "bg-[#3B82F6]",
  },
  awaiting_response: {
    label: t('ui.awaiting.response.0131b9'),
    bg: "bg-[#EAB308]/15",
    text: "text-[#EAB308]",
    dot: "bg-[#EAB308]",
  },
  confirmed: {
    label: t('ui.confirmed'),
    bg: "bg-[#22C55E]/15",
    text: "text-[#22C55E]",
    dot: "bg-[#22C55E]",
  },
  no_response: {
    label: t('ui.no.response'),
    bg: "bg-[#EF4444]/15",
    text: "text-[#EF4444]",
    dot: "bg-[#EF4444]",
  },
  issue_flagged: {
    label: t('ui.issue.flagged'),
    bg: "bg-[#EF4444]/15",
    text: "text-[#EF4444]",
    dot: "bg-[#EF4444]",
  },
};

export default function ReadyCheckBadge({
  status,
  followUpCount,
  onClick,
}: ReadyCheckBadgeProps) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.sent;

  const badge = (
    <span
      className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full ${config.bg} ${config.text} ${onClick ? "cursor-pointer hover:opacity-80 transition-opacity" : ""}`}
      onClick={onClick}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${config.dot}`} />{t('ui.ready.check.1b41ae')} {config.label}
      {followUpCount && followUpCount > 0 ? (
        <span className="opacity-70">({followUpCount}{t('ui.x.follow.up')}</span>
      ) : null}
    </span>
  );

  return badge;
}
