"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ArrowLeft,
  RefreshCw,
  Plus,
  CheckCircle,
  Trash2,
  FileText,
  Loader2,
  AlertTriangle,
  Users,
  X,
  Wand2,
} from "lucide-react";
import type {
  CoordinationMeeting,
  CoordinationAgendaItem,
  CoordinationActionItem,
  CoordinationAttendee,
  ScheduleConflict,
} from "@/types";
import ConflictDetector from "./ConflictDetector";

interface MeetingDetailProps {
  projectId: string;
  meetingId: string;
  onBack: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  scheduled: "#3B82F6",
  in_progress: "#F97316",
  completed: "#22C55E",
  cancelled: "var(--text-muted)",
};

const AGENDA_STATUS_COLORS: Record<string, string> = {
  pending: "#3B82F6",
  discussed: "#F97316",
  deferred: "#EAB308",
  resolved: "#22C55E",
};

const PRIORITY_COLORS: Record<string, string> = {
  high: "#EF4444",
  medium: "#EAB308",
  low: "var(--text-muted)",
};

const CATEGORY_COLORS: Record<string, string> = {
  general: "var(--text-muted)",
  rfi: "#8B5CF6",
  material_delivery: "#3B82F6",
  manpower: "#F97316",
  equipment: "#EAB308",
  schedule: "#22C55E",
  safety: "#EF4444",
  drawing: "#EC4899",
  submittal: "#06B6D4",
  inspection: "#14B8A6",
  custom: "var(--text-secondary)",
};

