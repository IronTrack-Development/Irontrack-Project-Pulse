"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { t } from "@/lib/i18n";

interface RFI {
  id: string;
  rfi_number: string;
  subject: string;
  status: string;
}

interface PunchItem {
  id: string;
  item_number: string;
  title: string;
  status: string;
}

interface Submittal {
  id: string;
  submittal_number: string;
  title: string;
  status: string;
}

type PinType = "rfi" | "punch" | "submittal" | "note" | "photo";

interface AddPinModalProps {
  projectId: string;
  sheetId: string;
  xPercent: number;
  yPercent: number;
  onSave: (pin: { pin_type: PinType; reference_id?: string; label?: string; notes?: string }) => void;
  onClose: () => void;
}

const PIN_TYPES: { value: PinType; label: string; color: string }[] = [
  { value: "rfi", label: "RFI", color: "#A855F7" },
  { value: "punch", label: t('ui.punch'), color: "#EF4444" },
  { value: "submittal", label: t('ui.submittal'), color: "#3B82F6" },
  { value: "note", label: t('ui.note'), color: "#EAB308" },
  { value: "photo", label: t('ui.photo'), color: "#22C55E" },
];

export default function AddPinModal({
  projectId,
  xPercent,
  yPercent,
  onSave,
  onClose,
}: AddPinModalProps) {
  const [pinType, setPinType] = useState<PinType>("note");
  const [notes, setNotes] = useState("");
  const [label, setLabel] = useState("");
  const [referenceId, setReferenceId] = useState("");
  const [rfis, setRfis] = useState<RFI[]>([]);
  const [punchItems, setPunchItems] = useState<PunchItem[]>([]);
  const [submittals, setSubmittals] = useState<Submittal[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load linkable items
    const load = async () => {
      const [rfiResp, punchResp, subResp] = await Promise.all([
        fetch(`/api/projects/${projectId}/rfis`),
        fetch(`/api/projects/${projectId}/punch-list`),
        fetch(`/api/projects/${projectId}/submittals`),
      ]);
      if (rfiResp.ok) {
        const d = await rfiResp.json();
        setRfis(d.rfis || []);
      }
      if (punchResp.ok) {
        const d = await punchResp.json();
        setPunchItems(d.items || []);
      }
      if (subResp.ok) {
        const d = await subResp.json();
        setSubmittals(d.submittals || []);
      }
    };
    load();
  }, [projectId]);

  const handleSave = async () => {
    setLoading(true);
    onSave({
      pin_type: pinType,
      reference_id: referenceId || undefined,
      label: label || undefined,
      notes: notes || undefined,
    });
  };

  const selectedType = PIN_TYPES.find((t) => t.value === pinType)!;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full sm:max-w-md bg-[var(--bg-secondary)] rounded-t-2xl sm:rounded-2xl border border-[var(--border-primary)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-[var(--border-primary)]">
          <div>
            <h2 className="text-[color:var(--text-primary)] font-semibold">{t('ui.add.pin')}</h2>
            <p className="text-xs text-[color:var(--text-muted)] mt-0.5">{t('ui.position')} {xPercent.toFixed(1)}%, {yPercent.toFixed(1)}%
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Pin type */}
          <div>
            <label className="text-xs text-[color:var(--text-secondary)] uppercase tracking-wider mb-2 block">{t('ui.pin.type')}</label>
            <div className="grid grid-cols-5 gap-2">
              {PIN_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => { setPinType(t.value); setReferenceId(""); }}
                  className={`flex flex-col items-center gap-1 py-2 rounded-lg border transition-all min-h-[60px] ${
                    pinType === t.value
                      ? "border-[#F97316] bg-[#F97316]/10"
                      : "border-[var(--border-primary)] bg-[var(--bg-primary)]"
                  }`}
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: t.color }}
                  />
                  <span className="text-xs text-[color:var(--text-secondary)]">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Label */}
          <div>
            <label className="text-xs text-[color:var(--text-secondary)] uppercase tracking-wider mb-1 block">{t('ui.label.optional')}</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={t('ui.short.label')}
              className="w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg px-3 py-2.5 text-[color:var(--text-primary)] placeholder-gray-600 text-sm min-h-[44px]"
            />
          </div>

          {/* Reference dropdown for RFI / Punch / Submittal */}
          {(pinType === "rfi" || pinType === "punch" || pinType === "submittal") && (
            <div>
              <label className="text-xs text-[color:var(--text-secondary)] uppercase tracking-wider mb-1 block">{t('ui.link.to')} {selectedType.label}
              </label>
              <select
                value={referenceId}
                onChange={(e) => setReferenceId(e.target.value)}
                className="w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg px-3 py-2.5 text-[color:var(--text-primary)] text-sm min-h-[44px]"
              >
                <option value="">{t('ui.none')}</option>
                {pinType === "rfi" &&
                  rfis.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.rfi_number}: {r.subject}
                    </option>
                  ))}
                {pinType === "punch" &&
                  punchItems.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.item_number}: {p.title}
                    </option>
                  ))}
                {pinType === "submittal" &&
                  submittals.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.submittal_number}: {s.title}
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="text-xs text-[color:var(--text-secondary)] uppercase tracking-wider mb-1 block">
              {pinType === "note" ? t('ui.note') : t('ui.additional.notes.optional')}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={pinType === "note" ? t('ui.enter.note.text') : t('ui.optional.notes')}
              rows={3}
              className="w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg px-3 py-2.5 text-[color:var(--text-primary)] placeholder-gray-600 text-sm resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-[var(--border-primary)] flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-[var(--bg-tertiary)] text-[color:var(--text-secondary)] rounded-xl font-medium text-sm min-h-[44px]"
          >{t('action.cancel')}
          </button>
          <button
            onClick={handleSave}
            disabled={loading || (pinType === "note" && !notes.trim())}
            className="flex-1 px-4 py-3 bg-[#F97316] hover:bg-[#ea6c10] disabled:opacity-50 text-[color:var(--text-primary)] rounded-xl font-semibold text-sm min-h-[44px] transition-colors"
            style={{ backgroundColor: selectedType.color }}
          >
            {loading ? t('ui.saving') : t('ui.add.pin')}
          </button>
        </div>
      </div>
    </div>
  );
}
