import Link from "next/link";
import { Building2, Upload, Calendar, Target, ArrowRight, CheckCircle, HardHat, Briefcase } from "lucide-react";
import HeroVideo from "@/components/hero-video";
import MobileMenu from "@/components/MobileMenu";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0B0B0D]">
      {/* Header */}
      <header className="border-b border-[#1F1F25] bg-[#0B0B0D] sticky top-0 z-50 relative">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2 md:gap-3">
            <div className="relative" style={{ marginTop: '4px', marginBottom: '-12px' }}>
              <img
                src="/logo-irontrack.png"
                alt="IronTrack Logo"
                className="h-10 md:h-20 w-auto object-contain"
                style={{ filter: 'drop-shadow(0 0 12px rgba(249,115,22,0.4))' }}
              />
            </div>
            <span className="text-lg md:text-xl font-bold text-white">
              IronTrack<span className="hidden md:inline"> Project Pulse</span>
            </span>
          </div>

          {/* Mobile hamburger */}
          <MobileMenu />

          {/* Nav Links — desktop */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#about" className="text-sm text-gray-400 hover:text-white transition-colors">
              About Us
            </a>
            <a href="#who-we-serve" className="text-sm text-gray-400 hover:text-white transition-colors">
              Who We Serve
            </a>
            <a href="#features" className="text-sm text-gray-400 hover:text-white transition-colors">
              Features
            </a>
            <a href="#pricing" className="text-sm text-gray-400 hover:text-white transition-colors">
              Pricing
            </a>
          </nav>

          {/* Right Side */}
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="hidden sm:block text-sm text-gray-400 hover:text-white transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="text-sm px-4 py-2 bg-[#F97316] hover:bg-[#EA580C] text-white rounded-lg font-semibold transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Hero video — the star of the show */}
        <HeroVideo />

        {/* Hero content — below video */}
        <div className="max-w-7xl mx-auto px-6 py-8 md:py-12 lg:py-20">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold text-white mb-4 leading-tight">
              Run Your Job. Don&apos;t Chase It.
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold mb-6 md:mb-10">
              <span className="text-[#F97316]">Your Pulse Check</span>{" "}
              <span className="text-white">For Every Jobsite</span>
            </p>
            <p className="text-base md:text-xl text-gray-400 mb-10 leading-relaxed max-w-2xl mx-auto">
              Upload your project schedule. Get a 3-week lookahead, milestone tracking, and progress — instantly. No training. No setup. Just answers.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-6 py-3 md:px-8 md:py-4 bg-[#F97316] hover:bg-[#EA580C] text-white rounded-xl text-base md:text-lg font-bold transition-colors shadow-lg shadow-[#F97316]/20"
            >
              Get Started — $19.99/month
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

          {/* App Screenshot Placeholder */}
          <div className="mt-8 md:mt-16 max-w-4xl mx-auto">
            <div className="bg-[#121217] border border-[#1F1F25] rounded-2xl p-4 md:p-8 shadow-2xl">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-3 h-3 rounded-full bg-[#EF4444]" />
                <div className="w-3 h-3 rounded-full bg-[#EAB308]" />
                <div className="w-3 h-3 rounded-full bg-[#22C55E]" />
                <span className="ml-3 text-sm text-gray-500">IronTrack Project Pulse</span>
              </div>
              <div className="grid grid-cols-3 gap-2 md:gap-4 mb-6">
                <div className="bg-[#0B0B0D] rounded-xl p-4 border border-[#1F1F25]">
                  <div className="text-xs text-gray-500 mb-1">Week 1</div>
                  <div className="text-xl md:text-2xl font-bold text-white">12</div>
                  <div className="text-xs text-gray-500">activities</div>
                </div>
                <div className="bg-[#0B0B0D] rounded-xl p-4 border border-[#1F1F25]">
                  <div className="text-xs text-gray-500 mb-1">Milestones</div>
                  <div className="text-xl md:text-2xl font-bold text-[#F97316]">3</div>
                  <div className="text-xs text-gray-500">this month</div>
                </div>
                <div className="bg-[#0B0B0D] rounded-xl p-4 border border-[#1F1F25]">
                  <div className="text-xs text-gray-500 mb-1">Progress</div>
                  <div className="text-xl md:text-2xl font-bold text-[#22C55E]">64%</div>
                  <div className="text-xs text-gray-500">complete</div>
                </div>
              </div>
              <div className="space-y-2">
                {["Install Structural Steel — Buildtek", "Rough-In Electrical — ATS Electric", "Pour Foundation North Side — Rouser", "Fire Sprinkler Rough-In — AMS", "Exterior Framing Bldg B — Buildtek"].map((task, i) => (
                  <div key={i} className="flex items-center gap-3 bg-[#0B0B0D] rounded-lg px-3 py-2 md:px-4 md:py-2.5 border border-[#1F1F25]">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${i < 2 ? "bg-[#22C55E]" : i === 2 ? "bg-[#EAB308]" : "bg-[#3B82F6]"}`} />
                    <span className="text-xs md:text-sm text-gray-300 flex-1 truncate">{task}</span>
                    <span className="text-xs text-gray-600 shrink-0">{["100%", "85%", "60%", "0%", "0%"][i]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Us */}
      <section id="about" className="py-12 md:py-20 border-t border-[#1F1F25]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
              Built by <span className="text-[#F97316]">Experts</span>. For <span className="text-[#F97316]">Experts</span>.
            </h2>
            <p className="text-base md:text-lg text-gray-400 leading-relaxed max-w-3xl mx-auto">
              We&apos;re not consultants guessing about construction. We&apos;re field operators who lived it — 12+ years of superintending healthcare, education, industrial, and ground-up commercial projects across Arizona.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-[#121217] border border-[#1F1F25] rounded-2xl p-6 md:p-8">
              <p className="text-gray-400 leading-relaxed text-base md:text-lg">
                IronTrack was born from a simple frustration: the tools we had in the field never matched the speed we needed to operate. So we built our own.
              </p>
            </div>
            <div className="bg-[#121217] border border-[#1F1F25] rounded-2xl p-6 md:p-8">
              <p className="text-gray-400 leading-relaxed text-base md:text-lg">
                Every feature in Project Pulse was designed by someone who&apos;s actually stood on a slab at 5 AM reading a schedule on their phone. We built this for the way superintendents and PMs actually work — not the way software companies think they work.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Who We Serve */}
      <section id="who-we-serve" className="py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white">Who We Serve</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Superintendents */}
            <div className="bg-[#121217] border border-[#1F1F25] rounded-2xl p-6 md:p-8 hover:border-[#F97316]/30 transition-all">
              <div className="w-12 h-12 bg-[#F97316]/10 rounded-xl flex items-center justify-center mb-6">
                <HardHat className="w-6 h-6 text-[#F97316]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Superintendents</h3>
              <p className="text-gray-400 leading-relaxed">
                You run the job. You need to know what&apos;s happening today, what&apos;s at risk, and what&apos;s about to blow up — before it does. Pulse gives you that in 30 seconds.
              </p>
            </div>

            {/* Project Managers */}
            <div className="bg-[#121217] border border-[#1F1F25] rounded-2xl p-6 md:p-8 hover:border-[#F97316]/30 transition-all">
              <div className="w-12 h-12 bg-[#F97316]/10 rounded-xl flex items-center justify-center mb-6">
                <Briefcase className="w-6 h-6 text-[#F97316]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Project Managers</h3>
              <p className="text-gray-400 leading-relaxed">
                You own the schedule, the budget, and the client relationship. Pulse gives you executive snapshots, risk detection, and milestone tracking without digging through spreadsheets.
              </p>
            </div>

            {/* General Contractors */}
            <div className="bg-[#121217] border border-[#1F1F25] rounded-2xl p-6 md:p-8 hover:border-[#F97316]/30 transition-all">
              <div className="w-12 h-12 bg-[#F97316]/10 rounded-xl flex items-center justify-center mb-6">
                <Building2 className="w-6 h-6 text-[#F97316]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">General Contractors</h3>
              <p className="text-gray-400 leading-relaxed">
                You need every project visible and every risk flagged. Pulse gives your entire team a shared operating picture — upload once, everyone&apos;s aligned.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="border-t border-[#1F1F25] py-12 md:py-20">
        <div className="max-w-4xl mx-auto px-6">
          <p className="text-center text-lg text-gray-400 mb-8">
            Built by industry leaders in commercial construction.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 md:gap-6">
            {["Microsoft Project (.mpp)", "Primavera P6 (.xer)", "Excel (.xlsx)", "XML", "CSV"].map((fmt) => (
              <div key={fmt} className="flex items-center gap-2 bg-[#121217] border border-[#1F1F25] rounded-lg px-3 py-1.5 md:px-4 md:py-2">
                <CheckCircle className="w-4 h-4 text-[#22C55E] shrink-0" />
                <span className="text-xs md:text-sm text-gray-300">{fmt}</span>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-gray-500 mt-6">
            Works with Microsoft Project and Primavera P6
          </p>
        </div>
      </section>

      {/* 3 Features */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-12 md:py-20">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-[#121217] border border-[#1F1F25] rounded-2xl p-6 md:p-8 hover:border-[#F97316]/30 transition-all">
            <div className="w-12 h-12 bg-[#F97316]/10 rounded-xl flex items-center justify-center mb-6">
              <Upload className="w-6 h-6 text-[#F97316]" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Upload Once</h3>
            <p className="text-gray-400 leading-relaxed">
              Drop your .mpp or .xlsx schedule. We handle the rest. No column mapping. No configuration. Just data.
            </p>
          </div>

          <div className="bg-[#121217] border border-[#1F1F25] rounded-2xl p-6 md:p-8 hover:border-[#F97316]/30 transition-all">
            <div className="w-12 h-12 bg-[#F97316]/10 rounded-xl flex items-center justify-center mb-6">
              <Calendar className="w-6 h-6 text-[#F97316]" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">3-Week Lookahead</h3>
            <p className="text-gray-400 leading-relaxed">
              Always know what&apos;s coming. This week, next week, two weeks out. Updated automatically as dates shift.
            </p>
          </div>

          <div className="bg-[#121217] border border-[#1F1F25] rounded-2xl p-6 md:p-8 hover:border-[#F97316]/30 transition-all">
            <div className="w-12 h-12 bg-[#F97316]/10 rounded-xl flex items-center justify-center mb-6">
              <Target className="w-6 h-6 text-[#F97316]" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Milestones & Progress</h3>
            <p className="text-gray-400 leading-relaxed">
              Track what matters. Milestone dates, completion percentage, days to finish. No spreadsheets required.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-7xl mx-auto px-6 py-12 md:py-20">
        <div className="max-w-md mx-auto">
          <div className="bg-[#121217] border-2 border-[#F97316] rounded-2xl p-6 md:p-10">
            <div className="text-center mb-8">
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                $19.99<span className="text-2xl text-gray-500">/mo</span>
              </div>
            </div>
            <ul className="space-y-4 mb-8">
              <li className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-[#22C55E] shrink-0" />
                <span className="text-gray-300">All file formats — MPP, XLSX, CSV, XML, XER</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-[#22C55E] shrink-0" />
                <span className="text-gray-300">3-week lookahead + milestones + progress</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-[#22C55E] shrink-0" />
                <span className="text-gray-300">Up to 50 projects per month</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-[#22C55E] shrink-0" />
                <span className="text-gray-300">Works on desktop and mobile</span>
              </li>
            </ul>
            <Link
              href="/signup"
              className="block w-full text-center px-8 py-4 bg-[#F97316] hover:bg-[#EA580C] text-white rounded-lg text-lg font-bold transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#1F1F25] py-6 md:py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#F97316]" />
            <span className="text-sm text-gray-500">© 2026 IronTrack Development LLC. All rights reserved.</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4 text-xs md:text-sm">
            <Link href="/terms" className="text-gray-500 hover:text-[#F97316] transition-colors">
              Terms of Service
            </Link>
            <span className="text-gray-700">•</span>
            <Link href="/privacy" className="text-gray-500 hover:text-[#F97316] transition-colors">
              Privacy Policy
            </Link>
            <span className="text-gray-700">•</span>
            <a href="mailto:irontrackdevelopment@outlook.com" className="text-gray-500 hover:text-[#F97316] transition-colors">
              irontrackdevelopment@outlook.com
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
