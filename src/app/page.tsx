import Link from "next/link";
import {
  ArrowRight, CheckCircle, HardHat, Briefcase, Building2,
  Upload, Calendar, Target, QrCode, ClipboardList, GitBranch,
  Download, Share2, Camera, FileText, Shield, Zap, Users
} from "lucide-react";
import HeroVideo from "@/components/hero-video";
import MobileMenu from "@/components/MobileMenu";
import dynamic from "next/dynamic";

const IronTrackDemo = dynamic(() => import("@/components/IronTrackDemo"), { ssr: false });

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: "#F5F3EE" }}>
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
              <span className="hidden md:inline font-medium text-base ml-1.5" style={{ color: "rgba(13,13,13,0.4)" }}>Project Pulse</span>
            </span>
          </div>

          <MobileMenu />

          <nav className="hidden md:flex items-center gap-8">
            {["Features", "Who We Serve", "Integrations", "Pricing"].map((item) => (
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
            <Link
              href="/signup"
              className="text-sm px-5 py-2.5 rounded-xl font-bold text-white transition-colors"
              style={{ background: "#E85D1C" }}
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* ═══ HERO ═══ */}
      <section className="relative overflow-hidden">
        <HeroVideo />
        <div className="max-w-7xl mx-auto px-6 py-10 md:py-20">
          <div className="text-center max-w-4xl mx-auto">
            <p className="text-sm font-semibold uppercase tracking-widest mb-4" style={{ color: "#E85D1C", fontFamily: "monospace" }}>
              Construction Schedule Intelligence
            </p>
            <h1
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 leading-[0.95]"
              style={{ color: "#0D0D0D", letterSpacing: "-0.03em" }}
            >
              Run Your Job.<br />
              <em className="font-medium" style={{ color: "#E85D1C" }}>Don&apos;t Chase It.</em>
            </h1>
            <p className="text-lg md:text-xl leading-relaxed mb-10 max-w-2xl mx-auto" style={{ color: "rgba(13,13,13,0.55)" }}>
              Upload your project schedule. Get a 3-week lookahead, progress tracking, critical path reforecasting, and field reports — instantly. No training. No setup.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 px-7 py-4 text-white rounded-xl text-base font-bold transition-all shadow-lg"
                style={{ background: "#E85D1C", boxShadow: "0 8px 24px rgba(232,93,28,0.25)" }}
              >
                <HardHat className="w-5 h-5" />
                I&apos;m a General Contractor
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/signup/sub"
                className="inline-flex items-center gap-2 px-7 py-4 rounded-xl text-base font-bold transition-all border"
                style={{ color: "#0D0D0D", background: "white", borderColor: "rgba(13,13,13,0.12)" }}
              >
                <Briefcase className="w-5 h-5" />
                I&apos;m a Subcontractor
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ INTEGRATIONS BAR ═══ */}
      <section id="integrations" className="py-10 md:py-14 border-y" style={{ borderColor: "rgba(13,13,13,0.08)" }}>
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-center text-sm font-semibold uppercase tracking-widest mb-6" style={{ color: "rgba(13,13,13,0.35)", fontFamily: "monospace" }}>
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
                style={{ background: "white", borderColor: "rgba(13,13,13,0.08)" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={fmt.icon} alt={fmt.name} className="w-8 h-8 rounded-lg" />
                <div>
                  <div className="text-sm font-bold" style={{ color: "#0D0D0D" }}>{fmt.name}</div>
                  <div className="text-[10px] font-mono" style={{ color: "rgba(13,13,13,0.4)" }}>{fmt.ext}</div>
                </div>
                <CheckCircle className="w-4 h-4 ml-1" style={{ color: "#22C55E" }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FEATURES — PermitFlow Style ═══ */}
      <section id="features" className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold uppercase tracking-widest mb-4" style={{ color: "#E85D1C", fontFamily: "monospace" }}>
              Everything You Need
            </p>
            <h2 className="text-3xl md:text-5xl font-extrabold" style={{ color: "#0D0D0D", letterSpacing: "-0.03em" }}>
              Built for the field.<br />
              <em className="font-medium" style={{ color: "#E85D1C" }}>Not the office.</em>
            </h2>
          </div>

          <div className="space-y-16 md:space-y-24">
            {/* Feature 01 — 3-Week Lookahead */}
            <div className="grid md:grid-cols-2 gap-8 md:gap-16 items-center">
              <div>
                <div className="text-sm font-bold mb-2" style={{ color: "#E85D1C", fontFamily: "monospace" }}>[01]</div>
                <h3 className="text-2xl md:text-3xl font-extrabold mb-4" style={{ color: "#0D0D0D", letterSpacing: "-0.02em" }}>
                  3-Week Lookahead
                </h3>
                <p className="text-base leading-relaxed mb-6" style={{ color: "rgba(13,13,13,0.55)" }}>
                  Upload your schedule once. Instantly see today, tomorrow, and three weeks out — grouped by day, filterable by trade. Share any week via QR code. Your subs scan it, see their scope, no login required.
                </p>
                <div className="flex flex-wrap gap-2">
                  {["Day Plan", "Week View", "Trade Filters", "QR Sharing"].map((tag) => (
                    <span key={tag} className="text-xs font-semibold px-3 py-1 rounded-full border" style={{ color: "#E85D1C", borderColor: "rgba(232,93,28,0.3)", background: "rgba(232,93,28,0.06)" }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl p-6 border" style={{ background: "white", borderColor: "rgba(13,13,13,0.08)" }}>
                <div className="space-y-2">
                  {[
                    { icon: Calendar, task: "Install Structural Steel — Bldg A", pct: "85%", color: "#E85D1C" },
                    { icon: Calendar, task: "Rough-In Electrical — Tower 2", pct: "60%", color: "#3B82F6" },
                    { icon: Calendar, task: "Pour Foundation North Wing", pct: "100%", color: "#22C55E" },
                    { icon: Calendar, task: "Fire Sprinkler Rough-In — Bldg B", pct: "0%", color: "#6B7280" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl border" style={{ borderColor: "rgba(13,13,13,0.06)" }}>
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ background: item.color }} />
                      <span className="text-sm flex-1 truncate" style={{ color: "#0D0D0D" }}>{item.task}</span>
                      <span className="text-xs font-bold" style={{ color: item.color }}>{item.pct}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-4 pt-3 border-t" style={{ borderColor: "rgba(13,13,13,0.06)" }}>
                  <QrCode className="w-4 h-4" style={{ color: "#E85D1C" }} />
                  <span className="text-xs font-semibold" style={{ color: "rgba(13,13,13,0.4)" }}>Share this week via QR code</span>
                </div>
              </div>
            </div>

            {/* Feature 02 — Schedule Reforecast */}
            <div className="grid md:grid-cols-2 gap-8 md:gap-16 items-center">
              <div className="order-2 md:order-1 rounded-2xl p-6 border" style={{ background: "white", borderColor: "rgba(13,13,13,0.08)" }}>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="rounded-xl p-3 border" style={{ borderColor: "rgba(13,13,13,0.06)" }}>
                    <div className="text-[10px] uppercase tracking-wide mb-1" style={{ color: "rgba(13,13,13,0.35)" }}>Forecast Delta</div>
                    <div className="text-xl font-extrabold" style={{ color: "#DC2626" }}>+5d Late</div>
                  </div>
                  <div className="rounded-xl p-3 border" style={{ borderColor: "rgba(13,13,13,0.06)" }}>
                    <div className="text-[10px] uppercase tracking-wide mb-1" style={{ color: "rgba(13,13,13,0.35)" }}>Critical Path</div>
                    <div className="text-xl font-extrabold" style={{ color: "#DC2626" }}>8 tasks</div>
                  </div>
                  <div className="rounded-xl p-3 border" style={{ borderColor: "rgba(13,13,13,0.06)" }}>
                    <div className="text-[10px] uppercase tracking-wide mb-1" style={{ color: "rgba(13,13,13,0.35)" }}>Completion</div>
                    <div className="text-xl font-extrabold" style={{ color: "#22C55E" }}>64%</div>
                  </div>
                  <div className="rounded-xl p-3 border" style={{ borderColor: "rgba(13,13,13,0.06)" }}>
                    <div className="text-[10px] uppercase tracking-wide mb-1" style={{ color: "rgba(13,13,13,0.35)" }}>At Risk</div>
                    <div className="text-xl font-extrabold" style={{ color: "#EAB308" }}>3 tasks</div>
                  </div>
                </div>
                <div className="rounded-xl p-3 border" style={{ borderColor: "rgba(232,93,28,0.2)", background: "rgba(232,93,28,0.04)" }}>
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="w-3.5 h-3.5" style={{ color: "#E85D1C" }} />
                    <span className="text-[10px] font-bold uppercase" style={{ color: "#E85D1C" }}>Recovery Action</span>
                  </div>
                  <p className="text-xs" style={{ color: "rgba(13,13,13,0.6)" }}>
                    Increase crew size on "Structural Steel" to recover 3 days on critical path
                  </p>
                </div>
              </div>
              <div className="order-1 md:order-2">
                <div className="text-sm font-bold mb-2" style={{ color: "#E85D1C", fontFamily: "monospace" }}>[02]</div>
                <h3 className="text-2xl md:text-3xl font-extrabold mb-4" style={{ color: "#0D0D0D", letterSpacing: "-0.02em" }}>
                  Schedule Reforecast
                </h3>
                <p className="text-base leading-relaxed mb-6" style={{ color: "rgba(13,13,13,0.55)" }}>
                  Update progress in the field — the engine recalculates your entire schedule in seconds. Critical path, float, forecast finish date, risk flags, and recovery actions. Pure math, zero AI. Results you can trust and defend.
                </p>
                <div className="flex flex-wrap gap-2">
                  {["Critical Path", "Float Calc", "Recovery Actions", "MSPDI Export"].map((tag) => (
                    <span key={tag} className="text-xs font-semibold px-3 py-1 rounded-full border" style={{ color: "#E85D1C", borderColor: "rgba(232,93,28,0.3)", background: "rgba(232,93,28,0.06)" }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Feature 03 — Issue Reports */}
            <div className="grid md:grid-cols-2 gap-8 md:gap-16 items-center">
              <div>
                <div className="text-sm font-bold mb-2" style={{ color: "#E85D1C", fontFamily: "monospace" }}>[03]</div>
                <h3 className="text-2xl md:text-3xl font-extrabold mb-4" style={{ color: "#0D0D0D", letterSpacing: "-0.02em" }}>
                  Field Issue Reports
                </h3>
                <p className="text-base leading-relaxed mb-6" style={{ color: "rgba(13,13,13,0.55)" }}>
                  Walk the job, snap photos, tag the issue to a schedule item, and generate a professional PDF — all from your phone. Share it instantly with the native share sheet. Every report is saved to project history.
                </p>
                <div className="flex flex-wrap gap-2">
                  {["Photo Capture", "PDF Generation", "Priority Tagging", "Share Link"].map((tag) => (
                    <span key={tag} className="text-xs font-semibold px-3 py-1 rounded-full border" style={{ color: "#E85D1C", borderColor: "rgba(232,93,28,0.3)", background: "rgba(232,93,28,0.06)" }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl p-6 border" style={{ background: "white", borderColor: "rgba(13,13,13,0.08)" }}>
                <div className="rounded-xl overflow-hidden border mb-3" style={{ borderColor: "rgba(13,13,13,0.06)" }}>
                  <div className="px-4 py-2.5" style={{ background: "#1e3a5f" }}>
                    <span className="text-xs font-bold text-white uppercase tracking-wider">Issue Report</span>
                    <span className="text-[10px] ml-2" style={{ color: "#93c5fd" }}>IR-003</span>
                  </div>
                  <div className="px-4 py-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <Camera className="w-3.5 h-3.5" style={{ color: "#E85D1C" }} />
                      <span className="text-xs" style={{ color: "#0D0D0D" }}>3 photos attached</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded text-white" style={{ background: "#DC2626" }}>High</span>
                      <span className="text-xs" style={{ color: "#0D0D0D" }}>Missing backing for grab bars — Corridor 2</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded text-white" style={{ background: "#D97706" }}>Medium</span>
                      <span className="text-xs" style={{ color: "#0D0D0D" }}>Electrical box misaligned — Room 102</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Share2 className="w-3.5 h-3.5" style={{ color: "#E85D1C" }} />
                  <span className="text-xs" style={{ color: "rgba(13,13,13,0.4)" }}>Share report via link or print to PDF</span>
                </div>
              </div>
            </div>

            {/* Feature 04 — Ready Check */}
            <div className="grid md:grid-cols-2 gap-8 md:gap-16 items-center">
              <div className="order-2 md:order-1 rounded-2xl p-6 border" style={{ background: "white", borderColor: "rgba(13,13,13,0.08)" }}>
                <div className="space-y-3">
                  <div className="rounded-xl px-4 py-3 border" style={{ borderColor: "rgba(13,13,13,0.06)" }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold" style={{ color: "#0D0D0D" }}>ATS Electric</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ color: "#22C55E", background: "rgba(34,197,94,0.1)" }}>Confirmed ✓</span>
                    </div>
                    <span className="text-[11px]" style={{ color: "rgba(13,13,13,0.4)" }}>Rough-In Electrical — Mon Apr 21</span>
                  </div>
                  <div className="rounded-xl px-4 py-3 border" style={{ borderColor: "rgba(13,13,13,0.06)" }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold" style={{ color: "#0D0D0D" }}>Buildtek Framing</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ color: "#EAB308", background: "rgba(234,179,8,0.1)" }}>Awaiting</span>
                    </div>
                    <span className="text-[11px]" style={{ color: "rgba(13,13,13,0.4)" }}>Exterior Framing Bldg B — Tue Apr 22</span>
                  </div>
                  <div className="rounded-xl px-4 py-3 border" style={{ borderColor: "rgba(232,93,28,0.2)", background: "rgba(232,93,28,0.03)" }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold" style={{ color: "#0D0D0D" }}>AMS Fire Protection</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ color: "#EF4444", background: "rgba(239,68,68,0.1)" }}>Issue Flagged</span>
                    </div>
                    <span className="text-[11px]" style={{ color: "rgba(13,13,13,0.4)" }}>Sprinkler install delayed — material lead time</span>
                  </div>
                </div>
              </div>
              <div className="order-1 md:order-2">
                <div className="text-sm font-bold mb-2" style={{ color: "#E85D1C", fontFamily: "monospace" }}>[04]</div>
                <h3 className="text-2xl md:text-3xl font-extrabold mb-4" style={{ color: "#0D0D0D", letterSpacing: "-0.02em" }}>
                  Ready Check
                </h3>
                <p className="text-base leading-relaxed mb-6" style={{ color: "rgba(13,13,13,0.55)" }}>
                  Tap any activity, send a ready-check to the sub. They confirm they&apos;re mobilizing — or flag an issue before it becomes a problem. Track status on every upcoming task. No more chasing phone calls.
                </p>
                <div className="flex flex-wrap gap-2">
                  {["SMS / Email", "Status Tracking", "Follow-Up", "Issue Flags"].map((tag) => (
                    <span key={tag} className="text-xs font-semibold px-3 py-1 rounded-full border" style={{ color: "#E85D1C", borderColor: "rgba(232,93,28,0.3)", background: "rgba(232,93,28,0.06)" }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Feature 05 — Sub Portal */}
            <div className="grid md:grid-cols-2 gap-8 md:gap-16 items-center">
              <div>
                <div className="text-sm font-bold mb-2" style={{ color: "#E85D1C", fontFamily: "monospace" }}>[05]</div>
                <h3 className="text-2xl md:text-3xl font-extrabold mb-4" style={{ color: "#0D0D0D", letterSpacing: "-0.02em" }}>
                  Sub Portal & QR Sharing
                </h3>
                <p className="text-base leading-relaxed mb-6" style={{ color: "rgba(13,13,13,0.55)" }}>
                  Give every sub their own filtered view — only their trades, only their scope. Generate a QR code for any week&apos;s lookahead and post it in the job trailer. Subs scan, see their schedule, acknowledge. Zero friction.
                </p>
                <div className="flex flex-wrap gap-2">
                  {["Trade Filtering", "QR Codes", "No Login Required", "View Tracking"].map((tag) => (
                    <span key={tag} className="text-xs font-semibold px-3 py-1 rounded-full border" style={{ color: "#E85D1C", borderColor: "rgba(232,93,28,0.3)", background: "rgba(232,93,28,0.06)" }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl p-6 border" style={{ background: "white", borderColor: "rgba(13,13,13,0.08)" }}>
                <div className="flex items-center justify-center mb-4">
                  <div className="w-32 h-32 rounded-2xl flex items-center justify-center" style={{ background: "#E85D1C" }}>
                    <QrCode className="w-16 h-16 text-white" />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold" style={{ color: "#0D0D0D" }}>Week 1 Lookahead</p>
                  <p className="text-[11px] mt-1" style={{ color: "rgba(13,13,13,0.4)" }}>
                    Scan to view schedule · No login required · Expires in 7 days
                  </p>
                </div>
              </div>
            </div>

            {/* Feature 06 — MSPDI Export */}
            <div className="grid md:grid-cols-2 gap-8 md:gap-16 items-center">
              <div className="order-2 md:order-1 rounded-2xl p-6 border" style={{ background: "white", borderColor: "rgba(13,13,13,0.08)" }}>
                <div className="flex items-center justify-center gap-8 py-4">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-2 border" style={{ borderColor: "rgba(13,13,13,0.08)" }}>
                      <span className="text-2xl">📊</span>
                    </div>
                    <span className="text-[10px] font-bold" style={{ color: "rgba(13,13,13,0.5)" }}>MS Project</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <ArrowRight className="w-4 h-4" style={{ color: "rgba(13,13,13,0.2)" }} />
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "#E85D1C" }}>
                      <svg viewBox="0 0 100 100" fill="none" className="w-6 h-6">
                        <polyline points="10,50 28,50 34,30 42,70 50,20 58,75 64,50 82,50 88,40 92,50" stroke="#F5F3EE" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                      </svg>
                    </div>
                    <ArrowRight className="w-4 h-4" style={{ color: "rgba(13,13,13,0.2)" }} />
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-2 border" style={{ borderColor: "rgba(13,13,13,0.08)" }}>
                      <span className="text-2xl">📋</span>
                    </div>
                    <span className="text-[10px] font-bold" style={{ color: "rgba(13,13,13,0.5)" }}>Primavera P6</span>
                  </div>
                </div>
                <div className="text-center mt-2">
                  <p className="text-xs" style={{ color: "rgba(13,13,13,0.4)" }}>Import → Reforecast → Export MSPDI XML</p>
                </div>
              </div>
              <div className="order-1 md:order-2">
                <div className="text-sm font-bold mb-2" style={{ color: "#E85D1C", fontFamily: "monospace" }}>[06]</div>
                <h3 className="text-2xl md:text-3xl font-extrabold mb-4" style={{ color: "#0D0D0D", letterSpacing: "-0.02em" }}>
                  MSPDI Export
                </h3>
                <p className="text-base leading-relaxed mb-6" style={{ color: "rgba(13,13,13,0.55)" }}>
                  Update progress in the field, reforecast, then export the updated schedule as MSPDI XML — compatible with both Microsoft Project and Primavera P6. Close the loop between field and office without touching a desktop app.
                </p>
                <div className="flex flex-wrap gap-2">
                  {["MS Project Compatible", "P6 Compatible", "One-Click Export", "Field Updates"].map((tag) => (
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
              Built by <em className="font-medium" style={{ color: "#E85D1C" }}>field operators</em>.<br />
              For field operators.
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: HardHat,
                title: "Superintendents",
                desc: "You run the job. You need to know what's happening today, what's at risk, and what's about to blow up — before it does. Pulse gives you that in 30 seconds.",
              },
              {
                icon: Briefcase,
                title: "Project Managers",
                desc: "You own the schedule, the budget, and the client relationship. Pulse gives you executive snapshots, risk detection, and milestone tracking without digging through spreadsheets.",
              },
              {
                icon: Building2,
                title: "General Contractors",
                desc: "You need every project visible and every risk flagged. Pulse gives your entire team a shared operating picture — upload once, everyone's aligned.",
              },
            ].map((persona) => (
              <div
                key={persona.title}
                className="rounded-2xl p-6 md:p-8 border transition-all"
                style={{ background: "white", borderColor: "rgba(13,13,13,0.08)" }}
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
        <div className="max-w-md mx-auto px-6">
          <div className="text-center mb-10">
            <p className="text-sm font-semibold uppercase tracking-widest mb-4" style={{ color: "#E85D1C", fontFamily: "monospace" }}>
              Pricing
            </p>
            <h2 className="text-3xl md:text-4xl font-extrabold" style={{ color: "#0D0D0D", letterSpacing: "-0.03em" }}>
              One plan. Everything included.
            </h2>
          </div>
          <div className="rounded-2xl p-8 md:p-10 border-2" style={{ background: "white", borderColor: "#E85D1C" }}>
            <div className="text-center mb-8">
              <div className="text-5xl font-extrabold" style={{ color: "#0D0D0D" }}>
                $19.99<span className="text-2xl font-medium" style={{ color: "rgba(13,13,13,0.35)" }}>/mo</span>
              </div>
            </div>
            <ul className="space-y-3 mb-8">
              {[
                "All file formats — MPP, XLSX, CSV, XML, XER",
                "3-week lookahead + milestones + progress",
                "Schedule reforecast engine",
                "Field issue reports with photos",
                "Ready Check sub communication",
                "QR code week sharing",
                "MSPDI export for MS Project / P6",
                "Up to 50 projects per month",
                "Desktop and mobile",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "#22C55E" }} />
                  <span className="text-sm" style={{ color: "#0D0D0D" }}>{item}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/signup"
              className="block w-full text-center px-8 py-4 text-white rounded-xl text-lg font-bold transition-all"
              style={{ background: "#E85D1C" }}
            >
              Get Started
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ INTERACTIVE DEMO ═══ */}
      <section className="border-t" style={{ borderColor: "rgba(13,13,13,0.08)", background: "#0A0A0C" }}>
        <div className="max-w-7xl mx-auto">
          <IronTrackDemo />
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
