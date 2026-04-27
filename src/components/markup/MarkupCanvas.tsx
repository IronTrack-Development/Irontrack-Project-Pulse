"use client";

import { useRef, useState, useEffect, useCallback } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

export type MarkupTool =
  | "pen"
  | "arrow"
  | "circle"
  | "rectangle"
  | "text"
  | "highlighter";

export interface MarkupAction {
  id: string;
  type: MarkupTool;
  color: string;
  strokeWidth: number;
  opacity: number;
  // pen / highlighter
  points?: [number, number][];
  // arrow / circle / rectangle
  start?: [number, number];
  end?: [number, number];
  // text
  text?: string;
  position?: [number, number];
  fontSize?: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────

export const MARKUP_COLORS: { name: string; value: string }[] = [
  { name: "Red", value: "#EF4444" },
  { name: "Orange", value: "#F97316" },
  { name: "Yellow", value: "#EAB308" },
  { name: "Blue", value: "#3B82F6" },
  { name: "White", value: "#FFFFFF" },
  { name: "Black", value: "#000000" },
];

const PEN_STROKE = { thin: 2, medium: 5, thick: 10 } as const;
const HI_STROKE = { thin: 14, medium: 28, thick: 44 } as const;
type SizeKey = keyof typeof PEN_STROKE;

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

// ─── Render a single action onto a canvas context ────────────────────────────

function renderAction(ctx: CanvasRenderingContext2D, a: MarkupAction) {
  ctx.save();
  ctx.globalAlpha = a.opacity;
  ctx.strokeStyle = a.color;
  ctx.fillStyle = a.color;
  ctx.lineWidth = a.strokeWidth;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  switch (a.type) {
    case "pen":
    case "highlighter": {
      if (!a.points || a.points.length === 0) break;
      ctx.beginPath();
      if (a.points.length === 1) {
        ctx.arc(a.points[0][0], a.points[0][1], a.strokeWidth / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.moveTo(a.points[0][0], a.points[0][1]);
        for (let i = 1; i < a.points.length; i++) {
          // Smooth curves using quadratic bezier
          const midX = (a.points[i - 1][0] + a.points[i][0]) / 2;
          const midY = (a.points[i - 1][1] + a.points[i][1]) / 2;
          ctx.quadraticCurveTo(a.points[i - 1][0], a.points[i - 1][1], midX, midY);
        }
        const last = a.points[a.points.length - 1];
        ctx.lineTo(last[0], last[1]);
        ctx.stroke();
      }
      break;
    }
    case "arrow": {
      if (!a.start || !a.end) break;
      const [sx, sy] = a.start;
      const [ex, ey] = a.end;
      const headLen = Math.max(14, a.strokeWidth * 3.5);
      const angle = Math.atan2(ey - sy, ex - sx);
      // Shaft
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(ex, ey);
      ctx.stroke();
      // Arrowhead
      ctx.beginPath();
      ctx.moveTo(ex, ey);
      ctx.lineTo(
        ex - headLen * Math.cos(angle - Math.PI / 6),
        ey - headLen * Math.sin(angle - Math.PI / 6)
      );
      ctx.lineTo(
        ex - headLen * Math.cos(angle + Math.PI / 6),
        ey - headLen * Math.sin(angle + Math.PI / 6)
      );
      ctx.closePath();
      ctx.fill();
      break;
    }
    case "circle": {
      if (!a.start || !a.end) break;
      const rx = Math.abs(a.end[0] - a.start[0]);
      const ry = Math.abs(a.end[1] - a.start[1]);
      if (rx < 1 && ry < 1) break;
      ctx.beginPath();
      ctx.ellipse(a.start[0], a.start[1], Math.max(rx, 1), Math.max(ry, 1), 0, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }
    case "rectangle": {
      if (!a.start || !a.end) break;
      const w = a.end[0] - a.start[0];
      const h = a.end[1] - a.start[1];
      if (Math.abs(w) < 1 && Math.abs(h) < 1) break;
      ctx.beginPath();
      ctx.strokeRect(a.start[0], a.start[1], w, h);
      break;
    }
    case "text": {
      if (!a.text || !a.position) break;
      const fs = a.fontSize ?? 18;
      ctx.font = `bold ${fs}px -apple-system, BlinkMacSystemFont, sans-serif`;
      // Shadow for contrast
      const shadow = a.color === "#FFFFFF" ? "#000000" : "#FFFFFF";
      ctx.fillStyle = shadow;
      ctx.globalAlpha = a.opacity * 0.6;
      ctx.fillText(a.text, a.position[0] + 1.5, a.position[1] + 1.5);
      ctx.fillStyle = a.color;
      ctx.globalAlpha = a.opacity;
      ctx.fillText(a.text, a.position[0], a.position[1]);
      break;
    }
  }
  ctx.restore();
}

// ─── Component ───────────────────────────────────────────────────────────────

interface MarkupCanvasProps {
  /** Optional background image URL — will be composited behind markup on Done */
  backgroundImageUrl?: string;
  onDone: (compositeDataUrl: string, actions: MarkupAction[]) => void;
  onCancel: () => void;
  initialActions?: MarkupAction[];
}

export default function MarkupCanvas({
  backgroundImageUrl,
  onDone,
  onCancel,
  initialActions = [],
}: MarkupCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bgImgRef = useRef<HTMLImageElement | null>(null);
  const textInputRef = useRef<HTMLInputElement>(null);

  const [canvasSize, setCanvasSize] = useState({ w: 0, h: 0 });
  const [tool, setTool] = useState<MarkupTool>("pen");
  const [color, setColor] = useState("#EF4444");
  const [sizeKey, setSizeKey] = useState<SizeKey>("medium");
  const [actions, setActions] = useState<MarkupAction[]>(initialActions);
  const [drawing, setDrawing] = useState(false);
  const [current, setCurrent] = useState<MarkupAction | null>(null);
  const [textOverlay, setTextOverlay] = useState<{
    clientX: number;
    clientY: number;
    val: string;
  } | null>(null);

  // Pinch tracking
  const lastPinchRef = useRef<number | null>(null);

  // ── Size observer ──────────────────────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver((entries) => {
      const e = entries[0];
      if (e) setCanvasSize({ w: Math.round(e.contentRect.width), h: Math.round(e.contentRect.height) });
    });
    obs.observe(el);
    setCanvasSize({ w: el.clientWidth, h: el.clientHeight });
    return () => obs.disconnect();
  }, []);

  // ── Pre-load background image ──────────────────────────────────────────────
  useEffect(() => {
    if (!backgroundImageUrl) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = backgroundImageUrl;
    bgImgRef.current = img;
  }, [backgroundImageUrl]);

  // ── Redraw ─────────────────────────────────────────────────────────────────
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || canvasSize.w === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    actions.forEach((a) => renderAction(ctx, a));
    if (current) renderAction(ctx, current);
  }, [actions, current, canvasSize]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  // ── Coord helpers ──────────────────────────────────────────────────────────
  const toCanvasCoords = useCallback(
    (clientX: number, clientY: number): [number, number] => {
      const canvas = canvasRef.current;
      if (!canvas) return [0, 0];
      const rect = canvas.getBoundingClientRect();
      return [
        ((clientX - rect.left) / rect.width) * canvas.width,
        ((clientY - rect.top) / rect.height) * canvas.height,
      ];
    },
    []
  );

  const getStrokeW = () =>
    tool === "highlighter" ? HI_STROKE[sizeKey] : PEN_STROKE[sizeKey];
  const getOpacity = () => (tool === "highlighter" ? 0.38 : 1.0);

  // ── Drawing handlers ───────────────────────────────────────────────────────
  const handleStart = useCallback(
    (clientX: number, clientY: number) => {
      if (tool === "text") {
        setTextOverlay({ clientX, clientY, val: "" });
        setTimeout(() => textInputRef.current?.focus(), 40);
        return;
      }
      const pos = toCanvasCoords(clientX, clientY);
      const base: MarkupAction = {
        id: uid(),
        type: tool,
        color,
        strokeWidth: getStrokeW(),
        opacity: getOpacity(),
      };
      const a: MarkupAction =
        tool === "pen" || tool === "highlighter"
          ? { ...base, points: [pos] }
          : { ...base, start: pos, end: pos };
      setCurrent(a);
      setDrawing(true);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tool, color, sizeKey, toCanvasCoords]
  );

  const handleMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!drawing || !current) return;
      const pos = toCanvasCoords(clientX, clientY);
      if (current.type === "pen" || current.type === "highlighter") {
        setCurrent((prev) =>
          prev ? { ...prev, points: [...(prev.points ?? []), pos] } : null
        );
      } else {
        setCurrent((prev) => (prev ? { ...prev, end: pos } : null));
      }
    },
    [drawing, current, toCanvasCoords]
  );

  const handleEnd = useCallback(() => {
    if (!drawing || !current) return;
    setActions((prev) => [...prev, current]);
    setCurrent(null);
    setDrawing(false);
  }, [drawing, current]);

  const commitText = useCallback(() => {
    if (!textOverlay || !textOverlay.val.trim()) {
      setTextOverlay(null);
      return;
    }
    const canvas = canvasRef.current;
    const rect = canvas?.getBoundingClientRect();
    const scaleX = canvas && rect ? canvas.width / rect.width : 1;
    const fontSize = 18 * scaleX;
    const pos = toCanvasCoords(textOverlay.clientX, textOverlay.clientY);
    setActions((prev) => [
      ...prev,
      {
        id: uid(),
        type: "text",
        color,
        strokeWidth: PEN_STROKE[sizeKey],
        opacity: 1,
        text: textOverlay.val,
        position: pos,
        fontSize,
      },
    ]);
    setTextOverlay(null);
  }, [textOverlay, color, sizeKey, toCanvasCoords]);

  // ── Mouse events ───────────────────────────────────────────────────────────
  const onMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    handleStart(e.clientX, e.clientY);
  };
  const onMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawing) return;
    handleMove(e.clientX, e.clientY);
  };
  const onMouseUp = () => handleEnd();

  // ── Touch events ───────────────────────────────────────────────────────────
  const onTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastPinchRef.current = Math.hypot(dx, dy);
      return;
    }
    e.preventDefault();
    handleStart(e.touches[0].clientX, e.touches[0].clientY);
  };
  const onTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 2) {
      // Pinch — could add zoom here later
      lastPinchRef.current = null;
      return;
    }
    e.preventDefault();
    handleMove(e.touches[0].clientX, e.touches[0].clientY);
  };
  const onTouchEnd = () => {
    lastPinchRef.current = null;
    handleEnd();
  };

  // ── Done / export ──────────────────────────────────────────────────────────
  const handleDone = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (backgroundImageUrl) {
      const out = document.createElement("canvas");
      out.width = canvas.width;
      out.height = canvas.height;
      const ctx = out.getContext("2d")!;
      const img = bgImgRef.current ?? new Image();

      const doMerge = () => {
        // Draw bg image with object-contain logic
        const iw = img.naturalWidth || out.width;
        const ih = img.naturalHeight || out.height;
        const cw = out.width;
        const ch = out.height;
        const imgAR = iw / ih;
        const canvasAR = cw / ch;
        let dw: number, dh: number, dx: number, dy: number;
        if (imgAR > canvasAR) {
          dw = cw;
          dh = cw / imgAR;
          dx = 0;
          dy = (ch - dh) / 2;
        } else {
          dh = ch;
          dw = ch * imgAR;
          dx = (cw - dw) / 2;
          dy = 0;
        }
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, cw, ch);
        if (img.complete && img.naturalWidth > 0) {
          ctx.drawImage(img, dx, dy, dw, dh);
        }
        ctx.drawImage(canvas, 0, 0);
        onDone(out.toDataURL("image/jpeg", 0.92), actions);
      };

      if (img.complete && img.naturalWidth > 0) {
        doMerge();
      } else {
        img.onload = doMerge;
        img.onerror = () => {
          ctx.drawImage(canvas, 0, 0);
          onDone(out.toDataURL("image/png"), actions);
        };
        if (!img.src) img.src = backgroundImageUrl;
      }
    } else {
      onDone(canvas.toDataURL("image/png"), actions);
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-black select-none">
      {/* ── Canvas area ── */}
      <div ref={containerRef} className="flex-1 relative overflow-hidden">
        {/* Background image */}
        {backgroundImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={backgroundImageUrl}
            alt="markup background"
            className="absolute inset-0 w-full h-full object-contain pointer-events-none"
            draggable={false}
          />
        )}

        {/* Drawing canvas */}
        {canvasSize.w > 0 && (
          <canvas
            ref={canvasRef}
            width={canvasSize.w}
            height={canvasSize.h}
            className="absolute inset-0 touch-none"
            style={{
              width: canvasSize.w,
              height: canvasSize.h,
              cursor: tool === "text" ? "text" : "crosshair",
            }}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          />
        )}

        {/* Text input overlay */}
        {textOverlay && (
          <div
            className="absolute z-10 pointer-events-auto"
            style={{
              left: Math.max(8, Math.min(textOverlay.clientX, window.innerWidth - 200)),
              top: Math.max(8, textOverlay.clientY - 44),
            }}
          >
            <input
              ref={textInputRef}
              type="text"
              value={textOverlay.val}
              onChange={(e) =>
                setTextOverlay((prev) =>
                  prev ? { ...prev, val: e.target.value } : null
                )
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") commitText();
                if (e.key === "Escape") setTextOverlay(null);
              }}
              onBlur={commitText}
              style={{
                color,
                backgroundColor: "rgba(0,0,0,0.75)",
                borderColor: color,
              }}
              className="border-2 rounded-lg px-3 py-2 text-sm font-bold focus:outline-none min-w-[160px] placeholder-gray-500"
              placeholder="Type & press Enter…"
              autoFocus
            />
          </div>
        )}
      </div>

      {/* ── Toolbar ── */}
      <div
        className="bg-[#0B0B0D] border-t border-[#1F1F25] px-3 pt-3"
        style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
      >
        {/* Tool buttons */}
        <div className="flex items-center gap-1.5 mb-3 overflow-x-auto pb-1 scrollbar-hide">
          {(
            [
              { id: "pen" as MarkupTool, label: "Pen", emoji: "✏️" },
              { id: "arrow" as MarkupTool, label: "Arrow", emoji: "➡️" },
              { id: "circle" as MarkupTool, label: "Circle", emoji: "⭕" },
              { id: "rectangle" as MarkupTool, label: "Rect", emoji: "▭" },
              { id: "text" as MarkupTool, label: "Text", emoji: "T" },
              { id: "highlighter" as MarkupTool, label: "Hi-lite", emoji: "🖌️" },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setTool(t.id)}
              className={`flex flex-col items-center justify-center gap-0.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                tool === t.id
                  ? "bg-[#F97316] text-[color:var(--text-primary)]"
                  : "bg-[#1F1F25] text-[color:var(--text-secondary)] active:bg-[#2a2a35]"
              }`}
              style={{ minWidth: 52, minHeight: 52, padding: "6px 10px" }}
            >
              <span className="text-lg leading-none">{t.emoji}</span>
              <span className="text-[10px] leading-none mt-0.5">{t.label}</span>
            </button>
          ))}
        </div>

        {/* Controls row */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Color swatches */}
          <div className="flex gap-1.5 items-center shrink-0">
            {MARKUP_COLORS.map((c) => (
              <button
                key={c.value}
                onClick={() => setColor(c.value)}
                className="rounded-full border-2 transition-all shrink-0"
                style={{
                  width: 26,
                  height: 26,
                  backgroundColor: c.value,
                  borderColor: color === c.value ? "#F97316" : "#333",
                  transform: color === c.value ? "scale(1.3)" : "scale(1)",
                  boxShadow:
                    c.value === "#FFFFFF" ? "0 0 0 1px #444 inset" : undefined,
                }}
                title={c.name}
              />
            ))}
          </div>

          {/* Stroke size */}
          <div className="flex gap-1 items-center shrink-0">
            {(["thin", "medium", "thick"] as SizeKey[]).map((s) => (
              <button
                key={s}
                onClick={() => setSizeKey(s)}
                className={`rounded-lg font-bold transition-all flex items-center justify-center ${
                  sizeKey === s
                    ? "bg-[#F97316] text-[color:var(--text-primary)]"
                    : "bg-[#1F1F25] text-[color:var(--text-secondary)]"
                }`}
                style={{ minWidth: 36, minHeight: 36, fontSize: s === "thin" ? 10 : s === "medium" ? 16 : 22 }}
              >
                ●
              </button>
            ))}
          </div>

          <div className="flex-1" />

          {/* Action buttons */}
          <button
            onClick={() => setActions((prev) => prev.slice(0, -1))}
            disabled={actions.length === 0}
            title="Undo"
            className="rounded-xl bg-[#1F1F25] text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] disabled:opacity-30 transition-all flex items-center justify-center text-lg font-bold"
            style={{ minWidth: 44, minHeight: 44 }}
          >
            ↩
          </button>
          <button
            onClick={() => {
              setActions([]);
              setCurrent(null);
              setTextOverlay(null);
            }}
            title="Clear all"
            className="rounded-xl bg-[#1F1F25] text-[#EF4444] transition-all flex items-center justify-center text-base"
            style={{ minWidth: 44, minHeight: 44 }}
          >
            🗑
          </button>
          <button
            onClick={onCancel}
            title="Cancel"
            className="rounded-xl bg-[#1F1F25] text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] transition-all flex items-center justify-center text-base font-bold"
            style={{ minWidth: 44, minHeight: 44 }}
          >
            ✕
          </button>
          <button
            onClick={handleDone}
            className="rounded-xl bg-[#F97316] hover:bg-[#ea6c10] text-[color:var(--text-primary)] font-bold text-sm px-4 transition-all"
            style={{ minHeight: 44 }}
          >
            Done ✓
          </button>
        </div>
      </div>
    </div>
  );
}
