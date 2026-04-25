"use client";

import { ArrowLeft, FileImage } from "lucide-react";

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
  sheet_count: number;
  uploaded_at: string;
}

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

interface SheetBrowserProps {
  sheets: DrawingSheet[];
  drawingSet: DrawingSet;
  onSheetSelect: (sheetIndex: number) => void;
  onBack: () => void;
}

export default function SheetBrowser({
  sheets,
  drawingSet,
  onSheetSelect,
  onBack,
}: SheetBrowserProps) {
  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={onBack}
          className="p-2 text-gray-400 hover:text-white rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h2 className="text-white font-semibold">{drawingSet.name}</h2>
          <p className="text-gray-500 text-xs">
            {drawingSet.revision} · {drawingSet.sheet_count} sheets
          </p>
        </div>
        {drawingSet.is_current && (
          <span className="ml-auto px-2 py-0.5 bg-green-500/15 text-green-400 rounded text-xs font-medium border border-green-500/20">
            Current
          </span>
        )}
      </div>

      {/* Sheet grid */}
      {sheets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FileImage size={40} className="text-gray-700 mb-3" />
          <p className="text-gray-500 text-sm">No sheets in this set</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {sheets.map((sheet, idx) => (
            <button
              key={sheet.id}
              onClick={() => onSheetSelect(idx)}
              className="bg-[#121217] border border-[#1F1F25] rounded-xl p-3 text-left hover:border-[#F97316]/50 transition-colors group min-h-[100px] flex flex-col gap-2"
            >
              {/* Sheet thumbnail placeholder */}
              <div className="w-full aspect-[3/4] bg-[#0B0B0D] rounded-lg flex items-center justify-center border border-[#1F1F25] group-hover:border-[#F97316]/30 transition-colors">
                <div className="text-center">
                  <FileImage size={20} className="text-gray-700 mx-auto mb-1" />
                  <span className="text-gray-600 text-xs">Pg {sheet.page_index + 1}</span>
                </div>
              </div>

              {/* Sheet info */}
              <div>
                <p className="text-white text-xs font-semibold truncate">{sheet.sheet_number}</p>
                {sheet.sheet_title && (
                  <p className="text-gray-500 text-xs truncate mt-0.5">{sheet.sheet_title}</p>
                )}
                {sheet.discipline && sheet.discipline !== "general" && (
                  <span
                    className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-medium"
                    style={{
                      backgroundColor: (DISCIPLINE_COLORS[sheet.discipline] || "#6B7280") + "20",
                      color: DISCIPLINE_COLORS[sheet.discipline] || "#6B7280",
                    }}
                  >
                    {sheet.discipline}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
