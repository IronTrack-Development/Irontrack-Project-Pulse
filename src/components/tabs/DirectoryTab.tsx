"use client";

import { useEffect, useState, useMemo } from "react";
import { UserPlus, QrCode, Search, Users, X, RefreshCw } from "lucide-react";
import ContactCard, { type ProjectContact } from "@/components/directory/ContactCard";
import AddContactModal from "@/components/directory/AddContactModal";
import QRShareModal from "@/components/directory/QRShareModal";

interface Props {
  projectId: string;
}

// Groups for display
const ROLE_GROUPS: { id: string; label: string; roles: string[] }[] = [
  { id: "design", label: "Design Team", roles: ["architect", "engineer"] },
  { id: "owner", label: "Owner", roles: ["owner", "owners_rep"] },
  { id: "subs", label: "Subcontractors & Suppliers", roles: ["subcontractor", "supplier"] },
  { id: "inspections", label: "Inspectors", roles: ["inspector"] },
  { id: "internal", label: "Internal", roles: ["internal"] },
  { id: "other", label: "Other", roles: ["other"] },
];

export default function DirectoryTab({ projectId }: Props) {
  const [contacts, setContacts] = useState<ProjectContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [editContact, setEditContact] = useState<ProjectContact | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/directory`);
      if (res.ok) {
        const data = await res.json();
        setContacts(Array.isArray(data) ? data : []);
      }
    } catch {
      // ignore
    }
    setLoading(false);
  };

  useEffect(() => { fetchContacts(); }, [projectId]);

  const existingContactIds = useMemo(
    () => new Set(contacts.map((c) => c.contact_id)),
    [contacts]
  );

  const filtered = useMemo(() => {
    if (!search.trim()) return contacts;
    const q = search.toLowerCase();
    return contacts.filter((c) => {
      const cc = c.company_contacts;
      return (
        cc.name.toLowerCase().includes(q) ||
        cc.company?.toLowerCase().includes(q) ||
        cc.email?.toLowerCase().includes(q) ||
        cc.role.toLowerCase().includes(q) ||
        cc.trade?.toLowerCase().includes(q) ||
        cc.discipline?.toLowerCase().includes(q)
      );
    });
  }, [contacts, search]);

  const handleRemove = async (contact: ProjectContact) => {
    if (!confirm(`Remove ${contact.company_contacts.name} from this project?`)) return;
    setRemoving(contact.id);
    try {
      const res = await fetch(`/api/projects/${projectId}/directory/${contact.id}`, {
        method: "DELETE",
      });
      if (res.ok || res.status === 204) {
        setContacts((prev) => prev.filter((c) => c.id !== contact.id));
      }
    } catch {
      // ignore
    }
    setRemoving(null);
  };

  const handleAdded = (contact: ProjectContact) => {
    setContacts((prev) => [contact, ...prev]);
  };

  const handleUpdated = (contact: ProjectContact) => {
    setContacts((prev) => prev.map((c) => (c.id === contact.id ? contact : c)));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="w-6 h-6 border-2 border-[#F97316] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[color:var(--text-primary)]">Project Directory</h2>
            <p className="text-xs text-[color:var(--text-muted)] mt-0.5">
              {contacts.length} contact{contacts.length !== 1 ? "s" : ""} on this project
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchContacts}
              className="p-2.5 rounded-lg bg-[#1F1F25] text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <RefreshCw size={15} />
            </button>
            <button
              onClick={() => setShowQRModal(true)}
              className="flex items-center gap-1.5 px-3 py-2.5 bg-[#1F1F25] hover:bg-[#2a2a35] text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] border border-[#2a2a35] rounded-lg text-xs font-semibold transition-colors min-h-[44px]"
            >
              <QrCode size={14} />
              <span className="hidden sm:inline">Share QR</span>
            </button>
            <button
              onClick={() => { setEditContact(null); setShowAddModal(true); }}
              className="flex items-center gap-1.5 px-3 py-2.5 bg-[#F97316] hover:bg-[#ea6c10] text-[color:var(--text-primary)] rounded-lg text-xs font-semibold transition-colors min-h-[44px]"
            >
              <UserPlus size={14} />
              <span className="hidden sm:inline">Add Contact</span>
            </button>
          </div>
        </div>

        {/* Search */}
        {contacts.length > 0 && (
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--text-muted)] pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search contacts…"
              className="w-full bg-[#121217] border border-[#1F1F25] rounded-xl pl-9 pr-9 py-2.5 text-[color:var(--text-primary)] text-sm focus:outline-none focus:border-[#F97316]/50 placeholder-gray-600"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)]"
              >
                <X size={14} />
              </button>
            )}
          </div>
        )}

        {/* Empty state */}
        {contacts.length === 0 && (
          <div className="bg-[#121217] border border-[#1F1F25] rounded-xl p-10 text-center">
            <Users size={36} className="mx-auto text-gray-600 mb-3" />
            <p className="text-[color:var(--text-secondary)] text-sm font-semibold mb-1">No contacts yet</p>
            <p className="text-gray-600 text-xs mb-5">
              Share the QR code at your next meeting to get everyone in here fast
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setShowQRModal(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-[#1F1F25] hover:bg-[#2a2a35] text-[color:var(--text-secondary)] border border-[#2a2a35] rounded-lg text-xs font-semibold transition-colors"
              >
                <QrCode size={14} />
                Share QR Code
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-[#F97316] hover:bg-[#ea6c10] text-[color:var(--text-primary)] rounded-lg text-xs font-semibold transition-colors"
              >
                <UserPlus size={14} />
                Add Manually
              </button>
            </div>
          </div>
        )}

        {/* No search results */}
        {contacts.length > 0 && filtered.length === 0 && search && (
          <div className="text-center py-8">
            <p className="text-[color:var(--text-muted)] text-sm">No contacts match &quot;{search}&quot;</p>
          </div>
        )}

        {/* Grouped contacts */}
        {filtered.length > 0 && (
          <div className="space-y-6">
            {ROLE_GROUPS.map((group) => {
              const groupContacts = filtered.filter((c) =>
                group.roles.includes(c.company_contacts.role)
              );
              if (groupContacts.length === 0) return null;

              return (
                <div key={group.id}>
                  <h3 className="text-xs font-semibold text-[color:var(--text-muted)] uppercase tracking-wider mb-2">
                    {group.label}
                    <span className="ml-2 text-gray-600 font-normal normal-case tracking-normal">
                      ({groupContacts.length})
                    </span>
                  </h3>
                  <div className="space-y-2">
                    {groupContacts.map((contact) => (
                      <div
                        key={contact.id}
                        className={removing === contact.id ? "opacity-40 pointer-events-none" : ""}
                      >
                        <ContactCard
                          contact={contact}
                          onEdit={(c) => { setEditContact(c); setShowAddModal(true); }}
                          onRemove={handleRemove}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit modal */}
      {showAddModal && (
        <AddContactModal
          projectId={projectId}
          existingContactIds={existingContactIds}
          editContact={editContact}
          onClose={() => { setShowAddModal(false); setEditContact(null); }}
          onAdded={handleAdded}
          onUpdated={handleUpdated}
        />
      )}

      {/* QR modal */}
      {showQRModal && (
        <QRShareModal
          projectId={projectId}
          onClose={() => setShowQRModal(false)}
        />
      )}
    </>
  );
}
