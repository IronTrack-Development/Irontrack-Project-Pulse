import Link from "next/link";
import { Building2, ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0B0B0D]">
      {/* Header */}
      <header className="border-b border-[#1F1F25] bg-[#0B0B0D]/95 backdrop-blur sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="flex items-center gap-2 mb-2">
          <Building2 className="w-6 h-6 text-[#F97316]" />
          <span className="text-sm text-[color:var(--text-muted)]">IronTrack Project Pulse</span>
        </div>

        <h1 className="text-4xl font-bold text-[color:var(--text-primary)] mb-4">Privacy Policy</h1>
        <p className="text-[color:var(--text-secondary)] mb-8">Last updated: April 10, 2026</p>

        <div className="space-y-8 text-[color:var(--text-secondary)] leading-relaxed">
          {/* Introduction */}
          <section>
            <p>
              IronTrack Development LLC ("we," "us," "our") operates IronTrack Project Pulse. This Privacy Policy explains how we collect, use, store, and protect your personal information.
            </p>
            <p className="mt-4">
              We take your privacy seriously. This policy is written in plain language — no legal jargon unless necessary.
            </p>
          </section>

          {/* What We Collect */}
          <section>
            <h2 className="text-2xl font-bold text-[color:var(--text-primary)] mb-4">1. What Data We Collect</h2>
            <p>
              When you use IronTrack Project Pulse, we collect:
            </p>
            <ul className="list-disc list-inside mt-4 space-y-2 ml-4">
              <li><strong className="text-[color:var(--text-primary)]">Email address</strong> — for your account and login</li>
              <li><strong className="text-[color:var(--text-primary)]">Password (hashed)</strong> — we never store your actual password, only a secure hash</li>
              <li><strong className="text-[color:var(--text-primary)]">Uploaded schedule files</strong> — .mpp, .xlsx, .csv, .xml, .xer files you upload</li>
              <li><strong className="text-[color:var(--text-primary)]">Usage data</strong> — when you log in, which features you use, error logs</li>
              <li><strong className="text-[color:var(--text-primary)]">Payment information</strong> — handled entirely by Stripe; we never see your credit card number</li>
            </ul>
          </section>

          {/* How We Use Data */}
          <section>
            <h2 className="text-2xl font-bold text-[color:var(--text-primary)] mb-4">2. How We Use Your Data</h2>
            <p>
              We use your data to:
            </p>
            <ul className="list-disc list-inside mt-4 space-y-2 ml-4">
              <li><strong className="text-[color:var(--text-primary)]">Provide the Service</strong> — parse your schedules, display lookaheads, track milestones</li>
              <li><strong className="text-[color:var(--text-primary)]">Manage your account</strong> — authentication, subscription, session management</li>
              <li><strong className="text-[color:var(--text-primary)]">Process billing</strong> — charge your subscription via Stripe</li>
              <li><strong className="text-[color:var(--text-primary)]">Improve the platform</strong> — analyze anonymized, aggregate data (see below)</li>
              <li><strong className="text-[color:var(--text-primary)]">Communicate with you</strong> — respond to support requests, send important updates</li>
            </ul>
          </section>

          {/* Aggregate Data */}
          <section>
            <h2 className="text-2xl font-bold text-[color:var(--text-primary)] mb-4">3. Aggregate Data and Intelligence</h2>
            <p className="bg-[#1F1F25] border border-[#2A2A30] rounded-lg p-6">
              <strong className="text-[color:var(--text-primary)]">We analyze uploaded schedules in anonymized, aggregate form to improve our scheduling intelligence, benchmark accuracy, and product features.</strong> This aggregate data contains no personally identifiable information and cannot be traced back to any individual user or project.
            </p>
            <p className="mt-4">
              Here&apos;s what that means in practice:
            </p>
            <ul className="list-disc list-inside mt-4 space-y-2 ml-4">
              <li>We look at patterns across thousands of schedules to improve AI parsing accuracy</li>
              <li>We analyze common activity types to build better scheduling intelligence</li>
              <li>We study typical project durations and milestones to refine our features</li>
              <li>We create industry benchmarks (e.g., "average time for rough-in electrical")</li>
            </ul>
            <p className="mt-4">
              <strong className="text-[color:var(--text-primary)]">What we do NOT do:</strong>
            </p>
            <ul className="list-disc list-inside mt-4 space-y-2 ml-4">
              <li>Share your specific project names, company info, or schedule details with anyone</li>
              <li>Sell your data to third parties</li>
              <li>Identify you or your projects in aggregate data</li>
              <li>Use your data for advertising or marketing purposes</li>
            </ul>
          </section>

          {/* Data Storage */}
          <section>
            <h2 className="text-2xl font-bold text-[color:var(--text-primary)] mb-4">4. Data Storage</h2>
            <p>
              Your data is stored securely using:
            </p>
            <ul className="list-disc list-inside mt-4 space-y-2 ml-4">
              <li><strong className="text-[color:var(--text-primary)]">Supabase (PostgreSQL)</strong> — cloud database for user accounts and project data</li>
              <li><strong className="text-[color:var(--text-primary)]">Vercel</strong> — serverless hosting for the application</li>
              <li><strong className="text-[color:var(--text-primary)]">Stripe</strong> — payment processing (PCI-compliant)</li>
            </ul>
            <p className="mt-4">
              All data is encrypted in transit (HTTPS) and at rest.
            </p>
          </section>

          {/* Third Party Services */}
          <section>
            <h2 className="text-2xl font-bold text-[color:var(--text-primary)] mb-4">5. Third-Party Services</h2>
            <p>
              We use these third-party services to operate IronTrack Project Pulse:
            </p>
            <ul className="list-disc list-inside mt-4 space-y-2 ml-4">
              <li><strong className="text-[color:var(--text-primary)]">Supabase</strong> — database and authentication</li>
              <li><strong className="text-[color:var(--text-primary)]">Vercel</strong> — hosting and deployment</li>
              <li><strong className="text-[color:var(--text-primary)]">Stripe</strong> — payment processing</li>
              <li><strong className="text-[color:var(--text-primary)]">Anthropic (Claude AI)</strong> — schedule file parsing</li>
            </ul>
            <p className="mt-4">
              Each service has its own privacy policy. We chose these providers because they meet high security and privacy standards.
            </p>
          </section>

          {/* Data Retention */}
          <section>
            <h2 className="text-2xl font-bold text-[color:var(--text-primary)] mb-4">6. Data Retention</h2>
            <p>
              <strong className="text-[color:var(--text-primary)]">Active accounts:</strong> We keep your data as long as your account is active.
            </p>
            <p className="mt-4">
              <strong className="text-[color:var(--text-primary)]">Deleted accounts:</strong> When you delete your account, we remove your personal data and uploaded files within <strong className="text-[color:var(--text-primary)]">30 days</strong>.
            </p>
            <p className="mt-4">
              Note: Anonymized, aggregate insights derived from your data (with no identifying information) may be retained to improve the platform.
            </p>
          </section>

          {/* User Rights */}
          <section>
            <h2 className="text-2xl font-bold text-[color:var(--text-primary)] mb-4">7. Your Rights</h2>
            <p>
              You have the right to:
            </p>
            <ul className="list-disc list-inside mt-4 space-y-2 ml-4">
              <li><strong className="text-[color:var(--text-primary)]">Access your data</strong> — request a copy of what we have</li>
              <li><strong className="text-[color:var(--text-primary)]">Export your data</strong> — download your uploaded schedules</li>
              <li><strong className="text-[color:var(--text-primary)]">Delete your data</strong> — close your account and have data removed</li>
              <li><strong className="text-[color:var(--text-primary)]">Correct your data</strong> — update inaccurate information</li>
            </ul>
            <p className="mt-4">
              To exercise these rights, contact us at{" "}
              <a href="mailto:irontrackdevelopment@outlook.com" className="text-[#F97316] hover:text-[#EA580C]">
                irontrackdevelopment@outlook.com
              </a>.
            </p>
          </section>

          {/* Security */}
          <section>
            <h2 className="text-2xl font-bold text-[color:var(--text-primary)] mb-4">8. Security Measures</h2>
            <p>
              We protect your data with:
            </p>
            <ul className="list-disc list-inside mt-4 space-y-2 ml-4">
              <li><strong className="text-[color:var(--text-primary)]">Encryption in transit</strong> — all data sent over HTTPS</li>
              <li><strong className="text-[color:var(--text-primary)]">Encryption at rest</strong> — database and file storage encrypted</li>
              <li><strong className="text-[color:var(--text-primary)]">Row-Level Security (RLS)</strong> — database policies ensure users only access their own data</li>
              <li><strong className="text-[color:var(--text-primary)]">Single session enforcement</strong> — prevents account sharing and unauthorized access</li>
              <li><strong className="text-[color:var(--text-primary)]">Password hashing</strong> — we never store plain-text passwords</li>
            </ul>
            <p className="mt-4">
              No system is 100% secure, but we follow industry best practices to protect your information.
            </p>
          </section>

          {/* Cookies */}
          <section>
            <h2 className="text-2xl font-bold text-[color:var(--text-primary)] mb-4">9. Cookies</h2>
            <p>
              We use cookies only for <strong className="text-[color:var(--text-primary)]">authentication</strong> (Supabase session cookies). We do not use tracking cookies, advertising cookies, or third-party analytics.
            </p>
          </section>

          {/* Children */}
          <section>
            <h2 className="text-2xl font-bold text-[color:var(--text-primary)] mb-4">10. Children</h2>
            <p>
              IronTrack Project Pulse is not intended for users under 18. We do not knowingly collect data from children. If you believe we have collected data from a child, contact us and we will delete it.
            </p>
          </section>

          {/* Changes to Policy */}
          <section>
            <h2 className="text-2xl font-bold text-[color:var(--text-primary)] mb-4">11. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will post the new policy on this page and update the "Last updated" date. Continued use of the Service after changes means you accept the updated policy.
            </p>
            <p className="mt-4">
              For significant changes (like new data uses), we will notify you by email.
            </p>
          </section>

          {/* Governing Law */}
          <section>
            <h2 className="text-2xl font-bold text-[color:var(--text-primary)] mb-4">12. Governing Law</h2>
            <p>
              This Privacy Policy is governed by the laws of the State of Arizona.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-bold text-[color:var(--text-primary)] mb-4">13. Contact</h2>
            <p>
              Questions about this Privacy Policy or how we handle your data?
            </p>
            <p className="mt-4">
              <strong className="text-[color:var(--text-primary)]">IronTrack Development LLC</strong><br />
              <a href="mailto:irontrackdevelopment@outlook.com" className="text-[#F97316] hover:text-[#EA580C]">
                irontrackdevelopment@outlook.com
              </a>
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#1F1F25] py-8 mt-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Building2 className="w-4 h-4 text-[#F97316]" />
            <span className="text-sm text-[color:var(--text-muted)]">© 2026 IronTrack Development LLC. All rights reserved.</span>
          </div>
          <div className="flex items-center justify-center gap-4 text-sm">
            <Link href="/terms" className="text-[color:var(--text-muted)] hover:text-[#F97316] transition-colors">
              Terms of Service
            </Link>
            <span className="text-gray-700">•</span>
            <a href="mailto:irontrackdevelopment@outlook.com" className="text-[color:var(--text-muted)] hover:text-[#F97316] transition-colors">
              irontrackdevelopment@outlook.com
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
