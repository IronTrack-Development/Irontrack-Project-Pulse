"use client";

import Link from "next/link";
import { Settings, Database, Code2, ExternalLink, CheckCircle2 } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-[#0B0B0D]">
      <div className="sticky top-0 z-10 bg-[#0B0B0D]/95 backdrop-blur border-b border-[#1F1F25] px-6 py-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-xl font-bold text-white">Settings</h1>
          <p className="text-sm text-gray-500 mt-0.5">Configuration and system info</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        {/* Database */}
        <div className="bg-[#121217] border border-[#1F1F25] rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Database size={16} className="text-[#3B82F6]" />
            <h2 className="font-semibold text-white">Database</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Supabase Project</span>
              <span className="text-gray-300 font-mono text-xs">raxdqjivrathfornpxug</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Status</span>
              <span className="flex items-center gap-1.5 text-[#22C55E] text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
                Connected
              </span>
            </div>
            <div className="pt-2 border-t border-[#1F1F25] flex flex-col gap-2">
              <a
                href="https://supabase.com/dashboard/project/raxdqjivrathfornpxug"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs text-[#3B82F6] hover:text-blue-400 transition-colors"
              >
                Open Supabase Dashboard
                <ExternalLink size={11} />
              </a>
              <Link
                href="/setup"
                className="flex items-center gap-2 text-xs text-[#22C55E] hover:text-green-400 transition-colors"
              >
                <CheckCircle2 size={11} />
                Check Database Setup
              </Link>
            </div>
          </div>
        </div>

        {/* Migration */}
        <div className="bg-[#121217] border border-[#1F1F25] rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Code2 size={16} className="text-[#F97316]" />
            <h2 className="font-semibold text-white">Database Setup</h2>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            If you haven&apos;t run the database migration yet, open the Supabase SQL editor and run the file at:
          </p>
          <div className="bg-[#0B0B0D] border border-[#1F1F25] rounded-lg px-3 py-2 font-mono text-xs text-gray-400 mb-4">
            src/migrations/001_irontrack_daily.sql
          </div>
          <p className="text-sm text-gray-500 mb-3">
            To seed demo data, run:
          </p>
          <div className="bg-[#0B0B0D] border border-[#1F1F25] rounded-lg px-3 py-2 font-mono text-xs text-gray-400">
            npx tsx src/seed/seed-demo.ts
          </div>
        </div>

        {/* Version */}
        <div className="bg-[#121217] border border-[#1F1F25] rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Settings size={16} className="text-gray-500" />
            <h2 className="font-semibold text-white">About</h2>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Version</span>
              <span className="text-gray-300">1.0.0 — Phase 1</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Stack</span>
              <span className="text-gray-300">Next.js 14 · Supabase · Tailwind</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Port</span>
              <span className="text-gray-300 font-mono">3030</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
