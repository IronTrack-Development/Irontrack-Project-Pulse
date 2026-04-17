"use client";

import { useEffect, useState } from "react";
import {
  Plus, Link2, Copy, Check, Trash2, UserPlus, Send,
  Eye, CheckCircle, AlertTriangle, Clock, X, ChevronDown, ChevronUp
} from "lucide-react";

// All trades from trade-inference.ts
const ALL_TRADES = [
  "Framing", "Drywall", "Concrete", "Plumbing", "Electrical", "HVAC",
  "Fire Protection", "Inspection", "Roofing", "Painting", "Flooring",
  "Landscape", "Closeout", "Structural Steel", "Elevator", "Demolition",
  "Earthwork", "Underground", "Masonry", "Insulation", "Doors/Hardware",
  "Windows/Glazing", "Waterproofing", "Submittals", "Fabrication",
  "Delivery", "Survey", "Permits", "General"
];

interface Sub {
  id: string;
  sub_name: string;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  trades: string[];
  notes: string | null;
  created_at: string;
}

interface SubStatus {
  id: string;
  sub_name: string;
  trades: string[];
  status: "not_sent" | "sent" | "viewed" | "acknowledged";
  latest_active_link: {
    id: string;
    token: string;
    label: string | null;
    created_at: string;
    expires_at: string | null;
    share_url: string;
  } | null;
  last_viewed_at: string | null;
  acknowledged_at: string | null;
  acknowledged_by: string | null;
}

interface Props {
  projectId: string;
}

