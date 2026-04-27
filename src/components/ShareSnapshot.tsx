"use client";

import { useState, useEffect } from "react";
import { Share2, Copy, Check, X, Loader2 } from "lucide-react";

interface ShareSnapshotProps {
  projectId: string;
}

export default function ShareSnapshot({ projectId }: ShareSnapshotProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [snapshotText, setSnapshotText] = useState<string | null>(null);
  const [projectName, setProjectName] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCanShare(typeof navigator !== "undefined" && !!navigator.share);
  }, []);

  const fetchSnapshot = async () => {
    setLoading(true);
    setError(null);
    setSnapshotText(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/snapshot`);
      if (!res.ok) throw new Error("Failed to generate snapshot");
      const data = await res.json();
      setSnapshotText(data.text);
      setProjectName(data.projectName);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setOpen(true);
    fetchSnapshot();
  };

  const handleClose = () => {
    setOpen(false);
    setCopied(false);
    setSnapshotText(null);
    setError(null);
  };

  const handleCopy = async () => {
    if (!snapshotText) return;
    await navigator.clipboard.writeText(snapshotText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!snapshotText || !navigator.share) return;
    try {
      await navigator.share({
        title: `IronTrack Pulse — ${projectName}`,
        text: snapshotText,
        url: typeof window !== "undefined" ? window.location.href : undefined,
      });
    } catch {
      // User cancelled or share failed — silently ignore
    }
  };

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={handleOpen}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1F1F25] hover:bg-[#2a2a35] text-[color:var(--text-secondary)] rounded-lg text-xs font-medium transition-colors"
      >
        <Share2 size={13} />
        Share
      </button>

      {/* Modal backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleClose();
          }}
        >
          {/* Modal panel */}
          <div className="w-full max-w-lg bg-[#121217] border border-[#1F1F25] rounded-2xl shadow-2xl flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#1F1F25]">
              <div className="flex items-center gap-2">
                <Share2 size={15} className="text-[#F97316]" />
                <span className="text-sm font-semibold text-[color:var(--text-primary)]">Executive Snapshot</span>
              </div>
              <button
                onClick={handleClose}
                className="p-1 rounded-lg text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)] transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="px-5 py-4 flex-1">
              {loading && (
                <div className="flex items-center justify-center py-10 gap-2 text-[color:var(--text-muted)]">
                  <Loader2 size={18} className="animate-spin text-[#F97316]" />
                  <span className="text-sm">Generating snapshot…</span>
                </div>
              )}

              {error && !loading && (
                <div className="py-6 text-center text-sm text-red-400">
                  {error}
                </div>
              )}

              {snapshotText && !loading && (
                <pre className="whitespace-pre-wrap text-xs text-[color:var(--text-secondary)] font-mono leading-relaxed bg-[#0B0B0D] border border-[#1F1F25] rounded-xl px-4 py-3 max-h-72 overflow-y-auto">
                  {snapshotText}
                </pre>
              )}
            </div>

            {/* Footer actions */}
            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-[#1F1F25]">
              <button
                onClick={handleClose}
                className="px-3 py-1.5 text-xs text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] transition-colors"
              >
                Close
              </button>

              {canShare && snapshotText && (
                <button
                  onClick={handleShare}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1F1F25] hover:bg-[#2a2a35] text-[color:var(--text-secondary)] rounded-lg text-xs font-medium transition-colors"
                >
                  <Share2 size={13} />
                  Share
                </button>
              )}

              <button
                onClick={handleCopy}
                disabled={!snapshotText || loading}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-[#F97316] hover:bg-[#ea6c10] disabled:opacity-40 disabled:cursor-not-allowed text-[color:var(--text-primary)] rounded-lg text-xs font-semibold transition-colors"
              >
                {copied ? (
                  <>
                    <Check size={13} />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy size={13} />
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
