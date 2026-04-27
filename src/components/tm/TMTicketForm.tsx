"use client";

import { useState } from "react";
import {
  X, Plus, Trash2, Loader2, HardHat, Package, Truck,
} from "lucide-react";

interface Contact {
  id: string;
  name: string;
  company: string | null;
  role: string;
}

interface LaborRow {
  trade: string;
  workers: number;
  hours: number;
  rate: number;
  description: string;
}

interface MaterialRow {
  item: string;
  quantity: number;
  unit: string;
  unit_cost: number;
  receipt_photo_path: string | null;
}

interface EquipmentRow {
  equipment_type: string;
  hours: number;
  rate: number;
  description: string;
}

interface Props {
  projectId: string;
  contacts: Contact[];
  onCreated: () => void;
  onCancel: () => void;
}

function fmtCurrency(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });
}

const UNIT_OPTIONS = ["ea", "lf", "sf", "cy", "ton", "gal", "hr", "ls"];

const TRADE_OPTIONS = [
  "Carpenter", "Electrician", "Plumber", "Iron Worker", "Laborer",
  "Operator", "Painter", "Mason", "Drywaller", "Foreman", "Superintendent",
  "Project Manager", "Other",
];

export default function TMTicketForm({ projectId, contacts, onCreated, onCancel }: Props) {
  const today = new Date().toISOString().split("T")[0];

  const [description, setDescription] = useState("");
  const [date, setDate] = useState(today);
  const [subContactId, setSubContactId] = useState("");
  const [notes, setNotes] = useState("");

  const [laborRows, setLaborRows] = useState<LaborRow[]>([
    { trade: "", workers: 1, hours: 8, rate: 0, description: "" },
  ]);
  const [materialRows, setMaterialRows] = useState<MaterialRow[]>([]);
  const [equipmentRows, setEquipmentRows] = useState<EquipmentRow[]>([]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // --- Labor helpers ---
  const addLabor = () =>
    setLaborRows((r) => [...r, { trade: "", workers: 1, hours: 8, rate: 0, description: "" }]);
  const removeLabor = (i: number) => setLaborRows((r) => r.filter((_, idx) => idx !== i));
  const updateLabor = (i: number, field: keyof LaborRow, val: string | number) =>
    setLaborRows((r) => r.map((row, idx) => (idx === i ? { ...row, [field]: val } : row)));

  const laborTotal = laborRows.reduce((s, r) => s + r.workers * r.hours * r.rate, 0);

  // --- Material helpers ---
  const addMaterial = () =>
    setMaterialRows((r) => [
      ...r,
      { item: "", quantity: 1, unit: "ea", unit_cost: 0, receipt_photo_path: null },
    ]);
  const removeMaterial = (i: number) => setMaterialRows((r) => r.filter((_, idx) => idx !== i));
  const updateMaterial = (i: number, field: keyof MaterialRow, val: string | number | null) =>
    setMaterialRows((r) => r.map((row, idx) => (idx === i ? { ...row, [field]: val } : row)));

  const materialTotal = materialRows.reduce((s, r) => s + r.quantity * r.unit_cost, 0);

  // --- Equipment helpers ---
  const addEquipment = () =>
    setEquipmentRows((r) => [...r, { equipment_type: "", hours: 8, rate: 0, description: "" }]);
  const removeEquipment = (i: number) => setEquipmentRows((r) => r.filter((_, idx) => idx !== i));
  const updateEquipment = (i: number, field: keyof EquipmentRow, val: string | number) =>
    setEquipmentRows((r) => r.map((row, idx) => (idx === i ? { ...row, [field]: val } : row)));

  const equipmentTotal = equipmentRows.reduce((s, r) => s + r.hours * r.rate, 0);

  const grandTotal = laborTotal + materialTotal + equipmentTotal;

  const handleSave = async () => {
    if (!description.trim()) {
      setError("Description is required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/projects/${projectId}/tm-tickets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: description.trim(),
          date,
          sub_contact_id: subContactId || null,
          notes: notes.trim() || null,
          labor_items: laborRows.filter((r) => r.trade),
          material_items: materialRows.filter((r) => r.item),
          equipment_items: equipmentRows.filter((r) => r.equipment_type),
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Failed to save ticket.");
      } else {
        onCreated();
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full px-3 py-2.5 bg-[#0B0B0D] border border-[#1F1F25] rounded-xl text-[color:var(--text-primary)] text-sm placeholder-gray-600 focus:outline-none focus:border-[#F97316] transition-colors min-h-[44px]";
  const labelClass = "block text-xs font-medium text-[color:var(--text-secondary)] mb-1.5";
  const numInputClass =
    "w-full px-2.5 py-2 bg-[#0B0B0D] border border-[#1F1F25] rounded-lg text-[color:var(--text-primary)] text-sm text-right focus:outline-none focus:border-[#F97316] transition-colors min-h-[44px]";

  return (
    <div className="fixed inset-0 z-50 bg-black/80 overflow-y-auto">
      <div className="min-h-full flex items-start justify-center py-4 px-4">
        <div className="w-full max-w-2xl bg-[#121217] rounded-2xl border border-[#1F1F25] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-[#1F1F25]">
            <h2 className="text-[color:var(--text-primary)] font-bold text-base">New T&amp;M Ticket</h2>
            <button
              onClick={onCancel}
              className="p-2 text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-4 space-y-5">
            {/* Ticket info */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Sub / Contact</label>
                <select
                  value={subContactId}
                  onChange={(e) => setSubContactId(e.target.value)}
                  className={inputClass}
                >
                  <option value="">— None —</option>
                  {contacts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}{c.company ? ` (${c.company})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className={labelClass}>Description *</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Brief description of work performed..."
                className="w-full px-3 py-2.5 bg-[#0B0B0D] border border-[#1F1F25] rounded-xl text-[color:var(--text-primary)] text-sm placeholder-gray-600 focus:outline-none focus:border-[#F97316] transition-colors resize-none"
              />
            </div>

            {/* ── LABOR ── */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <HardHat size={16} className="text-[#F97316]" />
                <h3 className="text-[color:var(--text-primary)] font-semibold text-sm">Labor</h3>
                <div className="flex-1 h-px bg-[#1F1F25]" />
                <span className="text-xs text-[color:var(--text-secondary)]">{fmtCurrency(laborTotal)}</span>
              </div>

              {laborRows.map((row, i) => (
                <div key={i} className="mb-2 p-3 bg-[#0B0B0D] border border-[#1F1F25] rounded-xl">
                  <div className="grid grid-cols-12 gap-2 items-start">
                    {/* Trade */}
                    <div className="col-span-12 sm:col-span-4">
                      <label className="block text-[10px] text-[color:var(--text-muted)] mb-1">Trade</label>
                      <select
                        value={row.trade}
                        onChange={(e) => updateLabor(i, "trade", e.target.value)}
                        className={inputClass}
                      >
                        <option value="">Select...</option>
                        {TRADE_OPTIONS.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                    {/* Workers */}
                    <div className="col-span-4 sm:col-span-2">
                      <label className="block text-[10px] text-[color:var(--text-muted)] mb-1">Workers</label>
                      <input
                        type="number"
                        min={1}
                        value={row.workers}
                        onChange={(e) => updateLabor(i, "workers", Number(e.target.value))}
                        className={numInputClass}
                      />
                    </div>
                    {/* Hours */}
                    <div className="col-span-4 sm:col-span-2">
                      <label className="block text-[10px] text-[color:var(--text-muted)] mb-1">Hours</label>
                      <input
                        type="number"
                        min={0}
                        step={0.5}
                        value={row.hours}
                        onChange={(e) => updateLabor(i, "hours", Number(e.target.value))}
                        className={numInputClass}
                      />
                    </div>
                    {/* Rate */}
                    <div className="col-span-4 sm:col-span-3">
                      <label className="block text-[10px] text-[color:var(--text-muted)] mb-1">Rate/hr</label>
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={row.rate}
                        onChange={(e) => updateLabor(i, "rate", Number(e.target.value))}
                        className={numInputClass}
                      />
                    </div>
                    {/* Delete */}
                    <div className="col-span-12 sm:col-span-1 flex sm:flex-col items-center justify-between sm:justify-end">
                      <span className="text-xs text-[#F97316] font-semibold sm:mb-1">
                        {fmtCurrency(row.workers * row.hours * row.rate)}
                      </span>
                      {laborRows.length > 1 && (
                        <button
                          onClick={() => removeLabor(i)}
                          className="p-1.5 text-gray-600 hover:text-red-400 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              <button
                onClick={addLabor}
                className="flex items-center gap-1.5 px-3 py-2 text-xs text-[color:var(--text-secondary)] hover:text-[#F97316] border border-dashed border-[#1F1F25] hover:border-[#F97316]/50 rounded-xl transition-colors w-full justify-center min-h-[44px]"
              >
                <Plus size={13} />
                Add Labor
              </button>
            </div>

            {/* ── MATERIALS ── */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Package size={16} className="text-[#F97316]" />
                <h3 className="text-[color:var(--text-primary)] font-semibold text-sm">Materials</h3>
                <div className="flex-1 h-px bg-[#1F1F25]" />
                <span className="text-xs text-[color:var(--text-secondary)]">{fmtCurrency(materialTotal)}</span>
              </div>

              {materialRows.map((row, i) => (
                <div key={i} className="mb-2 p-3 bg-[#0B0B0D] border border-[#1F1F25] rounded-xl">
                  <div className="grid grid-cols-12 gap-2 items-start">
                    {/* Item */}
                    <div className="col-span-12 sm:col-span-5">
                      <label className="block text-[10px] text-[color:var(--text-muted)] mb-1">Item</label>
                      <input
                        type="text"
                        value={row.item}
                        onChange={(e) => updateMaterial(i, "item", e.target.value)}
                        placeholder="Material description"
                        className={inputClass}
                      />
                    </div>
                    {/* Qty */}
                    <div className="col-span-4 sm:col-span-2">
                      <label className="block text-[10px] text-[color:var(--text-muted)] mb-1">Qty</label>
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={row.quantity}
                        onChange={(e) => updateMaterial(i, "quantity", Number(e.target.value))}
                        className={numInputClass}
                      />
                    </div>
                    {/* Unit */}
                    <div className="col-span-4 sm:col-span-2">
                      <label className="block text-[10px] text-[color:var(--text-muted)] mb-1">Unit</label>
                      <select
                        value={row.unit}
                        onChange={(e) => updateMaterial(i, "unit", e.target.value)}
                        className={inputClass}
                      >
                        {UNIT_OPTIONS.map((u) => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </select>
                    </div>
                    {/* Unit cost */}
                    <div className="col-span-4 sm:col-span-2">
                      <label className="block text-[10px] text-[color:var(--text-muted)] mb-1">Unit Cost</label>
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={row.unit_cost}
                        onChange={(e) => updateMaterial(i, "unit_cost", Number(e.target.value))}
                        className={numInputClass}
                      />
                    </div>
                    {/* Total + delete */}
                    <div className="col-span-12 sm:col-span-1 flex sm:flex-col items-center justify-between sm:justify-end">
                      <span className="text-xs text-[#F97316] font-semibold sm:mb-1">
                        {fmtCurrency(row.quantity * row.unit_cost)}
                      </span>
                      <button
                        onClick={() => removeMaterial(i)}
                        className="p-1.5 text-gray-600 hover:text-red-400 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              <button
                onClick={addMaterial}
                className="flex items-center gap-1.5 px-3 py-2 text-xs text-[color:var(--text-secondary)] hover:text-[#F97316] border border-dashed border-[#1F1F25] hover:border-[#F97316]/50 rounded-xl transition-colors w-full justify-center min-h-[44px]"
              >
                <Plus size={13} />
                Add Material
              </button>
            </div>

            {/* ── EQUIPMENT ── */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Truck size={16} className="text-[#F97316]" />
                <h3 className="text-[color:var(--text-primary)] font-semibold text-sm">Equipment</h3>
                <div className="flex-1 h-px bg-[#1F1F25]" />
                <span className="text-xs text-[color:var(--text-secondary)]">{fmtCurrency(equipmentTotal)}</span>
              </div>

              {equipmentRows.map((row, i) => (
                <div key={i} className="mb-2 p-3 bg-[#0B0B0D] border border-[#1F1F25] rounded-xl">
                  <div className="grid grid-cols-12 gap-2 items-start">
                    {/* Type */}
                    <div className="col-span-12 sm:col-span-5">
                      <label className="block text-[10px] text-[color:var(--text-muted)] mb-1">Equipment Type</label>
                      <input
                        type="text"
                        value={row.equipment_type}
                        onChange={(e) => updateEquipment(i, "equipment_type", e.target.value)}
                        placeholder="e.g. Excavator, Forklift..."
                        className={inputClass}
                      />
                    </div>
                    {/* Hours */}
                    <div className="col-span-4 sm:col-span-2">
                      <label className="block text-[10px] text-[color:var(--text-muted)] mb-1">Hours</label>
                      <input
                        type="number"
                        min={0}
                        step={0.5}
                        value={row.hours}
                        onChange={(e) => updateEquipment(i, "hours", Number(e.target.value))}
                        className={numInputClass}
                      />
                    </div>
                    {/* Rate */}
                    <div className="col-span-4 sm:col-span-3">
                      <label className="block text-[10px] text-[color:var(--text-muted)] mb-1">Rate/hr</label>
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={row.rate}
                        onChange={(e) => updateEquipment(i, "rate", Number(e.target.value))}
                        className={numInputClass}
                      />
                    </div>
                    {/* Total + delete */}
                    <div className="col-span-4 sm:col-span-2 flex sm:flex-col items-center justify-between sm:justify-end">
                      <span className="text-xs text-[#F97316] font-semibold sm:mb-1">
                        {fmtCurrency(row.hours * row.rate)}
                      </span>
                      <button
                        onClick={() => removeEquipment(i)}
                        className="p-1.5 text-gray-600 hover:text-red-400 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              <button
                onClick={addEquipment}
                className="flex items-center gap-1.5 px-3 py-2 text-xs text-[color:var(--text-secondary)] hover:text-[#F97316] border border-dashed border-[#1F1F25] hover:border-[#F97316]/50 rounded-xl transition-colors w-full justify-center min-h-[44px]"
              >
                <Plus size={13} />
                Add Equipment
              </button>
            </div>

            {/* Notes */}
            <div>
              <label className={labelClass}>Notes (optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Any additional notes..."
                className="w-full px-3 py-2.5 bg-[#0B0B0D] border border-[#1F1F25] rounded-xl text-[color:var(--text-primary)] text-sm placeholder-gray-600 focus:outline-none focus:border-[#F97316] transition-colors resize-none"
              />
            </div>

            {/* Grand total */}
            <div className="flex items-center justify-between p-4 bg-[#0B0B0D] border border-[#1F1F25] rounded-xl">
              <span className="text-[color:var(--text-secondary)] font-medium text-sm">Grand Total</span>
              <span className="text-2xl font-bold text-[#F97316]">{fmtCurrency(grandTotal)}</span>
            </div>

            {error && (
              <p className="text-red-400 text-sm text-center">{error}</p>
            )}

            {/* Actions */}
            <div className="flex gap-2 pb-2">
              <button
                onClick={onCancel}
                className="flex-1 py-3 px-4 bg-[#1F1F25] hover:bg-[#2a2a35] text-[color:var(--text-secondary)] rounded-xl text-sm font-medium transition-colors min-h-[44px]"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-3 px-4 bg-[#F97316] hover:bg-[#ea6c10] disabled:opacity-50 text-[color:var(--text-primary)] rounded-xl text-sm font-bold transition-colors min-h-[44px] flex items-center justify-center gap-2"
              >
                {saving && <Loader2 size={15} className="animate-spin" />}
                {saving ? "Saving..." : "Save Ticket"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
