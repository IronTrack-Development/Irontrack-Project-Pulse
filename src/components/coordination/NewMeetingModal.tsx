"use client";

import { useEffect, useState } from "react";
import { X, CalendarDays, Loader2 } from "lucide-react";
import type { CoordinationMeetingType } from "@/types";
import { useTranslation } from "@/lib/i18n";

const { t } = useTranslation();

interface NewMeetingModalProps {
  projectId: string;
  onClose: () => void;
  onCreated: () => void;
}

export default function NewMeetingModal({ projectId, onClose, onCreated }: NewMeetingModalProps) {
  const [meetingTypes, setMeetingTypes] = useState<CoordinationMeetingType[]>([]);
  const [selectedType, setSelectedType] = useState<string>("Weekly Coordination");
  const [title, setTitle] = useState("Weekly Coordination Meeting");
  const [meetingDate, setMeetingDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [facilitator, setFacilitator] = useState("");
  const [location, setLocation] = useState("");
  const [autoPopulate, setAutoPopulate] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/projects/${projectId}/coordination/meeting-types`);
      if (res.ok) {
        const data = await res.json();
        setMeetingTypes(data.meeting_types || []);
      }
    })();
  }, [projectId]);

  const handleTypeChange = (typeName: string) => {
    setSelectedType(typeName);
    setTitle(`${typeName} Meeting`);
  };

  const handleSubmit = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/coordination`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meeting_type: selectedType,
          title: title.trim(),
          meeting_date: meetingDate,
          facilitator: facilitator.trim() || undefined,
          location: location.trim() || undefined,
          auto_populate_schedule: autoPopulate,
        }),
      });
      if (res.ok) onCreated();
    } catch (e) { /* silent */ }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-[#121217] border border-[#1F1F25] rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#1F1F25]">
          <div className="flex items-center gap-2">
            <CalendarDays size={18} className="text-[#F97316]" />
            <h3 className="text-[color:var(--text-primary)] font-semibold">{t('ui.new.meeting')}</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-[#1F1F25] text-[color:var(--text-secondary)] transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          {/* Meeting Type */}
          <div>
            <label className="block text-xs font-medium text-[color:var(--text-secondary)] mb-1.5">{t('ui.meeting.type')}</label>
            <div className="flex flex-wrap gap-2">
              {meetingTypes.map((mt) => (
                <button
                  key={mt.id}
                  onClick={() => handleTypeChange(mt.name)}
                  className="px-3 py-2 rounded-lg text-xs font-medium transition-colors min-h-[44px]"
                  style={{
                    background: selectedType === mt.name ? "#F97316" : "#1F1F25",
                    color: selectedType === mt.name ? "#fff" : "#9CA3AF",
                  }}
                >
                  {mt.name}
                  <span className="text-[10px] ml-1 opacity-60">({mt.default_duration_minutes}m)</span>
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-[color:var(--text-secondary)] mb-1.5">{t('ui.title')}</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-[#0B0B0D] border border-[#1F1F25] text-[color:var(--text-primary)] text-sm focus:border-[#F97316] focus:outline-none min-h-[44px]"
              placeholder={t('ui.meeting.title')}
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-medium text-[color:var(--text-secondary)] mb-1.5">{t('ui.date')}</label>
            <input
              type="date"
              value={meetingDate}
              onChange={(e) => setMeetingDate(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-[#0B0B0D] border border-[#1F1F25] text-[color:var(--text-primary)] text-sm focus:border-[#F97316] focus:outline-none min-h-[44px]"
            />
          </div>

          {/* Facilitator + Location */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[color:var(--text-secondary)] mb-1.5">{t('ui.facilitator')}</label>
              <input
                type="text"
                value={facilitator}
                onChange={(e) => setFacilitator(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-[#0B0B0D] border border-[#1F1F25] text-[color:var(--text-primary)] text-sm focus:border-[#F97316] focus:outline-none min-h-[44px]"
                placeholder={t('ui.optional')}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[color:var(--text-secondary)] mb-1.5">{t('ui.location')}</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-[#0B0B0D] border border-[#1F1F25] text-[color:var(--text-primary)] text-sm focus:border-[#F97316] focus:outline-none min-h-[44px]"
                placeholder={t('ui.optional')}
              />
            </div>
          </div>

          {/* Auto-populate toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-[#0B0B0D] border border-[#1F1F25]">
            <div>
              <p className="text-sm text-[color:var(--text-primary)] font-medium">{t('ui.auto.populate.from.schedule')}</p>
              <p className="text-xs text-[color:var(--text-muted)]">{t('ui.pull.week.1.activities.grouped.by.trade')}</p>
            </div>
            <button
              onClick={() => setAutoPopulate(!autoPopulate)}
              className={`relative w-11 h-6 rounded-full transition-colors ${autoPopulate ? "bg-[#F97316]" : "bg-[#1F1F25]"}`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${autoPopulate ? "left-[22px]" : "left-0.5"}`}
              />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 border-t border-[#1F1F25]">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-lg text-sm text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] transition-colors min-h-[44px]"
          >{t('action.cancel')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !title.trim()}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#F97316] hover:bg-[#ea6c10] disabled:opacity-50 text-[color:var(--text-primary)] rounded-lg text-sm font-semibold transition-colors min-h-[44px]"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}{t('ui.create.meeting')}
          </button>
        </div>
      </div>
    </div>
  );
}
