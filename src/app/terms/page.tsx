import Link from "next/link";
import { Building2, ArrowLeft } from "lucide-react";

export default function TermsPage() {
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

        <h1 className="text-4xl font-bold text-[color:var(--text-primary)] mb-4">Terms of Service</h1>
        <p className="text-[color:var(--text-secondary)] mb-8">Last updated: April 10, 2026</p>

        <div className="space-y-8 text-[color:var(--text-secondary)] leading-relaxed">
          {/* Acceptance */}
          <section>
            <h2 className="text-2xl font-bold text-[color:var(--text-primary)] mb-4">1. Acceptance of Terms</h2>
            <p>
              By creating an account or using IronTrack Project Pulse ("the Service"), you agree to these Terms of Service. If you don&apos;t agree, don&apos;t use the Service.
            </p>
            <p className="mt-4">
              These terms are a legal agreement between you and IronTrack Development LLC, an Arizona limited liability company.
            </p>
          </section>

          {/* Description of Service */}
          <section>
            <h2 className="text-2xl font-bold text-[color:var(--text-primary)] mb-4">2. Description of Service</h2>
            <p>
              IronTrack Project Pulse is a web application that helps construction professionals track project schedules. You upload schedule files (Microsoft Project .mpp, Excel .xlsx, CSV, XML, or Primavera P6 .xer formats), and the Service parses them to display:
            </p>
            <ul className="list-disc list-inside mt-4 space-y-2 ml-4">
              <li>3-week lookahead of upcoming activities</li>
              <li>Milestone tracking and dates</li>
              <li>Progress percentage and completion status</li>
            </ul>
            <p className="mt-4">
              The Service uses AI-powered parsing (Anthropic Claude) to extract schedule data from uploaded files.
            </p>
          </section>

          {/* Account Terms */}
          <section>
            <h2 className="text-2xl font-bold text-[color:var(--text-primary)] mb-4">3. Account Terms</h2>
            <p>
              Your account is for <strong className="text-[color:var(--text-primary)]">one person only</strong>. You may not share your login credentials with anyone. The Service enforces single-session authentication — if you log in from a new location, previous sessions are automatically ended.
            </p>
            <p className="mt-4">
              You are responsible for:
            </p>
            <ul className="list-disc list-inside mt-4 space-y-2 ml-4">
              <li>Maintaining the security of your password</li>
              <li>All activity that occurs under your account</li>
              <li>Notifying us immediately of any unauthorized access</li>
            </ul>
            <p className="mt-4">
              We reserve the right to terminate accounts that violate these terms, including account sharing.
            </p>
          </section>

          {/* Subscription and Billing */}
          <section>
            <h2 className="text-2xl font-bold text-[color:var(--text-primary)] mb-4">4. Subscription and Billing</h2>
            <p>
              IronTrack Project Pulse is a subscription service. The current price is <strong className="text-[color:var(--text-primary)]">$19.99 per month</strong>, billed automatically via Stripe.
            </p>
            <p className="mt-4">
              <strong className="text-[color:var(--text-primary)]">Cancellation:</strong> You may cancel at any time. Your access will continue until the end of your current billing period. We do not offer refunds for partial months.
            </p>
            <p className="mt-4">
              <strong className="text-[color:var(--text-primary)]">Price changes:</strong> We may change the subscription price with 30 days&apos; notice. Continued use after the notice period means you accept the new price.
            </p>
            <p className="mt-4">
              <strong className="text-[color:var(--text-primary)]">Payment failures:</strong> If your payment method fails, we may suspend your account until payment is resolved.
            </p>
          </section>

          {/* Data Usage */}
          <section>
            <h2 className="text-2xl font-bold text-[color:var(--text-primary)] mb-4">5. Data Usage and Intelligence</h2>
            <p className="bg-[#1F1F25] border border-[#2A2A30] rounded-lg p-6">
              <strong className="text-[color:var(--text-primary)]">We may use anonymized, aggregate data from uploaded schedules to improve our platform&apos;s accuracy and intelligence features.</strong> Individual project data is never shared, sold, or identified. Your project-specific data remains private and accessible only to your account.
            </p>
            <p className="mt-4">
              This means we analyze patterns across many schedules (without identifying information) to:
            </p>
            <ul className="list-disc list-inside mt-4 space-y-2 ml-4">
              <li>Improve schedule parsing accuracy</li>
              <li>Refine AI models for activity recognition</li>
              <li>Develop better scheduling intelligence features</li>
              <li>Create industry benchmarks and insights</li>
            </ul>
            <p className="mt-4">
              Your individual project names, company information, and specific schedule details are never included in aggregate data.
            </p>
          </section>

          {/* Uploaded Content */}
          <section>
            <h2 className="text-2xl font-bold text-[color:var(--text-primary)] mb-4">6. Uploaded Content and Ownership</h2>
            <p>
              <strong className="text-[color:var(--text-primary)]">You own your data.</strong> All schedule files and project information you upload remain your property.
            </p>
            <p className="mt-4">
              By uploading files to the Service, you grant IronTrack Development LLC a license to:
            </p>
            <ul className="list-disc list-inside mt-4 space-y-2 ml-4">
              <li>Store and process your files to provide the Service</li>
              <li>Parse and display schedule data in the application</li>
              <li>Use anonymized, aggregate insights derived from your data (as described in Section 5)</li>
            </ul>
            <p className="mt-4">
              This license ends when you delete your account or remove uploaded files.
            </p>
          </section>

          {/* Acceptable Use */}
          <section>
            <h2 className="text-2xl font-bold text-[color:var(--text-primary)] mb-4">7. Acceptable Use</h2>
            <p>
              You agree <strong className="text-[color:var(--text-primary)]">not to</strong>:
            </p>
            <ul className="list-disc list-inside mt-4 space-y-2 ml-4">
              <li>Upload malicious files (viruses, malware, etc.)</li>
              <li>Attempt to reverse engineer or hack the Service</li>
              <li>Share your account credentials with others</li>
              <li>Use the Service for any illegal purpose</li>
              <li>Attempt to bypass usage limits or security measures</li>
              <li>Resell or redistribute access to the Service</li>
            </ul>
          </section>

          {/* Service Availability */}
          <section>
            <h2 className="text-2xl font-bold text-[color:var(--text-primary)] mb-4">8. Service Availability</h2>
            <p>
              We work hard to keep the Service running, but we <strong className="text-[color:var(--text-primary)]">do not guarantee 100% uptime</strong>. The Service is provided "as is" and may be temporarily unavailable for maintenance, updates, or unforeseen issues.
            </p>
            <p className="mt-4">
              We may modify, suspend, or discontinue features at any time. We will provide reasonable notice for major changes, but immediate changes may be required for security or legal reasons.
            </p>
          </section>

          {/* Limitation of Liability */}
          <section>
            <h2 className="text-2xl font-bold text-[color:var(--text-primary)] mb-4">9. Limitation of Liability</h2>
            <p>
              IronTrack Project Pulse is a tool to help you track schedules. It is <strong className="text-[color:var(--text-primary)]">not a substitute for professional judgment</strong>. You are responsible for verifying all schedule data and making project decisions.
            </p>
            <p className="mt-4">
              To the maximum extent permitted by law, IronTrack Development LLC is not liable for:
            </p>
            <ul className="list-disc list-inside mt-4 space-y-2 ml-4">
              <li>Errors in schedule parsing or data display</li>
              <li>Project delays or financial losses</li>
              <li>Data loss or corruption</li>
              <li>Service interruptions or downtime</li>
            </ul>
            <p className="mt-4">
              Our total liability to you for any claim is limited to the amount you paid us in the 12 months before the claim.
            </p>
          </section>

          {/* Termination */}
          <section>
            <h2 className="text-2xl font-bold text-[color:var(--text-primary)] mb-4">10. Termination</h2>
            <p>
              We may terminate or suspend your account immediately if you violate these terms, including:
            </p>
            <ul className="list-disc list-inside mt-4 space-y-2 ml-4">
              <li>Sharing account credentials</li>
              <li>Uploading malicious content</li>
              <li>Attempting to hack or abuse the Service</li>
              <li>Chargebacks or payment fraud</li>
            </ul>
            <p className="mt-4">
              You may terminate your account at any time by canceling your subscription. Your data will be deleted within 30 days of account termination (see our <Link href="/privacy" className="text-[#F97316] hover:text-[#EA580C]">Privacy Policy</Link>).
            </p>
          </section>

          {/* Governing Law */}
          <section>
            <h2 className="text-2xl font-bold text-[color:var(--text-primary)] mb-4">11. Governing Law</h2>
            <p>
              These Terms are governed by the laws of the State of Arizona, without regard to conflict of law principles. Any disputes will be resolved in the courts of Arizona.
            </p>
          </section>

          {/* Changes to Terms */}
          <section>
            <h2 className="text-2xl font-bold text-[color:var(--text-primary)] mb-4">12. Changes to These Terms</h2>
            <p>
              We may update these Terms from time to time. We will post the new Terms on this page and update the "Last updated" date. Continued use of the Service after changes means you accept the new Terms.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-bold text-[color:var(--text-primary)] mb-4">13. Contact</h2>
            <p>
              Questions about these Terms? Contact us:
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
            <Link href="/privacy" className="text-[color:var(--text-muted)] hover:text-[#F97316] transition-colors">
              Privacy Policy
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
