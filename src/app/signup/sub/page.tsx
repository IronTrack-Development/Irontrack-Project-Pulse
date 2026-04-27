"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";
import { Loader2, CheckCircle, Eye, EyeOff, ArrowLeft } from "lucide-react";

export default function SubSignupPage() {
  const router = useRouter();

  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      setLoading(false);
      return;
    }

    const supabase = createClient();

    // 1. Create Supabase auth user
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

    if (!data.user) {
      setError("Account creation failed. Please try again.");
      setLoading(false);
      return;
    }

    // 2. Register sub company via API
    const res = await fetch("/api/auth/register-sub", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: data.user.id,
        company_name: companyName,
        contact_name: contactName,
        contact_email: email,
        contact_phone: phone || null,
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error || "Failed to set up your company. Please contact support.");
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);

    // If email confirmation is disabled, redirect immediately
    if (data.session) {
      setTimeout(() => {
        router.push("/sub/dashboard");
        router.refresh();
      }, 1500);
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
              You're in!
            </h1>
            <p className="mb-6" style={{ color: "rgba(13,13,13,0.55)" }}>
              Welcome to IronTrack Pulse. Check your email to confirm your account.
            </p>
            <Link
              href="/login/sub"
              className="inline-block py-3 px-6 rounded-xl font-bold text-[color:var(--text-primary)] transition-colors shadow-sm"
              style={{ background: "#3B82F6" }}
            >
              Go to login
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
          Back to home
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
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "rgba(59,130,246,0.1)" }}>
              <img src="/irontrack-app-icon.svg" alt="" className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold" style={{ color: "#0D0D0D", letterSpacing: "-0.02em" }}>
                Subcontractor
              </h1>
              <p className="text-sm" style={{ color: "rgba(13,13,13,0.45)" }}>
                Track schedules & report progress
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
              <label htmlFor="companyName" className="block text-sm font-semibold mb-2" style={{ color: "#0D0D0D" }}>
                Company Name <span style={{ color: "#DC2626" }}>*</span>
              </label>
              <input
                id="companyName"
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all"
                style={{ 
                  background: "#F5F3EE",
                  borderColor: "rgba(13,13,13,0.12)",
                  color: "#0D0D0D"
                }}
                placeholder="Apex Electrical LLC"
              />
            </div>

            <div>
              <label htmlFor="contactName" className="block text-sm font-semibold mb-2" style={{ color: "#0D0D0D" }}>
                Your Name <span style={{ color: "#DC2626" }}>*</span>
              </label>
              <input
                id="contactName"
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all"
                style={{ 
                  background: "#F5F3EE",
                  borderColor: "rgba(13,13,13,0.12)",
                  color: "#0D0D0D"
                }}
                placeholder="Jane Smith"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-semibold mb-2" style={{ color: "#0D0D0D" }}>
                Email <span style={{ color: "#DC2626" }}>*</span>
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
                Password <span style={{ color: "#DC2626" }}>*</span>
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
              <label htmlFor="phone" className="block text-sm font-semibold mb-2" style={{ color: "#0D0D0D" }}>
                Phone <span style={{ color: "rgba(13,13,13,0.35)" }}>(optional)</span>
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all"
                style={{ 
                  background: "#F5F3EE",
                  borderColor: "rgba(13,13,13,0.12)",
                  color: "#0D0D0D"
                }}
                placeholder="(602) 555-0100"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl font-bold text-[color:var(--text-primary)] transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              style={{ background: "#3B82F6" }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create Subcontractor Account"
              )}
            </button>

            <p className="text-xs text-center mt-4" style={{ color: "rgba(13,13,13,0.45)" }}>
              By creating an account, you agree to our{" "}
              <Link href="/terms" className="font-semibold transition-colors" style={{ color: "#3B82F6" }}>
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="font-semibold transition-colors" style={{ color: "#3B82F6" }}>
                Privacy Policy
              </Link>.
            </p>
          </form>

          {/* Pricing note */}
          <div className="mt-5 rounded-xl px-4 py-3 text-sm border" style={{ background: "rgba(59,130,246,0.05)", borderColor: "rgba(59,130,246,0.15)", color: "rgba(13,13,13,0.65)" }}>
            📊 Schedule views are free. Progress Reports are $10/month during beta.
          </div>

          <div className="mt-6 pt-6 border-t text-center" style={{ borderColor: "rgba(13,13,13,0.06)" }}>
            <p className="text-sm" style={{ color: "rgba(13,13,13,0.55)" }}>
              Already have an account?{" "}
              <Link href="/login/sub" className="font-bold transition-colors" style={{ color: "#3B82F6" }}>
                Sign in
              </Link>
            </p>
            <p className="text-sm mt-3" style={{ color: "rgba(13,13,13,0.55)" }}>
              General Contractor?{" "}
              <Link href="/signup" className="font-bold transition-colors" style={{ color: "#E85D1C" }}>
                Sign up here
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
