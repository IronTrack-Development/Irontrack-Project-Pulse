"use client";

import { useEffect, useRef, useState } from "react";
import {
  X,
  MessageSquare,
  Mail,
  Copy,
  Check,
  Send,
  AlertTriangle,
  ArrowLeft,
  User,
  Building2,
  Calendar,
  Phone,
} from "lucide-react";
import type { ParsedActivity, ReadyCheck, ReadyCheckContact, ReadyCheckType } from "@/types";
import {
  generateReadyCheckMessage,
  generateFollowUpMessage,
  formatActivityDate,
} from "@/lib/ready-check-templates";

// ── Props ─────────────────────────────────────────────────────────────────────

interface ReadyCheckModalProps {
  activity: ParsedActivity;
  projectId: string;
  projectName?: string;
  onClose: () => void;
  onSent?: (check: ReadyCheck) => void;
  /** If provided, modal opens in follow-up mode for an existing check */
  existingCheck?: ReadyCheck;
}

// ── Check Type Config ─────────────────────────────────────────────────────────

const CHECK_TYPES: {
  value: ReadyCheckType;
  label: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    value: "standard",
    label: "Standard",
    description: "Confirm manpower, materials & constraints",
    icon: <Send size={14} />,
  },
  {
    value: "critical_path",
    label: "Critical Path",
    description: "Urgent — any slip impacts the whole schedule",
    icon: <AlertTriangle size={14} />,
  },
  {
    value: "friendly_reminder",
    label: "Friendly Reminder",
    description: "Low-pressure heads-up for upcoming work",
    icon: <MessageSquare size={14} />,
  },
];

// ── Step Types ────────────────────────────────────────────────────────────────

type Step = "setup" | "send_method" | "confirmation";

// ── Main Component ────────────────────────────────────────────────────────────

