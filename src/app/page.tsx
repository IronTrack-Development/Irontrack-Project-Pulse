import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  ArrowRight,
  ArrowRightLeft,
  BarChart3,
  BookOpen,
  Briefcase,
  Building2,
  Calendar,
  Camera,
  CheckCircle,
  ClipboardCheck,
  Globe,
  HardHat,
  QrCode,
  Send,
  Shield,
  Truck,
  Users,
} from "lucide-react";
import MobileMenu from "@/components/MobileMenu";

type IconCard = {
  title: string;
  body: string;
  icon: LucideIcon;
};

const accent = "#E85D1C";
const subBlue = "#3B82F6";
const ink = "#0D0D0D";
const paper = "#F5F3EE";

const dailyLoop: IconCard[] = [
  {
    title: "Dispatch",
    body: "Send every crew out with job, scope, safety focus, material notes, and foreman ownership.",
    icon: Send,
  },
  {
    title: "Check-In",
    body: "Foremen confirm arrival, manpower, conditions, photos, and the plan before the day gets away.",
    icon: ClipboardCheck,
  },
  {
    title: "Production",
    body: "Capture quantities, percent complete, photos, and notes while the work is still fresh.",
    icon: BarChart3,
  },
  {
    title: "Blockers",
    body: "Turn caveats, access issues, missing material, and RFIs into clean GC-facing action.",
    icon: AlertTriangle,
  },
  {
    title: "Handoffs",
    body: "Move context from crew to crew so rough-in, trim, startup, and controls do not restart from zero.",
    icon: ArrowRightLeft,
  },
];

const portalFeatures: IconCard[] = [
  {
    title: "Foreman command center",
    body: "A mobile-first dashboard for today's work, open blockers, pending handoffs, and crew updates.",
    icon: HardHat,
  },
  {
    title: "Crew and manpower tracking",
    body: "Track foremen, journeymen, apprentices, and where each crew is supposed to be working.",
    icon: Users,
  },
  {
    title: "SOP library",
    body: "Keep install standards, safety procedures, and company playbooks in one place with read tracking.",
    icon: BookOpen,
  },
  {
    title: "Bilingual field UX",
    body: "English office schedules can drive Spanish-friendly crew communication in the field.",
    icon: Globe,
  },
  {
    title: "Photo-first proof",
    body: "Attach photos to check-ins, production, blockers, and handoffs so the office sees the real condition.",
    icon: Camera,
  },
  {
    title: "GC-ready visibility",
    body: "Share clean updates without exposing private schedule logic, float, or internal company noise.",
    icon: Shield,
  },
];

const gcLayer = [
  "Ready-check confirmations by trade",
  "QR and token links for scope-only views",
  "Schedule imports from MPP, XER, XLSX, CSV, and XML",
  "Daily logs, reports, inspections, RFIs, submittals, punch, and T&M",
];

const heroUpdates: Array<{
  time: string;
  title: string;
  body: string;
  icon: LucideIcon;
  color: string;
}> = [
  { time: "06:10", title: "Dispatch sent", body: "Crew B -> Level 2 rough-in, panels confirmed", icon: Truck, color: subBlue },
  { time: "07:32", title: "Check-in complete", body: "5 workers on site, access clear, 3 photos", icon: ClipboardCheck, color: "#22C55E" },
  { time: "12:18", title: "Blocker raised", body: "Ceiling grid not released in Corridor B", icon: AlertTriangle, color: accent },
  { time: "15:44", title: "Handoff ready", body: "Trim crew has notes, photos, and open items", icon: ArrowRightLeft, color: "#A855F7" },
];

const subPlanFeatures = [
  "Sub Ops dashboard",
  "Morning dispatch board",
  "Foreman and crew management",
  "Daily check-ins with photos",
  "Production tracking",
  "Blocker reporting",
  "SOP library",
  "Handoff tracker",
  "Light/dark mode and Spanish",
];

