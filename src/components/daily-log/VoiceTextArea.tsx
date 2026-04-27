"use client";

import { useState, useCallback } from "react";
import { useVoiceInput } from "@/lib/use-voice-input";
import VoiceButton from "./VoiceButton";

interface VoiceTextAreaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  rows?: number;
  className?: string;
}

export default function VoiceTextArea({
  value,
  onChange,
  placeholder = "Tap mic or type...",
  label,
  rows = 3,
  className = "",
}: VoiceTextAreaProps) {
  const [interim, setInterim] = useState("");

  const handleResult = useCallback(
    (text: string) => {
      const separator = value.trim() ? " " : "";
      onChange(value + separator + text);
      setInterim("");
    },
    [value, onChange]
  );

  const handleInterim = useCallback((text: string) => {
    setInterim(text);
  }, []);

  const { isListening, isSupported, toggleListening } = useVoiceInput({
    onResult: handleResult,
    onInterim: handleInterim,
  });

  return (
    <div className={className}>
      {label && (
        <label className="block text-xs font-medium text-[color:var(--text-secondary)] mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className="w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl px-4 py-3 pr-14
            text-sm text-[color:var(--text-primary)] placeholder-gray-600 resize-none
            focus:outline-none focus:border-[#F97316]/50 focus:ring-1 focus:ring-[#F97316]/20
            transition-colors"
        />
        {/* Interim text preview */}
        {interim && (
          <div className="absolute bottom-14 left-4 right-14 text-xs text-[color:var(--text-muted)] italic truncate">
            {interim}...
          </div>
        )}
        {/* Mic button */}
        <div className="absolute bottom-2 right-2">
          <VoiceButton
            isListening={isListening}
            isSupported={isSupported}
            onClick={toggleListening}
            size="md"
          />
        </div>
      </div>
    </div>
  );
}
