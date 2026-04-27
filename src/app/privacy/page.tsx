"use client";

import Link from "next/link";
import { Building2, ArrowLeft } from "lucide-react";
import { t } from "@/lib/i18n";

export default function PrivacyPage() {
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

        <h1 className="text-4xl font-bold text-[color:var(--text-primary)] mb-4">{t('ui.privacy.policy')}</h1>
        <p className="text-[color:var(--text-secondary)] mb-8">{t('ui.last.updated.april.10.2026')}</p>

        <div className="space-y-8 text-[color:var(--text-secondary)] leading-relaxed">
          {/* Introduction */}
          <section>
            <p>{t('ui.irontrack.development.llc.we.us.our.operates.irontrack.project.pulse')}
            </p>
            <p className="mt-4">{t('ui.we.take.your.privacy.seriously.this.policy.is.written.in')}
            </p>
          </section>

          {/* What We Collect */}
          <section>
            <h2 className="text-2xl font-bold text-[color:var(--text-primary)] mb-4">{t('ui.1.what.data.we.collect')}</h2>
            <p>{t('ui.when.you.use.irontrack.project.pulse.we.collect')}
            </p>
            <ul className="list-disc list-inside mt-4 space-y-2 ml-4">
              <li><strong className="text-[color:var(--text-primary)]">{t('ui.email.address')}</strong>{t('ui.for.your.account.and.login')}</li>
              <li><strong className="text-[color:var(--text-primary)]">{t('ui.password.hashed')}</strong>{t('ui.we.never.store.your.actual.password.only.a.secure.hash')}</li>
              <li><strong className="text-[color:var(--text-primary)]">{t('ui.uploaded.schedule.files')}</strong>{t('ui.mpp.xlsx.csv.xml.xer.files.you.upload')}</li>
              <li><strong className="text-[color:var(--text-primary)]">{t('ui.usage.data')}</strong>{t('ui.when.you.log.in.which.features.you.use.error.logs')}</li>
              <li><strong className="text-[color:var(--text-primary)]">{t('ui.payment.information')}</strong>{t('ui.handled.entirely.by.stripe.we.never.see.your.credit.card')}</li>
            </ul>
          </section>

          {/* How We Use Data */}
          <section>
            <h2 className="text-2xl font-bold text-[color:var(--text-primary)] mb-4">{t('ui.2.how.we.use.your.data')}</h2>
            <p>{t('ui.we.use.your.data.to')}
            </p>
            <ul className="list-disc list-inside mt-4 space-y-2 ml-4">
              <li><strong className="text-[color:var(--text-primary)]">{t('ui.provide.the.service')}</strong>{t('ui.parse.your.schedules.display.lookaheads.track.milestones')}</li>
              <li><strong className="text-[color:var(--text-primary)]">{t('ui.manage.your.account')}</strong>{t('ui.authentication.subscription.session.management')}</li>
              <li><strong className="text-[color:var(--text-primary)]">{t('ui.process.billing')}</strong>{t('ui.charge.your.subscription.via.stripe')}</li>
              <li><strong className="text-[color:var(--text-primary)]">{t('ui.improve.the.platform')}</strong>{t('ui.analyze.anonymized.aggregate.data.see.below')}</li>
              <li><strong className="text-[color:var(--text-primary)]">{t('ui.communicate.with.you')}</strong>{t('ui.respond.to.support.requests.send.important.updates')}</li>
            </ul>
          </section>

          {/* Aggregate Data */}
          <section>
            <h2 className="text-2xl font-bold text-[color:var(--text-primary)] mb-4">{t('ui.3.aggregate.data.and.intelligence')}</h2>
            <p className="bg-[var(--bg-tertiary)] border border-[#2A2A30] rounded-lg p-6">
              <strong className="text-[color:var(--text-primary)]">{t('ui.we.analyze.uploaded.schedules.in.anonymized.aggregate.form.to.improve')}</strong>{t('ui.this.aggregate.data.contains.no.personally.identifiable.information.and.cannot')}
            </p>
            <p className="mt-4">{t('ui.here.s.what.that.means.in.practice')}
            </p>
            <ul className="list-disc list-inside mt-4 space-y-2 ml-4">
              <li>{t('ui.we.look.at.patterns.across.thousands.of.schedules.to.improve')}</li>
              <li>{t('ui.we.analyze.common.activity.types.to.build.better.scheduling.intelligence')}</li>
              <li>{t('ui.we.study.typical.project.durations.and.milestones.to.refine.our')}</li>
              <li>{t('ui.we.create.industry.benchmarks.e.g.average.time.for.rough')}</li>
            </ul>
            <p className="mt-4">
              <strong className="text-[color:var(--text-primary)]">{t('ui.what.we.do.not.do')}</strong>
            </p>
            <ul className="list-disc list-inside mt-4 space-y-2 ml-4">
              <li>{t('ui.share.your.specific.project.names.company.info.or.schedule.details')}</li>
              <li>{t('ui.sell.your.data.to.third.parties')}</li>
              <li>{t('ui.identify.you.or.your.projects.in.aggregate.data')}</li>
              <li>{t('ui.use.your.data.for.advertising.or.marketing.purposes')}</li>
            </ul>
          </section>

          {/* Data Storage */}
          <section>
            <h2 className="text-2xl font-bold text-[color:var(--text-primary)] mb-4">{t('ui.4.data.storage')}</h2>
            <p>{t('ui.your.data.is.stored.securely.using')}
            </p>
            <ul className="list-disc list-inside mt-4 space-y-2 ml-4">
              <li><strong className="text-[color:var(--text-primary)]">{t('ui.supabase.postgresql')}</strong>{t('ui.cloud.database.for.user.accounts.and.project.data')}</li>
              <li><strong className="text-[color:var(--text-primary)]">{t('ui.vercel')}</strong>{t('ui.serverless.hosting.for.the.application')}</li>
              <li><strong className="text-[color:var(--text-primary)]">{t('ui.stripe')}</strong>{t('ui.payment.processing.pci.compliant')}</li>
            </ul>
            <p className="mt-4">{t('ui.all.data.is.encrypted.in.transit.https.and.at.rest')}
            </p>
          </section>

          {/* Third Party Services */}
          <section>
            <h2 className="text-2xl font-bold text-[color:var(--text-primary)] mb-4">{t('ui.5.third.party.services')}</h2>
            <p>{t('ui.we.use.these.third.party.services.to.operate.irontrack.project')}
            </p>
            <ul className="list-disc list-inside mt-4 space-y-2 ml-4">
              <li><strong className="text-[color:var(--text-primary)]">{t('ui.supabase')}</strong>{t('ui.database.and.authentication')}</li>
              <li><strong className="text-[color:var(--text-primary)]">{t('ui.vercel')}</strong>{t('ui.hosting.and.deployment')}</li>
              <li><strong className="text-[color:var(--text-primary)]">{t('ui.stripe')}</strong>{t('ui.payment.processing')}</li>
              <li><strong className="text-[color:var(--text-primary)]">{t('ui.anthropic.claude.ai')}</strong>{t('ui.schedule.file.parsing')}</li>
            </ul>
            <p className="mt-4">{t('ui.each.service.has.its.own.privacy.policy.we.chose.these')}
            </p>
          </section>

          {/* Data Retention */}
          <section>
            <h2 className="text-2xl font-bold text-[color:var(--text-primary)] mb-4">{t('ui.6.data.retention')}</h2>
            <p>
              <strong className="text-[color:var(--text-primary)]">{t('ui.active.accounts')}</strong>{t('ui.we.keep.your.data.as.long.as.your.account.is')}
            </p>
            <p className="mt-4">
              <strong className="text-[color:var(--text-primary)]">{t('ui.deleted.accounts')}</strong>{t('ui.when.you.delete.your.account.we.remove.your.personal.data')} <strong className="text-[color:var(--text-primary)]">{t('ui.30.days')}</strong>.
            </p>
            <p className="mt-4">{t('ui.note.anonymized.aggregate.insights.derived.from.your.data.with.no')}
            </p>
          </section>

          {/* User Rights */}
          <section>
            <h2 className="text-2xl font-bold text-[color:var(--text-primary)] mb-4">{t('ui.7.your.rights')}</h2>
            <p>{t('ui.you.have.the.right.to')}
            </p>
            <ul className="list-disc list-inside mt-4 space-y-2 ml-4">
              <li><strong className="text-[color:var(--text-primary)]">{t('ui.access.your.data')}</strong>{t('ui.request.a.copy.of.what.we.have')}</li>
              <li><strong className="text-[color:var(--text-primary)]">{t('ui.export.your.data')}</strong>{t('ui.download.your.uploaded.schedules')}</li>
              <li><strong className="text-[color:var(--text-primary)]">{t('ui.delete.your.data')}</strong>{t('ui.close.your.account.and.have.data.removed')}</li>
              <li><strong className="text-[color:var(--text-primary)]">{t('ui.correct.your.data')}</strong>{t('ui.update.inaccurate.information')}</li>
            </ul>
            <p className="mt-4">{t('ui.to.exercise.these.rights.contact.us.at')}{" "}
              <a href="mailto:irontrackdevelopment@outlook.com" className="text-[#F97316] hover:text-[#EA580C]">
                irontrackdevelopment@outlook.com
              </a>.
            </p>
          </section>

          {/* Security */}
          <section>
            <h2 className="text-2xl font-bold text-[color:var(--text-primary)] mb-4">{t('ui.8.security.measures')}</h2>
            <p>{t('ui.we.protect.your.data.with')}
            </p>
            <ul className="list-disc list-inside mt-4 space-y-2 ml-4">
              <li><strong className="text-[color:var(--text-primary)]">{t('ui.encryption.in.transit')}</strong>{t('ui.all.data.sent.over.https')}</li>
              <li><strong className="text-[color:var(--text-primary)]">{t('ui.encryption.at.rest')}</strong>{t('ui.database.and.file.storage.encrypted')}</li>
              <li><strong className="text-[color:var(--text-primary)]">{t('ui.row.level.security.rls')}</strong>{t('ui.database.policies.ensure.users.only.access.their.own.data')}</li>
              <li><strong className="text-[color:var(--text-primary)]">{t('ui.single.session.enforcement')}</strong>{t('ui.prevents.account.sharing.and.unauthorized.access')}</li>
              <li><strong className="text-[color:var(--text-primary)]">{t('ui.password.hashing')}</strong>{t('ui.we.never.store.plain.text.passwords')}</li>
            </ul>
            <p className="mt-4">{t('ui.no.system.is.100.secure.but.we.follow.industry.best')}
            </p>
          </section>

          {/* Cookies */}
          <section>
            <h2 className="text-2xl font-bold text-[color:var(--text-primary)] mb-4">{t('ui.9.cookies')}</h2>
            <p>{t('ui.we.use.cookies.only.for')} <strong className="text-[color:var(--text-primary)]">{t('ui.authentication')}</strong>{t('ui.supabase.session.cookies.we.do.not.use.tracking.cookies.advertising')}
            </p>
          </section>

          {/* Children */}
          <section>
            <h2 className="text-2xl font-bold text-[color:var(--text-primary)] mb-4">{t('ui.10.children')}</h2>
            <p>{t('ui.irontrack.project.pulse.is.not.intended.for.users.under.18')}
            </p>
          </section>

          {/* Changes to Policy */}
          <section>
            <h2 className="text-2xl font-bold text-[color:var(--text-primary)] mb-4">{t('ui.11.changes.to.this.policy')}</h2>
            <p>{t('ui.we.may.update.this.privacy.policy.from.time.to.time')}
            </p>
            <p className="mt-4">{t('ui.for.significant.changes.like.new.data.uses.we.will.notify')}
            </p>
          </section>

          {/* Governing Law */}
          <section>
            <h2 className="text-2xl font-bold text-[color:var(--text-primary)] mb-4">{t('ui.12.governing.law')}</h2>
            <p>{t('ui.this.privacy.policy.is.governed.by.the.laws.of.the')}
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-bold text-[color:var(--text-primary)] mb-4">{t('ui.13.contact')}</h2>
            <p>{t('ui.questions.about.this.privacy.policy.or.how.we.handle.your')}
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
            <Link href="/terms" className="text-[color:var(--text-muted)] hover:text-[#F97316] transition-colors">{t('ui.terms.of.service')}
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
