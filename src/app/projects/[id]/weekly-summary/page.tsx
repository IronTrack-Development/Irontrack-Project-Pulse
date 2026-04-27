"use client";

import { useEffect, useRef, useState, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Printer, RefreshCw } from "lucide-react";
import { t } from "@/lib/i18n";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Activity {
  id: string;
  activity_name: string;
  start_date?: string;
  finish_date?: string;
  percent_complete: number;
  status: string;
  trade?: string;
  milestone?: boolean;
}

interface SubActivityEntry {
  sub_name: string;
  report_count: number;
  total_manpower: number;
  total_hours: number;
  delays: string[];
  latest_report_date: string;
}

interface PhotoEntry {
  url: string;
  submitted_by: string;
  report_date: string;
}

interface SummaryData {
  project: {
    id: string;
    name: string;
    client_name?: string;
    location?: string;
    health_score: number;
    target_finish_date?: string;
  };
  dateRange: string;
  weekStart: string;
  weekEnd: string;
  execSummary: string;
  schedule: {
    totalActivities: number;
    completeActivities: number;
    inProgressActivities: number;
    lateActivities: number;
    overallPercent: number;
  };
  activitiesMovedThisWeek: Activity[];
  subActivity: SubActivityEntry[];
  photos: PhotoEntry[];
  upcoming: Activity[];
  reportCount: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr?: string): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function healthLabel(score: number): string {
  if (score >= 85) return "On Track";
  if (score >= 70) return "At Risk";
  return "Critical";
}

