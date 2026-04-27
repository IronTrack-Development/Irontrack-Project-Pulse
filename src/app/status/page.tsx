import { CheckCircle, AlertTriangle, XCircle, Clock } from "lucide-react";
import Link from "next/link";
import { Building2 } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

const { t } = useTranslation();

const services = [
  { name: t('ui.web.application'), status: "operational", description: t('ui.irontrackpulse.com') },
  { name: t('ui.schedule.upload.and.processing'), status: "operational", description: t('ui.file.parsing.column.mapping.data.import') },
  { name: t('ui.risk.detection.engine'), status: "operational", description: t('ui.automated.risk.scanning.and.alerts') },
  { name: t('ui.database.supabase'), status: "operational", description: t('ui.data.storage.and.real.time.sync') },
  { name: t('ui.authentication.ee1acf'), status: "operational", description: t('ui.sign.up.sign.in.session.management') },
  { name: t('ui.ios.app'), status: "coming_soon", description: t('ui.native.ios.application') },
  { name: t('ui.android.app'), status: "coming_soon", description: t('ui.native.android.application') },
];

type ServiceStatus = "operational" | "degraded" | "offline" | "coming_soon";

function StatusBadge({ status }: { status: ServiceStatus }) {
  if (status === "operational") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20"
        style={{ boxShadow: "0 0 8px rgba(34,197,94,0.15)" }}>
        <span className="w-1.5 h-1.5 rounded-full bg-green-400" style={{ boxShadow: "0 0 4px rgba(34,197,94,0.8)" }} />{t('ui.operational')}
      </span>
    );
  }
  if (status === "degraded") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
        style={{ boxShadow: "0 0 8px rgba(234,179,8,0.15)" }}>
        <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" style={{ boxShadow: "0 0 4px rgba(234,179,8,0.8)" }} />{t('ui.degraded')}
      </span>
    );
  }
  if (status === "offline") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
        <span className="w-1.5 h-1.5 rounded-full bg-red-400" />{t('ui.offline')}
      </span>
    );
  }
  // coming_soon
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gray-500/10 text-[color:var(--text-secondary)] border border-gray-500/20">
      <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />{t('ui.coming.soon')}
    </span>
  );
}

function OverallStatusIcon({ allOperational }: { allOperational: boolean }) {
  if (allOperational) return <CheckCircle className="w-6 h-6 text-green-400" />;
  return <AlertTriangle className="w-6 h-6 text-yellow-400" />;
}

export default function StatusPage() {
  const activeServices = services.filter(s => s.status !== "coming_soon");
  const allOperational = activeServices.every(s => s.status === "operational");

  // Static "last checked" — in production this would be dynamic
  const lastChecked = "April 13, 2026 at 2:00 AM MST";

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Header */}
      <header className="border-b border-[var(--border-primary)] bg-[var(--bg-primary)] sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 md:gap-3">
            <div className="relative" style={{ marginTop: "4px", marginBottom: "-12px" }}>
              <img
                src="/logo-irontrack.png"
                alt={t('ui.irontrack.logo')}
                className="h-10 md:h-20 w-auto object-contain"
                style={{ filter: "drop-shadow(0 0 12px rgba(249,115,22,0.4))" }}
              />
            </div>
            <span className="text-lg md:text-xl font-bold text-[color:var(--text-primary)]">{t('ui.irontrack')}<span className="hidden md:inline">{t('ui.project.pulse')}</span>
            </span>
          </Link>
          <Link href="/" className="text-sm text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] transition-colors flex items-center gap-1">{t('ui.back.to.home.054e10')}
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 md:px-6 py-12 md:py-16">
        {/* Page Title */}
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-[color:var(--text-primary)] mb-2">{t('ui.system.status')}</h1>
          <p className="text-[color:var(--text-secondary)]">{t('ui.current.health.of.irontrack.project.pulse.services')}</p>
        </div>

        {/* Overall Status Banner */}
        <div className={`rounded-xl border px-6 py-4 mb-10 flex items-center gap-3 ${
          allOperational
            ? "bg-green-500/10 border-green-500/20"
            : "bg-yellow-500/10 border-yellow-500/20"
        }`}
          style={allOperational ? { boxShadow: "0 0 24px rgba(34,197,94,0.08)" } : {}}>
          <OverallStatusIcon allOperational={allOperational} />
          <div>
            <p className={`font-semibold text-lg ${allOperational ? "text-green-400" : "text-yellow-400"}`}>
              {allOperational ? t('ui.all.systems.operational') : t('ui.some.systems.degraded')}
            </p>
            <p className="text-sm text-[color:var(--text-secondary)]">{t('ui.99.9.uptime.last.30.days')}</p>
          </div>
        </div>

        {/* Service List */}
        <div className="bg-[#121217] border border-[#1F1F25] rounded-2xl overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-[#1F1F25]">
            <h2 className="text-sm font-semibold text-[color:var(--text-secondary)] uppercase tracking-wider">{t('ui.services')}</h2>
          </div>
          <div className="divide-y divide-[#1F1F25]">
            {services.map((service) => (
              <div key={service.name} className="flex items-center justify-between px-6 py-4 hover:bg-white/[0.02] transition-colors">
                <div>
                  <p className="text-[color:var(--text-primary)] font-medium">{service.name}</p>
                  <p className="text-sm text-[color:var(--text-muted)] mt-0.5">{service.description}</p>
                </div>
                <StatusBadge status={service.status as ServiceStatus} />
              </div>
            ))}
          </div>
        </div>

        {/* Last Checked */}
        <div className="flex items-center gap-2 text-sm text-[color:var(--text-muted)]">
          <Clock className="w-4 h-4" />
          <span>{t('ui.last.checked')} {lastChecked}</span>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--border-primary)] py-6 mt-12">
        <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#F97316]" />
            <span className="text-sm text-[color:var(--text-muted)]">{t('ui.2026.irontrack.development.llc.all.rights.reserved')}</span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/terms" className="text-[color:var(--text-muted)] hover:text-[#F97316] transition-colors">{t('ui.terms')}</Link>
            <span className="text-gray-700">•</span>
            <Link href="/privacy" className="text-[color:var(--text-muted)] hover:text-[#F97316] transition-colors">{t('ui.privacy')}</Link>
            <span className="text-gray-700">•</span>
            <Link href="/release-notes" className="text-[color:var(--text-muted)] hover:text-[#F97316] transition-colors">{t('ui.release.notes')}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
