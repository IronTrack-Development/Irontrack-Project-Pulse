"use client";

import { useState } from "react";
import { Plus, Check, X, Users } from "lucide-react";
import type { ToolboxTalkAttendee } from "@/types";

interface AttendanceSheetProps {
  projectId: string;
  talkId: string;
  attendees: ToolboxTalkAttendee[];
  readOnly?: boolean;
  onRefresh: () => void;
}

export default function AttendanceSheet({
  projectId,
  talkId,
  attendees,
  readOnly = false,
  onRefresh,
}: AttendanceSheetProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState("");
  const [trade, setTrade] = useState("");
  const [company, setCompany] = useState("");
  const [adding, setAdding] = useState(false);
  const [signingId, setSigningId] = useState<string | null>(null);

  const signedCount = attendees.filter((a) => a.signed).length;

  const handleAdd = async () => {
    if (!name.trim()) return;
    setAdding(true);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/safety/${talkId}/attendees`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            trade: trade.trim() || null,
            company: company.trim() || null,
          }),
        }
      );
      if (res.ok) {
        setName("");
        setTrade("");
        setCompany("");
        setShowAddForm(false);
        onRefresh();
      }
    } catch {}
    setAdding(false);
  };

  const handleSign = async (attendeeId: string, signed: boolean) => {
    setSigningId(attendeeId);
    try {
      await fetch(`/api/projects/${projectId}/safety/${talkId}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attendee_id: attendeeId, signed }),
      });
      onRefresh();
    } catch {}
    setSigningId(null);
  };

  const handleRemove = async (attendeeId: string) => {
    try {
      await fetch(
        `/api/projects/${projectId}/safety/${talkId}/attendees?attendeeId=${attendeeId}`,
        { method: "DELETE" }
      );
      onRefresh();
    } catch {}
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Users size={14} className="text-[#F97316]" />
          <span className="text-sm font-medium text-[color:var(--text-primary)]">Attendance</span>
          <span className="text-xs text-[color:var(--text-muted)]">
            {signedCount} of {attendees.length} signed
          </span>
        </div>
        {!readOnly && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1 text-xs text-[#F97316] hover:text-[#ea6c10] min-h-[44px] px-2"
          >
            <Plus size={12} />
            Add
          </button>
        )}
      </div>

      {/* Add form */}
      {showAddForm && !readOnly && (
        <div className="bg-[#0B0B0D] border border-[#1F1F25] rounded-xl p-3 mb-3">
          <div className="grid grid-cols-3 gap-2 mb-2">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name *"
              className="bg-[#121217] border border-[#1F1F25] rounded-lg px-2.5 py-2 text-sm text-[color:var(--text-primary)] placeholder-gray-600 focus:outline-none focus:border-[#F97316] min-h-[44px]"
            />
            <input
              type="text"
              value={trade}
              onChange={(e) => setTrade(e.target.value)}
              placeholder="Trade"
              className="bg-[#121217] border border-[#1F1F25] rounded-lg px-2.5 py-2 text-sm text-[color:var(--text-primary)] placeholder-gray-600 focus:outline-none focus:border-[#F97316] min-h-[44px]"
            />
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Company"
              className="bg-[#121217] border border-[#1F1F25] rounded-lg px-2.5 py-2 text-sm text-[color:var(--text-primary)] placeholder-gray-600 focus:outline-none focus:border-[#F97316] min-h-[44px]"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 text-xs text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] min-h-[36px]"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={adding || !name.trim()}
              className="px-3 py-1.5 bg-[#F97316] hover:bg-[#ea6c10] text-[color:var(--text-primary)] rounded-lg text-xs font-medium disabled:opacity-50 min-h-[36px]"
            >
              {adding ? "Adding..." : "Add"}
            </button>
          </div>
        </div>
      )}

      {/* Attendee list */}
      {attendees.length === 0 ? (
        <div className="text-center py-6 text-gray-600 text-xs">
          No attendees added yet
        </div>
      ) : (
        <div className="space-y-1.5">
          {attendees.map((a) => (
            <div
              key={a.id}
              className="flex items-center gap-3 bg-[#0B0B0D] border border-[#1F1F25] rounded-lg px-3 py-2.5 min-h-[44px]"
            >
              {/* Sign toggle */}
              <button
                onClick={() => !readOnly && handleSign(a.id, !a.signed)}
                disabled={readOnly || signingId === a.id}
                className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                  a.signed
                    ? "bg-[#22C55E]/20 text-[#22C55E]"
                    : "bg-[#1F1F25] text-gray-600 hover:text-[color:var(--text-secondary)]"
                } ${readOnly ? "cursor-default" : "cursor-pointer"}`}
              >
                {a.signed && <Check size={14} />}
              </button>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="text-sm text-[color:var(--text-primary)] truncate">{a.name}</div>
                {(a.trade || a.company) && (
                  <div className="text-[10px] text-[color:var(--text-muted)] truncate">
                    {[a.trade, a.company].filter(Boolean).join(" · ")}
                  </div>
                )}
              </div>

              {/* Signed time */}
              {a.signed && a.signed_at && (
                <span className="text-[10px] text-[color:var(--text-muted)] shrink-0">
                  {new Date(a.signed_at).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              )}

              {/* Remove button */}
              {!readOnly && !a.signed && (
                <button
                  onClick={() => handleRemove(a.id)}
                  className="p-1 text-gray-600 hover:text-red-400 transition-colors min-w-[28px] min-h-[28px] flex items-center justify-center"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
