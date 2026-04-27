"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, RefreshCw, Receipt, DollarSign, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";
import TMTicketForm from "@/components/tm/TMTicketForm";
import TMTicketDetail from "@/components/tm/TMTicketDetail";

interface Contact {
  id: string;
  name: string;
  company: string | null;
  role: string;
}

interface TMTicket {
  id: string;
  ticket_number: string;
  date: string;
  description: string;
  status: string;
  total_labor_cost: number;
  total_material_cost: number;
  total_equipment_cost: number;
  total_cost: number;
  gc_signature_path: string | null;
  gc_signed_by: string | null;
  gc_signed_at: string | null;
  sub_signature_path: string | null;
  sub_signed_by: string | null;
  sub_signed_at: string | null;
  dispute_reason: string | null;
  notes: string | null;
  sub_contact: Contact | null;
  // detail view adds these
  labor_items?: unknown[];
  material_items?: unknown[];
  equipment_items?: unknown[];
}

interface Props {
  projectId: string;
}

const FILTERS = [
  { value: "all", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "submitted", label: "Submitted" },
  { value: "approved", label: "Approved" },
  { value: "disputed", label: "Disputed" },
  { value: "invoiced", label: "Invoiced" },
];

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-gray-700/60 text-[color:var(--text-secondary)]",
  submitted: "bg-yellow-900/60 text-yellow-300",
  approved: "bg-green-900/60 text-green-300",
  disputed: "bg-red-900/60 text-red-300",
  invoiced: "bg-blue-900/60 text-blue-300",
};

function fmtCurrency(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function fmtDate(d: string): string {
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", {
    month: "short", day: "numeric",
  });
}

function SigBadge({ gc, sub }: { gc: string | null; sub: string | null }) {
  if (gc && sub) return <span className="text-green-400 text-xs" title="Both signed">✓✓</span>;
  if (gc || sub) return <span className="text-yellow-400 text-xs" title="1 of 2 signed">✓</span>;
  return <span className="text-gray-600 text-xs" title="Unsigned">○</span>;
}

