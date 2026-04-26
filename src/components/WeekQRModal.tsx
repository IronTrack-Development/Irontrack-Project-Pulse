"use client";

import { useState, useEffect } from "react";
import { X, Copy, Check, Share2, Loader2, QrCode } from "lucide-react";

interface Props {
  projectId: string;
  weekNumber: 1 | 2 | 3;
  onClose: () => void;
}

export default function WeekQRModal({ projectId, weekNumber, onClose }: Props) {
  const [loading, setLoading] = useState(true);
  const [shareUrl, setShareUrl] = useState<string>("");
  const [qrUrl, setQrUrl] = useState<string>("");
  const [projectName, setProjectName] = useState("");
  const [expiresAt, setExpiresAt] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const generate = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/projects/${projectId}/week-share`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ week: weekNumber }),
        });
        if (res.ok) {
          const data = await res.json();
          setShareUrl(data.url);
          setQrUrl(data.qr_url);
          setProjectName(data.project_name || "");
          setExpiresAt(data.expires_at || "");
        } else {
          setError("Failed to generate share link");
        }
      } catch {
        setError("Failed to generate share link");
      } finally {
        setLoading(false);
      }
    };
    generate();
  }, [projectId, weekNumber]);

  const handleCopy = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!shareUrl) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${projectName} — Week ${weekNumber} Lookahead`,
          text: `Week ${weekNumber} schedule lookahead for ${projectName}`,
          url: shareUrl,
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

      <div className="relative bg-[#121217] border border-[#1F1F25] rounded-2xl w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1F1F25]">
          <div className="flex items-center gap-2">
            <QrCode size={16} className="text-[#F97316]" />
            <span className="text-sm font-bold text-white">
              Week {weekNumber} QR Code
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#1F1F25] text-gray-400 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-5 flex flex-col items-center">
          {loading && (
            <div className="flex flex-col items-center gap-3 py-8">
              <Loader2 size={24} className="text-[#F97316] animate-spin" />
              <span className="text-sm text-gray-500">Generating QR code…</span>
            </div>
          )}

          {error && !loading && (
            <div className="py-8 text-center">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {qrUrl && !loading && !error && (
            <>
              {/* QR Code */}
              <div className="bg-white p-4 rounded-xl mb-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrUrl}
                  alt={`QR code for Week ${weekNumber} lookahead`}
                  width={200}
                  height={200}
                  className="w-[200px] h-[200px]"
                />
              </div>

              {/* Info */}
              <div className="text-center mb-4">
                <p className="text-white font-semibold text-sm">{projectName}</p>
                <p className="text-gray-500 text-xs mt-0.5">
                  Week {weekNumber} Lookahead
                </p>
                {expiresAt && (
                  <p className="text-gray-600 text-[10px] mt-1">
                    Expires {new Date(expiresAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                )}
              </div>

              {/* URL display */}
              <div className="w-full bg-[#0B0B0D] border border-[#1F1F25] rounded-lg px-3 py-2 mb-4">
                <p className="text-[10px] text-gray-400 truncate font-mono">{shareUrl}</p>
              </div>

              {/* Actions */}
              <div className="flex gap-2 w-full">
                <button
                  onClick={handleCopy}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-[#1F1F25] hover:bg-[#2a2a35] text-gray-300 rounded-lg text-xs font-semibold transition-colors"
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
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-[#F97316] hover:bg-[#ea6c10] text-white rounded-lg text-xs font-bold transition-colors"
                >
                  <Share2 size={14} />
                  Share
                </button>
              </div>

              <p className="text-[10px] text-gray-600 mt-3 text-center">
                Anyone with this link can view the schedule. No login required.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
