"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import {
  ZoomIn, ZoomOut, RotateCcw, MapPin, ChevronLeft, ChevronRight, Info, X
} from "lucide-react";
import AddPinModal from "./AddPinModal";
import RevisionBanner from "./RevisionBanner";

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface DrawingSheet {
  id: string;
  sheet_number: string;
  sheet_title?: string;
  discipline?: string;
  storage_path: string;
  page_index: number;
}

interface DrawingSet {
  id: string;
  name: string;
  revision: string;
  is_current: boolean;
}

interface Pin {
  id: string;
  pin_type: "rfi" | "punch" | "submittal" | "note" | "photo";
  reference_id?: string;
  x_percent: number;
  y_percent: number;
  label?: string;
  notes?: string;
  reference?: {
    id: string;
    subject?: string;
    title?: string;
    rfi_number?: string;
    item_number?: string;
    submittal_number?: string;
    status?: string;
  };
}

const PIN_COLORS: Record<string, string> = {
  rfi: "#A855F7",
  punch: "#EF4444",
  submittal: "#3B82F6",
  note: "#EAB308",
  photo: "#22C55E",
};

const DISCIPLINE_COLORS: Record<string, string> = {
  architectural: "#F97316",
  structural: "#EF4444",
  mechanical: "#3B82F6",
  electrical: "#EAB308",
  plumbing: "#22C55E",
  civil: "#8B5CF6",
  landscape: "#10B981",
  fire_protection: "#F43F5E",
  general: "#6B7280",
  other: "#6B7280",
};

interface SheetViewerProps {
  projectId: string;
  sheets: DrawingSheet[];
  initialSheetIndex?: number;
  drawingSet: DrawingSet;
  currentRevision?: string;
  pdfPublicUrl: string;
  onClose: () => void;
  onViewCurrentRevision?: () => void;
}

