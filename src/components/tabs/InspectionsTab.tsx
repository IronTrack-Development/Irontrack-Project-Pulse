"use client";

import { useState, useEffect, useCallback } from "react";
import { Lock, Phone, ExternalLink, RefreshCw } from "lucide-react";
import JurisdictionSelector from "@/components/inspections/JurisdictionSelector";
import InspectionForm from "@/components/inspections/InspectionForm";
import InspectionHistory from "@/components/inspections/InspectionHistory";
import { t } from "@/lib/i18n";

interface Jurisdiction {
  id: string;
  name: string;
  type: string;
  county: string;
  phone: string | null;
  portal_url: string | null;
  portal_provider: string | null;
  portal_verified: boolean;
  lat: number;
  lon: number;
}

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

interface InspectionCode {
  code: string;
  description: string;
  category: string;
  permit_type: string | null;
}

interface Props {
  projectId: string;
}

export default function InspectionsTab({ projectId }: Props) {
  const [jurisdiction, setJurisdiction] = useState<Jurisdiction | null>(null);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [inspectionCodes, setInspectionCodes] = useState<InspectionCode[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/inspections`);
      if (res.ok) {
        const data = await res.json();
        setJurisdiction(data.jurisdiction);
        setInspections(data.inspections || []);
        setInspectionCodes(data.inspectionCodes || []);
      }
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw size={24} className="text-[#F97316] animate-spin" />
      </div>
    );
  }

  // State 1: No jurisdiction set
  if (!jurisdiction) {
    return (
      <JurisdictionSelector
        projectId={projectId}
        onLocked={(j) => {
          setJurisdiction(j);
        }}
      />
    );
  }

  // State 2: Jurisdiction locked
  return (
    <div className="space-y-6">
      {/* Locked jurisdiction header */}
      <div className="flex items-center justify-between bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <Lock size={16} className="text-[#F97316] shrink-0" />
          <div className="min-w-0">
            <span className="text-sm font-medium text-[color:var(--text-primary)]">{jurisdiction.name}</span>
            {jurisdiction.phone && (
              <span className="text-sm text-[color:var(--text-secondary)] ml-2">· {jurisdiction.phone}</span>
            )}
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          {jurisdiction.portal_url && (
            <a
              href={jurisdiction.portal_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-[var(--bg-tertiary)] text-[color:var(--text-secondary)] rounded-lg text-xs font-medium hover:bg-[var(--bg-hover)] transition-colors min-h-[36px]"
            >{t('ui.portal')} <ExternalLink size={12} />
            </a>
          )}
          {jurisdiction.phone && (
            <a
              href={`tel:${jurisdiction.phone}`}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-[var(--bg-tertiary)] text-[color:var(--text-secondary)] rounded-lg text-xs font-medium hover:bg-[var(--bg-hover)] transition-colors min-h-[36px]"
            >
              <Phone size={12} />{t('ui.call')}
            </a>
          )}
        </div>
      </div>

      {/* Inspection scheduling form */}
      <InspectionForm
        projectId={projectId}
        jurisdiction={jurisdiction}
        inspectionCodes={inspectionCodes}
        onCreated={fetchData}
      />

      {/* History */}
      <InspectionHistory
        inspections={inspections}
        jurisdiction={jurisdiction}
        projectId={projectId}
        onStatusChange={fetchData}
      />
    </div>
  );
}
