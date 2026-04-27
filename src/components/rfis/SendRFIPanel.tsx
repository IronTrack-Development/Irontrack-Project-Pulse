"use client";

import { useState } from "react";
import { Mail, Copy, Check } from "lucide-react";

interface SendRFIPanelProps {
  rfiNumber: string;
  subject: string;
  question: string;
  priority: string;
  specSection?: string;
  drawingReference?: string;
  dueDate?: string;
  costImpact: boolean;
  scheduleImpact: boolean;
}

export default function SendRFIPanel({
  rfiNumber, subject, question, priority,
  specSection, drawingReference, dueDate,
  costImpact, scheduleImpact,
}: SendRFIPanelProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [copied, setCopied] = useState(false);

  const formatDueDate = (d: string) => {
    try {
      return new Date(d + "T12:00:00").toLocaleDateString("en-US", {
        month: "long", day: "numeric", year: "numeric",
      });
    } catch { return d; }
  };

  const buildEmailBody = () => {
    const lines: string[] = [
      "REQUEST FOR INFORMATION",
      "",
      `RFI #: ${rfiNumber}`,
      `Subject: ${subject}`,
      `Priority: ${priority.charAt(0).toUpperCase() + priority.slice(1)}`,
    ];
    if (specSection) lines.push(`Spec Section: ${specSection}`);
    if (drawingReference) lines.push(`Drawing Reference: ${drawingReference}`);
    if (dueDate) lines.push(`Response Needed By: ${formatDueDate(dueDate)}`);
    lines.push("", "QUESTION:", question, "");
    if (costImpact) lines.push("⚠ Potential Cost Impact");
    if (scheduleImpact) lines.push("⚠ Potential Schedule Impact");
    lines.push("", "Please respond at your earliest convenience.", "", "---", "Sent via IronTrack Pulse");
    return lines.join("\n");
  };

  const buildCopyText = () => {
    const lines: string[] = [
      `RFI ${rfiNumber}: ${subject}`,
      `Priority: ${priority}`,
    ];
    if (specSection) lines.push(`Spec: ${specSection}`);
    if (dueDate) lines.push(`Due: ${formatDueDate(dueDate)}`);
    lines.push("", question, "");
    if (costImpact) lines.push("Cost Impact: Yes");
    if (scheduleImpact) lines.push("Schedule Impact: Yes");
    return lines.join("\n");
  };

  const handleSendEmail = () => {
    const emailSubject = `RFI ${rfiNumber}: ${subject}`;
    const body = buildEmailBody();
    window.open(
      `mailto:${email}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(body)}`,
      "_self"
    );
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(buildCopyText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-[#F97316]/40 hover:border-[#F97316] text-[#F97316] font-semibold text-sm transition-all min-h-[44px]"
      >
        <Mail size={14} />
        Send RFI to Architect / Engineer
      </button>

      {open && (
        <div className="mt-3 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl p-4 space-y-3">
          <div>
            <label className="text-xs font-medium text-[color:var(--text-muted)] mb-1 block">
              Recipient Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="architect@example.com"
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg px-3 py-2.5 text-sm text-[color:var(--text-primary)] placeholder-gray-500 focus:outline-none focus:border-[#F97316]/50 min-h-[44px]"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSendEmail}
              disabled={!email.includes("@")}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#F97316] hover:bg-[#ea6c10] text-white font-semibold text-sm disabled:opacity-40 transition-all min-h-[44px]"
            >
              <Mail size={14} />
              Send via Email
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] text-[color:var(--text-secondary)] text-sm font-medium transition-all min-h-[44px]"
            >
              {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
