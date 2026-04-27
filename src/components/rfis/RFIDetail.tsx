"use client";

import { useState } from "react";
import {
  X, Clock, DollarSign, User, FileText, Calendar, ChevronRight,
  Send, CheckCircle2, XCircle, Loader2, MessageSquare, Camera,
} from "lucide-react";

interface RFIPhoto {
  id: string;
  storage_path: string;
  caption?: string;
}

interface RFIResponse {
  id: string;
  response_text: string;
  responded_by_name?: string;
  created_at: string;
}

interface RFI {
  id: string;
  rfi_number: string;
  subject: string;
  question: string;
  spec_section?: string;
  drawing_reference?: string;
  priority: string;
  status: string;
  cost_impact: boolean;
  schedule_impact: boolean;
  due_date?: string;
  submitted_date?: string;
  answered_date?: string;
  days_open?: number | null;
  notes?: string;
  ai_drafted?: boolean;
  assigned_contact?: { id: string; name: string; company: string; role: string } | null;
  rfi_responses?: RFIResponse[];
  rfi_photos?: RFIPhoto[];
}

interface RFIDetailProps {
  rfi: RFI;
  projectId: string;
  onClose: () => void;
  onUpdated: () => void;
  supabaseUrl: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  draft:        { label: "Draft",        color: "#6B7280", bg: "bg-gray-700/30" },
  submitted:    { label: "Submitted",    color: "#EAB308", bg: "bg-yellow-500/15" },
  under_review: { label: "Under Review", color: "#A855F7", bg: "bg-purple-500/15" },
  answered:     { label: "Answered",     color: "#22C55E", bg: "bg-green-500/15" },
  closed:       { label: "Closed",       color: "#374151", bg: "bg-[color:var(--bg-tertiary)]/50" },
};

const PRIORITY_CONFIG: Record<string, { color: string; bg: string }> = {
  critical: { color: "#EF4444", bg: "bg-red-500/20" },
  high:     { color: "#F97316", bg: "bg-orange-500/20" },
  normal:   { color: "#3B82F6", bg: "bg-blue-500/20" },
  low:      { color: "#6B7280", bg: "bg-gray-700/30" },
};

