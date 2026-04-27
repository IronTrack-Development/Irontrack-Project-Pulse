"use client";

import { useEffect, useState, use } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, CheckCircle2, ChevronRight, Users } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

const { t } = useTranslation();

const ROLE_OPTIONS = [
  { value: "architect", label: t('ui.architect') },
  { value: "engineer", label: t('ui.engineer') },
  { value: "subcontractor", label: t('ui.subcontractor') },
  { value: "supplier", label: t('ui.supplier') },
  { value: "owner", label: t('ui.owner') },
  { value: "owners_rep", label: t('ui.owner.s.rep') },
  { value: "inspector", label: t('ui.inspector') },
  { value: "internal", label: t('ui.internal') },
  { value: "other", label: t('ui.other') },
];

type Step = "loading" | "error" | "form" | "success";

export default function DirectoryJoinPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [step, setStep] = useState<Step>("loading");
  const [projectName, setProjectName] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Form fields
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");
  const [trade, setTrade] = useState("");
  const [discipline, setDiscipline] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      setErrorMsg("Invalid or missing link. Please scan the QR code again.");
      setStep("error");
      return;
    }

    const validate = async () => {
      try {
        const res = await fetch(
          `/api/join/${projectId}/directory?token=${encodeURIComponent(token)}`
        );
        if (res.ok) {
          const data = await res.json();
          setProjectName(data.project_name);
          setStep("form");
        } else {
          const data = await res.json().catch(() => ({}));
          setErrorMsg(data.error ?? "Invalid or expired link.");
          setStep("error");
        }
      } catch {
        setErrorMsg("Unable to connect. Please check your connection.");
        setStep("error");
      }
    };

    validate();
  }, [projectId, token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setSubmitError("Name is required"); return; }
    if (!role) { setSubmitError("Please select your role"); return; }

    setSubmitting(true);
    setSubmitError("");

    try {
      const res = await fetch(`/api/join/${projectId}/directory`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          name: name.trim(),
          company: company.trim() || undefined,
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          role,
          trade: trade.trim() || undefined,
          discipline: discipline.trim() || undefined,
        }),
      });

      if (res.ok) {
        setStep("success");
      } else {
        const data = await res.json().catch(() => ({}));
        setSubmitError(data.error ?? "Something went wrong. Please try again.");
      }
    } catch {
      setSubmitError("Network error. Please check your connection.");
    }

    setSubmitting(false);
  };

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (step === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-[#F97316]" />
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────────
  if (step === "error") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-5 py-8">
        <div className="w-full max-w-sm text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
            <Users size={28} className="text-red-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[color:var(--text-primary)] mb-2">{t('ui.link.error')}</h1>
            <p className="text-sm text-[color:var(--text-secondary)]">{errorMsg}</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Success ──────────────────────────────────────────────────────────────────
  if (step === "success") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-5 py-8">
        <div className="w-full max-w-sm space-y-7">
          {/* Icon */}
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="w-20 h-20 rounded-3xl bg-[#22C55E]/10 border border-[#22C55E]/20 flex items-center justify-center">
              <CheckCircle2 size={40} className="text-[#22C55E]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[color:var(--text-primary)] leading-tight">{t('ui.you.re.in.the.directory')}
              </h1>
              <p className="text-sm text-[color:var(--text-secondary)] mt-2">{t('ui.you.ve.been.added.to')}{" "}
                <span className="text-[color:var(--text-primary)] font-semibold">{projectName}</span>
              </p>
            </div>
          </div>

          {/* Info */}
          <div className="bg-[#121217] border border-[#1F1F25] rounded-2xl p-5 space-y-3">
            <p className="text-xs font-semibold text-[#F97316] uppercase tracking-wider">{t('ui.what.s.next')}
            </p>
            <ul className="space-y-2 text-xs text-[color:var(--text-secondary)]">
              <li className="flex items-start gap-2">
                <span className="text-[#F97316] flex-none mt-0.5">→</span>{t('ui.your.contact.info.is.now.in.the.project.directory')}
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#F97316] flex-none mt-0.5">→</span>{t('ui.the.project.team.can.reach.you.directly.from.the.directory')}
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#F97316] flex-none mt-0.5">→</span>{t('ui.you.can.close.this.page.you.re.all.set')}
              </li>
            </ul>
          </div>

          <p className="text-[11px] text-gray-600 text-center">{t('ui.powered.by.irontrack.pulse')}
          </p>
        </div>
      </div>
    );
  }

  // ── Form ─────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col items-center justify-start px-5 py-8">
      <div className="w-full max-w-sm space-y-7">
        {/* Brand header */}
        <div className="flex flex-col items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icon-192.png"
            alt={t('ui.irontrack.pulse')}
            className="w-14 h-14 rounded-2xl object-contain shadow-lg shadow-black/30"
          />
          <p className="text-xs font-semibold text-[color:var(--text-muted)] tracking-widest uppercase">{t('ui.irontrack.pulse')}
          </p>
        </div>

        {/* Title */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[color:var(--text-primary)] leading-tight">{t('ui.join')} {projectName}
          </h1>
          <p className="text-sm text-[color:var(--text-secondary)] mt-1">{t('ui.add.yourself.to.the.project.directory')}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[color:var(--text-secondary)] uppercase tracking-wide">{t('ui.your.name.60e93b')}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('ui.full.name')}
              required
              autoComplete="name"
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl px-4 py-4 text-[color:var(--text-primary)] text-base placeholder-gray-600 focus:outline-none focus:border-[#F97316] focus:ring-1 focus:ring-[#F97316]/30 transition min-h-[52px]"
            />
          </div>

          {/* Company */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[color:var(--text-secondary)] uppercase tracking-wide">{t('settings.company')}
            </label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder={t('ui.company.name')}
              autoComplete="organization"
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl px-4 py-4 text-[color:var(--text-primary)] text-base placeholder-gray-600 focus:outline-none focus:border-[#F97316] focus:ring-1 focus:ring-[#F97316]/30 transition min-h-[52px]"
            />
          </div>

          {/* Role */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[color:var(--text-secondary)] uppercase tracking-wide">{t('ui.your.role')}
            </label>
            <select
              value={role}
              onChange={(e) => { setRole(e.target.value); setTrade(""); setDiscipline(""); }}
              required
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl px-4 py-4 text-[color:var(--text-primary)] text-base focus:outline-none focus:border-[#F97316] focus:ring-1 focus:ring-[#F97316]/30 transition min-h-[52px]"
            >
              <option value="" disabled>{t('ui.select.your.role')}</option>
              {ROLE_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          {/* Trade — subcontractor only */}
          {role === "subcontractor" && (
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[color:var(--text-secondary)] uppercase tracking-wide">{t('ui.trade')}
              </label>
              <input
                type="text"
                value={trade}
                onChange={(e) => setTrade(e.target.value)}
                placeholder={t('ui.e.g.electrical.plumbing.hvac')}
                className="w-full bg-[#121217] border border-[#1F1F25] rounded-xl px-4 py-4 text-[color:var(--text-primary)] text-base placeholder-gray-600 focus:outline-none focus:border-[#F97316] focus:ring-1 focus:ring-[#F97316]/30 transition min-h-[52px]"
              />
            </div>
          )}

          {/* Discipline — engineer only */}
          {role === "engineer" && (
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[color:var(--text-secondary)] uppercase tracking-wide">{t('ui.discipline')}
              </label>
              <input
                type="text"
                value={discipline}
                onChange={(e) => setDiscipline(e.target.value)}
                placeholder={t('ui.e.g.structural.mep.civil')}
                className="w-full bg-[#121217] border border-[#1F1F25] rounded-xl px-4 py-4 text-[color:var(--text-primary)] text-base placeholder-gray-600 focus:outline-none focus:border-[#F97316] focus:ring-1 focus:ring-[#F97316]/30 transition min-h-[52px]"
              />
            </div>
          )}

          {/* Email */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[color:var(--text-secondary)] uppercase tracking-wide">{t('ui.email')}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              autoComplete="email"
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl px-4 py-4 text-[color:var(--text-primary)] text-base placeholder-gray-600 focus:outline-none focus:border-[#F97316] focus:ring-1 focus:ring-[#F97316]/30 transition min-h-[52px]"
            />
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[color:var(--text-secondary)] uppercase tracking-wide">{t('ui.phone')}
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="602-555-1234"
              autoComplete="tel"
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl px-4 py-4 text-[color:var(--text-primary)] text-base placeholder-gray-600 focus:outline-none focus:border-[#F97316] focus:ring-1 focus:ring-[#F97316]/30 transition min-h-[52px]"
            />
          </div>

          {submitError && (
            <div className="bg-red-900/20 border border-red-700/30 rounded-xl px-4 py-3">
              <p className="text-sm text-red-400">{submitError}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !name.trim() || !role}
            className="w-full flex items-center justify-center gap-2 bg-[#F97316] hover:bg-[#ea6c0a] disabled:opacity-40 disabled:cursor-not-allowed text-[color:var(--text-primary)] font-bold px-4 py-4 rounded-xl text-base transition-colors min-h-[56px] shadow-lg shadow-[#F97316]/20"
          >
            {submitting ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <>{t('ui.add.me.to.directory')}
                <ChevronRight size={18} />
              </>
            )}
          </button>
        </form>

        <p className="text-[11px] text-gray-600 text-center">{t('ui.your.contact.info.will.be.visible.to.the.project.team')}
        </p>
      </div>
    </div>
  );
}
