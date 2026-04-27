'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  Calendar,
  Building2,
  Layers,
  CheckSquare,
  Square,
  ChevronDown,
  ChevronUp,
  Download,
  Loader2,
  AlertTriangle,
  Clock,
  BarChart3,
  Flag,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';
import {
  ALL_TRADES,
  BUILDING_TYPE_DEFAULTS,
  BUILDING_TYPES,
  STRUCTURE_TYPES,
  BUILDING_TYPE_DEFAULT_STRUCTURE,
} from '@/lib/production-rates';
import { GeneratedSchedule, ScheduleActivity } from '@/lib/schedule-engine';
import { useTranslation } from "@/lib/i18n";

const { t } = useTranslation();

// ─── Types ────────────────────────────────────────────────────────────────────

interface ScheduleInput {
  projectName: string;
  buildingType: string;
  structureType: string;
  totalSF: number;
  stories: number;
  isGroundUp: boolean;
  selectedTrades: string[];
  quantities?: Record<string, number>;
  startDate: string;
}

// ─── Quantity groups for the overrides panel ──────────────────────────────────

interface QuantityItem { key: string; label: string; unit: string }
interface QuantityGroup { id: string; label: string; items: QuantityItem[] }

const QUANTITY_GROUPS: QuantityGroup[] = [
  {
    id: 'interior',
    label: t('ui.interior.finishes'),
    items: [
      { key: 'drywall_sf',       label: t('ui.drywall'),             unit: 'SF'   },
      { key: 'paint_sf',         label: t('ui.paint'),               unit: 'SF'   },
      { key: 'ceiling_grid_sf',  label: t('ui.ceiling.grid.act'),  unit: 'SF'   },
      { key: 'carpet_sf',        label: t('ui.carpet'),              unit: 'SF'   },
      { key: 'lvt_sf',           label: 'LVT',                 unit: 'SF'   },
      { key: 'tile_sf',          label: t('ui.ceramic.tile'),        unit: 'SF'   },
    ],
  },
  {
    id: 'mep',
    label: 'MEP',
    items: [
      { key: 'ductwork_lbs',           label: t('ui.ductwork'),          unit: 'lbs'  },
      { key: 'sprinkler_heads',        label: t('ui.sprinkler.heads'),   unit: 'each' },
      { key: 'plumbing_fixtures',      label: t('ui.plumbing.fixtures'), unit: 'each' },
      { key: 'electrical_panels_each', label: t('ui.electrical.panels'), unit: 'each' },
      { key: 'conduit_lf',             label: t('ui.conduit'),           unit: 'LF'   },
      { key: 'pipe_lf',                label: t('ui.pipe'),              unit: 'LF'   },
    ],
  },
  {
    id: 'envelope',
    label: t('ui.building.envelope'),
    items: [
      { key: 'doors_each',    label: t('ui.doors'),               unit: 'each' },
      { key: 'storefront_sf', label: t('ui.windows.storefront'), unit: 'SF'   },
      { key: 'roofing_sf',    label: t('ui.roofing'),             unit: 'SF'   },
    ],
  },
  {
    id: 'sitework',
    label: t('ui.sitework.utilities'),
    items: [
      { key: 'wet_water_lf',        label: t('ui.water.line'),         unit: 'LF' },
      { key: 'wet_sewer_lf',        label: t('ui.sewer.line'),         unit: 'LF' },
      { key: 'wet_storm_lf',        label: t('ui.storm.drain'),        unit: 'LF' },
      { key: 'dry_elec_conduit_lf', label: t('ui.electrical.conduit'), unit: 'LF' },
      { key: 'dry_telecom_lf',      label: t('ui.telecom'),            unit: 'LF' },
      { key: 'dry_gas_lf',          label: t('ui.gas.line'),           unit: 'LF' },
    ],
  },
  {
    id: 'other',
    label: t('ui.other'),
    items: [
      { key: 'elevator_cars', label: t('ui.elevator.cars'), unit: 'each' },
      { key: 'demo_sf',       label: t('ui.demolition'),    unit: 'SF'   },
    ],
  },
];

