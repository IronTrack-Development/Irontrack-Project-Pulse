"use client";

import { useState } from "react";
import { ExternalLink, Phone, X, ChevronDown, ChevronUp } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

const { t } = useTranslation();

interface Inspection {
  id: string;
  inspection_type: string;
  permit_number: string | null;
  requested_date: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  time_window: string;
  notes: string | null;
  status: string;
  portal_url_used: string | null;
  created_at: string;
}

interface Jurisdiction {
  phone: string | null;
  portal_url: string | null;
  name: string;
}

interface Props {
  inspections: Inspection[];
  jurisdiction: Jurisdiction;
  projectId: string;
  onStatusChange: () => void;
}

function statusBadge(status: string) {
  switch (status) {
    case "scheduled":
      return <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-500/20 text-[color:var(--text-secondary)]">{t('ui.scheduled').toUpperCase()}</span>;
    case "redirected":
      return <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#F97316]/20 text-[#F97316]">{t('ui.redirected').toUpperCase()}</span>;
    case "called":
      return <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-500/20 text-blue-400">{t('ui.called').toUpperCase()}</span>;
    case "completed":
      return <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-500/20 text-green-400">{t('ui.completed').toUpperCase()}</span>;
    case "failed":
      return <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-500/20 text-red-400">{t('ui.failed').toUpperCase()}</span>;
    default:
      return <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-500/20 text-[color:var(--text-secondary)]">{status.toUpperCase()}</span>;
  }
}

export default function InspectionHistory({ inspections, jurisdiction, projectId, onStatusChange }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  if (inspections.length === 0) {
    return (
      <div className="text-center py-12 text-[color:var(--text-muted)]">
        <p className="text-sm">{t('ui.no.inspection.requests.yet')}</p>
      </div>
    );
  }

  const updateStatus = async (inspectionId: string, newStatus: string) => {
    setUpdatingId(inspectionId);
    try {
      await fetch(`/api/projects/${projectId}/inspections`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inspection_id: inspectionId, status: newStatus }),
      });
      onStatusChange();
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div>
      <h3 className="text-sm font-semibold text-[color:var(--text-secondary)] mb-3">{t('ui.inspection.history')}</h3>
      <div className="space-y-1 rounded-xl border border-[#1F1F25] bg-[#121217] overflow-hidden">
        {/* Header row — desktop only */}
        <div className="hidden md:grid grid-cols-[1fr_100px_120px_100px_80px] gap-2 px-4 py-2 bg-[#0B0B0D] text-[10px] font-medium text-[color:var(--text-muted)] uppercase tracking-wider">
          <span>{t('ui.type')}</span>
          <span>{t('ui.date')}</span>
          <span>{t('ui.permit')}</span>
          <span>{t('ui.status')}</span>
          <span>{t('ui.action')}</span>
        </div>

        {inspections.map((insp) => (
          <div key={insp.id}>
            {/* Row */}
            <button
              onClick={() => setExpandedId(expandedId === insp.id ? null : insp.id)}
              className="w-full grid grid-cols-[1fr_auto] md:grid-cols-[1fr_100px_120px_100px_80px] gap-2 px-4 py-3 hover:bg-[var(--bg-tertiary)] transition-colors text-left min-h-[44px] items-center"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm text-[color:var(--text-primary)]">{insp.inspection_type}</span>
                <span className="md:hidden">{statusBadge(insp.status)}</span>
              </div>
              <span className="hidden md:block text-xs text-[color:var(--text-secondary)]">{insp.requested_date || "—"}</span>
              <span className="hidden md:block text-xs text-[color:var(--text-secondary)] truncate">{insp.permit_number || "—"}</span>
              <span className="hidden md:block">{statusBadge(insp.status)}</span>
              <div className="flex items-center gap-1">
                {jurisdiction.portal_url ? (
                  <a
                    href={jurisdiction.portal_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="p-1.5 text-[color:var(--text-muted)] hover:text-[#F97316] transition-colors"
                    title={t('ui.open.portal')}
                  >
                    <ExternalLink size={14} />
                  </a>
                ) : jurisdiction.phone ? (
                  <a
                    href={`tel:${jurisdiction.phone}`}
                    onClick={(e) => e.stopPropagation()}
                    className="p-1.5 text-[color:var(--text-muted)] hover:text-blue-400 transition-colors"
                    title={t('ui.call')}
                  >
                    <Phone size={14} />
                  </a>
                ) : null}
                {expandedId === insp.id ? (
                  <ChevronUp size={14} className="text-[color:var(--text-muted)]" />
                ) : (
                  <ChevronDown size={14} className="text-[color:var(--text-muted)]" />
                )}
              </div>
            </button>

            {/* Expanded detail */}
            {expandedId === insp.id && (
              <div className="px-4 pb-4 bg-[var(--bg-primary)] border-t border-[var(--border-primary)]">
                <div className="grid grid-cols-2 gap-3 py-3 text-xs">
                  <div>
                    <span className="text-[color:var(--text-muted)]">{t('ui.date.81b7d2')}</span>
                    <span className="text-[color:var(--text-secondary)] ml-1">{insp.requested_date || t('ui.not.set')}</span>
                  </div>
                  <div>
                    <span className="text-[color:var(--text-muted)]">{t('ui.permit.9119db')}</span>
                    <span className="text-[color:var(--text-secondary)] ml-1">{insp.permit_number || "—"}</span>
                  </div>
                  <div>
                    <span className="text-[color:var(--text-muted)]">{t('ui.time')}</span>
                    <span className="text-[color:var(--text-secondary)] ml-1">{insp.time_window}</span>
                  </div>
                  <div>
                    <span className="text-[color:var(--text-muted)]">{t('ui.contact')}</span>
                    <span className="text-[color:var(--text-secondary)] ml-1">{insp.contact_name || "—"}</span>
                  </div>
                  {insp.contact_phone && (
                    <div>
                      <span className="text-[color:var(--text-muted)]">{t('ui.phone.daeea4')}</span>
                      <span className="text-[color:var(--text-secondary)] ml-1">{insp.contact_phone}</span>
                    </div>
                  )}
                  {insp.notes && (
                    <div className="col-span-2">
                      <span className="text-[color:var(--text-muted)]">{t('ui.notes.9c3bef')}</span>
                      <p className="text-[color:var(--text-secondary)] mt-1">{insp.notes}</p>
                    </div>
                  )}
                  <div className="col-span-2">
                    <span className="text-[color:var(--text-muted)]">{t('ui.created')}</span>
                    <span className="text-[color:var(--text-secondary)] ml-1">
                      {new Date(insp.created_at).toLocaleString("en-US", { timeZone: "America/Phoenix" })}
                    </span>
                  </div>
                </div>

                {/* Status update buttons */}
                <div className="flex gap-2 flex-wrap pt-2 border-t border-[#1F1F25]">
                  <span className="text-[10px] text-[color:var(--text-muted)] uppercase tracking-wider self-center mr-1">{t('ui.update')}
                  </span>
                  {["completed", "failed"].filter(s => s !== insp.status).map((s) => (
                    <button
                      key={s}
                      onClick={() => updateStatus(insp.id, s)}
                      disabled={updatingId === insp.id}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors min-h-[36px] ${
                        s === "completed"
                          ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                          : "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                      } disabled:opacity-50`}
                    >
                      {s === "completed" ? t('ui.mark.completed') : t('ui.mark.failed')}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
