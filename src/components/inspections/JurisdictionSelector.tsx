"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, Lock, AlertTriangle, X } from "lucide-react";
import { t } from "@/lib/i18n";

interface Jurisdiction {
  id: string;
  name: string;
  type: string;
  county: string;
  phone: string | null;
  portal_url: string | null;
  portal_provider: string | null;
  portal_verified: boolean;
  lat: number;
  lon: number;
}

interface Props {
  projectId: string;
  onLocked: (jurisdiction: Jurisdiction) => void;
}

function providerBadge(provider: string | null) {
  switch (provider) {
    case "accela":
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-500/20 text-blue-400">{t('ui.accela')}</span>;
    case "energov":
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-500/20 text-purple-400">{t('ui.energov')}</span>;
    case "citizenserve":
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-500/20 text-green-400">{t('ui.citizenserve')}</span>;
    case "url":
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-500/20 text-[color:var(--text-secondary)]">{t('ui.url')}</span>;
    case "offline":
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-500/20 text-red-400">{t('ui.offline.a8777a')}</span>;
    default:
      return null;
  }
}

export default function JurisdictionSelector({ projectId, onLocked }: Props) {
  const [jurisdictions, setJurisdictions] = useState<Jurisdiction[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState<Jurisdiction | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/jurisdictions")
      .then((r) => r.json())
      .then((d) => {
        setJurisdictions(d.jurisdictions || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return jurisdictions;
    const q = search.toLowerCase();
    return jurisdictions.filter(
      (j) =>
        j.name.toLowerCase().includes(q) ||
        j.county.toLowerCase().includes(q) ||
        j.type.toLowerCase().includes(q)
    );
  }, [jurisdictions, search]);

  const handleConfirm = async () => {
    if (!confirming) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/inspections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "lock-jurisdiction",
          jurisdiction_id: confirming.id,
          set_by: "user",
        }),
      });
      if (res.ok) {
        onLocked(confirming);
      }
    } finally {
      setSaving(false);
      setConfirming(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-[#F97316] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-[color:var(--text-primary)] mb-2">{t('ui.select.jurisdiction')}</h2>
        <p className="text-sm text-[color:var(--text-secondary)]">{t('ui.choose.the.municipality.for.this.project.this.locks.permanently')}
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--text-muted)]" />
        <input
          type="text"
          placeholder={t('ui.search.arizona.cities.towns.counties')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl text-[color:var(--text-primary)] text-sm placeholder-gray-500 focus:outline-none focus:border-[#F97316] min-h-[44px]"
        />
      </div>

      {/* Results count */}
      <p className="text-xs text-[color:var(--text-muted)] mb-2">
        {filtered.length}{t('ui.jurisdiction')}{filtered.length !== 1 ? t('ui.s') : ""}
      </p>

      {/* Scrollable list */}
      <div className="max-h-[60vh] overflow-y-auto space-y-1 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-2">
        {filtered.map((j) => (
          <button
            key={j.id}
            onClick={() => setConfirming(j)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors text-left min-h-[44px] group"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-[color:var(--text-primary)]">{j.name}</span>
                {providerBadge(j.portal_provider)}
                {j.portal_url && !j.portal_verified && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] text-yellow-500">
                    <AlertTriangle size={10} />{t('ui.unverified')}
                  </span>
                )}
              </div>
              <p className="text-xs text-[color:var(--text-muted)] mt-0.5">
                {j.county}{t('ui.county')}{j.phone ? ` · ${j.phone}` : ""}
              </p>
            </div>
            <Lock size={14} className="text-gray-600 group-hover:text-[#F97316] transition-colors shrink-0 ml-2" />
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="text-center py-8 text-[color:var(--text-muted)] text-sm">{t('ui.no.jurisdictions.match.your.search')}</p>
        )}
      </div>

      {/* Confirmation Dialog */}
      {confirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-2xl p-6 max-w-md w-full shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[color:var(--text-primary)]">{t('ui.confirm.jurisdiction')}</h3>
              <button onClick={() => setConfirming(null)} className="p-1 text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)]">
                <X size={18} />
              </button>
            </div>
            <div className="bg-[var(--bg-primary)] rounded-xl p-4 mb-4">
              <div className="flex items-center gap-2">
                <Lock size={16} className="text-[#F97316]" />
                <span className="text-[color:var(--text-primary)] font-medium">{confirming.name}</span>
              </div>
              <p className="text-xs text-[color:var(--text-muted)] mt-1 ml-6">
                {confirming.county}{t('ui.county')}
                {confirming.phone ? ` · ${confirming.phone}` : ""}
              </p>
            </div>
            <p className="text-sm text-yellow-500 mb-4">{t('ui.lock')} <strong>{confirming.name}</strong>{t('ui.as.the.jurisdiction.for.this.project.this.can.t.be')}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirming(null)}
                className="flex-1 px-4 py-3 bg-[var(--bg-tertiary)] text-[color:var(--text-secondary)] rounded-xl text-sm font-medium hover:bg-[var(--bg-hover)] transition-colors min-h-[44px]"
              >{t('action.cancel')}
              </button>
              <button
                onClick={handleConfirm}
                disabled={saving}
                className="flex-1 px-4 py-3 bg-[#F97316] text-[color:var(--text-primary)] rounded-xl text-sm font-bold hover:bg-[#ea6c10] transition-colors disabled:opacity-50 min-h-[44px]"
              >
                {saving ? t('ui.locking') : t('ui.lock.jurisdiction')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
