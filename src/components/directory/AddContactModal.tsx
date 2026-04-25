"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Search, Plus, Loader2, Check } from "lucide-react";
import type { CompanyContact, ProjectContact } from "./ContactCard";

const ROLE_OPTIONS = [
  { value: "architect", label: "Architect" },
  { value: "engineer", label: "Engineer" },
  { value: "subcontractor", label: "Subcontractor" },
  { value: "supplier", label: "Supplier" },
  { value: "owner", label: "Owner" },
  { value: "owners_rep", label: "Owner's Rep" },
  { value: "inspector", label: "Inspector" },
  { value: "internal", label: "Internal" },
  { value: "other", label: "Other" },
];

interface SearchResult extends CompanyContact {
  already_on_project?: boolean;
}

interface Props {
  projectId: string;
  existingContactIds: Set<string>;
  editContact?: ProjectContact | null;
  onClose: () => void;
  onAdded: (contact: ProjectContact) => void;
  onUpdated?: (contact: ProjectContact) => void;
}

export default function AddContactModal({
  projectId,
  existingContactIds,
  editContact,
  onClose,
  onAdded,
  onUpdated,
}: Props) {
  const isEdit = !!editContact;

  const [mode, setMode] = useState<"search" | "new">(isEdit ? "new" : "search");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  // Form fields
  const [name, setName] = useState(editContact?.company_contacts.name ?? "");
  const [company, setCompany] = useState(editContact?.company_contacts.company ?? "");
  const [email, setEmail] = useState(editContact?.company_contacts.email ?? "");
  const [phone, setPhone] = useState(editContact?.company_contacts.phone ?? "");
  const [role, setRole] = useState(editContact?.company_contacts.role ?? "");
  const [trade, setTrade] = useState(editContact?.company_contacts.trade ?? "");
  const [discipline, setDiscipline] = useState(editContact?.company_contacts.discipline ?? "");
  const [roleOnProject, setRoleOnProject] = useState(editContact?.role_on_project ?? "");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(
        `/api/company-contacts/search?q=${encodeURIComponent(q)}&limit=10`
      );
      if (res.ok) {
        const data: CompanyContact[] = await res.json();
        setSearchResults(
          data.map((c) => ({
            ...c,
            already_on_project: existingContactIds.has(c.id),
          }))
        );
      }
    } catch {
      // ignore
    }
    setSearching(false);
  }, [existingContactIds]);

  useEffect(() => {
    const timer = setTimeout(() => doSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery, doSearch]);

  const handleAddExisting = async (contactId: string) => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/projects/${projectId}/directory`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact_id: contactId }),
      });
      if (res.ok) {
        const data: ProjectContact = await res.json();
        onAdded(data);
        onClose();
      } else {
        const d = await res.json().catch(() => ({}));
        setError(d.error ?? "Failed to add contact");
      }
    } catch {
      setError("Network error");
    }
    setSaving(false);
  };

  const handleSave = async () => {
    if (!name.trim()) { setError("Name is required"); return; }
    if (!role) { setError("Role is required"); return; }

    setSaving(true);
    setError("");

    try {
      if (isEdit && editContact) {
        // PATCH existing
        const res = await fetch(`/api/projects/${projectId}/directory/${editContact.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            company: company.trim() || null,
            email: email.trim() || null,
            phone: phone.trim() || null,
            role,
            trade: trade.trim() || null,
            discipline: discipline.trim() || null,
            role_on_project: roleOnProject.trim() || null,
          }),
        });
        if (res.ok) {
          const data: ProjectContact = await res.json();
          onUpdated?.(data);
          onClose();
        } else {
          const d = await res.json().catch(() => ({}));
          setError(d.error ?? "Failed to update contact");
        }
      } else {
        // POST new
        const res = await fetch(`/api/projects/${projectId}/directory`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            company: company.trim() || null,
            email: email.trim() || null,
            phone: phone.trim() || null,
            role,
            trade: trade.trim() || null,
            discipline: discipline.trim() || null,
            role_on_project: roleOnProject.trim() || null,
          }),
        });
        if (res.ok) {
          const data: ProjectContact = await res.json();
          onAdded(data);
          onClose();
        } else {
          const d = await res.json().catch(() => ({}));
          setError(d.error ?? "Failed to add contact");
        }
      }
    } catch {
      setError("Network error");
    }

    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-0 sm:px-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />

      <div className="relative bg-[#121217] border border-[#1F1F25] rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1F1F25] flex-none">
          <h2 className="text-sm font-bold text-white">
            {isEdit ? "Edit Contact" : "Add Contact"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#1F1F25] text-gray-400 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Mode toggle (only for new) */}
        {!isEdit && (
          <div className="flex border-b border-[#1F1F25] flex-none">
            <button
              onClick={() => setMode("search")}
              className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${
                mode === "search"
                  ? "text-[#F97316] border-b-2 border-[#F97316]"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              Search Existing
            </button>
            <button
              onClick={() => setMode("new")}
              className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${
                mode === "new"
                  ? "text-[#F97316] border-b-2 border-[#F97316]"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              Create New
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-5">
          {/* Search mode */}
          {mode === "search" && !isEdit && (
            <div className="space-y-3">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or email…"
                  autoFocus
                  className="w-full bg-[#0B0B0D] border border-[#1F1F25] rounded-xl pl-9 pr-3 py-3 text-white text-sm focus:outline-none focus:border-[#F97316]/50 placeholder-gray-600"
                />
              </div>

              {searching && (
                <div className="flex items-center justify-center py-6">
                  <Loader2 size={20} className="animate-spin text-[#F97316]" />
                </div>
              )}

              {!searching && searchQuery && searchResults.length === 0 && (
                <div className="text-center py-6">
                  <p className="text-sm text-gray-500 mb-3">No contacts found</p>
                  <button
                    onClick={() => setMode("new")}
                    className="flex items-center gap-1.5 mx-auto px-4 py-2 bg-[#F97316] text-white rounded-lg text-xs font-semibold"
                  >
                    <Plus size={13} />
                    Create New Contact
                  </button>
                </div>
              )}

              {!searching && searchResults.length > 0 && (
                <div className="space-y-2">
                  {searchResults.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between bg-[#0B0B0D] border border-[#1F1F25] rounded-xl px-4 py-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-white truncate">{c.name}</p>
                        {c.company && <p className="text-xs text-gray-400 truncate">{c.company}</p>}
                        {c.email && <p className="text-[10px] text-gray-600 truncate">{c.email}</p>}
                      </div>
                      {c.already_on_project ? (
                        <span className="flex items-center gap-1 text-[10px] text-[#22C55E] ml-3 flex-none">
                          <Check size={11} />
                          Added
                        </span>
                      ) : (
                        <button
                          onClick={() => handleAddExisting(c.id)}
                          disabled={saving}
                          className="ml-3 flex-none px-3 py-1.5 bg-[#F97316] hover:bg-[#ea6c10] disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-colors"
                        >
                          Add
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {!searching && !searchQuery && (
                <p className="text-xs text-gray-600 text-center pt-2">
                  Type a name or email to search your company contacts
                </p>
              )}
            </div>
          )}

          {/* New / Edit form */}
          {(mode === "new" || isEdit) && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3">
                {/* Name */}
                <div>
                  <label className="block text-xs text-gray-400 mb-1 font-medium">Name *</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Full name"
                    className="w-full bg-[#0B0B0D] border border-[#1F1F25] rounded-xl px-3 py-3 text-white text-sm focus:outline-none focus:border-[#F97316]/50 placeholder-gray-600"
                  />
                </div>

                {/* Company */}
                <div>
                  <label className="block text-xs text-gray-400 mb-1 font-medium">Company</label>
                  <input
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Company name"
                    className="w-full bg-[#0B0B0D] border border-[#1F1F25] rounded-xl px-3 py-3 text-white text-sm focus:outline-none focus:border-[#F97316]/50 placeholder-gray-600"
                  />
                </div>

                {/* Role */}
                <div>
                  <label className="block text-xs text-gray-400 mb-1 font-medium">Role *</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full bg-[#0B0B0D] border border-[#1F1F25] rounded-xl px-3 py-3 text-white text-sm focus:outline-none focus:border-[#F97316]/50"
                  >
                    <option value="" disabled>Select role…</option>
                    {ROLE_OPTIONS.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>

                {/* Conditional: trade (subcontractor) */}
                {role === "subcontractor" && (
                  <div>
                    <label className="block text-xs text-gray-400 mb-1 font-medium">Trade</label>
                    <input
                      value={trade}
                      onChange={(e) => setTrade(e.target.value)}
                      placeholder="e.g., Electrical, Plumbing, HVAC"
                      className="w-full bg-[#0B0B0D] border border-[#1F1F25] rounded-xl px-3 py-3 text-white text-sm focus:outline-none focus:border-[#F97316]/50 placeholder-gray-600"
                    />
                  </div>
                )}

                {/* Conditional: discipline (engineer) */}
                {role === "engineer" && (
                  <div>
                    <label className="block text-xs text-gray-400 mb-1 font-medium">Discipline</label>
                    <input
                      value={discipline}
                      onChange={(e) => setDiscipline(e.target.value)}
                      placeholder="e.g., Structural, MEP, Civil"
                      className="w-full bg-[#0B0B0D] border border-[#1F1F25] rounded-xl px-3 py-3 text-white text-sm focus:outline-none focus:border-[#F97316]/50 placeholder-gray-600"
                    />
                  </div>
                )}

                {/* Email */}
                <div>
                  <label className="block text-xs text-gray-400 mb-1 font-medium">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full bg-[#0B0B0D] border border-[#1F1F25] rounded-xl px-3 py-3 text-white text-sm focus:outline-none focus:border-[#F97316]/50 placeholder-gray-600"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs text-gray-400 mb-1 font-medium">Phone</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="602-555-1234"
                    className="w-full bg-[#0B0B0D] border border-[#1F1F25] rounded-xl px-3 py-3 text-white text-sm focus:outline-none focus:border-[#F97316]/50 placeholder-gray-600"
                  />
                </div>
              </div>

              {error && (
                <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer — only for new/edit form */}
        {(mode === "new" || isEdit) && (
          <div className="flex-none px-5 py-4 pb-8 sm:pb-4 border-t border-[#1F1F25] bg-[#121217]">
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 bg-[#1F1F25] text-gray-300 hover:text-white rounded-xl text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !name.trim() || !role}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#F97316] hover:bg-[#ea6c10] disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                {saving ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Check size={15} />
                )}
                {saving ? "Saving…" : isEdit ? "Save Changes" : "Add Contact"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
