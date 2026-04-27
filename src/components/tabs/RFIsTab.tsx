"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus, RefreshCw, DollarSign, Clock, FileQuestion,
  User, Calendar, MessageSquare, Camera,
} from "lucide-react";
import RFICreateFlow from "@/components/rfis/RFICreateFlow";
import RFIDetail from "@/components/rfis/RFIDetail";

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
  response_count?: number;
  photo_count?: number;
  assigned_contact?: { id: string; name: string; company: string; role: string } | null;
  rfi_responses?: Array<{ id: string; response_text: string; responded_by_name?: string; created_at: string }>;
  rfi_photos?: Array<{ id: string; storage_path: string; caption?: string }>;
}

interface Contact {
  id: string;
  name: string;
  company: string;
  role: string;
}

interface RFIsTabProps {
  projectId: string;
}

const STATUS_FILTERS = [
  { value: "", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "submitted", label: "Submitted" },
  { value: "under_review", label: "Under Review" },
  { value: "answered", label: "Answered" },
  { value: "closed", label: "Closed" },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  draft:        { label: "Draft",        color: "#6B7280", bg: "bg-gray-700/30" },
  submitted:    { label: "Submitted",    color: "#EAB308", bg: "bg-yellow-500/15" },
  under_review: { label: "Under Review", color: "#A855F7", bg: "bg-purple-500/15" },
  answered:     { label: "Answered",     color: "#22C55E", bg: "bg-green-500/15" },
  closed:       { label: "Closed",       color: "#4B5563", bg: "bg-[color:var(--bg-tertiary)]/40" },
};

const PRIORITY_CONFIG: Record<string, { color: string }> = {
  critical: { color: "#EF4444" },
  high:     { color: "#F97316" },
  normal:   { color: "#3B82F6" },
  low:      { color: "#6B7280" },
};

