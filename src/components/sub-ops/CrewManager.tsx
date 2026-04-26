"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users, Plus, X, Search, Filter, Edit2, UserX, UserCheck,
} from "lucide-react";

interface Department {
  id: string;
  name: string;
  color: string;
}

interface CrewMember {
  id: string;
  name: string;
  role: string;
  department_id?: string;
  department_name?: string;
  phone?: string;
  email?: string;
  hourly_rate?: number;
  status: string;
}

const ROLE_OPTIONS = [
  { value: "foreman", label: "Foreman" },
  { value: "journeyman", label: "Journeyman" },
  { value: "apprentice", label: "Apprentice" },
  { value: "helper", label: "Helper" },
  { value: "superintendent", label: "Superintendent" },
  { value: "project_manager", label: "Project Manager" },
  { value: "other", label: "Other" },
];

const ROLE_STYLES: Record<string, string> = {
  foreman: "bg-orange-500/20 text-orange-300",
  journeyman: "bg-blue-500/20 text-blue-300",
  apprentice: "bg-green-500/20 text-green-300",
  helper: "bg-purple-500/20 text-purple-300",
  superintendent: "bg-yellow-500/20 text-yellow-300",
  project_manager: "bg-pink-500/20 text-pink-300",
  other: "bg-gray-700 text-gray-300",
};

interface Props {
  projectId: string;
}

