"use client";

import { useState } from "react";
import { HardHat, Building2, Save } from "lucide-react";

const TRADES = [
  { value: "electrical", label: "Electrical" },
  { value: "mechanical", label: "Mechanical" },
  { value: "plumbing", label: "Plumbing" },
  { value: "fire_protection", label: "Fire Protection" },
  { value: "concrete", label: "Concrete" },
  { value: "structural_steel", label: "Structural Steel" },
  { value: "framing", label: "Framing" },
  { value: "drywall", label: "Drywall" },
  { value: "painting", label: "Painting" },
  { value: "flooring", label: "Flooring" },
  { value: "roofing", label: "Roofing" },
  { value: "glazing", label: "Glazing" },
  { value: "landscaping", label: "Landscaping" },
  { value: "earthwork", label: "Earthwork" },
  { value: "other", label: "Other" },
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
      setError("Company name is required");
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
      setError("Network error. Please try again.");
    }
    setSaving(false);
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <div className="w-full max-w-lg bg-[#121217] border border-[#1F1F25] rounded-2xl p-6 md:p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#F97316]/10 mb-2">
            <HardHat size={28} className="text-[#F97316]" />
          </div>
          <h2 className="text-xl font-bold text-[color:var(--text-primary)]">Set Up Your Company</h2>
          <p className="text-sm text-[color:var(--text-muted)]">
            Create your sub ops company to manage foremen, dispatches, and production tracking.
          </p>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-[color:var(--text-secondary)] mb-1.5 block">
              Company Name <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--text-muted)]" />
              <input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g., Martinez Electric LLC"
                className="w-full bg-[#0B0B0D] border border-[#1F1F25] rounded-lg pl-9 pr-3 py-2.5 text-[color:var(--text-primary)] text-sm focus:outline-none focus:border-[#F97316]/50 placeholder-gray-600"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-[color:var(--text-secondary)] mb-1.5 block">Primary Trade</label>
            <select
              value={trade}
              onChange={(e) => setTrade(e.target.value)}
              className="w-full bg-[#0B0B0D] border border-[#1F1F25] rounded-lg px-3 py-2.5 text-[color:var(--text-primary)] text-sm focus:outline-none focus:border-[#F97316]/50 appearance-none"
            >
              <option value="">Select a trade...</option>
              {TRADES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-[color:var(--text-secondary)] mb-1.5 block">Contact Name</label>
              <input
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Your name"
                className="w-full bg-[#0B0B0D] border border-[#1F1F25] rounded-lg px-3 py-2.5 text-[color:var(--text-primary)] text-sm focus:outline-none focus:border-[#F97316]/50 placeholder-gray-600"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[color:var(--text-secondary)] mb-1.5 block">Phone</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="602-555-1234"
                className="w-full bg-[#0B0B0D] border border-[#1F1F25] rounded-lg px-3 py-2.5 text-[color:var(--text-primary)] text-sm focus:outline-none focus:border-[#F97316]/50 placeholder-gray-600"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-[color:var(--text-secondary)] mb-1.5 block">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="w-full bg-[#0B0B0D] border border-[#1F1F25] rounded-lg px-3 py-2.5 text-[color:var(--text-primary)] text-sm focus:outline-none focus:border-[#F97316]/50 placeholder-gray-600"
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
          {saving ? "Creating..." : "Create Company"}
        </button>
      </div>
    </div>
  );
}
