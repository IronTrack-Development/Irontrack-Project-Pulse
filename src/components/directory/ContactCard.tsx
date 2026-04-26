"use client";

import { Mail, Phone, Pencil, Trash2 } from "lucide-react";

export interface CompanyContact {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  role: string;
  trade: string | null;
  discipline: string | null;
  notes: string | null;
  created_via: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectContact {
  id: string;
  role_on_project: string | null;
  invited_at: string;
  joined_at: string | null;
  contact_id: string;
  company_contacts: CompanyContact;
}

const ROLE_LABELS: Record<string, string> = {
  architect: "Architect",
  engineer: "Engineer",
  subcontractor: "Subcontractor",
  supplier: "Supplier",
  owner: "Owner",
  owners_rep: "Owner's Rep",
  inspector: "Inspector",
  internal: "Internal",
  other: "Other",
};

const ROLE_COLORS: Record<string, string> = {
  architect: "bg-purple-500/15 text-purple-300",
  engineer: "bg-blue-500/15 text-blue-300",
  subcontractor: "bg-yellow-500/15 text-yellow-300",
  supplier: "bg-teal-500/15 text-teal-300",
  owner: "bg-emerald-500/15 text-emerald-300",
  owners_rep: "bg-green-500/15 text-green-300",
  inspector: "bg-red-500/15 text-red-300",
  internal: "bg-[#F97316]/15 text-[#F97316]",
  other: "bg-gray-700 text-gray-300",
};

interface Props {
  contact: ProjectContact;
  onEdit: (contact: ProjectContact) => void;
  onRemove: (contact: ProjectContact) => void;
}

export default function ContactCard({ contact, onEdit, onRemove }: Props) {
  const cc = contact.company_contacts;
  const role = cc.role;
  const roleLabel = ROLE_LABELS[role] ?? role;
  const roleColor = ROLE_COLORS[role] ?? "bg-gray-700 text-gray-300";

  const subLabel =
    role === "engineer" && cc.discipline
      ? cc.discipline
      : role === "subcontractor" && cc.trade
      ? cc.trade
      : null;

  return (
    <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-4 hover:border-[var(--border-secondary)] transition-colors">
      <div className="flex items-start justify-between gap-3">
        {/* Left: info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-sm font-semibold text-white truncate">{cc.name}</span>
            <span className={`flex-none text-[10px] font-semibold px-1.5 py-0.5 rounded ${roleColor}`}>
              {roleLabel}
            </span>
            {subLabel && (
              <span className="text-[10px] text-gray-500 bg-[var(--bg-tertiary)] px-1.5 py-0.5 rounded">
                {subLabel}
              </span>
            )}
          </div>

          {cc.company && (
            <p className="text-xs text-gray-400 mb-1 truncate">{cc.company}</p>
          )}

          {contact.joined_at && (
            <p className="text-[10px] text-[#F97316] mb-2">✓ Joined via QR</p>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap mt-2">
            {cc.email && (
              <a
                href={`mailto:${cc.email}`}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] text-gray-300 hover:text-white rounded-lg text-xs font-medium transition-colors min-h-[36px]"
                onClick={(e) => e.stopPropagation()}
              >
                <Mail size={12} className="text-[#F97316]" />
                <span className="hidden sm:inline truncate max-w-[120px]">{cc.email}</span>
                <span className="sm:hidden">Email</span>
              </a>
            )}
            {cc.phone && (
              <a
                href={`tel:${cc.phone}`}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] text-gray-300 hover:text-white rounded-lg text-xs font-medium transition-colors min-h-[36px]"
                onClick={(e) => e.stopPropagation()}
              >
                <Phone size={12} className="text-[#F97316]" />
                <span className="hidden sm:inline">{cc.phone}</span>
                <span className="sm:hidden">Call</span>
              </a>
            )}
          </div>
        </div>

        {/* Right: edit/remove */}
        <div className="flex items-center gap-1.5 flex-none">
          <button
            onClick={() => onEdit(contact)}
            className="p-2 rounded-lg bg-[var(--bg-tertiary)] text-gray-500 hover:text-white transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
            title="Edit contact"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={() => onRemove(contact)}
            className="p-2 rounded-lg bg-[var(--bg-tertiary)] text-gray-500 hover:text-red-400 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
            title="Remove from project"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
