"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n";

const { t } = useTranslation();
import {
  CheckCircle2,
  Loader2,
  Building2,
  User,
  Smartphone,
  Clock,
  ChevronRight,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SubSession {
  company_name: string;
  full_name: string;
  sub_id: string;
  token: string;
  project_id: string;
  timestamp: number;
}

type Step = "loading" | "register" | "home_screen" | "waiting" | "redirect";

const SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes

function sessionKey(projectId: string) {
  return `irontrack_sub_session_${projectId}`;
}

function loadSession(projectId: string): SubSession | null {
  try {
    const raw = localStorage.getItem(sessionKey(projectId));
    if (!raw) return null;
    const session: SubSession = JSON.parse(raw);
    if (Date.now() - session.timestamp < SESSION_TTL_MS) return session;
    localStorage.removeItem(sessionKey(projectId));
    return null;
  } catch {
    return null;
  }
}

function saveSession(session: SubSession) {
  try {
    localStorage.setItem(sessionKey(session.project_id), JSON.stringify(session));
  } catch {
    // localStorage unavailable — graceful degradation
  }
}

// ─── OS Detection ────────────────────────────────────────────────────────────

function detectOS(): "ios" | "android" | "other" {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return "ios";
  if (/Android/.test(ua)) return "android";
  return "other";
}

// ─── Pulse Dot Animation ────────────────────────────────────────────────────

function PulseDot() {
  return (
    <span className="relative inline-flex h-3 w-3">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F97316] opacity-75" />
      <span className="relative inline-flex rounded-full h-3 w-3 bg-[#F97316]" />
    </span>
  );
}

// ─── Step 1: Registration Form ───────────────────────────────────────────────

interface RegisterFormProps {
  projectName: string;
  onSubmit: (companyName: string, fullName: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

function RegisterForm({ projectName, onSubmit, loading, error }: RegisterFormProps) {
  const [companyName, setCompanyName] = useState("");
  const [fullName, setFullName] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!companyName.trim() || !fullName.trim()) return;
    onSubmit(companyName.trim(), fullName.trim());
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 py-8">
      <div className="w-full max-w-sm space-y-7">
        {/* Logo / Brand */}
        <div className="flex flex-col items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icon-192.png"
            alt={t('ui.irontrack.pulse')}
            className="w-14 h-14 rounded-2xl object-contain shadow-lg shadow-black/30"
          />
          <div className="text-center">
            <p className="text-xs font-semibold text-[color:var(--text-muted)] tracking-widest uppercase">{t('ui.irontrack.pulse')}
            </p>
          </div>
        </div>

        {/* Project + Header */}
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold text-[color:var(--text-primary)] leading-tight">{t('ui.join')} {projectName}
          </h1>
          <p className="text-sm text-[color:var(--text-secondary)]">{t('ui.register.to.see.your.schedule.on.this.project')}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[color:var(--text-secondary)] uppercase tracking-wide">{t('ui.company.name.8599f5')}
            </label>
            <div className="relative">
              <Building2
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[color:var(--text-muted)] pointer-events-none"
              />
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder={t('ui.e.g.abc.plumbing')}
                required
                autoComplete="organization"
                className="w-full bg-[#121217] border border-[#1F1F25] rounded-xl pl-11 pr-4 py-4 text-[color:var(--text-primary)] text-base placeholder-gray-600 focus:outline-none focus:border-[#F97316] focus:ring-1 focus:ring-[#F97316]/30 transition min-h-[52px]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[color:var(--text-secondary)] uppercase tracking-wide">{t('ui.your.full.name')}
            </label>
            <div className="relative">
              <User
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[color:var(--text-muted)] pointer-events-none"
              />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={t('ui.e.g.joe.martinez')}
                required
                autoComplete="name"
                className="w-full bg-[#121217] border border-[#1F1F25] rounded-xl pl-11 pr-4 py-4 text-[color:var(--text-primary)] text-base placeholder-gray-600 focus:outline-none focus:border-[#F97316] focus:ring-1 focus:ring-[#F97316]/30 transition min-h-[52px]"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-700/30 rounded-xl px-4 py-3">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !companyName.trim() || !fullName.trim()}
            className="w-full flex items-center justify-center gap-2 bg-[#F97316] hover:bg-[#ea6c0a] disabled:opacity-40 disabled:cursor-not-allowed text-[color:var(--text-primary)] font-bold px-4 py-4 rounded-xl text-base transition-colors min-h-[56px] shadow-lg shadow-[#F97316]/20"
          >
            {loading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <>{t('ui.join.project')}
                <ChevronRight size={18} />
              </>
            )}
          </button>
        </form>

        <p className="text-[11px] text-gray-600 text-center leading-relaxed">{t('ui.your.gc.will.assign.your.specific.schedule.tasks.after.registration')}
        </p>
      </div>
    </div>
  );
}

