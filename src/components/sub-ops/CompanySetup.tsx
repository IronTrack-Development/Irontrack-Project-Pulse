"use client";

import { useState } from "react";
import { HardHat, Building2, Save } from "lucide-react";
import { t } from "@/lib/i18n";

const TRADES = [
  { value: "electrical", label: t('ui.electrical') },
  { value: "mechanical", label: t('ui.mechanical') },
  { value: "plumbing", label: t('ui.plumbing') },
  { value: "fire_protection", label: t('ui.fire.protection') },
  { value: "concrete", label: t('ui.concrete') },
  { value: "structural_steel", label: t('ui.structural.steel') },
  { value: "framing", label: t('ui.framing') },
  { value: "drywall", label: t('ui.drywall') },
  { value: "painting", label: t('ui.painting') },
  { value: "flooring", label: t('ui.flooring') },
  { value: "roofing", label: t('ui.roofing') },
  { value: "glazing", label: t('ui.glazing') },
  { value: "landscaping", label: t('ui.landscaping') },
  { value: "earthwork", label: t('ui.earthwork') },
  { value: "other", label: t('ui.other') },
];

interface CompanySetupProps {
  onComplete: (companyId: string) => void;
}

export default function CompanySetup({ onComplete }: CompanySetupProps) {
  const [companyName, setCompanyName] = useState("");
  const [trade, setTrade] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!companyName.trim()) {
      setError(t('ui.company.name.is.required'));
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/sub-ops/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_name: companyName.trim(),
          primary_trade: trade || null,
          contact_name: contactName.trim() || null,
          contact_email: email.trim() || null,
          contact_phone: phone.trim() || null,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const id = data.id || data.company_id;
        localStorage.setItem("sub_ops_company_id", id);
        onComplete(id);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to create company");
      }
    } catch {
      setError(t('ui.network.error.please.try.again'));
    }
    setSaving(false);
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <div className="w-full max-w-lg bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-2xl p-6 md:p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#F97316]/10 mb-2">
            <HardHat size={28} className="text-[#F97316]" />
          </div>
          <h2 className="text-xl font-bold text-[color:var(--text-primary)]">{t('ui.set.up.your.company')}</h2>
          <p className="text-sm text-[color:var(--text-muted)]">{t('ui.create.your.sub.ops.company.to.manage.foremen.dispatches.and')}
          </p>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-[color:var(--text-secondary)] mb-1.5 block">{t('ui.company.name.8599f5')} <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--text-muted)]" />
              <input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder={t('ui.e.g.martinez.electric.llc')}
                className="w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg pl-9 pr-3 py-2.5 text-[color:var(--text-primary)] text-sm focus:outline-none focus:border-[#F97316]/50 placeholder-gray-600"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-[color:var(--text-secondary)] mb-1.5 block">{t('ui.primary.trade')}</label>
            <select
              value={trade}
              onChange={(e) => setTrade(e.target.value)}
              className="w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg px-3 py-2.5 text-[color:var(--text-primary)] text-sm focus:outline-none focus:border-[#F97316]/50 appearance-none"
            >
              <option value="">{t('ui.select.a.trade')}</option>
              {TRADES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-[color:var(--text-secondary)] mb-1.5 block">{t('ui.contact.name')}</label>
              <input
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder={t('ui.your.name')}
                className="w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg px-3 py-2.5 text-[color:var(--text-primary)] text-sm focus:outline-none focus:border-[#F97316]/50 placeholder-gray-600"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[color:var(--text-secondary)] mb-1.5 block">{t('ui.phone')}</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="602-555-1234"
                className="w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg px-3 py-2.5 text-[color:var(--text-primary)] text-sm focus:outline-none focus:border-[#F97316]/50 placeholder-gray-600"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-[color:var(--text-secondary)] mb-1.5 block">{t('ui.email')}</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg px-3 py-2.5 text-[color:var(--text-primary)] text-sm focus:outline-none focus:border-[#F97316]/50 placeholder-gray-600"
            />
          </div>
        </div>

        {error && (
          <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#F97316] hover:bg-[#ea6c0a] disabled:opacity-50 text-[color:var(--text-primary)] rounded-lg text-sm font-bold transition-colors min-h-[44px]"
        >
          <Save size={16} />
          {saving ? t('ui.creating') : t('ui.create.company')}
        </button>
      </div>
    </div>
  );
}
