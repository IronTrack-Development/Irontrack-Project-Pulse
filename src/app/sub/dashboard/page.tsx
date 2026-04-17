"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";
import { FolderOpen, FileText, ArrowLeft, Loader2, AlertCircle } from "lucide-react";

interface SubCompany {
  id: string;
  company_name: string;
  contact_name: string | null;
  contact_email: string | null;
}

export default function SubDashboardPage() {
  const [company, setCompany] = useState<SubCompany | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadCompany() {
      try {
        const supabase = createClient();
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          setError("Not authenticated. Please sign in.");
          setLoading(false);
          return;
        }

        const { data, error: fetchError } = await supabase
          .from("sub_companies")
          .select("id, company_name, contact_name, contact_email")
          .eq("user_id", user.id)
          .maybeSingle();

        if (fetchError) {
          setError("Could not load company data. Please try again.");
        } else if (data) {
          setCompany(data);
        }
      } catch {
        setError("An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    }

    loadCompany();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-[#F97316] animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-16 text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-red-400 mb-4">{error}</p>
        <Link href="/login" className="text-[#F97316] hover:text-[#EA580C] text-sm">
          Return to login
        </Link>
      </div>
    );
  }

  const displayName = company?.company_name ?? "your company";

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-12">
      {/* Welcome header */}
      <div className="mb-8">
        <p className="text-sm text-gray-500 mb-1">Subcontractor Dashboard</p>
        <h1 className="text-2xl md:text-3xl font-bold text-white">
          Welcome, <span className="text-[#F97316]">{displayName}</span>
        </h1>
        {company?.contact_name && (
          <p className="text-gray-400 mt-1">{company.contact_name}</p>
        )}
      </div>

      {/* Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Your Projects card */}
        <div className="bg-[#121217] border border-[#1F1F25] rounded-2xl p-6 md:p-8 hover:border-[#F97316]/30 transition-all">
          <div className="w-12 h-12 bg-[#F97316]/10 rounded-xl flex items-center justify-center mb-5">
            <FolderOpen className="w-6 h-6 text-[#F97316]" />
          </div>
          <h2 className="text-xl font-bold text-white mb-3">Your Projects</h2>
          <p className="text-gray-400 leading-relaxed">
            Projects will appear here when a GC shares a schedule with your company.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-[#1F1F25] border border-[#2A2A30] rounded-lg text-sm text-gray-500">
            No projects shared yet
          </div>
        </div>

        {/* Progress Reports card */}
        <div className="bg-[#121217] border border-[#1F1F25] rounded-2xl p-6 md:p-8 hover:border-[#F97316]/30 transition-all">
          <div className="w-12 h-12 bg-[#F97316]/10 rounded-xl flex items-center justify-center mb-5">
            <FileText className="w-6 h-6 text-[#F97316]" />
          </div>
          <h2 className="text-xl font-bold text-white mb-3">Progress Reports</h2>
          <p className="text-gray-400 leading-relaxed">
            Submit daily reports from the field. $10/month unlocks this feature.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-[#F97316]/10 border border-[#F97316]/20 rounded-lg text-sm text-[#F97316]">
            📊 $10/month during beta
          </div>
        </div>
      </div>

      {/* Back to landing */}
      <div className="mt-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to IronTrack Pulse
        </Link>
      </div>
    </div>
  );
}