const gcPlanFeatures = [
  "GC schedule intelligence",
  "3-week lookahead and reforecasting",
  "Ready Check and QR schedule sharing",
  "Daily logs, reports, inspections, punch, and T&M",
  "Submittals, RFIs with AI drafting, and drawings",
  "Unlimited invited subs and foremen",
];

export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: paper }}>
      <header className="sticky top-0 z-50 border-b" style={{ background: "rgba(245,243,238,0.96)", borderColor: "rgba(13,13,13,0.08)" }}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6 md:py-4">
          <Link href="/" className="flex items-center gap-2 md:gap-3">
            <img src="/irontrack-app-icon.svg" alt="IronTrack" className="h-9 w-auto md:h-11" />
            <span className="text-lg font-extrabold tracking-tight md:text-xl" style={{ color: ink, letterSpacing: "-0.03em" }}>
              Iron<span style={{ color: accent }}>Track</span>
              <span className="ml-1.5 hidden text-base font-medium md:inline" style={{ color: "rgba(13,13,13,0.45)" }}>
                Subcontractor Portal
              </span>
            </span>
          </Link>

          <MobileMenu />

          <nav className="hidden items-center gap-8 md:flex">
            {[
              ["Platform", "#platform"],
              ["Daily Loop", "#daily-loop"],
              ["Features", "#features"],
              ["Pricing", "#pricing"],
            ].map(([label, href]) => (
              <a
                key={label}
                href={href}
                className="text-sm font-medium transition-colors hover:text-[#0D0D0D]"
                style={{ color: "rgba(13,13,13,0.55)" }}
              >
                {label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/login/sub" className="hidden text-sm font-medium transition-colors sm:block" style={{ color: "rgba(13,13,13,0.55)" }}>
              Sub sign in
            </Link>
            <a
              href="mailto:irontrackdevelopment@outlook.com?subject=IronTrack%20Sub%20Portal%20Demo&body=I%27d%20like%20to%20book%20a%20demo%20of%20the%20IronTrack%20subcontractor%20portal."
              className="rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-colors"
              style={{ background: subBlue }}
            >
              Book Demo
            </a>
          </div>
        </div>
      </header>

      <main>
        <section id="platform" className="relative overflow-hidden">
          <div className="absolute left-1/2 top-20 h-72 w-72 -translate-x-1/2 rounded-full blur-3xl" style={{ background: "rgba(59,130,246,0.16)" }} />
          <div className="relative mx-auto grid max-w-7xl gap-12 px-6 pb-14 pt-16 md:grid-cols-[1.02fr_0.98fr] md:pb-24 md:pt-24 lg:gap-16">
            <div className="flex flex-col justify-center">
              <p className="mb-4 text-sm font-semibold uppercase tracking-widest" style={{ color: subBlue, fontFamily: "monospace" }}>
                Subcontractor Field Portal
              </p>
              <h1 className="mb-6 text-4xl font-extrabold leading-[0.95] sm:text-5xl md:text-6xl lg:text-7xl" style={{ color: ink, letterSpacing: "-0.04em" }}>
                Run every crew from <em className="font-medium" style={{ color: accent }}>dispatch to handoff.</em>
              </h1>
              <p className="mb-8 max-w-2xl text-lg leading-relaxed md:text-xl" style={{ color: "rgba(13,13,13,0.62)" }}>
                IronTrack Pulse is the subcontractor command center for morning dispatch, field check-ins, production, blockers, SOPs, and crew-to-crew handoffs. Your team gets a daily operating rhythm, and the GC gets cleaner visibility.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/signup/sub"
                  className="inline-flex items-center justify-center gap-2 rounded-xl px-7 py-4 text-base font-bold text-white shadow-lg transition-all"
                  style={{ background: subBlue, boxShadow: "0 12px 28px rgba(59,130,246,0.22)" }}
                >
                  Start Sub Portal
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <a
                  href="mailto:irontrackdevelopment@outlook.com?subject=IronTrack%20Sub%20Portal%20Walkthrough&body=I%27d%20like%20to%20walk%20through%20IronTrack%20for%20our%20subcontractor%20field%20workflow."
                  className="inline-flex items-center justify-center gap-2 rounded-xl border px-7 py-4 text-base font-bold transition-all"
                  style={{ color: ink, background: "white", borderColor: "rgba(13,13,13,0.12)" }}
                >
                  <Calendar className="h-5 w-5" />
                  Book a Walkthrough
                </a>
              </div>
              <div className="mt-7 flex flex-wrap items-center gap-3 text-sm" style={{ color: "rgba(13,13,13,0.5)" }}>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle className="h-4 w-4" style={{ color: "#22C55E" }} />
                  $10/mo beta sub plan
                </span>
                <span className="hidden h-1 w-1 rounded-full sm:inline-block" style={{ background: "rgba(13,13,13,0.25)" }} />
                <span>Mobile-first for foremen and crews</span>
                <span className="hidden h-1 w-1 rounded-full sm:inline-block" style={{ background: "rgba(13,13,13,0.25)" }} />
                <span>GC coordination layer available</span>
              </div>
            </div>

            <div className="rounded-[2rem] border p-4 shadow-2xl" style={{ background: ink, borderColor: "rgba(13,13,13,0.1)", boxShadow: "0 26px 80px rgba(13,13,13,0.18)" }}>
              <div className="rounded-[1.4rem] border p-4" style={{ background: "linear-gradient(145deg, rgba(59,130,246,0.16), rgba(255,255,255,0.06))", borderColor: "rgba(255,255,255,0.1)" }}>
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: "#93C5FD" }}>Today&apos;s Loop</p>
                    <h2 className="mt-1 text-2xl font-black text-white">Summit Electrical</h2>
                  </div>
                  <span className="rounded-full px-3 py-1 text-xs font-bold" style={{ background: "rgba(34,197,94,0.14)", color: "#86EFAC" }}>
                    Live
                  </span>
                </div>

                <div className="space-y-3">
                  {heroUpdates.map(({ time, title, body, icon: Icon, color }) => (
                    <div key={title} className="rounded-2xl border p-4" style={{ background: "rgba(255,255,255,0.07)", borderColor: "rgba(255,255,255,0.1)" }}>
                      <div className="flex items-start gap-3">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl" style={{ background: `${color}22`, color }}>
                          <Icon className="h-5 w-5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-3">
                            <h3 className="font-bold text-white">{title}</h3>
                            <span className="text-xs font-mono" style={{ color: "rgba(255,255,255,0.42)" }}>{time}</span>
                          </div>
                          <p className="mt-1 text-sm leading-6" style={{ color: "rgba(255,255,255,0.65)" }}>{body}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3">
                  {[
                    ["6", "Crews out"],
                    ["340 LF", "Installed"],
                    ["1", "GC decision"],
                  ].map(([value, label]) => (
                    <div key={label} className="rounded-2xl border p-3 text-center" style={{ background: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.1)" }}>
                      <p className="text-xl font-black text-white">{value}</p>
                      <p className="mt-1 text-[10px] uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.45)" }}>{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y py-10 md:py-14" style={{ borderColor: "rgba(13,13,13,0.08)", background: "white" }}>
          <div className="mx-auto grid max-w-7xl gap-4 px-6 md:grid-cols-4">
            {[
              ["Built for subs", "Dispatch, manpower, SOPs, blockers, and handoffs are first-class workflows."],
              ["Field-friendly", "Large touch targets, fast updates, photos, Spanish support, and light/dark modes."],
              ["GC-useful", "Give the GC clear status and blockers without handing over internal noise."],
              ["Schedule-aware", "Tie updates to real activities and lookaheads when a GC schedule is connected."],
            ].map(([title, body]) => (
              <div key={title} className="rounded-2xl border p-5" style={{ borderColor: "rgba(13,13,13,0.08)", background: paper }}>
                <h3 className="font-extrabold" style={{ color: ink }}>{title}</h3>
                <p className="mt-2 text-sm leading-6" style={{ color: "rgba(13,13,13,0.55)" }}>{body}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="daily-loop" className="py-16 md:py-24">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mx-auto mb-14 max-w-3xl text-center">
              <p className="mb-4 text-sm font-semibold uppercase tracking-widest" style={{ color: accent, fontFamily: "monospace" }}>
                The Daily Loop
              </p>
              <h2 className="text-3xl font-extrabold md:text-5xl" style={{ color: ink, letterSpacing: "-0.03em" }}>
                One rhythm for every crew, foreman, and handoff.
              </h2>
              <p className="mt-5 text-base leading-7 md:text-lg" style={{ color: "rgba(13,13,13,0.58)" }}>
                IronTrack replaces scattered texts, legal pads, and end-of-day memory with a repeatable loop that keeps field context moving.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-5">
              {dailyLoop.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div key={step.title} className="relative rounded-2xl border p-5 shadow-sm" style={{ background: "white", borderColor: "rgba(13,13,13,0.08)" }}>
                    <span className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: index === 3 ? "rgba(232,93,28,0.1)" : "rgba(59,130,246,0.1)", color: index === 3 ? accent : subBlue }}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="mb-2 text-xs font-bold uppercase tracking-widest" style={{ color: "rgba(13,13,13,0.35)", fontFamily: "monospace" }}>
                      0{index + 1}
                    </div>
                    <h3 className="text-lg font-extrabold" style={{ color: ink }}>{step.title}</h3>
                    <p className="mt-3 text-sm leading-6" style={{ color: "rgba(13,13,13,0.55)" }}>{step.body}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section id="features" className="border-y py-16 md:py-24" style={{ background: ink, borderColor: "rgba(13,13,13,0.08)" }}>
          <div className="mx-auto max-w-7xl px-6">
            <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
              <div>
                <p className="mb-4 text-sm font-semibold uppercase tracking-widest" style={{ color: "#93C5FD", fontFamily: "monospace" }}>
                  Portal Features
                </p>
                <h2 className="text-3xl font-extrabold leading-tight text-white md:text-5xl" style={{ letterSpacing: "-0.03em" }}>
                  The subcontractor side is the product, not an afterthought.
                </h2>
                <p className="mt-5 text-base leading-7 md:text-lg" style={{ color: "rgba(255,255,255,0.65)" }}>
                  Most platforms invite subs into someone else&apos;s system. IronTrack gives subs their own operating layer first, then turns the cleanest field signal into GC-ready intelligence.
                </p>
                <Link
                  href="/sub/preview"
                  className="mt-7 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white"
                  style={{ background: accent }}
                >
                  Preview the portal
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {portalFeatures.map((feature) => {
                  const Icon = feature.icon;
                  return (
                    <div key={feature.title} className="rounded-2xl border p-5" style={{ background: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.1)" }}>
                      <Icon className="mb-4 h-6 w-6" style={{ color: subBlue }} />
                      <h3 className="font-extrabold text-white">{feature.title}</h3>
                      <p className="mt-3 text-sm leading-6" style={{ color: "rgba(255,255,255,0.62)" }}>{feature.body}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section id="gc-layer" className="py-16 md:py-24">
          <div className="mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-2 lg:items-center">
            <div className="rounded-[1.75rem] border p-6 shadow-sm" style={{ background: "white", borderColor: "rgba(13,13,13,0.08)" }}>
              <div className="mb-5 flex items-center justify-between rounded-2xl p-4" style={{ background: paper }}>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "rgba(13,13,13,0.38)", fontFamily: "monospace" }}>GC View</p>
                  <h3 className="mt-1 text-xl font-black" style={{ color: ink }}>Clean field signal</h3>
                </div>
                <QrCode className="h-9 w-9" style={{ color: accent }} />
              </div>
              <div className="space-y-3">
                {[
                  ["Ready", "AMS Mechanical confirmed 6 workers for Monday."],
                  ["Blocked", "ATS Electric needs ceiling grid released before trim."],
                  ["Complete", "Buildtek uploaded 14 handoff photos for Area C."],
                ].map(([status, body]) => (
                  <div key={status} className="flex items-start gap-3 rounded-2xl border p-4" style={{ borderColor: "rgba(13,13,13,0.08)" }}>
                    <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: status === "Blocked" ? accent : "#22C55E" }} />
                    <div>
                      <p className="font-bold" style={{ color: ink }}>{status}</p>
                      <p className="mt-1 text-sm" style={{ color: "rgba(13,13,13,0.55)" }}>{body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-4 text-sm font-semibold uppercase tracking-widest" style={{ color: accent, fontFamily: "monospace" }}>
                Still GC-Useful
              </p>
              <h2 className="text-3xl font-extrabold md:text-5xl" style={{ color: ink, letterSpacing: "-0.03em" }}>
                Subs get control. GCs get fewer surprises.
              </h2>
              <p className="mt-5 text-base leading-7 md:text-lg" style={{ color: "rgba(13,13,13,0.58)" }}>
                IronTrack can still serve general contractors with schedule intelligence, ready checks, QR links, and project documentation. The difference is that the subcontractor portal now leads the workflow.
              </p>
              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                {gcLayer.map((item) => (
                  <div key={item} className="flex items-start gap-2 rounded-xl border p-3" style={{ background: "white", borderColor: "rgba(13,13,13,0.08)" }}>
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "#22C55E" }} />
                    <span className="text-sm font-medium" style={{ color: ink }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="who-we-serve" className="border-y py-16 md:py-24" style={{ borderColor: "rgba(13,13,13,0.08)", background: "white" }}>
          <div className="mx-auto max-w-7xl px-6">
            <div className="mb-12 text-center">
              <p className="mb-4 text-sm font-semibold uppercase tracking-widest" style={{ color: accent, fontFamily: "monospace" }}>
                Who It Is For
              </p>
              <h2 className="text-3xl font-extrabold md:text-5xl" style={{ color: ink, letterSpacing: "-0.03em" }}>
                Built around subcontractor operations.
              </h2>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {[
                {
                  icon: Briefcase,
                  title: "Subcontractor owners",
                  body: "See where crews are, what got done, what is blocked, and what handoffs need attention across every job.",
                },
                {
                  icon: HardHat,
                  title: "Foremen and field leaders",
                  body: "Update check-ins, production, photos, and blockers from a phone without digging through office software.",
                },
                {
                  icon: Building2,
                  title: "GC partners",
                  body: "Receive cleaner readiness, blocker, and production signals from subs without forcing them into a heavy process.",
                },
              ].map((persona) => {
                const Icon = persona.icon;
                return (
                  <div key={persona.title} className="rounded-2xl border p-7" style={{ background: paper, borderColor: persona.title.startsWith("Subcontractor") ? "rgba(59,130,246,0.25)" : "rgba(13,13,13,0.08)" }}>
                    <span className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: persona.title.startsWith("Subcontractor") ? "rgba(59,130,246,0.1)" : "rgba(232,93,28,0.1)", color: persona.title.startsWith("Subcontractor") ? subBlue : accent }}>
                      <Icon className="h-6 w-6" />
                    </span>
                    <h3 className="text-xl font-extrabold" style={{ color: ink }}>{persona.title}</h3>
                    <p className="mt-3 text-sm leading-6" style={{ color: "rgba(13,13,13,0.55)" }}>{persona.body}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section id="pricing" className="py-16 md:py-24">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mb-10 text-center">
              <p className="mb-4 text-sm font-semibold uppercase tracking-widest" style={{ color: accent, fontFamily: "monospace" }}>
                Founder Pricing
              </p>
              <h2 className="text-3xl font-extrabold md:text-4xl" style={{ color: ink, letterSpacing: "-0.03em" }}>
                Start with the subcontractor portal.
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-base leading-7" style={{ color: "rgba(13,13,13,0.55)" }}>
                Keep the sub product simple. Add the GC coordination layer when you need schedule imports, documentation, and broader project controls.
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <PricingCard
                title="Subcontractor"
                price="$10"
                note="Beta pricing per company"
                icon={Briefcase}
                iconColor={subBlue}
                borderColor={subBlue}
                featured
                features={subPlanFeatures}
                ctaHref="/signup/sub"
                ctaLabel="Start Sub Portal"
              />
              <PricingCard
                title="General Contractor"
                price="$19.99"
                note="Founder beta pricing"
                icon={HardHat}
                iconColor={accent}
                borderColor="rgba(13,13,13,0.12)"
                features={gcPlanFeatures}
                ctaHref="/signup"
                ctaLabel="Start GC Plan"
              />
              <div className="flex flex-col rounded-2xl border p-8" style={{ background: "white", borderColor: "rgba(13,13,13,0.12)" }}>
                <div className="mb-6 text-center">
                  <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: "rgba(13,13,13,0.05)", color: ink }}>
                    <Building2 className="h-6 w-6" />
                  </span>
                  <h3 className="text-lg font-extrabold" style={{ color: ink }}>Enterprise</h3>
                  <div className="mt-1 text-3xl font-extrabold" style={{ color: ink }}>Custom</div>
                  <p className="mt-1 text-xs" style={{ color: "rgba(13,13,13,0.4)" }}>For multi-crew and multi-project firms</p>
                </div>
                <ul className="mb-6 flex-1 space-y-2.5">
                  {["Multi-company rollouts", "Custom onboarding and training", "Priority support", "Custom report templates", "Volume pricing"].map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "rgba(13,13,13,0.25)" }} />
                      <span className="text-sm" style={{ color: "rgba(13,13,13,0.55)" }}>{feature}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href="mailto:irontrackdevelopment@outlook.com?subject=IronTrack%20Enterprise%20Portal%20Demo&body=I%27d%20like%20to%20schedule%20a%20demo%20of%20IronTrack%20Pulse%20for%20our%20field%20team."
                  className="block rounded-xl border-2 px-6 py-3 text-center text-sm font-bold transition-all"
                  style={{ color: ink, borderColor: "rgba(13,13,13,0.15)" }}
                >
                  Book a Demo
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-8" style={{ borderColor: "rgba(13,13,13,0.08)" }}>
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 md:flex-row">
          <div className="flex items-center gap-2">
            <img src="/irontrack-app-icon.svg" alt="" className="h-5 w-5" />
            <span className="text-sm" style={{ color: "rgba(13,13,13,0.4)" }}>© 2026 IronTrack Development LLC</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs md:gap-4 md:text-sm">
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

function PricingCard({
  title,
  price,
  note,
  icon: Icon,
  iconColor,
  borderColor,
  featured = false,
  features,
  ctaHref,
  ctaLabel,
}: {
  title: string;
  price: string;
  note: string;
  icon: LucideIcon;
  iconColor: string;
  borderColor: string;
  featured?: boolean;
  features: string[];
  ctaHref: string;
  ctaLabel: string;
}) {
  return (
    <div className="relative rounded-2xl border p-8" style={{ background: "white", borderColor, borderWidth: featured ? 2 : 1 }}>
      {featured && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="rounded-full px-3 py-1 text-xs font-bold text-white" style={{ background: subBlue }}>Sub Portal First</span>
        </div>
      )}
      <div className="mb-6 text-center">
        <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: `${iconColor}1A`, color: iconColor }}>
          <Icon className="h-6 w-6" />
        </span>
        <h3 className="text-lg font-extrabold" style={{ color: ink }}>{title}</h3>
        <div className="mt-1 text-3xl font-extrabold" style={{ color: ink }}>
          {price}<span className="text-lg font-medium" style={{ color: "rgba(13,13,13,0.35)" }}>/mo</span>
        </div>
        <p className="mt-1 text-xs" style={{ color: "rgba(13,13,13,0.4)" }}>{note}</p>
      </div>
      <ul className="mb-6 space-y-2.5">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2">
            <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "#22C55E" }} />
            <span className="text-sm" style={{ color: ink }}>{feature}</span>
          </li>
        ))}
      </ul>
      <Link
        href={ctaHref}
        className="block rounded-xl px-6 py-3 text-center text-sm font-bold text-white transition-all"
        style={{ background: featured ? subBlue : accent }}
      >
        {ctaLabel}
      </Link>
    </div>
  );
}