export default function CrewManager({ projectId }: Props) {
  const [crew, setCrew] = useState<CrewMember[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDept, setFilterDept] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [filterStatus, setFilterStatus] = useState("active");
  const [searchText, setSearchText] = useState("");

  // Add/Edit form
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formRole, setFormRole] = useState("journeyman");
  const [formDept, setFormDept] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formRate, setFormRate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const companyId = typeof window !== "undefined" ? localStorage.getItem("sub_ops_company_id") : null;

  const fetchData = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ status: filterStatus });
      if (filterDept) params.set("department", filterDept);
      if (filterRole) params.set("role", filterRole);

      const [crewRes, deptRes] = await Promise.all([
        fetch(`/api/sub-ops/companies/${companyId}/crew?${params}`),
        fetch(`/api/sub-ops/companies/${companyId}/departments`),
      ]);
      if (crewRes.ok) {
        const d = await crewRes.json();
        setCrew(d.data || []);
      }
      if (deptRes.ok) {
        const d = await deptRes.json();
        setDepartments(d.data || []);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, [companyId, filterDept, filterRole, filterStatus]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const resetForm = () => {
    setFormName("");
    setFormRole("journeyman");
    setFormDept("");
    setFormPhone("");
    setFormEmail("");
    setFormRate("");
    setEditingId(null);
    setError("");
  };

  const openEditForm = (member: CrewMember) => {
    setEditingId(member.id);
    setFormName(member.name);
    setFormRole(member.role);
    setFormDept(member.department_id || "");
    setFormPhone(member.phone || "");
    setFormEmail(member.email || "");
    setFormRate(member.hourly_rate?.toString() || "");
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!formName.trim()) { setError("Name is required"); return; }
    if (!companyId) return;
    setSaving(true);
    setError("");

    const payload: Record<string, unknown> = {
      name: formName.trim(),
      role: formRole,
      department_id: formDept || null,
      phone: formPhone.trim() || null,
      email: formEmail.trim() || null,
      hourly_rate: formRate ? parseFloat(formRate) : null,
    };

    try {
      const url = editingId
        ? `/api/sub-ops/companies/${companyId}/crew/${editingId}`
        : `/api/sub-ops/companies/${companyId}/crew`;

      const res = await fetch(url, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        resetForm();
        setShowForm(false);
        await fetchData();
      } else {
        const d = await res.json().catch(() => ({}));
        setError(d.error || "Failed to save");
      }
    } catch {
      setError("Network error");
    }
    setSaving(false);
  };

  const toggleStatus = async (member: CrewMember) => {
    if (!companyId) return;
    const newStatus = member.status === "active" ? "inactive" : "active";
    try {
      await fetch(`/api/sub-ops/companies/${companyId}/crew/${member.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      await fetchData();
    } catch { /* ignore */ }
  };

  const filtered = crew.filter(m => {
    if (!searchText) return true;
    const q = searchText.toLowerCase();
    return m.name.toLowerCase().includes(q) || (m.phone || "").includes(q) || (m.email || "").toLowerCase().includes(q);
  });

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
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Users size={20} /> Crew Roster
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {filtered.length} crew member{filtered.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(!showForm); }}
          className="flex items-center gap-1.5 px-3 py-2 bg-[#F97316]/10 text-[#F97316] hover:bg-[#F97316]/20 rounded-lg text-xs font-semibold transition-colors min-h-[40px]"
        >
          {showForm ? <><X size={14} /> Cancel</> : <><Plus size={14} /> Add Crew</>}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            placeholder="Search crew…"
            className="w-full pl-8 pr-3 py-2 bg-[#1F1F25] border border-[#2a2a35] rounded-lg text-sm text-white placeholder-gray-500 min-h-[40px]"
          />
        </div>
        <select
          value={filterDept}
          onChange={e => setFilterDept(e.target.value)}
          className="px-3 py-2 bg-[#1F1F25] border border-[#2a2a35] rounded-lg text-sm text-gray-300 min-h-[40px]"
        >
          <option value="">All Departments</option>
          {departments.map(d => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
        <select
          value={filterRole}
          onChange={e => setFilterRole(e.target.value)}
          className="px-3 py-2 bg-[#1F1F25] border border-[#2a2a35] rounded-lg text-sm text-gray-300 min-h-[40px]"
        >
          <option value="">All Roles</option>
          {ROLE_OPTIONS.map(r => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2 bg-[#1F1F25] border border-[#2a2a35] rounded-lg text-sm text-gray-300 min-h-[40px]"
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-[#121217] border border-[#1F1F25] rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-white">
            {editingId ? "Edit Crew Member" : "New Crew Member"}
          </h3>
          {error && (
            <div className="text-xs text-red-400 bg-red-500/10 px-3 py-2 rounded-lg">{error}</div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              value={formName}
              onChange={e => setFormName(e.target.value)}
              placeholder="Full name"
              className="w-full px-3 py-2 bg-[#1F1F25] border border-[#2a2a35] rounded-lg text-sm text-white placeholder-gray-500 min-h-[40px]"
            />
            <select
              value={formRole}
              onChange={e => setFormRole(e.target.value)}
              className="w-full px-3 py-2 bg-[#1F1F25] border border-[#2a2a35] rounded-lg text-sm text-gray-300 min-h-[40px]"
            >
              {ROLE_OPTIONS.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
            <select
              value={formDept}
              onChange={e => setFormDept(e.target.value)}
              className="w-full px-3 py-2 bg-[#1F1F25] border border-[#2a2a35] rounded-lg text-sm text-gray-300 min-h-[40px]"
            >
              <option value="">No Department</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
            <input
              value={formPhone}
              onChange={e => setFormPhone(e.target.value)}
              placeholder="Phone"
              className="w-full px-3 py-2 bg-[#1F1F25] border border-[#2a2a35] rounded-lg text-sm text-white placeholder-gray-500 min-h-[40px]"
            />
            <input
              value={formEmail}
              onChange={e => setFormEmail(e.target.value)}
              placeholder="Email"
              type="email"
              className="w-full px-3 py-2 bg-[#1F1F25] border border-[#2a2a35] rounded-lg text-sm text-white placeholder-gray-500 min-h-[40px]"
            />
            <input
              value={formRate}
              onChange={e => setFormRate(e.target.value)}
              placeholder="Hourly rate"
              type="number"
              step="0.01"
              className="w-full px-3 py-2 bg-[#1F1F25] border border-[#2a2a35] rounded-lg text-sm text-white placeholder-gray-500 min-h-[40px]"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="px-4 py-2 bg-[#F97316] text-white rounded-lg text-xs font-semibold min-h-[40px] disabled:opacity-50"
            >
              {saving ? "Saving…" : editingId ? "Update" : "Add Crew Member"}
            </button>
            <button
              onClick={() => { resetForm(); setShowForm(false); }}
              className="px-4 py-2 bg-[#1F1F25] text-gray-400 rounded-lg text-xs min-h-[40px]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Crew List */}
      {filtered.length === 0 ? (
        <div className="bg-[#121217] border border-[#1F1F25] rounded-xl p-8 text-center">
          <Users size={32} className="mx-auto text-gray-600 mb-3" />
          <p className="text-gray-400 text-sm">No crew members found</p>
          <p className="text-gray-500 text-xs mt-1">Add crew members to manage your team roster</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(member => (
            <div
              key={member.id}
              className="bg-[#121217] border border-[#1F1F25] rounded-lg p-3 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-9 h-9 rounded-full bg-[#1F1F25] flex items-center justify-center text-sm font-bold text-gray-400 shrink-0">
                  {member.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-white truncate">{member.name}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${ROLE_STYLES[member.role] || ROLE_STYLES.other}`}>
                      {ROLE_OPTIONS.find(r => r.value === member.role)?.label || member.role}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                    {member.department_name && <span>{member.department_name}</span>}
                    {member.phone && <span>{member.phone}</span>}
                    {member.hourly_rate && <span>${member.hourly_rate}/hr</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => openEditForm(member)}
                  className="p-2 text-gray-500 hover:text-white transition-colors"
                  title="Edit"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={() => toggleStatus(member)}
                  className={`p-2 transition-colors ${member.status === "active" ? "text-gray-500 hover:text-red-400" : "text-gray-500 hover:text-green-400"}`}
                  title={member.status === "active" ? "Deactivate" : "Reactivate"}
                >
                  {member.status === "active" ? <UserX size={14} /> : <UserCheck size={14} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
