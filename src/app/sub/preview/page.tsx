"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  ClipboardCheck,
  CalendarDays,
  FolderOpen,
  Gauge,
  HardHat,
  Package,
  Send,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { setTheme } from "@/lib/theme";

const mockProjects = [
  {
    name: "Avondale Medical Office",
    location: "Avondale, AZ",
    trades: ["Electrical", "Low Voltage"],
    tasks: 42,
    reports: 18,
    progress: 67,
  },
  {
    name: "Mesa TI Buildout",
    location: "Mesa, AZ",
    trades: ["Rough-In", "Lighting"],
    tasks: 28,
    reports: 11,
    progress: 41,
  },
];

const commandCards = [
  {
    title: "Dispatch",
    copy: "Tomorrow's crew plan is waiting on 2 acknowledgements.",
    icon: Send,
    color: "#3B82F6",
  },
  {
    title: "Check-In",
    copy: "Capture manpower, progress, notes, delays, and GC-ready updates.",
    icon: ClipboardCheck,
    color: "#22C55E",
  },
  {
    title: "Blockers",
    copy: "3 open blockers need decisions before the next shift starts.",
    icon: AlertTriangle,
    color: "#F97316",
  },
];

const advantageCards = [
  {
    title: "Schedule-aware by default",
    copy: "Updates are tied to real activities, successors, lookaheads, and project milestones instead of living as plain daily-log text.",
  },
  {
    title: "Built for Spanish crews",
    copy: "English schedule uploads can still drive the job while field-facing activity names can display in Spanish.",
  },
  {
    title: "Blockers become action",
    copy: "Issues are framed as decisions, responsible parties, and next steps so GCs see what is actually stopping work.",
  },
  {
    title: "Sub-first, GC-useful",
    copy: "The sub can run dispatch, check-ins, production, SOPs, and handoffs while the GC receives cleaner project intelligence.",
  },
];

const huddleCards = [
  {
    label: "Schedule",
    icon: CalendarDays,
    text: "Rough-in crew is on Level 2 today. Trim crew needs Area C released tomorrow.",
  },
  {
    label: "Manpower",
    icon: HardHat,
    text: "4 electricians, 1 apprentice, and 1 foreman planned for Avondale Medical Office.",
  },
  {
    label: "Materials",
    icon: Package,
    text: "Panel tubs, MC cable, and fixture whips need confirmation before lunch.",
  },
  {
    label: "Hurdles",
    icon: AlertTriangle,
    text: "Ceiling grid is not released in Corridor B. GC decision needed before trim starts.",
  },
  {
    label: "Handoff",
    icon: ArrowUpRight,
    text: "Rough-in crew must leave photos, open items, and access notes for trim crew.",
  },
];

