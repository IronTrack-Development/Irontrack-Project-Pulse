"use client";

interface RevisionBannerProps {
  currentRevision: string;
  viewingRevision: string;
  onViewCurrent: () => void;
}

export default function RevisionBanner({
  currentRevision,
  viewingRevision,
  onViewCurrent,
}: RevisionBannerProps) {
  if (viewingRevision === currentRevision) return null;

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-yellow-500/15 border border-yellow-500/30 rounded-lg text-sm">
      <span className="text-yellow-400">⚠</span>
      <span className="text-yellow-200 flex-1">
        You are viewing <strong>{viewingRevision}</strong> — <strong>{currentRevision}</strong> is current
      </span>
      <button
        onClick={onViewCurrent}
        className="text-yellow-400 hover:text-yellow-300 font-medium underline underline-offset-2 min-h-[44px] flex items-center"
      >
        View Current
      </button>
    </div>
  );
}