export default function RFIsTab({ projectId }: RFIsTabProps) {
  const [rfis, setRfis] = useState<RFI[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [selectedRFI, setSelectedRFI] = useState<RFI | null>(null);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";

  const fetchRFIs = useCallback(async () => {
    setLoading(true);
    try {
      const url = `/api/projects/${projectId}/rfis${statusFilter ? `?status=${statusFilter}` : ""}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setRfis(data.rfis || []);
      }
    } finally {
      setLoading(false);
    }
  }, [projectId, statusFilter]);

  const fetchContacts = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/directory`);
      if (res.ok) {
        const data = await res.json();
        const flat: Contact[] = (data || [])
          .map((pc: { company_contacts: Contact | null }) => pc.company_contacts)
          .filter(Boolean) as Contact[];
        setContacts(flat);
      }
    } catch { /* ignore */ }
  }, [projectId]);

  useEffect(() => {
    fetchRFIs();
  }, [fetchRFIs]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const openRFIDetail = async (rfi: RFI) => {
    // Fetch full detail with responses and photos
    const res = await fetch(`/api/projects/${projectId}/rfis/${rfi.id}`);
    if (res.ok) {
      setSelectedRFI(await res.json());
    } else {
      setSelectedRFI(rfi);
    }
  };

  // Summary stats
  const totalRFIs = rfis.length;
  const openRFIs = rfis.filter((r) => !["answered", "closed"].includes(r.status)).length;
  const answeredRFIs = rfis.filter((r) => r.status === "answered").length;
  const overdueRFIs = rfis.filter(
    (r) =>
      r.due_date &&
      !["answered", "closed"].includes(r.status) &&
      new Date(r.due_date) < new Date()
  ).length;

  const isOverdue = (rfi: RFI) =>
    rfi.due_date &&
    !["answered", "closed"].includes(rfi.status) &&
    new Date(rfi.due_date) < new Date();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw size={24} className="text-[#F97316] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: "Total", value: totalRFIs, color: "#F97316" },
          { label: "Open", value: openRFIs, color: "#EAB308" },
          { label: "Overdue", value: overdueRFIs, color: "#EF4444" },
          { label: "Answered", value: answeredRFIs, color: "#22C55E" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-2xl p-3 text-center">
            <p className="text-xl font-bold" style={{ color }}>{value}</p>
            <p className="text-xs text-[color:var(--text-muted)] mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Toolbar: filter + new button */}
      <div className="flex items-center gap-3">
        <div className="flex-1 flex gap-1.5 overflow-x-auto scrollbar-none">
          {STATUS_FILTERS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setStatusFilter(value)}
              className={`px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all min-h-[36px] ${
                statusFilter === value
                  ? "bg-[#F97316] text-[color:var(--text-primary)]"
                  : "bg-[var(--bg-tertiary)] text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#F97316] text-[color:var(--text-primary)]
            text-xs font-bold hover:bg-[#ea6c10] transition-all min-h-[44px] shrink-0"
        >
          <Plus size={14} />
          New RFI
        </button>
      </div>

      {/* RFI list */}
      {rfis.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FileQuestion size={40} className="text-gray-700 mb-4" />
          <p className="text-sm font-medium text-[color:var(--text-muted)] mb-1">No RFIs yet</p>
          <p className="text-xs text-gray-600 mb-6">
            {statusFilter ? `No ${statusFilter.replace("_", " ")} RFIs` : "Create your first RFI with AI assistance"}
          </p>
          {!statusFilter && (
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[#F97316] text-[color:var(--text-primary)]
                text-sm font-semibold hover:bg-[#ea6c10] transition-all min-h-[44px]"
            >
              <Plus size={16} />
              New RFI
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {rfis.map((rfi) => {
            const statusCfg = STATUS_CONFIG[rfi.status] || STATUS_CONFIG.draft;
            const priorityCfg = PRIORITY_CONFIG[rfi.priority] || PRIORITY_CONFIG.normal;
            const overdue = isOverdue(rfi);

            return (
              <button
                key={rfi.id}
                onClick={() => openRFIDetail(rfi)}
                className="w-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-2xl p-4
                  hover:border-[#F97316]/30 active:scale-[0.99] transition-all text-left"
              >
                {/* Top row: number + badges */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-mono text-[color:var(--text-muted)]">{rfi.rfi_number}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusCfg.bg}`} style={{ color: statusCfg.color }}>
                    {statusCfg.label}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium border" style={{ color: priorityCfg.color, borderColor: `${priorityCfg.color}40` }}>
                    {rfi.priority.charAt(0).toUpperCase() + rfi.priority.slice(1)}
                  </span>
                  {rfi.ai_drafted && <span className="text-xs text-[#F97316]">✨</span>}
                  <div className="ml-auto flex items-center gap-1.5 text-gray-600 text-xs">
                    {(rfi.response_count || 0) > 0 && (
                      <span className="flex items-center gap-0.5">
                        <MessageSquare size={10} />{rfi.response_count}
                      </span>
                    )}
                    {(rfi.photo_count || 0) > 0 && (
                      <span className="flex items-center gap-0.5">
                        <Camera size={10} />{rfi.photo_count}
                      </span>
                    )}
                  </div>
                </div>

                {/* Subject */}
                <p className="text-sm font-semibold text-[color:var(--text-primary)] mb-2 line-clamp-1">{rfi.subject}</p>

                {/* Meta row */}
                <div className="flex flex-wrap items-center gap-3 text-xs text-[color:var(--text-muted)]">
                  {rfi.assigned_contact && (
                    <span className="flex items-center gap-1">
                      <User size={10} />
                      {rfi.assigned_contact.name}
                    </span>
                  )}
                  {rfi.days_open != null && (
                    <span className={`flex items-center gap-1 ${overdue ? "text-red-400 font-medium" : ""}`}>
                      <Clock size={10} />
                      {rfi.days_open}d open
                    </span>
                  )}
                  {rfi.due_date && (
                    <span className={`flex items-center gap-1 ${overdue ? "text-red-400 font-medium" : ""}`}>
                      <Calendar size={10} />
                      Due {new Date(rfi.due_date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  )}
                  {rfi.cost_impact && (
                    <span className="flex items-center gap-0.5 text-yellow-500">
                      <DollarSign size={10} />Cost
                    </span>
                  )}
                  {rfi.schedule_impact && (
                    <span className="flex items-center gap-0.5 text-red-400">
                      <Clock size={10} />Schedule
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Create Flow Modal */}
      {showCreate && (
        <RFICreateFlow
          projectId={projectId}
          contacts={contacts}
          onCreated={() => { setShowCreate(false); fetchRFIs(); }}
          onCancel={() => setShowCreate(false)}
        />
      )}

      {/* Detail Modal */}
      {selectedRFI && (
        <RFIDetail
          rfi={selectedRFI}
          projectId={projectId}
          supabaseUrl={supabaseUrl}
          onClose={() => setSelectedRFI(null)}
          onUpdated={() => { fetchRFIs(); openRFIDetail(selectedRFI); }}
        />
      )}
    </div>
  );
}
