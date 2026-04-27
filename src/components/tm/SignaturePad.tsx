"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { X, RotateCcw, Check } from "lucide-react";
import { t } from "@/lib/i18n";

interface SignaturePadProps {
  onDone: (base64Png: string) => void;
  onCancel: () => void;
  label?: string;
}

export default function SignaturePad({ onDone, onCancel, label = "Sign Here" }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  // Set canvas size to match display size
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.fillStyle = "#1A1A22";
    ctx.fillRect(0, 0, rect.width, rect.height);
    ctx.strokeStyle = "#F97316";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  const getPos = (e: React.TouchEvent | React.MouseEvent): { x: number; y: number } => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      const touch = e.touches[0];
      return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
    }
    return {
      x: (e as React.MouseEvent).clientX - rect.left,
      y: (e as React.MouseEvent).clientY - rect.top,
    };
  };

  const startDraw = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    setIsDrawing(true);
    setIsEmpty(false);
    const pos = getPos(e);
    lastPos.current = pos;
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) {
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 1.25, 0, Math.PI * 2);
      ctx.fillStyle = "#F97316";
      ctx.fill();
    }
  }, []);

  const draw = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      if (!isDrawing) return;
      e.preventDefault();
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!ctx || !lastPos.current) return;
      const pos = getPos(e);
      ctx.beginPath();
      ctx.moveTo(lastPos.current.x, lastPos.current.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      lastPos.current = pos;
    },
    [isDrawing]
  );

  const endDraw = useCallback(() => {
    setIsDrawing(false);
    lastPos.current = null;
  }, []);

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#1A1A22";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.strokeStyle = "#F97316";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    setIsEmpty(true);
  };

  const done = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    onDone(dataUrl);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full sm:max-w-md bg-[var(--bg-secondary)] rounded-t-2xl sm:rounded-2xl border border-[var(--border-primary)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-primary)]">
          <h3 className="text-[color:var(--text-primary)] font-semibold text-sm">{label}</h3>
          <button
            onClick={onCancel}
            className="p-2 text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <X size={18} />
          </button>
        </div>

        {/* Instruction */}
        <p className="text-xs text-[color:var(--text-muted)] text-center pt-3 pb-1 px-4">{t('ui.sign.with.your.finger.in.the.box.below')}
        </p>

        {/* Canvas */}
        <div className="px-4 py-2">
          <canvas
            ref={canvasRef}
            className="w-full rounded-xl border border-[var(--border-primary)] touch-none cursor-crosshair"
            style={{ height: 200, display: "block" }}
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={endDraw}
            onMouseLeave={endDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={endDraw}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2 px-4 pb-4 pt-2">
          <button
            onClick={clear}
            className="flex items-center gap-1.5 px-4 py-3 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] text-[color:var(--text-secondary)] rounded-xl text-sm font-medium transition-colors min-h-[44px] flex-1 justify-center"
          >
            <RotateCcw size={15} />{t('ui.clear')}
          </button>
          <button
            onClick={done}
            disabled={isEmpty}
            className="flex items-center gap-1.5 px-4 py-3 bg-[#F97316] hover:bg-[#ea6c10] disabled:opacity-40 disabled:cursor-not-allowed text-[color:var(--text-primary)] rounded-xl text-sm font-bold transition-colors min-h-[44px] flex-1 justify-center"
          >
            <Check size={15} />{t('ui.done.e9b450')}
          </button>
        </div>
      </div>
    </div>
  );
}