export default function SubPortalPreviewPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] pb-16">
      <div className="relative mx-auto max-w-6xl space-y-8 px-4 py-8">
        <div className="rounded-xl border border-[#3B82F6]/20 bg-[linear-gradient(135deg,rgba(59,130,246,0.18),rgba(15,23,42,0.92)_42%,rgba(249,115,22,0.14))] p-5 shadow-[0_28px_90px_rgba(0,0,0,0.28)] md:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-[#93C5FD]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E] shadow-[0_0_14px_#22C55E]" />
                Local Preview
              </div>
              <h1 className="text-3xl font-black text-white md:text-5xl">Summit Electrical</h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 md:text-base">
                This preview lets you inspect the subcontractor command center without a Supabase login.
              </p>
              <p className="mt-2 text-sm text-slate-400">Production still requires real authentication.</p>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
              <button
                onClick={() => setTheme("field")}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#FFB020] px-4 py-3 text-sm font-black text-[#111827]"
              >
                Try Field Mode
                <HardHat size={16} />
              </button>
              <Link href="/signup/sub" className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#22C55E] px-4 py-3 text-sm font-black text-[#052E16]">
                Create login
                <ArrowUpRight size={16} />
              </Link>
              <Link href="/login/sub" className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/10 px-4 py-3 text-sm font-bold text-white">
                Back to login
              </Link>
            </div>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#93C5FD]">
              <Gauge size={14} />
              Field Pulse
            </div>
            <p className="mt-2 text-sm text-[color:var(--text-secondary)]">Field reporting is active this week.</p>
          </div>
          <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#F97316]">
              <AlertTriangle size={14} />
              Needs Attention
            </div>
            <p className="mt-2 text-sm text-[color:var(--text-secondary)]">2 dispatches need foreman acknowledgement.</p>
          </div>
          <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#22C55E]">
              <ShieldCheck size={14} />
              Last Signal
            </div>
            <p className="mt-2 text-sm text-[color:var(--text-secondary)]">Avondale Medical Office updated 18m ago.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard label="Active Projects" value="2" icon={<FolderOpen size={14} />} accent />
          <StatCard label="Reports This Week" value="9" icon={<BarChart3 size={14} />} />
          <StatCard label="Foremen" value="4" icon={<Users size={14} />} />
        </div>

        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <HardHat size={16} className="text-[#F97316]" />
            <h2 className="text-lg font-bold text-[color:var(--text-primary)]">Command Actions</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {commandCards.map(({ title, copy, icon: Icon, color }) => (
              <div key={title} className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-5 shadow-[0_18px_55px_rgba(0,0,0,0.16)]">
                <span className="grid h-10 w-10 place-items-center rounded-lg" style={{ background: `${color}22`, color }}>
                  <Icon size={18} />
                </span>
                <h3 className="mt-4 text-base font-black text-[color:var(--text-primary)]">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">{copy}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-[#22C55E]/20 bg-[linear-gradient(135deg,rgba(34,197,94,0.12),rgba(15,23,42,0.72)_48%,rgba(59,130,246,0.1))] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.18)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[#86EFAC]">
                <Sparkles size={14} />
                IronTrack Advantage
              </div>
              <h2 className="mt-2 text-2xl font-black text-white">Field updates should move the schedule forward</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                IronTrack turns each field update into schedule intelligence, tomorrow's plan, blocker accountability, and bilingual crew communication.
              </p>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/20 p-3 text-sm font-bold text-white">
              One foreman update {"->"} GC report, blocker list, production pulse, and next-day plan.
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-4">
            {advantageCards.map((card) => (
              <div key={card.title} className="rounded-lg border border-white/10 bg-black/20 p-4">
                <h3 className="text-sm font-black text-white">{card.title}</h3>
                <p className="mt-2 text-xs leading-5 text-slate-400">{card.copy}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#93C5FD]">
              <Users size={14} />
              Morning Huddle
            </div>
            <h2 className="mt-1 text-2xl font-black text-[color:var(--text-primary)]">
              Stop sending the next crew in blind.
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[color:var(--text-secondary)]">
              Material, schedule, manpower, hurdles, and handoff context live in one place before crews scatter across jobs.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-5">
            {huddleCards.map(({ label, text, icon: Icon }) => (
              <div key={label} className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-4 shadow-[0_18px_55px_rgba(0,0,0,0.14)]">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#F97316]">
                  <Icon size={15} />
                  {label}
                </div>
                <p className="mt-3 text-sm leading-6 text-[color:var(--text-secondary)]">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <FolderOpen size={16} className="text-[#F97316]" />
            <h2 className="text-lg font-bold text-[color:var(--text-primary)]">Projects</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {mockProjects.map((project) => (
              <div key={project.name} className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-5 shadow-[0_18px_55px_rgba(0,0,0,0.16)]">
                <h3 className="text-base font-black text-[color:var(--text-primary)]">{project.name}</h3>
                <p className="mt-1 text-xs text-[color:var(--text-muted)]">{project.location}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {project.trades.map((trade) => (
                    <span key={trade} className="rounded-full border border-[#3B82F6]/20 bg-[#3B82F6]/10 px-2.5 py-1 text-xs font-semibold text-[#93C5FD]">
                      {trade}
                    </span>
                  ))}
                </div>
                <div className="mt-4 flex gap-4 text-xs text-[color:var(--text-muted)]">
                  <span>{project.tasks} tasks</span>
                  <span>{project.reports} reports</span>
                </div>
                <div className="mt-4 space-y-1.5">
                  <div className="flex justify-between text-xs text-[color:var(--text-muted)]">
                    <span>Avg progress</span>
                    <span>{project.progress}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[var(--bg-tertiary)]">
                    <div className="h-full rounded-full bg-gradient-to-r from-[#3B82F6] via-[#22C55E] to-[#F97316]" style={{ width: `${project.progress}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#22C55E]">
            <CheckCircle2 size={14} />
            Preview Note
          </div>
          <p className="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">
            This is mock data for local visual review. Sign up or create a real sub login when you are ready to test live Supabase project links.
          </p>
        </section>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  accent = false,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-4 shadow-[0_18px_60px_rgba(0,0,0,0.18)]">
      <div className="flex items-center gap-2 text-[color:var(--text-muted)]">
        <span className={`grid h-8 w-8 place-items-center rounded-lg ${accent ? "bg-[#3B82F6]/15 text-[#60A5FA]" : "bg-[var(--bg-tertiary)] text-[#F97316]"}`}>
          {icon}
        </span>
        <span className="text-[10px] font-bold uppercase tracking-[0.18em]">{label}</span>
      </div>
      <span className={`mt-2 block text-2xl font-bold ${accent ? "text-[#F97316]" : "text-[color:var(--text-primary)]"}`}>
        {value}
      </span>
    </div>
  );
}
