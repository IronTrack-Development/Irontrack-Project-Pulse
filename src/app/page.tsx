import Link from "next/link";
import {
  ArrowRight, CheckCircle, HardHat, Briefcase, Building2,
  Calendar, QrCode, ClipboardList,
  Camera, FileText, Shield, Zap, Users,
  Handshake, ArrowRightLeft, Sun, Moon, Globe,
  AlertTriangle, Truck, Search, Clipboard, Settings
} from "lucide-react";
import MobileMenu from "@/components/MobileMenu";

export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: "#F5F3EE" }}>
      {/* ═══ HEADER ═══ */}
      <header className="sticky top-0 z-50 border-b" style={{ background: "#F5F3EE", borderColor: "rgba(13,13,13,0.08)" }}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            <img
              src="/irontrack-app-icon.svg"
              alt="IronTrack"
              className="h-9 md:h-11 w-auto"
            />
            <span className="text-lg md:text-xl font-extrabold tracking-tight" style={{ color: "#0D0D0D", letterSpacing: "-0.03em" }}>
              Iron<span style={{ color: "#E85D1C" }}>Track</span>
              <span className="hidden md:inline font-medium text-base ml-1.5" style={{ color: "rgba(13,13,13,0.4)" }}>Subcontractor Pulse</span>
            </span>
          </div>

          <MobileMenu />

          <nav className="hidden md:flex items-center gap-8">
            {["Workflow", "Features", "Who We Serve", "Pricing"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(/ /g, "-")}`}
                className="text-sm font-medium transition-colors hover:text-[#0D0D0D]"
                style={{ color: "rgba(13,13,13,0.55)" }}
              >
                {item}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden sm:block text-sm font-medium transition-colors"
              style={{ color: "rgba(13,13,13,0.55)" }}
            >
              Sign in
            </Link>
            <a
              href="mailto:irontrackdevelopment@outlook.com?subject=IronTrack%20Demo%20Request&body=I%27d%20like%20to%20book%20a%20demo%20of%20IronTrack%20Project%20Pulse."
              className="text-sm px-5 py-2.5 rounded-xl font-bold text-white transition-colors"
              style={{ background: "#E85D1C" }}
            >
              Book Demo
            </a>
          </div>
        </div>
      </header>

      {/* ═══ HERO ═══ */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 pt-16 pb-10 md:pt-28 md:pb-20">
          <div className="text-center max-w-4xl mx-auto">
            <p className="text-sm font-semibold uppercase tracking-widest mb-4" style={{ color: "#E85D1C", fontFamily: "monospace" }}>
              Job Inbox → Work Cards → Readiness Board → Proof Log → GC Response → Owner Snapshot
            </p>
            <h1
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 leading-[0.95]"
              style={{ color: "#0D0D0D", letterSpacing: "-0.03em" }}
            >
              Control GC chaos<br />
              <em className="font-medium" style={{ color: "#E85D1C" }}>without asking GC to change.</em>
            </h1>
            <p className="text-lg md:text-xl leading-relaxed mb-10 max-w-3xl mx-auto" style={{ color: "rgba(13,13,13,0.55)" }}>
              IronTrack helps subcontractors control requests, schedule noise, proof, and responses across Procore, Autodesk, Fieldwire, email, PDFs, screenshots, texts, calls, and spreadsheets without requiring the GC to adopt another tool.
            </p>
            <div className="mx-auto mb-8 grid max-w-4xl grid-cols-2 gap-2 rounded-2xl border p-2 text-left sm:grid-cols-3 lg:grid-cols-6" style={{ background: "rgba(255,255,255,0.72)", borderColor: "rgba(13,13,13,0.08)" }}>
              {["Job Inbox", "Work Cards", "Readiness", "Proof Log", "GC Response", "Owner Snapshot"].map((step, index) => (
                <div key={step} className="rounded-xl px-3 py-3" style={{ background: index === 0 ? "rgba(232,93,28,0.08)" : "white" }}>
                  <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "rgba(13,13,13,0.35)", fontFamily: "monospace" }}>
                    0{index + 1}
                  </div>
                  <div className="mt-1 text-sm font-extrabold" style={{ color: "#0D0D0D" }}>{step}</div>
                </div>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
              <a
                href="mailto:irontrackdevelopment@outlook.com?subject=IronTrack%20Demo%20Request&body=I%27d%20like%20to%20book%20a%20demo%20of%20IronTrack%20Project%20Pulse."
                className="inline-flex items-center justify-center gap-2 px-7 py-4 text-white rounded-xl text-base font-bold transition-all shadow-lg"
                style={{ background: "#E85D1C", boxShadow: "0 8px 24px rgba(232,93,28,0.25)" }}
              >
                <Calendar className="w-5 h-5" />
                Book a sub workflow demo
                <ArrowRight className="w-5 h-5" />
              </a>
              <Link
                href="/signup/sub"
                className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl text-base font-bold transition-all border"
                style={{ color: "#0D0D0D", background: "white", borderColor: "rgba(13,13,13,0.12)" }}
              >
                <Briefcase className="w-5 h-5" />
                Start as Subcontractor
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs font-semibold" style={{ color: "rgba(13,13,13,0.45)" }}>
              <span>Public beta</span>
              <span>•</span>
              <span>Subcontractor-first workflow</span>
              <span>•</span>
              <Link href="/signup" className="hover:text-[#0D0D0D]">GC / owner access is secondary</Link>
              <span>•</span>
              <span>Support: irontrackdevelopment@outlook.com</span>
            </div>
            <div className="mt-12 grid md:grid-cols-3 gap-3 text-left">
              {[
                {
                  label: "6:15 AM",
                  title: "GC requests land in one inbox",
                  body: "Email, screenshots, texts, PDFs, and portal notes become work cards your team can act on.",
                  icon: Truck,
                  color: "#E85D1C",
                },
                {
                  label: "11:40 AM",
                  title: "Blockers get proof, not rumors",
                  body: "Foremen attach photos, notes, and readiness status while the facts are still fresh.",
                  icon: AlertTriangle,
                  color: "#DC2626",
                },
                {
                  label: "3:55 PM",
                  title: "GC response is ready to send",
                  body: "Operations can send a clean answer and roll the proof into an owner-friendly snapshot.",
                  icon: ArrowRightLeft,
                  color: "#3B82F6",
                },
              ].map((item) => (
                <div key={item.title} className="rounded-2xl p-5 border shadow-sm" style={{ background: "white", borderColor: "rgba(13,13,13,0.08)" }}>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "rgba(13,13,13,0.35)", fontFamily: "monospace" }}>{item.label}</span>
                    <item.icon className="w-5 h-5" style={{ color: item.color }} />
                  </div>
                  <h3 className="text-base font-extrabold mb-2" style={{ color: "#0D0D0D" }}>{item.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "rgba(13,13,13,0.55)" }}>{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="workflow" className="py-12 md:py-16 border-y" style={{ borderColor: "rgba(13,13,13,0.08)", background: "#0D0D0D" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-8 md:gap-12 items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest mb-4" style={{ color: "#E85D1C", fontFamily: "monospace" }}>
                The Problem We Are Built For
              </p>
              <h2 className="text-3xl md:text-5xl font-extrabold leading-tight mb-5 text-white" style={{ letterSpacing: "-0.03em" }}>
                Stop letting GC noise run your company.
              </h2>
              <p className="text-base md:text-lg leading-relaxed mb-6" style={{ color: "rgba(255,255,255,0.68)" }}>
                Every GC works differently: Procore on one job, Autodesk on another, Fieldwire on a third, plus email, PDFs, screenshots, texts, calls, and spreadsheets. IronTrack gives subcontractors one operating layer for what needs action today.
              </p>
              <a
                href="mailto:irontrackdevelopment@outlook.com?subject=IronTrack%20Workflow%20Demo&body=I%27d%20like%20to%20see%20the%20IronTrack%20handoff%20and%20field%20pulse%20workflow."
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white"
                style={{ background: "#E85D1C" }}
              >
                See the sub workflow
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                ["Job Inbox", "All GC asks, portal exports, screenshots, emails, calls, and texts routed into one daily queue."],
                ["Work Cards", "Each request becomes a clear scope card with project, location, due date, owner, and next action."],
                ["Readiness Board", "Foremen and operations see what is ready, not ready, blocked, or waiting on the GC."],
                ["Proof Log", "Photos, notes, quantities, and field context stay tied to the work instead of scattered in phones."],
                ["GC Response", "Turn field facts into a clean reply back to the GC without rewriting the story twice."],
                ["Owner Snapshot", "Roll up proof, blockers, and responses into a leadership view for subcontractor owners."],
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
      <section id="integrations" className="py-10 md:py-14 border-y" style={{ borderColor: "rgba(13,13,13,0.08)" }}>
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-center text-sm font-semibold uppercase tracking-widest mb-6" style={{ color: "rgba(13,13,13,0.35)", fontFamily: "monospace" }}>
            Works Around The Tools GCs Already Use
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
            {[
              { name: "Procore", ext: "GC portal" },
              { name: "Autodesk", ext: "ACC / Build" },
              { name: "Fieldwire", ext: "Field tasks" },
              { name: "Email + Texts", ext: "Daily noise" },
              { name: "Calls", ext: "Manual notes" },
              { name: "PDFs + Screenshots", ext: "Proof trails" },
              { name: "Spreadsheets", ext: "Work logs" },
            ].map((source) => (
              <div
                key={source.name}
                className="flex items-center gap-3 px-5 py-3 rounded-xl border shadow-sm"
                style={{ background: "white", borderColor: "rgba(13,13,13,0.08)" }}
              >
                <div className="grid h-8 w-8 place-items-center rounded-lg text-xs font-black text-white" style={{ background: "#0D0D0D" }}>
                  {source.name.slice(0, 1)}
                </div>
                <div>
                  <div className="text-sm font-bold" style={{ color: "#0D0D0D" }}>{source.name}</div>
                  <div className="text-[10px] font-mono" style={{ color: "rgba(13,13,13,0.4)" }}>{source.ext}</div>
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
            <p className="text-sm font-semibold uppercase tracking-widest mb-4" style={{ color: "#E85D1C", fontFamily: "monospace" }}>
              Subcontractor Workflow
            </p>
            <h2 className="text-3xl md:text-5xl font-extrabold" style={{ color: "#0D0D0D", letterSpacing: "-0.03em" }}>
              One operating layer.<br />
              <em className="font-medium" style={{ color: "#E85D1C" }}>No GC rollout required.</em>
            </h2>
          </div>

          <div className="space-y-16 md:space-y-24">

            {/* ── [01] Job Inbox ── */}
            <div className="grid md:grid-cols-2 gap-8 md:gap-16 items-center">
              <div>
                <div className="text-sm font-bold mb-2" style={{ color: "#E85D1C", fontFamily: "monospace" }}>[01]</div>
                <h3 className="text-2xl md:text-3xl font-extrabold mb-4" style={{ color: "#0D0D0D", letterSpacing: "-0.02em" }}>
                  Job Inbox
                </h3>
                <p className="text-base leading-relaxed mb-6" style={{ color: "rgba(13,13,13,0.55)" }}>
                  Pull the chaos into one queue: portal tasks, schedule exports, PDFs, screenshots, texts, calls, emails, spreadsheet trackers, and GC asks. Operations can triage what needs action today without forcing the GC into another login.
                </p>
                <div className="flex flex-wrap gap-2">
                  {["GC Requests", "Portal Exports", "Email Intake", "PDF Notes", "Screenshot Tasks", "Today Queue"].map((tag) => (
                    <span key={tag} className="text-xs font-semibold px-3 py-1 rounded-full border" style={{ color: "#E85D1C", borderColor: "rgba(232,93,28,0.3)", background: "rgba(232,93,28,0.06)" }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl p-6 border" style={{ background: "white", borderColor: "rgba(13,13,13,0.08)" }}>
                <div className="space-y-2 mb-4">
                  {[
                    { task: "Procore RFI follow-up - Level 3 ceiling", pct: "Due today", color: "#E85D1C" },
                    { task: "Fieldwire task screenshot - Room 204", pct: "New", color: "#3B82F6" },
                    { task: "Email: missing access at loading dock", pct: "Blocked", color: "#DC2626" },
                    { task: "PDF markup: duct reroute sketch", pct: "Review", color: "var(--text-muted)" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl border" style={{ borderColor: "rgba(13,13,13,0.06)" }}>
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ background: item.color }} />
                      <span className="text-sm flex-1 truncate" style={{ color: "#0D0D0D" }}>{item.task}</span>
                      <span className="text-xs font-bold" style={{ color: item.color }}>{item.pct}</span>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="rounded-xl p-3 border" style={{ borderColor: "rgba(13,13,13,0.06)" }}>
                    <div className="text-[10px] uppercase tracking-wide mb-1" style={{ color: "rgba(13,13,13,0.35)" }}>Needs Action</div>
                    <div className="text-lg font-extrabold" style={{ color: "#DC2626" }}>4 items</div>
                  </div>
                  <div className="rounded-xl p-3 border" style={{ borderColor: "rgba(13,13,13,0.06)" }}>
                    <div className="text-[10px] uppercase tracking-wide mb-1" style={{ color: "rgba(13,13,13,0.35)" }}>Waiting on GC</div>
                    <div className="text-lg font-extrabold" style={{ color: "#EAB308" }}>2 asks</div>
                  </div>
                </div>
                <div className="rounded-xl p-3 border" style={{ borderColor: "rgba(232,93,28,0.2)", background: "rgba(232,93,28,0.04)" }}>
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="w-3.5 h-3.5" style={{ color: "#E85D1C" }} />
                    <span className="text-[10px] font-bold uppercase" style={{ color: "#E85D1C" }}>Next Action</span>
                  </div>
                  <p className="text-xs" style={{ color: "rgba(13,13,13,0.6)" }}>
                    Assign the loading dock blocker to the PM and send the GC the proof package.
                  </p>
                </div>
              </div>
            </div>

            {/* ── [02] Work Cards & Proof Log ── */}
            <div className="grid md:grid-cols-2 gap-8 md:gap-16 items-center">
              <div className="order-2 md:order-1 rounded-2xl p-6 border" style={{ background: "white", borderColor: "rgba(13,13,13,0.08)" }}>
                <div className="rounded-xl overflow-hidden border mb-3" style={{ borderColor: "rgba(13,13,13,0.06)" }}>
                  <div className="px-4 py-2.5" style={{ background: "#1e3a5f" }}>
                    <span className="text-xs font-bold text-white uppercase tracking-wider">Daily Log</span>
                    <span className="text-[10px] ml-2" style={{ color: "#93c5fd" }}>Apr 25, 2026</span>
                  </div>
                  <div className="px-4 py-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <Sun className="w-3.5 h-3.5" style={{ color: "#EAB308" }} />
                      <span className="text-xs" style={{ color: "#0D0D0D" }}>72°F - Clear, wind 8mph</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5" style={{ color: "#3B82F6" }} />
                      <span className="text-xs" style={{ color: "#0D0D0D" }}>34 workers on-site · 6 trades active</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Camera className="w-3.5 h-3.5" style={{ color: "#E85D1C" }} />
                      <span className="text-xs" style={{ color: "#0D0D0D" }}>12 photos attached</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg border" style={{ borderColor: "rgba(13,13,13,0.06)" }}>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded text-white" style={{ background: "#DC2626" }}>High</span>
                    <span className="text-xs" style={{ color: "#0D0D0D" }}>Missing backing for grab bars - Corridor 2</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg border" style={{ borderColor: "rgba(13,13,13,0.06)" }}>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded text-white" style={{ background: "#22C55E" }}>Done</span>
                    <span className="text-xs" style={{ color: "#0D0D0D" }}>Punch item: Drywall patch Room 204</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3 pt-3 border-t" style={{ borderColor: "rgba(13,13,13,0.06)" }}>
                  <FileText className="w-3.5 h-3.5" style={{ color: "#E85D1C" }} />
                  <span className="text-xs" style={{ color: "rgba(13,13,13,0.4)" }}>Export as PDF · Share via link</span>
                </div>
              </div>
              <div className="order-1 md:order-2">
                <div className="text-sm font-bold mb-2" style={{ color: "#E85D1C", fontFamily: "monospace" }}>[02]</div>
                <h3 className="text-2xl md:text-3xl font-extrabold mb-4" style={{ color: "#0D0D0D", letterSpacing: "-0.02em" }}>
                  Work Cards & Proof Log
                </h3>
                <p className="text-base leading-relaxed mb-6" style={{ color: "rgba(13,13,13,0.55)" }}>
                  Convert scattered GC requests into work cards that carry location, scope, owner, readiness, blockers, photos, quantities, and field notes. Foremen update the card once; operations gets proof without chasing texts.
                </p>
                <div className="flex flex-wrap gap-2">
                  {["Work Cards", "Photo Proof", "Quantities", "Blockers", "Foreman Notes", "Response History"].map((tag) => (
                    <span key={tag} className="text-xs font-semibold px-3 py-1 rounded-full border" style={{ color: "#E85D1C", borderColor: "rgba(232,93,28,0.3)", background: "rgba(232,93,28,0.06)" }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* ── [03] Readiness Board ── */}
            <div className="grid md:grid-cols-2 gap-8 md:gap-16 items-center">
              <div>
                <div className="text-sm font-bold mb-2" style={{ color: "#E85D1C", fontFamily: "monospace" }}>[03]</div>
                <h3 className="text-2xl md:text-3xl font-extrabold mb-4" style={{ color: "#0D0D0D", letterSpacing: "-0.02em" }}>
                  Readiness Board
                </h3>
                <p className="text-base leading-relaxed mb-6" style={{ color: "rgba(13,13,13,0.55)" }}>
                  Show owners, PMs, and foremen what is ready, what is not ready, what is blocked, and what is waiting on a GC answer. The board is deterministic and status-driven so crews know where to go next.
                </p>
                <div className="flex flex-wrap gap-2">
                  {["Ready", "Not Ready", "Blocked", "Waiting on GC", "Needs Proof", "Next Crew"].map((tag) => (
                    <span key={tag} className="text-xs font-semibold px-3 py-1 rounded-full border" style={{ color: "#E85D1C", borderColor: "rgba(232,93,28,0.3)", background: "rgba(232,93,28,0.06)" }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl p-6 border" style={{ background: "white", borderColor: "rgba(13,13,13,0.08)" }}>
                <div className="rounded-xl overflow-hidden border mb-3" style={{ borderColor: "rgba(13,13,13,0.06)" }}>
                  <div className="px-4 py-2.5" style={{ background: "#0D0D0D" }}>
                    <span className="text-xs font-bold text-white uppercase tracking-wider">Readiness Board</span>
                    <span className="text-[10px] ml-2" style={{ color: "rgba(255,255,255,0.55)" }}>Tomorrow · 6 Cards</span>
                  </div>
                  <div className="px-4 py-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <Shield className="w-3.5 h-3.5" style={{ color: "#22C55E" }} />
                      <span className="text-xs font-bold" style={{ color: "#22C55E" }}>Ready: Level 2 rough-in · crew assigned</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5" style={{ color: "#DC2626" }} />
                      <span className="text-xs" style={{ color: "#0D0D0D" }}>Blocked: loading dock access still locked</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5" style={{ color: "#EAB308" }} />
                      <span className="text-xs" style={{ color: "#0D0D0D" }}>Waiting: revised drawing SK-18</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex -space-x-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white" style={{ background: i === 4 ? "var(--text-muted)" : "#E85D1C" }}>
                        {i === 4 ? "+14" : ["JR", "MS", "DT"][i - 1]}
                      </div>
                    ))}
                  </div>
                  <span className="text-xs" style={{ color: "rgba(13,13,13,0.4)" }}>Foremen can update status from the phone</span>
                </div>
              </div>
            </div>

            {/* ── [04] GC Response ── */}
            <div className="grid md:grid-cols-2 gap-8 md:gap-16 items-center">
              <div className="order-2 md:order-1 rounded-2xl p-6 border" style={{ background: "white", borderColor: "rgba(13,13,13,0.08)" }}>
                <div className="rounded-xl overflow-hidden border mb-3" style={{ borderColor: "rgba(13,13,13,0.06)" }}>
                  <div className="px-4 py-2.5" style={{ background: "#0D0D0D" }}>
                    <span className="text-xs font-bold text-white uppercase tracking-wider">Coordination Meeting</span>
                    <span className="text-[10px] ml-2" style={{ color: "rgba(255,255,255,0.5)" }}>Week 17 · Auto-Agenda</span>
                  </div>
                  <div className="px-4 py-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5" style={{ color: "#DC2626" }} />
                      <span className="text-xs font-bold" style={{ color: "#DC2626" }}>Conflict: Electrical + HVAC - Level 3 ceiling</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clipboard className="w-3.5 h-3.5" style={{ color: "#E85D1C" }} />
                      <span className="text-xs" style={{ color: "#0D0D0D" }}>Action: Re-sequence HVAC rough-in - Owner: AMS Mechanical</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clipboard className="w-3.5 h-3.5" style={{ color: "#3B82F6" }} />
                      <span className="text-xs" style={{ color: "#0D0D0D" }}>Action: Confirm conduit routing - Owner: ATS Electric</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Handshake className="w-3.5 h-3.5" style={{ color: "#E85D1C" }} />
                  <span className="text-xs" style={{ color: "rgba(13,13,13,0.4)" }}>Agenda auto-populated from schedule data</span>
                </div>
              </div>
              <div className="order-1 md:order-2">
                <div className="text-sm font-bold mb-2" style={{ color: "#E85D1C", fontFamily: "monospace" }}>[04]</div>
                <h3 className="text-2xl md:text-3xl font-extrabold mb-4" style={{ color: "#0D0D0D", letterSpacing: "-0.02em" }}>
                  GC Response
                </h3>
                <p className="text-base leading-relaxed mb-6" style={{ color: "rgba(13,13,13,0.55)" }}>
                  Turn field facts into clean responses for Procore comments, email threads, meeting asks, and delay notices. IronTrack keeps the source proof attached so your PM is not rebuilding the story from memory.
                </p>
                <div className="flex flex-wrap gap-2">
                  {["Reply Draft", "Proof Attached", "Delay Context", "Owner Review", "Response Log"].map((tag) => (
                    <span key={tag} className="text-xs font-semibold px-3 py-1 rounded-full border" style={{ color: "#E85D1C", borderColor: "rgba(232,93,28,0.3)", background: "rgba(232,93,28,0.06)" }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* ── [05] Owner Snapshot ── */}
            <div className="grid md:grid-cols-2 gap-8 md:gap-16 items-center">
              <div>
                <div className="text-sm font-bold mb-2" style={{ color: "#E85D1C", fontFamily: "monospace" }}>[05]</div>
                <h3 className="text-2xl md:text-3xl font-extrabold mb-4" style={{ color: "#0D0D0D", letterSpacing: "-0.02em" }}>
                  Owner Snapshot
                </h3>
                <p className="text-base leading-relaxed mb-6" style={{ color: "rgba(13,13,13,0.55)" }}>
                  Give subcontractor owners and operations leaders a fast read on what needs action today: open GC requests, blocked crews, missing proof, unsent responses, and work that is ready for the next crew.
                </p>
                <div className="flex flex-wrap gap-2">
                  {["Today's Actions", "Blocked Work", "Proof Gaps", "GC Responses", "Crew Readiness"].map((tag) => (
                    <span key={tag} className="text-xs font-semibold px-3 py-1 rounded-full border" style={{ color: "#E85D1C", borderColor: "rgba(232,93,28,0.3)", background: "rgba(232,93,28,0.06)" }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl p-6 border" style={{ background: "white", borderColor: "rgba(13,13,13,0.08)" }}>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl border" style={{ borderColor: "rgba(13,13,13,0.06)" }}>
                    <FileText className="w-4 h-4" style={{ color: "#3B82F6" }} />
                    <div className="flex-1">
                      <span className="text-xs font-bold" style={{ color: "#0D0D0D" }}>RFI-042: Beam Connection Detail</span>
                      <div className="text-[10px]" style={{ color: "rgba(13,13,13,0.4)" }}>Draft ready · Awaiting response</div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ color: "#EAB308", background: "rgba(234,179,8,0.1)" }}>Open</span>
                  </div>
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl border" style={{ borderColor: "rgba(13,13,13,0.06)" }}>
                    <ClipboardList className="w-4 h-4" style={{ color: "#22C55E" }} />
                    <div className="flex-1">
                      <span className="text-xs font-bold" style={{ color: "#0D0D0D" }}>SUB-118: Fire Damper Shop Dwgs</span>
                      <div className="text-[10px]" style={{ color: "rgba(13,13,13,0.4)" }}>Rev 2 · Approved</div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ color: "#22C55E", background: "rgba(34,197,94,0.1)" }}>Approved</span>
                  </div>
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl border" style={{ borderColor: "rgba(13,13,13,0.06)" }}>
                    <Search className="w-4 h-4" style={{ color: "#E85D1C" }} />
                    <div className="flex-1">
                      <span className="text-xs font-bold" style={{ color: "#0D0D0D" }}>DWG: Mechanical - Level 3</span>
                      <div className="text-[10px]" style={{ color: "rgba(13,13,13,0.4)" }}>Rev C · 4 sheets</div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ color: "#3B82F6", background: "rgba(59,130,246,0.1)" }}>Current</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── [06] GC-Compatible Access ── */}
            <div className="grid md:grid-cols-2 gap-8 md:gap-16 items-center">
              <div className="order-2 md:order-1 rounded-2xl p-6 border" style={{ background: "white", borderColor: "rgba(13,13,13,0.08)" }}>
                <div className="space-y-3 mb-4">
                  <div className="rounded-xl px-4 py-3 border" style={{ borderColor: "rgba(13,13,13,0.06)" }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold" style={{ color: "#0D0D0D" }}>ATS Electric</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ color: "#22C55E", background: "rgba(34,197,94,0.1)" }}>Confirmed ✓</span>
                    </div>
                    <span className="text-[11px]" style={{ color: "rgba(13,13,13,0.4)" }}>Rough-In Electrical - Mon Apr 21</span>
                  </div>
                  <div className="rounded-xl px-4 py-3 border" style={{ borderColor: "rgba(13,13,13,0.06)" }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold" style={{ color: "#0D0D0D" }}>Buildtek Framing</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ color: "#EAB308", background: "rgba(234,179,8,0.1)" }}>Awaiting</span>
                    </div>
                    <span className="text-[11px]" style={{ color: "rgba(13,13,13,0.4)" }}>Exterior Framing Bldg B - Tue Apr 22</span>
                  </div>
                  <div className="rounded-xl px-4 py-3 border" style={{ borderColor: "rgba(232,93,28,0.2)", background: "rgba(232,93,28,0.03)" }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold" style={{ color: "#0D0D0D" }}>AMS Fire Protection</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ color: "#EF4444", background: "rgba(239,68,68,0.1)" }}>Issue Flagged</span>
                    </div>
                    <span className="text-[11px]" style={{ color: "rgba(13,13,13,0.4)" }}>Sprinkler install delayed - material lead time</span>
                  </div>
                </div>
                <div className="flex items-center justify-center mb-3">
                  <div className="w-24 h-24 rounded-xl flex items-center justify-center" style={{ background: "#E85D1C" }}>
                    <QrCode className="w-12 h-12 text-white" />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-xs" style={{ color: "rgba(13,13,13,0.4)" }}>
                    Subs see their scope only · No float or predecessors exposed
                  </p>
                </div>
              </div>
              <div className="order-1 md:order-2">
                <div className="text-sm font-bold mb-2" style={{ color: "#E85D1C", fontFamily: "monospace" }}>[06]</div>
                <h3 className="text-2xl md:text-3xl font-extrabold mb-4" style={{ color: "#0D0D0D", letterSpacing: "-0.02em" }}>
                  GC-Compatible Access
                </h3>
                <p className="text-base leading-relaxed mb-6" style={{ color: "rgba(13,13,13,0.55)" }}>
                  The GC side still exists when a project needs shared schedules, QR links, or scoped views. But the subcontractor can get value first by organizing requests and proof internally before asking anyone else to adopt IronTrack.
                </p>
                <div className="flex flex-wrap gap-2">
                  {["Scoped Views", "QR Links", "Schedule Imports", "No GC Rollout", "Protected Data"].map((tag) => (
                    <span key={tag} className="text-xs font-semibold px-3 py-1 rounded-full border" style={{ color: "#E85D1C", borderColor: "rgba(232,93,28,0.3)", background: "rgba(232,93,28,0.06)" }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* ── [07] Sub Ops - FEATURED ── */}
            <div className="relative">
              <div className="absolute -inset-4 md:-inset-8 rounded-3xl" style={{ background: "rgba(232,93,28,0.04)", border: "2px solid rgba(232,93,28,0.15)" }} />
              <div className="relative grid md:grid-cols-2 gap-8 md:gap-16 items-center">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-3" style={{ background: "rgba(232,93,28,0.12)" }}>
                    <Zap className="w-3.5 h-3.5" style={{ color: "#E85D1C" }} />
                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#E85D1C" }}>Subcontractor Wedge</span>
                  </div>
                  <div className="text-sm font-bold mb-2" style={{ color: "#E85D1C", fontFamily: "monospace" }}>[07]</div>
                  <h3 className="text-2xl md:text-3xl font-extrabold mb-4" style={{ color: "#0D0D0D", letterSpacing: "-0.02em" }}>
                    Sub Ops
                  </h3>
                  <p className="text-base leading-relaxed mb-4" style={{ color: "rgba(13,13,13,0.55)" }}>
                    Sub Ops gives owners, operations managers, PMs, foremen, and field crews a focused way to see GC requests, upcoming work cards, readiness, blockers, proof photos, and response status. It is a field loop, not another bloated back-office system.
                  </p>
                  <p className="text-base leading-relaxed mb-6" style={{ color: "rgba(13,13,13,0.55)" }}>
                    Multi-department subs can track handoffs - sheet metal to piping to controls - with checklists and photos so the next crew knows what is ready, what is missing, and what needs an answer from the GC.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {["Job Inbox", "Work Cards", "Readiness Board", "Proof Log", "GC Response", "Owner Snapshot"].map((tag) => (
                      <span key={tag} className="text-xs font-semibold px-3 py-1 rounded-full border" style={{ color: "#E85D1C", borderColor: "rgba(232,93,28,0.3)", background: "rgba(232,93,28,0.06)" }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl p-6 border" style={{ background: "white", borderColor: "rgba(232,93,28,0.2)" }}>
                  {/* Work Card Mock */}
                  <div className="rounded-xl overflow-hidden border mb-3" style={{ borderColor: "rgba(13,13,13,0.06)" }}>
                    <div className="px-4 py-2.5" style={{ background: "#E85D1C" }}>
                      <span className="text-xs font-bold text-white uppercase tracking-wider">Work Cards</span>
                      <span className="text-[10px] ml-2 text-orange-200">Today · 6 Active</span>
                    </div>
                    <div className="px-4 py-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <Truck className="w-3.5 h-3.5" style={{ color: "#E85D1C" }} />
                        <span className="text-xs font-bold" style={{ color: "#0D0D0D" }}>Crew A → Riverside Medical</span>
                        <span className="text-[10px] ml-auto" style={{ color: "rgba(13,13,13,0.4)" }}>Ductwork L3</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Truck className="w-3.5 h-3.5" style={{ color: "#3B82F6" }} />
                        <span className="text-xs font-bold" style={{ color: "#0D0D0D" }}>Crew B → Central Office Tower</span>
                        <span className="text-[10px] ml-auto" style={{ color: "rgba(13,13,13,0.4)" }}>Piping L1</span>
                      </div>
                    </div>
                  </div>
                  {/* Production + Handoff Mock */}
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="rounded-xl p-3 border" style={{ borderColor: "rgba(13,13,13,0.06)" }}>
                      <div className="text-[10px] uppercase tracking-wide mb-1" style={{ color: "rgba(13,13,13,0.35)" }}>Production Today</div>
                      <div className="text-lg font-extrabold" style={{ color: "#22C55E" }}>340 LF</div>
                      <div className="text-[10px]" style={{ color: "rgba(13,13,13,0.4)" }}>Ductwork installed</div>
                    </div>
                    <div className="rounded-xl p-3 border" style={{ borderColor: "rgba(13,13,13,0.06)" }}>
                      <div className="text-[10px] uppercase tracking-wide mb-1" style={{ color: "rgba(13,13,13,0.35)" }}>Readiness</div>
                      <div className="text-lg font-extrabold" style={{ color: "#3B82F6" }}>3 Ready</div>
                      <div className="text-[10px]" style={{ color: "rgba(13,13,13,0.4)" }}>Sheet metal → piping</div>
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
              <div className="order-2 md:order-1 rounded-2xl p-6 border" style={{ background: "white", borderColor: "rgba(13,13,13,0.08)" }}>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl p-4 flex flex-col items-center justify-center border" style={{ borderColor: "rgba(13,13,13,0.06)", background: "#F5F3EE" }}>
                    <Sun className="w-6 h-6 mb-2" style={{ color: "#E85D1C" }} />
                    <span className="text-xs font-bold" style={{ color: "#0D0D0D" }}>Light Mode</span>
                  </div>
                  <div className="rounded-xl p-4 flex flex-col items-center justify-center" style={{ background: "#1a1a1a" }}>
                    <Moon className="w-6 h-6 mb-2" style={{ color: "#E85D1C" }} />
                    <span className="text-xs font-bold text-white">Dark Mode</span>
                  </div>
                  <div className="rounded-xl p-4 flex flex-col items-center justify-center border" style={{ borderColor: "rgba(13,13,13,0.06)" }}>
                    <Globe className="w-6 h-6 mb-2" style={{ color: "#E85D1C" }} />
                    <span className="text-xs font-bold" style={{ color: "#0D0D0D" }}>Español</span>
                  </div>
                  <div className="rounded-xl p-4 flex flex-col items-center justify-center border" style={{ borderColor: "rgba(13,13,13,0.06)" }}>
                    <Settings className="w-6 h-6 mb-2" style={{ color: "#E85D1C" }} />
                    <span className="text-xs font-bold" style={{ color: "#0D0D0D" }}>Settings</span>
                  </div>
                </div>
              </div>
              <div className="order-1 md:order-2">
                <div className="text-sm font-bold mb-2" style={{ color: "#E85D1C", fontFamily: "monospace" }}>[08]</div>
                <h3 className="text-2xl md:text-3xl font-extrabold mb-4" style={{ color: "#0D0D0D", letterSpacing: "-0.02em" }}>
                  Platform Features
                </h3>
                <p className="text-base leading-relaxed mb-6" style={{ color: "rgba(13,13,13,0.55)" }}>
                  Light and dark themes so you can read the screen at 6 AM or midnight. Full Spanish localization for bilingual crews. Mobile-first design that works on any device - because nobody&apos;s carrying a laptop through a construction site.
                </p>
                <div className="flex flex-wrap gap-2">
                  {["Dark Mode", "Light Mode", "Español", "Mobile-First"].map((tag) => (
                    <span key={tag} className="text-xs font-semibold px-3 py-1 rounded-full border" style={{ color: "#E85D1C", borderColor: "rgba(232,93,28,0.3)", background: "rgba(232,93,28,0.06)" }}>
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
      <section id="who-we-serve" className="py-16 md:py-24 border-t" style={{ borderColor: "rgba(13,13,13,0.08)" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold uppercase tracking-widest mb-4" style={{ color: "#E85D1C", fontFamily: "monospace" }}>
              Who We Serve
            </p>
            <h2 className="text-3xl md:text-5xl font-extrabold" style={{ color: "#0D0D0D", letterSpacing: "-0.03em" }}>
              Built for <em className="font-medium" style={{ color: "#E85D1C" }}>subcontractor teams</em>.<br />
              Clear enough for the jobsite.
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
            {[
              {
                icon: Building2,
                title: "Subcontractor Owners",
                desc: "See which GC requests, blockers, responses, and proof gaps need leadership attention today.",
              },
              {
                icon: Settings,
                title: "Operations Managers",
                desc: "Triage work across jobs and crews without bouncing between portals, spreadsheets, texts, and screenshots.",
              },
              {
                icon: Briefcase,
                title: "Project Managers",
                desc: "Turn scattered GC asks and field proof into clean responses with the context still attached.",
              },
              {
                icon: HardHat,
                title: "Foremen",
                desc: "Open the phone and know what work card needs action, what is ready, and what proof to capture.",
              },
              {
                icon: Users,
                title: "Field Crews",
                desc: "Get clear scope, location, materials, blockers, and handoff notes without reading a full project-management system.",
              },
            ].map((persona) => (
              <div
                key={persona.title}
                className="rounded-2xl p-6 md:p-8 border transition-all"
                style={{ background: "white", borderColor: persona.title === "Subcontractor Owners" ? "rgba(232,93,28,0.3)" : "rgba(13,13,13,0.08)" }}
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5" style={{ background: "rgba(232,93,28,0.08)" }}>
                  <persona.icon className="w-6 h-6" style={{ color: "#E85D1C" }} />
                </div>
                <h3 className="text-xl font-extrabold mb-3" style={{ color: "#0D0D0D" }}>{persona.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "rgba(13,13,13,0.55)" }}>{persona.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ PRICING ═══ */}
      <section id="pricing" className="py-16 md:py-24 border-t" style={{ borderColor: "rgba(13,13,13,0.08)" }}>
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-10">
            <p className="text-sm font-semibold uppercase tracking-widest mb-4" style={{ color: "#E85D1C", fontFamily: "monospace" }}>
              Founder Pricing
            </p>
            <h2 className="text-3xl md:text-4xl font-extrabold" style={{ color: "#0D0D0D", letterSpacing: "-0.03em" }}>
              Simple pricing while we build with early crews.
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {/* Subcontractor Plan */}
            <div className="rounded-2xl p-8 border-2 relative" style={{ background: "white", borderColor: "#E85D1C" }}>
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="px-3 py-1 rounded-full text-xs font-bold text-white" style={{ background: "#E85D1C" }}>Primary Focus</span>
              </div>
              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ background: "rgba(232,93,28,0.1)" }}>
                  <Briefcase className="w-6 h-6" style={{ color: "#E85D1C" }} />
                </div>
                <h3 className="text-lg font-extrabold mb-1" style={{ color: "#0D0D0D" }}>Subcontractor</h3>
                <div className="text-3xl font-extrabold" style={{ color: "#0D0D0D" }}>
                  $10<span className="text-lg font-medium" style={{ color: "rgba(13,13,13,0.35)" }}>/mo</span>
                </div>
                <p className="text-xs mt-1" style={{ color: "rgba(13,13,13,0.4)" }}>Beta pricing per company</p>
              </div>
              <ul className="space-y-2.5 mb-6">
                {[
                  "Job Inbox",
                  "Work Cards",
                  "Readiness Board",
                  "Proof Log with photos",
                  "GC Response workflow",
                  "Owner Snapshot",
                  "Foreman-friendly mobile tools",
                  "Handoff Tracker for crews",
                  "Light/dark + Spanish",
                ].map((feat) => (
                  <li key={feat} className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#22C55E" }} />
                    <span className="text-sm" style={{ color: "#0D0D0D" }}>{feat}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/signup/sub"
                className="block w-full text-center px-6 py-3 text-white rounded-xl text-sm font-bold transition-all"
                style={{ background: "#E85D1C" }}
              >
                Start Subcontractor Beta
              </Link>
            </div>

            {/* GC Plan — Secondary */}
            <div className="rounded-2xl p-8 border relative" style={{ background: "white", borderColor: "rgba(13,13,13,0.12)" }}>
              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ background: "rgba(13,13,13,0.05)" }}>
                  <HardHat className="w-6 h-6" style={{ color: "#0D0D0D" }} />
                </div>
                <h3 className="text-lg font-extrabold mb-1" style={{ color: "#0D0D0D" }}>GC / Owner Access</h3>
                <div className="text-3xl font-extrabold" style={{ color: "#0D0D0D" }}>
                  $19.99<span className="text-lg font-medium" style={{ color: "rgba(13,13,13,0.35)" }}>/mo</span>
                </div>
                <p className="text-xs mt-1" style={{ color: "rgba(13,13,13,0.4)" }}>Legacy infrastructure tier</p>
              </div>
              <ul className="space-y-2.5 mb-6">
                {[
                  "Shared schedule infrastructure",
                  "All schedule formats (MPP, XER, XLSX, CSV, XML)",
                  "3-week lookahead + deterministic reforecast",
                  "Daily logs, reports, and inspections",
                  "Scoped QR sharing",
                  "Sub visibility when the GC chooses to participate",
                ].map((feat) => (
                  <li key={feat} className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#22C55E" }} />
                    <span className="text-sm" style={{ color: "#0D0D0D" }}>{feat}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="block w-full text-center px-8 py-4 rounded-xl text-lg font-bold transition-all border-2"
                style={{ color: "#0D0D0D", borderColor: "rgba(13,13,13,0.15)" }}
              >
                Request GC access
              </Link>
            </div>
            {/* Enterprise Plan */}
            <div className="rounded-2xl p-8 border flex flex-col" style={{ background: "white", borderColor: "rgba(13,13,13,0.12)" }}>
              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ background: "rgba(13,13,13,0.05)" }}>
                  <Building2 className="w-6 h-6" style={{ color: "#0D0D0D" }} />
                </div>
                <h3 className="text-lg font-extrabold mb-1" style={{ color: "#0D0D0D" }}>Enterprise</h3>
                <div className="text-3xl font-extrabold" style={{ color: "#0D0D0D" }}>
                  Custom
                </div>
                <p className="text-xs mt-1" style={{ color: "rgba(13,13,13,0.4)" }}>For firms with 5+ active projects</p>
              </div>
              <ul className="space-y-2.5 mb-6 flex-1">
                {[
                  "Everything in Subcontractor, plus:",
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
                    <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "rgba(13,13,13,0.25)" }} />
                    <span className="text-sm" style={{ color: "rgba(13,13,13,0.55)" }}>{feat}</span>
                  </li>
                ))}
              </ul>
              <a
                href="mailto:irontrackdevelopment@outlook.com?subject=Enterprise%20Demo%20Request&body=I%27d%20like%20to%20schedule%20a%20demo%20of%20IronTrack%20Pulse%20for%20our%20team."
                className="block w-full text-center px-6 py-3 rounded-xl text-sm font-bold transition-all border-2"
                style={{ color: "#0D0D0D", borderColor: "rgba(13,13,13,0.15)" }}
              >
                Book a Demo
              </a>
              <p className="text-center text-xs mt-3" style={{ color: "rgba(13,13,13,0.35)" }}>
                We will walk your real workflow
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="py-8 border-t" style={{ borderColor: "rgba(13,13,13,0.08)" }}>
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/irontrack-app-icon.svg" alt="" className="w-5 h-5" />
            <span className="text-sm" style={{ color: "rgba(13,13,13,0.4)" }}>© 2026 IronTrack Development LLC</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4 text-xs md:text-sm">
            <Link href="/terms" style={{ color: "rgba(13,13,13,0.4)" }}>Terms</Link>
            <span style={{ color: "rgba(13,13,13,0.15)" }}>·</span>
            <Link href="/privacy" style={{ color: "rgba(13,13,13,0.4)" }}>Privacy</Link>
            <span style={{ color: "rgba(13,13,13,0.15)" }}>·</span>
            <Link href="/status" style={{ color: "rgba(13,13,13,0.4)" }}>Status</Link>
            <span style={{ color: "rgba(13,13,13,0.15)" }}>·</span>
            <Link href="/release-notes" style={{ color: "rgba(13,13,13,0.4)" }}>Release Notes</Link>
            <span style={{ color: "rgba(13,13,13,0.15)" }}>·</span>
            <a href="mailto:irontrackdevelopment@outlook.com" style={{ color: "rgba(13,13,13,0.4)" }}>Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