// ─── SF-based estimator (mirrors engine logic, for UI preview) ────────────────
function estimateQuantitiesForUI(totalSF: number, stories: number, isGroundUp: boolean): Record<string, number> {
  const footprintSF = totalSF / Math.max(stories, 1);
  const perimeterLF = Math.sqrt(footprintSF) * 4 * 0.85;
  const wallHeightFt = 14;
  const elevatorCars = totalSF < 40000 ? 1 : totalSF < 100000 ? 2 : 3;
  return {
    // Interior Finishes
    drywall_sf:      Math.round(totalSF * 2.5),
    paint_sf:        Math.round(totalSF * 3.0),
    ceiling_grid_sf: Math.round(totalSF * 0.85),
    carpet_sf:       Math.round(totalSF * 0.30),
    lvt_sf:          Math.round(totalSF * 0.20),
    tile_sf:         Math.round(totalSF * 0.10),
    // MEP
    ductwork_lbs:           Math.round(totalSF * 1.2),
    sprinkler_heads:        Math.ceil(totalSF / 120),
    plumbing_fixtures:      Math.max(4, Math.ceil(totalSF / 400)),
    electrical_panels_each: Math.max(2, stories * 2 + 2),
    conduit_lf:             Math.round(totalSF * 0.25),
    pipe_lf:                Math.round(totalSF * 0.15),
    // Building Envelope
    doors_each:    Math.max(4, Math.ceil(totalSF / 300)),
    storefront_sf: Math.round(perimeterLF * wallHeightFt * 0.25),
    roofing_sf:    Math.round(footprintSF * 1.05),
    // Sitework / Utilities
    wet_water_lf:        Math.round(200 + totalSF * 0.01),
    wet_sewer_lf:        Math.round(200 + totalSF * 0.01),
    wet_storm_lf:        Math.round(150 + totalSF * 0.008),
    dry_elec_conduit_lf: Math.round(200 + totalSF * 0.005),
    dry_telecom_lf:      Math.round(100 + totalSF * 0.003),
    dry_gas_lf:          Math.round(100 + totalSF * 0.002),
    // Other
    elevator_cars: elevatorCars,
    demo_sf:       isGroundUp ? 0 : Math.round(totalSF * 0.5),
  };
}

// ─── Phase colors ─────────────────────────────────────────────────────────────
const PHASE_COLORS: Record<string, string> = {
  'Phase 0': '#8B5CF6', // violet — procurement
  'Phase 1': '#6366F1',
  'Phase 2': '#22C55E',
  'Phase 3': '#EAB308',
  'Phase 4': '#3B82F6',
  'Phase 5': '#F97316',
  'Phase 6': '#14B8A6',
  'Phase 7': '#A855F7',
  'Phase 8': '#EC4899',
  'Phase 9': '#64748B',
};

