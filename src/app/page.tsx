import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Briefcase,
  Building2,
  CalendarDays,
  Camera,
  CheckCircle,
  ClipboardList,
  FileText,
  FolderOpen,
  HardHat,
  Mail,
  MessageSquare,
  Phone,
  ShieldCheck,
  Users,
} from "lucide-react";
import MobileMenu from "@/components/MobileMenu";

const sources = [
  "Procore",
  "Autodesk / ACC",
  "Fieldwire",
  "Email",
  "PDFs",
  "Screenshots",
  "Lookaheads",
  "Spreadsheets",
  "Meeting notes",
  "Verbal changes",
];

const workflow = [
  {
    title: "Job Inbox",
    body: "Capture GC requests from email, PDFs, screenshots, lookaheads, meetings, calls, and manual notes.",
    icon: FolderOpen,
  },
  {
    title: "Work Cards",
    body: "Turn scope into clear cards with date, location, trade, crew, blockers, proof, and status.",
    icon: ClipboardList,
  },
  {
    title: "Readiness Board",
    body: "See ready, not ready, missing material, missing access, missing drawings, and waiting on GC.",
    icon: ShieldCheck,
  },
  {
    title: "Proof Log",
    body: "Collect photos, notes, manpower, delays, timestamps, and GC-notified records.",
    icon: Camera,
  },
  {
    title: "GC Response",
    body: "Create clean text, email, and PDF responses without requiring the GC to log in.",
    icon: MessageSquare,
  },
  {
    title: "Owner Snapshot",
    body: "Show what is ready, at risk, missing proof, unanswered, or needing a call today.",
    icon: BarChart3,
  },
];

const roles = [
  {
    title: "Subcontractor Owner",
    body: "See the jobs at risk, proof gaps, and calls that need leadership attention.",
    icon: Building2,
  },
  {
    title: "Operations Manager",
    body: "Triage GC noise and keep foremen aligned without living in five portals.",
    icon: Briefcase,
  },
  {
    title: "Project Manager",
    body: "Send professional responses with proof attached instead of rebuilding the story.",
    icon: Mail,
  },
  {
    title: "Foreman",
    body: "Open the job, tap the work card, add proof, flag blockers, and move on.",
    icon: HardHat,
  },
  {
    title: "Field Crew",
    body: "Know where to go, what is ready, and what proof needs to be captured.",
    icon: Users,
  },
];

const fieldTools = [
  ["Schedule", "5"],
  ["Job Inbox", "3"],
  ["Work Cards", ""],
  ["Readiness", ""],
  ["Blockers", "1"],
  ["Proof Log", "2"],
  ["GC Response", ""],
];

