"use client";

/**
 * MarkupWrapper
 * Wraps any content block with markup capability.
 *
 * When `enabled` is true, it captures the wrapped content using html2canvas,
 * then opens the MarkupCanvas fullscreen so the user can annotate it.
 * "Done" calls onSave with a composite image data URL (content + markup).
 */

import { useRef, useState, useEffect } from "react";
import MarkupCanvas, { type MarkupAction } from "./MarkupCanvas";

interface MarkupWrapperProps {
  children: React.ReactNode;
  /** Called with the composite annotated image data URL when the user taps Done */
  onSave: (imageDataUrl: string) => void;
  /** Whether markup mode is currently active */
  enabled: boolean;
  /** Called to exit markup mode (cancel or after save) */
  onDisable: () => void;
}

export default function MarkupWrapper({
  children,
  onSave,
  enabled,
  onDisable,
}: MarkupWrapperProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [capturing, setCapturing] = useState(false);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);

  // Capture the wrapped content whenever enabled becomes true
  useEffect(() => {
    if (!enabled) {
      setScreenshotUrl(null);
      return;
    }

    let cancelled = false;
    setCapturing(true);

    (async () => {
      const el = wrapperRef.current;
      if (!el) {
        setCapturing(false);
        return;
      }
      try {
        // Dynamically import html2canvas to avoid SSR issues
        const html2canvas = (await import("html2canvas")).default;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const canvas = await html2canvas(el, {
          useCORS: true,
          allowTaint: true,
          scale: Math.min(window.devicePixelRatio || 1, 2),
          logging: false,
          backgroundColor: "#0B0B0D",
        } as any);
        if (!cancelled) {
          setScreenshotUrl(canvas.toDataURL("image/jpeg", 0.92));
        }
      } catch (err) {
        console.warn("MarkupWrapper: html2canvas failed", err);
        if (!cancelled) {
          // Open markup without a background image
          setScreenshotUrl("");
        }
      } finally {
        if (!cancelled) setCapturing(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  const handleDone = (_compositeUrl: string, _actions: MarkupAction[]) => {
    onSave(_compositeUrl);
    onDisable();
    setScreenshotUrl(null);
  };

  const handleCancel = () => {
    onDisable();
    setScreenshotUrl(null);
  };

  return (
    <>
      {/* The wrapped content */}
      <div ref={wrapperRef}>{children}</div>

      {/* Capturing spinner */}
      {capturing && (
        <div className="fixed inset-0 z-[9998] bg-black/60 flex items-center justify-center">
          <div className="bg-[#121217] border border-[#1F1F25] rounded-2xl px-6 py-5 flex items-center gap-3">
            <div className="w-5 h-5 rounded-full border-2 border-[#F97316] border-t-transparent animate-spin" />
            <span className="text-[color:var(--text-primary)] text-sm font-semibold">Preparing markup…</span>
          </div>
        </div>
      )}

      {/* Markup canvas — shown once screenshot is ready */}
      {enabled && screenshotUrl !== null && !capturing && (
        <MarkupCanvas
          backgroundImageUrl={screenshotUrl || undefined}
          onDone={handleDone}
          onCancel={handleCancel}
        />
      )}
    </>
  );
}
