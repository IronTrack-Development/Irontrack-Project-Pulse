"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";
import { Loader2, Eye, EyeOff, ArrowLeft, HardHat, Briefcase } from "lucide-react";
import { t } from "@/lib/i18n";

function LoginForm() {
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect");

  const [role, setRole] = useState<"gc" | "sub">(
    redirectParam?.startsWith("/sub") ? "sub" : "gc"
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isGC = role === "gc";
  const accentColor = isGC ? "#E85D1C" : "#3B82F6";
  const defaultRedirect = isGC ? "/dashboard" : "/sub/dashboard";
  const redirect = redirectParam || defaultRedirect;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      await supabase.auth.signOut({ scope: "others" });
      await new Promise(resolve => setTimeout(resolve, 300));
      window.location.href = redirect;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-6" style={{ background: "#F5F3EE" }}>
      <div className="w-full max-w-md">
        {/* Back to Home */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium transition-colors mb-6 hover:opacity-70"
          style={{ color: "rgba(13,13,13,0.55)" }}
        >
          <ArrowLeft className="w-4 h-4" />
          {t('action.backToHome')}
        </Link>

        {/* Logo */}
        <Link href="/" className="flex items-center justify-center mb-8 group">
          <img
            src="/irontrack-app-icon.svg"
            alt="IronTrack"
            className="h-10 w-auto mr-3"
          />
          <span className="text-2xl font-extrabold tracking-tight group-hover:opacity-80 transition-opacity" style={{ color: "#0D0D0D", letterSpacing: "-0.03em" }}>
            Iron<span style={{ color: "#E85D1C" }}>Track</span>
          </span>
        </Link>

        {/* Role Toggle */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setRole("gc")}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold transition-all"
            style={{
              background: isGC ? "#E85D1C" : "white",
              color: isGC ? "white" : "rgba(13,13,13,0.55)",
              border: isGC ? "2px solid #E85D1C" : "2px solid rgba(13,13,13,0.12)",
            }}
          >
            <HardHat size={18} />
            {t('auth.generalContractor')}
          </button>
          <button
            onClick={() => setRole("sub")}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold transition-all"
            style={{
              background: !isGC ? "#3B82F6" : "white",
              color: !isGC ? "white" : "rgba(13,13,13,0.55)",
              border: !isGC ? "2px solid #3B82F6" : "2px solid rgba(13,13,13,0.12)",
            }}
          >
            <Briefcase size={18} />
            {t('auth.subcontractor')}
          </button>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl p-8 border shadow-sm" style={{ background: "white", borderColor: "rgba(13,13,13,0.08)" }}>
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: isGC ? "rgba(232,93,28,0.1)" : "rgba(59,130,246,0.1)" }}
            >
              {isGC
                ? <HardHat size={24} style={{ color: "#E85D1C" }} />
                : <Briefcase size={24} style={{ color: "#3B82F6" }} />
              }
            </div>
            <div>
              <h1 className="text-2xl font-extrabold" style={{ color: "#0D0D0D", letterSpacing: "-0.02em" }}>
                {isGC ? t('auth.generalContractor') : t('auth.subcontractor')}
              </h1>
              <p className="text-sm" style={{ color: "rgba(13,13,13,0.45)" }}>
                {isGC ? t('auth.signInToGC') : t('auth.signInToSub')}
              </p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="rounded-lg p-3 text-sm border" style={{ background: "rgba(239,68,68,0.08)", borderColor: "rgba(239,68,68,0.2)", color: "#DC2626" }}>
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-semibold mb-2" style={{ color: "#0D0D0D" }}>
                {t('auth.email')}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all"
                style={{
                  background: "#F5F3EE",
                  borderColor: "rgba(13,13,13,0.12)",
                  color: "#0D0D0D",
                }}
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold mb-2" style={{ color: "#0D0D0D" }}>
                {t('auth.password')}
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 pr-12 rounded-xl border focus:outline-none focus:ring-2 transition-all"
                  style={{
                    background: "#F5F3EE",
                    borderColor: "rgba(13,13,13,0.12)",
                    color: "#0D0D0D",
                  }}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: "rgba(13,13,13,0.35)" }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl font-bold text-white transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              style={{ background: accentColor }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('action.signingIn')}
                </>
              ) : (
                t('action.signIn')
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t text-center" style={{ borderColor: "rgba(13,13,13,0.06)" }}>
            <p className="text-sm" style={{ color: "rgba(13,13,13,0.55)" }}>
              {t('auth.dontHaveAccount')}{" "}
              <Link
                href={isGC ? "/signup" : "/signup/sub"}
                className="font-bold transition-colors"
                style={{ color: accentColor }}
              >
                {t('action.signUp')}
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm mt-6" style={{ color: "rgba(13,13,13,0.35)" }}>
          © 2026 IronTrack Development LLC
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center" style={{ background: "#F5F3EE" }}>
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#E85D1C" }} />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
