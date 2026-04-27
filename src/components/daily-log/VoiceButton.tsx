"use client";

import { Mic, MicOff } from "lucide-react";
import { t } from "@/lib/i18n";

interface VoiceButtonProps {
  isListening: boolean;
  isSupported: boolean;
  onClick: () => void;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function VoiceButton({
  isListening,
  isSupported,
  onClick,
  size = "md",
  className = "",
}: VoiceButtonProps) {
  if (!isSupported) return null;

  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
  };

  const iconSizes = { sm: 14, md: 18, lg: 22 };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        ${sizeClasses[size]} rounded-full flex items-center justify-center
        transition-all duration-200 shrink-0
        ${isListening
          ? "bg-red-500/20 text-red-400 ring-2 ring-red-500/50 animate-pulse"
          : "bg-[#F97316]/10 text-[#F97316] hover:bg-[#F97316]/20 active:scale-95"
        }
        ${className}
      `}
      aria-label={isListening ? t('ui.stop.recording') : t('ui.start.voice.input')}
    >
      {isListening ? (
        <MicOff size={iconSizes[size]} />
      ) : (
        <Mic size={iconSizes[size]} />
      )}
    </button>
  );
}