export default function TMTab({ projectId }: Props) {
  const [tickets, setTickets] = useState<TMTicket[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [detailTicket, setDetailTicket] = useState<TMTicket | null>(null);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/tm-tickets`);
      if (res.ok) {
        const data = await res.json();
        setTickets(Array.isArray(data) ? data : []);
      }
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const fetchContacts = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/directory`);
      if (res.ok) {
        const data = await res.json();
        setContacts(Array.isArray(data) ? data : []);
      }
    } catch {
      // non-critical
    }
  }, [projectId]);

  useEffect(() => {
    fetchTickets();
    fetchContacts();
  }, [fetchTickets, fetchContacts]);

  const filtered =
    filter === "all" ? tickets : tickets.filter((t) => t.status === filter);

  const totalTickets = tickets.length;
  const totalCost = tickets.reduce((s, t) => s + (t.total_cost ?? 0), 0);
  const pendingApproval = tickets.filter((t) => t.status === "submitted").length;
  const disputed = tickets.filter((t) => t.status === "disputed").length;

  const openDetail = async (t: TMTicket) => {
    // Fetch full ticket with line items
    try {
      const res = await fetch(`/api/projects/${projectId}/tm-tickets/${t.id}`);
      if (res.ok) {
        const full = await res.json();
        setDetailTicket(full);
      }
    } catch {
      setDetailTicket(t);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw size={24} className="text-[#F97316] animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[color:var(--text-primary)]">T&amp;M Tickets</h2>
            <p className="text-xs text-[color:var(--text-muted)] mt-0.5">
              {totalTickets} ticket{totalTickets !== 1 ? "s" : ""} on this project
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchTickets}
              className="p-2.5 rounded-lg bg-[#1F1F25] text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <RefreshCw size={15} />
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-1.5 px-3 py-2.5 bg-[#F97316] hover:bg-[#ea6c10] text-[color:var(--text-primary)] rounded-lg text-xs font-semibold transition-colors min-h-[44px]"
            >
              <Plus size={14} />
              <span className="hidden sm:inline">New T&amp;M Ticket</span>
              <span className="sm:hidden">New</span>
            </button>
          </div>
        </div>

        {/* Summary bar */}
        {totalTickets > 0 && (
          <div className="grid grid-cols-4 gap-2">
            <div className="bg-[#121217] border border-[#1F1F25] rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-[color:var(--text-primary)]">{totalTickets}</p>
              <p className="text-[10px] text-[color:var(--text-muted)] mt-0.5">Tickets</p>
            </div>
            <div className="bg-[#121217] border border-[#1F1F25] rounded-xl p-3 text-center">
              <p className="text-sm font-bold text-[#F97316]">{fmtCurrency(totalCost)}</p>
              <p className="text-[10px] text-[color:var(--text-muted)] mt-0.5">Total</p>
            </div>
            <div className="bg-[#121217] border border-[#1F1F25] rounded-xl p-3 text-center">
              <p className={`text-xl font-bold ${pendingApproval > 0 ? "text-yellow-400" : "text-[color:var(--text-primary)]"}`}>
                {pendingApproval}
              </p>
              <p className="text-[10px] text-[color:var(--text-muted)] mt-0.5">Pending</p>
            </div>
            <div className="bg-[#121217] border border-[#1F1F25] rounded-xl p-3 text-center">
              <p className={`text-xl font-bold ${disputed > 0 ? "text-red-400" : "text-[color:var(--text-primary)]"}`}>
                {disputed}
              </p>
              <p className="text-[10px] text-[color:var(--text-muted)] mt-0.5">Disputed</p>
            </div>
          </div>
        )}

        {/* Filter chips */}
        {totalTickets > 0 && (
          <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1">
            {FILTERS.map((f) => {
              const count = f.value === "all"
                ? tickets.length
                : tickets.filter((t) => t.status === f.value).length;
              return (
                <button
                  key={f.value}
                  onClick={() => setFilter(f.value)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors min-h-[36px] ${
                    filter === f.value
                      ? "bg-[#F97316] text-[color:var(--text-primary)]"
                      : "bg-[#1F1F25] text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]"
                  }`}
                >
                  {f.label}
                  {count > 0 && (
                    <span className={`text-[10px] rounded-full px-1.5 ${filter === f.value ? "bg-white/20" : "bg-[#2a2a35]"}`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Ticket list */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#1F1F25] flex items-center justify-center mb-4">
              <Receipt size={28} className="text-gray-600" />
            </div>
            <h3 className="text-[color:var(--text-primary)] font-semibold mb-1">
              {filter === "all" ? "No T&M Tickets Yet" : `No ${filter} tickets`}
            </h3>
            <p className="text-[color:var(--text-muted)] text-sm max-w-xs">
              {filter === "all"
                ? "Create a ticket to track time & material costs on this project."
                : `No tickets with "${filter}" status.`}
            </p>
            {filter === "all" && (
              <button
                onClick={() => setShowForm(true)}
                className="mt-4 flex items-center gap-1.5 px-4 py-2.5 bg-[#F97316] hover:bg-[#ea6c10] text-[color:var(--text-primary)] rounded-xl text-sm font-semibold transition-colors min-h-[44px]"
              >
                <Plus size={15} />
                New T&amp;M Ticket
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((t) => (
              <button
                key={t.id}
                onClick={() => openDetail(t)}
                className="w-full text-left p-4 bg-[#121217] border border-[#1F1F25] rounded-xl hover:border-[#F97316]/40 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[color:var(--text-primary)] font-semibold text-sm">{t.ticket_number}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[t.status] ?? "bg-gray-700/60 text-[color:var(--text-secondary)]"}`}>
                        {t.status.charAt(0).toUpperCase() + t.status.slice(1)}
                      </span>
                      <SigBadge gc={t.gc_signature_path} sub={t.sub_signature_path} />
                    </div>
                    <p className="text-[color:var(--text-secondary)] text-xs mt-1 truncate">{t.description}</p>
                    {t.sub_contact && (
                      <p className="text-gray-600 text-xs mt-0.5">
                        {t.sub_contact.name}
                        {t.sub_contact.company ? ` · ${t.sub_contact.company}` : ""}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[#F97316] font-bold text-sm">{fmtCurrency(t.total_cost ?? 0)}</p>
                    <p className="text-gray-600 text-[10px] mt-0.5">{fmtDate(t.date)}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* New ticket form */}
      {showForm && (
        <TMTicketForm
          projectId={projectId}
          contacts={contacts}
          onCreated={() => {
            setShowForm(false);
            fetchTickets();
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Ticket detail */}
      {detailTicket && (
        <TMTicketDetail
          ticket={detailTicket as Parameters<typeof TMTicketDetail>[0]["ticket"]}
          projectId={projectId}
          onClose={() => setDetailTicket(null)}
          onUpdated={() => {
            fetchTickets();
          }}
        />
      )}
    </>
  );
}
