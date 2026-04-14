"use client";

import type { ReadyCheckStatus } from "@/types";

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
    label: "Draft",
    bg: "bg-gray-800",
    text: "text-gray-400",
    dot: "bg-gray-500",
  },
  sent: {
    label: "Sent",
    bg: "bg-[#3B82F6]/15",
    text: "text-[#3B82F6]",
    dot: "bg-[#3B82F6]",
  },
  awaiting_response: {
    label: "Awaiting Response",
    bg: "bg-[#EAB308]/15",
    text: "text-[#EAB308]",
    dot: "bg-[#EAB308]",
  },
  confirmed: {
    label: "✓ Confirmed",
    bg: "bg-[#22C55E]/15",
    text: "text-[#22C55E]",
    dot: "bg-[#22C55E]",
  },
  no_response: {
    label: "No Response",
    bg: "bg-[#EF4444]/15",
    text: "text-[#EF4444]",
    dot: "bg-[#EF4444]",
  },
  issue_flagged: {
    label: "⚠ Issue Flagged",
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
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${config.dot}`} />
      Ready Check · {config.label}
      {followUpCount && followUpCount > 0 ? (
        <span className="opacity-70">({followUpCount}x follow-up)</span>
      ) : null}
    </span>
  );

  return badge;
}
