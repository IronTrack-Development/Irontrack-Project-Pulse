"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-[#0B0B0D] flex items-center justify-center p-8">
      <div className="text-center">
        <h1 className="text-xl font-bold text-white mb-2">Settings</h1>
        <p className="text-gray-500 mb-6">Account settings coming soon.</p>
        <Link href="/dashboard" className="text-[#F97316] hover:text-[#EA580C] flex items-center gap-2 justify-center">
          <ArrowLeft size={16} />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