export default function ReadyCheckModal({
  activity,
  projectId,
  projectName,
  onClose,
  onSent,
  existingCheck,
}: ReadyCheckModalProps) {
  const isFollowUp = !!existingCheck;

  // ── State ──────────────────────────────────────────────────────────────────
  const [step, setStep] = useState<Step>("setup");
  const [checkType, setCheckType] = useState<ReadyCheckType>("standard");
  const contactName = existingCheck?.contact_name ?? "";
  const contactPhone = existingCheck?.contact_phone ?? "";
  const contactEmail = existingCheck?.contact_email ?? "";
  const contactCompany = existingCheck?.contact_company ?? "";
  const [isEditingMessage, setIsEditingMessage] = useState(false);
  const [customMessage, setCustomMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sentCheck, setSentCheck] = useState<ReadyCheck | null>(null);
  const [copied, setCopied] = useState(false);
  const [savedContact, setSavedContact] = useState<ReadyCheckContact | null>(null);
  const [loadingContact, setLoadingContact] = useState(false);

  const formattedDate = formatActivityDate(activity.start_date);
  const trade = activity.trade || activity.normalized_trade || "";

  // ── Auto-generate message ──────────────────────────────────────────────────
  const generatedMessage = isFollowUp
    ? generateFollowUpMessage({
        contactName: contactName || "there",
        activityName: activity.activity_name,
        startDate: formattedDate,
      })
    : generateReadyCheckMessage({
        type: checkType,
        contactName: contactName || "there",
        activityName: activity.activity_name,
        startDate: formattedDate,
        building: activity.normalized_building ?? undefined,
        trade,
        projectName,
      });

  const finalMessage = isEditingMessage ? customMessage : generatedMessage;

  // Update customMessage when generated changes (so "edit" starts from current)
  const prevGeneratedRef = useRef(generatedMessage);
  useEffect(() => {
    if (!isEditingMessage) {
      prevGeneratedRef.current = generatedMessage;
    }
  }, [generatedMessage, isEditingMessage]);

  // Contact auto-load removed for V1 — contact fields not shown

  // ── Keyboard close ─────────────────────────────────────────────────────────
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // ── Send handler ───────────────────────────────────────────────────────────
  const handleSend = async (method: "sms" | "email" | "copy") => {
    setSending(true);
    try {
      if (isFollowUp && existingCheck) {
        // PATCH the existing check
        const res = await fetch(
          `/api/projects/${projectId}/ready-checks/${existingCheck.id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ follow_up: true }),
          }
        );
        if (res.ok) {
          const updated: ReadyCheck = await res.json();
          setSentCheck(updated);
          onSent?.(updated);
        }
      } else {
        // POST new ready check
        const res = await fetch(`/api/projects/${projectId}/ready-checks`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            activity_id: activity.id,
            contact_name: trade || "Subcontractor",
            contact_company: undefined,
            contact_phone: undefined,
            contact_email: undefined,
            activity_name: activity.activity_name,
            trade,
            start_date: activity.start_date,
            normalized_building: activity.normalized_building,
            check_type: checkType,
            message_text: finalMessage,
            send_method: method,
            contact_id: savedContact?.id,
          }),
        });
        if (res.ok) {
          const created: ReadyCheck = await res.json();
          setSentCheck(created);
          onSent?.(created);
        }
      }

      // Open the actual send channel
      if (method === "sms" && contactPhone) {
        window.open(`sms:${contactPhone}?body=${encodeURIComponent(finalMessage)}`, "_self");
      } else if (method === "email" && contactEmail) {
        const subject = `Ready Check: ${activity.activity_name}`;
        window.open(
          `mailto:${contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(finalMessage)}`,
          "_self"
        );
      } else if (method === "copy") {
        await navigator.clipboard.writeText(finalMessage);
        setCopied(true);
      }

      setStep("confirmation");
    } catch {
      // Silent fail — still move to confirmation if we can
      setStep("confirmation");
    } finally {
      setSending(false);
    }
  };

  // ── Render helpers ─────────────────────────────────────────────────────────

  const renderActivityCard = () => (
    <div className="bg-[#0B0B0D] border border-[#1F1F25] rounded-xl p-3 space-y-2">
      <div className="text-sm font-semibold text-white leading-tight">{activity.activity_name}</div>
      <div className="flex flex-wrap gap-3 text-xs text-gray-400">
        {trade && (
          <span className="flex items-center gap-1">
            <User size={11} className="text-[#F97316]" />
            {trade}
          </span>
        )}
        {activity.start_date && (
          <span className="flex items-center gap-1">
            <Calendar size={11} className="text-[#3B82F6]" />
            {formattedDate}
          </span>
        )}
        {activity.normalized_building && (
          <span className="flex items-center gap-1">
            <Building2 size={11} className="text-gray-500" />
            {activity.normalized_building
              .split("_")
              .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
              .join(" ")}
          </span>
        )}
      </div>
    </div>
  );

  // ── Step 1: Setup ──────────────────────────────────────────────────────────

  const renderSetup = () => (
    <div className="flex flex-col h-full">
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-32 space-y-4">
        {/* Activity card */}
        {renderActivityCard()}

        {/* Follow-up notice */}
        {isFollowUp && (
          <div className="bg-[#F97316]/10 border border-[#F97316]/30 rounded-xl px-3 py-2">
            <div className="text-xs font-semibold text-[#F97316]">
              Follow-up #{(existingCheck?.follow_up_count ?? 0) + 1}
            </div>
            <div className="text-xs text-gray-400 mt-0.5">
              Original sent{" "}
              {existingCheck?.sent_at
                ? new Date(existingCheck.sent_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })
                : "earlier"}
            </div>
          </div>
        )}

        {/* Contact section removed for V1 — users share via copy/native share */}

        {/* Check type selector (hidden for follow-ups) */}
        {!isFollowUp && (
          <div className="space-y-2">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Check Type
            </div>
            <div className="space-y-2">
              {CHECK_TYPES.map((ct) => {
                const isActive = checkType === ct.value;
                return (
                  <button
                    key={ct.value}
                    onClick={() => setCheckType(ct.value)}
                    className={`w-full flex items-start gap-3 px-3 py-3 rounded-xl border transition-all text-left ${
                      isActive
                        ? "bg-[#F97316]/10 border-[#F97316]/50 text-white"
                        : "bg-[#0B0B0D] border-[#1F1F25] text-gray-400 hover:border-gray-600"
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center mt-0.5 shrink-0 transition-all ${
                        isActive ? "border-[#F97316] bg-[#F97316]" : "border-gray-600"
                      }`}
                    >
                      {isActive && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-semibold ${isActive ? "text-white" : "text-gray-300"}`}>
                        {ct.label}
                      </div>
                      <div className="text-[11px] text-gray-500 mt-0.5">{ct.description}</div>
                    </div>
                    <span className={isActive ? "text-[#F97316]" : "text-gray-700"}>
                      {ct.icon}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Message preview */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Message Preview
            </div>
            <button
              onClick={() => {
                if (!isEditingMessage) setCustomMessage(generatedMessage);
                setIsEditingMessage(!isEditingMessage);
              }}
              className="text-xs text-[#F97316] hover:text-[#ea6c10] transition-colors"
            >
              {isEditingMessage ? "Use Template" : "Edit"}
            </button>
          </div>

          {isEditingMessage ? (
            <textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              rows={6}
              className="w-full bg-[#0B0B0D] border border-[#F97316]/30 rounded-xl p-4 text-sm text-gray-300 font-mono leading-relaxed focus:outline-none focus:border-[#F97316]/60 resize-none transition-colors"
            />
          ) : (
            <div className="bg-[#0B0B0D] border border-[#1F1F25] rounded-xl p-4 text-sm text-gray-300 font-mono leading-relaxed whitespace-pre-wrap">
              {generatedMessage}
            </div>
          )}
        </div>
      </div>

      {/* Sticky send button */}
      <div className="absolute bottom-0 left-0 right-0 px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom)+64px)] sm:pb-6 pt-4 bg-gradient-to-t from-[#121217] via-[#121217]/95 to-transparent">
        <button
          onClick={() => setStep("send_method")}
          className="w-full flex items-center justify-center gap-2 bg-[#F97316] hover:bg-[#ea6c10] text-white font-bold rounded-xl py-3.5 text-sm transition-colors"
        >
          <Send size={16} />
          {isFollowUp ? "Send Follow-Up" : "Send Ready Check"}
        </button>
      </div>
    </div>
  );

  // ── Step 2: Send Method ────────────────────────────────────────────────────

  const renderSendMethod = () => (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-4 space-y-4">
        <div className="text-center">
          <div className="text-base font-bold text-white mb-1">How do you want to share it?</div>
          <div className="text-xs text-gray-500">
            {activity.activity_name}
          </div>
        </div>

        {/* Message preview */}
        <div className="bg-[#0B0B0D] border border-[#1F1F25] rounded-xl p-3 text-xs text-gray-400 font-mono leading-relaxed whitespace-pre-wrap max-h-32 overflow-y-auto">
          {finalMessage}
        </div>

        <div className="space-y-3">
          {/* Copy */}
          <button
            onClick={() => handleSend("copy")}
            disabled={sending}
            className="w-full flex items-center gap-4 bg-[#1F1F25] hover:bg-[#2a2a35] disabled:opacity-60 rounded-xl py-4 px-5 transition-colors text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-[#F97316]/15 flex items-center justify-center shrink-0">
              {copied ? (
                <Check size={20} className="text-[#22C55E]" />
              ) : (
                <Copy size={20} className="text-[#F97316]" />
              )}
            </div>
            <div>
              <div className="text-sm font-bold text-white">
                {copied ? "Copied!" : "Copy Message"}
              </div>
              <div className="text-xs text-gray-500">Paste into any app</div>
            </div>
          </button>

          {/* Native Share */}
          {typeof navigator !== "undefined" && !!navigator.share && (
            <button
              onClick={async () => {
                try {
                  await navigator.share({ title: `Ready Check: ${activity.activity_name}`, text: finalMessage });
                  await handleSend("copy");
                } catch { /* user cancelled */ }
              }}
              disabled={sending}
              className="w-full flex items-center gap-4 bg-[#1F1F25] hover:bg-[#2a2a35] disabled:opacity-60 rounded-xl py-4 px-5 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-[#3B82F6]/15 flex items-center justify-center shrink-0">
                <Send size={20} className="text-[#3B82F6]" />
              </div>
              <div>
                <div className="text-sm font-bold text-white">Share</div>
                <div className="text-xs text-gray-500">Text, email, or any app</div>
              </div>
            </button>
          )}
        </div>
      </div>

      <div className="px-4 pb-6">
        <button
          onClick={() => setStep("setup")}
          className="w-full flex items-center justify-center gap-1.5 text-gray-500 hover:text-gray-300 text-sm py-2 transition-colors"
        >
          <ArrowLeft size={14} />
          Back
        </button>
      </div>
    </div>
  );

  // ── Step 3: Confirmation ───────────────────────────────────────────────────

  const renderConfirmation = () => (
    <div className="flex flex-col items-center justify-center h-full px-6 text-center gap-4">
      {/* Animated checkmark */}
      <div className="w-16 h-16 rounded-full bg-[#22C55E]/15 border border-[#22C55E]/30 flex items-center justify-center animate-[scale-in_0.3s_ease-out]">
        <Check size={32} className="text-[#22C55E]" />
      </div>

      <div>
        <div className="text-xl font-bold text-white mb-1">
          {isFollowUp ? "Follow-Up Sent" : "Ready Check Sent"}
        </div>
        <div className="text-sm text-gray-400">
          {activity.activity_name}
        </div>
        <div className="text-xs text-gray-600 mt-1">
          {new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
        </div>
      </div>

      <div className="bg-[#0B0B0D] border border-[#1F1F25] rounded-xl px-4 py-2.5 inline-flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-[#EAB308] shrink-0" />
        <span className="text-xs font-semibold text-[#EAB308]">Awaiting Response</span>
      </div>

      {sentCheck && (
        <div className="text-xs text-gray-600">
          Activity: {sentCheck.activity_name}
        </div>
      )}

      <div className="w-full mt-4">
        <button
          onClick={onClose}
          className="w-full bg-[#1F1F25] hover:bg-[#2a2a35] text-white font-semibold rounded-xl py-3.5 text-sm transition-colors"
        >
          Back to Schedule
        </button>
      </div>
    </div>
  );

  // ── Layout ─────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-200"
        onClick={step !== "confirmation" ? onClose : undefined}
      />

      {/* Modal */}
      <div className="fixed inset-x-0 bottom-0 z-50 sm:inset-0 sm:flex sm:items-center sm:justify-center sm:p-4">
        <div className="relative bg-[#121217] rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg h-[90vh] sm:h-auto sm:max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-[#1F1F25] animate-slide-up">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#1F1F25] shrink-0">
            <div className="flex items-center gap-2">
              {step === "send_method" && (
                <button
                  onClick={() => setStep("setup")}
                  className="p-1.5 rounded-lg hover:bg-[#1F1F25] text-gray-400 hover:text-white transition-colors"
                >
                  <ArrowLeft size={16} />
                </button>
              )}
              <div className="text-sm font-bold text-white">
                {isFollowUp
                  ? "Send Follow-Up"
                  : step === "confirmation"
                  ? "Sent"
                  : "Ready Check"}
              </div>
              {trade && step !== "confirmation" && (
                <span className="text-[10px] font-semibold bg-[#F97316]/15 text-[#F97316] px-2 py-0.5 rounded-full">
                  {trade}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-[#1F1F25] text-gray-400 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 relative overflow-hidden">
            {step === "setup" && renderSetup()}
            {step === "send_method" && renderSendMethod()}
            {step === "confirmation" && renderConfirmation()}
          </div>
        </div>
      </div>
    </>
  );
}
