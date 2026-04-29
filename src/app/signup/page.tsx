"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";
import { Loader2, CheckCircle, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { t } from "@/lib/i18n";

export default function SignupPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      setLoading(false);
      return;
    }

    const supabase = createClient();

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      // Create subscription record — redirect to Stripe for payment
      await supabase.from("user_subscriptions").insert({
        user_id: data.user.id,
        status: "pending",
      });

      setSuccess(true);
      setLoading(false);

      // If email confirmation is disabled, redirect to subscribe page
      if (data.session) {
        setTimeout(() => {
          router.push("/subscribe");
          router.refresh();
        }, 2000);
      }
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "#F5F3EE" }}>
        <div className="w-full max-w-md">
          <div className="rounded-2xl p-8 border text-center shadow-sm" style={{ background: "white", borderColor: "rgba(13,13,13,0.08)" }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(34,197,94,0.1)" }}>
              <CheckCircle className="w-8 h-8" style={{ color: "#22C55E" }} />
            </div>
            <h1 className="text-2xl font-extrabold mb-2" style={{ color: "#0D0D0D", letterSpacing: "-0.02em" }}>
              {t('auth.accountCreated')}
            </h1>
            <p className="mb-6" style={{ color: "rgba(13,13,13,0.55)" }}>
              {t('auth.checkEmail')}
            </p>
            <Link
              href="/login"
              className="inline-block py-3 px-6 rounded-xl font-bold text-[color:var(--text-primary)] transition-colors shadow-sm"
              style={{ background: "#E85D1C" }}
            >
              {t('action.goToLogin')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

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

        {/* Signup Card */}
        <div className="rounded-2xl p-8 border shadow-sm" style={{ background: "white", borderColor: "rgba(13,13,13,0.08)" }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "rgba(232,93,28,0.1)" }}>
              <img src="/irontrack-app-icon.svg" alt="" className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold" style={{ color: "#0D0D0D", letterSpacing: "-0.02em" }}>
                {t('auth.generalContractor')}
              </h1>
              <p className="text-sm" style={{ color: "rgba(13,13,13,0.45)" }}>
                {t('auth.gcPrice')}
              </p>
            </div>
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
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
                  color: "#0D0D0D"
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
                    color: "#0D0D0D"
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

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold mb-2" style={{ color: "#0D0D0D" }}>
                {t('auth.confirmPassword')}
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all"
                style={{ 
                  background: "#F5F3EE",
                  borderColor: "rgba(13,13,13,0.12)",
                  color: "#0D0D0D"
                }}
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl font-bold text-[color:var(--text-primary)] transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              style={{ background: "#E85D1C" }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('action.creatingAccount')}
                </>
              ) : (
                t('action.createAccount')
              )}
            </button>

            <p className="text-xs text-center mt-4" style={{ color: "rgba(13,13,13,0.45)" }}>
              {t('auth.termsAgree')}{" "}
              <Link href="/terms" className="font-semibold transition-colors" style={{ color: "#E85D1C" }}>
                {t('auth.termsOfService')}
              </Link>{" "}
              {t('auth.and')}{" "}
              <Link href="/privacy" className="font-semibold transition-colors" style={{ color: "#E85D1C" }}>
                {t('auth.privacyPolicy')}
              </Link>.
            </p>
          </form>

          <div className="mt-6 pt-6 border-t text-center" style={{ borderColor: "rgba(13,13,13,0.06)" }}>
            <p className="text-sm" style={{ color: "rgba(13,13,13,0.55)" }}>
              {t('auth.alreadyHaveAccount')}{" "}
              <Link href="/login" className="font-bold transition-colors" style={{ color: "#E85D1C" }}>
                {t('action.signIn')}
              </Link>
            </p>
            <p className="text-sm mt-3" style={{ color: "rgba(13,13,13,0.55)" }}>
              {t('auth.subQuestion')}{" "}
              <Link href="/signup/sub" className="font-bold transition-colors" style={{ color: "#3B82F6" }}>
                {t('auth.signUpHere')}
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