export default function RFIDetail({ rfi, projectId, onClose, onUpdated, supabaseUrl }: RFIDetailProps) {
  const [responseText, setResponseText] = useState("");
  const [respondedByName, setRespondedByName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const statusCfg = STATUS_CONFIG[rfi.status] || STATUS_CONFIG.draft;
  const priorityCfg = PRIORITY_CONFIG[rfi.priority] || PRIORITY_CONFIG.normal;

  const isOverdue = rfi.due_date && rfi.status !== "answered" && rfi.status !== "closed"
    && new Date(rfi.due_date) < new Date();

  const updateStatus = async (newStatus: string) => {
    setIsUpdatingStatus(true);
    try {
      await fetch(`/api/projects/${projectId}/rfis/${rfi.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      onUpdated();
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const submitResponse = async () => {
    if (!responseText.trim()) return;
    setIsSubmitting(true);
    try {
      await fetch(`/api/projects/${projectId}/rfis/${rfi.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          response_text: responseText,
          responded_by_name: respondedByName || null,
        }),
      });
      setResponseText("");
      setRespondedByName("");
      onUpdated();
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (d?: string) => {
    if (!d) return null;
    try {
      return new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch { return d; }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-end md:items-center justify-center">
      <div className="w-full max-w-xl bg-[#121217] rounded-t-3xl md:rounded-3xl border border-[#1F1F25] max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-[#121217] px-5 py-4 border-b border-[#1F1F25] flex items-start justify-between rounded-t-3xl z-10">
          <div className="flex-1 min-w-0 mr-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-[color:var(--text-muted)]">{rfi.rfi_number}</span>
              {rfi.ai_drafted && (
                <span className="text-xs px-1.5 py-0.5 rounded bg-[#F97316]/15 text-[#F97316]">✨ AI</span>
              )}
            </div>
            <h2 className="text-sm font-semibold text-[color:var(--text-primary)] leading-snug">{rfi.subject}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[#1F1F25] text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)] transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-5 space-y-5">
          {/* Status + Priority badges */}
          <div className="flex flex-wrap gap-2">
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusCfg.bg}`} style={{ color: statusCfg.color }}>
              {statusCfg.label}
            </span>
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${priorityCfg.bg}`} style={{ color: priorityCfg.color }}>
              {rfi.priority.charAt(0).toUpperCase() + rfi.priority.slice(1)}
            </span>
            {rfi.cost_impact && (
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-500/15 text-yellow-400 flex items-center gap-1">
                <DollarSign size={10} />Cost Impact
              </span>
            )}
            {rfi.schedule_impact && (
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/15 text-red-400 flex items-center gap-1">
                <Clock size={10} />Schedule Impact
              </span>
            )}
          </div>

          {/* Question */}
          <div>
            <p className="text-xs font-medium text-[color:var(--text-muted)] mb-1.5 flex items-center gap-1">
              <FileText size={11} />Question
            </p>
            <p className="text-sm text-gray-200 leading-relaxed">{rfi.question}</p>
          </div>

          {/* Meta info */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            {rfi.spec_section && (
              <div>
                <p className="text-[color:var(--text-muted)] mb-0.5">Spec Section</p>
                <p className="text-[color:var(--text-secondary)]">{rfi.spec_section}</p>
              </div>
            )}
            {rfi.drawing_reference && (
              <div>
                <p className="text-[color:var(--text-muted)] mb-0.5">Drawing Ref</p>
                <p className="text-[color:var(--text-secondary)]">{rfi.drawing_reference}</p>
              </div>
            )}
            {rfi.assigned_contact && (
              <div>
                <p className="text-[color:var(--text-muted)] mb-0.5 flex items-center gap-1"><User size={10} />Assigned To</p>
                <p className="text-[color:var(--text-secondary)]">{rfi.assigned_contact.name}</p>
                <p className="text-[color:var(--text-muted)]">{rfi.assigned_contact.company}</p>
              </div>
            )}
            {rfi.due_date && (
              <div>
                <p className={`mb-0.5 flex items-center gap-1 ${isOverdue ? "text-red-400" : "text-[color:var(--text-muted)]"}`}>
                  <Calendar size={10} />Due Date
                </p>
                <p className={isOverdue ? "text-red-400 font-medium" : "text-[color:var(--text-secondary)]"}>{formatDate(rfi.due_date)}</p>
              </div>
            )}
            {rfi.submitted_date && (
              <div>
                <p className="text-[color:var(--text-muted)] mb-0.5">Submitted</p>
                <p className="text-[color:var(--text-secondary)]">{formatDate(rfi.submitted_date)}</p>
              </div>
            )}
            {rfi.days_open != null && (
              <div>
                <p className="text-[color:var(--text-muted)] mb-0.5">Days Open</p>
                <p className={`font-medium ${(rfi.days_open || 0) > 14 ? "text-red-400" : "text-[color:var(--text-secondary)]"}`}>{rfi.days_open} days</p>
              </div>
            )}
          </div>

          {/* Photos */}
          {rfi.rfi_photos && rfi.rfi_photos.length > 0 && (
            <div>
              <p className="text-xs font-medium text-[color:var(--text-muted)] mb-2 flex items-center gap-1">
                <Camera size={11} />Photos ({rfi.rfi_photos.length})
              </p>
              <div className="grid grid-cols-3 gap-2">
                {rfi.rfi_photos.map((photo) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={photo.id}
                    src={`${supabaseUrl}/storage/v1/object/public/rfi-photos/${photo.storage_path}`}
                    alt={photo.caption || "RFI photo"}
                    className="aspect-square rounded-xl object-cover w-full"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Response timeline */}
          {rfi.rfi_responses && rfi.rfi_responses.length > 0 && (
            <div>
              <p className="text-xs font-medium text-[color:var(--text-muted)] mb-3 flex items-center gap-1">
                <MessageSquare size={11} />Responses ({rfi.rfi_responses.length})
              </p>
              <div className="space-y-3">
                {rfi.rfi_responses.map((resp) => (
                  <div key={resp.id} className="bg-[#0B0B0D] border border-[#1F1F25] rounded-xl p-3">
                    {resp.responded_by_name && (
                      <p className="text-xs font-medium text-[#F97316] mb-1">{resp.responded_by_name}</p>
                    )}
                    <p className="text-sm text-[color:var(--text-secondary)] leading-relaxed">{resp.response_text}</p>
                    <p className="text-xs text-gray-600 mt-1.5">
                      {new Date(resp.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add response */}
          {rfi.status !== "closed" && (
            <div>
              <p className="text-xs font-medium text-[color:var(--text-muted)] mb-2">Add Response</p>
              <input
                type="text"
                value={respondedByName}
                onChange={(e) => setRespondedByName(e.target.value)}
                placeholder="Respondent name (optional)"
                className="w-full bg-[#0B0B0D] border border-[#1F1F25] rounded-xl px-4 py-2.5 text-sm text-[color:var(--text-primary)]
                  placeholder-gray-600 focus:outline-none focus:border-[#F97316]/50 mb-2 min-h-[44px]"
              />
              <textarea
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                placeholder="Enter response..."
                rows={3}
                className="w-full bg-[#0B0B0D] border border-[#1F1F25] rounded-xl px-4 py-3 text-sm text-[color:var(--text-primary)]
                  placeholder-gray-600 resize-none focus:outline-none focus:border-[#F97316]/50 mb-2"
              />
              <button
                onClick={submitResponse}
                disabled={!responseText.trim() || isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl
                  bg-[#F97316] hover:bg-[#ea6c10] text-[color:var(--text-primary)] font-semibold text-sm
                  disabled:opacity-50 transition-all min-h-[44px]"
              >
                {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                Add Response
              </button>
            </div>
          )}

          {/* Quick actions */}
          {rfi.status !== "closed" && (
            <div>
              <p className="text-xs font-medium text-[color:var(--text-muted)] mb-2">Quick Actions</p>
              <div className="flex gap-2 flex-wrap">
                {rfi.status === "draft" && (
                  <button
                    onClick={() => updateStatus("submitted")}
                    disabled={isUpdatingStatus}
                    className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-yellow-500/15 text-yellow-400
                      hover:bg-yellow-500/25 text-xs font-medium transition-all min-h-[44px]"
                  >
                    <ChevronRight size={12} />Submit
                  </button>
                )}
                {(rfi.status === "submitted" || rfi.status === "under_review") && (
                  <button
                    onClick={() => updateStatus("answered")}
                    disabled={isUpdatingStatus}
                    className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-green-500/15 text-green-400
                      hover:bg-green-500/25 text-xs font-medium transition-all min-h-[44px]"
                  >
                    <CheckCircle2 size={12} />Mark Answered
                  </button>
                )}
                <button
                  onClick={() => updateStatus("closed")}
                  disabled={isUpdatingStatus}
                  className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-gray-700/30 text-[color:var(--text-secondary)]
                    hover:bg-gray-700/50 text-xs font-medium transition-all min-h-[44px]"
                >
                  <XCircle size={12} />Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
