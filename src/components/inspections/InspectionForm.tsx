"use client";

import { useState } from "react";
import { ExternalLink, Phone, CheckCircle } from "lucide-react";

interface Jurisdiction {
  id: string;
  name: string;
  type: string;
  county: string;
  phone: string | null;
  portal_url: string | null;
  portal_provider: string | null;
  portal_verified: boolean;
}

interface InspectionCode {
  code: string;
  description: string;
  category: string;
  permit_type: string | null;
}

interface Props {
  projectId: string;
  jurisdiction: Jurisdiction;
  inspectionCodes?: InspectionCode[];
  onCreated: () => void;
}

const INSPECTION_CATEGORIES: { label: string; types: string[] }[] = [
  {
    label: "Site & Earthwork",
    types: [
      "Erosion Control/SWPPP",
      "Grading/Drainage",
      "Compaction/Soil Density",
      "Underground Utilities (Wet)",
      "Underground Utilities (Dry)",
      "Storm Drain",
      "Retention/Detention Basin",
      "Paving/Base Course",
      "Curb & Gutter",
      "Landscape/Irrigation",
    ],
  },
  {
    label: "Foundation & Concrete",
    types: [
      "Footing/Foundation",
      "Stem Wall",
      "Slab Pre-Pour",
      "Post-Tension Pre-Pour",
      "Post-Tension Stressing",
      "Tilt-Up Panel Pre-Pour",
      "Tilt-Up Panel Erection",
      "Grade Beam",
      "Pier/Caisson",
      "Retaining Wall",
      "Concrete Masonry (CMU)",
      "Masonry/Grout/Rebar",
    ],
  },
  {
    label: "Structural",
    types: [
      "Rough Framing",
      "Structural Steel",
      "Steel Connection/Welding",
      "Structural Bolting/Torque",
      "Wood Truss",
      "Glulam/LVL",
      "Shearwall/Hold-Down",
      "Special Inspection — Concrete",
      "Special Inspection — Steel",
      "Special Inspection — Masonry",
      "Special Inspection — Soil",
      "Special Inspection — Spray Fireproofing",
    ],
  },
  {
    label: "Mechanical / HVAC",
    types: [
      "Rough Mechanical/HVAC",
      "HVAC Ductwork",
      "Mechanical Equipment Set",
      "Kitchen Hood/Exhaust",
      "Refrigeration",
      "Boiler",
      "Final Mechanical",
    ],
  },
  {
    label: "Electrical",
    types: [
      "Temporary Power",
      "Underground Electrical/Conduit",
      "Rough Electrical",
      "Service/Panel",
      "Low Voltage/Data/Telecom",
      "Emergency Generator",
      "Transformer",
      "Lighting/Photometric",
      "Final Electrical",
    ],
  },
  {
    label: "Plumbing",
    types: [
      "Underground Plumbing",
      "Rough Plumbing",
      "Water Line/Backflow",
      "Sewer/Sanitary",
      "Gas Line/Pressure Test",
      "Grease Trap/Interceptor",
      "Medical Gas",
      "Final Plumbing",
    ],
  },
  {
    label: "Fire & Life Safety",
    types: [
      "Fire Sprinkler — Underground",
      "Fire Sprinkler — Rough",
      "Fire Sprinkler — Final/Flow Test",
      "Fire Alarm — Rough",
      "Fire Alarm — Final/Acceptance Test",
      "Fire Damper/Smoke Damper",
      "Fire-Rated Assembly",
      "Fire Caulking/Firestopping",
      "Fire Pump",
      "Smoke Control/Pressurization",
      "Emergency Lighting/Exit Signs",
      "Fire Lane/Access",
      "Hood Suppression System",
    ],
  },
  {
    label: "Building Envelope",
    types: [
      "Insulation",
      "Vapor Barrier",
      "Air Barrier",
      "Waterproofing/Below-Grade",
      "Roofing",
      "Roof Deck/Sheathing",
      "Drywall/Lath",
      "Stucco/Exterior",
      "Window/Storefront/Curtainwall",
      "Exterior Cladding/Siding",
      "Sealant/Caulking",
    ],
  },
  {
    label: "Accessibility & Code",
    types: [
      "ADA Compliance",
      "ADA — Parking/Ramps",
      "ADA — Restrooms",
      "ADA — Signage/Wayfinding",
      "Energy Compliance (IECC/ASHRAE)",
      "Sound/Acoustical",
    ],
  },
  {
    label: "Vertical Transport",
    types: [
      "Elevator",
      "Escalator",
      "Conveyor System",
    ],
  },
  {
    label: "Specialty",
    types: [
      "Swimming Pool/Spa",
      "Fuel Storage Tank",
      "Pre-Manufactured Structure",
      "Photovoltaic/Solar",
      "EV Charging Infrastructure",
      "Data Center/Server Room",
      "Clean Room",
      "Radiation Shielding",
      "Walk-In Cooler/Freezer",
    ],
  },
  {
    label: "Final / Close-Out",
    types: [
      "Final Building",
      "Certificate of Occupancy (TCO)",
      "Certificate of Occupancy (CO)",
      "Final Site/Landscaping",
      "T.I. Final (Tenant Improvement)",
      "Re-Inspection",
      "Permit Extension",
    ],
  },
];