function healthColor(score: number): string {
  if (score >= 85) return "#16a34a"; // green
  if (score >= 70) return "#ca8a04"; // yellow
  return "#dc2626"; // red
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function WeeklySummaryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  const fetchSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${id}/weekly-summary`);
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json.error ?? "Failed to load summary");
        return;
      }
      setData(await res.json());
    } catch {
      setError(t('ui.network.error.please.try.again.fb26c8'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <RefreshCw size={24} className="animate-spin text-orange-500" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-screen bg-white text-center p-8">
        <div>
          <p className="text-[color:var(--text-muted)] mb-4">{error ?? t('ui.summary.unavailable')}</p>
          <button
            onClick={() => router.back()}
            className="text-orange-500 underline text-sm"
          >{t('ui.go.back')}
          </button>
        </div>
      </div>
    );
  }

  const { project, schedule, activitiesMovedThisWeek, subActivity, photos, upcoming } = data;
  const hColor = healthColor(project.health_score);

  return (
    <div className="min-h-screen bg-white text-gray-900 print:bg-white">
      {/* Print-hidden controls */}
      <div className="print:hidden sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-[color:var(--text-muted)] hover:text-gray-800 text-sm transition-colors"
        >
          <ArrowLeft size={16} />{t('ui.back.to.project')}
        </button>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-[color:var(--text-primary)] rounded-lg text-sm font-semibold transition-colors"
        >
          <Printer size={15} />{t('ui.print.save.pdf')}
        </button>
      </div>

      {/* Report body */}
      <div className="max-w-4xl mx-auto px-8 py-10 print:px-6 print:py-6">
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between mb-8 pb-6 border-b-2 border-orange-500">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/icon-192.png"
                alt={t('ui.irontrack')}
                className="w-7 h-7 rounded-md object-contain"
              />
              <span className="text-sm font-semibold text-[color:var(--text-secondary)] uppercase tracking-wider">{t('ui.irontrack.weekly.summary')}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mt-1">{project.name}</h1>
            {(project.client_name || project.location) && (
              <p className="text-sm text-[color:var(--text-muted)] mt-0.5">
                {[project.client_name, project.location].filter(Boolean).join(" · ")}
              </p>
            )}
            <p className="text-sm text-[color:var(--text-secondary)] mt-1">{data.dateRange}</p>
          </div>
          <div className="text-right">
            <div
              className="text-3xl font-bold"
              style={{ color: hColor }}
            >
              {project.health_score}
            </div>
            <div
              className="text-sm font-semibold"
              style={{ color: hColor }}
            >
              {healthLabel(project.health_score)}
            </div>
            <div className="text-xs text-[color:var(--text-secondary)] mt-0.5">{t('ui.health.score')}</div>
          </div>
        </div>

        {/* ── Executive Summary ───────────────────────────────────────────── */}
        <section className="mb-8">
          <h2 className="text-base font-bold text-gray-700 uppercase tracking-wider mb-2 border-b border-gray-200 pb-1">{t('ui.executive.summary')}
          </h2>
          <p className="text-sm text-gray-700 leading-relaxed">{data.execSummary}</p>
          {project.target_finish_date && (
            <p className="text-sm text-[color:var(--text-muted)] mt-1">{t('ui.target.completion.086961')} <strong>{formatDate(project.target_finish_date)}</strong>
            </p>
          )}
        </section>

        {/* ── Schedule Status ─────────────────────────────────────────────── */}
        <section className="mb-8">
          <h2 className="text-base font-bold text-gray-700 uppercase tracking-wider mb-3 border-b border-gray-200 pb-1">{t('ui.schedule.status')}
          </h2>
          <div className="grid grid-cols-5 gap-3 mb-3">
            {[
              { label: t('ui.total'), value: schedule.totalActivities, color: "text-gray-700" },
              { label: t('ui.complete.1f5a1a'), value: schedule.completeActivities, color: "text-green-600" },
              { label: t('status.inProgress'), value: schedule.inProgressActivities, color: "text-orange-500" },
              { label: t('ui.late'), value: schedule.lateActivities, color: "text-red-600" },
              { label: t('ui.complete.fc0f20'), value: `${schedule.overallPercent}%`, color: "text-blue-600" },
            ].map(({ label, value, color }) => (
              <div
                key={label}
                className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center"
              >
                <div className={`text-xl font-bold ${color}`}>{value}</div>
                <div className="text-xs text-[color:var(--text-muted)] mt-0.5">{label}</div>
              </div>
            ))}
          </div>
          {/* Progress bar */}
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-orange-500 transition-all"
              style={{ width: `${schedule.overallPercent}%` }}
            />
          </div>
        </section>

        {/* ── This Week's Progress ────────────────────────────────────────── */}
        <section className="mb-8">
          <h2 className="text-base font-bold text-gray-700 uppercase tracking-wider mb-3 border-b border-gray-200 pb-1">{t('ui.this.week.s.progress')}{activitiesMovedThisWeek.length} activities)
          </h2>
          {activitiesMovedThisWeek.length === 0 ? (
            <p className="text-sm text-[color:var(--text-secondary)] italic">{t('ui.no.progress.reports.submitted.this.week')}</p>
          ) : (
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-1.5 pr-3 text-xs font-semibold text-[color:var(--text-muted)] uppercase">{t('ui.activity.81c0d9')}</th>
                  <th className="text-left py-1.5 pr-3 text-xs font-semibold text-[color:var(--text-muted)] uppercase">{t('ui.trade')}</th>
                  <th className="text-left py-1.5 pr-3 text-xs font-semibold text-[color:var(--text-muted)] uppercase">{t('ui.finish.b74bde')}</th>
                  <th className="text-right py-1.5 text-xs font-semibold text-[color:var(--text-muted)] uppercase">{t('ui.progress.1b9027')}</th>
                </tr>
              </thead>
              <tbody>
                {activitiesMovedThisWeek.map((act) => (
                  <tr key={act.id} className="border-b border-gray-100">
                    <td className="py-2 pr-3 text-gray-800 leading-snug">{act.activity_name}</td>
                    <td className="py-2 pr-3 text-[color:var(--text-muted)] text-xs">{act.trade ?? "—"}</td>
                    <td className="py-2 pr-3 text-[color:var(--text-muted)] text-xs">{formatDate(act.finish_date)}</td>
                    <td className="py-2 text-right">
                      <span
                        className={`text-xs font-bold ${
                          act.percent_complete >= 100
                            ? "text-green-600"
                            : act.percent_complete >= 50
                            ? "text-orange-500"
                            : "text-gray-600"
                        }`}
                      >
                        {act.percent_complete}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* ── Sub Activity ────────────────────────────────────────────────── */}
        <section className="mb-8">
          <h2 className="text-base font-bold text-gray-700 uppercase tracking-wider mb-3 border-b border-gray-200 pb-1">{t('ui.sub.activity')}{data.reportCount}{t('ui.reports.this.week')}
          </h2>
          {subActivity.length === 0 ? (
            <p className="text-sm text-[color:var(--text-secondary)] italic">{t('ui.no.sub.reports.submitted.this.week')}</p>
          ) : (
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-1.5 pr-3 text-xs font-semibold text-[color:var(--text-muted)] uppercase">{t('ui.sub')}</th>
                  <th className="text-right py-1.5 pr-3 text-xs font-semibold text-[color:var(--text-muted)] uppercase">{t('ui.reports')}</th>
                  <th className="text-right py-1.5 pr-3 text-xs font-semibold text-[color:var(--text-muted)] uppercase">{t('ui.workers.b6ef3a')}</th>
                  <th className="text-right py-1.5 pr-3 text-xs font-semibold text-[color:var(--text-muted)] uppercase">{t('ui.hours')}</th>
                  <th className="text-left py-1.5 text-xs font-semibold text-[color:var(--text-muted)] uppercase">{t('ui.delays.bd1f7e')}</th>
                </tr>
              </thead>
              <tbody>
                {subActivity.map((entry) => {
                  const uniqueDelays = [...new Set(entry.delays)].filter(Boolean);
                  return (
                    <tr key={entry.sub_name} className="border-b border-gray-100">
                      <td className="py-2 pr-3 text-gray-800 font-medium">{entry.sub_name}</td>
                      <td className="py-2 pr-3 text-gray-600 text-center">{entry.report_count}</td>
                      <td className="py-2 pr-3 text-gray-600 text-right">{entry.total_manpower}</td>
                      <td className="py-2 pr-3 text-gray-600 text-right">{entry.total_hours}</td>
                      <td className="py-2">
                        {uniqueDelays.length === 0 ? (
                          <span className="text-green-600 text-xs">{t('ui.none.6eef66')}</span>
                        ) : (
                          <span className="text-red-600 text-xs">{uniqueDelays.join(", ")}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>

        {/* ── Photos ──────────────────────────────────────────────────────── */}
        {photos.length > 0 && (
          <section className="mb-8">
            <h2 className="text-base font-bold text-gray-700 uppercase tracking-wider mb-3 border-b border-gray-200 pb-1">{t('ui.photos.9d5a0c')}{photos.length})
            </h2>
            <div className="grid grid-cols-4 gap-3 print:grid-cols-4">
              {photos.map((photo, i) => (
                <div key={i} className="space-y-0.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.url}
                    alt={`Photo ${i + 1}`}
                    loading="lazy"
                    className="w-full aspect-square object-cover rounded-lg border border-gray-200"
                  />
                  <p className="text-[9px] text-[color:var(--text-secondary)] truncate">{photo.submitted_by}</p>
                  <p className="text-[9px] text-[color:var(--text-secondary)]">{formatDate(photo.report_date)}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Upcoming ────────────────────────────────────────────────────── */}
        <section className="mb-8">
          <h2 className="text-base font-bold text-gray-700 uppercase tracking-wider mb-3 border-b border-gray-200 pb-1">{t('ui.upcoming.next.7.days')}
          </h2>
          {upcoming.length === 0 ? (
            <p className="text-sm text-[color:var(--text-secondary)] italic">{t('ui.no.activities.starting.next.week')}</p>
          ) : (
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-1.5 pr-3 text-xs font-semibold text-[color:var(--text-muted)] uppercase">{t('ui.activity.81c0d9')}</th>
                  <th className="text-left py-1.5 pr-3 text-xs font-semibold text-[color:var(--text-muted)] uppercase">{t('ui.trade')}</th>
                  <th className="text-left py-1.5 text-xs font-semibold text-[color:var(--text-muted)] uppercase">{t('ui.start.952f37')}</th>
                </tr>
              </thead>
              <tbody>
                {upcoming.map((act) => (
                  <tr key={act.id} className="border-b border-gray-100">
                    <td className="py-2 pr-3 text-gray-800">{act.activity_name}</td>
                    <td className="py-2 pr-3 text-[color:var(--text-muted)] text-xs">{act.trade ?? "—"}</td>
                    <td className="py-2 text-[color:var(--text-muted)] text-xs">{formatDate(act.start_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* Footer */}
        <div className="mt-10 pt-4 border-t border-gray-200 flex items-center justify-between text-xs text-[color:var(--text-secondary)]">
          <span>{t('ui.generated.by.irontrack')} {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
          <span>{t('ui.confidential')}</span>
        </div>
      </div>


      {/* Print styles */}
      <style>{t('ui.media.print.page.margin.0.75in.size.letter.body.webkit')}</style>
    </div>
  );
}
