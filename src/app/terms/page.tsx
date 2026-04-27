import Link from "next/link";
import { Building2, ArrowLeft } from "lucide-react";
import { t } from "@/lib/i18n";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Header */}
      <header className="border-b border-[var(--border-primary)] bg-[var(--bg-primary)]/95 backdrop-blur sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />{t('ui.back.to.home')}
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="flex items-center gap-2 mb-2">
          <Building2 className="w-6 h-6 text-[#F97316]" />
          <span className="text-sm text-[color:var(--text-muted)]">{t('ui.irontrack.project.pulse')}</span>
        </div>

        <h1 className="text-4xl font-bold text-[color:var(--text-primary)] mb-4">{t('ui.terms.of.service')}</h1>
        <p className="text-[color:var(--text-secondary)] mb-8">{t('ui.last.updated.april.10.2026')}</p>

        <div className="space-y-8 text-[color:var(--text-secondary)] leading-relaxed">
          {/* Acceptance */}
          <section>
            <h2 className="text-2xl font-bold text-[color:var(--text-primary)] mb-4">{t('ui.1.acceptance.of.terms')}</h2>
            <p>{t('ui.by.creating.an.account.or.using.irontrack.project.pulse.the')}
            </p>
            <p className="mt-4">{t('ui.these.terms.are.a.legal.agreement.between.you.and.irontrack')}
            </p>
          </section>

          {/* Description of Service */}
          <section>
            <h2 className="text-2xl font-bold text-[color:var(--text-primary)] mb-4">{t('ui.2.description.of.service')}</h2>
            <p>{t('ui.irontrack.project.pulse.is.a.web.application.that.helps.construction.professionals.track.project.schedules')}
            </p>
            <ul className="list-disc list-inside mt-4 space-y-2 ml-4">
              <li>{t('ui.3.week.lookahead.of.upcoming.activities')}</li>
              <li>{t('ui.milestone.tracking.and.dates')}</li>
              <li>{t('ui.progress.percentage.and.completion.status')}</li>
            </ul>
            <p className="mt-4">{t('ui.the.service.uses.ai.powered.parsing.anthropic.claude.to.extract')}
            </p>
          </section>

          {/* Account Terms */}
          <section>
            <h2 className="text-2xl font-bold text-[color:var(--text-primary)] mb-4">{t('ui.3.account.terms')}</h2>
            <p>{t('ui.your.account.is.for')} <strong className="text-[color:var(--text-primary)]">{t('ui.one.person.only')}</strong>. {t('ui.you.may.not.share.your.login.credentials.with.anyone')}
            </p>
            <p className="mt-4">{t('ui.you.are.responsible.for')}
            </p>
            <ul className="list-disc list-inside mt-4 space-y-2 ml-4">
              <li>{t('ui.maintaining.the.security.of.your.password')}</li>
              <li>{t('ui.all.activity.that.occurs.under.your.account')}</li>
              <li>{t('ui.notifying.us.immediately.of.any.unauthorized.access')}</li>
            </ul>
            <p className="mt-4">{t('ui.we.reserve.the.right.to.terminate.accounts.that.violate.these')}
            </p>
          </section>

          {/* Subscription and Billing */}
          <section>
            <h2 className="text-2xl font-bold text-[color:var(--text-primary)] mb-4">{t('ui.4.subscription.and.billing')}</h2>
            <p>{t('ui.irontrack.project.pulse.is.a.subscription.service.the.current.price')} <strong className="text-[color:var(--text-primary)]">{t('ui.19.99.per.month')}</strong>{t('ui.billed.automatically.via.stripe')}
            </p>
            <p className="mt-4">
              <strong className="text-[color:var(--text-primary)]">{t('ui.cancellation')}</strong>{t('ui.you.may.cancel.at.any.time.your.access.will.continue')}
            </p>
            <p className="mt-4">
              <strong className="text-[color:var(--text-primary)]">{t('ui.price.changes')}</strong>{t('ui.we.may.change.the.subscription.price.with.30.days.notice')}
            </p>
            <p className="mt-4">
              <strong className="text-[color:var(--text-primary)]">{t('ui.payment.failures')}</strong>{t('ui.if.your.payment.method.fails.we.may.suspend.your.account')}
            </p>
          </section>

          {/* Data Usage */}
          <section>
            <h2 className="text-2xl font-bold text-[color:var(--text-primary)] mb-4">{t('ui.5.data.usage.and.intelligence')}</h2>
            <p className="bg-[var(--bg-tertiary)] border border-[#2A2A30] rounded-lg p-6">
              <strong className="text-[color:var(--text-primary)]">{t('ui.we.may.use.anonymized.aggregate.data.from.uploaded.schedules.to')}</strong>{t('ui.individual.project.data.is.never.shared.sold.or.identified.your')}
            </p>
            <p className="mt-4">{t('ui.this.means.we.analyze.patterns.across.many.schedules.without.identifying')}
            </p>
            <ul className="list-disc list-inside mt-4 space-y-2 ml-4">
              <li>{t('ui.improve.schedule.parsing.accuracy')}</li>
              <li>{t('ui.refine.ai.models.for.activity.recognition')}</li>
              <li>{t('ui.develop.better.scheduling.intelligence.features')}</li>
              <li>{t('ui.create.industry.benchmarks.and.insights')}</li>
            </ul>
            <p className="mt-4">{t('ui.your.individual.project.names.company.information.and.specific.schedule.details')}
            </p>
          </section>

          {/* Uploaded Content */}
          <section>
            <h2 className="text-2xl font-bold text-[color:var(--text-primary)] mb-4">{t('ui.6.uploaded.content.and.ownership')}</h2>
            <p>
              <strong className="text-[color:var(--text-primary)]">{t('ui.you.own.your.data')}</strong>{t('ui.all.schedule.files.and.project.information.you.upload.remain.your')}
            </p>
            <p className="mt-4">{t('ui.by.uploading.files.to.the.service.you.grant.irontrack.development')}
            </p>
            <ul className="list-disc list-inside mt-4 space-y-2 ml-4">
              <li>{t('ui.store.and.process.your.files.to.provide.the.service')}</li>
              <li>{t('ui.parse.and.display.schedule.data.in.the.application')}</li>
              <li>{t('ui.use.anonymized.aggregate.insights.derived.from.your.data.as.described')}</li>
            </ul>
            <p className="mt-4">{t('ui.this.license.ends.when.you.delete.your.account.or.remove')}
            </p>
          </section>

          {/* Acceptable Use */}
          <section>
            <h2 className="text-2xl font-bold text-[color:var(--text-primary)] mb-4">{t('ui.7.acceptable.use')}</h2>
            <p>{t('ui.you.agree')} <strong className="text-[color:var(--text-primary)]">{t('ui.not.to')}</strong>:
            </p>
            <ul className="list-disc list-inside mt-4 space-y-2 ml-4">
              <li>{t('ui.upload.malicious.files.viruses.malware.etc')}</li>
              <li>{t('ui.attempt.to.reverse.engineer.or.hack.the.service')}</li>
              <li>{t('ui.share.your.account.credentials.with.others')}</li>
              <li>{t('ui.use.the.service.for.any.illegal.purpose')}</li>
              <li>{t('ui.attempt.to.bypass.usage.limits.or.security.measures')}</li>
              <li>{t('ui.resell.or.redistribute.access.to.the.service')}</li>
            </ul>
          </section>

          {/* Service Availability */}
          <section>
            <h2 className="text-2xl font-bold text-[color:var(--text-primary)] mb-4">{t('ui.8.service.availability')}</h2>
            <p>{t('ui.we.work.hard.to.keep.the.service.running.but.we')} <strong className="text-[color:var(--text-primary)]">{t('ui.do.not.guarantee.100.uptime')}</strong>. {t('ui.the.service.is.provided.as.is.and.may.be.temporarily.unavailable')}
            </p>
            <p className="mt-4">{t('ui.we.may.modify.suspend.or.discontinue.features.at.any.time')}
            </p>
          </section>

          {/* Limitation of Liability */}
          <section>
            <h2 className="text-2xl font-bold text-[color:var(--text-primary)] mb-4">{t('ui.9.limitation.of.liability')}</h2>
            <p>{t('ui.irontrack.project.pulse.is.a.tool.to.help.you.track')} <strong className="text-[color:var(--text-primary)]">{t('ui.not.a.substitute.for.professional.judgment')}</strong>. {t('ui.you.are.responsible.for.verifying.all.schedule.data')}
            </p>
            <p className="mt-4">{t('ui.to.the.maximum.extent.permitted.by.law.irontrack.development.llc')}
            </p>
            <ul className="list-disc list-inside mt-4 space-y-2 ml-4">
              <li>{t('ui.errors.in.schedule.parsing.or.data.display')}</li>
              <li>{t('ui.project.delays.or.financial.losses')}</li>
              <li>{t('ui.data.loss.or.corruption')}</li>
              <li>{t('ui.service.interruptions.or.downtime')}</li>
            </ul>
            <p className="mt-4">{t('ui.our.total.liability.to.you.for.any.claim.is.limited')}
            </p>
          </section>

          {/* Termination */}
          <section>
            <h2 className="text-2xl font-bold text-[color:var(--text-primary)] mb-4">{t('ui.10.termination')}</h2>
            <p>{t('ui.we.may.terminate.or.suspend.your.account.immediately.if.you')}
            </p>
            <ul className="list-disc list-inside mt-4 space-y-2 ml-4">
              <li>{t('ui.sharing.account.credentials')}</li>
              <li>{t('ui.uploading.malicious.content')}</li>
              <li>{t('ui.attempting.to.hack.or.abuse.the.service')}</li>
              <li>{t('ui.chargebacks.or.payment.fraud')}</li>
            </ul>
            <p className="mt-4">{t('ui.you.may.terminate.your.account.at.any.time.by.canceling')} <Link href="/privacy" className="text-[#F97316] hover:text-[#EA580C]">{t('ui.privacy.policy')}</Link>).
            </p>
          </section>

          {/* Governing Law */}
          <section>
            <h2 className="text-2xl font-bold text-[color:var(--text-primary)] mb-4">{t('ui.11.governing.law')}</h2>
            <p>{t('ui.these.terms.are.governed.by.the.laws.of.the.state')}
            </p>
          </section>

          {/* Changes to Terms */}
          <section>
            <h2 className="text-2xl font-bold text-[color:var(--text-primary)] mb-4">{t('ui.12.changes.to.these.terms')}</h2>
            <p>{t('ui.we.may.update.these.terms.from.time.to.time.we')}
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-bold text-[color:var(--text-primary)] mb-4">{t('ui.13.contact')}</h2>
            <p>{t('ui.questions.about.these.terms.contact.us')}
            </p>
            <p className="mt-4">
              <strong className="text-[color:var(--text-primary)]">{t('ui.irontrack.development.llc')}</strong><br />
              <a href="mailto:irontrackdevelopment@outlook.com" className="text-[#F97316] hover:text-[#EA580C]">
                irontrackdevelopment@outlook.com
              </a>
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--border-primary)] py-8 mt-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Building2 className="w-4 h-4 text-[#F97316]" />
            <span className="text-sm text-[color:var(--text-muted)]">{t('ui.2026.irontrack.development.llc.all.rights.reserved')}</span>
          </div>
          <div className="flex items-center justify-center gap-4 text-sm">
            <Link href="/privacy" className="text-[color:var(--text-muted)] hover:text-[#F97316] transition-colors">{t('ui.privacy.policy')}
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
