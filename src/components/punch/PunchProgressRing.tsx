"use client";

import { useTranslation } from "@/lib/i18n";

const { t } = useTranslation();
interface PunchProgressRingProps {
  total: number;
  closed: number;
  size?: number;
  strokeWidth?: number;
}

export default function PunchProgressRing({
  total,
  closed,
  size = 120,
  strokeWidth = 10,
}: PunchProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percent = total > 0 ? closed / total : 0;
  const offset = circumference * (1 - percent);

  // Color: red → yellow → green
  let ringColor: string;
  if (percent >= 0.8) ringColor = "#22C55E";
  else if (percent >= 0.5) ringColor = "#EAB308";
  else ringColor = "#EF4444";

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#1F1F25"
            strokeWidth={strokeWidth}
          />
          {/* Progress arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={ringColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.6s ease, stroke 0.4s ease" }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-[color:var(--text-primary)] leading-none">{closed}/{total}</span>
          <span className="text-xs text-[color:var(--text-muted)] mt-0.5">{t('ui.done.e9b450')}</span>
        </div>
      </div>
    </div>
  );
}
