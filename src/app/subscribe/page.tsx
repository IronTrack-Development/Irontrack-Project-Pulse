"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Loader2, CheckCircle } from "lucide-react";

export default function SubscribePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubscribe = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create checkout session");
        setLoading(false);
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0B0D] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center mb-8">
          <Building2 className="w-8 h-8 text-[#F97316] mr-2" />
          <span className="text-2xl font-bold text-white">IronTrack Daily</span>
        </div>

        {/* Subscription Card */}
        <div className="bg-[#1F1F25] border border-[#2A2A30] rounded-lg p-8">
          <h1 className="text-2xl font-bold text-white mb-2">Your trial has ended</h1>
          <p className="text-gray-400 mb-6">
            Subscribe to continue using IronTrack Daily and keep your project intelligence flowing.
          </p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm mb-6">
              {error}
            </div>
          )}

          <div className="bg-[#0B0B0D] border border-[#2A2A30] rounded-lg p-6 mb-6">
            <div className="text-center mb-6">
              <div className="text-4xl font-bold text-white mb-2">
                $19.99<span className="text-xl text-gray-500">/mo</span>
              </div>
              <p className="text-gray-400">per project</p>
            </div>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-[#22C55E] shrink-0 mt-0.5" />
                <span className="text-gray-300 text-sm">Unlimited schedule uploads</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-[#22C55E] shrink-0 mt-0.5" />
                <span className="text-gray-300 text-sm">Daily risk detection & health scores</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-[#22C55E] shrink-0 mt-0.5" />
                <span className="text-gray-300 text-sm">Lookahead intelligence & briefs</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-[#22C55E] shrink-0 mt-0.5" />
                <span className="text-gray-300 text-sm">Mobile app access</span>
              </li>
            </ul>
          </div>

          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="w-full bg-[#F97316] hover:bg-[#EA580C] disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center mb-4"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              "Subscribe Now"
            )}
          </button>

          <p className="text-center text-gray-500 text-xs">
            Secure payment powered by Stripe • Cancel anytime
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-500 text-sm mt-8">
          © 2025 IronTrack Daily. All rights reserved.
        </p>
      </div>
    </div>
  );
}