function phaseColor(phase: string): string {
  for (const key of Object.keys(PHASE_COLORS)) {
    if (phase.startsWith(key)) return PHASE_COLORS[key];
  }
  return '#64748B';
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ScheduleGeneratorPage() {
  // Form state
  const [projectName, setProjectName] = useState('');
  const [buildingType, setBuildingType] = useState('Office Buildings');
  const [structureType, setStructureType] = useState(
    BUILDING_TYPE_DEFAULT_STRUCTURE['Office Buildings'] ?? STRUCTURE_TYPES[3]
  );
  const [totalSF, setTotalSF] = useState<string>('10000');
  const [stories, setStories] = useState<string>('1');
  const [isGroundUp, setIsGroundUp] = useState(false);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  });
  const [selectedTrades, setSelectedTrades] = useState<string[]>(
    BUILDING_TYPE_DEFAULTS['Office Buildings'] ?? []
  );
  const [showQuantities, setShowQuantities] = useState(false);
  const [quantityOverrides, setQuantityOverrides] = useState<Record<string, string>>({});
  // Track which quantity groups are expanded (all expanded by default)
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    () => Object.fromEntries(QUANTITY_GROUPS.map((g) => [g.id, true]))
  );

  // Results state
  const [schedule, setSchedule] = useState<GeneratedSchedule | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activePhaseFilter, setActivePhaseFilter] = useState<string | null>(null);
  const [showCriticalOnly, setShowCriticalOnly] = useState(false);

  // SF-based estimates for quantities panel
  const sfNum = parseInt(totalSF) || 0;
  const storiesNum = parseInt(stories) || 1;
  const estimates = useMemo(
    () => estimateQuantitiesForUI(sfNum, storiesNum, isGroundUp),
    [sfNum, storiesNum, isGroundUp]
  );

  // When building type changes, update default trades + auto-select structure type
  const handleBuildingTypeChange = (bt: string) => {
    setBuildingType(bt);
    setSelectedTrades(BUILDING_TYPE_DEFAULTS[bt] ?? []);
    const defaultStruct = BUILDING_TYPE_DEFAULT_STRUCTURE[bt];
    if (defaultStruct) setStructureType(defaultStruct);
  };

  // Toggle a single trade
  const toggleTrade = (trade: string) => {
    setSelectedTrades((prev) =>
      prev.includes(trade) ? prev.filter((t) => t !== trade) : [...prev, trade]
    );
  };

  // Toggle a quantity group expand/collapse
  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  // Submit
  const handleGenerate = useCallback(async () => {
    if (!projectName.trim()) {
      setError(t('ui.please.enter.a.project.name'));
      return;
    }
    if (!totalSF || parseInt(totalSF) <= 0) {
      setError(t('ui.please.enter.a.valid.square.footage'));
      return;
    }
    if (selectedTrades.length === 0) {
      setError(t('ui.please.select.at.least.one.trade'));
      return;
    }

    setLoading(true);
    setError(null);
    setSchedule(null);
    setActivePhaseFilter(null);
    setShowCriticalOnly(false);

    // Build quantities from overrides (only non-empty values)
    const quantities: Record<string, number> = {};
    Object.entries(quantityOverrides).forEach(([k, v]) => {
      const n = parseFloat(v);
      if (!isNaN(n) && n > 0) quantities[k] = n;
    });

    const input: ScheduleInput = {
      projectName: projectName.trim(),
      buildingType,
      structureType,
      totalSF: parseInt(totalSF),
      stories: parseInt(stories) || 1,
      isGroundUp,
      selectedTrades,
      quantities: Object.keys(quantities).length > 0 ? quantities : undefined,
      startDate,
    };

    try {
      const res = await fetch('/api/schedule-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: 'Server error' }));
        throw new Error(errData.error ?? `HTTP ${res.status}`);
      }

      const data: GeneratedSchedule = await res.json();
      setSchedule(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setLoading(false);
    }
  }, [projectName, buildingType, structureType, totalSF, stories, isGroundUp, startDate, selectedTrades, quantityOverrides]);

  // Export XLSX
  const handleExportXLSX = useCallback(async () => {
    if (!schedule) return;
    try {
      const { generateXLSX } = await import('@/lib/export-xlsx');
      const buf = generateXLSX(schedule);
      const blob = new Blob([buf as unknown as ArrayBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${schedule.projectName.replace(/\s+/g, '_')}_Schedule.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('XLSX export error:', err);
    }
  }, [schedule]);

  // Export MS Project XML
  const handleExportMSP = useCallback(async () => {
    if (!schedule) return;
    try {
      const { generateMSProjectXML } = await import('@/lib/export-msp-xml');
      const xml = generateMSProjectXML(schedule);
      const blob = new Blob([xml], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${schedule.projectName.replace(/\s+/g, '_')}_Schedule.xml`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('MSP XML export error:', err);
    }
  }, [schedule]);

  // Filtered activities for table
  const filteredActivities = useMemo<ScheduleActivity[]>(() => {
    if (!schedule) return [];
    let acts = schedule.activities;
    if (activePhaseFilter) acts = acts.filter((a) => a.phase === activePhaseFilter);
    if (showCriticalOnly) acts = acts.filter((a) => a.isCritical);
    return acts;
  }, [schedule, activePhaseFilter, showCriticalOnly]);

  // Project end for Gantt bar width calculation
  const totalWorkingDays = schedule?.summary.totalDuration ?? 1;

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-gray-100">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="border-b border-[var(--border-primary)] bg-[var(--bg-primary)] sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <Link
            href="/dashboard"
            className="text-[color:var(--text-muted)] hover:text-[color:var(--text-secondary)] transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-[#F97316]/10 border border-[#F97316]/20 flex items-center justify-center">
              <BarChart3 size={16} className="text-[#F97316]" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-100 leading-tight">{t('ui.schedule.simulator')}
              </h1>
              <p className="text-xs text-[color:var(--text-muted)]">{t('ui.generate.baseline.cpm.schedules.from.project.parameters')}
              </p>
            </div>
          </div>
          {schedule && (
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={handleExportXLSX}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] hover:border-[#F97316]/40 text-sm text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] transition-colors"
              >
                <Download size={14} />
                XLSX
              </button>
              <button
                onClick={handleExportMSP}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] hover:border-[#F97316]/40 text-sm text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] transition-colors"
              >
                <Download size={14} />{t('ui.ms.project.xml')}
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* ── Input Form ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: Project basics */}
          <div className="lg:col-span-1 space-y-5">
            <div className="bg-[#111115] border border-[var(--border-primary)] rounded-xl p-5 space-y-4">
              <h2 className="text-sm font-semibold text-[color:var(--text-secondary)] uppercase tracking-wider flex items-center gap-2">
                <Building2 size={14} className="text-[#F97316]" />{t('ui.project.details')}
              </h2>

              {/* Project Name */}
              <div className="space-y-1.5">
                <label className="text-xs text-[color:var(--text-secondary)] font-medium">{t('ui.project.name')}</label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder={t('ui.e.g.downtown.office.ti.suite.400')}
                  className="w-full bg-[#0B0B0D] border border-[#1F1F25] rounded-lg px-3 py-2.5 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-[#F97316]/50 transition-colors"
                />
              </div>

              {/* Building Type */}
              <div className="space-y-1.5">
                <label className="text-xs text-[color:var(--text-secondary)] font-medium">{t('ui.building.type')}</label>
                <select
                  value={buildingType}
                  onChange={(e) => handleBuildingTypeChange(e.target.value)}
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg px-3 py-2.5 text-sm text-gray-100 focus:outline-none focus:border-[#F97316]/50 transition-colors"
                >
                  {BUILDING_TYPES.map((bt) => (
                    <option key={bt} value={bt}>
                      {bt}
                    </option>
                  ))}
                </select>
              </div>

              {/* Structure Type */}
              <div className="space-y-1.5">
                <label className="text-xs text-[color:var(--text-secondary)] font-medium">{t('ui.structure.type')}</label>
                <select
                  value={structureType}
                  onChange={(e) => setStructureType(e.target.value)}
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg px-3 py-2.5 text-sm text-gray-100 focus:outline-none focus:border-[#F97316]/50 transition-colors"
                >
                  {STRUCTURE_TYPES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              {/* Total SF */}
              <div className="space-y-1.5">
                <label className="text-xs text-[color:var(--text-secondary)] font-medium">{t('ui.total.square.footage')}</label>
                <input
                  type="number"
                  value={totalSF}
                  onChange={(e) => setTotalSF(e.target.value)}
                  min={500}
                  step={500}
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg px-3 py-2.5 text-sm text-gray-100 focus:outline-none focus:border-[#F97316]/50 transition-colors"
                />
              </div>

              {/* Stories */}
              <div className="space-y-1.5">
                <label className="text-xs text-[color:var(--text-secondary)] font-medium">{t('ui.number.of.stories')}</label>
                <input
                  type="number"
                  value={stories}
                  onChange={(e) => setStories(e.target.value)}
                  min={1}
                  max={50}
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg px-3 py-2.5 text-sm text-gray-100 focus:outline-none focus:border-[#F97316]/50 transition-colors"
                />
              </div>

              {/* Ground-Up / TI Toggle */}
              <div className="space-y-1.5">
                <label className="text-xs text-[color:var(--text-secondary)] font-medium">{t('ui.project.type')}</label>
                <div className="flex rounded-lg overflow-hidden border border-[#1F1F25]">
                  <button
                    onClick={() => setIsGroundUp(false)}
                    className={`flex-1 py-2 text-sm font-medium transition-colors ${
                      !isGroundUp
                        ? 'bg-[#F97316] text-[color:var(--text-primary)]'
                        : 'bg-[var(--bg-primary)] text-[color:var(--text-secondary)] hover:text-[color:var(--text-secondary)]'
                    }`}
                  >{t('ui.tenant.improvement')}
                  </button>
                  <button
                    onClick={() => setIsGroundUp(true)}
                    className={`flex-1 py-2 text-sm font-medium transition-colors ${
                      isGroundUp
                        ? 'bg-[#F97316] text-[color:var(--text-primary)]'
                        : 'bg-[var(--bg-primary)] text-[color:var(--text-secondary)] hover:text-[color:var(--text-secondary)]'
                    }`}
                  >{t('ui.ground.up')}
                  </button>
                </div>
              </div>

              {/* Start Date */}
              <div className="space-y-1.5">
                <label className="text-xs text-[color:var(--text-secondary)] font-medium flex items-center gap-1.5">
                  <Calendar size={12} className="text-[#F97316]" />{t('ui.construction.start.date')}
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg px-3 py-2.5 text-sm text-gray-100 focus:outline-none focus:border-[#F97316]/50 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Middle + Right: Trades + Quantities */}
          <div className="lg:col-span-2 space-y-5">
            {/* Trade Selection */}
            <div className="bg-[#111115] border border-[var(--border-primary)] rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-[color:var(--text-secondary)] uppercase tracking-wider flex items-center gap-2">
                  <Layers size={14} className="text-[#F97316]" />{t('dispatch.scopeOfWork')}
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedTrades([...ALL_TRADES])}
                    className="text-xs text-[color:var(--text-muted)] hover:text-[color:var(--text-secondary)] transition-colors px-2 py-1 rounded hover:bg-[#1F1F25]"
                  >{t('ui.all.6a7208')}
                  </button>
                  <button
                    onClick={() => setSelectedTrades([])}
                    className="text-xs text-[color:var(--text-muted)] hover:text-[color:var(--text-secondary)] transition-colors px-2 py-1 rounded hover:bg-[#1F1F25]"
                  >{t('ui.none.6eef66')}
                  </button>
                  <button
                    onClick={() =>
                      setSelectedTrades(BUILDING_TYPE_DEFAULTS[buildingType] ?? [])
                    }
                    className="text-xs text-[#F97316] hover:text-orange-300 transition-colors px-2 py-1 rounded hover:bg-[#F97316]/10"
                  >{t('ui.reset.to.type')}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {ALL_TRADES.map((trade) => {
                  const checked = selectedTrades.includes(trade);
                  return (
                    <button
                      key={trade}
                      onClick={() => toggleTrade(trade)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm text-left transition-colors ${
                        checked
                          ? 'border-[#F97316]/40 bg-[#F97316]/10 text-gray-100'
                          : 'border-[var(--border-primary)] bg-[var(--bg-primary)] text-[color:var(--text-muted)] hover:text-[color:var(--text-secondary)] hover:border-[var(--border-secondary)]'
                      }`}
                    >
                      {checked ? (
                        <CheckSquare size={14} className="text-[#F97316] flex-shrink-0" />
                      ) : (
                        <Square size={14} className="flex-shrink-0" />
                      )}
                      <span className="truncate leading-tight">{trade}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Optional Quantities Override — grouped & collapsible */}
            <div className="bg-[#111115] border border-[var(--border-primary)] rounded-xl overflow-hidden">
              <button
                onClick={() => setShowQuantities((v) => !v)}
                className="w-full flex items-center justify-between p-5 hover:bg-[#151519] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-[color:var(--text-secondary)] uppercase tracking-wider">{t('ui.optional.override.quantities')}
                  </h2>
                  <span className="text-xs text-gray-600 font-normal normal-case">{t('ui.pre.filled.from.sf.estimates')}
                  </span>
                </div>
                {showQuantities ? (
                  <ChevronUp size={16} className="text-[color:var(--text-muted)]" />
                ) : (
                  <ChevronDown size={16} className="text-[color:var(--text-muted)]" />
                )}
              </button>

              {showQuantities && (
                <div className="border-t border-[#1F1F25]">
                  <p className="text-xs text-[color:var(--text-muted)] px-5 pt-4 pb-3">{t('ui.enter.actual.take.off.quantities.to.improve.accuracy.leave.blank')}
                  </p>

                  {QUANTITY_GROUPS.map((group) => {
                    const isOpen = expandedGroups[group.id] ?? true;
                    return (
                      <div key={group.id} className="border-t border-[#1A1A20]">
                        {/* Group header */}
                        <button
                          onClick={() => toggleGroup(group.id)}
                          className="w-full flex items-center justify-between px-5 py-3 hover:bg-[#151519] transition-colors"
                        >
                          <span className="text-xs font-semibold text-[color:var(--text-secondary)] uppercase tracking-wider">
                            {group.label}
                          </span>
                          {isOpen ? (
                            <ChevronUp size={13} className="text-gray-600" />
                          ) : (
                            <ChevronDown size={13} className="text-gray-600" />
                          )}
                        </button>

                        {/* Group items */}
                        {isOpen && (
                          <div className="px-5 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {group.items.map(({ key, label, unit }) => (
                              <div key={key} className="flex items-center gap-2">
                                <div className="flex-1 min-w-0">
                                  <label className="text-xs text-[color:var(--text-secondary)] truncate block mb-1">
                                    {label}
                                  </label>
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="number"
                                      value={quantityOverrides[key] ?? ''}
                                      onChange={(e) =>
                                        setQuantityOverrides((prev) => ({
                                          ...prev,
                                          [key]: e.target.value,
                                        }))
                                      }
                                      placeholder={String(estimates[key] ?? '')}
                                      className="flex-1 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded px-2 py-1.5 text-xs text-gray-100 placeholder-gray-700 focus:outline-none focus:border-[#F97316]/40"
                                    />
                                    <span className="text-xs text-gray-600 w-10 flex-shrink-0">
                                      {unit}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full py-4 rounded-xl bg-[#F97316] hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed text-[color:var(--text-primary)] font-semibold text-base transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />{t('ui.generating.schedule')}
                </>
              ) : (
                <>
                  <BarChart3 size={18} />{t('ui.generate.baseline.cpm.schedule')}
                </>
              )}
            </button>

            {error && (
              <div className="flex items-center gap-2 bg-red-900/20 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">
                <AlertTriangle size={16} className="flex-shrink-0" />
                {error}
              </div>
            )}
          </div>
        </div>

        {/* ── Results ──────────────────────────────────────────────────────── */}
        {schedule && (
          <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard
                label={t('ui.calendar.duration')}
                value={`${schedule.totalDuration} days`}
                sub={`~${Math.round(schedule.totalDuration / 30.5)} months`}
                color="text-[#F97316]"
                icon={<Clock size={16} />}
              />
              <StatCard
                label={t('ui.working.days')}
                value={schedule.summary.totalDuration}
                sub="5-day work week"
                color="text-blue-400"
                icon={<Calendar size={16} />}
              />
              <StatCard
                label={t('ui.total.activities')}
                value={schedule.summary.totalActivities}
                sub={`${schedule.criticalPath.length} on critical path`}
                color="text-purple-400"
                icon={<Layers size={16} />}
              />
              <StatCard
                label={t('ui.est.completion')}
                value={formatDate(schedule.endDate)}
                sub={`Start: ${formatDate(schedule.startDate)}`}
                color="text-green-400"
                icon={<Flag size={16} />}
              />
            </div>

            {/* Phase Summary Bar */}
            <div className="bg-[#111115] border border-[#1F1F25] rounded-xl p-5">
              <h3 className="text-sm font-semibold text-[color:var(--text-secondary)] mb-4">{t('ui.phase.breakdown')}</h3>
              <div className="space-y-2">
                {schedule.summary.phases.map((phase) => {
                  const pct = Math.round(
                    (phase.duration / schedule.summary.totalDuration) * 100
                  );
                  const color = phaseColor(phase.name);
                  return (
                    <button
                      key={phase.name}
                      onClick={() =>
                        setActivePhaseFilter(
                          activePhaseFilter === phase.name ? null : phase.name
                        )
                      }
                      className="w-full text-left"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="text-xs text-[color:var(--text-secondary)] w-48 truncate"
                          style={{ color }}
                        >
                          {phase.name.replace(/Phase \d+: /, '')}
                        </span>
                        <div className="flex-1 bg-[var(--bg-primary)] rounded-full h-3 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${Math.max(pct, 2)}%`, backgroundColor: color, opacity: activePhaseFilter === phase.name ? 1 : 0.7 }}
                          />
                        </div>
                        <span className="text-xs text-[color:var(--text-muted)] w-20 text-right">
                          {phase.duration}{t('ui.d.5635a7')}{pct}%)
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
              {activePhaseFilter && (
                <button
                  onClick={() => setActivePhaseFilter(null)}
                  className="mt-3 text-xs text-[#F97316] hover:text-orange-300 transition-colors"
                >{t('ui.show.all.phases')}
                </button>
              )}
            </div>

            {/* Activity Table + Gantt */}
            <div className="bg-[#111115] border border-[var(--border-primary)] rounded-xl overflow-hidden">
              {/* Table controls */}
              <div className="flex items-center justify-between p-4 border-b border-[var(--border-primary)]">
                <div className="flex items-center gap-3">
                  <h3 className="text-sm font-semibold text-[color:var(--text-secondary)]">{t('ui.activities.e58f7f')}
                    {activePhaseFilter && (
                      <span className="ml-2 text-xs text-[color:var(--text-muted)]">
                        — {activePhaseFilter.replace(/Phase \d+: /, '')}
                      </span>
                    )}
                  </h3>
                  <span className="text-xs text-gray-600">
                    {filteredActivities.length}{t('ui.activities.053a51')}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowCriticalOnly((v) => !v)}
                    className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${
                      showCriticalOnly
                        ? 'border-red-500/40 bg-red-500/10 text-red-400'
                        : 'border-[var(--border-primary)] text-[color:var(--text-muted)] hover:text-[color:var(--text-secondary)]'
                    }`}
                  >
                    <Flag size={11} />{t('ui.critical.only')}
                  </button>
                  <div className="flex gap-3 text-xs text-gray-600">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-sm bg-red-500/60 inline-block" />{t('ui.critical')}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-sm bg-[#F97316]/40 inline-block" />{t('ui.float.64435f')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-[var(--border-primary)] text-[color:var(--text-muted)]">
                      <th className="text-left px-3 py-2.5 font-medium w-10">#</th>
                      <th className="text-left px-3 py-2.5 font-medium">{t('ui.activity.81c0d9')}</th>
                      <th className="text-left px-3 py-2.5 font-medium w-28">{t('ui.trade')}</th>
                      <th className="text-right px-3 py-2.5 font-medium w-16">{t('ui.days.f6bb0f')}</th>
                      <th className="text-left px-3 py-2.5 font-medium w-24">{t('ui.start.952f37')}</th>
                      <th className="text-left px-3 py-2.5 font-medium w-24">{t('ui.finish.b74bde')}</th>
                      <th className="text-right px-3 py-2.5 font-medium w-16">{t('ui.float.64435f')}</th>
                      <th className="px-3 py-2.5 font-medium w-48">{t('ui.timeline')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredActivities.map((act) => {
                      const isCrit = act.isCritical ?? false;
                      const float = act.totalFloat ?? 0;

                      // Gantt bar: ES offset + duration
                      const esDay = workingDayOffset(schedule.startDate, act.earlyStart ?? schedule.startDate);
                      const barLeft = totalWorkingDays > 0 ? (esDay / totalWorkingDays) * 100 : 0;
                      const barWidth = totalWorkingDays > 0 ? (act.duration / totalWorkingDays) * 100 : 0;
                      const floatWidth = totalWorkingDays > 0 ? (float / totalWorkingDays) * 100 : 0;

                      return (
                        <tr
                          key={act.id}
                          className={`border-b border-[#1A1A20] transition-colors hover:bg-[#14141A] ${
                            isCrit ? 'bg-red-950/10' : ''
                          }`}
                        >
                          <td className="px-3 py-2 text-gray-600">{act.activityId}</td>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-1.5">
                              {isCrit && (
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                              )}
                              <span className={isCrit ? 'text-gray-100' : 'text-[color:var(--text-secondary)]'}>
                                {act.name}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <span
                              className="px-1.5 py-0.5 rounded text-[color:var(--text-secondary)] text-xs"
                              style={{
                                backgroundColor: `${phaseColor(act.phase)}20`,
                                color: phaseColor(act.phase),
                              }}
                            >
                              {act.trade}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-right text-[color:var(--text-secondary)]">{act.duration}</td>
                          <td className="px-3 py-2 text-[color:var(--text-secondary)]">{act.earlyStart ?? '—'}</td>
                          <td className="px-3 py-2 text-[color:var(--text-secondary)]">{act.earlyFinish ?? '—'}</td>
                          <td className={`px-3 py-2 text-right ${float === 0 ? 'text-red-400' : 'text-[color:var(--text-secondary)]'}`}>
                            {float}{t('ui.d')}
                          </td>
                          <td className="px-3 py-2">
                            {/* Mini Gantt bar */}
                            <div className="relative h-4 bg-[var(--bg-primary)] rounded overflow-hidden">
                              {/* Float bar (behind) */}
                              {floatWidth > 0 && (
                                <div
                                  className="absolute top-0 h-full rounded"
                                  style={{
                                    left: `${barLeft}%`,
                                    width: `${barWidth + floatWidth}%`,
                                    backgroundColor: '#F97316',
                                    opacity: 0.2,
                                  }}
                                />
                              )}
                              {/* Duration bar */}
                              <div
                                className="absolute top-0 h-full rounded"
                                style={{
                                  left: `${barLeft}%`,
                                  width: `${Math.max(barWidth, 1)}%`,
                                  backgroundColor: isCrit ? '#EF4444' : phaseColor(act.phase),
                                  opacity: 0.85,
                                }}
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Export buttons (bottom) */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleExportXLSX}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#111115] border border-[var(--border-primary)] hover:border-[#F97316]/40 text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] font-medium text-sm transition-colors"
              >
                <Download size={16} />{t('ui.download.xlsx.schedule')}
              </button>
              <button
                onClick={handleExportMSP}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#111115] border border-[var(--border-primary)] hover:border-[#F97316]/40 text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] font-medium text-sm transition-colors"
              >
                <Download size={16} />{t('ui.download.ms.project.xml')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  color,
  icon,
}: {
  label: string;
  value: string | number;
  sub: string;
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-[#111115] border border-[var(--border-primary)] rounded-xl p-4">
      <div className={`flex items-center gap-1.5 mb-2 ${color}`}>
        {icon}
        <span className="text-xs font-medium uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-2xl font-bold text-gray-100 mb-0.5">{value}</div>
      <div className="text-xs text-[color:var(--text-muted)]">{sub}</div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/** Approximate working-day offset from project start to a calendar date */
function workingDayOffset(startStr: string, targetStr: string): number {
  if (!targetStr || targetStr === startStr) return 0;
  const start = new Date(startStr + 'T00:00:00');
  const target = new Date(targetStr + 'T00:00:00');
  let days = 0;
  const cur = new Date(start);
  while (cur < target) {
    cur.setDate(cur.getDate() + 1);
    const dow = cur.getDay();
    if (dow !== 0 && dow !== 6) days++;
  }
  return days;
}