function DemoRequestLink({ children, className }: { children: React.ReactNode; className: string }) {
  return (
    <a
      href="mailto:irontrackdevelopment@outlook.com?subject=IronTrack%20Field%20Pulse%20Demo%20Request&body=I%27d%20like%20to%20see%20how%20IronTrack%20Field%20Pulse%20helps%20subcontractors%20control%20GC%20communication%2C%20proof%2C%20readiness%2C%20and%20responses."
      className={className}
    >
      {children}
    </a>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#08090B] text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#08090B]/92 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6 md:py-4">
          <Link href="/" className="flex items-center">
            <img
              src="/irontrack-field-pulse-logo-dark.svg"
              alt="IronTrack Field Pulse"
              className="h-11 w-auto md:h-14"
            />
          </Link>

          <MobileMenu />

          <nav className="hidden items-center gap-8 md:flex">
            {["Workflow", "Product", "Teams", "Pricing"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="text-sm font-semibold text-white/55 transition-colors hover:text-white"
              >
                {item}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-3 sm:flex">
            <Link href="/login/sub" className="text-sm font-semibold text-white/60 transition-colors hover:text-white">
              Sign in
            </Link>
            <Link
              href="/signup/sub"
              className="rounded-xl bg-[#F97316] px-5 py-2.5 text-sm font-black text-white shadow-[0_14px_34px_rgba(249,115,22,0.24)] transition-transform hover:-translate-y-0.5"
            >
              Start beta
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="border-b border-white/10 bg-[#08090B]">
          <img
            src="/irontrack-field-pulse-landing-banner.svg"
            alt="IronTrack Field Pulse"
            className="h-auto w-full"
          />
        </section>

        <section className="relative overflow-hidden border-b border-white/10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_10%,rgba(249,115,22,0.18),transparent_34%),linear-gradient(135deg,#08090B_0%,#121418_48%,#050506_100%)]" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#F97316]/70 to-transparent" />
          <div className="relative mx-auto grid max-w-7xl gap-12 px-6 py-16 md:py-24 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#F97316]/25 bg-[#F97316]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-[#FDBA74]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#F97316]" />
                Subcontractor-owned field command center
              </div>
              <h1 className="max-w-4xl text-4xl font-black leading-[0.94] tracking-[-0.045em] text-white sm:text-5xl md:text-6xl lg:text-7xl">
                Turn scattered GC communication into organized job control.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300 md:text-xl">
                IronTrack Field Pulse helps subcontractors know what is coming, what is ready, what is blocked,
                what needs proof, and what needs a clean response back to the GC.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/signup/sub"
                  className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-xl bg-[#F97316] px-7 py-4 text-base font-black text-white shadow-[0_18px_45px_rgba(249,115,22,0.28)] transition-transform hover:-translate-y-0.5"
                >
                  Start subcontractor beta
                  <ArrowRight size={18} />
                </Link>
                <DemoRequestLink className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-7 py-4 text-base font-bold text-white transition-colors hover:bg-white/10">
                  Book workflow demo
                  <CalendarDays size={18} />
                </DemoRequestLink>
              </div>
              <p className="mt-5 text-sm font-semibold text-slate-500">
                GC does not need an account. Your team owns the workspace.
              </p>
            </div>

            <div className="relative">
              <div className="absolute -inset-6 rounded-[2rem] bg-[#F97316]/10 blur-3xl" />
              <div className="relative rounded-[2rem] border border-white/12 bg-[#0D0F12] p-4 shadow-[0_32px_100px_rgba(0,0,0,0.42)]">
                <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#F97316]">Job Control</p>
                    <h2 className="mt-1 text-2xl font-black">Avondale Medical Office</h2>
                  </div>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold text-slate-300">
                    Today
                  </span>
                </div>
                <div className="mb-4 flex flex-wrap gap-2 text-xs font-bold">
                  <span className="rounded-full bg-red-500/15 px-3 py-1 text-red-300">1 blocked</span>
                  <span className="rounded-full bg-amber-500/15 px-3 py-1 text-amber-300">2 proof missing</span>
                  <span className="rounded-full bg-sky-500/15 px-3 py-1 text-sky-300">1 RFI open</span>
                </div>
                <div className="rounded-2xl border border-[#F97316]/20 bg-black/30 p-3">
                  <p className="mb-3 text-[11px] font-black uppercase tracking-[0.18em] text-[#F97316]">Today</p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {fieldTools.map(([label, count]) => (
                      <div key={label} className="relative min-h-[86px] rounded-xl border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.02] p-3">
                        {count && (
                          <span className="absolute right-2 top-2 grid h-6 min-w-6 place-items-center rounded-full bg-[#F97316] px-1.5 text-xs font-black">
                            {count}
                          </span>
                        )}
                        <div className="mb-3 grid h-9 w-9 place-items-center rounded-lg bg-[#F97316]/12 text-[#F97316]">
                          <ClipboardList size={18} />
                        </div>
                        <p className="text-sm font-black">{label}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  {[
                    ["Field Work", "Production, photos, equipment, materials"],
                    ["Project Docs", "Drawings, RFIs, submittals, reports"],
                    ["Coordination", "Meetings, crew, owner snapshot"],
                  ].map(([title, body]) => (
                    <div key={title} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                      <p className="font-black">{title}</p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">{body}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-white/10 bg-[#0B0D10] py-10">
          <div className="mx-auto max-w-7xl px-6">
            <p className="mb-5 text-center text-[11px] font-black uppercase tracking-[0.24em] text-slate-500">
              Works alongside the tools GCs already use
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {sources.map((source) => (
                <span key={source} className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-bold text-slate-300">
                  {source}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section id="workflow" className="bg-[#08090B] py-16 md:py-24">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mb-12 max-w-3xl">
              <p className="mb-3 text-[11px] font-black uppercase tracking-[0.24em] text-[#F97316]">Core workflow</p>
              <h2 className="text-3xl font-black tracking-[-0.035em] md:text-5xl">
                The subcontractor command center for field readiness, proof, and GC response.
              </h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {workflow.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="rounded-2xl border border-white/10 bg-[#111318] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.24)]">
                    <div className="mb-5 flex items-center justify-between">
                      <span className="grid h-12 w-12 place-items-center rounded-xl bg-[#F97316]/12 text-[#F97316]">
                        <Icon size={22} />
                      </span>
                      <span className="font-mono text-xs font-black text-white/20">0{index + 1}</span>
                    </div>
                    <h3 className="text-xl font-black">{item.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-slate-400">{item.body}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section id="product" className="border-y border-white/10 bg-[#101216] py-16 md:py-24">
          <div className="mx-auto grid max-w-7xl gap-8 px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="mb-3 text-[11px] font-black uppercase tracking-[0.24em] text-[#F97316]">Product feel</p>
              <h2 className="text-3xl font-black tracking-[-0.035em] md:text-5xl">
                One work card carries the whole job conversation.
              </h2>
              <p className="mt-5 text-base leading-8 text-slate-400">
                Inbox items, readiness, proof, blockers, handoffs, and GC responses stay connected. No one has to rebuild the story from texts, folders, and memory.
              </p>
            </div>
            <div className="rounded-[1.75rem] border border-white/10 bg-[#08090B] p-4">
              <div className="rounded-2xl border border-[#F97316]/25 bg-gradient-to-br from-[#F97316]/12 via-white/[0.03] to-[#3B82F6]/10 p-5">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#F97316]">Work Card</p>
                <h3 className="mt-2 text-2xl font-black">Rough-in branch conduit</h3>
                <p className="mt-1 text-sm text-slate-500">Avondale Medical Office · Level 2 · Corridor B</p>
                <div className="mt-5 grid gap-2 sm:grid-cols-2">
                  {[
                    ["Material", "Ready", "text-green-300"],
                    ["Access", "Blocked", "text-red-300"],
                    ["Drawings", "Waiting SK-18", "text-amber-300"],
                    ["Proof", "2 photos · manpower missing", "text-sky-300"],
                  ].map(([label, value, tone]) => (
                    <div key={label} className="rounded-xl border border-white/10 bg-black/30 p-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">{label}</p>
                      <p className={`mt-1 text-sm font-black ${tone}`}>{value}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                  <button className="rounded-xl bg-[#F97316] px-4 py-3 text-sm font-black text-white">Add Proof</button>
                  <button className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white">Prepare Response</button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="teams" className="bg-[#08090B] py-16 md:py-24">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mb-12 text-center">
              <p className="mb-3 text-[11px] font-black uppercase tracking-[0.24em] text-[#F97316]">Built for subcontractor teams</p>
              <h2 className="text-3xl font-black tracking-[-0.035em] md:text-5xl">Owners, ops, PMs, foremen, and crews stay aligned.</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-5">
              {roles.map((role) => {
                const Icon = role.icon;
                return (
                  <div key={role.title} className="rounded-2xl border border-white/10 bg-[#111318] p-5">
                    <Icon className="text-[#F97316]" size={24} />
                    <h3 className="mt-4 text-base font-black">{role.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-slate-500">{role.body}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section id="pricing" className="border-t border-white/10 bg-[#101216] py-16 md:py-24">
          <div className="mx-auto max-w-5xl px-6">
            <div className="mb-10 text-center">
              <p className="mb-3 text-[11px] font-black uppercase tracking-[0.24em] text-[#F97316]">Public beta</p>
              <h2 className="text-3xl font-black tracking-[-0.035em] md:text-5xl">Start with the subcontractor workspace.</h2>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-[1.5rem] border-2 border-[#F97316] bg-white p-8 text-[#0D0D0D] shadow-[0_28px_100px_rgba(249,115,22,0.16)]">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#F97316]">Primary plan</p>
                <h3 className="mt-3 text-2xl font-black">Subcontractor Beta</h3>
                <div className="mt-4 text-4xl font-black">
                  $10<span className="text-lg text-black/35">/mo</span>
                </div>
                <ul className="mt-6 space-y-3">
                  {["Job Inbox", "Work Cards", "Readiness Board", "Proof Log", "GC Response", "Owner Snapshot", "Foreman mobile tools"].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm font-semibold">
                      <CheckCircle size={16} className="text-green-600" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link href="/signup/sub" className="mt-8 block rounded-xl bg-[#F97316] px-6 py-4 text-center text-base font-black text-white">
                  Start beta
                </Link>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-[#08090B] p-8">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Team-ready</p>
                <h3 className="mt-3 text-2xl font-black">Operations + Field</h3>
                <p className="mt-4 leading-7 text-slate-400">
                  Give owners, operations, PMs, foremen, and crews one place to control daily readiness, proof, blockers, and responses.
                </p>
                <DemoRequestLink className="mt-8 inline-flex rounded-xl border border-white/10 bg-white/5 px-6 py-4 text-center text-base font-black text-white hover:bg-white/10">
                  Walk through your workflow
                </DemoRequestLink>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-[#08090B] py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 md:flex-row">
          <div className="flex items-center gap-3">
            <img src="/irontrack-field-pulse-icon.svg" alt="" className="h-7 w-7" />
            <span className="text-sm text-slate-500">© 2026 IronTrack Development LLC</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
            <Link href="/terms" className="text-slate-500 transition-colors hover:text-white">Terms</Link>
            <Link href="/privacy" className="text-slate-500 transition-colors hover:text-white">Privacy</Link>
            <Link href="/status" className="text-slate-500 transition-colors hover:text-white">Status</Link>
            <Link href="/release-notes" className="text-slate-500 transition-colors hover:text-white">Release Notes</Link>
            <a href="mailto:irontrackdevelopment@outlook.com" className="text-slate-500 transition-colors hover:text-white">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
