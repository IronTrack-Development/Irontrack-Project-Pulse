"use client";

import { useEffect, useState, use } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, CheckCircle2, ChevronRight, Users } from "lucide-react";

const ROLE_OPTIONS = [
  { value: "architect", label: "Architect" },
  { value: "engineer", label: "Engineer" },
  { value: "subcontractor", label: "Subcontractor" },
  { value: "supplier", label: "Supplier" },
  { value: "owner", label: "Owner" },
  { value: "owners_rep", label: "Owner's Rep" },
  { value: "inspector", label: "Inspector" },
  { value: "internal", label: "Internal" },
  { value: "other", label: "Other" },
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
            <h1 className="text-xl font-bold text-[color:var(--text-primary)] mb-2">Link Error</h1>
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
              <h1 className="text-2xl font-bold text-[color:var(--text-primary)] leading-tight">
                You&apos;re in the directory!
              </h1>
              <p className="text-sm text-[color:var(--text-secondary)] mt-2">
                You&apos;ve been added to{" "}
                <span className="text-[color:var(--text-primary)] font-semibold">{projectName}</span>
              </p>
            </div>
          </div>

          {/* Info */}
          <div className="bg-[#121217] border border-[#1F1F25] rounded-2xl p-5 space-y-3">
            <p className="text-xs font-semibold text-[#F97316] uppercase tracking-wider">
              What&apos;s Next
            </p>
            <ul className="space-y-2 text-xs text-[color:var(--text-secondary)]">
              <li className="flex items-start gap-2">
                <span className="text-[#F97316] flex-none mt-0.5">→</span>
                Your contact info is now in the project directory
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#F97316] flex-none mt-0.5">→</span>
                The project team can reach you directly from the directory
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#F97316] flex-none mt-0.5">→</span>
                You can close this page — you&apos;re all set
              </li>
            </ul>
          </div>

          <p className="text-[11px] text-gray-600 text-center">
            Powered by IronTrack Pulse
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
            alt="IronTrack Pulse"
            className="w-14 h-14 rounded-2xl object-contain shadow-lg shadow-black/30"
          />
          <p className="text-xs font-semibold text-[color:var(--text-muted)] tracking-widest uppercase">
            IronTrack Pulse
          </p>
        </div>

        {/* Title */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[color:var(--text-primary)] leading-tight">
            Join {projectName}
          </h1>
          <p className="text-sm text-[color:var(--text-secondary)] mt-1">
            Add yourself to the project directory
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[color:var(--text-secondary)] uppercase tracking-wide">
              Your Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              required
              autoComplete="name"
              className="w-full bg-[#121217] border border-[#1F1F25] rounded-xl px-4 py-4 text-[color:var(--text-primary)] text-base placeholder-gray-600 focus:outline-none focus:border-[#F97316] focus:ring-1 focus:ring-[#F97316]/30 transition min-h-[52px]"
            />
          </div>

          {/* Company */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[color:var(--text-secondary)] uppercase tracking-wide">
              Company
            </label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Company name"
              autoComplete="organization"
              className="w-full bg-[#121217] border border-[#1F1F25] rounded-xl px-4 py-4 text-[color:var(--text-primary)] text-base placeholder-gray-600 focus:outline-none focus:border-[#F97316] focus:ring-1 focus:ring-[#F97316]/30 transition min-h-[52px]"
            />
          </div>

          {/* Role */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[color:var(--text-secondary)] uppercase tracking-wide">
              Your Role *
            </label>
            <select
              value={role}
              onChange={(e) => { setRole(e.target.value); setTrade(""); setDiscipline(""); }}
              required
              className="w-full bg-[#121217] border border-[#1F1F25] rounded-xl px-4 py-4 text-[color:var(--text-primary)] text-base focus:outline-none focus:border-[#F97316] focus:ring-1 focus:ring-[#F97316]/30 transition min-h-[52px]"
            >
              <option value="" disabled>Select your role…</option>
              {ROLE_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          {/* Trade — subcontractor only */}
          {role === "subcontractor" && (
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[color:var(--text-secondary)] uppercase tracking-wide">
                Trade
              </label>
              <input
                type="text"
                value={trade}
                onChange={(e) => setTrade(e.target.value)}
                placeholder="e.g., Electrical, Plumbing, HVAC"
                className="w-full bg-[#121217] border border-[#1F1F25] rounded-xl px-4 py-4 text-[color:var(--text-primary)] text-base placeholder-gray-600 focus:outline-none focus:border-[#F97316] focus:ring-1 focus:ring-[#F97316]/30 transition min-h-[52px]"
              />
            </div>
          )}

          {/* Discipline — engineer only */}
          {role === "engineer" && (
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[color:var(--text-secondary)] uppercase tracking-wide">
                Discipline
              </label>
              <input
                type="text"
                value={discipline}
                onChange={(e) => setDiscipline(e.target.value)}
                placeholder="e.g., Structural, MEP, Civil"
                className="w-full bg-[#121217] border border-[#1F1F25] rounded-xl px-4 py-4 text-[color:var(--text-primary)] text-base placeholder-gray-600 focus:outline-none focus:border-[#F97316] focus:ring-1 focus:ring-[#F97316]/30 transition min-h-[52px]"
              />
            </div>
          )}

          {/* Email */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[color:var(--text-secondary)] uppercase tracking-wide">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              autoComplete="email"
              className="w-full bg-[#121217] border border-[#1F1F25] rounded-xl px-4 py-4 text-[color:var(--text-primary)] text-base placeholder-gray-600 focus:outline-none focus:border-[#F97316] focus:ring-1 focus:ring-[#F97316]/30 transition min-h-[52px]"
            />
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[color:var(--text-secondary)] uppercase tracking-wide">
              Phone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="602-555-1234"
              autoComplete="tel"
              className="w-full bg-[#121217] border border-[#1F1F25] rounded-xl px-4 py-4 text-[color:var(--text-primary)] text-base placeholder-gray-600 focus:outline-none focus:border-[#F97316] focus:ring-1 focus:ring-[#F97316]/30 transition min-h-[52px]"
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
              <>
                Add Me to Directory
                <ChevronRight size={18} />
              </>
            )}
          </button>
        </form>

        <p className="text-[11px] text-gray-600 text-center">
          Your contact info will be visible to the project team only.
        </p>
      </div>
    </div>
  );
}
