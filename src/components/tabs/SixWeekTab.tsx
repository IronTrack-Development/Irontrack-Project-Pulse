"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "@/lib/i18n";

const { t } = useTranslation();
import {
  Flag, Truck, Search, HardHat, ClipboardCheck,
  Calendar, ChevronDown, ChevronUp, AlertTriangle, CheckCircle
} from "lucide-react";

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
}

interface SixWeekData {
  window: { start: string; end: string };
  stats: {
    total: number;
    milestones: number;
    inspections: number;
    longLead: number;
    mobilizations: number;
    tradesNeeded: number;
  };
  milestones: Activity[];
  inspections: Activity[];
  longLead: Activity[];
  mobilizations: Activity[];
  mobilizationsByTrade: Record<string, Activity[]>;
  other: Activity[];
}

function formatDate(d?: string) {
  if (!d) return "—";
  const date = new Date(d + "T12:00:00");
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatDateRange(start?: string, end?: string) {
  return `${formatDate(start)} → ${formatDate(end)}`;
}

function daysUntil(d?: string) {
  if (!d) return null;
  const target = new Date(d + "T12:00:00");
  const now = new Date();
  now.setHours(12, 0, 0, 0);
  const diff = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}

function statusChip(status: string, pct: number) {
  if (status === "complete" || pct >= 100) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-900/40 text-green-400 border border-green-700/40">
        <CheckCircle size={10} />{t('ui.done.e9b450')}
      </span>
    );
  }
  if (status === "late") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-900/40 text-red-400 border border-red-700/40">
        <AlertTriangle size={10} />{t('ui.late')}
      </span>
    );
  }
  if (status === "in_progress") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-orange-900/40 text-orange-400 border border-orange-700/40">{t('status.inProgress')}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#1F1F25] text-[color:var(--text-muted)] border border-[#2a2a33]">{t('ui.upcoming')}
    </span>
  );
}

// ── Activity Row ──

function ActivityRow({ activity }: { activity: Activity }) {
  const days = daysUntil(activity.start_date);
  return (
    <div className="flex items-start justify-between gap-3 py-3 px-4 bg-[#13131A] border border-[#1F1F25] rounded-xl">
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-100 font-medium leading-snug">{activity.activity_name}</p>
        <div className="flex items-center gap-3 mt-1 flex-wrap">
          <span className="text-xs text-[color:var(--text-muted)]">
            {formatDateRange(activity.start_date, activity.finish_date)}
          </span>
          {activity.trade && (
            <span className="text-[10px] bg-[#1F1F25] text-[color:var(--text-secondary)] px-1.5 py-0.5 rounded">
              {activity.trade}
            </span>
          )}
          {days !== null && days > 0 && (
            <span className="text-[10px] text-[#F97316] font-medium">
              {days}{t('ui.d.away')}
            </span>
          )}
        </div>
      </div>
      {statusChip(activity.status, activity.percent_complete)}
    </div>
  );
}

// ── Collapsible Section ──

