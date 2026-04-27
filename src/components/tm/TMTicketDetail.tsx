"use client";

import { useState } from "react";
import {
  X, HardHat, Package, Truck, CheckCircle2, Clock, AlertTriangle,
  PenLine, RefreshCw, Trash2,
} from "lucide-react";
import SignaturePad from "@/components/tm/SignaturePad";
import { useTranslation } from "@/lib/i18n";

const { t } = useTranslation();

interface Contact {
  id: string;
  name: string;
  company: string | null;
  role: string;
}

interface LaborItem {
  id: string;
  trade: string;
  workers: number;
  hours: number;
  rate: number | null;
  total: number | null;
  description: string | null;
}

interface MaterialItem {
  id: string;
  item: string;
  quantity: number;
  unit: string;
  unit_cost: number;
  total: number | null;
  receipt_photo_path: string | null;
}

interface EquipmentItem {
  id: string;
  equipment_type: string;
  hours: number;
  rate: number;
  total: number | null;
  description: string | null;
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
  labor_items: LaborItem[];
  material_items: MaterialItem[];
  equipment_items: EquipmentItem[];
}

interface Props {
  ticket: TMTicket;
  onClose: () => void;
  onUpdated: () => void;
  projectId: string;
}

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-gray-700/60 text-[color:var(--text-secondary)]",
  submitted: "bg-yellow-900/60 text-yellow-300",
  approved: "bg-green-900/60 text-green-300",
  disputed: "bg-red-900/60 text-red-300",
  invoiced: "bg-blue-900/60 text-blue-300",
};

const STATUS_TRANSITIONS: Record<string, string[]> = {
  draft: ["submitted"],
  submitted: ["approved", "disputed"],
  approved: ["invoiced"],
  disputed: ["submitted"],
  invoiced: [],
};

function fmtCurrency(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });
}

function fmtDate(d: string): string {
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

function fmtTs(ts: string): string {
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  });
}

