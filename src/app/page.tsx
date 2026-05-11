import Link from "next/link";
import {
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

const sources = ["Procore", "Autodesk", "Fieldwire", "Email", "PDF", "Text", "Call"];

const queueTools = [
  { title: "Job Inbox", desc: "All updates from across your projects.", icon: FolderOpen },
  { title: "Work Cards", desc: "Actionable items for your team.", icon: ClipboardList },
  { title: "Readiness", desc: "Track what's ready and what's not.", icon: HardHat },
  { title: "Proof Log", desc: "Photos, docs, and notes in one place.", icon: Camera },
  { title: "GC Response", desc: "Track responses and follow-ups.", icon: MessageSquare },
  { title: "Owner Snapshot", desc: "Share progress with confidence.", icon: BarChart3 },
];

const workflow = [
  ["01", "Job Inbox", "Capture GC emails, PDFs, screenshots, portal updates, meeting notes, calls, and manual notes."],
  ["02", "Work Cards", "Turn each scope item into a clear card with date, location, trade, crew, blockers, proof, and status."],
  ["03", "Readiness Board", "Know what is ready, missing material, missing access, missing drawings, waiting on predecessor, or waiting on GC."],
  ["04", "Proof Log", "Collect photos, notes, manpower, delays, timestamps, and GC-notified records."],
  ["05", "GC Response", "Create clean text, email, and PDF responses back to the GC without requiring a GC login."],
  ["06", "Owner Snapshot", "See ready jobs, at-risk jobs, proof gaps, unanswered items, and calls needed today."],
];

const outcomes = [
  { title: "End control gaps", body: "See everything. Act on what matters.", icon: CalendarDays },
  { title: "Keep projects moving", body: "Clear next steps. Fewer delays.", icon: CheckCircle },
  { title: "Protect your time", body: "One queue. Less chaos.", icon: Users },
  { title: "Your data stays yours", body: "The GC does not need an account.", icon: ShieldCheck },
];

const roles = [
  ["Owner", "What needs my attention today?"],
  ["Operations", "Which jobs are ready or blocked?"],
  ["PM", "What do we need to send back?"],
  ["Foreman", "What am I doing today?"],
  ["Crew", "What proof do I need?"],
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
    <div className="min-h-screen overflow-x-hidden bg-[#F6F2EA] text-[#111827]">
      <header className="sticky top-0 z-50 border-b border-black/5 bg-[#F6F2EA]/92 backdrop-blur-xl">
        <div className="mx-auto flex h-[86px] max-w-7xl items-center justify-between px-5 md:px-8">
          <Link href="/" className="flex items-center">
            <img src="/irontrack-field-pulse-logo.svg" alt="IronTrack Field Pulse" className="h-14 w-auto md:h-16" />
          </Link>

          <MobileMenu />

          <nav className="hidden items-center gap-9 md:flex">
            {["How It Works", "Workflow", "For Subs", "Pricing", "Resources"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(/ /g, "-")}`}
                className="text-sm font-bold text-[#111827]/70 transition-colors hover:text-[#111827]"
              >
                {item}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-4 sm:flex">
            <Link href="/login/sub" className="text-sm font-bold text-[#111827]/75 hover:text-[#111827]">
              Log in
            </Link>
            <Link
              href="/signup/sub"
              className="rounded-lg bg-[#F45A00] px-5 py-3 text-sm font-black text-white shadow-[0_14px_30px_rgba(244,90,0,0.22)] transition-transform hover:-translate-y-0.5"
            >
              Start Subcontractor Beta
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden border-b border-black/10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(244,90,0,0.12),transparent_28%),linear-gradient(90deg,rgba(255,255,255,0.92),rgba(246,242,234,0.88)_54%,rgba(246,242,234,0.45))]" />
          <div className="absolute right-0 top-0 hidden h-full w-[38%] opacity-45 lg:block">
            <div className="absolute inset-y-0 right-0 w-full bg-[linear-gradient(90deg,rgba(246,242,234,0),rgba(246,242,234,0.16)),radial-gradient(circle_at_80%_55%,rgba(17,24,39,0.16),transparent_36%)]" />
            <div className="absolute bottom-0 right-0 h-[72%] w-[76%] border-l border-t border-[#111827]/10 bg-[linear-gradient(180deg,rgba(17,24,39,0.08),rgba(244,90,0,0.05))]" />
            <div className="absolute right-24 top-16 h-72 w-px bg-[#111827]/20" />
            <div className="absolute right-20 top-16 h-px w-64 bg-[#111827]/20" />
            <div className="absolute right-44 top-16 h-24 w-px rotate-[52deg] bg-[#111827]/20" />
            <div className="absolute bottom-0 right-10 h-56 w-28 rounded-t-full bg-[#111827]/12" />
            <div className="absolute bottom-8 right-16 h-24 w-24 rounded-full bg-white/40" />
          </div>

          <div className="relative mx-auto grid max-w-7xl gap-12 px-6 py-16 md:px-8 md:py-24 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <h1 className="max-w-3xl text-5xl font-black leading-[0.98] tracking-[-0.055em] text-[#111827] md:text-7xl">
                Control GC chaos without asking GC to change.
              </h1>
              <div className="mt-6 h-1 w-28 rounded-full bg-[#F45A00]" />
              <p className="mt-7 max-w-2xl text-xl leading-8 text-[#4B5563]">
                Turn Procore, Autodesk, Fieldwire, emails, PDFs, screenshots, texts, calls, and spreadsheets into one daily work queue.
              </p>
              <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:items-center">
                <Link
                  href="/signup/sub"
                  className="inline-flex min-h-[58px] items-center justify-center gap-3 rounded-lg bg-[#F45A00] px-7 py-4 text-base font-black text-white shadow-[0_18px_38px_rgba(244,90,0,0.24)] transition-transform hover:-translate-y-0.5"
                >
                  Start Subcontractor Beta
                  <ArrowRight size={19} />
                </Link>
                <DemoRequestLink className="inline-flex min-h-[58px] items-center justify-center gap-3 border-b-2 border-[#F45A00] px-2 py-4 text-base font-black text-[#111827]">
                  See workflow
                  <ArrowRight size={18} />
                </DemoRequestLink>
              </div>
              <div className="mt-9 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-semibold text-[#4B5563]">
                <span className="inline-flex items-center gap-2">
                  <ShieldCheck size={18} className="text-[#F45A00]" />
                  Built for subcontractors.
                </span>
                <span>Your data is your data.</span>
              </div>
            </div>

            <div className="relative">
              <div className="rounded-2xl border border-black/10 bg-white/90 p-5 shadow-[0_24px_70px_rgba(17,24,39,0.16)] backdrop-blur">
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-black text-[#111827]">Today&apos;s Work Queue</h2>
                    <p className="mt-1 text-sm text-[#6B7280]">All your updates. One daily plan.</p>
                  </div>
                  <span className="inline-flex items-center gap-2 text-xs font-bold text-[#4B5563]">
                    May 16, 2026
                    <CalendarDays size={15} />
                  </span>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  {queueTools.map((tool) => {
                    const Icon = tool.icon;
                    return (
                      <Link
                        key={tool.title}
                        href="/signup/sub"
                        className="group min-h-[150px] rounded-xl border border-black/10 bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-[#F45A00]/40 hover:shadow-[0_12px_30px_rgba(17,24,39,0.08)]"
                      >
                        <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-[#F45A00]/10 text-[#F45A00]">
                          <Icon size={25} />
                        </div>
                        <h3 className="mt-4 text-center text-base font-black text-[#111827]">{tool.title}</h3>
                        <p className="mt-2 text-center text-xs leading-5 text-[#6B7280]">{tool.desc}</p>
                        <ArrowRight size={15} className="ml-auto mt-3 text-[#4B5563] transition-transform group-hover:translate-x-1 group-hover:text-[#F45A00]" />
                      </Link>
                    );
                  })}
                </div>

                <div className="mt-5 border-t border-black/10 pt-4">
                  <p className="mb-3 text-[10px] font-black uppercase tracking-[0.18em] text-[#6B7280]">Sources</p>
                  <div className="flex flex-wrap gap-2">
                    {sources.map((source) => (
                      <span key={source} className="rounded-md border border-black/10 bg-white px-3 py-2 text-xs font-bold text-[#4B5563]">
                        {source}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-black/10 bg-white py-8">
          <div className="mx-auto grid max-w-7xl gap-4 px-6 md:grid-cols-4 md:px-8">
            {outcomes.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="flex gap-4 border-black/10 md:border-r md:pr-6 last:md:border-r-0">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border-2 border-[#F45A00] text-[#F45A00]">
                    <Icon size={20} />
                  </span>
                  <div>
                    <h3 className="text-sm font-black text-[#111827]">{item.title}</h3>
                    <p className="mt-1 text-xs leading-5 text-[#6B7280]">{item.body}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section id="how-it-works" className="bg-[#F6F2EA] py-16 md:py-24">
          <div className="mx-auto max-w-7xl px-6 md:px-8">
            <div className="mb-12 max-w-3xl">
              <p className="mb-3 text-xs font-black uppercase tracking-[0.24em] text-[#F45A00]">How it works</p>
              <h2 className="text-4xl font-black tracking-[-0.04em] text-[#111827] md:text-5xl">
                A command center for readiness, proof, and response.
              </h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {workflow.map(([number, title, body]) => (
                <div key={title} className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
                  <p className="font-mono text-sm font-black text-[#F45A00]">{number}</p>
                  <h3 className="mt-4 text-xl font-black text-[#111827]">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-[#6B7280]">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="workflow" className="bg-[#08090B] py-16 text-white md:py-24">
          <div className="mx-auto grid max-w-7xl gap-10 px-6 md:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="mb-3 text-xs font-black uppercase tracking-[0.24em] text-[#F45A00]">Workflow</p>
              <h2 className="text-4xl font-black tracking-[-0.04em] md:text-5xl">
                One work card carries the whole job conversation.
              </h2>
              <p className="mt-5 max-w-xl text-base leading-8 text-slate-400">
                Inbox items, readiness, proof, blockers, handoffs, and responses stay connected. No one has to rebuild the story from texts, folders, and memory.
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-[#111318] p-5 shadow-[0_28px_90px_rgba(0,0,0,0.28)]">
              <div className="rounded-2xl border border-[#F45A00]/25 bg-gradient-to-br from-[#F45A00]/12 via-white/[0.03] to-sky-500/10 p-5">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#F45A00]">Work Card</p>
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
                  <button className="rounded-xl bg-[#F45A00] px-4 py-3 text-sm font-black text-white">Add Proof</button>
                  <button className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white">Prepare Response</button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="for-subs" className="bg-white py-16 md:py-24">
          <div className="mx-auto max-w-7xl px-6 md:px-8">
            <div className="mb-12 text-center">
              <p className="mb-3 text-xs font-black uppercase tracking-[0.24em] text-[#F45A00]">For subs</p>
              <h2 className="text-4xl font-black tracking-[-0.04em] text-[#111827] md:text-5xl">
                Built for every role in the subcontractor workflow.
              </h2>
            </div>
            <div className="grid gap-4 md:grid-cols-5">
              {roles.map(([role, body]) => (
                <div key={role} className="rounded-2xl border border-black/10 bg-[#F6F2EA] p-5">
                  <h3 className="text-base font-black text-[#111827]">{role}</h3>
                  <p className="mt-3 text-sm leading-6 text-[#6B7280]">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="bg-[#F6F2EA] py-16 md:py-24">
          <div className="mx-auto max-w-5xl px-6 md:px-8">
            <div className="mb-10 text-center">
              <p className="mb-3 text-xs font-black uppercase tracking-[0.24em] text-[#F45A00]">Pricing</p>
              <h2 className="text-4xl font-black tracking-[-0.04em] text-[#111827]">Start with the subcontractor workspace.</h2>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-3xl border-2 border-[#F45A00] bg-white p-8 shadow-[0_28px_90px_rgba(17,24,39,0.08)]">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#F45A00]">Subcontractor Beta</p>
                <div className="mt-4 text-5xl font-black text-[#111827]">
                  $10<span className="text-lg text-black/35">/mo</span>
                </div>
                <ul className="mt-6 space-y-3">
                  {["Job Inbox", "Work Cards", "Readiness Board", "Proof Log", "GC Response", "Owner Snapshot", "Foreman mobile tools"].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm font-semibold text-[#111827]">
                      <CheckCircle size={16} className="text-green-600" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link href="/signup/sub" className="mt-8 block rounded-xl bg-[#F45A00] px-6 py-4 text-center text-base font-black text-white">
                  Start Subcontractor Beta
                </Link>
              </div>
              <div className="rounded-3xl border border-black/10 bg-[#111827] p-8 text-white">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#F45A00]">Team-ready</p>
                <h3 className="mt-4 text-2xl font-black">Operations + Field</h3>
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

        <footer className="border-t border-black/10 bg-white py-8">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 md:flex-row md:px-8">
            <div className="flex items-center gap-3">
              <img src="/irontrack-field-pulse-icon.svg" alt="" className="h-7 w-7" />
              <span className="text-sm text-[#6B7280]">© 2026 IronTrack Development LLC</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
              <Link href="/terms" className="text-[#6B7280] transition-colors hover:text-[#111827]">Terms</Link>
              <Link href="/privacy" className="text-[#6B7280] transition-colors hover:text-[#111827]">Privacy</Link>
              <Link href="/status" className="text-[#6B7280] transition-colors hover:text-[#111827]">Status</Link>
              <Link href="/release-notes" className="text-[#6B7280] transition-colors hover:text-[#111827]">Release Notes</Link>
              <a href="mailto:irontrackdevelopment@outlook.com" className="text-[#6B7280] transition-colors hover:text-[#111827]">Contact</a>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
