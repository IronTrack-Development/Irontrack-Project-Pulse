"use client";

import { useState, useEffect } from "react";
import { X, Copy, Check, Share2, Loader2, QrCode, RefreshCw } from "lucide-react";

interface Props {
  projectId: string;
  onClose: () => void;
}

interface QRData {
  token: string;
  url: string;
  project_name: string;
  expires_at: string | null;
}

export default function QRShareModal({ projectId, onClose }: Props) {
  const [loading, setLoading] = useState(true);
  const [qrData, setQrData] = useState<QRData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/directory/qr`);
      if (res.ok) {
        setQrData(await res.json());
      } else {
        setError("Failed to generate QR code");
      }
    } catch {
      setError("Failed to generate QR code");
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [projectId]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/directory/qr`, {
        method: "POST",
      });
      if (res.ok) {
        setQrData(await res.json());
      } else {
        setError("Failed to refresh QR code");
      }
    } catch {
      setError("Failed to refresh QR code");
    }
    setRefreshing(false);
  };

  const handleCopy = async () => {
    if (!qrData?.url) return;
    await navigator.clipboard.writeText(qrData.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!qrData?.url) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${qrData.project_name} Directory`,
          text: `Scan to add yourself to the ${qrData.project_name} project directory`,
          url: qrData.url,
        });
      } catch {
        // cancelled
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />

      <div className="relative bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-2xl w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-primary)]">
          <div className="flex items-center gap-2">
            <QrCode size={16} className="text-[#F97316]" />
            <span className="text-sm font-bold text-[color:var(--text-primary)]">Directory QR Code</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[var(--bg-tertiary)] text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-5 flex flex-col items-center">
          {loading && (
            <div className="flex flex-col items-center gap-3 py-8">
              <Loader2 size={24} className="text-[#F97316] animate-spin" />
              <span className="text-sm text-[color:var(--text-muted)]">Generating QR code…</span>
            </div>
          )}

          {error && !loading && (
            <div className="py-8 text-center">
              <p className="text-sm text-red-400 mb-4">{error}</p>
              <button
                onClick={load}
                className="text-xs text-[#F97316] underline"
              >
                Try Again
              </button>
            </div>
          )}

          {qrData && !loading && !error && (
            <>
              {/* Description */}
              <p className="text-xs text-[color:var(--text-secondary)] text-center mb-4 leading-relaxed">
                Share at your next meeting — anyone who scans adds themselves to the project directory.
              </p>

              {/* QR Code */}
              <div className="bg-white p-4 rounded-xl mb-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData.url)}&bgcolor=ffffff&color=000000&margin=4`}
                  alt="Directory join QR code"
                  width={200}
                  height={200}
                  className="w-[200px] h-[200px]"
                />
              </div>

              {/* Info */}
              <div className="text-center mb-4 w-full">
                <p className="text-[color:var(--text-primary)] font-semibold text-sm">{qrData.project_name}</p>
                <p className="text-[color:var(--text-muted)] text-xs mt-0.5">Project Directory</p>
                {qrData.expires_at && (
                  <p className="text-gray-600 text-[10px] mt-1">
                    QR code expires {new Date(qrData.expires_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                )}
              </div>

              {/* URL display */}
              <div className="w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg px-3 py-2 mb-4">
                <p className="text-[10px] text-[color:var(--text-secondary)] truncate font-mono">{qrData.url}</p>
              </div>

              {/* Actions */}
              <div className="flex gap-2 w-full mb-3">
                <button
                  onClick={handleCopy}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] text-[color:var(--text-secondary)] rounded-lg text-xs font-semibold transition-colors min-h-[44px]"
                >
                  {copied ? (
                    <>
                      <Check size={14} className="text-[#22C55E]" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      Copy Link
                    </>
                  )}
                </button>
                <button
                  onClick={handleShare}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-[#F97316] hover:bg-[#ea6c10] text-[color:var(--text-primary)] rounded-lg text-xs font-bold transition-colors min-h-[44px]"
                >
                  <Share2 size={14} />
                  Share
                </button>
              </div>

              {/* Refresh */}
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-1.5 text-[10px] text-gray-600 hover:text-[color:var(--text-secondary)] transition-colors"
              >
                <RefreshCw size={11} className={refreshing ? "animate-spin" : ""} />
                Generate new QR code (invalidates old)
              </button>

              <p className="text-[10px] text-gray-600 mt-2 text-center">
                Anyone with this link can add themselves. No login required.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