export default function TMTicketDetail({ ticket: initialTicket, onClose, onUpdated, projectId }: Props) {
  const [ticket, setTicket] = useState<TMTicket>(initialTicket);
  const [sigRole, setSigRole] = useState<"gc" | "sub" | null>(null);
  const [signedByInput, setSignedByInput] = useState("");
  const [showSignedByPrompt, setShowSignedByPrompt] = useState(false);
  const [pendingRole, setPendingRole] = useState<"gc" | "sub" | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [disputeReason, setDisputeReason] = useState(ticket.dispute_reason ?? "");
  const [showDisputeInput, setShowDisputeInput] = useState(false);

  const nextStatuses = STATUS_TRANSITIONS[ticket.status] ?? [];

  const changeStatus = async (newStatus: string) => {
    if (newStatus === "disputed") {
      setShowDisputeInput(true);
      return;
    }
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/tm-tickets/${ticket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const updated = await res.json();
        setTicket((t) => ({ ...t, status: updated.status }));
        onUpdated();
      }
    } finally {
      setUpdatingStatus(false);
    }
  };

  const confirmDispute = async () => {
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/tm-tickets/${ticket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "disputed", dispute_reason: disputeReason }),
      });
      if (res.ok) {
        const updated = await res.json();
        setTicket((t) => ({ ...t, status: updated.status, dispute_reason: updated.dispute_reason }));
        setShowDisputeInput(false);
        onUpdated();
      }
    } finally {
      setUpdatingStatus(false);
    }
  };

  const startSign = (role: "gc" | "sub") => {
    setPendingRole(role);
    setSignedByInput("");
    setShowSignedByPrompt(true);
  };

  const proceedToSign = () => {
    if (!signedByInput.trim()) return;
    setShowSignedByPrompt(false);
    setSigRole(pendingRole);
  };

  const handleSignature = async (base64Png: string) => {
    if (!sigRole) return;
    setSigRole(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/tm-tickets/${ticket.id}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: sigRole,
          signed_by: signedByInput.trim(),
          signature: base64Png,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setTicket((t) => ({
          ...t,
          gc_signature_path: updated.gc_signature_path,
          gc_signed_by: updated.gc_signed_by,
          gc_signed_at: updated.gc_signed_at,
          sub_signature_path: updated.sub_signature_path,
          sub_signed_by: updated.sub_signed_by,
          sub_signed_at: updated.sub_signed_at,
        }));
        onUpdated();
      }
    } catch {
      // silently fail - user can retry
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete ticket ${ticket.ticket_number}? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await fetch(`/api/projects/${projectId}/tm-tickets/${ticket.id}`, { method: "DELETE" });
      onUpdated();
      onClose();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/80 overflow-y-auto">
        <div className="min-h-full flex items-start justify-center py-4 px-4">
          <div className="w-full max-w-2xl bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-primary)] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-[var(--border-primary)]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[color:var(--text-primary)] font-bold">{ticket.ticket_number}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[ticket.status] ?? "bg-gray-700/60 text-[color:var(--text-secondary)]"}`}>
                    {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                  </span>
                </div>
                <p className="text-xs text-[color:var(--text-muted)] mt-0.5">{fmtDate(ticket.date)}</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 space-y-5">
              {/* Description */}
              <div>
                <p className="text-xs text-[color:var(--text-muted)] mb-1">{t('blocker.description')}</p>
                <p className="text-[color:var(--text-primary)] text-sm">{ticket.description}</p>
                {ticket.sub_contact && (
                  <p className="text-xs text-[color:var(--text-secondary)] mt-1">{t('ui.sub.3360cb')} {ticket.sub_contact.name}
                    {ticket.sub_contact.company ? ` · ${ticket.sub_contact.company}` : ""}
                  </p>
                )}
              </div>

              {/* Cost summary */}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  { label: t('ui.labor'), val: ticket.total_labor_cost },
                  { label: t('ui.materials.2402ea'), val: ticket.total_material_cost },
                  { label: t('ui.equipment'), val: ticket.total_equipment_cost },
                  { label: t('ui.total'), val: ticket.total_cost, accent: true },
                ].map(({ label, val, accent }) => (
                  <div key={label} className={`p-3 rounded-xl border text-center ${accent ? "bg-[#1a1208] border-[#F97316]/30" : "bg-[var(--bg-primary)] border-[var(--border-primary)]"}`}>
                    <p className={`text-base font-bold ${accent ? "text-[#F97316]" : "text-[color:var(--text-primary)]"}`}>
                      {fmtCurrency(val ?? 0)}
                    </p>
                    <p className="text-[10px] text-[color:var(--text-muted)] mt-0.5">{label}</p>
                  </div>
                ))}
              </div>

              {/* Labor items */}
              {ticket.labor_items.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <HardHat size={14} className="text-[#F97316]" />
                    <h4 className="text-sm font-semibold text-[color:var(--text-primary)]">{t('ui.labor')}</h4>
                  </div>
                  <div className="space-y-1">
                    {ticket.labor_items.map((l) => (
                      <div key={l.id} className="flex items-center justify-between py-2 px-3 bg-[var(--bg-primary)] rounded-lg border border-[var(--border-primary)]">
                        <div>
                          <span className="text-sm text-[color:var(--text-primary)]">{l.trade}</span>
                          <span className="text-xs text-[color:var(--text-muted)] ml-2">
                            {l.workers}× · {l.hours}{t('ui.h')}
                            {l.rate != null ? ` @ $${l.rate}/hr` : ""}
                          </span>
                        </div>
                        <span className="text-sm text-[#F97316] font-medium">{fmtCurrency(l.total ?? 0)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Material items */}
              {ticket.material_items.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Package size={14} className="text-[#F97316]" />
                    <h4 className="text-sm font-semibold text-[color:var(--text-primary)]">{t('ui.materials.2402ea')}</h4>
                  </div>
                  <div className="space-y-1">
                    {ticket.material_items.map((m) => (
                      <div key={m.id} className="py-2 px-3 bg-[var(--bg-primary)] rounded-lg border border-[var(--border-primary)]">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-sm text-[color:var(--text-primary)]">{m.item}</span>
                            <span className="text-xs text-[color:var(--text-muted)] ml-2">
                              {m.quantity} {m.unit} @ ${m.unit_cost}/{m.unit}
                            </span>
                          </div>
                          <span className="text-sm text-[#F97316] font-medium">{fmtCurrency(m.total ?? 0)}</span>
                        </div>
                        {m.receipt_photo_path && (
                          <a
                            href={m.receipt_photo_path}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 block"
                          >
                            <img
                              src={m.receipt_photo_path}
                              alt={t('ui.receipt')}
                              className="h-16 w-auto rounded-lg border border-[#1F1F25] object-cover"
                            />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Equipment items */}
              {ticket.equipment_items.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Truck size={14} className="text-[#F97316]" />
                    <h4 className="text-sm font-semibold text-[color:var(--text-primary)]">{t('ui.equipment')}</h4>
                  </div>
                  <div className="space-y-1">
                    {ticket.equipment_items.map((e) => (
                      <div key={e.id} className="flex items-center justify-between py-2 px-3 bg-[var(--bg-primary)] rounded-lg border border-[var(--border-primary)]">
                        <div>
                          <span className="text-sm text-[color:var(--text-primary)]">{e.equipment_type}</span>
                          <span className="text-xs text-[color:var(--text-muted)] ml-2">
                            {e.hours}{t('ui.h.2ee8c4')}{e.rate}/hr
                          </span>
                        </div>
                        <span className="text-sm text-[#F97316] font-medium">{fmtCurrency(e.total ?? 0)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {ticket.notes && (
                <div className="p-3 bg-[#0B0B0D] border border-[#1F1F25] rounded-xl">
                  <p className="text-xs text-[color:var(--text-muted)] mb-1">{t('ui.notes')}</p>
                  <p className="text-sm text-[color:var(--text-secondary)]">{ticket.notes}</p>
                </div>
              )}

              {/* Dispute reason */}
              {ticket.dispute_reason && (
                <div className="p-3 bg-red-900/20 border border-red-800/40 rounded-xl">
                  <div className="flex items-center gap-1.5 mb-1">
                    <AlertTriangle size={13} className="text-red-400" />
                    <p className="text-xs font-medium text-red-400">{t('ui.dispute.reason')}</p>
                  </div>
                  <p className="text-sm text-red-300">{ticket.dispute_reason}</p>
                </div>
              )}

              {/* Signatures */}
              <div>
                <h4 className="text-sm font-semibold text-[color:var(--text-primary)] mb-3">{t('ui.signatures')}</h4>
                <div className="grid grid-cols-2 gap-3">
                  {/* GC signature */}
                  <div className="p-3 bg-[#0B0B0D] border border-[#1F1F25] rounded-xl">
                    <p className="text-xs text-[color:var(--text-muted)] mb-2">{t('ui.gc.owner')}</p>
                    {ticket.gc_signature_path ? (
                      <div>
                        <img
                          src={ticket.gc_signature_path}
                          alt={t('ui.gc.signature')}
                          className="w-full h-16 object-contain rounded-lg bg-[#1A1A22] mb-1"
                        />
                        <p className="text-[10px] text-[color:var(--text-muted)]">
                          {ticket.gc_signed_by}
                          {ticket.gc_signed_at ? ` · ${fmtTs(ticket.gc_signed_at)}` : ""}
                        </p>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center gap-1.5 mb-2">
                          <Clock size={12} className="text-gray-600" />
                          <span className="text-xs text-gray-600">{t('ui.awaiting.signature')}</span>
                        </div>
                        <button
                          onClick={() => startSign("gc")}
                          className="flex items-center gap-1.5 px-3 py-2 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] text-[color:var(--text-secondary)] rounded-lg text-xs font-medium transition-colors w-full justify-center min-h-[44px]"
                        >
                          <PenLine size={12} />{t('ui.sign.as.gc')}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Sub signature */}
                  <div className="p-3 bg-[#0B0B0D] border border-[#1F1F25] rounded-xl">
                    <p className="text-xs text-[color:var(--text-muted)] mb-2">{t('ui.subcontractor')}</p>
                    {ticket.sub_signature_path ? (
                      <div>
                        <img
                          src={ticket.sub_signature_path}
                          alt={t('ui.sub.signature')}
                          className="w-full h-16 object-contain rounded-lg bg-[#1A1A22] mb-1"
                        />
                        <p className="text-[10px] text-[color:var(--text-muted)]">
                          {ticket.sub_signed_by}
                          {ticket.sub_signed_at ? ` · ${fmtTs(ticket.sub_signed_at)}` : ""}
                        </p>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center gap-1.5 mb-2">
                          <Clock size={12} className="text-gray-600" />
                          <span className="text-xs text-gray-600">{t('ui.awaiting.signature')}</span>
                        </div>
                        <button
                          onClick={() => startSign("sub")}
                          className="flex items-center gap-1.5 px-3 py-2 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] text-[color:var(--text-secondary)] rounded-lg text-xs font-medium transition-colors w-full justify-center min-h-[44px]"
                        >
                          <PenLine size={12} />{t('ui.sign.as.sub')}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Signature status summary */}
                <div className="mt-2 flex items-center gap-1.5">
                  {ticket.gc_signature_path && ticket.sub_signature_path ? (
                    <>
                      <CheckCircle2 size={13} className="text-green-400" />
                      <span className="text-xs text-green-400">{t('ui.both.parties.signed')}</span>
                    </>
                  ) : ticket.gc_signature_path || ticket.sub_signature_path ? (
                    <>
                      <CheckCircle2 size={13} className="text-yellow-400" />
                      <span className="text-xs text-yellow-400">{t('ui.partial.1.signature.captured')}</span>
                    </>
                  ) : (
                    <>
                      <Clock size={13} className="text-gray-600" />
                      <span className="text-xs text-gray-600">{t('ui.no.signatures.yet')}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Status transitions */}
              {nextStatuses.length > 0 && (
                <div>
                  <h4 className="text-xs text-[color:var(--text-muted)] mb-2">{t('ui.change.status')}</h4>
                  <div className="flex gap-2 flex-wrap">
                    {nextStatuses.map((s) => (
                      <button
                        key={s}
                        onClick={() => changeStatus(s)}
                        disabled={updatingStatus}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors min-h-[44px] disabled:opacity-50 ${
                          s === "approved"
                            ? "bg-green-900/60 hover:bg-green-800/60 text-green-300"
                            : s === "disputed"
                            ? "bg-red-900/60 hover:bg-red-800/60 text-red-300"
                            : s === "invoiced"
                            ? "bg-blue-900/60 hover:bg-blue-800/60 text-blue-300"
                            : "bg-yellow-900/60 hover:bg-yellow-800/60 text-yellow-300"
                        }`}
                      >
                        {updatingStatus ? <RefreshCw size={13} className="animate-spin" /> : s.charAt(0).toUpperCase() + s.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Dispute input */}
              {showDisputeInput && (
                <div className="p-3 bg-red-900/20 border border-red-800/40 rounded-xl space-y-2">
                  <p className="text-xs text-red-400 font-medium">{t('ui.dispute.reason')}</p>
                  <textarea
                    value={disputeReason}
                    onChange={(e) => setDisputeReason(e.target.value)}
                    rows={2}
                    placeholder={t('ui.describe.the.dispute')}
                    className="w-full px-3 py-2 bg-[#0B0B0D] border border-red-800/40 rounded-lg text-[color:var(--text-primary)] text-sm placeholder-gray-600 focus:outline-none resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowDisputeInput(false)}
                      className="flex-1 py-2 px-3 bg-[#1F1F25] text-[color:var(--text-secondary)] rounded-lg text-xs min-h-[44px]"
                    >{t('action.cancel')}</button>
                    <button
                      onClick={confirmDispute}
                      disabled={updatingStatus}
                      className="flex-1 py-2 px-3 bg-red-700 hover:bg-red-600 text-[color:var(--text-primary)] rounded-lg text-xs font-semibold min-h-[44px]"
                    >{t('ui.mark.disputed')}</button>
                  </div>
                </div>
              )}

              {/* Delete */}
              <div className="pt-2 border-t border-[var(--border-primary)]">
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-red-400 transition-colors py-2 min-h-[44px]"
                >
                  <Trash2 size={13} />
                  {deleting ? t('ui.deleting') : t('ui.delete.ticket')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Signed-by name prompt */}
      {showSignedByPrompt && (
        <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-primary)] p-5 space-y-4">
            <h3 className="text-[color:var(--text-primary)] font-semibold text-sm">
              {pendingRole === "gc" ? t('ui.sign.as.gc.owner') : t('ui.sign.as.subcontractor')}
            </h3>
            <div>
              <label className="block text-xs text-[color:var(--text-secondary)] mb-1.5">{t('ui.your.name.f48db7')}</label>
              <input
                type="text"
                value={signedByInput}
                onChange={(e) => setSignedByInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && proceedToSign()}
                placeholder={t('ui.full.name.b3d518')}
                autoFocus
                className="w-full px-3 py-3 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl text-[color:var(--text-primary)] text-sm placeholder-gray-600 focus:outline-none focus:border-[#F97316] min-h-[44px]"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowSignedByPrompt(false)}
                className="flex-1 py-3 bg-[#1F1F25] text-[color:var(--text-secondary)] rounded-xl text-sm min-h-[44px]"
              >{t('action.cancel')}</button>
              <button
                onClick={proceedToSign}
                disabled={!signedByInput.trim()}
                className="flex-1 py-3 bg-[#F97316] hover:bg-[#ea6c10] disabled:opacity-40 text-[color:var(--text-primary)] rounded-xl text-sm font-bold min-h-[44px]"
              >{t('ui.continue')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Signature pad */}
      {sigRole && (
        <SignaturePad
          label={sigRole === "gc" ? t('ui.gc.owner.signature') : t('ui.subcontractor.signature')}
          onDone={handleSignature}
          onCancel={() => setSigRole(null)}
        />
      )}
    </>
  );
}
