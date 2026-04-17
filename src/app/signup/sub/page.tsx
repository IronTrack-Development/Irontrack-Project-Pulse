"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";
import { Building2, Loader2, CheckCircle, Eye, EyeOff, Briefcase } from "lucide-react";

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
      <div className="min-h-screen bg-[#0B0B0D] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-[#1F1F25] border border-[#2A2A30] rounded-lg p-8 text-center">
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">You&apos;re in!</h1>
            <p className="text-gray-400 mb-6">
              {`Welcome to IronTrack Pulse. Check your email to confirm your account.`}
            </p>
            <Link
              href="/login"
              className="inline-block bg-[#F97316] hover:bg-[#EA580C] text-white font-semibold py-2 px-6 rounded-lg transition-colors"
            >
              Go to login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0B0D] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center mb-8">
          <Building2 className="w-8 h-8 text-[#F97316] mr-2" />
          <span className="text-2xl font-bold text-white">IronTrack Project Pulse</span>
        </div>

        {/* Signup Card */}
        <div className="bg-[#1F1F25] border border-[#2A2A30] rounded-lg p-8">
          <div className="flex items-center gap-3 mb-2">
            <Briefcase className="w-6 h-6 text-[#F97316]" />
            <h1 className="text-2xl font-bold text-white">Get Started as a Subcontractor</h1>
          </div>
          <p className="text-gray-400 mb-6">
            See your schedules, track your crew, report progress — all in one place.
          </p>

          <form onSubmit={handleSignup} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-gray-300 mb-2">
                Company Name <span className="text-red-400">*</span>
              </label>
              <input
                id="companyName"
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
                className="w-full px-4 py-2 bg-[#0B0B0D] border border-[#2A2A30] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#F97316] focus:border-transparent"
                placeholder="Apex Electrical LLC"
              />
            </div>

            <div>
              <label htmlFor="contactName" className="block text-sm font-medium text-gray-300 mb-2">
                Your Name <span className="text-red-400">*</span>
              </label>
              <input
                id="contactName"
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                required
                className="w-full px-4 py-2 bg-[#0B0B0D] border border-[#2A2A30] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#F97316] focus:border-transparent"
                placeholder="Jane Smith"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email <span className="text-red-400">*</span>
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 bg-[#0B0B0D] border border-[#2A2A30] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#F97316] focus:border-transparent"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2 pr-10 bg-[#0B0B0D] border border-[#2A2A30] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#F97316] focus:border-transparent"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-2">
                Phone <span className="text-gray-500">(optional)</span>
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2 bg-[#0B0B0D] border border-[#2A2A30] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#F97316] focus:border-transparent"
                placeholder="(602) 555-0100"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#F97316] hover:bg-[#EA580C] disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
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

            <p className="text-xs text-gray-500 text-center mt-4">
              By creating an account, you agree to our{" "}
              <Link href="/terms" className="text-[#F97316] hover:text-[#EA580C]">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-[#F97316] hover:text-[#EA580C]">
                Privacy Policy
              </Link>.
            </p>
          </form>

          {/* Pricing note */}
          <div className="mt-5 bg-[#0B0B0D] border border-[#2A2A30] rounded-lg px-4 py-3 text-sm text-gray-400">
            📊 Schedule views are free. Progress Reports are $10/month during beta.
          </div>

          <div className="mt-5 text-center">
            <p className="text-gray-400 text-sm">
              Already have an account?{" "}
              <Link href="/login" className="text-[#F97316] hover:text-[#EA580C] font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* GC link */}
        <p className="text-center text-gray-500 text-sm mt-5">
          Looking to manage projects?{" "}
          <Link href="/signup" className="text-[#F97316] hover:text-[#EA580C]">
            Sign up as a General Contractor →
          </Link>
        </p>

        {/* Footer */}
        <p className="text-center text-gray-500 text-sm mt-4">
          © 2026 IronTrack Development LLC. All rights reserved.
        </p>
      </div>
    </div>
  );
}
