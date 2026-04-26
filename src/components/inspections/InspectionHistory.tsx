"use client";

import { useState } from "react";
import { ExternalLink, Phone, X, ChevronDown, ChevronUp } from "lucide-react";

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
      return <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-500/20 text-gray-400">SCHEDULED</span>;
    case "redirected":
      return <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#F97316]/20 text-[#F97316]">REDIRECTED</span>;
    case "called":
      return <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-500/20 text-blue-400">CALLED</span>;
    case "completed":
      return <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-500/20 text-green-400">COMPLETED</span>;
    case "failed":
      return <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-500/20 text-red-400">FAILED</span>;
    default:
      return <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-500/20 text-gray-400">{status.toUpperCase()}</span>;
  }
}

export default function InspectionHistory({ inspections, jurisdiction, projectId, onStatusChange }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  if (inspections.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-sm">No inspection requests yet.</p>
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
      <h3 className="text-sm font-semibold text-gray-300 mb-3">Inspection History</h3>
      <div className="space-y-1 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] overflow-hidden">
        {/* Header row — desktop only */}
        <div className="hidden md:grid grid-cols-[1fr_100px_120px_100px_80px] gap-2 px-4 py-2 bg-[var(--bg-primary)] text-[10px] font-medium text-gray-500 uppercase tracking-wider">
          <span>Type</span>
          <span>Date</span>
          <span>Permit #</span>
          <span>Status</span>
          <span>Action</span>
        </div>

        {inspections.map((insp) => (
          <div key={insp.id}>
            {/* Row */}
            <button
              onClick={() => setExpandedId(expandedId === insp.id ? null : insp.id)}
              className="w-full grid grid-cols-[1fr_auto] md:grid-cols-[1fr_100px_120px_100px_80px] gap-2 px-4 py-3 hover:bg-[var(--bg-tertiary)] transition-colors text-left min-h-[44px] items-center"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm text-white">{insp.inspection_type}</span>
                <span className="md:hidden">{statusBadge(insp.status)}</span>
              </div>
              <span className="hidden md:block text-xs text-gray-400">{insp.requested_date || "—"}</span>
              <span className="hidden md:block text-xs text-gray-400 truncate">{insp.permit_number || "—"}</span>
              <span className="hidden md:block">{statusBadge(insp.status)}</span>
              <div className="flex items-center gap-1">
                {jurisdiction.portal_url ? (
                  <a
                    href={jurisdiction.portal_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="p-1.5 text-gray-500 hover:text-[#F97316] transition-colors"
                    title="Open Portal"
                  >
                    <ExternalLink size={14} />
                  </a>
                ) : jurisdiction.phone ? (
                  <a
                    href={`tel:${jurisdiction.phone}`}
                    onClick={(e) => e.stopPropagation()}
                    className="p-1.5 text-gray-500 hover:text-blue-400 transition-colors"
                    title="Call"
                  >
                    <Phone size={14} />
                  </a>
                ) : null}
                {expandedId === insp.id ? (
                  <ChevronUp size={14} className="text-gray-500" />
                ) : (
                  <ChevronDown size={14} className="text-gray-500" />
                )}
              </div>
            </button>

            {/* Expanded detail */}
            {expandedId === insp.id && (
              <div className="px-4 pb-4 bg-[var(--bg-primary)] border-t border-[var(--border-primary)]">
                <div className="grid grid-cols-2 gap-3 py-3 text-xs">
                  <div>
                    <span className="text-gray-500">Date:</span>
                    <span className="text-gray-300 ml-1">{insp.requested_date || "Not set"}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Permit:</span>
                    <span className="text-gray-300 ml-1">{insp.permit_number || "—"}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Time:</span>
                    <span className="text-gray-300 ml-1">{insp.time_window}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Contact:</span>
                    <span className="text-gray-300 ml-1">{insp.contact_name || "—"}</span>
                  </div>
                  {insp.contact_phone && (
                    <div>
                      <span className="text-gray-500">Phone:</span>
                      <span className="text-gray-300 ml-1">{insp.contact_phone}</span>
                    </div>
                  )}
                  {insp.notes && (
                    <div className="col-span-2">
                      <span className="text-gray-500">Notes:</span>
                      <p className="text-gray-300 mt-1">{insp.notes}</p>
                    </div>
                  )}
                  <div className="col-span-2">
                    <span className="text-gray-500">Created:</span>
                    <span className="text-gray-300 ml-1">
                      {new Date(insp.created_at).toLocaleString("en-US", { timeZone: "America/Phoenix" })}
                    </span>
                  </div>
                </div>

                {/* Status update buttons */}
                <div className="flex gap-2 flex-wrap pt-2 border-t border-[var(--border-primary)]">
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider self-center mr-1">
                    Update:
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
                      {s === "completed" ? "Mark Completed" : "Mark Failed"}
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