export default function MeetingDetail({ projectId, meetingId, onBack }: MeetingDetailProps) {
  const [meeting, setMeeting] = useState<CoordinationMeeting | null>(null);
  const [agendaItems, setAgendaItems] = useState<CoordinationAgendaItem[]>([]);
  const [actionItems, setActionItems] = useState<CoordinationActionItem[]>([]);
  const [attendees, setAttendees] = useState<CoordinationAttendee[]>([]);
  const [conflicts, setConflicts] = useState<ScheduleConflict[]>([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [completing, setCompleting] = useState(false);

  // Inline add states
  const [newAgendaTitle, setNewAgendaTitle] = useState("");
  const [newActionTitle, setNewActionTitle] = useState("");
  const [newActionAssignee, setNewActionAssignee] = useState("");
  const [newActionCategory, setNewActionCategory] = useState("general");
  const [newActionPriority, setNewActionPriority] = useState("medium");
  const [newAttendeeName, setNewAttendeeName] = useState("");
  const [newAttendeeCompany, setNewAttendeeCompany] = useState("");

  const fetchMeeting = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/coordination/${meetingId}`);
      if (res.ok) {
        const data = await res.json();
        setMeeting(data);
        setAgendaItems(data.agenda_items || []);
        setActionItems(data.action_items || []);
        setAttendees(data.attendees || []);
        setNotes(data.notes || "");
      }
    } catch (e) { /* silent */ }
    setLoading(false);
  }, [projectId, meetingId]);

  const fetchConflicts = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/coordination/conflicts`);
      if (res.ok) {
        const data = await res.json();
        setConflicts(data.conflicts || []);
      }
    } catch (e) { /* silent */ }
  }, [projectId]);

  useEffect(() => {
    fetchMeeting();
    fetchConflicts();
  }, [fetchMeeting, fetchConflicts]);

  const saveNotes = async () => {
    setSavingNotes(true);
    await fetch(`/api/projects/${projectId}/coordination/${meetingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes }),
    });
    setSavingNotes(false);
  };

  const completeMeeting = async () => {
    setCompleting(true);
    const res = await fetch(`/api/projects/${projectId}/coordination/${meetingId}/complete`, {
      method: "POST",
    });
    if (res.ok) {
      const data = await res.json();
      setMeeting(data);
    }
    setCompleting(false);
  };

  const deleteMeeting = async () => {
    if (!confirm("Delete this meeting? This cannot be undone.")) return;
    const res = await fetch(`/api/projects/${projectId}/coordination/${meetingId}`, {
      method: "DELETE",
    });
    if (res.ok) onBack();
  };

  const exportPdf = () => {
    window.open(`/api/projects/${projectId}/coordination/${meetingId}/pdf`, "_blank");
  };

  // Agenda operations
  const addAgendaItem = async () => {
    if (!newAgendaTitle.trim()) return;
    const res = await fetch(`/api/projects/${projectId}/coordination/${meetingId}/agenda`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newAgendaTitle.trim(), sort_order: agendaItems.length }),
    });
    if (res.ok) {
      const item = await res.json();
      setAgendaItems((prev) => [...prev, item]);
      setNewAgendaTitle("");
    }
  };

  const updateAgendaStatus = async (itemId: string, status: string) => {
    const res = await fetch(`/api/projects/${projectId}/coordination/${meetingId}/agenda`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agenda_item_id: itemId, status }),
    });
    if (res.ok) {
      const updated = await res.json();
      setAgendaItems((prev) => prev.map((a) => (a.id === itemId ? updated : a)));
    }
  };

  const autoPopulateAgenda = async () => {
    const res = await fetch(`/api/projects/${projectId}/coordination/${meetingId}/agenda`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ auto_populate: true }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.agenda_items) setAgendaItems((prev) => [...prev, ...data.agenda_items]);
    }
  };

  // Action item operations
  const addActionItem = async () => {
    if (!newActionTitle.trim()) return;
    const res = await fetch(`/api/projects/${projectId}/coordination/${meetingId}/actions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: newActionTitle.trim(),
        assigned_to: newActionAssignee.trim() || undefined,
        category: newActionCategory,
        priority: newActionPriority,
      }),
    });
    if (res.ok) {
      const item = await res.json();
      setActionItems((prev) => [...prev, item]);
      setNewActionTitle("");
      setNewActionAssignee("");
      setNewActionCategory("general");
      setNewActionPriority("medium");
    }
  };

  const updateActionStatus = async (itemId: string, status: string) => {
    const res = await fetch(`/api/projects/${projectId}/coordination/${meetingId}/actions`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action_item_id: itemId, status }),
    });
    if (res.ok) {
      const updated = await res.json();
      setActionItems((prev) => prev.map((a) => (a.id === itemId ? updated : a)));
    }
  };

  // Attendee operations
  const addAttendee = async () => {
    if (!newAttendeeName.trim()) return;
    const res = await fetch(`/api/projects/${projectId}/coordination/${meetingId}/attendees`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newAttendeeName.trim(), company: newAttendeeCompany.trim() || undefined }),
    });
    if (res.ok) {
      const data = await res.json();
      setAttendees((prev) => [...prev, ...(data.attendees || [])]);
      setNewAttendeeName("");
      setNewAttendeeCompany("");
    }
  };

  const togglePresent = async (attendeeId: string, present: boolean) => {
    const res = await fetch(`/api/projects/${projectId}/coordination/${meetingId}/attendees`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attendee_id: attendeeId, present: !present }),
    });
    if (res.ok) {
      const updated = await res.json();
      setAttendees((prev) => prev.map((a) => (a.id === attendeeId ? updated : a)));
    }
  };

  const createActionFromConflict = async (conflict: ScheduleConflict) => {
    const res = await fetch(`/api/projects/${projectId}/coordination/${meetingId}/actions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: `Resolve conflict: ${conflict.activity_a.trade} vs ${conflict.activity_b.trade} in ${conflict.activity_a.area}`,
        category: "schedule",
        priority: "high",
        description: `${conflict.activity_a.name} and ${conflict.activity_b.name} overlap ${conflict.overlap_start} to ${conflict.overlap_end}`,
      }),
    });
    if (res.ok) {
      const item = await res.json();
      setActionItems((prev) => [...prev, item]);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <RefreshCw size={20} className="text-[#F97316] animate-spin" />
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="text-center py-16">
        <p className="text-[color:var(--text-secondary)]">Meeting not found</p>
        <button onClick={onBack} className="mt-4 text-[#F97316] text-sm min-h-[44px]">Go back</button>
      </div>
    );
  }

  const isEditable = meeting.status !== "completed" && meeting.status !== "cancelled";

  return (
    <div>
      {/* Back + header */}
      <button onClick={onBack} className="flex items-center gap-1.5 text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] text-sm mb-4 transition-colors min-h-[44px]">
        <ArrowLeft size={16} />
        Back to Meetings
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-xl font-bold text-[color:var(--text-primary)]">{meeting.title}</h2>
            <span
              className="px-2.5 py-0.5 rounded-full text-xs font-medium"
              style={{
                backgroundColor: `${STATUS_COLORS[meeting.status]}20`,
                color: STATUS_COLORS[meeting.status],
              }}
            >
              {meeting.status.replace("_", " ")}
            </span>
          </div>
          <p className="text-sm text-[color:var(--text-muted)]">
            {new Date(meeting.meeting_date + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            {meeting.start_time ? ` · ${meeting.start_time}${meeting.end_time ? `–${meeting.end_time}` : ""}` : ""}
            {meeting.facilitator ? ` · ${meeting.facilitator}` : ""}
            {meeting.location ? ` · ${meeting.location}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isEditable && (
            <button
              onClick={completeMeeting}
              disabled={completing}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#22C55E]/10 text-[#22C55E] hover:bg-[#22C55E]/20 rounded-lg text-sm font-medium transition-colors min-h-[44px]"
            >
              {completing ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
              Complete
            </button>
          )}
          <button
            onClick={exportPdf}
            className="flex items-center gap-1.5 px-4 py-2 bg-[var(--bg-tertiary)] text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] rounded-lg text-sm font-medium transition-colors min-h-[44px]"
          >
            <FileText size={14} />
            Export
          </button>
          {isEditable && (
            <button
              onClick={deleteMeeting}
              className="flex items-center gap-1.5 px-3 py-2 bg-[var(--bg-tertiary)] text-red-400 hover:text-red-300 rounded-lg text-sm transition-colors min-h-[44px]"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Conflicts Panel */}
      {conflicts.length > 0 && (
        <div className="mb-6">
          <ConflictDetector
            conflicts={conflicts}
            onCreateAction={createActionFromConflict}
          />
        </div>
      )}

      {/* Agenda Section */}
      <div className="mb-6 p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[color:var(--text-primary)] font-semibold">Agenda</h3>
          {isEditable && (
            <button
              onClick={autoPopulateAgenda}
              className="flex items-center gap-1.5 text-xs text-[#F97316] hover:text-[color:var(--text-primary)] transition-colors min-h-[44px] px-2"
            >
              <Wand2 size={12} />
              Auto-populate
            </button>
          )}
        </div>

        {agendaItems.length === 0 && (
          <p className="text-[color:var(--text-muted)] text-sm py-4 text-center">No agenda items yet</p>
        )}

        <div className="space-y-2">
          {agendaItems.map((item, i) => (
            <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-primary)]">
              <span className="text-gray-600 text-xs font-mono mt-0.5 w-5 shrink-0">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[color:var(--text-primary)] text-sm">{item.title}</span>
                  {item.has_conflict && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-500/10 text-red-400">⚠ conflict</span>
                  )}
                  {item.trade && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[var(--bg-tertiary)] text-[color:var(--text-secondary)]">{item.trade}</span>
                  )}
                </div>
                {item.area && <p className="text-xs text-[color:var(--text-muted)] mt-0.5">{item.area}</p>}
              </div>
              {isEditable && (
                <select
                  value={item.status}
                  onChange={(e) => updateAgendaStatus(item.id, e.target.value)}
                  className="text-xs rounded px-2 py-1 bg-[var(--bg-tertiary)] border-none min-h-[36px]"
                  style={{ color: AGENDA_STATUS_COLORS[item.status] }}
                >
                  <option value="pending">Pending</option>
                  <option value="discussed">Discussed</option>
                  <option value="deferred">Deferred</option>
                  <option value="resolved">Resolved</option>
                </select>
              )}
            </div>
          ))}
        </div>

        {isEditable && (
          <div className="flex gap-2 mt-3">
            <input
              type="text"
              value={newAgendaTitle}
              onChange={(e) => setNewAgendaTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addAgendaItem()}
              placeholder="Add agenda item..."
              className="flex-1 px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-primary)] text-[color:var(--text-primary)] text-sm focus:border-[#F97316] focus:outline-none min-h-[44px]"
            />
            <button
              onClick={addAgendaItem}
              disabled={!newAgendaTitle.trim()}
              className="px-3 py-2 bg-[#F97316] hover:bg-[#ea6c10] disabled:opacity-30 text-[color:var(--text-primary)] rounded-lg transition-colors min-h-[44px]"
            >
              <Plus size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Action Items Section */}
      <div className="mb-6 p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)]">
        <h3 className="text-[color:var(--text-primary)] font-semibold mb-3">Action Items</h3>

        {actionItems.length === 0 && (
          <p className="text-[color:var(--text-muted)] text-sm py-4 text-center">No action items yet</p>
        )}

        <div className="space-y-2">
          {actionItems.map((item) => (
            <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-primary)]">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[color:var(--text-primary)] text-sm">{item.title}</span>
                  <span
                    className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                    style={{ backgroundColor: `${CATEGORY_COLORS[item.category]}20`, color: CATEGORY_COLORS[item.category] }}
                  >
                    {item.category.replace(/_/g, " ")}
                  </span>
                  <span
                    className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                    style={{ backgroundColor: `${PRIORITY_COLORS[item.priority]}20`, color: PRIORITY_COLORS[item.priority] }}
                  >
                    {item.priority}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[color:var(--text-muted)] mt-1">
                  {item.assigned_to && <span>{item.assigned_to}</span>}
                  {item.assigned_company && <span>· {item.assigned_company}</span>}
                  {item.due_date && (
                    <span className={new Date(item.due_date) < new Date() && item.status !== "resolved" ? "text-red-400" : ""}>
                      · Due {new Date(item.due_date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  )}
                </div>
              </div>
              {isEditable && (
                <select
                  value={item.status}
                  onChange={(e) => updateActionStatus(item.id, e.target.value)}
                  className="text-xs rounded px-2 py-1 bg-[var(--bg-tertiary)] border-none min-h-[36px]"
                  style={{
                    color: item.status === "open" ? "#3B82F6" : item.status === "in_progress" ? "#F97316" : item.status === "resolved" ? "#22C55E" : "var(--text-muted)",
                  }}
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              )}
            </div>
          ))}
        </div>

        {isEditable && (
          <div className="mt-3 space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={newActionTitle}
                onChange={(e) => setNewActionTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addActionItem()}
                placeholder="Action item title..."
                className="flex-1 px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-primary)] text-[color:var(--text-primary)] text-sm focus:border-[#F97316] focus:outline-none min-h-[44px]"
              />
              <button
                onClick={addActionItem}
                disabled={!newActionTitle.trim()}
                className="px-3 py-2 bg-[#F97316] hover:bg-[#ea6c10] disabled:opacity-30 text-[color:var(--text-primary)] rounded-lg transition-colors min-h-[44px]"
              >
                <Plus size={16} />
              </button>
            </div>
            {newActionTitle.trim() && (
              <div className="flex gap-2 flex-wrap">
                <input
                  type="text"
                  value={newActionAssignee}
                  onChange={(e) => setNewActionAssignee(e.target.value)}
                  placeholder="Assigned to..."
                  className="px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-primary)] text-[color:var(--text-primary)] text-xs focus:border-[#F97316] focus:outline-none min-h-[36px] w-36"
                />
                <select
                  value={newActionCategory}
                  onChange={(e) => setNewActionCategory(e.target.value)}
                  className="px-2 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-primary)] text-[color:var(--text-primary)] text-xs focus:border-[#F97316] focus:outline-none min-h-[36px]"
                >
                  {Object.keys(CATEGORY_COLORS).map((c) => (
                    <option key={c} value={c}>{c.replace(/_/g, " ")}</option>
                  ))}
                </select>
                <select
                  value={newActionPriority}
                  onChange={(e) => setNewActionPriority(e.target.value)}
                  className="px-2 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-primary)] text-[color:var(--text-primary)] text-xs focus:border-[#F97316] focus:outline-none min-h-[36px]"
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Attendees Section */}
      <div className="mb-6 p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)]">
        <div className="flex items-center gap-2 mb-3">
          <Users size={16} className="text-[color:var(--text-secondary)]" />
          <h3 className="text-[color:var(--text-primary)] font-semibold">
            Attendees
            {attendees.length > 0 && (
              <span className="text-[color:var(--text-muted)] font-normal ml-2 text-sm">
                ({attendees.filter((a) => a.present).length}/{attendees.length} present)
              </span>
            )}
          </h3>
        </div>

        {attendees.length === 0 && (
          <p className="text-[color:var(--text-muted)] text-sm py-4 text-center">No attendees added</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {attendees.map((attendee) => (
            <button
              key={attendee.id}
              onClick={() => isEditable && togglePresent(attendee.id, attendee.present)}
              className={`flex items-center gap-2 p-3 rounded-lg border text-left transition-colors min-h-[44px] ${
                attendee.present
                  ? "bg-[#22C55E]/5 border-[#22C55E]/20"
                  : "bg-[var(--bg-primary)] border-[var(--border-primary)]"
              }`}
            >
              <span className={`text-sm ${attendee.present ? "text-[#22C55E]" : "text-gray-600"}`}>
                {attendee.present ? "✓" : "○"}
              </span>
              <div className="min-w-0">
                <span className="text-sm text-[color:var(--text-primary)] truncate block">{attendee.name}</span>
                {(attendee.company || attendee.trade) && (
                  <span className="text-xs text-[color:var(--text-muted)] truncate block">
                    {[attendee.company, attendee.trade].filter(Boolean).join(" · ")}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>

        {isEditable && (
          <div className="flex gap-2 mt-3">
            <input
              type="text"
              value={newAttendeeName}
              onChange={(e) => setNewAttendeeName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addAttendee()}
              placeholder="Name..."
              className="flex-1 px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-primary)] text-[color:var(--text-primary)] text-sm focus:border-[#F97316] focus:outline-none min-h-[44px]"
            />
            <input
              type="text"
              value={newAttendeeCompany}
              onChange={(e) => setNewAttendeeCompany(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addAttendee()}
              placeholder="Company..."
              className="w-32 px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-primary)] text-[color:var(--text-primary)] text-sm focus:border-[#F97316] focus:outline-none min-h-[44px]"
            />
            <button
              onClick={addAttendee}
              disabled={!newAttendeeName.trim()}
              className="px-3 py-2 bg-[#F97316] hover:bg-[#ea6c10] disabled:opacity-30 text-[color:var(--text-primary)] rounded-lg transition-colors min-h-[44px]"
            >
              <Plus size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Meeting Notes */}
      <div className="mb-6 p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)]">
        <h3 className="text-[color:var(--text-primary)] font-semibold mb-3">Meeting Notes</h3>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={saveNotes}
          disabled={!isEditable}
          rows={6}
          placeholder="Meeting notes..."
          className="w-full px-3 py-3 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-primary)] text-[color:var(--text-primary)] text-sm focus:border-[#F97316] focus:outline-none resize-y disabled:opacity-50"
        />
        {savingNotes && (
          <p className="text-xs text-[color:var(--text-muted)] mt-1 flex items-center gap-1">
            <Loader2 size={10} className="animate-spin" /> Saving...
          </p>
        )}
      </div>
    </div>
  );
}