// ─── Step 2: Add to Home Screen Wizard ──────────────────────────────────────

interface HomeScreenWizardProps {
  onDone: () => void;
  onSkip: () => void;
}

function HomeScreenWizard({ onDone, onSkip }: HomeScreenWizardProps) {
  const os = detectOS();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 py-8">
      <div className="w-full max-w-sm space-y-6">
        {/* Header */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#F97316]/15 border border-[#F97316]/30 flex items-center justify-center">
            <Smartphone size={32} className="text-[#F97316]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[color:var(--text-primary)]">{t('ui.add.to.home.screen')}</h2>
            <p className="text-sm text-[color:var(--text-secondary)] mt-1">{t('ui.get.quick.access.to.your.schedule.like.a.native.app')}
            </p>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-[#121217] border border-[#1F1F25] rounded-2xl p-5 space-y-4">
          {os === "ios" ? (
            <>
              <p className="text-xs font-semibold text-[#F97316] uppercase tracking-wider">{t('ui.iphone.ipad')}</p>
              <ol className="space-y-4">
                <li className="flex items-start gap-3">
                  <span className="flex-none w-7 h-7 rounded-full bg-[#F97316] text-[color:var(--text-primary)] text-xs font-bold flex items-center justify-center mt-0.5">1</span>
                  <div>
                    <p className="text-sm text-gray-200 font-medium">{t('ui.tap.the.share.button')}</p>
                    <p className="text-xs text-[color:var(--text-muted)] mt-0.5">{t('ui.look.for.the')}{" "}
                      <span className="font-mono bg-[#1F1F25] px-1.5 py-0.5 rounded text-[color:var(--text-secondary)]">□↑</span>{" "}{t('ui.icon.at.the.bottom.of.safari')}
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-none w-7 h-7 rounded-full bg-[#F97316] text-[color:var(--text-primary)] text-xs font-bold flex items-center justify-center mt-0.5">2</span>
                  <div>
                    <p className="text-sm text-gray-200 font-medium">{t('ui.scroll.down.in.the.menu')}</p>
                    <p className="text-xs text-[color:var(--text-muted)] mt-0.5">{t('ui.find.and.tap')} <strong className="text-[color:var(--text-secondary)]">{t('ui.add.to.home.screen.7a0091')}</strong></p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-none w-7 h-7 rounded-full bg-[#F97316] text-[color:var(--text-primary)] text-xs font-bold flex items-center justify-center mt-0.5">3</span>
                  <div>
                    <p className="text-sm text-gray-200 font-medium">{t('ui.tap.add')}</p>
                    <p className="text-xs text-[color:var(--text-muted)] mt-0.5">{t('ui.the.app.icon.will.appear.on.your.home.screen')}</p>
                  </div>
                </li>
              </ol>
            </>
          ) : os === "android" ? (
            <>
              <p className="text-xs font-semibold text-[#F97316] uppercase tracking-wider">{t('ui.android.1928f9')}</p>
              <ol className="space-y-4">
                <li className="flex items-start gap-3">
                  <span className="flex-none w-7 h-7 rounded-full bg-[#F97316] text-[color:var(--text-primary)] text-xs font-bold flex items-center justify-center mt-0.5">1</span>
                  <div>
                    <p className="text-sm text-gray-200 font-medium">{t('ui.tap.the.three.dots')}</p>
                    <p className="text-xs text-[color:var(--text-muted)] mt-0.5">{t('ui.find.the')}{" "}
                      <span className="font-mono bg-[#1F1F25] px-1.5 py-0.5 rounded text-[color:var(--text-secondary)]">⋮</span>{" "}{t('ui.menu.in.the.top.right.of.chrome')}
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-none w-7 h-7 rounded-full bg-[#F97316] text-[color:var(--text-primary)] text-xs font-bold flex items-center justify-center mt-0.5">2</span>
                  <div>
                    <p className="text-sm text-gray-200 font-medium">{t('ui.tap.add.to.home.screen')}</p>
                    <p className="text-xs text-[color:var(--text-muted)] mt-0.5">{t('ui.or.look.for.install.app.if.chrome.offers.it')}</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-none w-7 h-7 rounded-full bg-[#F97316] text-[color:var(--text-primary)] text-xs font-bold flex items-center justify-center mt-0.5">3</span>
                  <div>
                    <p className="text-sm text-gray-200 font-medium">{t('ui.tap.add')}</p>
                    <p className="text-xs text-[color:var(--text-muted)] mt-0.5">{t('ui.irontrack.pulse.will.appear.on.your.home.screen')}</p>
                  </div>
                </li>
              </ol>
            </>
          ) : (
            <>
              <p className="text-xs font-semibold text-[#F97316] uppercase tracking-wider">{t('ui.desktop.other')}</p>
              <p className="text-sm text-[color:var(--text-secondary)]">{t('ui.bookmark.this.page.for.quick.access.to.your.schedule.on')}
              </p>
            </>
          )}
        </div>

        {/* Tip */}
        <div className="bg-[#0d0d11] border border-[#1F1F25] rounded-xl px-4 py-3 flex items-start gap-3">
          <span className="text-lg">💡</span>
          <p className="text-xs text-[color:var(--text-secondary)] leading-relaxed">{t('ui.adding.to.your.home.screen.means.you.can.open.your')}
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={onDone}
            className="w-full flex items-center justify-center gap-2 bg-[#F97316] hover:bg-[#ea6c0a] text-[color:var(--text-primary)] font-bold px-4 py-4 rounded-xl text-base transition-colors min-h-[56px]"
          >
            <CheckCircle2 size={20} />{t('ui.i.ve.added.it')}
          </button>
          <button
            onClick={onSkip}
            className="w-full px-4 py-3.5 bg-[#121217] border border-[#1F1F25] text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] rounded-xl text-sm font-medium transition-colors"
          >{t('ui.skip.for.now')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Step 3: Waiting Screen ──────────────────────────────────────────────────

interface WaitingScreenProps {
  projectName: string;
  companyName: string;
  fullName: string;
  subId: string;
  projectId: string;
  token: string;
}

function WaitingScreen({
  projectName,
  companyName,
  fullName,
  subId,
  projectId,
  token,
}: WaitingScreenProps) {
  const router = useRouter();
  const [checking, setChecking] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const checkForActivities = useCallback(async () => {
    if (checking) return;
    setChecking(true);
    try {
      const res = await fetch(
        `/api/join/${projectId}/status?sub_id=${subId}`
      );
      if (!res.ok) return;
      const data = await res.json();
      if (data.has_activities && data.token) {
        // GC has assigned tasks — redirect to view
        if (intervalRef.current) clearInterval(intervalRef.current);

        // Update localStorage session with token
        try {
          const sessionRaw = localStorage.getItem(
            `irontrack_sub_session_${projectId}`
          );
          if (sessionRaw) {
            const session: SubSession = JSON.parse(sessionRaw);
            session.token = data.token;
            session.timestamp = Date.now();
            localStorage.setItem(
              `irontrack_sub_session_${projectId}`,
              JSON.stringify(session)
            );
          }
        } catch {
          // ignore
        }

        router.push(`/view/${data.token}`);
      }
    } catch {
      // Silently ignore poll errors
    } finally {
      setChecking(false);
    }
  }, [checking, projectId, subId, router]);

  useEffect(() => {
    // Check immediately on mount
    checkForActivities();
    // Then poll every 10 seconds
    intervalRef.current = setInterval(checkForActivities, 10_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // If we already have a token (from registration), check if we can go straight there
  useEffect(() => {
    if (token) {
      // Poll immediately — maybe GC already assigned tasks
      checkForActivities();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 py-8">
      <div className="w-full max-w-sm space-y-7">
        {/* Icon + Header */}
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="relative">
            <div className="w-20 h-20 rounded-3xl bg-[#F97316]/10 border border-[#F97316]/20 flex items-center justify-center">
              <Clock size={36} className="text-[#F97316]" />
            </div>
            <div className="absolute -bottom-1 -right-1">
              <PulseDot />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-bold text-[color:var(--text-primary)]">{t('ui.you.re.registered')}</h2>
            <p className="text-sm text-[color:var(--text-secondary)] mt-1">{t('ui.waiting.for.your.gc.to.assign.schedule.items')}
            </p>
          </div>
        </div>

        {/* Confirmation Card */}
        <div className="bg-[#121217] border border-[#1F1F25] rounded-2xl p-5 space-y-3">
          <p className="text-xs font-semibold text-[#F97316] uppercase tracking-wider">{t('ui.registration.confirmed')}
          </p>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Building2 size={14} className="text-[color:var(--text-muted)] flex-none" />
              <span className="text-sm text-[color:var(--text-secondary)]">{companyName}</span>
            </div>
            <div className="flex items-center gap-2">
              <User size={14} className="text-[color:var(--text-muted)] flex-none" />
              <span className="text-sm text-[color:var(--text-secondary)]">{fullName}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={14} className="text-green-400 flex-none" />
              <span className="text-sm text-[color:var(--text-secondary)]">{t('ui.added.to')} <span className="text-[color:var(--text-primary)] font-medium">{projectName}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Waiting indicator */}
        <div className="flex flex-col items-center gap-3 py-2">
          <div className="flex items-center gap-2">
            <PulseDot />
            <p className="text-sm text-[color:var(--text-secondary)]">{t('ui.checking.for.task.assignments')}</p>
          </div>
          <p className="text-xs text-gray-600 text-center">{t('ui.this.page.will.automatically.redirect.when.your.gc.has.assigned')}
            {"\n"}{t('ui.you.can.close.it.and.come.back.your.session.is')}
          </p>
        </div>

        {/* What happens next */}
        <div className="bg-[#0d0d11] border border-[#1F1F25] rounded-xl px-4 py-4 space-y-2">
          <p className="text-xs font-semibold text-[color:var(--text-muted)] uppercase tracking-wide">{t('ui.what.happens.next')}</p>
          <ul className="space-y-2 text-xs text-[color:var(--text-secondary)]">
            <li className="flex items-start gap-2">
              <span className="text-[#F97316] flex-none mt-0.5">→</span>{t('ui.your.gc.will.assign.specific.schedule.tasks.to.your.company')}
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#F97316] flex-none mt-0.5">→</span>{t('ui.this.page.will.automatically.take.you.to.your.schedule')}
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#F97316] flex-none mt-0.5">→</span>{t('ui.you.can.submit.daily.progress.reports.directly.from.the.app')}
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function JoinProjectPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const router = useRouter();

  const [step, setStep] = useState<Step>("loading");
  const [projectName, setProjectName] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);

  // Registration form state
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Session state (set after registration or restored from localStorage)
  const [session, setSession] = useState<SubSession | null>(null);

  // ── Initialize: check localStorage, then load project info ─────────────────

  useEffect(() => {
    async function init() {
      // 1. Check for existing session
      const existing = loadSession(projectId);
      if (existing) {
        // Session is valid — try to go straight to schedule view
        try {
          const statusRes = await fetch(
            `/api/join/${projectId}/status?sub_id=${existing.sub_id}`
          );
          if (statusRes.ok) {
            const statusData = await statusRes.json();
            if (statusData.has_activities && statusData.token) {
              // Update token in session and redirect
              existing.token = statusData.token;
              existing.timestamp = Date.now();
              saveSession(existing);
              router.push(`/view/${statusData.token}`);
              return;
            }
          }
        } catch {
          // Ignore — fall through to waiting screen
        }

        // Session exists but no activities yet — show waiting screen
        setSession(existing);
        setProjectName(existing.company_name ? "" : "");
        // We need project name for waiting screen
        try {
          const projRes = await fetch(`/api/join/${projectId}`);
          if (projRes.ok) {
            const projData = await projRes.json();
            setProjectName(projData.project_name);
          }
        } catch {
          // ignore
        }
        setStep("waiting");
        return;
      }

      // 2. No session — fetch project info
      try {
        const res = await fetch(`/api/join/${projectId}`);
        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          setLoadError(json.error ?? "Project not found");
          setStep("register");
          return;
        }
        const data = await res.json();
        setProjectName(data.project_name);
        setStep("register");
      } catch {
        setLoadError("Unable to load project. Please check your connection.");
        setStep("register");
      }
    }

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  // ── Handle Registration Submit ───────────────────────────────────────────────

  async function handleRegister(companyName: string, fullName: string) {
    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch(`/api/join/${projectId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company_name: companyName, full_name: fullName }),
      });

      const json = await res.json();

      if (!res.ok) {
        setSubmitError(json.error ?? "Failed to register. Please try again.");
        return;
      }

      const newSession: SubSession = {
        company_name: companyName,
        full_name: fullName,
        sub_id: json.sub_id,
        token: json.token,
        project_id: projectId,
        timestamp: Date.now(),
      };

      saveSession(newSession);
      setSession(newSession);
      setProjectName(json.project_name || projectName);
      setStep("home_screen");
    } catch {
      setSubmitError("Network error — please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  if (step === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-[color:var(--text-secondary)]">
          <Loader2 size={32} className="animate-spin text-[#F97316]" />
          <p className="text-sm">{t('ui.loading.project')}</p>
        </div>
      </div>
    );
  }

  if (step === "register") {
    return (
      <RegisterForm
        projectName={projectName || "Project"}
        onSubmit={handleRegister}
        loading={submitting}
        error={loadError ?? submitError}
      />
    );
  }

  if (step === "home_screen") {
    return (
      <HomeScreenWizard
        onDone={() => setStep("waiting")}
        onSkip={() => setStep("waiting")}
      />
    );
  }

  if (step === "waiting" && session) {
    return (
      <WaitingScreen
        projectName={projectName}
        companyName={session.company_name}
        fullName={session.full_name}
        subId={session.sub_id}
        projectId={projectId}
        token={session.token}
      />
    );
  }

  // Fallback / redirect step
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-[color:var(--text-secondary)]">
        <Loader2 size={32} className="animate-spin text-[#F97316]" />
        <p className="text-sm">{t('ui.redirecting.to.your.schedule')}</p>
      </div>
    </div>
  );
}