export default function SheetViewer({
  projectId,
  sheets,
  initialSheetIndex = 0,
  drawingSet,
  currentRevision,
  pdfPublicUrl,
  onClose,
  onViewCurrentRevision,
}: SheetViewerProps) {
  const [sheetIndex, setSheetIndex] = useState(initialSheetIndex);
  const [scale, setScale] = useState(1);
  const [pins, setPins] = useState<Pin[]>([]);
  const [addPinMode, setAddPinMode] = useState(false);
  const [pendingPin, setPendingPin] = useState<{ x: number; y: number } | null>(null);
  const [selectedPin, setSelectedPin] = useState<Pin | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [pdfWidth, setPdfWidth] = useState<number>(800);

  const containerRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);

  const currentSheet = sheets[sheetIndex];

  // Pinch-to-zoom state
  const lastTouchDist = useRef<number | null>(null);
  const lastScale = useRef(1);

  useEffect(() => {
    if (currentSheet) {
      loadPins(currentSheet.id);
    }
  }, [currentSheet]);

  // Responsive PDF width
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setPdfWidth(Math.min(containerRef.current.clientWidth - 32, 1200));
      }
    };
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  const loadPins = async (sheetId: string) => {
    try {
      const resp = await fetch(
        `/api/projects/${projectId}/drawings/sheets/${sheetId}/pins`
      );
      if (resp.ok) {
        const data = await resp.json();
        setPins(data.pins || []);
      }
    } catch {
      // ignore
    }
  };

  const handlePageClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!addPinMode || !pageRef.current) return;
      const rect = pageRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setPendingPin({ x, y });
    },
    [addPinMode]
  );

  const handleTouchPinch = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (lastTouchDist.current !== null) {
        const delta = dist / lastTouchDist.current;
        setScale((s) => Math.min(Math.max(s * delta, 0.5), 4));
      }
      lastTouchDist.current = dist;
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    lastTouchDist.current = null;
    lastScale.current = scale;
  }, [scale]);

  const handlePinSave = async (pinData: {
    pin_type: "rfi" | "punch" | "submittal" | "note" | "photo";
    reference_id?: string;
    label?: string;
    notes?: string;
  }) => {
    if (!pendingPin || !currentSheet) return;
    try {
      const resp = await fetch(
        `/api/projects/${projectId}/drawings/sheets/${currentSheet.id}/pins`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...pinData,
            x_percent: pendingPin.x,
            y_percent: pendingPin.y,
          }),
        }
      );
      if (resp.ok) {
        await loadPins(currentSheet.id);
      }
    } catch {
      // ignore
    }
    setPendingPin(null);
    setAddPinMode(false);
  };

  const handleDeletePin = async (pinId: string) => {
    if (!currentSheet) return;
    await fetch(
      `/api/projects/${projectId}/drawings/sheets/${currentSheet.id}/pins?pinId=${pinId}`,
      { method: "DELETE" }
    );
    setPins((prev) => prev.filter((p) => p.id !== pinId));
    setSelectedPin(null);
  };

  if (!currentSheet) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[var(--bg-primary)] flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 bg-[var(--bg-secondary)] border-b border-[var(--border-primary)] shrink-0 overflow-x-auto">
        <button
          onClick={onClose}
          className="p-2 text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center shrink-0"
        >
          <X size={18} />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-[color:var(--text-primary)] font-medium text-sm truncate">
              {currentSheet.sheet_number}
              {currentSheet.sheet_title ? ` — ${currentSheet.sheet_title}` : ""}
            </p>
            {currentSheet.discipline && currentSheet.discipline !== "general" && (
              <span
                className="px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide shrink-0"
                style={{
                  backgroundColor: (DISCIPLINE_COLORS[currentSheet.discipline] || "#6B7280") + "25",
                  color: DISCIPLINE_COLORS[currentSheet.discipline] || "#6B7280",
                }}
              >
                {currentSheet.discipline.replace("_", " ")}
              </span>
            )}
          </div>
          <p className="text-[color:var(--text-muted)] text-xs truncate">{drawingSet.name} · {drawingSet.revision}</p>
        </div>

        {/* Zoom controls */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setScale((s) => Math.max(s - 0.25, 0.5))}
            className="p-2 text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <ZoomOut size={16} />
          </button>
          <span className="text-[color:var(--text-secondary)] text-xs w-10 text-center">{Math.round(scale * 100)}%</span>
          <button
            onClick={() => setScale((s) => Math.min(s + 0.25, 4))}
            className="p-2 text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <ZoomIn size={16} />
          </button>
          <button
            onClick={() => setScale(1)}
            className="p-2 text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <RotateCcw size={14} />
          </button>
        </div>

        {/* Add pin toggle */}
        <button
          onClick={() => setAddPinMode((v) => !v)}
          className={`p-2 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors shrink-0 ${
            addPinMode
              ? "bg-[#F97316] text-[color:var(--text-primary)]"
              : "text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] bg-[var(--bg-tertiary)]"
          }`}
          title="Add Pin"
        >
          <MapPin size={16} />
        </button>

        {/* Sheet info */}
        <button
          onClick={() => setShowInfo((v) => !v)}
          className="p-2 text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center shrink-0"
        >
          <Info size={16} />
        </button>
      </div>

      {/* Revision banner */}
      {currentRevision && currentRevision !== drawingSet.revision && (
        <div className="px-3 pt-2 shrink-0">
          <RevisionBanner
            currentRevision={currentRevision}
            viewingRevision={drawingSet.revision}
            onViewCurrent={onViewCurrentRevision || (() => {})}
          />
        </div>
      )}

      {/* Add pin mode banner */}
      {addPinMode && (
        <div className="flex items-center justify-center gap-2 px-4 py-2 bg-[#F97316]/15 border-b border-[#F97316]/30 shrink-0">
          <MapPin size={14} className="text-[#F97316]" />
          <span className="text-[#F97316] text-sm">Tap on the drawing to place a pin</span>
          <button
            onClick={() => setAddPinMode(false)}
            className="ml-auto text-[#F97316] hover:text-[color:var(--text-primary)] text-sm underline"
          >
            Cancel
          </button>
        </div>
      )}

      {/* PDF canvas area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto"
        onTouchMove={handleTouchPinch}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex justify-center p-4 min-h-full">
          <div
            className="relative select-none"
            style={{ transform: `scale(${scale})`, transformOrigin: "top center", transition: "transform 0.1s" }}
          >
            {/* Page container for pin overlay */}
            <div
              ref={pageRef}
              className="relative"
              onClick={handlePageClick}
              style={{ cursor: addPinMode ? "crosshair" : "default" }}
            >
              <Document
                file={pdfPublicUrl}
                loading={
                  <div className="flex items-center justify-center w-full h-64">
                    <div className="text-[color:var(--text-muted)] text-sm">Loading PDF...</div>
                  </div>
                }
                error={
                  <div className="flex items-center justify-center w-full h-64">
                    <div className="text-red-400 text-sm">Failed to load PDF</div>
                  </div>
                }
              >
                <Page
                  pageIndex={currentSheet.page_index}
                  width={pdfWidth}
                  renderAnnotationLayer={false}
                  renderTextLayer={false}
                />
              </Document>

              {/* Pin overlay */}
              {pins.map((pin) => (
                <button
                  key={pin.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPin(selectedPin?.id === pin.id ? null : pin);
                  }}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-lg z-10 min-w-[28px] min-h-[28px] flex items-center justify-center text-[color:var(--text-primary)] text-xs font-bold transition-transform hover:scale-125"
                  style={{
                    left: `${pin.x_percent}%`,
                    top: `${pin.y_percent}%`,
                    backgroundColor: PIN_COLORS[pin.pin_type] || "#F97316",
                    width: "28px",
                    height: "28px",
                  }}
                  title={pin.label || pin.pin_type.toUpperCase()}
                >
                  {pin.pin_type === "rfi" ? "R" :
                   pin.pin_type === "punch" ? "P" :
                   pin.pin_type === "submittal" ? "S" :
                   pin.pin_type === "note" ? "N" : "📷"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Sheet navigation */}
      <div className="flex flex-col bg-[var(--bg-secondary)] border-t border-[var(--border-primary)] shrink-0">
        {/* Discipline context row */}
        {currentSheet.discipline && currentSheet.discipline !== "general" && (
          <div className="flex items-center justify-center gap-1.5 py-1 border-b border-[var(--border-primary)]/50">
            <span
              className="text-[10px] font-semibold uppercase tracking-widest"
              style={{ color: DISCIPLINE_COLORS[currentSheet.discipline] || "#6B7280" }}
            >
              {currentSheet.discipline.replace("_", " ")}
            </span>
          </div>
        )}
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => setSheetIndex((i) => Math.max(i - 1, 0))}
            disabled={sheetIndex === 0}
            className="flex items-center gap-1 px-3 py-2 bg-[var(--bg-tertiary)] rounded-lg text-[color:var(--text-secondary)] disabled:opacity-30 min-h-[44px] text-sm"
          >
            <ChevronLeft size={16} /> Prev
          </button>
          <div className="text-center">
            <p className="text-[color:var(--text-secondary)] text-sm">{sheetIndex + 1} / {sheets.length}</p>
            {currentSheet.sheet_number && (
              <p className="text-gray-600 text-xs mt-0.5">{currentSheet.sheet_number}</p>
            )}
          </div>
          <button
            onClick={() => setSheetIndex((i) => Math.min(i + 1, sheets.length - 1))}
            disabled={sheetIndex === sheets.length - 1}
            className="flex items-center gap-1 px-3 py-2 bg-[var(--bg-tertiary)] rounded-lg text-[color:var(--text-secondary)] disabled:opacity-30 min-h-[44px] text-sm"
          >
            Next <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Selected pin popup */}
      {selectedPin && (
        <div className="absolute bottom-20 left-4 right-4 z-20 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-4 shadow-xl">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: PIN_COLORS[selectedPin.pin_type] }}
              />
              <div>
                <p className="text-[color:var(--text-primary)] font-medium text-sm capitalize">
                  {selectedPin.pin_type}
                  {selectedPin.label ? ` — ${selectedPin.label}` : ""}
                </p>
                {selectedPin.reference && (
                  <p className="text-[color:var(--text-secondary)] text-xs mt-0.5">
                    {selectedPin.reference.rfi_number || selectedPin.reference.item_number || selectedPin.reference.submittal_number}
                    {" — "}
                    {selectedPin.reference.subject || selectedPin.reference.title}
                  </p>
                )}
                {selectedPin.notes && (
                  <p className="text-[color:var(--text-secondary)] text-xs mt-1">{selectedPin.notes}</p>
                )}
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => handleDeletePin(selectedPin.id)}
                className="text-red-400 hover:text-red-300 text-xs px-2 py-1 border border-red-400/30 rounded min-h-[32px]"
              >
                Delete
              </button>
              <button
                onClick={() => setSelectedPin(null)}
                className="p-1 text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] min-h-[32px] min-w-[32px] flex items-center justify-center"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sheet info popup */}
      {showInfo && (
        <div className="absolute bottom-20 left-4 right-4 z-20 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-4 shadow-xl">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <p className="text-[color:var(--text-primary)] font-medium">{currentSheet.sheet_number}</p>
              {currentSheet.sheet_title && <p className="text-[color:var(--text-secondary)] text-sm">{currentSheet.sheet_title}</p>}
              {currentSheet.discipline && (
                <span
                  className="inline-block px-2 py-0.5 rounded text-xs font-medium text-[color:var(--text-primary)]"
                  style={{ backgroundColor: DISCIPLINE_COLORS[currentSheet.discipline] + "30", color: DISCIPLINE_COLORS[currentSheet.discipline] }}
                >
                  {currentSheet.discipline}
                </span>
              )}
              <p className="text-[color:var(--text-muted)] text-xs">Page {currentSheet.page_index + 1} · {pins.length} pins</p>
            </div>
            <button onClick={() => setShowInfo(false)} className="p-1 text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] min-h-[32px] min-w-[32px] flex items-center justify-center">
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Add pin modal */}
      {pendingPin && (
        <AddPinModal
          projectId={projectId}
          sheetId={currentSheet.id}
          xPercent={pendingPin.x}
          yPercent={pendingPin.y}
          onSave={handlePinSave}
          onClose={() => setPendingPin(null)}
        />
      )}
    </div>
  );
}
