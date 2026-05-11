"use client";

import { cn } from "@/lib/cn";

type Variant = "light" | "dark" | "theme";

function StylizedA({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 28" className={className} aria-hidden>
      <path d="M 2 26 L 10 2 L 18 26 H 14.2 L 10 11 L 5.8 26 Z" fill="currentColor" />
      <path d="M 10 13.5 L 6.8 22.5 L 13.2 22.5 Z" fill="#F37021" />
    </svg>
  );
}

/**
 * Brand lockup: hex mark + IRONTRACK (custom A) + FIELD PULSE rule.
 * `theme` uses `var(--text-primary)` for wordmark ink (sidebars / themed shells).
 */
export default function IronTrackFieldPulseWordmark({
  variant = "light",
  compact = false,
  className,
}: {
  variant?: Variant;
  compact?: boolean;
  className?: string;
}) {
  const orange = "#F37021";
  const ink =
    variant === "theme"
      ? "var(--text-primary)"
      : variant === "light"
        ? "#0f172a"
        : "#f8fafc";
  const markSize = compact ? "h-9 w-9" : "h-10 w-10 md:h-11 md:w-11";
  const titleSize = compact ? "text-lg" : "text-xl md:text-2xl";
  const subSize = compact ? "text-[9px] tracking-[0.2em]" : "text-[10px] md:text-xs tracking-[0.22em]";

  return (
    <div className={cn("flex items-center gap-2.5 md:gap-3 min-w-0", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/irontrack-field-pulse-mark.svg"
        alt=""
        width={44}
        height={44}
        className={cn("shrink-0 object-contain", markSize)}
      />
      <div className="min-w-0 leading-tight">
        <div
          className={cn("flex items-baseline font-extrabold tracking-tight", titleSize)}
          style={{ color: ink }}
        >
          <span className="whitespace-nowrap">IRONTR</span>
          <StylizedA
            className={cn(
              "mx-[0.04em] inline-block align-[-0.12em] text-current",
              compact ? "h-[1.05em] w-[0.52em]" : "h-[1.05em] w-[0.55em]"
            )}
          />
          <span className="whitespace-nowrap">CK</span>
        </div>
        <div
          className={cn("mt-0.5 flex items-center gap-2 font-bold uppercase", subSize)}
          style={{ color: orange }}
        >
          <span className="h-px w-5 md:w-8 shrink-0 bg-current opacity-70" aria-hidden />
          <span className="whitespace-nowrap">Field Pulse</span>
          <span className="h-px w-5 md:w-8 shrink-0 bg-current opacity-70" aria-hidden />
        </div>
      </div>
    </div>
  );
}
