"use client";

import { useEffect, useState } from "react";
import { CheckCircle, AlertTriangle, Database, ExternalLink, Copy, RefreshCw } from "lucide-react";
import { readFileSync } from "fs";

export default function SetupPage() {
  const [status, setStatus] = useState<{
    ready: boolean;
    tables: { table: string; exists: boolean; error?: string }[];
    message: string;
  } | null>(null);
  const [checking, setChecking] = useState(true);
  const [copied, setCopied] = useState(false);

  const checkSetup = async () => {
    setChecking(true);
    const res = await fetch("/api/setup");
    if (res.ok) setStatus(await res.json());
    setChecking(false);
  };

  useEffect(() => { checkSetup(); }, []);

  const sqlSnippet = `-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/raxdqjivrathfornpxug/editor

CREATE TABLE IF NOT EXISTS daily_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  project_number TEXT,
  client_name TEXT,
  location TEXT,
  start_date DATE,
  target_finish_date DATE,
  status TEXT DEFAULT 'active',
  health_score INTEGER DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- (see src/migrations/001_irontrack_daily.sql for full migration)`;

  const copySQL = () => {
    navigator.clipboard.writeText(sqlSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0B0B0D]">
      <div className="sticky top-0 z-10 bg-[#0B0B0D]/95 backdrop-blur border-b border-[#1F1F25] px-6 py-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-xl font-bold text-white">Database Setup</h1>
          <p className="text-sm text-gray-500 mt-0.5">Check and configure the database</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        {/* Status */}
        <div className="bg-[#121217] border border-[#1F1F25] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Database size={16} className="text-[#3B82F6]" />
              <h2 className="font-semibold text-white">Table Status</h2>
            </div>
            <button onClick={checkSetup} className="p-2 rounded-lg bg-[#1F1F25] text-gray-400 hover:text-white transition-colors">
              <RefreshCw size={14} className={checking ? "animate-spin" : ""} />
            </button>
          </div>

          {checking ? (
            <div className="text-gray-500 text-sm">Checking tables...</div>
          ) : status ? (
            <div className="space-y-2">
              {status.tables.map((t) => (
                <div key={t.table} className="flex items-center justify-between text-sm">
                  <span className="font-mono text-gray-400">{t.table}</span>
                  {t.exists ? (
                    <span className="flex items-center gap-1.5 text-[#22C55E]">
                      <CheckCircle size={13} />
                      Ready
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-[#EF4444]">
                      <AlertTriangle size={13} />
                      Missing
                    </span>
                  )}
                </div>
              ))}

              <div className={`mt-4 p-3 rounded-xl text-sm ${
                status.ready
                  ? "bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#22C55E]"
                  : "bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#EF4444]"
              }`}>
                {status.message}
              </div>
            </div>
          ) : null}
        </div>

        {/* Instructions */}
        {status && !status.ready && (
          <div className="bg-[#121217] border border-[#1F1F25] rounded-2xl p-6">
            <h2 className="font-semibold text-white mb-3">Run Migration</h2>
            <ol className="space-y-3 text-sm text-gray-400 mb-5">
              <li className="flex gap-2">
                <span className="text-[#F97316] font-bold shrink-0">1.</span>
                Open the Supabase SQL Editor:
                <a
                  href="https://supabase.com/dashboard/project/raxdqjivrathfornpxug/editor"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[#3B82F6] hover:text-blue-400 ml-1"
                >
                  Open SQL Editor <ExternalLink size={11} />
                </a>
              </li>
              <li className="flex gap-2">
                <span className="text-[#F97316] font-bold shrink-0">2.</span>
                Open the file at: <code className="text-gray-300 font-mono bg-[#0B0B0D] px-1 rounded">src/migrations/001_irontrack_daily.sql</code>
              </li>
              <li className="flex gap-2">
                <span className="text-[#F97316] font-bold shrink-0">3.</span>
                Paste the full SQL and click Run
              </li>
              <li className="flex gap-2">
                <span className="text-[#F97316] font-bold shrink-0">4.</span>
                Come back here and click refresh to confirm tables were created
              </li>
              <li className="flex gap-2">
                <span className="text-[#F97316] font-bold shrink-0">5.</span>
                Run the seed: <code className="text-gray-300 font-mono bg-[#0B0B0D] px-1 rounded">npx tsx src/seed/seed-demo.ts</code>
              </li>
            </ol>

            <button
              onClick={copySQL}
              className="flex items-center gap-2 px-4 py-2 bg-[#1F1F25] hover:bg-[#2a2a35] text-gray-300 rounded-lg text-sm transition-colors"
            >
              <Copy size={14} />
              {copied ? "Copied!" : "Copy SQL snippet"}
            </button>
          </div>
        )}

        {status?.ready && (
          <div className="bg-[#22C55E]/10 border border-[#22C55E]/20 rounded-2xl p-6 text-center">
            <CheckCircle size={32} className="text-[#22C55E] mx-auto mb-3" />
            <div className="text-white font-bold">Database Ready</div>
            <div className="text-gray-400 text-sm mt-1">All tables are configured. You can now use IronTrack Daily.</div>
            <a
              href="/"
              className="inline-block mt-4 px-5 py-2 bg-[#F97316] text-white rounded-lg text-sm font-semibold hover:bg-[#ea6c0a] transition-colors"
            >
              Go to Dashboard
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
