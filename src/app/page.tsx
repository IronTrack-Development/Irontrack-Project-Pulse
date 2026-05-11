import Link from "next/link";
import {
  ArrowRight, CheckCircle, HardHat, Briefcase, Building2,
  Upload, Calendar, Target, QrCode, ClipboardList, GitBranch,
  Download, Share2, Camera, FileText, Shield, Zap, Users,
  Handshake, Send, ArrowRightLeft, Sun, Moon, Globe,
  AlertTriangle, BookOpen, Wrench, MessageSquare, Eye,
  BarChart3, Columns3, Truck, Search, Clipboard, Settings,
  ChevronDown,
} from "lucide-react";
import MobileMenu from "@/components/MobileMenu";
import IronTrackFieldPulseWordmark from "@/components/branding/IronTrackFieldPulseWordmark";
import LandingProductPreview from "@/components/landing/LandingProductPreview";

export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: "#f0f4f8" }}>
      {/* ═══ HEADER ═══ */}
      <header className="sticky top-0 z-50 border-b backdrop-blur-md" style={{ background: "rgba(248,250,252,0.92)", borderColor: "rgba(15,23,42,0.08)" }}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-4 flex items-center justify-between gap-4">
          <Link href="/" aria-label="IronTrack Field Pulse home" className="min-w-0 shrink hover:opacity-90 transition-opacity">
            <IronTrackFieldPulseWordmark className="min-w-0 scale-[0.92] sm:scale-100 origin-left" />
          </Link>

          <nav className="hidden lg:flex flex-1 justify-center items-center gap-1 max-w-2xl">
            {[
              { label: "Product", href: "#features" },
              { label: "Solutions", href: "#workflow" },
              { label: "Who we serve", href: "#who-we-serve" },
              { label: "Pricing", href: "#pricing" },
              { label: "Resources", href: "/release-notes" },
            ].map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="group flex items-center gap-0.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-white/80 hover:text-slate-900"
              >
                {item.label}
                <ChevronDown className="h-3.5 w-3.5 opacity-40 transition-opacity group-hover:opacity-70" aria-hidden />
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <Link
              href="/login"
              className="hidden sm:inline text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
            >
              Log in
            </Link>
            <a
              href="mailto:irontrackdevelopment@outlook.com?subject=IronTrack%20Field%20Pulse%20Demo&body=I%27d%20like%20to%20book%20a%20demo%20of%20IronTrack%20Field%20Pulse."
              className="hidden sm:inline-flex items-center rounded-xl px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-95"
              style={{ background: "#F37021", boxShadow: "0 6px 20px rgba(243,112,33,0.22)" }}
            >
              Get a demo
            </a>
            <MobileMenu />
          </div>
        </div>
      </header>

      {/* ═══ HERO (Fieldwire-style split + IronTrack brand) ═══ */}
      <section className="relative overflow-hidden border-b" style={{ borderColor: "rgba(15,23,42,0.06)", background: "linear-gradient(180deg, #ffffff 0%, #f0f4f8 55%)" }}>
        <div className="max-w-7xl mx-auto px-6 pt-10 pb-14 md:pt-14 md:pb-20">
          <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(280px,44%)] lg:gap-16">
            <div>
              <h1
                className="text-[2rem] font-extrabold leading-[1.08] tracking-tight text-slate-900 sm:text-4xl lg:text-[2.75rem]"
              >
                Jobsite management for construction teams—built on your field pulse.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
                Connect the trailer and the trade floor: schedule intelligence, daily logs, coordination, and sub handoffs in one calm system—without burying crews in paperwork.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="mailto:irontrackdevelopment@outlook.com?subject=IronTrack%20Field%20Pulse%20Demo&body=I%27d%20like%20to%20book%20a%20demo%20of%20IronTrack%20Field%20Pulse."
                  className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-bold text-white shadow-md transition-opacity hover:opacity-95 sm:px-7 sm:text-base"
                  style={{ background: "#F37021", boxShadow: "0 10px 28px rgba(243,112,33,0.28)" }}
                >
                  Get a demo
                  <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                </a>
                <Link
                  href="#features"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border-2 bg-white px-6 py-3.5 text-sm font-bold text-[#F37021] transition-colors hover:bg-orange-50/80 sm:px-7 sm:text-base"
                  style={{ borderColor: "#F37021" }}
                >
                  Take a tour
                </Link>
              </div>
              <ul className="mt-10 max-w-lg space-y-3">
                {[
                  "Plan, track, and coordinate work in one place—from lookahead to handoff.",
                  "Real-time updates from the field before they go cold.",
                  "Reduce rework with a daily rhythm subs and supers can trust.",
                ].map((line) => (
                  <li key={line} className="flex gap-3 text-sm leading-relaxed text-slate-600 sm:text-[15px]">
                    <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#F37021]" strokeWidth={2} />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-10 flex flex-wrap gap-2">
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 shadow-sm transition-colors hover:border-slate-300"
                >
                  <HardHat className="h-3.5 w-3.5 text-[#F37021]" />
                  GC signup
                </Link>
                <Link
                  href="/signup/sub"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 shadow-sm transition-colors hover:border-slate-300"
                >
                  <Briefcase className="h-3.5 w-3.5 text-[#3B82F6]" />
                  Sub signup
                </Link>
              </div>
            </div>
            <div className="relative mx-auto w-full max-w-md lg:mx-0 lg:max-w-none">
              <LandingProductPreview />
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FEATURE PILLARS (reference-style row) ═══ */}
      <section className="border-b bg-white" style={{ borderColor: "rgba(15,23,42,0.06)" }}>
        <div className="max-w-7xl mx-auto px-6 py-14 md:py-16">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: ClipboardList,
                title: "Task & lookahead clarity",
                body: "Today, tomorrow, and three weeks out—by day and by trade—with critical path context you can defend.",
              },
              {
                icon: Camera,
                title: "Photo documentation",
                body: "Capture conditions, punch, and progress while context is still on-site—not reconstructed later.",
              },
              {
                icon: FileText,
                title: "Formal field reporting",
                body: "Daily logs, inspections, RFIs, and submittals flow into one project record executives can scan.",
              },
              {
                icon: Users,
                title: "Built for teams",
                body: "GC pulse for the office, Sub Ops for the field company, and token views that protect schedule logic.",
              },
            ].map((card) => (
              <div
                key={card.title}
                className="rounded-2xl border border-slate-100 bg-slate-50/50 p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <card.icon className="mb-4 h-8 w-8 text-[#F37021]" strokeWidth={1.5} />
                <h3 className="text-base font-bold text-slate-900">{card.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ TRUST STRIP (no third-party marks) ═══ */}
      <section className="border-b bg-[#f8fafc]" style={{ borderColor: "rgba(15,23,42,0.06)" }}>
        <div className="max-w-7xl mx-auto px-6 py-10 md:py-12">
          <p className="text-center text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
            Trusted by field-led construction teams
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-sm font-semibold text-slate-400">
            {["General contractors", "Mechanical & HVAC", "Electrical", "Specialty trades"].map((label) => (
              <span key={label} className="whitespace-nowrap">
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section id="workflow" className="py-12 md:py-16 border-y" style={{ borderColor: "rgba(15,23,42,0.08)", background: "#0f172a" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-8 md:gap-12 items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest mb-4" style={{ color: "#F37021", fontFamily: "monospace" }}>
                The Problem We Are Built For
              </p>
              <h2 className="text-3xl md:text-5xl font-extrabold leading-tight mb-5 text-white" style={{ letterSpacing: "-0.03em" }}>
                Stop making every crew start from zero.
              </h2>
              <p className="text-base md:text-lg leading-relaxed mb-6" style={{ color: "rgba(255,255,255,0.68)" }}>
                Duct rough-in leaves. Piping walks in. Trim follows. Startup finishes. Too often, nobody hands off what changed, what is missing, or what the GC needs to know. IronTrack turns that chaos into a daily field rhythm.
              </p>
              <a
                href="mailto:irontrackdevelopment@outlook.com?subject=IronTrack%20Workflow%20Demo&body=I%27d%20like%20to%20see%20the%20IronTrack%20handoff%20and%20field%20pulse%20workflow."
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white"
                style={{ background: "#F37021" }}
              >
                See the workflow
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                ["Dispatch", "Who is going where, with what scope, material notes, and safety focus."],
                ["Check-In", "Foremen confirm arrival, manpower, site conditions, and plan for the day."],
                ["Production", "Quantities, photos, progress notes, and work completed while it is still fresh."],
                ["Blockers", "Caveats, delays, missing material, access issues, and GC-facing risk history."],
                ["Handoffs", "Department-to-department readiness so the next crew does not walk in blind."],
                ["GC Pulse", "A clean view of what is happening without burying the field in paperwork."],
              ].map(([title, body]) => (
                <div key={title} className="rounded-2xl p-5 border" style={{ background: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.12)" }}>
                  <h3 className="text-base font-extrabold mb-2 text-white">{title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.62)" }}>{body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ INTEGRATIONS BAR ═══ */}
      <section id="integrations" className="py-10 md:py-14 border-y" style={{ borderColor: "rgba(15,23,42,0.08)" }}>
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-center text-sm font-semibold uppercase tracking-widest mb-6" style={{ color: "rgba(15,23,42,0.35)", fontFamily: "monospace" }}>
            Works With Your Schedule Software
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
            {[
              { name: "Microsoft Project", ext: ".mpp", icon: "/icons/ms-project.svg" },
              { name: "Primavera P6", ext: ".xer", icon: "/icons/primavera-p6.svg" },
              { name: "Excel", ext: ".xlsx", icon: "/icons/excel.svg" },
              { name: "XML / MSPDI", ext: ".xml", icon: "/icons/xml.svg" },
              { name: "CSV", ext: ".csv", icon: "/icons/csv.svg" },
            ].map((fmt) => (
              <div
                key={fmt.name}
                className="flex items-center gap-3 px-5 py-3 rounded-xl border shadow-sm"
                style={{ background: "white", borderColor: "rgba(15,23,42,0.08)" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={fmt.icon} alt={fmt.name} className="w-8 h-8 rounded-lg" />
                <div>
                  <div className="text-sm font-bold" style={{ color: "#0f172a" }}>{fmt.name}</div>
                  <div className="text-[10px] font-mono" style={{ color: "rgba(15,23,42,0.4)" }}>{fmt.ext}</div>
                </div>
                <CheckCircle className="w-4 h-4 ml-1" style={{ color: "#22C55E" }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section id="features" className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold uppercase tracking-widest mb-4" style={{ color: "#F37021", fontFamily: "monospace" }}>
              Everything You Need
            </p>
            <h2 className="text-3xl md:text-5xl font-extrabold" style={{ color: "#0f172a", letterSpacing: "-0.03em" }}>
              Built for the field.<br />
              <em className="font-medium" style={{ color: "#F37021" }}>Not the office.</em>
            </h2>
          </div>

          <div className="space-y-16 md:space-y-24">

            {/* ── [01] Schedule Intelligence ── */}
            <div className="grid md:grid-cols-2 gap-8 md:gap-16 items-center">
              <div>
                <div className="text-sm font-bold mb-2" style={{ color: "#F37021", fontFamily: "monospace" }}>[01]</div>
                <h3 className="text-2xl md:text-3xl font-extrabold mb-4" style={{ color: "#0f172a", letterSpacing: "-0.02em" }}>
                  Schedule Intelligence
                </h3>
                <p className="text-base leading-relaxed mb-6" style={{ color: "rgba(15,23,42,0.55)" }}>
                  Upload your schedule once. Instantly see today, tomorrow, and three weeks out - grouped by day, filterable by trade. Update progress in the field and the reforecast engine recalculates your entire critical path in seconds. Float, forecast finish date, risk flags, milestones, and MSPDI export. Pure math, zero AI. Results you can trust and defend.
                </p>
                <div className="flex flex-wrap gap-2">
                  {["Day Plan", "Week View", "Trade Filters", "Critical Path", "Float Calc", "MSPDI Export"].map((tag) => (
                    <span key={tag} className="text-xs font-semibold px-3 py-1 rounded-full border" style={{ color: "#F37021", borderColor: "rgba(243,112,33,0.3)", background: "rgba(243,112,33,0.06)" }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl p-6 border" style={{ background: "white", borderColor: "rgba(15,23,42,0.08)" }}>
                <div className="space-y-2 mb-4">
                  {[
                    { task: "Install Structural Steel - Bldg A", pct: "85%", color: "#F37021" },
                    { task: "Rough-In Electrical - Tower 2", pct: "60%", color: "#3B82F6" },
                    { task: "Pour Foundation North Wing", pct: "100%", color: "#22C55E" },
                    { task: "Fire Sprinkler Rough-In - Bldg B", pct: "0%", color: "var(--text-muted)" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl border" style={{ borderColor: "rgba(15,23,42,0.06)" }}>
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ background: item.color }} />
                      <span className="text-sm flex-1 truncate" style={{ color: "#0f172a" }}>{item.task}</span>
                      <span className="text-xs font-bold" style={{ color: item.color }}>{item.pct}</span>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="rounded-xl p-3 border" style={{ borderColor: "rgba(15,23,42,0.06)" }}>
                    <div className="text-[10px] uppercase tracking-wide mb-1" style={{ color: "rgba(15,23,42,0.35)" }}>Forecast Delta</div>
                    <div className="text-lg font-extrabold" style={{ color: "#DC2626" }}>+5d Late</div>
                  </div>
                  <div className="rounded-xl p-3 border" style={{ borderColor: "rgba(15,23,42,0.06)" }}>
                    <div className="text-[10px] uppercase tracking-wide mb-1" style={{ color: "rgba(15,23,42,0.35)" }}>Critical Path</div>
                    <div className="text-lg font-extrabold" style={{ color: "#DC2626" }}>8 tasks</div>
                  </div>
                </div>
                <div className="rounded-xl p-3 border" style={{ borderColor: "rgba(243,112,33,0.2)", background: "rgba(243,112,33,0.04)" }}>
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="w-3.5 h-3.5" style={{ color: "#F37021" }} />
                    <span className="text-[10px] font-bold uppercase" style={{ color: "#F37021" }}>Recovery Action</span>
                  </div>
                  <p className="text-xs" style={{ color: "rgba(15,23,42,0.6)" }}>
                    Increase crew size on &quot;Structural Steel&quot; to recover 3 days on critical path
                  </p>
                </div>
              </div>
            </div>

            {/* ── [02] Field Ops ── */}
            <div className="grid md:grid-cols-2 gap-8 md:gap-16 items-center">
              <div className="order-2 md:order-1 rounded-2xl p-6 border" style={{ background: "white", borderColor: "rgba(15,23,42,0.08)" }}>
                <div className="rounded-xl overflow-hidden border mb-3" style={{ borderColor: "rgba(15,23,42,0.06)" }}>
                  <div className="px-4 py-2.5" style={{ background: "#1e3a5f" }}>
                    <span className="text-xs font-bold text-white uppercase tracking-wider">Daily Log</span>
                    <span className="text-[10px] ml-2" style={{ color: "#93c5fd" }}>Apr 25, 2026</span>
                  </div>
                  <div className="px-4 py-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <Sun className="w-3.5 h-3.5" style={{ color: "#EAB308" }} />
                      <span className="text-xs" style={{ color: "#0f172a" }}>72°F - Clear, wind 8mph</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5" style={{ color: "#3B82F6" }} />
                      <span className="text-xs" style={{ color: "#0f172a" }}>34 workers on-site · 6 trades active</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Camera className="w-3.5 h-3.5" style={{ color: "#F37021" }} />
                      <span className="text-xs" style={{ color: "#0f172a" }}>12 photos attached</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg border" style={{ borderColor: "rgba(15,23,42,0.06)" }}>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded text-white" style={{ background: "#DC2626" }}>High</span>
                    <span className="text-xs" style={{ color: "#0f172a" }}>Missing backing for grab bars - Corridor 2</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg border" style={{ borderColor: "rgba(15,23,42,0.06)" }}>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded text-white" style={{ background: "#22C55E" }}>Done</span>
                    <span className="text-xs" style={{ color: "#0f172a" }}>Punch item: Drywall patch Room 204</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3 pt-3 border-t" style={{ borderColor: "rgba(15,23,42,0.06)" }}>
                  <FileText className="w-3.5 h-3.5" style={{ color: "#F37021" }} />
                  <span className="text-xs" style={{ color: "rgba(15,23,42,0.4)" }}>Export as PDF · Share via link</span>
                </div>
              </div>
              <div className="order-1 md:order-2">
                <div className="text-sm font-bold mb-2" style={{ color: "#F37021", fontFamily: "monospace" }}>[02]</div>
                <h3 className="text-2xl md:text-3xl font-extrabold mb-4" style={{ color: "#0f172a", letterSpacing: "-0.02em" }}>
                  Field Ops
                </h3>
                <p className="text-base leading-relaxed mb-6" style={{ color: "rgba(15,23,42,0.55)" }}>
                  Daily logs with weather, crew counts, delays, and photos. Photo-first field reports. Formal walkthrough observations with professional PDF export. Inspections tied to a jurisdiction database. Punch lists that actually close out. Everything from your phone, saved to project history.
                </p>
                <div className="flex flex-wrap gap-2">
                  {["Daily Logs", "Field Reports", "Inspections", "Punch List", "Photo Capture", "PDF Export"].map((tag) => (
                    <span key={tag} className="text-xs font-semibold px-3 py-1 rounded-full border" style={{ color: "#F37021", borderColor: "rgba(243,112,33,0.3)", background: "rgba(243,112,33,0.06)" }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* ── [03] Safety & Compliance ── */}
            <div className="grid md:grid-cols-2 gap-8 md:gap-16 items-center">
              <div>
                <div className="text-sm font-bold mb-2" style={{ color: "#F37021", fontFamily: "monospace" }}>[03]</div>
                <h3 className="text-2xl md:text-3xl font-extrabold mb-4" style={{ color: "#0f172a", letterSpacing: "-0.02em" }}>
                  Safety & Compliance
                </h3>
                <p className="text-base leading-relaxed mb-6" style={{ color: "rgba(15,23,42,0.55)" }}>
                  Run toolbox talks with 20 built-in OSHA templates or create your own. Track attendance with digital sign-in. Generate company-branded PDF reports for your safety files. Custom templates let you match your company&apos;s safety program exactly.
                </p>
                <div className="flex flex-wrap gap-2">
                  {["Toolbox Talks", "OSHA Templates", "Attendance", "Custom Templates", "PDF Reports"].map((tag) => (
                    <span key={tag} className="text-xs font-semibold px-3 py-1 rounded-full border" style={{ color: "#F37021", borderColor: "rgba(243,112,33,0.3)", background: "rgba(243,112,33,0.06)" }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl p-6 border" style={{ background: "white", borderColor: "rgba(15,23,42,0.08)" }}>
                <div className="rounded-xl overflow-hidden border mb-3" style={{ borderColor: "rgba(15,23,42,0.06)" }}>
                  <div className="px-4 py-2.5" style={{ background: "#DC2626" }}>
                    <span className="text-xs font-bold text-white uppercase tracking-wider">Toolbox Talk</span>
                    <span className="text-[10px] ml-2 text-red-200">OSHA Template</span>
                  </div>
                  <div className="px-4 py-3 space-y-2">
                    <div className="text-sm font-bold" style={{ color: "#0f172a" }}>Fall Protection - Scaffolding</div>
                    <div className="flex items-center gap-2">
                      <Shield className="w-3.5 h-3.5" style={{ color: "#DC2626" }} />
                      <span className="text-xs" style={{ color: "rgba(15,23,42,0.55)" }}>OSHA 1926.451 - Scaffolds</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5" style={{ color: "#3B82F6" }} />
                      <span className="text-xs" style={{ color: "#0f172a" }}>18 attendees signed in</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex -space-x-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white" style={{ background: i === 4 ? "var(--text-muted)" : "#F37021" }}>
                        {i === 4 ? "+14" : ["JR", "MS", "DT"][i - 1]}
                      </div>
                    ))}
                  </div>
                  <span className="text-xs" style={{ color: "rgba(15,23,42,0.4)" }}>All crews signed in</span>
                </div>
              </div>
            </div>

            {/* ── [04] Trade Coordination ── */}
            <div className="grid md:grid-cols-2 gap-8 md:gap-16 items-center">
              <div className="order-2 md:order-1 rounded-2xl p-6 border" style={{ background: "white", borderColor: "rgba(15,23,42,0.08)" }}>
                <div className="rounded-xl overflow-hidden border mb-3" style={{ borderColor: "rgba(15,23,42,0.06)" }}>
                  <div className="px-4 py-2.5" style={{ background: "#0f172a" }}>
                    <span className="text-xs font-bold text-white uppercase tracking-wider">Coordination Meeting</span>
                    <span className="text-[10px] ml-2" style={{ color: "rgba(255,255,255,0.5)" }}>Week 17 · Auto-Agenda</span>
                  </div>
                  <div className="px-4 py-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5" style={{ color: "#DC2626" }} />
                      <span className="text-xs font-bold" style={{ color: "#DC2626" }}>Conflict: Electrical + HVAC - Level 3 ceiling</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clipboard className="w-3.5 h-3.5" style={{ color: "#F37021" }} />
                      <span className="text-xs" style={{ color: "#0f172a" }}>Action: Re-sequence HVAC rough-in - Owner: AMS Mechanical</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clipboard className="w-3.5 h-3.5" style={{ color: "#3B82F6" }} />
                      <span className="text-xs" style={{ color: "#0f172a" }}>Action: Confirm conduit routing - Owner: ATS Electric</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Handshake className="w-3.5 h-3.5" style={{ color: "#F37021" }} />
                  <span className="text-xs" style={{ color: "rgba(15,23,42,0.4)" }}>Agenda auto-populated from schedule data</span>
                </div>
              </div>
              <div className="order-1 md:order-2">
                <div className="text-sm font-bold mb-2" style={{ color: "#F37021", fontFamily: "monospace" }}>[04]</div>
                <h3 className="text-2xl md:text-3xl font-extrabold mb-4" style={{ color: "#0f172a", letterSpacing: "-0.02em" }}>
                  Trade Coordination
                </h3>
                <p className="text-base leading-relaxed mb-6" style={{ color: "rgba(15,23,42,0.55)" }}>
                  Run coordination meetings with agendas auto-populated from your schedule. The system detects trade conflicts before they happen in the field. Track action items with owners and due dates. Stop running meetings off a legal pad.
                </p>
                <div className="flex flex-wrap gap-2">
                  {["Meeting Management", "Conflict Detection", "Action Items", "Auto-Agenda"].map((tag) => (
                    <span key={tag} className="text-xs font-semibold px-3 py-1 rounded-full border" style={{ color: "#F37021", borderColor: "rgba(243,112,33,0.3)", background: "rgba(243,112,33,0.06)" }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* ── [05] Documents ── */}
            <div className="grid md:grid-cols-2 gap-8 md:gap-16 items-center">
              <div>
                <div className="text-sm font-bold mb-2" style={{ color: "#F37021", fontFamily: "monospace" }}>[05]</div>
                <h3 className="text-2xl md:text-3xl font-extrabold mb-4" style={{ color: "#0f172a", letterSpacing: "-0.02em" }}>
                  Documents
                </h3>
                <p className="text-base leading-relaxed mb-6" style={{ color: "rgba(15,23,42,0.55)" }}>
                  Manage submittals with full approval workflows. Draft RFIs with AI assistance - describe the issue and get a professional RFI ready to send. Organize drawings by discipline with version control. Everything searchable, everything tracked.
                </p>
                <div className="flex flex-wrap gap-2">
                  {["Submittals", "RFIs", "AI Drafting", "Drawing Management"].map((tag) => (
                    <span key={tag} className="text-xs font-semibold px-3 py-1 rounded-full border" style={{ color: "#F37021", borderColor: "rgba(243,112,33,0.3)", background: "rgba(243,112,33,0.06)" }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl p-6 border" style={{ background: "white", borderColor: "rgba(15,23,42,0.08)" }}>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl border" style={{ borderColor: "rgba(15,23,42,0.06)" }}>
                    <FileText className="w-4 h-4" style={{ color: "#3B82F6" }} />
                    <div className="flex-1">
                      <span className="text-xs font-bold" style={{ color: "#0f172a" }}>RFI-042: Beam Connection Detail</span>
                      <div className="text-[10px]" style={{ color: "rgba(15,23,42,0.4)" }}>AI-drafted · Awaiting response</div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ color: "#EAB308", background: "rgba(234,179,8,0.1)" }}>Open</span>
                  </div>
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl border" style={{ borderColor: "rgba(15,23,42,0.06)" }}>
                    <ClipboardList className="w-4 h-4" style={{ color: "#22C55E" }} />
                    <div className="flex-1">
                      <span className="text-xs font-bold" style={{ color: "#0f172a" }}>SUB-118: Fire Damper Shop Dwgs</span>
                      <div className="text-[10px]" style={{ color: "rgba(15,23,42,0.4)" }}>Rev 2 · Approved</div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ color: "#22C55E", background: "rgba(34,197,94,0.1)" }}>Approved</span>
                  </div>
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl border" style={{ borderColor: "rgba(15,23,42,0.06)" }}>
                    <Search className="w-4 h-4" style={{ color: "#F37021" }} />
                    <div className="flex-1">
                      <span className="text-xs font-bold" style={{ color: "#0f172a" }}>DWG: Mechanical - Level 3</span>
                      <div className="text-[10px]" style={{ color: "rgba(15,23,42,0.4)" }}>Rev C · 4 sheets</div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ color: "#3B82F6", background: "rgba(59,130,246,0.1)" }}>Current</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── [06] Ready Check & Sub Portal ── */}
            <div className="grid md:grid-cols-2 gap-8 md:gap-16 items-center">
              <div className="order-2 md:order-1 rounded-2xl p-6 border" style={{ background: "white", borderColor: "rgba(15,23,42,0.08)" }}>
                <div className="space-y-3 mb-4">
                  <div className="rounded-xl px-4 py-3 border" style={{ borderColor: "rgba(15,23,42,0.06)" }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold" style={{ color: "#0f172a" }}>ATS Electric</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ color: "#22C55E", background: "rgba(34,197,94,0.1)" }}>Confirmed ✓</span>
                    </div>
                    <span className="text-[11px]" style={{ color: "rgba(15,23,42,0.4)" }}>Rough-In Electrical - Mon Apr 21</span>
                  </div>
                  <div className="rounded-xl px-4 py-3 border" style={{ borderColor: "rgba(15,23,42,0.06)" }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold" style={{ color: "#0f172a" }}>Buildtek Framing</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ color: "#EAB308", background: "rgba(234,179,8,0.1)" }}>Awaiting</span>
                    </div>
                    <span className="text-[11px]" style={{ color: "rgba(15,23,42,0.4)" }}>Exterior Framing Bldg B - Tue Apr 22</span>
                  </div>
                  <div className="rounded-xl px-4 py-3 border" style={{ borderColor: "rgba(243,112,33,0.2)", background: "rgba(243,112,33,0.03)" }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold" style={{ color: "#0f172a" }}>AMS Fire Protection</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ color: "#EF4444", background: "rgba(239,68,68,0.1)" }}>Issue Flagged</span>
                    </div>
                    <span className="text-[11px]" style={{ color: "rgba(15,23,42,0.4)" }}>Sprinkler install delayed - material lead time</span>
                  </div>
                </div>
                <div className="flex items-center justify-center mb-3">
                  <div className="w-24 h-24 rounded-xl flex items-center justify-center" style={{ background: "#F37021" }}>
                    <QrCode className="w-12 h-12 text-white" />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-xs" style={{ color: "rgba(15,23,42,0.4)" }}>
                    Subs see their scope only · No float or predecessors exposed
                  </p>
                </div>
              </div>
              <div className="order-1 md:order-2">
                <div className="text-sm font-bold mb-2" style={{ color: "#F37021", fontFamily: "monospace" }}>[06]</div>
                <h3 className="text-2xl md:text-3xl font-extrabold mb-4" style={{ color: "#0f172a", letterSpacing: "-0.02em" }}>
                  Ready Check & Sub Portal
                </h3>
                <p className="text-base leading-relaxed mb-6" style={{ color: "rgba(15,23,42,0.55)" }}>
                  Tap any activity, send a ready-check via SMS or email. Subs confirm they&apos;re mobilizing - or flag an issue before it becomes a problem. Share any week via QR code - subs scan and see only their scope. Schedule logic is protected: no float, no predecessors, no critical path data exposed. Zero friction, zero risk.
                </p>
                <div className="flex flex-wrap gap-2">
                  {["SMS/Email", "QR Sharing", "Trade Filtering", "Protected Schedule Data"].map((tag) => (
                    <span key={tag} className="text-xs font-semibold px-3 py-1 rounded-full border" style={{ color: "#F37021", borderColor: "rgba(243,112,33,0.3)", background: "rgba(243,112,33,0.06)" }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* ── [07] Sub Ops - FEATURED ── */}
            <div className="relative">
              <div className="absolute -inset-4 md:-inset-8 rounded-3xl" style={{ background: "rgba(243,112,33,0.04)", border: "2px solid rgba(243,112,33,0.15)" }} />
              <div className="relative grid md:grid-cols-2 gap-8 md:gap-16 items-center">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-3" style={{ background: "rgba(243,112,33,0.12)" }}>
                    <Zap className="w-3.5 h-3.5" style={{ color: "#F37021" }} />
                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#F37021" }}>New - The Sub Differentiator</span>
                  </div>
                  <div className="text-sm font-bold mb-2" style={{ color: "#F37021", fontFamily: "monospace" }}>[07]</div>
                  <h3 className="text-2xl md:text-3xl font-extrabold mb-4" style={{ color: "#0f172a", letterSpacing: "-0.02em" }}>
                    Sub Ops
                  </h3>
                  <p className="text-base leading-relaxed mb-4" style={{ color: "rgba(15,23,42,0.55)" }}>
                    The full subcontractor management platform. Digitize your morning huddle with the Dispatch Board - assign crews to jobs with scope, safety focus, and materials. Track foremen, journeymen, and apprentices with a real crew roster. Log production quantities with photos. Maintain an SOP library with read-tracking for compliance.
                  </p>
                  <p className="text-base leading-relaxed mb-6" style={{ color: "rgba(15,23,42,0.55)" }}>
                    Field crews flag blockers in real-time. Multi-department subs get a Kanban handoff board - sheet metal to piping to controls - with checklists and handoff photos. This isn&apos;t a viewer. It&apos;s how you run your company.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {["Morning Dispatch", "Foreman Tracking", "Production Logs", "SOP Library", "Handoff Board", "Blocker Reports"].map((tag) => (
                      <span key={tag} className="text-xs font-semibold px-3 py-1 rounded-full border" style={{ color: "#F37021", borderColor: "rgba(243,112,33,0.3)", background: "rgba(243,112,33,0.06)" }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl p-6 border" style={{ background: "white", borderColor: "rgba(243,112,33,0.2)" }}>
                  {/* Dispatch Board Mock */}
                  <div className="rounded-xl overflow-hidden border mb-3" style={{ borderColor: "rgba(15,23,42,0.06)" }}>
                    <div className="px-4 py-2.5" style={{ background: "#F37021" }}>
                      <span className="text-xs font-bold text-white uppercase tracking-wider">Morning Dispatch Board</span>
                      <span className="text-[10px] ml-2 text-orange-200">Today · 6 Crews Out</span>
                    </div>
                    <div className="px-4 py-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <Truck className="w-3.5 h-3.5" style={{ color: "#F37021" }} />
                        <span className="text-xs font-bold" style={{ color: "#0f172a" }}>Crew A → Riverside Medical</span>
                        <span className="text-[10px] ml-auto" style={{ color: "rgba(15,23,42,0.4)" }}>Ductwork L3</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Truck className="w-3.5 h-3.5" style={{ color: "#3B82F6" }} />
                        <span className="text-xs font-bold" style={{ color: "#0f172a" }}>Crew B → Central Office Tower</span>
                        <span className="text-[10px] ml-auto" style={{ color: "rgba(15,23,42,0.4)" }}>Piping L1</span>
                      </div>
                    </div>
                  </div>
                  {/* Production + Handoff Mock */}
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="rounded-xl p-3 border" style={{ borderColor: "rgba(15,23,42,0.06)" }}>
                      <div className="text-[10px] uppercase tracking-wide mb-1" style={{ color: "rgba(15,23,42,0.35)" }}>Production Today</div>
                      <div className="text-lg font-extrabold" style={{ color: "#22C55E" }}>340 LF</div>
                      <div className="text-[10px]" style={{ color: "rgba(15,23,42,0.4)" }}>Ductwork installed</div>
                    </div>
                    <div className="rounded-xl p-3 border" style={{ borderColor: "rgba(15,23,42,0.06)" }}>
                      <div className="text-[10px] uppercase tracking-wide mb-1" style={{ color: "rgba(15,23,42,0.35)" }}>Handoffs</div>
                      <div className="text-lg font-extrabold" style={{ color: "#3B82F6" }}>3 Ready</div>
                      <div className="text-[10px]" style={{ color: "rgba(15,23,42,0.4)" }}>Sheet metal → piping</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5" style={{ color: "#DC2626" }} />
                    <span className="text-xs font-bold" style={{ color: "#DC2626" }}>1 Blocker: Material delay - flex duct, ETA Wed</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── [08] Platform Features ── */}
            <div className="grid md:grid-cols-2 gap-8 md:gap-16 items-center">
              <div className="order-2 md:order-1 rounded-2xl p-6 border" style={{ background: "white", borderColor: "rgba(15,23,42,0.08)" }}>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl p-4 flex flex-col items-center justify-center border" style={{ borderColor: "rgba(15,23,42,0.06)", background: "#f0f4f8" }}>
                    <Sun className="w-6 h-6 mb-2" style={{ color: "#F37021" }} />
                    <span className="text-xs font-bold" style={{ color: "#0f172a" }}>Light Mode</span>
                  </div>
                  <div className="rounded-xl p-4 flex flex-col items-center justify-center" style={{ background: "#1a1a1a" }}>
                    <Moon className="w-6 h-6 mb-2" style={{ color: "#F37021" }} />
                    <span className="text-xs font-bold text-white">Dark Mode</span>
                  </div>
                  <div className="rounded-xl p-4 flex flex-col items-center justify-center border" style={{ borderColor: "rgba(15,23,42,0.06)" }}>
                    <Globe className="w-6 h-6 mb-2" style={{ color: "#F37021" }} />
                    <span className="text-xs font-bold" style={{ color: "#0f172a" }}>Español</span>
                  </div>
                  <div className="rounded-xl p-4 flex flex-col items-center justify-center border" style={{ borderColor: "rgba(15,23,42,0.06)" }}>
                    <Settings className="w-6 h-6 mb-2" style={{ color: "#F37021" }} />
                    <span className="text-xs font-bold" style={{ color: "#0f172a" }}>Settings</span>
                  </div>
                </div>
              </div>
              <div className="order-1 md:order-2">
                <div className="text-sm font-bold mb-2" style={{ color: "#F37021", fontFamily: "monospace" }}>[08]</div>
                <h3 className="text-2xl md:text-3xl font-extrabold mb-4" style={{ color: "#0f172a", letterSpacing: "-0.02em" }}>
                  Platform Features
                </h3>
                <p className="text-base leading-relaxed mb-6" style={{ color: "rgba(15,23,42,0.55)" }}>
                  Light and dark themes so you can read the screen at 6 AM or midnight. Full Spanish localization for bilingual crews. Mobile-first design that works on any device - because nobody&apos;s carrying a laptop through a construction site.
                </p>
                <div className="flex flex-wrap gap-2">
                  {["Dark Mode", "Light Mode", "Español", "Mobile-First"].map((tag) => (
                    <span key={tag} className="text-xs font-semibold px-3 py-1 rounded-full border" style={{ color: "#F37021", borderColor: "rgba(243,112,33,0.3)", background: "rgba(243,112,33,0.06)" }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ═══ WHO WE SERVE ═══ */}
      <section id="who-we-serve" className="py-16 md:py-24 border-t" style={{ borderColor: "rgba(15,23,42,0.08)" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold uppercase tracking-widest mb-4" style={{ color: "#F37021", fontFamily: "monospace" }}>
              Who We Serve
            </p>
            <h2 className="text-3xl md:text-5xl font-extrabold" style={{ color: "#0f172a", letterSpacing: "-0.03em" }}>
              Built by <em className="font-medium" style={{ color: "#F37021" }}>field operators</em>.<br />
              For field operators.
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: HardHat,
                title: "Superintendents",
                desc: "You run the job. Daily logs, field reports, coordination meetings, and toolbox talks - all from your phone. Know what's happening today, what's at risk, and what's about to blow up before it does.",
              },
              {
                icon: Briefcase,
                title: "Project Managers",
                desc: "You own the schedule and the client relationship. Reforecast engine, milestone tracking, sub portal, document management - executive snapshots and risk detection without digging through spreadsheets.",
              },
              {
                icon: Building2,
                title: "General Contractors",
                desc: "Full platform visibility across every project. Trade coordination, conflict detection, sub management, safety compliance. Your entire team on one shared operating picture - upload once, everyone's aligned.",
              },
              {
                icon: Users,
                title: "Subcontractors",
                desc: "This isn't just a schedule viewer. Sub Ops gives you a morning dispatch board, foreman and crew management, production tracking, SOP library, and department handoff boards. Run your entire operation - not just see when you're up.",
              },
            ].map((persona) => (
              <div
                key={persona.title}
                className="rounded-2xl p-6 md:p-8 border transition-all"
                style={{ background: "white", borderColor: persona.title === "Subcontractors" ? "rgba(243,112,33,0.3)" : "rgba(15,23,42,0.08)" }}
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5" style={{ background: "rgba(243,112,33,0.08)" }}>
                  <persona.icon className="w-6 h-6" style={{ color: "#F37021" }} />
                </div>
                <h3 className="text-xl font-extrabold mb-3" style={{ color: "#0f172a" }}>{persona.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "rgba(15,23,42,0.55)" }}>{persona.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ PRICING ═══ */}
      <section id="pricing" className="py-16 md:py-24 border-t" style={{ borderColor: "rgba(15,23,42,0.08)" }}>
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-10">
            <p className="text-sm font-semibold uppercase tracking-widest mb-4" style={{ color: "#F37021", fontFamily: "monospace" }}>
              Founder Pricing
            </p>
            <h2 className="text-3xl md:text-4xl font-extrabold" style={{ color: "#0f172a", letterSpacing: "-0.03em" }}>
              Simple pricing while we build with early crews.
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {/* Subcontractor Plan */}
            <div className="rounded-2xl p-8 border" style={{ background: "white", borderColor: "rgba(15,23,42,0.12)" }}>
              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ background: "rgba(59,130,246,0.1)" }}>
                  <Briefcase className="w-6 h-6" style={{ color: "#3B82F6" }} />
                </div>
                <h3 className="text-lg font-extrabold mb-1" style={{ color: "#0f172a" }}>Subcontractor</h3>
                <div className="text-3xl font-extrabold" style={{ color: "#0f172a" }}>
                  $10<span className="text-lg font-medium" style={{ color: "rgba(15,23,42,0.35)" }}>/mo</span>
                </div>
                <p className="text-xs mt-1" style={{ color: "rgba(15,23,42,0.4)" }}>Beta pricing per company</p>
              </div>
              <ul className="space-y-2.5 mb-6">
                {[
                  "Sub Ops dashboard",
                  "Morning Dispatch Board",
                  "Foreman & Crew management",
                  "Daily Check-In with photos",
                  "Production tracking",
                  "Blocker reporting",
                  "SOP Library",
                  "Handoff Tracker",
                  "Light/dark + Spanish",
                ].map((feat) => (
                  <li key={feat} className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#22C55E" }} />
                    <span className="text-sm" style={{ color: "#0f172a" }}>{feat}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/signup/sub"
                className="block w-full text-center px-6 py-3 text-white rounded-xl text-sm font-bold transition-all"
                style={{ background: "#3B82F6" }}
              >
                Get Started
              </Link>
            </div>

            {/* GC Plan — Featured */}
            <div className="rounded-2xl p-8 border-2 relative" style={{ background: "white", borderColor: "#F37021" }}>
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="px-3 py-1 rounded-full text-xs font-bold text-white" style={{ background: "#F37021" }}>Most Popular</span>
              </div>
              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ background: "rgba(243,112,33,0.1)" }}>
                  <HardHat className="w-6 h-6" style={{ color: "#F37021" }} />
                </div>
                <h3 className="text-lg font-extrabold mb-1" style={{ color: "#0f172a" }}>General Contractor</h3>
                <div className="text-3xl font-extrabold" style={{ color: "#0f172a" }}>
                  $19.99<span className="text-lg font-medium" style={{ color: "rgba(15,23,42,0.35)" }}>/mo</span>
                </div>
                <p className="text-xs mt-1" style={{ color: "rgba(15,23,42,0.4)" }}>Founder beta pricing</p>
              </div>
              <ul className="space-y-2.5 mb-6">
                {[
                  "Everything in Subcontractor, plus:",
                  "All schedule formats (MPP, XER, XLSX, CSV, XML)",
                  "3-week lookahead + reforecast engine",
                  "Field ops: daily logs, reports, inspections",
                  "Safety: toolbox talks, templates",
                  "Documents: submittals, RFIs with AI, drawings",
                  "Sub management + Ready Check + QR sharing",
                  "Punch list + T&M tracking",
                  "Unlimited invited subs and foremen",
                ].map((feat) => (
                  <li key={feat} className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#22C55E" }} />
                    <span className="text-sm" style={{ color: "#0f172a" }}>{feat}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="block w-full text-center px-8 py-4 text-white rounded-xl text-lg font-bold transition-all"
                style={{ background: "#F37021" }}
              >
                Start Founder Plan
              </Link>
            </div>
            {/* Enterprise Plan */}
            <div className="rounded-2xl p-8 border flex flex-col" style={{ background: "white", borderColor: "rgba(15,23,42,0.12)" }}>
              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ background: "rgba(15,23,42,0.05)" }}>
                  <Building2 className="w-6 h-6" style={{ color: "#0f172a" }} />
                </div>
                <h3 className="text-lg font-extrabold mb-1" style={{ color: "#0f172a" }}>Enterprise</h3>
                <div className="text-3xl font-extrabold" style={{ color: "#0f172a" }}>
                  Custom
                </div>
                <p className="text-xs mt-1" style={{ color: "rgba(15,23,42,0.4)" }}>For firms with 5+ active projects</p>
              </div>
              <ul className="space-y-2.5 mb-6 flex-1">
                {[
                  "Everything in GC, plus:",
                  "Unlimited projects",
                  "Multi-user team accounts",
                  "Custom onboarding + training",
                  "Priority support",
                  "API access",
                  "Custom report templates",
                  "Dedicated account manager",
                  "Volume pricing",
                ].map((feat) => (
                  <li key={feat} className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "rgba(15,23,42,0.25)" }} />
                    <span className="text-sm" style={{ color: "rgba(15,23,42,0.55)" }}>{feat}</span>
                  </li>
                ))}
              </ul>
              <a
                href="mailto:irontrackdevelopment@outlook.com?subject=Enterprise%20Demo%20Request&body=I%27d%20like%20to%20schedule%20a%20demo%20of%20IronTrack%20Pulse%20for%20our%20team."
                className="block w-full text-center px-6 py-3 rounded-xl text-sm font-bold transition-all border-2"
                style={{ color: "#0f172a", borderColor: "rgba(15,23,42,0.15)" }}
              >
                Book a Demo
              </a>
              <p className="text-center text-xs mt-3" style={{ color: "rgba(15,23,42,0.35)" }}>
                We will walk your real workflow
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="py-8 border-t" style={{ borderColor: "rgba(15,23,42,0.08)" }}>
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/irontrack-app-icon.svg" alt="" className="w-5 h-5" />
            <span className="text-sm" style={{ color: "rgba(15,23,42,0.4)" }}>© 2026 IronTrack Development LLC</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4 text-xs md:text-sm">
            <Link href="/terms" style={{ color: "rgba(15,23,42,0.4)" }}>Terms</Link>
            <span style={{ color: "rgba(15,23,42,0.15)" }}>·</span>
            <Link href="/privacy" style={{ color: "rgba(15,23,42,0.4)" }}>Privacy</Link>
            <span style={{ color: "rgba(15,23,42,0.15)" }}>·</span>
            <Link href="/status" style={{ color: "rgba(15,23,42,0.4)" }}>Status</Link>
            <span style={{ color: "rgba(15,23,42,0.15)" }}>·</span>
            <Link href="/release-notes" style={{ color: "rgba(15,23,42,0.4)" }}>Release Notes</Link>
            <span style={{ color: "rgba(15,23,42,0.15)" }}>·</span>
            <a href="mailto:irontrackdevelopment@outlook.com" style={{ color: "rgba(15,23,42,0.4)" }}>Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