export default function SubsTab({ projectId }: Props) {
  const [subs, setSubs] = useState<Sub[]>([]);
  const [statuses, setStatuses] = useState<SubStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedSub, setExpandedSub] = useState<string | null>(null);
  const [generating, setGenerating] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Add form state
  const [newName, setNewName] = useState("");
  const [newContact, setNewContact] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newTrades, setNewTrades] = useState<string[]>([]);
  const [addError, setAddError] = useState("");
  const [adding, setAdding] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [subsRes, statusRes] = await Promise.all([
        fetch(`/api/projects/${projectId}/subs`),
        fetch(`/api/projects/${projectId}/sub-status`),
      ]);
      if (subsRes.ok) setSubs(await subsRes.json());
      if (statusRes.ok) {
        const data = await statusRes.json();
        if (Array.isArray(data)) {
          setStatuses(data);
        } else if (data && Array.isArray(data.subs)) {
          setStatuses(data.subs);
        }
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [projectId]);

  const handleAddSub = async () => {
    if (!newName.trim()) { setAddError("Sub name is required"); return; }
    if (newTrades.length === 0) { setAddError("Select at least one trade"); return; }
    setAdding(true);
    setAddError("");

    const res = await fetch(`/api/projects/${projectId}/subs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sub_name: newName.trim(),
        contact_name: newContact.trim() || null,
        contact_phone: newPhone.trim() || null,
        contact_email: newEmail.trim() || null,
        trades: newTrades,
      }),
    });

    if (res.ok) {
      setNewName(""); setNewContact(""); setNewPhone(""); setNewEmail(""); setNewTrades([]);
      setShowAddForm(false);
      fetchData();
    } else {
      const data = await res.json().catch(() => ({}));
      setAddError(data.error || "Failed to add sub");
    }
    setAdding(false);
  };

  const handleGenerateLink = async (subId: string) => {
    setGenerating(subId);
    const res = await fetch(`/api/projects/${projectId}/subs/${subId}/share`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    if (res.ok) {
      fetchData();
    }
    setGenerating(null);
  };

  const handleCopyLink = async (token: string, subId: string) => {
    const appUrl = window.location.origin;
    const url = `${appUrl}/view/${token}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(subId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDeleteSub = async (subId: string) => {
    if (!confirm("Delete this subcontractor? This will also remove their share links.")) return;
    setDeleting(subId);
    await fetch(`/api/projects/${projectId}/subs/${subId}`, { method: "DELETE" });
    fetchData();
    setDeleting(null);
  };

  const toggleTrade = (trade: string) => {
    setNewTrades(prev =>
      prev.includes(trade) ? prev.filter(t => t !== trade) : [...prev, trade]
    );
  };

  const getStatusForSub = (subId: string): SubStatus | undefined => {
    return statuses.find(s => s.id === subId);
  };

  const statusBadge = (status?: SubStatus) => {
    if (!status || status.status === "not_sent") {
      return (
        <span className="flex items-center gap-1 text-xs text-gray-500">
          <Clock size={12} /> No link sent
        </span>
      );
    }
    if (status.status === "acknowledged") {
      return (
        <span className="flex items-center gap-1 text-xs text-[#22C55E]">
          <CheckCircle size={12} /> Acknowledged by {status.acknowledged_by}
        </span>
      );
    }
    if (status.status === "viewed") {
      return (
        <span className="flex items-center gap-1 text-xs text-[#F97316]">
          <Eye size={12} /> Viewed, not acknowledged
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-xs text-yellow-500">
        <AlertTriangle size={12} /> Link sent, not opened
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="w-6 h-6 border-2 border-[#F97316] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Subcontractors</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {subs.length} sub{subs.length !== 1 ? "s" : ""} on this project
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F97316] hover:bg-[#ea6c0a] text-white rounded-lg text-xs font-semibold transition-colors"
        >
          <UserPlus size={14} />
          Add Sub
        </button>
      </div>

      {/* Add Sub Form */}
      {showAddForm && (
        <div className="bg-[#121217] border border-[#1F1F25] rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Add Subcontractor</h3>
            <button onClick={() => setShowAddForm(false)} className="text-gray-500 hover:text-white">
              <X size={16} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Company Name *</label>
              <input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="e.g., ABC Plumbing"
                className="w-full bg-[#0B0B0D] border border-[#1F1F25] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#F97316]/50"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Contact Name</label>
              <input
                value={newContact}
                onChange={e => setNewContact(e.target.value)}
                placeholder="e.g., Joe Martinez"
                className="w-full bg-[#0B0B0D] border border-[#1F1F25] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#F97316]/50"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Phone</label>
              <input
                value={newPhone}
                onChange={e => setNewPhone(e.target.value)}
                placeholder="602-555-1234"
                className="w-full bg-[#0B0B0D] border border-[#1F1F25] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#F97316]/50"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Email</label>
              <input
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                placeholder="joe@abcplumbing.com"
                className="w-full bg-[#0B0B0D] border border-[#1F1F25] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#F97316]/50"
              />
            </div>
          </div>

          {/* Trade Selection */}
          <div>
            <label className="text-xs text-gray-400 mb-2 block">Trades * (select all that apply)</label>
            <div className="flex flex-wrap gap-1.5">
              {ALL_TRADES.map(trade => (
                <button
                  key={trade}
                  onClick={() => toggleTrade(trade)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    newTrades.includes(trade)
                      ? "bg-[#F97316] text-white"
                      : "bg-[#1F1F25] text-gray-400 hover:text-white hover:bg-[#2a2a35]"
                  }`}
                >
                  {trade}
                </button>
              ))}
            </div>
          </div>

          {addError && (
            <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {addError}
            </div>
          )}

          <button
            onClick={handleAddSub}
            disabled={adding}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#F97316] hover:bg-[#ea6c0a] disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors"
          >
            <Plus size={14} />
            {adding ? "Adding..." : "Add Subcontractor"}
          </button>
        </div>
      )}

      {/* Sub List */}
      {subs.length === 0 ? (
        <div className="bg-[#121217] border border-[#1F1F25] rounded-xl p-8 text-center">
          <UserPlus size={32} className="mx-auto text-gray-600 mb-3" />
          <p className="text-gray-400 text-sm mb-1">No subcontractors added yet</p>
          <p className="text-gray-600 text-xs">Add a sub to share their filtered schedule view</p>
        </div>
      ) : (
        <div className="space-y-2">
          {subs.map(sub => {
            const status = getStatusForSub(sub.id);
            const isExpanded = expandedSub === sub.id;

            return (
              <div
                key={sub.id}
                className="bg-[#121217] border border-[#1F1F25] rounded-xl overflow-hidden"
              >
                {/* Sub Header Row */}
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-[#1a1a20] transition-colors"
                  onClick={() => setExpandedSub(isExpanded ? null : sub.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-white truncate">{sub.sub_name}</span>
                      {sub.contact_name && (
                        <span className="text-xs text-gray-500">({sub.contact_name})</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {sub.trades.map(t => (
                        <span key={t} className="text-[10px] bg-[#1F1F25] text-gray-400 px-1.5 py-0.5 rounded">
                          {t}
                        </span>
                      ))}
                    </div>
                    <div className="mt-1.5">
                      {statusBadge(status)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-3">
                    {status?.latest_active_link?.token ? (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleCopyLink(status.latest_active_link!.token, sub.id); }}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          copiedId === sub.id
                            ? "bg-[#22C55E]/20 text-[#22C55E]"
                            : "bg-[#1F1F25] text-gray-300 hover:text-white hover:bg-[#2a2a35]"
                        }`}
                      >
                        {copiedId === sub.id ? <Check size={12} /> : <Copy size={12} />}
                        {copiedId === sub.id ? "Copied!" : "Copy Link"}
                      </button>
                    ) : (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleGenerateLink(sub.id); }}
                        disabled={generating === sub.id}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-[#F97316] hover:bg-[#ea6c0a] disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-colors"
                      >
                        <Send size={12} />
                        {generating === sub.id ? "..." : "Generate Link"}
                      </button>
                    )}
                    {isExpanded ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
                  </div>
                </div>

                {/* Expanded Detail */}
                {isExpanded && (
                  <div className="border-t border-[#1F1F25] p-4 space-y-3 bg-[#0e0e12]">
                    {/* Contact Info */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                      <div>
                        <span className="text-gray-500">Contact:</span>
                        <span className="text-gray-300 ml-1">{sub.contact_name || "—"}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Phone:</span>
                        <span className="text-gray-300 ml-1">{sub.contact_phone || "—"}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Email:</span>
                        <span className="text-gray-300 ml-1">{sub.contact_email || "—"}</span>
                      </div>
                    </div>

                    {/* Tracking Info */}
                    {status && status.status !== "not_sent" && (
                      <div className="bg-[#121217] border border-[#1F1F25] rounded-lg p-3 space-y-1.5 text-xs">
                        <div className="flex items-center gap-2">
                          <Link2 size={11} className="text-gray-500" />
                          <span className="text-gray-500">Link sent:</span>
                          <span className="text-gray-300">{status.latest_active_link?.created_at ? new Date(status.latest_active_link.created_at).toLocaleString() : "—"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Eye size={11} className="text-gray-500" />
                          <span className="text-gray-500">Last viewed:</span>
                          <span className={status.last_viewed_at ? "text-[#F97316]" : "text-gray-600"}>
                            {status.last_viewed_at ? new Date(status.last_viewed_at).toLocaleString() : "Not yet"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle size={11} className="text-gray-500" />
                          <span className="text-gray-500">Acknowledged:</span>
                          <span className={status.acknowledged_at ? "text-[#22C55E]" : "text-gray-600"}>
                            {status.acknowledged_at
                              ? `${new Date(status.acknowledged_at).toLocaleString()} by ${status.acknowledged_by}`
                              : "Not yet"}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-1">
                      {status?.latest_active_link && (
                        <button
                          onClick={() => handleGenerateLink(sub.id)}
                          disabled={generating === sub.id}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-[#1F1F25] text-gray-400 hover:text-white rounded-lg text-xs transition-colors"
                        >
                          <Link2 size={12} />
                          {generating === sub.id ? "..." : "Regenerate Link"}
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteSub(sub.id)}
                        disabled={deleting === sub.id}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg text-xs transition-colors ml-auto"
                      >
                        <Trash2 size={12} />
                        {deleting === sub.id ? "..." : "Remove"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
