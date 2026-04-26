"use client";

import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useParams } from "next/navigation";
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  CalendarDays,
  Loader2,
  XCircle,
  ChevronDown,
  ChevronRight,
  Users,
  Timer,
  Send,
  Camera,
  X,
  ArrowLeft,
  ZoomIn,
  ChevronLeft,
} from "lucide-react";

import { extractPhotoTimestamp } from "@/lib/photo-utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PastReport {
  id: string;
  report_date: string;
  submitted_by: string;
  manpower_count: number | null;
  total_hours: number | null;
  delay_reasons: string[];
  notes: string | null;
  worked_on_activities: Array<{ activity_id: string; status: string }>;
  photo_urls?: string[];
  submitted_at: string;
}

interface Activity {
  id: string;
  activity_id?: string;
  activity_name: string;
  start_date?: string;
  finish_date?: string;
  percent_complete: number;
  trade?: string;
  status: string;
  milestone?: boolean;
  float_days?: number;
}

interface DependencyEntry {
  your_activity: {
    id: string;
    activity_id?: string;
    activity_name: string;
    start_date?: string;
    trade?: string;
  };
  predecessor: {
    id: string;
    activity_id?: string;
    activity_name: string;
    finish_date?: string;
    trade?: string;
    status: string;
  };
}

interface ViewData {
  view_id: string | null;
  project: {
    id: string;
    name: string;
    location?: string;
    schedule_updated_at?: string;
  };
  sub: {
    id: string;
    name: string;
    trades: string[];
  };
  stats: {
    total_tasks: number;
    this_week: number;
    overdue: number;
    pct_complete: number;
  };
  activities: {
    today: Activity[];
    this_week: Activity[];
    next_two_weeks: Activity[];
    overdue: Activity[];
    complete: Activity[];
    upcoming: Activity[];
  };
  dependencies: DependencyEntry[];
  generated_at: string;
}

// Photo file state shape
interface PhotoFile {
  id: string;          // local unique id
  file: File;
  previewUrl: string;  // object URL for thumbnail display
  sizeBytes: number;
  oversized: boolean;  // > 5MB original
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr?: string): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatDateShort(dateStr?: string): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function statusChip(status: string, pct: number) {
  if (status === "complete" || pct >= 100) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-900/40 text-green-400 border border-green-700/40">
        <CheckCircle2 size={11} /> Complete
      </span>
    );
  }
  if (status === "late") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-900/40 text-red-400 border border-red-700/40">
        <AlertTriangle size={11} /> Late
      </span>
    );
  }
  if (status === "in_progress") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-900/40 text-orange-400 border border-orange-700/40">
        <Clock size={11} /> In Progress
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--bg-tertiary)] text-gray-400 border border-[#2a2a33]">
      On Track
    </span>
  );
}

function groupByDay(activities: Activity[]): Record<string, Activity[]> {
  const groups: Record<string, Activity[]> = {};
  for (const act of activities) {
    const day = act.start_date ?? "Unknown";
    if (!groups[day]) groups[day] = [];
    groups[day].push(act);
  }
  return groups;
}

// ─── Photo Compression ────────────────────────────────────────────────────────
// Client-side: resize images > 2MB to max 1920px wide, JPEG 0.8 quality

async function compressImageIfNeeded(file: File): Promise<File> {
  const TWO_MB = 2 * 1024 * 1024;
  if (file.size <= TWO_MB) return file;

  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const MAX_WIDTH = 1920;
      let { width, height } = img;
      if (width > MAX_WIDTH) {
        height = Math.round((height * MAX_WIDTH) / width);
        width = MAX_WIDTH;
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) { resolve(file); return; }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) { resolve(file); return; }
          const compressed = new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), {
            type: "image/jpeg",
          });
          resolve(compressed);
        },
        "image/jpeg",
        0.8
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}

// ─── Lightbox ─────────────────────────────────────────────────────────────────

function Lightbox({
  urls,
  startIndex,
  onClose,
}: {
  urls: string[];
  startIndex: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(startIndex);

  // Keyboard navigation
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setIndex((i) => (i + 1) % urls.length);
      if (e.key === "ArrowLeft") setIndex((i) => (i - 1 + urls.length) % urls.length);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [urls.length, onClose]);

  // Touch swipe
  const touchStartX = useRef<number | null>(null);
  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (dx < -50) setIndex((i) => (i + 1) % urls.length);
    if (dx > 50) setIndex((i) => (i - 1 + urls.length) % urls.length);
    touchStartX.current = null;
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/60 border border-white/10 flex items-center justify-center text-white"
      >
        <X size={20} />
      </button>

      {/* Counter */}
      {urls.length > 1 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 text-xs text-gray-400 bg-black/60 px-3 py-1 rounded-full">
          {index + 1} / {urls.length}
        </div>
      )}

      {/* Image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={urls[index]}
        alt={`Photo ${index + 1}`}
        className="max-w-full max-h-[80vh] object-contain rounded-lg"
      />

      {/* Prev / Next */}
      {urls.length > 1 && (
        <>
          <button
            onClick={() => setIndex((i) => (i - 1 + urls.length) % urls.length)}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 border border-white/10 flex items-center justify-center text-white"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => setIndex((i) => (i + 1) % urls.length)}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 border border-white/10 flex items-center justify-center text-white"
          >
            <ChevronRight size={20} />
          </button>
        </>
      )}
    </div>
  );
}

// ─── Photo Thumbnail Strip ─────────────────────────────────────────────────────

function PhotoStrip({ urls }: { urls: string[] }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  if (!urls || urls.length === 0) return null;
  return (
    <>
      <div className="flex gap-2 overflow-x-auto scrollbar-hide py-1">
        {urls.map((url, i) => {
          const ts = extractPhotoTimestamp(url);
          return (
            <button
              key={url}
              onClick={() => setLightboxIndex(i)}
              className="relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-[var(--border-secondary)] group"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`Photo ${i + 1}`}
                loading="lazy"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                <ZoomIn size={14} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              {ts && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-0.5 py-0.5 text-center">
                  <span className="text-white text-[8px] leading-none font-medium">{ts}</span>
                </div>
              )}
            </button>
          );
        })}
      </div>
      {lightboxIndex !== null && (
        <Lightbox
          urls={urls}
          startIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  );
}

// ─── Report Preview Card ──────────────────────────────────────────────────────
// Used both for the pre-submit preview and for "View Full Report" in past reports.

interface ReportPreviewProps {
  projectName: string;
  subName: string;
  submittedBy: string;
  reportDate: string;
  activities: Activity[];
  selectedActivityIds: string[];
  activityStatuses: Record<string, string>;
  manpowerCount: number;
  totalHours: number;
  delayReasons: string[];
  notes: string;
  photos: PhotoFile[];       // for pre-submit preview (local)
  photoUrls?: string[];      // for past report preview (remote)
  onEdit?: () => void;
  onConfirm?: () => void;
  confirming?: boolean;
}

