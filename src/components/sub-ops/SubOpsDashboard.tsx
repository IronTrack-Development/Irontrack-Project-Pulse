"use client";

import { useState, useEffect, useCallback } from "react";
import {
  HardHat, Send, Users, AlertTriangle, TrendingUp, FileText,
  ChevronRight, Plus, Clock, CheckCircle,
} from "lucide-react";
import CompanySetup from "./CompanySetup";
import { useTranslation } from "@/lib/i18n";

const { t } = useTranslation();

interface Props {
  projectId: string;
}

interface Company {
  id: string;
  company_name: string;
  primary_trade: string | null;
}

interface DashboardData {
  dispatches: { total: number; acknowledged: number; pending: number };
  foremen: { id: string; name: string; trade: string; status: string; current_job: string | null }[];
  blockers: { open_count: number };
  production: { total_entries: number; total_crew_hours: number };
  sops: { compliant_foremen: number; total_foremen: number };
}

const STATUS_ICON: Record<string, React.ReactNode> = {
  checked_in: <span title={t('ui.checked.in')}>✅</span>,
  not_yet: <span title={t('ui.not.yet')}>⏳</span>,
  off: <span title={t('ui.off')}>🔴</span>,
};

export default function SubOpsDashboard({ projectId }: Props) {
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("sub_ops_company_id");
    setCompanyId(stored);
    setReady(true);
  }, []);

  const fetchDashboard = useCallback(async (cId: string) => {
    setLoading(true);
    try {
      const [compRes, dashRes] = await Promise.all([
        fetch(`/api/sub-ops/companies/${cId}`),
        fetch(`/api/sub-ops/companies/${cId}/dashboard`),
      ]);
      if (compRes.ok) setCompany(await compRes.json());
      if (dashRes.ok) setData(await dashRes.json());
    } catch {
      // API may not exist yet — show empty state
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (companyId) fetchDashboard(companyId);
    else setLoading(false);
  }, [companyId, fetchDashboard]);

  if (!ready) return null;

  if (!companyId) {
    return (
      <CompanySetup
        onComplete={(id) => {
          setCompanyId(id);
          fetchDashboard(id);
        }}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="w-6 h-6 border-2 border-[#F97316] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const dispatches = data?.dispatches ?? { total: 0, acknowledged: 0, pending: 0 };
  const foremen = data?.foremen ?? [];
  const blockers = data?.blockers ?? { open_count: 0 };
  const production = data?.production ?? { total_entries: 0, total_crew_hours: 0 };
  const sops = data?.sops ?? { compliant_foremen: 0, total_foremen: 0 };

  return (
    <div className="space-y-4">
      {/* Company Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#F97316]/10 flex items-center justify-center">
            <HardHat size={20} className="text-[#F97316]" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[color:var(--text-primary)]">{company?.company_name ?? t('nav.subOps')}</h2>
            {company?.primary_trade && (
              <p className="text-xs text-[color:var(--text-muted)] capitalize">{company.primary_trade.replace(/_/g, " ")}</p>
            )}
          </div>
        </div>
      </div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">

        {/* Today's Dispatch Summary */}
        <div className="bg-[#121217] border border-[#1F1F25] rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Send size={14} className="text-[#F97316]" />
              <span className="text-xs font-semibold text-[color:var(--text-secondary)]">{t('ui.today.s.dispatches')}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-[color:var(--text-primary)]">{dispatches.total}</p>
              <p className="text-[10px] text-[color:var(--text-muted)]">{t('ui.sent.35f49d')}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-400">{dispatches.acknowledged}</p>
              <p className="text-[10px] text-[color:var(--text-muted)]">{t('dispatch.acknowledged')}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-400">{dispatches.pending}</p>
              <p className="text-[10px] text-[color:var(--text-muted)]">{t('status.pending')}</p>
            </div>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-2 bg-[#F97316] hover:bg-[#ea6c0a] text-[color:var(--text-primary)] rounded-lg text-xs font-semibold transition-colors w-full justify-center min-h-[44px]">
            <Plus size={14} />{t('ui.create.dispatch')}
          </button>
        </div>

        {/* Open Blockers */}
        <div className="bg-[#121217] border border-[#1F1F25] rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle size={14} className="text-[#F97316]" />
            <span className="text-xs font-semibold text-[color:var(--text-secondary)]">{t('ui.open.blockers')}</span>
          </div>
          <p className="text-2xl font-bold text-[color:var(--text-primary)]">{blockers.open_count}</p>
          {blockers.open_count > 0 ? (
            <p className="text-xs text-orange-400">
              {blockers.open_count}{t('ui.blocker')}{blockers.open_count !== 1 ? t('ui.s') : ""}{t('ui.need.attention')}
            </p>
          ) : (
            <p className="text-xs text-green-400">{t('ui.all.clear.no.open.blockers.3a1718')}</p>
          )}
        </div>

        {/* This Week's Production */}
        <div className="bg-[#121217] border border-[#1F1F25] rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp size={14} className="text-[#F97316]" />
            <span className="text-xs font-semibold text-[color:var(--text-secondary)]">{t('ui.this.week.s.production')}</span>
          </div>
          <div className="flex items-center gap-4">
            <div>
              <p className="text-2xl font-bold text-[color:var(--text-primary)]">{production.total_crew_hours}</p>
              <p className="text-[10px] text-[color:var(--text-muted)]">{t('ui.crew.hours.5131d4')}</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-[color:var(--text-primary)]">{production.total_entries}</p>
              <p className="text-[10px] text-[color:var(--text-muted)]">{t('ui.entries')}</p>
            </div>
          </div>
        </div>

        {/* SOP Compliance */}
        <div className="bg-[#121217] border border-[#1F1F25] rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <FileText size={14} className="text-[#F97316]" />
            <span className="text-xs font-semibold text-[color:var(--text-secondary)]">{t('ui.sop.compliance')}</span>
          </div>
          <p className="text-sm text-[color:var(--text-secondary)]">
            <span className="text-[color:var(--text-primary)] font-bold">{sops.compliant_foremen}</span>{t('ui.of')}{" "}
            <span className="text-[color:var(--text-primary)] font-bold">{sops.total_foremen}</span>{t('ui.foremen.have.acknowledged.all.required.sops')}
          </p>
        </div>
      </div>

      {/* Foreman Status Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users size={14} className="text-[#F97316]" />
            <span className="text-sm font-semibold text-[color:var(--text-primary)]">{t('ui.foreman.status')}</span>
          </div>
          <span className="text-xs text-[color:var(--text-muted)]">{foremen.length}{t('ui.foremen.7bd3b0')}</span>
        </div>

        {foremen.length === 0 ? (
          <div className="bg-[#121217] border border-[#1F1F25] rounded-xl p-6 text-center">
            <Users size={24} className="mx-auto text-gray-600 mb-2" />
            <p className="text-sm text-[color:var(--text-secondary)]">{t('ui.no.foremen.added.yet')}</p>
            <p className="text-xs text-gray-600 mt-1">{t('ui.add.foremen.from.the.foremen.tab.to.get.started')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {foremen.map((f) => (
              <div
                key={f.id}
                className="bg-[#121217] border border-[#1F1F25] rounded-xl p-3 hover:border-[#F97316]/30 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-[color:var(--text-primary)] truncate">{f.name}</span>
                  {STATUS_ICON[f.status] ?? STATUS_ICON.not_yet}
                </div>
                <p className="text-xs text-[color:var(--text-muted)] capitalize">{f.trade?.replace(/_/g, " ") ?? "—"}</p>
                {f.current_job && (
                  <p className="text-xs text-[color:var(--text-secondary)] mt-1 truncate">
                    <Clock size={10} className="inline mr-1" />
                    {f.current_job}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
