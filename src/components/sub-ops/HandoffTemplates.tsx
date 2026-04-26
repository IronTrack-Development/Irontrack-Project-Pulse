"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FileText, Plus, X, Trash2, Edit2, ArrowRightLeft,
} from "lucide-react";

interface Department {
  id: string;
  name: string;
  color: string;
}

interface Template {
  id: string;
  title: string;
  from_department_id?: string;
  to_department_id?: string;
  from_department_name?: string;
  to_department_name?: string;
  items: string[];
}

interface Props {
  companyId: string;
}

export default function HandoffTemplates({ companyId }: Props) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  // Form
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formFrom, setFormFrom] = useState("");
  const [formTo, setFormTo] = useState("");
  const [formItems, setFormItems] = useState<string[]>([""]);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [tRes, dRes] = await Promise.all([
        fetch(`/api/sub-ops/companies/${companyId}/handoffs/templates`),
        fetch(`/api/sub-ops/companies/${companyId}/departments`),
      ]);
      if (tRes.ok) {
        const d = await tRes.json();
        setTemplates(d.data || []);
      }
      if (dRes.ok) {
        const d = await dRes.json();
        setDepartments(d.data || []);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, [companyId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const resetForm = () => {
    setFormTitle("");
    setFormFrom("");
    setFormTo("");
    setFormItems([""]);
    setEditingId(null);
  };

  const openEdit = (t: Template) => {
    setEditingId(t.id);
    setFormTitle(t.title);
    setFormFrom(t.from_department_id || "");
    setFormTo(t.to_department_id || "");
    setFormItems(t.items.length > 0 ? [...t.items] : [""]);
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!formTitle.trim()) return;
    const items = formItems.filter(i => i.trim());
    if (items.length === 0) return;

    setSaving(true);
    const payload = {
      title: formTitle.trim(),
      from_department_id: formFrom || null,
      to_department_id: formTo || null,
      items,
    };

    try {
      const url = editingId
        ? `/api/sub-ops/companies/${companyId}/handoffs/templates/${editingId}`
        : `/api/sub-ops/companies/${companyId}/handoffs/templates`;

      const res = await fetch(url, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        resetForm();
        setShowForm(false);
        await fetchData();
      }
    } catch { /* ignore */ }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this template?")) return;
    try {
      await fetch(`/api/sub-ops/companies/${companyId}/handoffs/templates/${id}`, { method: "DELETE" });
      await fetchData();
    } catch { /* ignore */ }
  };

  const addItemField = () => setFormItems([...formItems, ""]);
  const removeItemField = (idx: number) => setFormItems(formItems.filter((_, i) => i !== idx));
  const updateItem = (idx: number, val: string) => {
    const updated = [...formItems];
    updated[idx] = val;
    setFormItems(updated);
  };

  // Group templates by department transition
  const grouped: Record<string, Template[]> = {};
  templates.forEach(t => {
    const key = [t.from_department_name || "Any", t.to_department_name || "Any"].join(" → ");
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(t);
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
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <FileText size={16} /> Checklist Templates
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">Reusable checklists for department handoffs</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(!showForm); }}
          className="flex items-center gap-1.5 px-3 py-2 bg-[#F97316]/10 text-[#F97316] hover:bg-[#F97316]/20 rounded-lg text-xs font-semibold transition-colors min-h-[36px]"
        >
          {showForm ? <><X size={14} /> Cancel</> : <><Plus size={14} /> New Template</>}
        </button>
      </div>

      {showForm && (
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-4 space-y-3">
          <input
            value={formTitle}
            onChange={e => setFormTitle(e.target.value)}
            placeholder="Template title"
            className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-lg text-sm text-white placeholder-gray-500 min-h-[40px]"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <select
              value={formFrom}
              onChange={e => setFormFrom(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-lg text-sm text-gray-300 min-h-[40px]"
            >
              <option value="">From: Any Department</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <select
              value={formTo}
              onChange={e => setFormTo(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-lg text-sm text-gray-300 min-h-[40px]"
            >
              <option value="">To: Any Department</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs text-gray-400">Checklist Items</label>
            {formItems.map((item, idx) => (
              <div key={idx} className="flex gap-2">
                <input
                  value={item}
                  onChange={e => updateItem(idx, e.target.value)}
                  placeholder={`Item ${idx + 1}`}
                  className="flex-1 px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-lg text-sm text-white placeholder-gray-500 min-h-[36px]"
                />
                {formItems.length > 1 && (
                  <button onClick={() => removeItemField(idx)} className="p-2 text-red-400/50 hover:text-red-400">
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={addItemField}
              className="text-xs text-[#F97316] hover:underline"
            >
              + Add another item
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="px-4 py-2 bg-[#F97316] text-white rounded-lg text-xs font-semibold min-h-[40px] disabled:opacity-50"
            >
              {saving ? "Saving…" : editingId ? "Update Template" : "Create Template"}
            </button>
            <button
              onClick={() => { resetForm(); setShowForm(false); }}
              className="px-4 py-2 bg-[var(--bg-tertiary)] text-gray-400 rounded-lg text-xs min-h-[40px]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {Object.keys(grouped).length === 0 ? (
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-8 text-center">
          <FileText size={32} className="mx-auto text-gray-600 mb-3" />
          <p className="text-gray-400 text-sm">No templates yet</p>
          <p className="text-gray-500 text-xs mt-1">Create templates to speed up handoff checklists</p>
        </div>
      ) : (
        Object.entries(grouped).map(([key, temps]) => (
          <div key={key}>
            <div className="flex items-center gap-2 mb-2">
              <ArrowRightLeft size={12} className="text-gray-500" />
              <span className="text-xs font-semibold text-gray-400">{key}</span>
            </div>
            <div className="space-y-2">
              {temps.map(t => (
                <div key={t.id} className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white">{t.title}</span>
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(t)} className="p-1.5 text-gray-500 hover:text-white">
                        <Edit2 size={13} />
                      </button>
                      <button onClick={() => handleDelete(t.id)} className="p-1.5 text-red-400/50 hover:text-red-400">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                  <ul className="mt-1.5 space-y-0.5">
                    {t.items.map((item, i) => (
                      <li key={i} className="text-xs text-gray-500 flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-gray-600" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