function ReportPreviewCard({
  projectName,
  subName,
  submittedBy,
  reportDate,
  activities,
  selectedActivityIds,
  activityStatuses,
  manpowerCount,
  totalHours,
  delayReasons,
  notes,
  photos,
  photoUrls,
  onEdit,
  onConfirm,
  confirming,
}: ReportPreviewProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Build combined photo URL list for lightbox
  const allPhotoUrls: string[] = [
    ...(photoUrls ?? []),
    ...photos.map((p) => p.previewUrl),
  ];

  const workedActivities = activities.filter((a) =>
    selectedActivityIds.includes(a.id)
  );
  const activeDelays = delayReasons.filter((d) => d !== "None");

  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <div className="bg-[#13131A] border border-[var(--border-primary)] rounded-2xl p-5 space-y-4">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-[#F97316] uppercase tracking-wider">
            📋 Daily Report Preview
          </p>
          <h2 className="text-lg font-bold text-white">{formatDate(reportDate)}</h2>
          <p className="text-sm text-gray-300">{projectName}</p>
          <p className="text-sm text-[#F97316]">{subName}</p>
          <p className="text-xs text-gray-500">Submitted by: {submittedBy}</p>
        </div>

        {/* Tasks */}
        {workedActivities.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Tasks Worked On
            </p>
            {workedActivities.map((act) => {
              const pct = parseInt(activityStatuses[act.id] ?? "0", 10);
              return (
                <div
                  key={act.id}
                  className="flex items-center justify-between gap-3 bg-[var(--bg-primary)] rounded-xl px-4 py-3"
                >
                  <p className="text-sm text-gray-200 flex-1 leading-snug">
                    {act.activity_name}
                  </p>
                  <div
                    className={`w-12 h-12 rounded-full border-2 flex items-center justify-center flex-shrink-0 text-sm font-bold ${
                      pct >= 100
                        ? "border-green-500 text-green-400 bg-green-900/20"
                        : pct >= 75
                        ? "border-emerald-500 text-emerald-400 bg-emerald-900/20"
                        : pct >= 50
                        ? "border-orange-500 text-orange-400 bg-orange-900/20"
                        : pct >= 25
                        ? "border-blue-500 text-blue-400 bg-blue-900/20"
                        : "border-gray-600 text-gray-400 bg-gray-900/20"
                    }`}
                  >
                    {pct}%
                  </div>
                </div>
              );
            })}
            {selectedActivityIds.length === 0 && (
              <p className="text-xs text-gray-600 italic">No tasks selected</p>
            )}
          </div>
        )}

        {/* Manpower */}
        <div className="flex gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <Users size={15} className="text-[#F97316]" />
            <span>
              <span className="font-bold text-white">{manpowerCount}</span> workers
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <Timer size={15} className="text-[#F97316]" />
            <span>
              <span className="font-bold text-white">{totalHours}</span>h total
            </span>
          </div>
        </div>

        {/* Delays */}
        {activeDelays.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Delays / Issues
            </p>
            <div className="flex flex-wrap gap-1.5">
              {activeDelays.map((d) => (
                <span
                  key={d}
                  className="text-xs px-2 py-0.5 rounded-full bg-red-900/30 border border-red-700/30 text-red-400"
                >
                  {d}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {notes.trim() && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Notes
            </p>
            <p className="text-sm text-gray-300 italic">"{notes}"</p>
          </div>
        )}

        {/* Photos */}
        {allPhotoUrls.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Photos ({allPhotoUrls.length})
            </p>
            <div className="grid grid-cols-3 gap-2">
              {allPhotoUrls.map((url, i) => {
                const ts = extractPhotoTimestamp(url);
                return (
                  <button
                    key={url + i}
                    onClick={() => setLightboxIndex(i)}
                    className="relative aspect-square rounded-xl overflow-hidden border border-[var(--border-secondary)] group"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={`Photo ${i + 1}`}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                      <ZoomIn size={18} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    {ts && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 rounded-b-xl px-1 py-1 text-center">
                        <span className="text-white text-[9px] leading-none font-medium">{ts}</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Action buttons */}
      {(onEdit || onConfirm) && (
        <div className="flex gap-3">
          {onEdit && (
            <button
              onClick={onEdit}
              className="flex-1 bg-[#13131A] border border-[var(--border-primary)] hover:border-gray-500 text-gray-300 font-semibold px-4 py-4 rounded-2xl text-base transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft size={18} />
              Edit Report
            </button>
          )}
          {onConfirm && (
            <button
              onClick={onConfirm}
              disabled={confirming}
              className="flex-1 bg-green-700 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold px-4 py-4 rounded-2xl text-base transition-colors flex items-center justify-center gap-2 shadow-lg shadow-green-900/30"
            >
              {confirming ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <>
                  <CheckCircle2 size={18} />
                  Submit Report
                </>
              )}
            </button>
          )}
        </div>
      )}

      {lightboxIndex !== null && (
        <Lightbox
          urls={allPhotoUrls}
          startIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  );
}

// ─── Activity Card ─────────────────────────────────────────────────────────────

function ActivityCard({
  activity,
  trendPct,
  prevTrendPct,
}: {
  activity: Activity;
  trendPct?: number | null;
  prevTrendPct?: number | null;
}) {
  const pct = activity.percent_complete ?? 0;

  // Trend indicator: compare trendPct (latest reported) vs prevTrendPct (prior report)
  let trendNode: React.ReactNode = null;
  if (trendPct != null && prevTrendPct != null) {
    if (trendPct > prevTrendPct) {
      trendNode = (
        <span className="text-green-400 text-xs font-bold" title={`${prevTrendPct}% → ${trendPct}%`}>
          ↑
        </span>
      );
    } else if (trendPct < prevTrendPct) {
      trendNode = (
        <span className="text-red-400 text-xs font-bold" title={`${prevTrendPct}% → ${trendPct}%`}>
          ↓
        </span>
      );
    } else {
      trendNode = (
        <span className="text-gray-500 text-xs font-bold" title="No change since last report">
          →
        </span>
      );
    }
  }

  return (
    <div className="bg-[#13131A] border border-[var(--border-primary)] rounded-xl p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-gray-100 leading-snug">{activity.activity_name}</p>
        {statusChip(activity.status, pct)}
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
        {activity.start_date && (
          <span>Start: <span className="text-gray-300">{formatDate(activity.start_date)}</span></span>
        )}
        {activity.finish_date && (
          <span>Finish: <span className="text-gray-300">{formatDate(activity.finish_date)}</span></span>
        )}
        {activity.trade && (
          <span>Trade: <span className="text-gray-300">{activity.trade}</span></span>
        )}
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-gray-500">
          <span>Progress</span>
          <span className="flex items-center gap-1">
            {trendNode}
            <span className="text-gray-300">{trendPct != null ? trendPct : pct}%</span>
          </span>
        </div>
        <div className="h-1.5 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-[#F97316] transition-all"
            style={{ width: `${Math.min(trendPct != null ? trendPct : pct, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  accent = false,
  danger = false,
}: {
  label: string;
  value: string | number;
  accent?: boolean;
  danger?: boolean;
}) {
  return (
    <div className="bg-[#13131A] border border-[var(--border-primary)] rounded-xl p-3 flex flex-col items-center text-center">
      <span
        className={`text-2xl font-bold ${
          danger ? "text-red-400" : accent ? "text-[#F97316]" : "text-gray-100"
        }`}
      >
        {value}
      </span>
      <span className="text-xs text-gray-500 mt-0.5">{label}</span>
    </div>
  );
}

// ─── Empty State ───────────────────────────────────────────────────────────────

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-12 text-gray-600">
      <CalendarDays size={32} className="mx-auto mb-3 opacity-40" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

// ─── My Full Scope Tab ────────────────────────────────────────────────────────

function FullScopeTab({
  activities,
  pastReports,
}: {
  activities: ViewData["activities"];
  pastReports: PastReport[];
}) {
  const [completeExpanded, setCompleteExpanded] = useState(false);

  // Build trend map: activity_id -> { latest: number, prev: number | null }
  // pastReports is sorted newest-first; cross-reference worked_on_activities
  const trendMap = useMemo(() => {
    const map: Record<string, { latest: number; prev: number | null }> = {};
    // Walk through reports newest-first
    for (const report of pastReports) {
      for (const wa of report.worked_on_activities) {
        const rawPct = parseInt(wa.status, 10);
        const pct = isNaN(rawPct) ? 0 : rawPct;
        if (!(wa.activity_id in map)) {
          // First occurrence = latest
          map[wa.activity_id] = { latest: pct, prev: null };
        } else if (map[wa.activity_id].prev === null) {
          // Second occurrence = previous
          map[wa.activity_id].prev = pct;
        }
      }
    }
    return map;
  }, [pastReports]);

  const allActivities = [
    ...activities.overdue,
    ...activities.today,
    ...activities.this_week,
    ...activities.next_two_weeks,
    ...activities.upcoming,
    ...activities.complete,
  ];

  const seen = new Set<string>();
  const deduped: Activity[] = [];
  for (const act of allActivities) {
    if (!seen.has(act.id)) {
      seen.add(act.id);
      deduped.push(act);
    }
  }

  const overdue = deduped.filter(
    (a) =>
      a.status === "late" ||
      (a.finish_date &&
        new Date(a.finish_date + "T12:00:00") < new Date() &&
        a.percent_complete < 100 &&
        a.status !== "complete")
  );
  const inProgress = deduped.filter(
    (a) => a.status === "in_progress" && !overdue.find((o) => o.id === a.id)
  );
  const complete = deduped.filter(
    (a) => a.status === "complete" || a.percent_complete >= 100
  );
  const notStarted = deduped.filter(
    (a) =>
      !overdue.find((o) => o.id === a.id) &&
      !inProgress.find((ip) => ip.id === a.id) &&
      !complete.find((c) => c.id === a.id)
  );

  const total = deduped.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400">
          <span className="text-white font-semibold">{total}</span> tasks assigned to your scope
        </p>
      </div>

      {overdue.length > 0 && (
        <ScopeGroup
          label="Overdue"
          count={overdue.length}
          accentClass="text-red-400"
          borderClass="border-red-800/40"
          bgClass="bg-red-950/20"
          iconNode={<AlertTriangle size={14} className="text-red-400" />}
          activities={overdue}
          defaultOpen
          trendMap={trendMap}
        />
      )}

      {inProgress.length > 0 && (
        <ScopeGroup
          label="In Progress"
          count={inProgress.length}
          accentClass="text-orange-400"
          borderClass="border-orange-800/40"
          bgClass="bg-orange-950/20"
          iconNode={<Clock size={14} className="text-orange-400" />}
          activities={inProgress}
          defaultOpen
          trendMap={trendMap}
        />
      )}

      {notStarted.length > 0 && (
        <ScopeGroup
          label="Not Started"
          count={notStarted.length}
          accentClass="text-gray-300"
          borderClass="border-[var(--border-primary)]"
          bgClass="bg-[#13131A]"
          iconNode={<ChevronRight size={14} className="text-gray-500" />}
          activities={notStarted}
          defaultOpen
          trendMap={trendMap}
        />
      )}

      {complete.length > 0 && (
        <ScopeGroup
          label="Complete"
          count={complete.length}
          accentClass="text-green-400"
          borderClass="border-green-800/40"
          bgClass="bg-green-950/20"
          iconNode={<CheckCircle2 size={14} className="text-green-400" />}
          activities={complete}
          defaultOpen={false}
          forceOpen={completeExpanded}
          onToggle={() => setCompleteExpanded((v) => !v)}
          trendMap={trendMap}
        />
      )}

      {total === 0 && (
        <EmptyState message="No activities assigned to your scope yet." />
      )}
    </div>
  );
}

function ScopeGroup({
  label,
  count,
  accentClass,
  borderClass,
  bgClass,
  iconNode,
  activities,
  defaultOpen,
  forceOpen,
  onToggle,
  trendMap,
}: {
  label: string;
  count: number;
  accentClass: string;
  borderClass: string;
  bgClass: string;
  iconNode: React.ReactNode;
  activities: Activity[];
  defaultOpen: boolean;
  forceOpen?: boolean;
  onToggle?: () => void;
  trendMap?: Record<string, { latest: number; prev: number | null }>;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const isOpen = forceOpen !== undefined ? forceOpen : open;

  function toggle() {
    if (onToggle) onToggle();
    else setOpen((v) => !v);
  }

  return (
    <div className={`border ${borderClass} rounded-xl overflow-hidden`}>
      <button
        onClick={toggle}
        className={`w-full flex items-center justify-between px-4 py-3 ${bgClass}`}
      >
        <div className="flex items-center gap-2">
          {iconNode}
          <span className={`text-sm font-semibold ${accentClass}`}>{label}</span>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full bg-black/20 ${accentClass}`}>
            {count}
          </span>
        </div>
        <ChevronDown
          size={16}
          className={`text-gray-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="p-3 space-y-2 bg-[var(--bg-primary)]">
          {activities.map((act) => {
            const trend = trendMap?.[act.id];
            return (
              <ActivityCard
                key={act.id}
                activity={act}
                trendPct={trend?.latest}
                prevTrendPct={trend?.prev ?? undefined}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Past Reports Section ─────────────────────────────────────────────────────

function PastReportsSection({
  reports,
  allActivities,
  projectName,
  subName,
}: {
  reports: PastReport[];
  allActivities: Activity[];
  projectName: string;
  subName: string;
}) {
  const [open, setOpen] = useState(false);
  const [fullReportId, setFullReportId] = useState<string | null>(null);

  if (reports.length === 0) return null;

  const fullReport = fullReportId
    ? reports.find((r) => r.id === fullReportId)
    : null;

  // "View Full Report" overlay
  if (fullReport) {
    return (
      <div className="border border-[var(--border-primary)] rounded-xl overflow-hidden">
        <div className="bg-[#13131A] px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setFullReportId(null)}
            className="text-gray-400 hover:text-gray-200 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <span className="text-sm font-semibold text-gray-200">
            Full Report — {formatDate(fullReport.report_date)}
          </span>
        </div>
        <div className="bg-[var(--bg-primary)] p-4">
          <ReportPreviewCard
            projectName={projectName}
            subName={subName}
            submittedBy={fullReport.submitted_by}
            reportDate={fullReport.report_date}
            activities={allActivities}
            selectedActivityIds={fullReport.worked_on_activities.map((w) => w.activity_id)}
            activityStatuses={Object.fromEntries(
              fullReport.worked_on_activities.map((w) => [w.activity_id, w.status])
            )}
            manpowerCount={fullReport.manpower_count ?? 0}
            totalHours={fullReport.total_hours ?? 0}
            delayReasons={fullReport.delay_reasons}
            notes={fullReport.notes ?? ""}
            photos={[]}
            photoUrls={fullReport.photo_urls ?? []}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="border border-[var(--border-primary)] rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-[#13131A]"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-200">📋 Past Reports</span>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[var(--bg-tertiary)] text-gray-400">
            {reports.length}
          </span>
        </div>
        <ChevronDown
          size={16}
          className={`text-gray-500 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="divide-y divide-[var(--border-primary)] bg-[var(--bg-primary)]">
          {reports.map((report) => (
            <div key={report.id} className="p-4 space-y-3">
              {/* Date + submitted by */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-100">
                  {formatDate(report.report_date)}
                </span>
                <span className="text-xs text-gray-500">by {report.submitted_by}</span>
              </div>

              {/* Manpower + hours */}
              <div className="flex gap-4 text-xs text-gray-400">
                {report.manpower_count != null && (
                  <span className="flex items-center gap-1">
                    <Users size={11} className="text-[#F97316]" />
                    {report.manpower_count} workers
                  </span>
                )}
                {report.total_hours != null && (
                  <span className="flex items-center gap-1">
                    <Timer size={11} className="text-[#F97316]" />
                    {report.total_hours}h total
                  </span>
                )}
              </div>

              {/* Delay chips */}
              {report.delay_reasons.length > 0 &&
                !report.delay_reasons.includes("None") && (
                  <div className="flex flex-wrap gap-1.5">
                    {report.delay_reasons.map((d) => (
                      <span
                        key={d}
                        className="text-xs px-2 py-0.5 rounded-full bg-red-900/30 border border-red-700/30 text-red-400"
                      >
                        {d}
                      </span>
                    ))}
                  </div>
                )}

              {/* Task progress */}
              {report.worked_on_activities.length > 0 && (
                <div className="space-y-1">
                  {report.worked_on_activities.map((task, i) => {
                    const pct = parseInt(task.status, 10);
                    const displayPct = isNaN(pct) ? task.status : `${pct}%`;
                    const act = allActivities.find((a) => a.id === task.activity_id);
                    return (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 truncate pr-2 flex-1">
                          {act?.activity_name ?? "Task"}
                        </span>
                        <span className="text-gray-300 flex-shrink-0">{displayPct}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Photos */}
              {report.photo_urls && report.photo_urls.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs text-gray-600 flex items-center gap-1">
                    <Camera size={11} />
                    {report.photo_urls.length} photo{report.photo_urls.length !== 1 ? "s" : ""}
                  </p>
                  <PhotoStrip urls={report.photo_urls} />
                </div>
              )}

              {/* Notes */}
              {report.notes && (
                <p className="text-xs text-gray-500 italic">"{report.notes}"</p>
              )}

              {/* View full report */}
              <button
                onClick={() => setFullReportId(report.id)}
                className="w-full text-xs text-[#F97316] border border-[#F97316]/30 rounded-xl py-2 hover:bg-[#F97316]/10 transition-colors"
              >
                View Full Report →
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Progress Report Tab ──────────────────────────────────────────────────────

interface ReportState {
  selectedActivityIds: Set<string>;
  activityStatuses: Record<string, string>;
  manpowerCount: number;
  totalHours: number;
  delayReasons: Set<string>;
  notes: string;
  submittedBy: string;
}

const DELAY_CHIPS = [
  "Weather",
  "Material Delay",
  "Waiting on Other Trade",
  "Inspection Hold",
  "Equipment",
  "Design Issue",
  "None",
];

const MAX_PHOTOS = 10;

function ProgressReportTab({
  activities,
  token,
  ackName,
  pastReports,
  projectName,
  subName,
}: {
  activities: ViewData["activities"];
  token: string;
  ackName: string;
  pastReports: PastReport[];
  projectName: string;
  subName: string;
}) {
  // Build reportable activities
  const allActivities = [
    ...activities.overdue,
    ...activities.today,
    ...activities.this_week,
    ...activities.next_two_weeks,
    ...activities.upcoming,
  ];
  const seen = new Set<string>();
  const reportableActivities: Activity[] = [];
  for (const act of allActivities) {
    if (!seen.has(act.id) && act.status !== "complete" && act.percent_complete < 100) {
      seen.add(act.id);
      reportableActivities.push(act);
    }
  }

  // All activities (for past report previews — include complete)
  const allActivitiesForLookup = [
    ...allActivities,
    ...activities.complete,
  ];
  const seenAll = new Set<string>();
  const deduped: Activity[] = [];
  for (const act of allActivitiesForLookup) {
    if (!seenAll.has(act.id)) { seenAll.add(act.id); deduped.push(act); }
  }

  const [report, setReport] = useState<ReportState>({
    selectedActivityIds: new Set(),
    activityStatuses: {},
    manpowerCount: 1,
    totalHours: 8,
    delayReasons: new Set(),
    notes: "",
    submittedBy: ackName,
  });

  // Photos
  const [photos, setPhotos] = useState<PhotoFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // UI state machine: "form" | "preview" | "success"
  const [mode, setMode] = useState<"form" | "preview" | "success">("form");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitResult, setSubmitResult] = useState<{ submitted_at: string } | null>(null);

  // Lightbox for photo preview in form mode
  const [formLightboxIndex, setFormLightboxIndex] = useState<number | null>(null);

  function toggleActivity(id: string) {
    setReport((prev) => {
      const next = new Set(prev.selectedActivityIds);
      if (next.has(id)) {
        next.delete(id);
        const statuses = { ...prev.activityStatuses };
        delete statuses[id];
        return { ...prev, selectedActivityIds: next, activityStatuses: statuses };
      }
      const statuses = { ...prev.activityStatuses, [id]: "0" };
      return {
        ...prev,
        selectedActivityIds: new Set([...prev.selectedActivityIds, id]),
        activityStatuses: statuses,
      };
    });
  }

  function setActivityStatus(id: string, status: string) {
    setReport((prev) => ({
      ...prev,
      activityStatuses: { ...prev.activityStatuses, [id]: status },
    }));
  }

  function setManpower(val: number) {
    setReport((prev) => ({ ...prev, manpowerCount: val, totalHours: val * 8 }));
  }

  function toggleDelay(chip: string) {
    setReport((prev) => {
      const next = new Set(prev.delayReasons);
      if (chip === "None") return { ...prev, delayReasons: new Set(["None"]) };
      next.delete("None");
      if (next.has(chip)) next.delete(chip);
      else next.add(chip);
      return { ...prev, delayReasons: next };
    });
  }

  // Handle file input change
  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    const remaining = MAX_PHOTOS - photos.length;
    const toProcess = files.slice(0, remaining);

    const newPhotos: PhotoFile[] = await Promise.all(
      toProcess.map(async (file) => {
        const oversized = file.size > 5 * 1024 * 1024;
        // Create preview from original (fast, before compression)
        const previewUrl = URL.createObjectURL(file);
        return {
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          file,
          previewUrl,
          sizeBytes: file.size,
          oversized,
        };
      })
    );

    setPhotos((prev) => [...prev, ...newPhotos]);
    // Reset input so same file can be re-selected if removed
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removePhoto(id: string) {
    setPhotos((prev) => {
      const photo = prev.find((p) => p.id === id);
      if (photo) URL.revokeObjectURL(photo.previewUrl);
      return prev.filter((p) => p.id !== id);
    });
  }

  // Upload all photos and return URLs
  async function uploadPhotos(): Promise<string[]> {
    const reportDate = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD in local tz
    const urls: string[] = [];

    for (const photo of photos) {
      // Compress if over 2MB
      const compressed = await compressImageIfNeeded(photo.file);
      const form = new FormData();
      form.append("file", compressed, compressed.name);
      form.append("report_date", reportDate);

      const res = await fetch(`/api/view/${token}/upload-photo`, {
        method: "POST",
        body: form,
      });

      if (res.ok) {
        const json = await res.json();
        if (json.url) urls.push(json.url);
      }
      // If upload fails, we skip that photo and continue
    }

    return urls;
  }

  async function handleConfirmSubmit() {
    if (!report.submittedBy.trim()) return;
    setSubmitting(true);
    setSubmitError(null);

    try {
      // 1. Upload photos first
      const photoUrls = photos.length > 0 ? await uploadPhotos() : [];

      // 2. Submit the report
      const res = await fetch(`/api/view/${token}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          worked_on_activity_ids: Array.from(report.selectedActivityIds),
          activity_statuses: report.activityStatuses,
          manpower_count: report.manpowerCount,
          total_hours: report.totalHours,
          delay_reasons: Array.from(report.delayReasons),
          notes: report.notes,
          submitted_by: report.submittedBy.trim(),
          photo_urls: photoUrls,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setSubmitError(json.error ?? "Failed to submit report");
        setMode("preview"); // stay on preview, show error
        return;
      }

      setSubmitResult({ submitted_at: json.submitted_at ?? new Date().toISOString() });
      setMode("success");
    } catch {
      setSubmitError("Network error — please try again");
      setMode("preview");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Success state
  if (mode === "success" && submitResult) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-green-900/30 border border-green-700/40 flex items-center justify-center">
          <CheckCircle2 size={32} className="text-green-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">Report Submitted</h2>
          <p className="text-sm text-gray-400 mt-1">
            {new Date(submitResult.submitted_at).toLocaleString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </p>
        </div>
        <p className="text-xs text-gray-600 max-w-xs">
          Your foreman report has been recorded. The GC can view it in their IronTrack dashboard.
        </p>
        <button
          onClick={() => {
            setSubmitResult(null);
            setMode("form");
            setReport({
              selectedActivityIds: new Set(),
              activityStatuses: {},
              manpowerCount: 1,
              totalHours: 8,
              delayReasons: new Set(),
              notes: "",
              submittedBy: ackName,
            });
            setPhotos([]);
            setSubmitError(null);
          }}
          className="mt-4 text-sm text-[#F97316] underline underline-offset-2"
        >
          Submit another report
        </button>
      </div>
    );
  }

  // ── Preview state
  if (mode === "preview") {
    return (
      <div className="space-y-5 pb-8">
        <div className="bg-[#1A1620] border border-purple-800/30 rounded-xl px-4 py-3">
          <p className="text-xs text-purple-300">
            Review your report before sending. Tap <strong>Submit Report</strong> to send it to the office.
          </p>
        </div>

        {submitError && (
          <p className="text-xs text-red-400 text-center bg-red-900/20 border border-red-700/30 rounded-xl px-4 py-3">
            {submitError}
          </p>
        )}

        <ReportPreviewCard
          projectName={projectName}
          subName={subName}
          submittedBy={report.submittedBy}
          reportDate={new Date().toLocaleDateString('en-CA')}
          activities={reportableActivities}
          selectedActivityIds={Array.from(report.selectedActivityIds)}
          activityStatuses={report.activityStatuses}
          manpowerCount={report.manpowerCount}
          totalHours={report.totalHours}
          delayReasons={Array.from(report.delayReasons)}
          notes={report.notes}
          photos={photos}
          onEdit={() => { setSubmitError(null); setMode("form"); }}
          onConfirm={handleConfirmSubmit}
          confirming={submitting}
        />
      </div>
    );
  }

  // ── Form state
  return (
    <div className="space-y-5 pb-8">
      {/* Past Reports */}
      <PastReportsSection
        reports={pastReports}
        allActivities={deduped}
        projectName={projectName}
        subName={subName}
      />

      {/* Beta banner */}
      {/* TODO: Check sub_companies.subscription_status when beta ends */}
      <div className="bg-[#1A1620] border border-purple-800/30 rounded-xl px-4 py-3 flex items-center gap-3">
        <span className="text-base">📊</span>
        <p className="text-xs text-purple-300 leading-snug">
          <span className="font-semibold">Progress Reports — Free during beta.</span>{" "}
          Coming soon: $10/month for your whole team.
        </p>
      </div>

      {/* Section 1: Tasks */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-200">What did you work on today?</h3>
        <p className="text-xs text-gray-500">Tap to select tasks you worked on</p>

        {reportableActivities.length === 0 ? (
          <p className="text-xs text-gray-600 py-4 text-center">
            No active tasks in your scope right now.
          </p>
        ) : (
          <div className="space-y-2">
            {reportableActivities.map((act) => {
              const selected = report.selectedActivityIds.has(act.id);
              return (
                <div key={act.id} className="space-y-2">
                  <button
                    onClick={() => toggleActivity(act.id)}
                    className={`w-full text-left rounded-xl p-4 border transition-all ${
                      selected
                        ? "bg-[#F97316]/10 border-[#F97316]/50"
                        : "bg-[#13131A] border-[var(--border-primary)]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm text-gray-100 leading-snug flex-1">
                        {act.activity_name}
                      </p>
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                          selected
                            ? "bg-[#F97316] border-[#F97316]"
                            : "border-[#3a3a45] bg-transparent"
                        }`}
                      >
                        {selected && <CheckCircle2 size={12} className="text-white" />}
                      </div>
                    </div>
                    {act.finish_date && (
                      <p className="text-xs text-gray-500 mt-1">
                        Due: {formatDate(act.finish_date)}
                      </p>
                    )}
                  </button>

                  {selected && (
                    <div className="flex gap-1.5 px-1">
                      {(
                        [
                          { key: "0", label: "0%" },
                          { key: "25", label: "25%" },
                          { key: "50", label: "50%" },
                          { key: "75", label: "75%" },
                          { key: "100", label: "100%" },
                        ] as { key: string; label: string }[]
                      ).map(({ key, label }) => {
                        const active = report.activityStatuses[act.id] === key;
                        return (
                          <button
                            key={key}
                            onClick={() => setActivityStatus(act.id, key)}
                            className={`flex-1 py-2.5 px-1 rounded-lg text-xs font-bold border transition-colors ${
                              active
                                ? key === "100"
                                  ? "bg-green-800/40 border-green-600/50 text-green-300"
                                  : key === "75"
                                  ? "bg-emerald-800/40 border-emerald-600/50 text-emerald-300"
                                  : key === "50"
                                  ? "bg-orange-800/40 border-orange-600/50 text-orange-300"
                                  : key === "25"
                                  ? "bg-blue-800/40 border-blue-600/50 text-blue-300"
                                  : "bg-[var(--bg-tertiary)] border-[var(--border-secondary)] text-gray-300"
                                : "bg-[var(--bg-primary)] border-[var(--border-primary)] text-gray-500"
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="border-t border-[var(--border-primary)]" />

      {/* Section 2: Manpower */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
          <Users size={15} className="text-[#F97316]" />
          Manpower
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs text-gray-500">Workers on site today</label>
            <input
              type="number"
              min={0}
              max={999}
              value={report.manpowerCount}
              onChange={(e) => setManpower(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full bg-[#13131A] border border-[var(--border-primary)] rounded-xl px-4 py-3 text-white text-base font-semibold text-center focus:outline-none focus:border-[#F97316] focus:ring-1 focus:ring-[#F97316]/30 transition"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-gray-500 flex items-center gap-1">
              <Timer size={11} /> Total hours worked
            </label>
            <input
              type="number"
              min={0}
              max={9999}
              step={0.5}
              value={report.totalHours}
              onChange={(e) =>
                setReport((prev) => ({
                  ...prev,
                  totalHours: Math.max(0, parseFloat(e.target.value) || 0),
                }))
              }
              className="w-full bg-[#13131A] border border-[var(--border-primary)] rounded-xl px-4 py-3 text-white text-base font-semibold text-center focus:outline-none focus:border-[#F97316] focus:ring-1 focus:ring-[#F97316]/30 transition"
            />
          </div>
        </div>
      </div>

      <div className="border-t border-[var(--border-primary)]" />

      {/* Section 3: Delays */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-200">Delays / Issues</h3>
          <span className="text-xs text-gray-600">Optional</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {DELAY_CHIPS.map((chip) => {
            const active = report.delayReasons.has(chip);
            return (
              <button
                key={chip}
                onClick={() => toggleDelay(chip)}
                className={`px-3 py-2 rounded-full text-xs font-medium border transition-colors ${
                  active
                    ? chip === "None"
                      ? "bg-gray-700 border-gray-500 text-gray-100"
                      : "bg-red-900/40 border-red-600/50 text-red-300"
                    : "bg-[#13131A] border-[var(--border-primary)] text-gray-400"
                }`}
              >
                {chip}
              </button>
            );
          })}
        </div>
        <textarea
          value={report.notes}
          onChange={(e) => setReport((prev) => ({ ...prev, notes: e.target.value }))}
          placeholder="Additional notes… (optional)"
          rows={3}
          className="w-full bg-[#13131A] border border-[var(--border-primary)] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#F97316] focus:ring-1 focus:ring-[#F97316]/30 transition resize-none"
        />
      </div>

      <div className="border-t border-[var(--border-primary)]" />

      {/* Section 4: Photos */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
            <Camera size={15} className="text-[#F97316]" />
            Photos
            {photos.length > 0 && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[#F97316]/20 border border-[#F97316]/30 text-[#F97316]">
                {photos.length}
              </span>
            )}
          </h3>
          <span className="text-xs text-gray-600">Optional · max {MAX_PHOTOS}</span>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Add Photo button */}
        {photos.length < MAX_PHOTOS && (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-3 bg-[#13131A] border-2 border-dashed border-[var(--border-secondary)] hover:border-[#F97316]/50 hover:bg-[#F97316]/5 rounded-2xl py-5 transition-colors group"
          >
            <Camera size={22} className="text-gray-500 group-hover:text-[#F97316] transition-colors" />
            <span className="text-sm text-gray-400 group-hover:text-gray-200 font-medium transition-colors">
              Add Photo
            </span>
          </button>
        )}

        {/* Thumbnail strip */}
        {photos.length > 0 && (
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
            {photos.map((photo, i) => (
              <div key={photo.id} className="relative flex-shrink-0">
                <button
                  onClick={() => setFormLightboxIndex(i)}
                  className="w-20 h-20 rounded-xl overflow-hidden border border-[var(--border-secondary)] block"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.previewUrl}
                    alt={`Photo ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
                {/* Remove button */}
                <button
                  onClick={() => removePhoto(photo.id)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-600 border border-[var(--bg-primary)] flex items-center justify-center shadow-lg"
                >
                  <X size={11} className="text-white" />
                </button>
                {/* Size warning */}
                {photo.oversized && (
                  <div className="absolute bottom-0 left-0 right-0 bg-yellow-900/80 rounded-b-xl px-1 py-0.5 text-center">
                    <span className="text-[9px] text-yellow-300 leading-none">will compress</span>
                  </div>
                )}
              </div>
            ))}

            {/* Add more button inline */}
            {photos.length < MAX_PHOTOS && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-shrink-0 w-20 h-20 rounded-xl border-2 border-dashed border-[var(--border-secondary)] hover:border-[#F97316]/50 flex flex-col items-center justify-center gap-1 transition-colors group"
              >
                <Camera size={16} className="text-gray-600 group-hover:text-[#F97316] transition-colors" />
                <span className="text-[10px] text-gray-600 group-hover:text-gray-400 transition-colors">Add</span>
              </button>
            )}
          </div>
        )}

        {/* Lightbox for form photos */}
        {formLightboxIndex !== null && (
          <Lightbox
            urls={photos.map((p) => p.previewUrl)}
            startIndex={formLightboxIndex}
            onClose={() => setFormLightboxIndex(null)}
          />
        )}
      </div>

      <div className="border-t border-[var(--border-primary)]" />

      {/* Section 5: Submit */}
      <div className="space-y-3">
        <div className="space-y-1.5">
          <label className="text-xs text-gray-500">Submitted by</label>
          <input
            type="text"
            value={report.submittedBy}
            onChange={(e) => setReport((prev) => ({ ...prev, submittedBy: e.target.value }))}
            placeholder="Your name"
            className="w-full bg-[#13131A] border border-[var(--border-primary)] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#F97316] focus:ring-1 focus:ring-[#F97316]/30 transition"
          />
        </div>

        {/* Review → Preview */}
        <button
          onClick={() => setMode("preview")}
          disabled={!report.submittedBy.trim()}
          className="w-full bg-[#F97316] hover:bg-[#ea6c0f] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold px-4 py-4 rounded-2xl text-base transition-colors flex items-center justify-center gap-2 shadow-lg shadow-orange-900/30"
        >
          <Send size={18} />
          Review Report
        </button>

        <p className="text-xs text-gray-600 text-center">
          You&apos;ll review before it sends. One report per day — submitting again today updates the previous.
        </p>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type TabKey = "today" | "full_scope" | "this_week" | "next_two_weeks" | "progress_report";

export default function SubScheduleViewPage() {
  const { token } = useParams<{ token: string }>();

  const [data, setData] = useState<ViewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<TabKey>("today");
  const [pastReports, setPastReports] = useState<PastReport[]>([]);

  const [ackName, setAckName] = useState("");
  const [ackSubmitting, setAckSubmitting] = useState(false);
  const [ackDone, setAckDone] = useState(false);
  const [ackTimestamp, setAckTimestamp] = useState<string | null>(null);
  const [ackError, setAckError] = useState<string | null>(null);
  const [showGate, setShowGate] = useState(true);

  // ── localStorage session helpers (30-min TTL) ────────────────────────────
  const ACK_SESSION_TTL = 30 * 60 * 1000;

  function loadAckSession(): { name: string; timestamp: number } | null {
    try {
      const raw = localStorage.getItem(`irontrack_ack_${token}`);
      if (!raw) return null;
      const s = JSON.parse(raw);
      if (Date.now() - s.timestamp < ACK_SESSION_TTL) return s;
      localStorage.removeItem(`irontrack_ack_${token}`);
      return null;
    } catch { return null; }
  }

  function saveAckSession(name: string) {
    try {
      localStorage.setItem(
        `irontrack_ack_${token}`,
        JSON.stringify({ name, timestamp: Date.now() })
      );
    } catch { /* ignore */ }
  }

  function loadSubSession(): { company_name: string; full_name: string; token: string; project_id: string } | null {
    // Search all irontrack_sub_session_* keys for a matching token
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key?.startsWith('irontrack_sub_session_')) continue;
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const s = JSON.parse(raw);
        if (s.token === token && Date.now() - s.timestamp < ACK_SESSION_TTL) {
          return s;
        }
      }
    } catch { /* ignore */ }
    return null;
  }

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/view/${token}`);
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json.error ?? "Failed to load schedule");
        return;
      }
      const json: ViewData = await res.json();
      setData(json);
    } catch {
      setError("Network error — please try again");
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchPastReports = useCallback(async () => {
    try {
      const res = await fetch(`/api/view/${token}/reports`);
      if (res.ok) {
        const json: PastReport[] = await res.json();
        setPastReports(Array.isArray(json) ? json : []);
      }
    } catch {
      // Silently ignore — past reports are non-critical
    }
  }, [token]);

  useEffect(() => {
    fetchData();
    fetchPastReports();
  }, [fetchData, fetchPastReports]);

  // ── Check localStorage for existing ack session on mount ─────────────────
  useEffect(() => {
    // Check for existing ack session first
    const ackSession = loadAckSession();
    if (ackSession) {
      setAckName(ackSession.name);
      setAckDone(true);
      setShowGate(false);
      setAckTimestamp(new Date(ackSession.timestamp).toISOString());
      return;
    }

    // Check for sub registration session (auto-fill name)
    const subSession = loadSubSession();
    if (subSession) {
      setAckName(subSession.full_name);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function handleAcknowledge() {
    if (!ackName.trim() || !data) return;
    setAckSubmitting(true);
    setAckError(null);
    try {
      const res = await fetch(`/api/view/${token}/acknowledge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          view_id: data.view_id,
          acknowledged_by: ackName.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setAckError(json.error ?? "Failed to acknowledge");
        return;
      }
      const acknowledgedAt = json.acknowledged_at ?? new Date().toISOString();
      setAckDone(true);
      setShowGate(false);
      setAckTimestamp(acknowledgedAt);
      // Persist ack to localStorage so re-opening within 30 min skips the gate
      saveAckSession(ackName.trim());
    } catch {
      setAckError("Network error — please try again");
    } finally {
      setAckSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <Loader2 className="animate-spin text-[#F97316]" size={32} />
          <p className="text-sm">Loading your schedule…</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center px-4">
        <div className="text-center space-y-3 max-w-sm">
          <XCircle className="text-red-500 mx-auto" size={40} />
          <h1 className="text-lg font-semibold text-gray-100">Schedule Unavailable</h1>
          <p className="text-sm text-gray-400">{error ?? "This link is invalid or has expired."}</p>
          <p className="text-xs text-gray-600">Contact your general contractor for an updated link.</p>
        </div>
      </div>
    );
  }

  const { project, sub, stats, activities } = data;

  const tabs: { key: TabKey; label: string; count?: number }[] = [
    { key: "today", label: "Today", count: activities.today.length + activities.overdue.length },
    { key: "full_scope", label: "My Full Scope", count: stats.total_tasks },
    { key: "this_week", label: "This Week", count: activities.this_week.length },
    { key: "next_two_weeks", label: "Next 2 Weeks", count: activities.next_two_weeks.length },
    { key: "progress_report", label: "Progress Report" },
  ];

  // Gate screen
  if (showGate && !ackDone) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center px-4">
        <div className="w-full max-w-sm space-y-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <img src="/icon-192.png" alt="IronTrack" className="w-8 h-8 rounded-lg object-contain" />
            <span className="text-sm font-semibold text-gray-400 tracking-wide uppercase">
              IronTrack Pulse
            </span>
          </div>

          <div className="text-center space-y-1">
            <h1 className="text-xl font-bold text-white">{project.name}</h1>
            <p className="text-[#F97316] font-medium">{sub.name}</p>
            <p className="text-xs text-gray-500">{sub.trades.join(", ")}</p>
          </div>

          <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-2xl p-6 space-y-4">
            <div className="text-center">
              <CalendarDays size={28} className="mx-auto text-[#F97316] mb-2" />
              <p className="text-sm text-gray-300 leading-relaxed">
                You&apos;ve been shared a filtered schedule view for your trades on this project.
              </p>
            </div>

            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">Your full name</label>
              <input
                type="text"
                value={ackName}
                onChange={(e) => setAckName(e.target.value)}
                placeholder="e.g., Joe Martinez"
                className="w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-[#F97316] focus:ring-1 focus:ring-[#F97316]/30 transition"
                onKeyDown={(e) => { if (e.key === "Enter") handleAcknowledge(); }}
                autoFocus
              />
            </div>

            <p className="text-xs text-gray-500 text-center leading-snug">
              By continuing, I confirm I have received and reviewed the schedule for my trades on this project.
            </p>

            {ackError && (
              <p className="text-xs text-red-400 text-center">{ackError}</p>
            )}

            <button
              onClick={handleAcknowledge}
              disabled={!ackName.trim() || ackSubmitting}
              className="w-full bg-[#F97316] hover:bg-[#ea6c0f] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold px-4 py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
            >
              {ackSubmitting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  Acknowledge {"&"} View Schedule
                </>
              )}
            </button>
          </div>

          <p className="text-[10px] text-gray-700 text-center">
            {"©"} {new Date().getFullYear()} IronTrack Development LLC
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] pb-24">
      {/* Header */}
      <header className="bg-[#0F0F14] border-b border-[var(--border-primary)] sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center gap-1.5">
              <img src="/icon-192.png" alt="IronTrack" className="w-6 h-6 rounded-md object-contain" />
              <span className="text-xs font-semibold text-gray-400 tracking-wide uppercase">
                IronTrack Pulse
              </span>
            </div>
          </div>
          <h1 className="text-base font-bold text-gray-100 leading-tight truncate">
            {project.name}
          </h1>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
            <span className="text-sm text-[#F97316] font-medium">{sub.name}</span>
            {sub.trades.length > 0 && (
              <span className="text-xs text-gray-500">{sub.trades.join(", ")}</span>
            )}
          </div>
          {project.schedule_updated_at && (
            <p className="text-xs text-gray-600 mt-1">
              Schedule as of {formatDate(project.schedule_updated_at.split("T")[0])}
            </p>
          )}
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4">
        {/* Stats Bar */}
        <div className="grid grid-cols-4 gap-2 mt-4">
          <StatCard label="Total Tasks" value={stats.total_tasks} />
          <StatCard label="This Week" value={stats.this_week} accent />
          <StatCard label="Overdue" value={stats.overdue} danger={stats.overdue > 0} />
          <StatCard label="% Done" value={`${stats.pct_complete}%`} accent />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-5 overflow-x-auto scrollbar-hide pb-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "bg-[#F97316] text-white"
                  : "bg-[#13131A] text-gray-400 border border-[var(--border-primary)] hover:text-gray-200"
              }`}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span
                  className={`text-xs rounded-full px-1.5 py-0 ${
                    activeTab === tab.key
                      ? "bg-white/20 text-white"
                      : "bg-[var(--bg-tertiary)] text-gray-500"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="mt-4 space-y-3">
          {/* Today Tab */}
          {activeTab === "today" && (
            <>
              {activities.overdue.length > 0 && (
                <div className="bg-red-950/30 border border-red-800/40 rounded-xl p-3 mb-2">
                  <p className="text-xs font-semibold text-red-400 mb-2 flex items-center gap-1.5">
                    <AlertTriangle size={13} /> {activities.overdue.length} Overdue Task{activities.overdue.length !== 1 ? "s" : ""}
                  </p>
                  <div className="space-y-2">
                    {activities.overdue.map((act) => (
                      <ActivityCard key={act.id} activity={act} />
                    ))}
                  </div>
                </div>
              )}
              {activities.today.length > 0 ? (
                activities.today.map((act) => <ActivityCard key={act.id} activity={act} />)
              ) : activities.overdue.length === 0 ? (
                <EmptyState message="No active tasks today for your trades." />
              ) : null}
            </>
          )}

          {/* Full Scope Tab */}
          {activeTab === "full_scope" && <FullScopeTab activities={activities} pastReports={pastReports} />}

          {/* This Week Tab */}
          {activeTab === "this_week" && (
            <>
              {activities.this_week.length > 0 ? (
                (() => {
                  const byDay = groupByDay(activities.this_week);
                  return Object.entries(byDay)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([day, acts]) => (
                      <div key={day}>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 mt-4 first:mt-0">
                          <CalendarDays size={11} className="inline mr-1.5 -mt-0.5" />
                          {formatDateShort(day)}
                        </p>
                        <div className="space-y-2">
                          {acts.map((act) => <ActivityCard key={act.id} activity={act} />)}
                        </div>
                      </div>
                    ));
                })()
              ) : (
                <EmptyState message="No tasks scheduled this week for your trades." />
              )}
            </>
          )}

          {/* Next 2 Weeks Tab */}
          {activeTab === "next_two_weeks" && (
            <>
              {activities.next_two_weeks.length > 0 ? (
                (() => {
                  const byDay = groupByDay(activities.next_two_weeks);
                  return Object.entries(byDay)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([day, acts]) => (
                      <div key={day}>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 mt-4 first:mt-0">
                          <CalendarDays size={11} className="inline mr-1.5 -mt-0.5" />
                          {formatDateShort(day)}
                        </p>
                        <div className="space-y-2">
                          {acts.map((act) => <ActivityCard key={act.id} activity={act} />)}
                        </div>
                      </div>
                    ));
                })()
              ) : (
                <EmptyState message="No tasks scheduled in the next 2 weeks for your trades." />
              )}
            </>
          )}

          {/* Progress Report Tab */}
          {activeTab === "progress_report" && (
            <ProgressReportTab
              activities={activities}
              token={token}
              ackName={ackName}
              pastReports={pastReports}
              projectName={project.name}
              subName={sub.name}
            />
          )}
        </div>
      </div>

      {/* Acknowledged confirmation (fixed bottom) */}
      {ackDone && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-green-950/60 border-t border-green-700/40 safe-bottom">
          <div className="max-w-2xl mx-auto px-4 py-2 flex items-center gap-2">
            <CheckCircle2 className="text-green-400 flex-shrink-0" size={16} />
            <p className="text-xs text-green-400">
              Acknowledged by{" "}
              <span className="font-semibold text-green-300">{ackName}</span>
              {ackTimestamp && (
                <>
                  {" · "}
                  {new Date(ackTimestamp).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
