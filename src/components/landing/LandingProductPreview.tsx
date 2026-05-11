import {
  LayoutDashboard,
  ClipboardList,
  Camera,
  FolderOpen,
  Settings,
  MapPin,
} from "lucide-react";

/** Stylized in-browser product frame for the marketing hero (no external assets). */
export default function LandingProductPreview() {
  return (
    <div
      className="relative rounded-2xl border shadow-[0_24px_80px_rgba(15,23,42,0.14)] overflow-hidden bg-white"
      style={{ borderColor: "rgba(15,23,42,0.1)" }}
    >
      <div className="flex h-[min(420px,70vw)] min-h-[280px]">
        {/* App rail */}
        <nav
          className="flex w-14 shrink-0 flex-col items-center gap-5 py-5"
          style={{ background: "#0f172a" }}
          aria-hidden
        >
          {[LayoutDashboard, ClipboardList, Camera, FolderOpen, Settings].map((Icon, i) => (
            <Icon key={i} className="h-4 w-4 text-white/55" strokeWidth={1.5} />
          ))}
        </nav>
        {/* Main canvas */}
        <div className="relative min-w-0 flex-1 bg-[#f4f6f9]">
          <div className="flex items-center gap-2 border-b px-4 py-2.5 bg-white/90" style={{ borderColor: "rgba(15,23,42,0.08)" }}>
            <span className="flex gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400/90" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400/90" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/90" />
            </span>
            <span className="truncate text-[11px] font-semibold text-slate-500">Riverside Tower — lookahead</span>
          </div>
          <div className="p-4 space-y-2">
            {[
              { t: "Rough-in electrical — Level 3", p: 72, c: "#F37021" },
              { t: "HVAC duct — East wing", p: 45, c: "#3B82F6" },
              { t: "Drywall — Corridor B", p: 100, c: "#22C55E" },
            ].map((row) => (
              <div
                key={row.t}
                className="rounded-lg border bg-white px-3 py-2.5 shadow-sm"
                style={{ borderColor: "rgba(15,23,42,0.06)" }}
              >
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: row.c }} />
                  <span className="truncate text-xs font-medium text-slate-800">{row.t}</span>
                  <span className="ml-auto text-[10px] font-bold tabular-nums text-slate-500">{row.p}%</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full transition-all" style={{ width: `${row.p}%`, background: row.c }} />
                </div>
              </div>
            ))}
            <div className="relative h-24 rounded-lg border border-dashed border-slate-300/80 bg-white/60">
              <div className="absolute inset-0 flex items-center justify-center gap-1 text-[10px] font-medium text-slate-400">
                <MapPin className="h-3.5 w-3.5 text-[#F37021]" />
                Week view · trade filters on
              </div>
            </div>
          </div>
          {/* Floating card */}
          <div
            className="absolute bottom-4 right-4 left-4 sm:left-auto w-[calc(100%-2rem)] max-w-[220px] rounded-xl border bg-white p-3 shadow-lg"
            style={{ borderColor: "rgba(15,23,42,0.08)" }}
          >
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold text-slate-800">RFI · 143</span>
              <span
                className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase text-white"
                style={{ background: "#F37021" }}
              >
                Open
              </span>
            </div>
            <p className="text-[10px] leading-snug text-slate-500">Coordination question on ceiling interstitial — awaiting architect response.</p>
            <div className="mt-2 flex items-center gap-2">
              <span className="h-6 w-6 rounded-full bg-slate-200" />
              <span className="text-[10px] font-semibold text-slate-600">PM · Field</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