function Section({
  icon: Icon,
  title,
  count,
  color,
  defaultOpen = true,
  children,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  count: number;
  color: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  if (count === 0) return null;

  return (
    <div className="space-y-2">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full py-2 min-h-[44px]"
      >
        <div className="flex items-center gap-2">
          <Icon size={16} className={color} />
          <span className="text-sm font-semibold text-gray-200">{title}</span>
          <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${color.replace("text-", "bg-")}/20 ${color}`}>
            {count}
          </span>
        </div>
        {open ? <ChevronUp size={16} className="text-[color:var(--text-muted)]" /> : <ChevronDown size={16} className="text-[color:var(--text-muted)]" />}
      </button>
      {open && <div className="space-y-2">{children}</div>}
    </div>
  );
}

// ── Stat Card ──

function StatCard({ label, value, icon: Icon, color }: {
  label: string;
  value: number;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
}) {
  return (
    <div className="bg-[#13131A] border border-[#1F1F25] rounded-xl p-3 flex flex-col items-center text-center">
      <Icon size={18} className={`${color} mb-1`} />
      <span className={`text-xl font-bold ${color}`}>{value}</span>
      <span className="text-[10px] text-[color:var(--text-muted)] mt-0.5 leading-tight">{label}</span>
    </div>
  );
}

// ── Main Component ──

export default function SixWeekTab({ projectId }: { projectId: string }) {
  const [data, setData] = useState<SixWeekData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const res = await fetch(`/api/projects/${projectId}/lookahead-6week`);
        if (res.ok) setData(await res.json());
      } catch {}
      setLoading(false);
    }
    fetchData();
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="w-6 h-6 border-2 border-[#F97316] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data || data.stats.total === 0) {
    return (
      <div className="text-center py-16">
        <Calendar size={36} className="mx-auto text-gray-700 mb-3" />
        <p className="text-[color:var(--text-secondary)] text-sm">{t('ui.no.activities.in.the.4.6.week.window')}</p>
        <p className="text-gray-600 text-xs mt-1">{t('ui.activities.starting.3.6.weeks.from.today.will.appear.here')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Window header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-[color:var(--text-primary)]">{t('ui.6.week.lookahead')}</h2>
          <p className="text-xs text-[color:var(--text-muted)] mt-0.5">
            {formatDate(data.window.start)} — {formatDate(data.window.end)} · {data.stats.total}{t('ui.activities.053a51')}
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-2">
        <StatCard label={t('ui.milestones')} value={data.stats.milestones} icon={Flag} color="text-[#F97316]" />
        <StatCard label={t('ui.inspections')} value={data.stats.inspections} icon={ClipboardCheck} color="text-blue-400" />
        <StatCard label={t('ui.procurement')} value={data.stats.longLead} icon={Truck} color="text-purple-400" />
        <StatCard label={t('ui.mobilizations')} value={data.stats.mobilizations} icon={HardHat} color="text-emerald-400" />
      </div>

      {/* Milestones */}
      <Section icon={Flag} title={t('ui.upcoming.milestones')} count={data.milestones.length} color="text-[#F97316]">
        {data.milestones.map((a) => <ActivityRow key={a.id} activity={a} />)}
      </Section>

      {/* Long-Lead / Procurement */}
      <Section icon={Truck} title={t('ui.long.lead.and.procurement')} count={data.longLead.length} color="text-purple-400">
        <p className="text-xs text-[color:var(--text-muted)] px-1 -mt-1 mb-2">{t('ui.items.that.need.ordering.fabrication.now.to.land.in.4')}
        </p>
        {data.longLead.map((a) => <ActivityRow key={a.id} activity={a} />)}
      </Section>

      {/* Mobilizations by Trade */}
      <Section icon={HardHat} title={t('ui.sub.mobilizations')} count={data.mobilizations.length} color="text-emerald-400">
        <p className="text-xs text-[color:var(--text-muted)] px-1 -mt-1 mb-2">{t('ui.trades.that.need.to.be.on.site.in.weeks.4')}
        </p>
        {Object.entries(data.mobilizationsByTrade).map(([trade, acts]) => (
          <div key={trade} className="space-y-1.5">
            <p className="text-xs font-semibold text-[color:var(--text-secondary)] uppercase tracking-wider px-1 pt-2">
              {trade} ({acts.length})
            </p>
            {acts.map((a) => <ActivityRow key={a.id} activity={a} />)}
          </div>
        ))}
      </Section>

      {/* Inspections */}
      <Section icon={ClipboardCheck} title={t('ui.inspections.and.testing')} count={data.inspections.length} color="text-blue-400">
        <p className="text-xs text-[color:var(--text-muted)] px-1 -mt-1 mb-2">{t('ui.schedule.these.now.lead.time.for.inspectors.and.testing.labs')}
        </p>
        {data.inspections.map((a) => <ActivityRow key={a.id} activity={a} />)}
      </Section>

      {/* Other */}
      <Section icon={Calendar} title={t('ui.other.activities')} count={data.other.length} color="text-[color:var(--text-secondary)]" defaultOpen={false}>
        {data.other.map((a) => <ActivityRow key={a.id} activity={a} />)}
      </Section>
    </div>
  );
}
