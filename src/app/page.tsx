import Link from "next/link";
import { Building2, Upload, Brain, AlertTriangle, Activity, CheckCircle, ArrowRight, Smartphone } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0B0B0D]">
      {/* Header */}
      <header className="border-b border-[#1F1F25] bg-[#0B0B0D]/95 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-6 h-6 text-[#F97316]" />
            <span className="text-xl font-bold text-white">IronTrack Daily</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="text-sm px-4 py-2 bg-[#F97316] hover:bg-[#EA580C] text-white rounded-lg font-semibold transition-colors"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-20 md:py-32">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#F97316]/10 border border-[#F97316]/20 rounded-full text-[#F97316] text-sm font-semibold mb-8">
            <Activity className="w-4 h-4" />
            Schedule Intelligence for the Field
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Your Construction Schedule is{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F97316] to-[#EA580C]">
              Trying to Tell You Something
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-400 mb-10 leading-relaxed">
            IronTrack Daily turns your project schedule into daily field intelligence — 
            risks, lookahead, health scores — in seconds.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="flex items-center gap-2 px-8 py-4 bg-[#F97316] hover:bg-[#EA580C] text-white rounded-lg text-lg font-bold transition-colors shadow-lg shadow-[#F97316]/20"
            >
              Start Free Trial
              <ArrowRight className="w-5 h-5" />
            </Link>
            <div className="text-sm text-gray-500">
              14 days free • No credit card required
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
            Field Intelligence, Not Spreadsheets
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Built for superintendents and project managers who need answers, not data dumps.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="bg-[#121217] border border-[#1F1F25] rounded-2xl p-8 hover:border-[#F97316]/30 transition-all">
            <div className="w-12 h-12 bg-[#F97316]/10 rounded-xl flex items-center justify-center mb-6">
              <Upload className="w-6 h-6 text-[#F97316]" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Upload Schedules</h3>
            <p className="text-gray-400 leading-relaxed">
              Drop in P6, Excel, or CSV schedules. Auto-maps columns, parses activities, and builds your intelligence layer.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-[#121217] border border-[#1F1F25] rounded-2xl p-8 hover:border-[#F97316]/30 transition-all">
            <div className="w-12 h-12 bg-[#F97316]/10 rounded-xl flex items-center justify-center mb-6">
              <Brain className="w-6 h-6 text-[#F97316]" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Daily Intelligence</h3>
            <p className="text-gray-400 leading-relaxed">
              See what's happening today, what's coming in the next 2 weeks, and where your critical path is at risk.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-[#121217] border border-[#1F1F25] rounded-2xl p-8 hover:border-[#F97316]/30 transition-all">
            <div className="w-12 h-12 bg-[#F97316]/10 rounded-xl flex items-center justify-center mb-6">
              <AlertTriangle className="w-6 h-6 text-[#F97316]" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Risk Detection</h3>
            <p className="text-gray-400 leading-relaxed">
              Auto-flags late activities, float erosion, milestone delays, and trade congestion before they become problems.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="bg-[#121217] border border-[#1F1F25] rounded-2xl p-8 hover:border-[#F97316]/30 transition-all">
            <div className="w-12 h-12 bg-[#F97316]/10 rounded-xl flex items-center justify-center mb-6">
              <Activity className="w-6 h-6 text-[#F97316]" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Health Scores</h3>
            <p className="text-gray-400 leading-relaxed">
              One number that tells you how your project is really doing. Updated in real-time as schedules change.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="bg-[#121217] border border-[#1F1F25] rounded-2xl p-8 hover:border-[#F97316]/30 transition-all">
            <div className="w-12 h-12 bg-[#F97316]/10 rounded-xl flex items-center justify-center mb-6">
              <Smartphone className="w-6 h-6 text-[#F97316]" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Mobile Ready</h3>
            <p className="text-gray-400 leading-relaxed">
              Progressive web app that works on phone, tablet, or desktop. Field teams get the same view as the office.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="bg-[#121217] border border-[#1F1F25] rounded-2xl p-8 hover:border-[#F97316]/30 transition-all">
            <div className="w-12 h-12 bg-[#F97316]/10 rounded-xl flex items-center justify-center mb-6">
              <CheckCircle className="w-6 h-6 text-[#F97316]" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">No Training Required</h3>
            <p className="text-gray-400 leading-relaxed">
              Clean interface built for people who live on job sites, not in Excel. If you can read a schedule, you can use this.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-gray-400">
            No hidden fees. No per-user costs. No contracts.
          </p>
        </div>

        <div className="max-w-md mx-auto">
          <div className="bg-[#121217] border-2 border-[#F97316] rounded-2xl p-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-[#F97316] text-white text-xs font-bold px-4 py-1 rounded-bl-lg">
              BEST VALUE
            </div>
            <div className="text-center mb-8">
              <div className="text-5xl font-bold text-white mb-2">
                $19.99<span className="text-2xl text-gray-500">/mo</span>
              </div>
              <p className="text-gray-400">per project</p>
            </div>
            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-[#22C55E] shrink-0 mt-0.5" />
                <span className="text-gray-300">Unlimited schedule uploads</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-[#22C55E] shrink-0 mt-0.5" />
                <span className="text-gray-300">Daily risk detection & health scores</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-[#22C55E] shrink-0 mt-0.5" />
                <span className="text-gray-300">Lookahead intelligence & briefs</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-[#22C55E] shrink-0 mt-0.5" />
                <span className="text-gray-300">Mobile app access</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-[#22C55E] shrink-0 mt-0.5" />
                <span className="text-gray-300">14-day free trial</span>
              </li>
            </ul>
            <Link
              href="/signup"
              className="block w-full text-center px-8 py-4 bg-[#F97316] hover:bg-[#EA580C] text-white rounded-lg text-lg font-bold transition-colors"
            >
              Start Free Trial
            </Link>
            <p className="text-center text-sm text-gray-500 mt-4">
              No credit card required for trial
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="bg-gradient-to-br from-[#F97316]/20 to-[#EA580C]/10 border border-[#F97316]/30 rounded-3xl p-12 md:p-16 text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            Ready to See What Your Schedule is Saying?
          </h2>
          <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
            Join construction teams using IronTrack Daily to stay ahead of risks and finish on time.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-8 py-4 bg-[#F97316] hover:bg-[#EA580C] text-white rounded-lg text-lg font-bold transition-colors shadow-lg shadow-[#F97316]/20"
          >
            Start Your Free Trial
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#1F1F25] py-8">
        <div className="max-w-7xl mx-auto px-6 text-center text-gray-500 text-sm">
          © 2025 IronTrack Daily. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