const TIME_WINDOWS = [
  { value: "Anytime", label: "Anytime" },
  { value: "AM", label: "AM (7-12)" },
  { value: "PM", label: "PM (12-5)" },
];

function getNextBusinessDay(): string {
  // Calculate next business day in Arizona time
  const now = new Date();
  const azFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Phoenix",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const todayStr = azFormatter.format(now);
  const d = new Date(todayStr + "T12:00:00");
  
  // Move to next day
  d.setDate(d.getDate() + 1);
  // Skip weekends
  const day = d.getDay();
  if (day === 0) d.setDate(d.getDate() + 1); // Sunday → Monday
  if (day === 6) d.setDate(d.getDate() + 2); // Saturday → Monday
  
  return d.toISOString().split("T")[0];
}

export default function InspectionForm({ projectId, jurisdiction, inspectionCodes = [], onCreated }: Props) {
  const [inspectionType, setInspectionType] = useState("");
  const [permitNumber, setPermitNumber] = useState("");
  const [requestedDate, setRequestedDate] = useState(getNextBusinessDay());
  const [contactName, setContactName] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("irontrack_inspection_contact_name") || "";
    }
    return "";
  });
  const [contactPhone, setContactPhone] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("irontrack_inspection_contact_phone") || "";
    }
    return "";
  });
  const [timeWindow, setTimeWindow] = useState("Anytime");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [banner, setBanner] = useState<{ type: "portal" | "call"; message: string; url?: string; phone?: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inspectionType) return;

    // Remember contact info
    if (typeof window !== "undefined") {
      if (contactName) localStorage.setItem("irontrack_inspection_contact_name", contactName);
      if (contactPhone) localStorage.setItem("irontrack_inspection_contact_phone", contactPhone);
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/inspections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inspection_type: inspectionType,
          permit_number: permitNumber,
          requested_date: requestedDate,
          contact_name: contactName,
          contact_phone: contactPhone,
          time_window: timeWindow,
          notes,
          portal_url_used: jurisdiction.portal_url || null,
        }),
      });

      if (res.ok) {
        if (jurisdiction.portal_url) {
          setBanner({
            type: "portal",
            message: `✓ Request logged — ${jurisdiction.name} uses ${jurisdiction.portal_provider || "online portal"}. Sign in to complete scheduling.`,
            url: jurisdiction.portal_url,
          });
        } else {
          setBanner({
            type: "call",
            message: `✓ Request logged — Call ${jurisdiction.name} at ${jurisdiction.phone || "their office"} to schedule.`,
            phone: jurisdiction.phone || undefined,
          });
        }

        // Reset form
        setInspectionType("");
        setPermitNumber("");
        setRequestedDate(getNextBusinessDay());
        setNotes("");
        onCreated();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* Banner */}
      {banner && (
        <div
          className={`mb-6 p-4 rounded-xl flex items-start gap-3 ${
            banner.type === "portal"
              ? "bg-green-500/10 border border-green-500/30"
              : "bg-blue-500/10 border border-blue-500/30"
          }`}
        >
          <CheckCircle size={18} className={banner.type === "portal" ? "text-green-400 shrink-0 mt-0.5" : "text-blue-400 shrink-0 mt-0.5"} />
          <div className="flex-1 min-w-0">
            <p className={`text-sm ${banner.type === "portal" ? "text-green-300" : "text-blue-300"}`}>
              {banner.message}
            </p>
            <div className="mt-2 flex gap-2 flex-wrap">
              {banner.url && (
                <a
                  href={banner.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-green-500/20 text-green-300 rounded-lg text-xs font-medium hover:bg-green-500/30 transition-colors min-h-[44px]"
                >
                  Open Portal <ExternalLink size={12} />
                </a>
              )}
              {banner.phone && (
                <a
                  href={`tel:${banner.phone}`}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-500/20 text-blue-300 rounded-lg text-xs font-medium hover:bg-blue-500/30 transition-colors min-h-[44px]"
                >
                  Call Now <Phone size={12} />
                </a>
              )}
            </div>
          </div>
          <button
            onClick={() => setBanner(null)}
            className="text-gray-500 hover:text-white text-xs shrink-0"
          >
            ✕
          </button>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Inspection Type */}
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-400 mb-1">
              Inspection Type <span className="text-red-400">*</span>
            </label>
            <select
              value={inspectionType}
              onChange={(e) => setInspectionType(e.target.value)}
              className="w-full px-3 py-3 bg-[#121217] border border-[#1F1F25] rounded-xl text-white text-sm focus:outline-none focus:border-[#F97316] min-h-[44px] appearance-none"
            >
              <option value="">Select inspection type...</option>
              {inspectionCodes.length > 0 ? (
                // Database-driven jurisdiction-specific codes
                (() => {
                  const categories = [...new Set(inspectionCodes.map(c => c.category))];
                  return categories.map(cat => (
                    <optgroup key={cat} label={cat}>
                      {inspectionCodes
                        .filter(c => c.category === cat)
                        .map(c => (
                          <option key={c.code} value={`${c.code} — ${c.description}`}>
                            {c.code} — {c.description}
                          </option>
                        ))}
                    </optgroup>
                  ));
                })()
              ) : (
                // Fallback to generic categories
                INSPECTION_CATEGORIES.map((cat) => (
                  <optgroup key={cat.label} label={cat.label}>
                    {cat.types.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </optgroup>
                ))
              )}
            </select>
          </div>

          {/* Permit Number */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Permit #</label>
            <input
              type="text"
              value={permitNumber}
              onChange={(e) => setPermitNumber(e.target.value)}
              placeholder="Enter permit number"
              className="w-full px-3 py-3 bg-[#121217] border border-[#1F1F25] rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#F97316] min-h-[44px]"
            />
          </div>

          {/* Requested Date */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Requested Date</label>
            <input
              type="date"
              value={requestedDate}
              onChange={(e) => setRequestedDate(e.target.value)}
              className="w-full px-3 py-3 bg-[#121217] border border-[#1F1F25] rounded-xl text-white text-sm focus:outline-none focus:border-[#F97316] min-h-[44px]"
            />
          </div>

          {/* Contact Name */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Contact Name</label>
            <input
              type="text"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="Your name"
              className="w-full px-3 py-3 bg-[#121217] border border-[#1F1F25] rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#F97316] min-h-[44px]"
            />
          </div>

          {/* Contact Phone */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Contact Phone</label>
            <input
              type="tel"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="Your phone number"
              className="w-full px-3 py-3 bg-[#121217] border border-[#1F1F25] rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#F97316] min-h-[44px]"
            />
          </div>

          {/* Time Window */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Time Window</label>
            <div className="flex gap-2">
              {TIME_WINDOWS.map((tw) => (
                <button
                  key={tw.value}
                  type="button"
                  onClick={() => setTimeWindow(tw.value)}
                  className={`flex-1 px-3 py-3 rounded-xl text-sm font-medium transition-colors min-h-[44px] ${
                    timeWindow === tw.value
                      ? "bg-[#F97316] text-white"
                      : "bg-[#121217] border border-[#1F1F25] text-gray-400 hover:text-white"
                  }`}
                >
                  {tw.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-400 mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes for this inspection..."
              rows={3}
              className="w-full px-3 py-3 bg-[#121217] border border-[#1F1F25] rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#F97316] resize-none"
            />
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={!inspectionType || submitting}
          className="w-full px-6 py-4 bg-[#F97316] text-white rounded-xl text-sm font-bold hover:bg-[#ea6c10] transition-colors disabled:opacity-40 disabled:cursor-not-allowed min-h-[52px]"
        >
          {submitting ? "Scheduling..." : "Schedule Inspection"}
        </button>
      </form>
    </div>
  );
}
