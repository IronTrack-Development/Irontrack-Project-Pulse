/**
 * IronTrack Schedule Simulator — CPM Engine
 * Generates baseline CPM construction schedules from project parameters.
 *
 * Accuracy target: 85–90% of real-world durations for standard commercial types.
 */

import { PRODUCTION_RATES, ProductionRate } from './production-rates';

// ─── Public Interfaces ────────────────────────────────────────────────────────

export interface ScheduleInput {
  projectName: string;
  buildingType: string;
  structureType?: string; // one of STRUCTURE_TYPES; defaults to Structural Steel Frame
  totalSF: number;
  stories: number;
  isGroundUp: boolean;
  selectedTrades: string[];
  quantities?: Record<string, number>; // user overrides keyed by quantity name
  startDate: string; // YYYY-MM-DD
}

export interface ScheduleActivity {
  id: number;
  activityId: string;   // e.g. "1010"
  name: string;
  trade: string;
  phase: string;
  duration: number;     // working days
  predecessors: number[]; // IDs of predecessor activities
  earlyStart?: string;
  earlyFinish?: string;
  lateStart?: string;
  lateFinish?: string;
  totalFloat?: number;
  isCritical?: boolean;
}

export interface GeneratedSchedule {
  projectName: string;
  totalDuration: number;  // calendar days
  startDate: string;
  endDate: string;
  activities: ScheduleActivity[];
  criticalPath: number[];
  summary: {
    totalActivities: number;
    totalDuration: number;  // working days
    phases: { name: string; duration: number }[];
    tradeBreakdown: { trade: string; activities: number; days: number }[];
  };
}

// ─── Internal Template Types ──────────────────────────────────────────────────

interface ActivityTemplate {
  activityId: string;
  name: string;
  trade: string;
  phase: string;
  /** Which quantity key to use for duration calculation */
  quantityKey: string;
  /** Production rate trade + task fragment for lookup */
  rateRef: { trade: string; task: string };
  /** Predecessor activityIds (may reference activities from other trades) */
  predecessorIds: string[];
  /** Fallback predecessorIds if preferred ones don't exist in filtered set */
  fallbackPredecessorIds: string[];
  /** Only include for ground-up projects */
  groundUpOnly?: boolean;
  /** Only include when specific trade is selected */
  requiresTrades?: string[];
  /** Minimum duration in days regardless of calculation */
  minDays?: number;
  /** Maximum duration in days regardless of calculation */
  maxDays?: number;
  /** Fixed duration override (skip quantity calc) */
  fixedDays?: number;
  /** Dynamic duration formula (overrides fixedDays if provided) */
  scaledFixed?: (totalSF: number, stories: number) => number;
}

// ─── Quantity Estimators ──────────────────────────────────────────────────────

/**
 * Estimates all quantities from total SF + stories + isGroundUp.
 * User-provided overrides take precedence.
 */
function estimateQuantities(
  totalSF: number,
  stories: number,
  isGroundUp: boolean
): Record<string, number> {
  const footprintSF = totalSF / Math.max(stories, 1);
  const perimeterLF = Math.sqrt(footprintSF) * 4 * 0.85;
  const wallHeightFt = 14;

  // Elevator car count
  const elevatorCars = totalSF < 40000 ? 1 : totalSF < 100000 ? 2 : 3;

  return {
    // Site / Civil
    mass_grading_cy: footprintSF * 0.25,
    fine_grading_sf: footprintSF * 2.2,
    asphalt_tons: footprintSF * 0.04,
    wet_utilities_lf: perimeterLF * 0.8,
    storm_drain_lf: perimeterLF * 0.5,
    dry_utilities_lf: perimeterLF * 1.2,

    // Wet Utilities (site mains)
    wet_water_lf: Math.round(200 + totalSF * 0.01),
    wet_sewer_lf: Math.round(200 + totalSF * 0.01),
    wet_storm_lf: Math.round(150 + totalSF * 0.008),

    // Dry Utilities (underground)
    dry_elec_conduit_lf: Math.round(200 + totalSF * 0.005),
    dry_telecom_lf: Math.round(100 + totalSF * 0.003),
    dry_gas_lf: Math.round(100 + totalSF * 0.002),

    // Sitework / Paving
    sitework_asphalt_tons: Math.round(footprintSF * 0.04),
    sitework_sidewalk_sf: Math.round(perimeterLF * 8),
    sitework_striping_sf: Math.round(footprintSF * 1.8),
    sitework_curb_lf: Math.round(perimeterLF * 1.1),

    // Demolition
    demo_sf: isGroundUp ? 0 : Math.round(totalSF * 0.5),

    // Concrete
    footings_lf: Math.round(perimeterLF + (footprintSF / 400) * 20),
    slab_prep_sf: Math.round(footprintSF),
    slab_pour_sf: Math.round(footprintSF),
    underslab_plumbing_lf: isGroundUp ? Math.round(footprintSF * 0.04) : 0,

    // Waterproofing
    waterproofing_bg_sf: isGroundUp ? Math.round(perimeterLF * wallHeightFt * 0.5) : 0,
    waterproofing_ag_sf: Math.round(footprintSF * 1.05),

    // Masonry
    cmu_blocks: isGroundUp
      ? Math.round(perimeterLF * wallHeightFt * 1.125 * 0.4)
      : 0,

    // Structural Steel
    steel_tons: Math.round(totalSF * 0.008),
    decking_sf: Math.round(footprintSF * stories),
    joists_each: Math.round(footprintSF / 80),

    // Framing
    framing_sf: Math.round(totalSF * 1.8),
    blocking_lf: Math.round(totalSF * 0.05),

    // Insulation
    insulation_batt_sf: Math.round(totalSF * 1.5),
    insulation_rigid_sf: Math.round(footprintSF * 1.1),
    insulation_spray_sf: Math.round(totalSF * 0.25),

    // Drywall
    drywall_hang_sf: Math.round(totalSF * 2.5),
    drywall_finish_sf: Math.round(totalSF * 2.5),
    drywall_sf: Math.round(totalSF * 2.5),
    paint_sf: Math.round(totalSF * 3.0),
    grid_ceiling_sf: Math.round(totalSF * 0.70),
    ceiling_tile_sf: Math.round(totalSF * 0.70),
    ceiling_grid_sf: Math.round(totalSF * 0.85),

    // Fire Sprinkler
    sprinkler_pipe_lf: Math.round(totalSF * 0.15),
    sprinkler_heads: Math.ceil(totalSF / 120),

    // HVAC
    ductwork_lbs: Math.round(totalSF * 1.2),
    vav_units: Math.max(1, Math.ceil(totalSF / 1500)),
    diffusers: Math.ceil(totalSF / 150),
    hydronic_lf: Math.round(totalSF * 0.05),

    // Fire Alarm
    fire_alarm_devices: Math.ceil(totalSF / 200),
    fire_alarm_wire_lf: Math.round(totalSF * 0.2),

    // Low Voltage / Data
    lv_cable_lf: Math.round(totalSF * 0.3),
    lv_devices: Math.ceil(totalSF / 200),
    lv_test_sf: Math.round(totalSF),

    // Plumbing
    plumbing_rough_sf: Math.round(totalSF),
    plumbing_fixtures: Math.max(4, Math.ceil(totalSF / 400)),
    pipe_lf: Math.round(totalSF * 0.15),

    // Electrical
    conduit_lf: Math.round(totalSF * 0.25),
    branch_wiring_sf: Math.round(totalSF),
    devices_each: Math.ceil(totalSF / 200),
    panels_each: Math.max(1, Math.ceil(totalSF / 10000)),
    electrical_panels_each: Math.max(2, stories * 2 + 2),

    // Conveying / Elevator
    elevator_cars: elevatorCars,
    elevator_shaft_prep_days: Math.max(3, elevatorCars * 4),
    elevator_install_days: Math.max(15, elevatorCars * 20),
    elevator_test_days: Math.max(3, elevatorCars * 4),

    // Glazing
    storefront_sf: Math.round(perimeterLF * wallHeightFt * 0.25),
    windows_sf: Math.round(totalSF * 0.15),
    curtainwall_sf: 0,
    door_openings: Math.max(4, Math.ceil(totalSF / 300)),
    doors_each: Math.max(4, Math.ceil(totalSF / 300)),

    // Exterior
    stucco_sf: Math.round(perimeterLF * wallHeightFt * stories * 0.60),
    eifs_sf: 0,
    siding_sf: 0,

    // Roofing
    roofing_sf: Math.round(footprintSF * 1.05),

    // Interior Finishes
    interior_paint_sf: Math.round(totalSF * 2.5),
    flooring_sf: Math.round(totalSF * 0.88),
    carpet_sf: Math.round(totalSF * 0.30),
    lvt_sf: Math.round(totalSF * 0.20),
    tile_sf: Math.round(totalSF * 0.10),

    // Specialties (Division 10)
    specialty_rooms: Math.max(2, Math.ceil(totalSF / 3000)),
    specialty_stalls: Math.max(2, Math.ceil(totalSF / 5000)),
    specialty_signs: Math.max(5, Math.ceil(totalSF / 500)),

    // Landscaping
    landscaping_sf: Math.round(footprintSF * 1.5),
    irrigation_lf: Math.round(perimeterLF * 1.8),

    // Closeout
    punchlist_items: Math.max(50, Math.ceil(totalSF / 80)),
    cleaning_sf: Math.round(totalSF),

    // Doors & Hardware
    hm_doors: Math.ceil(door_openings_calc(totalSF) * 0.70),
    wood_doors: Math.ceil(door_openings_calc(totalSF) * 0.30),
    hardware_openings: door_openings_calc(totalSF),
  };
}

function door_openings_calc(totalSF: number): number {
  return Math.max(4, Math.ceil(totalSF / 350));
}

// ─── Production Rate Lookup ───────────────────────────────────────────────────

function lookupRate(trade: string, taskFragment: string): ProductionRate | undefined {
  return PRODUCTION_RATES.find(
    (r) =>
      r.trade.toLowerCase() === trade.toLowerCase() &&
      r.task.toLowerCase().includes(taskFragment.toLowerCase())
  );
}

// ─── Duration Calculator ──────────────────────────────────────────────────────

function calcDuration(
  quantity: number,
  rateMid: number,
  stories: number,
  isGroundUp: boolean,
  minDays = 1,
  maxDays = 999
): number {
  if (quantity <= 0 || rateMid <= 0) return minDays;

  let days = quantity / rateMid;

  // Multi-story modifier: +15% per floor above ground (capped at 3× multiplier)
  if (stories > 1) {
    const storyFactor = Math.min(1 + (stories - 1) * 0.15, 3.0);
    days *= storyFactor;
  }

  // TI discount: no foundation phase, reduced mobilization
  if (!isGroundUp) {
    days *= 0.85;
  }

  return Math.min(Math.max(Math.ceil(days), minDays), maxDays);
}

// ─── Structure Type Activity Templates ───────────────────────────────────────

/**
 * Additional Phase 3 / Phase 4 activities injected when isGroundUp=true,
 * keyed by structure type name. These supplement (not replace) the base
 * MASTER_TEMPLATE activities — predecessor resolution uses the same system.
 */
const STRUCTURE_TYPE_TEMPLATES: Record<string, ActivityTemplate[]> = {

  'Masonry Structures': [
    {
      activityId: '4100',
      name: 'Load-Bearing CMU Wall Construction',
      trade: 'Masonry',
      phase: 'Phase 4: Structure',
      quantityKey: 'cmu_blocks',
      rateRef: { trade: 'Masonry', task: 'CMU Block' },
      predecessorIds: ['3050'],
      fallbackPredecessorIds: ['1010'],
      groundUpOnly: true,
      requiresTrades: ['Masonry'],
      minDays: 5,
    },
    {
      activityId: '4110',
      name: 'CMU Grouting & Reinforcing',
      trade: 'Masonry',
      phase: 'Phase 4: Structure',
      quantityKey: '__fixed__',
      rateRef: { trade: '', task: '' },
      scaledFixed: (sf) => Math.max(3, Math.ceil(sf / 5000)),
      predecessorIds: ['4100'],
      fallbackPredecessorIds: ['3050'],
      groundUpOnly: true,
      requiresTrades: ['Masonry'],
    },
    {
      activityId: '4120',
      name: 'Brick Veneer / Masonry Exterior Finish',
      trade: 'Masonry',
      phase: 'Phase 4: Structure',
      quantityKey: '__fixed__',
      rateRef: { trade: '', task: '' },
      scaledFixed: (sf) => Math.max(3, Math.ceil(sf / 4000)),
      predecessorIds: ['4110'],
      fallbackPredecessorIds: ['4100'],
      groundUpOnly: true,
      requiresTrades: ['Masonry'],
    },
  ],

  'Tilt-Up Concrete Structures': [
    {
      activityId: '3500',
      name: 'Tilt-Up Panel Layout & Forming',
      trade: 'Concrete',
      phase: 'Phase 3: Foundations',
      quantityKey: '__fixed__',
      rateRef: { trade: '', task: '' },
      scaledFixed: (sf) => Math.max(3, Math.ceil(sf / 8000)),
      predecessorIds: ['3050'],
      fallbackPredecessorIds: ['3040'],
      groundUpOnly: true,
      requiresTrades: ['Concrete'],
    },
    {
      activityId: '3510',
      name: 'Tilt-Up Panel Casting & Curing',
      trade: 'Concrete',
      phase: 'Phase 3: Foundations',
      quantityKey: '__fixed__',
      rateRef: { trade: '', task: '' },
      scaledFixed: (sf) => Math.max(7, Math.ceil(sf / 4000)),
      predecessorIds: ['3500'],
      fallbackPredecessorIds: ['3050'],
      groundUpOnly: true,
      requiresTrades: ['Concrete'],
    },
    {
      activityId: '4200',
      name: 'Tilt-Up Panel Erection',
      trade: 'Concrete',
      phase: 'Phase 4: Structure',
      quantityKey: '__fixed__',
      rateRef: { trade: '', task: '' },
      scaledFixed: (sf) => Math.max(3, Math.ceil(sf / 6000)),
      predecessorIds: ['3510'],
      fallbackPredecessorIds: ['3050'],
      groundUpOnly: true,
      requiresTrades: ['Concrete'],
    },
    {
      activityId: '4210',
      name: 'Panel Bracing & Temporary Shoring',
      trade: 'Concrete',
      phase: 'Phase 4: Structure',
      quantityKey: '__fixed__',
      rateRef: { trade: '', task: '' },
      fixedDays: 3,
      predecessorIds: ['4200'],
      fallbackPredecessorIds: ['3510'],
      groundUpOnly: true,
    },
    {
      activityId: '4220',
      name: 'Panel Grouting & Ledger Connections',
      trade: 'Concrete',
      phase: 'Phase 4: Structure',
      quantityKey: '__fixed__',
      rateRef: { trade: '', task: '' },
      fixedDays: 3,
      predecessorIds: ['4210'],
      fallbackPredecessorIds: ['4200'],
      groundUpOnly: true,
      requiresTrades: ['Concrete'],
    },
  ],

  'Wood-Framed Structures': [
    {
      activityId: '4300',
      name: 'Wood Framing — Floor, Wall & Roof',
      trade: 'Framing',
      phase: 'Phase 4: Structure',
      quantityKey: 'framing_sf',
      rateRef: { trade: 'Framing', task: 'Wood Framing' },
      predecessorIds: ['3050'],
      fallbackPredecessorIds: ['1010'],
      groundUpOnly: true,
      requiresTrades: ['Framing'],
      minDays: 5,
    },
    {
      activityId: '4310',
      name: 'Roof Trusses & Roof Sheathing',
      trade: 'Framing',
      phase: 'Phase 4: Structure',
      quantityKey: '__fixed__',
      rateRef: { trade: '', task: '' },
      scaledFixed: (sf, stories) => Math.max(4, Math.ceil((sf / stories) / 2000)),
      predecessorIds: ['4300'],
      fallbackPredecessorIds: ['3050'],
      groundUpOnly: true,
      requiresTrades: ['Framing'],
    },
    {
      activityId: '4320',
      name: 'Wall Sheathing & Blocking',
      trade: 'Framing',
      phase: 'Phase 4: Structure',
      quantityKey: 'blocking_lf',
      rateRef: { trade: 'Framing', task: 'Blocking' },
      predecessorIds: ['4300'],
      fallbackPredecessorIds: ['3050'],
      groundUpOnly: true,
      requiresTrades: ['Framing'],
      minDays: 2,
    },
  ],

  // Structural Steel Frame: base MASTER_TEMPLATE activities 4000-4010 handle this.
  // We add supplemental connection and inspection activity.
  'Structural Steel Frame Structures': [
    {
      activityId: '4050',
      name: 'Bolted Connections & High-Strength Bolt Inspection',
      trade: 'Structural Steel',
      phase: 'Phase 4: Structure',
      quantityKey: '__fixed__',
      rateRef: { trade: '', task: '' },
      scaledFixed: (sf) => Math.max(3, Math.ceil(sf / 15000)),
      predecessorIds: ['4000'],
      fallbackPredecessorIds: ['3050'],
      groundUpOnly: true,
      requiresTrades: ['Structural Steel'],
    },
    {
      activityId: '4060',
      name: 'Structural Steel Touch-Up Paint & Fireproofing',
      trade: 'Structural Steel',
      phase: 'Phase 4: Structure',
      quantityKey: '__fixed__',
      rateRef: { trade: '', task: '' },
      scaledFixed: (sf) => Math.max(3, Math.ceil(sf / 12000)),
      predecessorIds: ['4010'],
      fallbackPredecessorIds: ['4000'],
      groundUpOnly: true,
      requiresTrades: ['Structural Steel'],
    },
  ],

  'Pre-Engineered Metal Building Structures': [
    {
      activityId: '4400',
      name: 'Pre-Engineered Metal Building Erection',
      trade: 'Structural Steel',
      phase: 'Phase 4: Structure',
      quantityKey: '__fixed__',
      rateRef: { trade: '', task: '' },
      scaledFixed: (sf) => Math.max(4, Math.ceil(sf / 5000)),
      predecessorIds: ['3050'],
      fallbackPredecessorIds: ['1010'],
      groundUpOnly: true,
      requiresTrades: ['Structural Steel'],
    },
    {
      activityId: '4410',
      name: 'Metal Sheeting & Wall Cladding',
      trade: 'Structural Steel',
      phase: 'Phase 4: Structure',
      quantityKey: '__fixed__',
      rateRef: { trade: '', task: '' },
      scaledFixed: (sf) => Math.max(3, Math.ceil(sf / 6000)),
      predecessorIds: ['4400'],
      fallbackPredecessorIds: ['3050'],
      groundUpOnly: true,
      requiresTrades: ['Structural Steel'],
    },
    {
      activityId: '4420',
      name: 'Overhead Doors & Sectional Door Framing',
      trade: 'Doors & Hardware',
      phase: 'Phase 4: Structure',
      quantityKey: '__fixed__',
      rateRef: { trade: '', task: '' },
      fixedDays: 3,
      predecessorIds: ['4410'],
      fallbackPredecessorIds: ['4400'],
      groundUpOnly: true,
      requiresTrades: ['Doors & Hardware'],
    },
  ],

  'Hybrid Masonry and Steel Structures': [
    {
      activityId: '4500',
      name: 'Masonry Core / Shear Walls',
      trade: 'Masonry',
      phase: 'Phase 4: Structure',
      quantityKey: 'cmu_blocks',
      rateRef: { trade: 'Masonry', task: 'CMU Block' },
      predecessorIds: ['3050'],
      fallbackPredecessorIds: ['1010'],
      groundUpOnly: true,
      requiresTrades: ['Masonry'],
      minDays: 5,
    },
    {
      activityId: '4510',
      name: 'Steel Frame (Perimeter & Roof)',
      trade: 'Structural Steel',
      phase: 'Phase 4: Structure',
      quantityKey: 'steel_tons',
      rateRef: { trade: 'Structural Steel', task: 'Steel Erection (Standard)' },
      predecessorIds: ['4500'],
      fallbackPredecessorIds: ['3050'],
      groundUpOnly: true,
      requiresTrades: ['Structural Steel'],
      minDays: 3,
    },
    {
      activityId: '4520',
      name: 'Hybrid Connection Details & Tie-In',
      trade: 'Structural Steel',
      phase: 'Phase 4: Structure',
      quantityKey: '__fixed__',
      rateRef: { trade: '', task: '' },
      fixedDays: 4,
      predecessorIds: ['4510'],
      fallbackPredecessorIds: ['4500'],
      groundUpOnly: true,
    },
  ],

  'Cast-In-Place Reinforced Concrete Structures': [
    {
      activityId: '3600',
      name: 'Elevated Formwork Design & Setup',
      trade: 'Concrete',
      phase: 'Phase 3: Foundations',
      quantityKey: '__fixed__',
      rateRef: { trade: '', task: '' },
      scaledFixed: (sf, stories) => Math.max(5, Math.ceil((sf * stories) / 10000)),
      predecessorIds: ['3050'],
      fallbackPredecessorIds: ['3040'],
      groundUpOnly: true,
      requiresTrades: ['Concrete'],
    },
    {
      activityId: '3610',
      name: 'Rebar Placement (Elevated Slabs & Columns)',
      trade: 'Concrete',
      phase: 'Phase 3: Foundations',
      quantityKey: '__fixed__',
      rateRef: { trade: '', task: '' },
      scaledFixed: (sf, stories) => Math.max(5, Math.ceil((sf * stories) / 8000)),
      predecessorIds: ['3600'],
      fallbackPredecessorIds: ['3050'],
      groundUpOnly: true,
      requiresTrades: ['Concrete'],
    },
    {
      activityId: '4600',
      name: 'Elevated Concrete Placement (Per Floor Cycle)',
      trade: 'Concrete',
      phase: 'Phase 4: Structure',
      quantityKey: '__fixed__',
      rateRef: { trade: '', task: '' },
      scaledFixed: (sf, stories) => Math.max(7, Math.ceil((sf * Math.max(stories - 1, 1)) / 5000)),
      predecessorIds: ['3610'],
      fallbackPredecessorIds: ['3600'],
      groundUpOnly: true,
      requiresTrades: ['Concrete'],
    },
    {
      activityId: '4610',
      name: 'Form Stripping & Next Level Preparation',
      trade: 'Concrete',
      phase: 'Phase 4: Structure',
      quantityKey: '__fixed__',
      rateRef: { trade: '', task: '' },
      scaledFixed: (sf, stories) => Math.max(4, Math.ceil((sf * Math.max(stories - 1, 1)) / 7000)),
      predecessorIds: ['4600'],
      fallbackPredecessorIds: ['3610'],
      groundUpOnly: true,
      requiresTrades: ['Concrete'],
    },
    {
      activityId: '4620',
      name: 'Column & Wall Concrete (Vertical Elements)',
      trade: 'Concrete',
      phase: 'Phase 4: Structure',
      quantityKey: '__fixed__',
      rateRef: { trade: '', task: '' },
      scaledFixed: (sf, stories) => Math.max(5, Math.ceil((sf * stories) / 9000)),
      predecessorIds: ['4600'],
      fallbackPredecessorIds: ['3610'],
      groundUpOnly: true,
      requiresTrades: ['Concrete'],
    },
  ],

  'Precast Concrete Structures': [
    {
      activityId: '4700',
      name: 'Precast Panel / Column / Beam Delivery',
      trade: 'Concrete',
      phase: 'Phase 4: Structure',
      quantityKey: '__fixed__',
      rateRef: { trade: '', task: '' },
      fixedDays: 3,
      predecessorIds: ['3050'],
      fallbackPredecessorIds: ['1010'],
      groundUpOnly: true,
      requiresTrades: ['Concrete'],
    },
    {
      activityId: '4710',
      name: 'Precast Erection (Crane Set)',
      trade: 'Concrete',
      phase: 'Phase 4: Structure',
      quantityKey: '__fixed__',
      rateRef: { trade: '', task: '' },
      scaledFixed: (sf, stories) => Math.max(5, Math.ceil((sf * stories) / 6000)),
      predecessorIds: ['4700'],
      fallbackPredecessorIds: ['3050'],
      groundUpOnly: true,
      requiresTrades: ['Concrete'],
    },
    {
      activityId: '4720',
      name: 'Precast Connections, Grouting & Topping',
      trade: 'Concrete',
      phase: 'Phase 4: Structure',
      quantityKey: '__fixed__',
      rateRef: { trade: '', task: '' },
      scaledFixed: (sf) => Math.max(4, Math.ceil(sf / 8000)),
      predecessorIds: ['4710'],
      fallbackPredecessorIds: ['4700'],
      groundUpOnly: true,
      requiresTrades: ['Concrete'],
    },
  ],

  'Insulated Concrete Form (ICF) Structures': [
    {
      activityId: '4800',
      name: 'ICF Form Block Layout & Installation',
      trade: 'Concrete',
      phase: 'Phase 4: Structure',
      quantityKey: '__fixed__',
      rateRef: { trade: '', task: '' },
      scaledFixed: (sf, stories) => Math.max(5, Math.ceil((sf * stories) / 3000)),
      predecessorIds: ['3050'],
      fallbackPredecessorIds: ['1010'],
      groundUpOnly: true,
      requiresTrades: ['Concrete'],
    },
    {
      activityId: '4810',
      name: 'ICF Concrete Pour & Curing',
      trade: 'Concrete',
      phase: 'Phase 4: Structure',
      quantityKey: '__fixed__',
      rateRef: { trade: '', task: '' },
      scaledFixed: (sf, stories) => Math.max(4, Math.ceil((sf * stories) / 4000)),
      predecessorIds: ['4800'],
      fallbackPredecessorIds: ['3050'],
      groundUpOnly: true,
      requiresTrades: ['Concrete'],
    },
    {
      activityId: '4820',
      name: 'ICF Rebar & Embed Placement',
      trade: 'Concrete',
      phase: 'Phase 4: Structure',
      quantityKey: '__fixed__',
      rateRef: { trade: '', task: '' },
      fixedDays: 3,
      predecessorIds: ['4800'],
      fallbackPredecessorIds: ['3050'],
      groundUpOnly: true,
      requiresTrades: ['Concrete'],
    },
  ],

  'Light Gauge Steel Framing Structures': [
    {
      activityId: '4900',
      name: 'LGS Panel Fabrication & Layout',
      trade: 'Framing',
      phase: 'Phase 4: Structure',
      quantityKey: '__fixed__',
      rateRef: { trade: '', task: '' },
      scaledFixed: (sf) => Math.max(3, Math.ceil(sf / 8000)),
      predecessorIds: ['3050'],
      fallbackPredecessorIds: ['1010'],
      groundUpOnly: true,
      requiresTrades: ['Framing'],
    },
    {
      activityId: '4910',
      name: 'LGS Panel Erection & Structural Bracing',
      trade: 'Framing',
      phase: 'Phase 4: Structure',
      quantityKey: 'framing_sf',
      rateRef: { trade: 'Framing', task: 'Metal Stud Framing' },
      predecessorIds: ['4900'],
      fallbackPredecessorIds: ['3050'],
      groundUpOnly: true,
      requiresTrades: ['Framing'],
      minDays: 5,
    },
    {
      activityId: '4920',
      name: 'LGS Sheathing & Lateral Bracing',
      trade: 'Framing',
      phase: 'Phase 4: Structure',
      quantityKey: '__fixed__',
      rateRef: { trade: '', task: '' },
      scaledFixed: (sf) => Math.max(3, Math.ceil(sf / 6000)),
      predecessorIds: ['4910'],
      fallbackPredecessorIds: ['4900'],
      groundUpOnly: true,
      requiresTrades: ['Framing'],
    },
  ],

  'Mass Timber / Cross-Laminated Timber (CLT) Structures': [
    {
      activityId: '4950',
      name: 'Mass Timber / CLT Panel Erection',
      trade: 'Structural Steel', // steel connectors / crane work
      phase: 'Phase 4: Structure',
      quantityKey: '__fixed__',
      rateRef: { trade: '', task: '' },
      scaledFixed: (sf, stories) => Math.max(7, Math.ceil((sf * stories) / 4000)),
      predecessorIds: ['3050'],
      fallbackPredecessorIds: ['1010'],
      groundUpOnly: true,
    },
    {
      activityId: '4955',
      name: 'Timber Connection Hardware & Fastening',
      trade: 'Structural Steel',
      phase: 'Phase 4: Structure',
      quantityKey: '__fixed__',
      rateRef: { trade: '', task: '' },
      scaledFixed: (sf) => Math.max(4, Math.ceil(sf / 6000)),
      predecessorIds: ['4950'],
      fallbackPredecessorIds: ['3050'],
      groundUpOnly: true,
    },
    {
      activityId: '4960',
      name: 'Fireproofing Treatment & Char Calculations',
      trade: 'Framing',
      phase: 'Phase 4: Structure',
      quantityKey: '__fixed__',
      rateRef: { trade: '', task: '' },
      scaledFixed: (sf) => Math.max(3, Math.ceil(sf / 8000)),
      predecessorIds: ['4955'],
      fallbackPredecessorIds: ['4950'],
      groundUpOnly: true,
    },
  ],

  'Podium Style Mixed Material Structures': [
    {
      activityId: '3540',
      name: 'Podium Level Formwork & Shoring',
      trade: 'Concrete',
      phase: 'Phase 3: Foundations',
      quantityKey: '__fixed__',
      rateRef: { trade: '', task: '' },
      scaledFixed: (sf) => Math.max(5, Math.ceil(sf / 5000)),
      predecessorIds: ['3050'],
      fallbackPredecessorIds: ['3040'],
      groundUpOnly: true,
      requiresTrades: ['Concrete'],
    },
    {
      activityId: '3550',
      name: 'Podium Concrete Pour & Cure',
      trade: 'Concrete',
      phase: 'Phase 3: Foundations',
      quantityKey: '__fixed__',
      rateRef: { trade: '', task: '' },
      scaledFixed: (sf) => Math.max(5, Math.ceil(sf / 6000)),
      predecessorIds: ['3540'],
      fallbackPredecessorIds: ['3050'],
      groundUpOnly: true,
      requiresTrades: ['Concrete'],
    },
    {
      activityId: '4965',
      name: 'Wood Frame Construction (Above Podium)',
      trade: 'Framing',
      phase: 'Phase 4: Structure',
      quantityKey: 'framing_sf',
      rateRef: { trade: 'Framing', task: 'Wood Framing' },
      predecessorIds: ['3550'],
      fallbackPredecessorIds: ['3050'],
      groundUpOnly: true,
      requiresTrades: ['Framing'],
      minDays: 7,
    },
    {
      activityId: '4966',
      name: 'Podium Waterproofing Membrane & Drainage',
      trade: 'Roofing',
      phase: 'Phase 4: Structure',
      quantityKey: '__fixed__',
      rateRef: { trade: '', task: '' },
      scaledFixed: (sf) => Math.max(3, Math.ceil(sf / 8000)),
      predecessorIds: ['3550'],
      fallbackPredecessorIds: ['3540'],
      groundUpOnly: true,
      requiresTrades: ['Roofing'],
    },
  ],

  'Modular / Prefabricated Building Structures': [
    {
      activityId: '3560',
      name: 'Module Fabrication — Off-Site Lead Time',
      trade: 'Mobilization',
      phase: 'Phase 3: Foundations',
      quantityKey: '__fixed__',
      rateRef: { trade: '', task: '' },
      // Modular fab runs concurrently with site work — long lead, moderate on-site
      scaledFixed: (sf) => Math.max(20, Math.ceil(sf / 1500)),
      predecessorIds: ['1010'],
      fallbackPredecessorIds: ['1000'],
      groundUpOnly: true,
    },
    {
      activityId: '4970',
      name: 'Module Delivery & On-Site Staging',
      trade: 'Mobilization',
      phase: 'Phase 4: Structure',
      quantityKey: '__fixed__',
      rateRef: { trade: '', task: '' },
      scaledFixed: (sf) => Math.max(2, Math.ceil(sf / 12000)),
      predecessorIds: ['3560', '3050'],
      fallbackPredecessorIds: ['3050'],
      groundUpOnly: true,
    },
    {
      activityId: '4975',
      name: 'Module Setting & Crane Placement',
      trade: 'Structural Steel',
      phase: 'Phase 4: Structure',
      quantityKey: '__fixed__',
      rateRef: { trade: '', task: '' },
      scaledFixed: (sf) => Math.max(4, Math.ceil(sf / 3000)),
      predecessorIds: ['4970'],
      fallbackPredecessorIds: ['3050'],
      groundUpOnly: true,
    },
    {
      activityId: '4980',
      name: 'Module-to-Module Connections & Sealing',
      trade: 'Framing',
      phase: 'Phase 4: Structure',
      quantityKey: '__fixed__',
      rateRef: { trade: '', task: '' },
      scaledFixed: (sf) => Math.max(3, Math.ceil(sf / 5000)),
      predecessorIds: ['4975'],
      fallbackPredecessorIds: ['4970'],
      groundUpOnly: true,
      requiresTrades: ['Framing'],
    },
  ],

  'Post-Tensioned Concrete Slab Structures': [
    {
      activityId: '3570',
      name: 'PT Tendon Layout & Installation',
      trade: 'Concrete',
      phase: 'Phase 3: Foundations',
      quantityKey: '__fixed__',
      rateRef: { trade: '', task: '' },
      scaledFixed: (sf, stories) => Math.max(4, Math.ceil((sf * Math.max(stories, 1)) / 8000)),
      predecessorIds: ['3040'],
      fallbackPredecessorIds: ['3020'],
      groundUpOnly: true,
      requiresTrades: ['Concrete'],
    },
    {
      activityId: '3580',
      name: 'PT Concrete Pour & Stressing',
      trade: 'Concrete',
      phase: 'Phase 3: Foundations',
      quantityKey: '__fixed__',
      rateRef: { trade: '', task: '' },
      scaledFixed: (sf, stories) => Math.max(5, Math.ceil((sf * Math.max(stories, 1)) / 6000)),
      predecessorIds: ['3570'],
      fallbackPredecessorIds: ['3040'],
      groundUpOnly: true,
      requiresTrades: ['Concrete'],
    },
    {
      activityId: '4630',
      name: 'PT Tendon Stressing Verification & Grouting',
      trade: 'Concrete',
      phase: 'Phase 4: Structure',
      quantityKey: '__fixed__',
      rateRef: { trade: '', task: '' },
      fixedDays: 3,
      predecessorIds: ['3580'],
      fallbackPredecessorIds: ['3050'],
      groundUpOnly: true,
      requiresTrades: ['Concrete'],
    },
  ],

  'Steel Moment Frame Structures': [
    {
      activityId: '4985',
      name: 'Moment Connection Welding & NDT Inspection',
      trade: 'Structural Steel',
      phase: 'Phase 4: Structure',
      quantityKey: '__fixed__',
      rateRef: { trade: '', task: '' },
      scaledFixed: (sf, stories) => Math.max(5, Math.ceil((sf * stories) / 10000)),
      predecessorIds: ['4000'],
      fallbackPredecessorIds: ['3050'],
      groundUpOnly: true,
      requiresTrades: ['Structural Steel'],
    },
    {
      activityId: '4986',
      name: 'Moment Frame Fireproofing',
      trade: 'Structural Steel',
      phase: 'Phase 4: Structure',
      quantityKey: '__fixed__',
      rateRef: { trade: '', task: '' },
      scaledFixed: (sf) => Math.max(4, Math.ceil(sf / 10000)),
      predecessorIds: ['4985'],
      fallbackPredecessorIds: ['4000'],
      groundUpOnly: true,
      requiresTrades: ['Structural Steel'],
    },
  ],

  'Braced Frame Structures': [
    {
      activityId: '4987',
      name: 'Brace Installation & Connection Details',
      trade: 'Structural Steel',
      phase: 'Phase 4: Structure',
      quantityKey: '__fixed__',
      rateRef: { trade: '', task: '' },
      scaledFixed: (sf, stories) => Math.max(4, Math.ceil((sf * stories) / 12000)),
      predecessorIds: ['4000'],
      fallbackPredecessorIds: ['3050'],
      groundUpOnly: true,
      requiresTrades: ['Structural Steel'],
    },
    {
      activityId: '4988',
      name: 'Brace Frame Gusset Plate Welding',
      trade: 'Structural Steel',
      phase: 'Phase 4: Structure',
      quantityKey: '__fixed__',
      rateRef: { trade: '', task: '' },
      fixedDays: 3,
      predecessorIds: ['4987'],
      fallbackPredecessorIds: ['4000'],
      groundUpOnly: true,
      requiresTrades: ['Structural Steel'],
    },
  ],

  'Shear Wall Structures': [
    {
      activityId: '4989',
      name: 'Shear Wall Construction & Hardware',
      trade: 'Masonry',
      phase: 'Phase 4: Structure',
      quantityKey: 'cmu_blocks',
      rateRef: { trade: 'Masonry', task: 'CMU Block' },
      predecessorIds: ['3050'],
      fallbackPredecessorIds: ['1010'],
      groundUpOnly: true,
      requiresTrades: ['Masonry'],
      minDays: 5,
    },
    {
      activityId: '4990',
      name: 'Shear Wall Hold-Down Anchors & Inspection',
      trade: 'Concrete',
      phase: 'Phase 4: Structure',
      quantityKey: '__fixed__',
      rateRef: { trade: '', task: '' },
      fixedDays: 3,
      predecessorIds: ['4989'],
      fallbackPredecessorIds: ['3050'],
      groundUpOnly: true,
      requiresTrades: ['Concrete'],
    },
    {
      activityId: '4991',
      name: 'Shear Panel Nailing & Diaphragm Installation',
      trade: 'Framing',
      phase: 'Phase 4: Structure',
      quantityKey: '__fixed__',
      rateRef: { trade: '', task: '' },
      scaledFixed: (sf) => Math.max(3, Math.ceil(sf / 5000)),
      predecessorIds: ['4989'],
      fallbackPredecessorIds: ['3050'],
      groundUpOnly: true,
      requiresTrades: ['Framing'],
    },
  ],

  'Tensile Membrane / Fabric Structures': [
    {
      activityId: '4992',
      name: 'Primary Steel Support Frame Erection',
      trade: 'Structural Steel',
      phase: 'Phase 4: Structure',
      quantityKey: 'steel_tons',
      rateRef: { trade: 'Structural Steel', task: 'Steel Erection (Standard)' },
      predecessorIds: ['3050'],
      fallbackPredecessorIds: ['1010'],
      groundUpOnly: true,
      requiresTrades: ['Structural Steel'],
      minDays: 5,
    },
    {
      activityId: '4993',
      name: 'Tensile Membrane Fabrication (Off-Site)',
      trade: 'Mobilization',
      phase: 'Phase 4: Structure',
      quantityKey: '__fixed__',
      rateRef: { trade: '', task: '' },
      scaledFixed: (sf) => Math.max(10, Math.ceil(sf / 2000)),
      predecessorIds: ['1010'],
      fallbackPredecessorIds: ['1000'],
      groundUpOnly: true,
    },
    {
      activityId: '4994',
      name: 'Membrane Installation & Tensioning',
      trade: 'Structural Steel',
      phase: 'Phase 4: Structure',
      quantityKey: '__fixed__',
      rateRef: { trade: '', task: '' },
      scaledFixed: (sf) => Math.max(5, Math.ceil(sf / 3000)),
      predecessorIds: ['4992', '4993'],
      fallbackPredecessorIds: ['4992'],
      groundUpOnly: true,
    },
    {
      activityId: '4995',
      name: 'Membrane Inspection & Load Testing',
      trade: 'Mobilization',
      phase: 'Phase 4: Structure',
      quantityKey: '__fixed__',
      rateRef: { trade: '', task: '' },
      fixedDays: 3,
      predecessorIds: ['4994'],
      fallbackPredecessorIds: ['4992'],
      groundUpOnly: true,
    },
  ],
};

// ─── Activity Template ────────────────────────────────────────────────────────

// ─── Procurement & Submittal Chain Templates ────────────────────────────────
//
// These run starting at project mobilization. Each chain's final "Delivery"
// activity is a predecessor to the corresponding installation activity below.

const PROCUREMENT_TEMPLATES: ActivityTemplate[] = [
  // ── Structural Steel (lead ~65 wd) ──────────────────────────────────────
  { activityId: 'P100', name: 'Submit Steel Shop Drawings', trade: 'Structural Steel',
    phase: 'Phase 0: Procurement & Submittals', quantityKey: '__fixed__',
    rateRef: { trade: '', task: '' }, fixedDays: 10,
    predecessorIds: ['1000'], fallbackPredecessorIds: [], requiresTrades: ['Structural Steel'] },
  { activityId: 'P101', name: 'Architect Review & Approval — Steel', trade: 'Structural Steel',
    phase: 'Phase 0: Procurement & Submittals', quantityKey: '__fixed__',
    rateRef: { trade: '', task: '' }, fixedDays: 10,
    predecessorIds: ['P100'], fallbackPredecessorIds: ['1000'], requiresTrades: ['Structural Steel'] },
  { activityId: 'P102', name: 'Purchase Steel', trade: 'Structural Steel',
    phase: 'Phase 0: Procurement & Submittals', quantityKey: '__fixed__',
    rateRef: { trade: '', task: '' }, fixedDays: 5,
    predecessorIds: ['P101'], fallbackPredecessorIds: ['P100'], requiresTrades: ['Structural Steel'] },
  { activityId: 'P103', name: 'Steel Fabrication', trade: 'Structural Steel',
    phase: 'Phase 0: Procurement & Submittals', quantityKey: '__fixed__',
    rateRef: { trade: '', task: '' }, fixedDays: 35,
    predecessorIds: ['P102'], fallbackPredecessorIds: ['P101'], requiresTrades: ['Structural Steel'] },
  { activityId: 'P104', name: 'Steel Delivery', trade: 'Structural Steel',
    phase: 'Phase 0: Procurement & Submittals', quantityKey: '__fixed__',
    rateRef: { trade: '', task: '' }, fixedDays: 5,
    predecessorIds: ['P103'], fallbackPredecessorIds: ['P102'], requiresTrades: ['Structural Steel'] },

  // ── Elevator (lead ~105 wd) ──────────────────────────────────────────────
  { activityId: 'P200', name: 'Submit Elevator Submittals', trade: 'Conveying (Elevator)',
    phase: 'Phase 0: Procurement & Submittals', quantityKey: '__fixed__',
    rateRef: { trade: '', task: '' }, fixedDays: 10,
    predecessorIds: ['1000'], fallbackPredecessorIds: [], requiresTrades: ['Conveying (Elevator)'] },
  { activityId: 'P201', name: 'Review & Approval — Elevator', trade: 'Conveying (Elevator)',
    phase: 'Phase 0: Procurement & Submittals', quantityKey: '__fixed__',
    rateRef: { trade: '', task: '' }, fixedDays: 15,
    predecessorIds: ['P200'], fallbackPredecessorIds: ['1000'], requiresTrades: ['Conveying (Elevator)'] },
  { activityId: 'P202', name: 'Purchase / Award Elevator', trade: 'Conveying (Elevator)',
    phase: 'Phase 0: Procurement & Submittals', quantityKey: '__fixed__',
    rateRef: { trade: '', task: '' }, fixedDays: 10,
    predecessorIds: ['P201'], fallbackPredecessorIds: ['P200'], requiresTrades: ['Conveying (Elevator)'] },
  { activityId: 'P203', name: 'Elevator Fabrication', trade: 'Conveying (Elevator)',
    phase: 'Phase 0: Procurement & Submittals', quantityKey: '__fixed__',
    rateRef: { trade: '', task: '' }, fixedDays: 60,
    predecessorIds: ['P202'], fallbackPredecessorIds: ['P201'], requiresTrades: ['Conveying (Elevator)'] },
  { activityId: 'P204', name: 'Elevator Delivery', trade: 'Conveying (Elevator)',
    phase: 'Phase 0: Procurement & Submittals', quantityKey: '__fixed__',
    rateRef: { trade: '', task: '' }, fixedDays: 10,
    predecessorIds: ['P203'], fallbackPredecessorIds: ['P202'], requiresTrades: ['Conveying (Elevator)'] },

  // ── Windows / Storefront (lead ~70 wd) ──────────────────────────────────
  { activityId: 'P300', name: 'Submit Window Shop Drawings', trade: 'Windows & Glazing',
    phase: 'Phase 0: Procurement & Submittals', quantityKey: '__fixed__',
    rateRef: { trade: '', task: '' }, fixedDays: 10,
    predecessorIds: ['1000'], fallbackPredecessorIds: [], requiresTrades: ['Windows & Glazing'] },
  { activityId: 'P301', name: 'Review & Approval — Windows', trade: 'Windows & Glazing',
    phase: 'Phase 0: Procurement & Submittals', quantityKey: '__fixed__',
    rateRef: { trade: '', task: '' }, fixedDays: 10,
    predecessorIds: ['P300'], fallbackPredecessorIds: ['1000'], requiresTrades: ['Windows & Glazing'] },
  { activityId: 'P302', name: 'Purchase Windows', trade: 'Windows & Glazing',
    phase: 'Phase 0: Procurement & Submittals', quantityKey: '__fixed__',
    rateRef: { trade: '', task: '' }, fixedDays: 5,
    predecessorIds: ['P301'], fallbackPredecessorIds: ['P300'], requiresTrades: ['Windows & Glazing'] },
  { activityId: 'P303', name: 'Window Fabrication', trade: 'Windows & Glazing',
    phase: 'Phase 0: Procurement & Submittals', quantityKey: '__fixed__',
    rateRef: { trade: '', task: '' }, fixedDays: 40,
    predecessorIds: ['P302'], fallbackPredecessorIds: ['P301'], requiresTrades: ['Windows & Glazing'] },
  { activityId: 'P304', name: 'Window Delivery', trade: 'Windows & Glazing',
    phase: 'Phase 0: Procurement & Submittals', quantityKey: '__fixed__',
    rateRef: { trade: '', task: '' }, fixedDays: 5,
    predecessorIds: ['P303'], fallbackPredecessorIds: ['P302'], requiresTrades: ['Windows & Glazing'] },

  // ── Doors & Hardware (lead ~55 wd) ──────────────────────────────────────
  { activityId: 'P400', name: 'Submit HM Door Shop Drawings', trade: 'Doors & Hardware',
    phase: 'Phase 0: Procurement & Submittals', quantityKey: '__fixed__',
    rateRef: { trade: '', task: '' }, fixedDays: 5,
    predecessorIds: ['1000'], fallbackPredecessorIds: [], requiresTrades: ['Doors & Hardware'] },
  { activityId: 'P401', name: 'Review & Approval — Doors', trade: 'Doors & Hardware',
    phase: 'Phase 0: Procurement & Submittals', quantityKey: '__fixed__',
    rateRef: { trade: '', task: '' }, fixedDays: 10,
    predecessorIds: ['P400'], fallbackPredecessorIds: ['1000'], requiresTrades: ['Doors & Hardware'] },
  { activityId: 'P402', name: 'Purchase Doors', trade: 'Doors & Hardware',
    phase: 'Phase 0: Procurement & Submittals', quantityKey: '__fixed__',
    rateRef: { trade: '', task: '' }, fixedDays: 5,
    predecessorIds: ['P401'], fallbackPredecessorIds: ['P400'], requiresTrades: ['Doors & Hardware'] },
  { activityId: 'P403', name: 'Door Fabrication', trade: 'Doors & Hardware',
    phase: 'Phase 0: Procurement & Submittals', quantityKey: '__fixed__',
    rateRef: { trade: '', task: '' }, fixedDays: 30,
    predecessorIds: ['P402'], fallbackPredecessorIds: ['P401'], requiresTrades: ['Doors & Hardware'] },
  { activityId: 'P404', name: 'Door Delivery', trade: 'Doors & Hardware',
    phase: 'Phase 0: Procurement & Submittals', quantityKey: '__fixed__',
    rateRef: { trade: '', task: '' }, fixedDays: 5,
    predecessorIds: ['P403'], fallbackPredecessorIds: ['P402'], requiresTrades: ['Doors & Hardware'] },

  // ── HVAC (lead ~75 wd) ──────────────────────────────────────────────────
  { activityId: 'P500', name: 'Submit HVAC Equipment Submittals', trade: 'HVAC',
    phase: 'Phase 0: Procurement & Submittals', quantityKey: '__fixed__',
    rateRef: { trade: '', task: '' }, fixedDays: 10,
    predecessorIds: ['1000'], fallbackPredecessorIds: [], requiresTrades: ['HVAC'] },
  { activityId: 'P501', name: 'Review & Approval — HVAC', trade: 'HVAC',
    phase: 'Phase 0: Procurement & Submittals', quantityKey: '__fixed__',
    rateRef: { trade: '', task: '' }, fixedDays: 10,
    predecessorIds: ['P500'], fallbackPredecessorIds: ['1000'], requiresTrades: ['HVAC'] },
  { activityId: 'P502', name: 'Purchase HVAC Equipment', trade: 'HVAC',
    phase: 'Phase 0: Procurement & Submittals', quantityKey: '__fixed__',
    rateRef: { trade: '', task: '' }, fixedDays: 5,
    predecessorIds: ['P501'], fallbackPredecessorIds: ['P500'], requiresTrades: ['HVAC'] },
  { activityId: 'P503', name: 'HVAC Equipment Fabrication', trade: 'HVAC',
    phase: 'Phase 0: Procurement & Submittals', quantityKey: '__fixed__',
    rateRef: { trade: '', task: '' }, fixedDays: 45,
    predecessorIds: ['P502'], fallbackPredecessorIds: ['P501'], requiresTrades: ['HVAC'] },
  { activityId: 'P504', name: 'HVAC Equipment Delivery', trade: 'HVAC',
    phase: 'Phase 0: Procurement & Submittals', quantityKey: '__fixed__',
    rateRef: { trade: '', task: '' }, fixedDays: 5,
    predecessorIds: ['P503'], fallbackPredecessorIds: ['P502'], requiresTrades: ['HVAC'] },

  // ── Fire Sprinkler (lead ~55 wd) ────────────────────────────────────────
  { activityId: 'P600', name: 'Submit Sprinkler Shop Drawings', trade: 'Fire Sprinkler',
    phase: 'Phase 0: Procurement & Submittals', quantityKey: '__fixed__',
    rateRef: { trade: '', task: '' }, fixedDays: 10,
    predecessorIds: ['1000'], fallbackPredecessorIds: [], requiresTrades: ['Fire Sprinkler'] },
  { activityId: 'P601', name: 'Review & Approval — Sprinkler', trade: 'Fire Sprinkler',
    phase: 'Phase 0: Procurement & Submittals', quantityKey: '__fixed__',
    rateRef: { trade: '', task: '' }, fixedDays: 10,
    predecessorIds: ['P600'], fallbackPredecessorIds: ['1000'], requiresTrades: ['Fire Sprinkler'] },
  { activityId: 'P602', name: 'Purchase Sprinkler Materials', trade: 'Fire Sprinkler',
    phase: 'Phase 0: Procurement & Submittals', quantityKey: '__fixed__',
    rateRef: { trade: '', task: '' }, fixedDays: 5,
    predecessorIds: ['P601'], fallbackPredecessorIds: ['P600'], requiresTrades: ['Fire Sprinkler'] },
  { activityId: 'P603', name: 'Sprinkler Material Fabrication', trade: 'Fire Sprinkler',
    phase: 'Phase 0: Procurement & Submittals', quantityKey: '__fixed__',
    rateRef: { trade: '', task: '' }, fixedDays: 25,
    predecessorIds: ['P602'], fallbackPredecessorIds: ['P601'], requiresTrades: ['Fire Sprinkler'] },
  { activityId: 'P604', name: 'Sprinkler Delivery', trade: 'Fire Sprinkler',
    phase: 'Phase 0: Procurement & Submittals', quantityKey: '__fixed__',
    rateRef: { trade: '', task: '' }, fixedDays: 5,
    predecessorIds: ['P603'], fallbackPredecessorIds: ['P602'], requiresTrades: ['Fire Sprinkler'] },

  // ── Electrical (lead ~90 wd) ────────────────────────────────────────────
  { activityId: 'P700', name: 'Submit Electrical Submittals', trade: 'Electrical',
    phase: 'Phase 0: Procurement & Submittals', quantityKey: '__fixed__',
    rateRef: { trade: '', task: '' }, fixedDays: 10,
    predecessorIds: ['1000'], fallbackPredecessorIds: [], requiresTrades: ['Electrical'] },
  { activityId: 'P701', name: 'Review & Approval — Electrical', trade: 'Electrical',
    phase: 'Phase 0: Procurement & Submittals', quantityKey: '__fixed__',
    rateRef: { trade: '', task: '' }, fixedDays: 10,
    predecessorIds: ['P700'], fallbackPredecessorIds: ['1000'], requiresTrades: ['Electrical'] },
  { activityId: 'P702', name: 'Purchase Switchgear & Panels', trade: 'Electrical',
    phase: 'Phase 0: Procurement & Submittals', quantityKey: '__fixed__',
    rateRef: { trade: '', task: '' }, fixedDays: 5,
    predecessorIds: ['P701'], fallbackPredecessorIds: ['P700'], requiresTrades: ['Electrical'] },
  { activityId: 'P703', name: 'Switchgear Fabrication', trade: 'Electrical',
    phase: 'Phase 0: Procurement & Submittals', quantityKey: '__fixed__',
    rateRef: { trade: '', task: '' }, fixedDays: 60,
    predecessorIds: ['P702'], fallbackPredecessorIds: ['P701'], requiresTrades: ['Electrical'] },
  { activityId: 'P704', name: 'Switchgear Delivery', trade: 'Electrical',
    phase: 'Phase 0: Procurement & Submittals', quantityKey: '__fixed__',
    rateRef: { trade: '', task: '' }, fixedDays: 5,
    predecessorIds: ['P703'], fallbackPredecessorIds: ['P702'], requiresTrades: ['Electrical'] },

  // ── Roofing (lead ~25 wd) ───────────────────────────────────────────────
  { activityId: 'P800', name: 'Submit Roofing Submittals', trade: 'Roofing',
    phase: 'Phase 0: Procurement & Submittals', quantityKey: '__fixed__',
    rateRef: { trade: '', task: '' }, fixedDays: 5,
    predecessorIds: ['1000'], fallbackPredecessorIds: [], requiresTrades: ['Roofing'] },
  { activityId: 'P801', name: 'Review & Approval — Roofing', trade: 'Roofing',
    phase: 'Phase 0: Procurement & Submittals', quantityKey: '__fixed__',
    rateRef: { trade: '', task: '' }, fixedDays: 10,
    predecessorIds: ['P800'], fallbackPredecessorIds: ['1000'], requiresTrades: ['Roofing'] },
  { activityId: 'P802', name: 'Purchase Roofing Materials', trade: 'Roofing',
    phase: 'Phase 0: Procurement & Submittals', quantityKey: '__fixed__',
    rateRef: { trade: '', task: '' }, fixedDays: 5,
    predecessorIds: ['P801'], fallbackPredecessorIds: ['P800'], requiresTrades: ['Roofing'] },
  { activityId: 'P803', name: 'Roofing Material Delivery', trade: 'Roofing',
    phase: 'Phase 0: Procurement & Submittals', quantityKey: '__fixed__',
    rateRef: { trade: '', task: '' }, fixedDays: 5,
    predecessorIds: ['P802'], fallbackPredecessorIds: ['P801'], requiresTrades: ['Roofing'] },

  // ── Millwork (lead ~70 wd, always included) ─────────────────────────────
  { activityId: 'P900', name: 'Submit Millwork Shop Drawings', trade: 'Mobilization',
    phase: 'Phase 0: Procurement & Submittals', quantityKey: '__fixed__',
    rateRef: { trade: '', task: '' }, fixedDays: 10,
    predecessorIds: ['1000'], fallbackPredecessorIds: [] },
  { activityId: 'P901', name: 'Review & Approval — Millwork', trade: 'Mobilization',
    phase: 'Phase 0: Procurement & Submittals', quantityKey: '__fixed__',
    rateRef: { trade: '', task: '' }, fixedDays: 10,
    predecessorIds: ['P900'], fallbackPredecessorIds: ['1000'] },
  { activityId: 'P902', name: 'Field Measure — Millwork', trade: 'Mobilization',
    phase: 'Phase 0: Procurement & Submittals', quantityKey: '__fixed__',
    rateRef: { trade: '', task: '' }, fixedDays: 5,
    predecessorIds: ['P901'], fallbackPredecessorIds: ['P900'] },
  { activityId: 'P903', name: 'Millwork Fabrication', trade: 'Mobilization',
    phase: 'Phase 0: Procurement & Submittals', quantityKey: '__fixed__',
    rateRef: { trade: '', task: '' }, fixedDays: 40,
    predecessorIds: ['P902'], fallbackPredecessorIds: ['P901'] },
  { activityId: 'P904', name: 'Millwork Delivery', trade: 'Mobilization',
    phase: 'Phase 0: Procurement & Submittals', quantityKey: '__fixed__',
    rateRef: { trade: '', task: '' }, fixedDays: 5,
    predecessorIds: ['P903'], fallbackPredecessorIds: ['P902'] },

  // ── Flooring (lead ~30 wd) ──────────────────────────────────────────────
  { activityId: 'P1000', name: 'Submit Flooring Submittals', trade: 'Flooring',
    phase: 'Phase 0: Procurement & Submittals', quantityKey: '__fixed__',
    rateRef: { trade: '', task: '' }, fixedDays: 5,
    predecessorIds: ['1000'], fallbackPredecessorIds: [], requiresTrades: ['Flooring'] },
  { activityId: 'P1001', name: 'Review & Approval — Flooring', trade: 'Flooring',
    phase: 'Phase 0: Procurement & Submittals', quantityKey: '__fixed__',
    rateRef: { trade: '', task: '' }, fixedDays: 10,
    predecessorIds: ['P1000'], fallbackPredecessorIds: ['1000'], requiresTrades: ['Flooring'] },
  { activityId: 'P1002', name: 'Purchase Flooring', trade: 'Flooring',
    phase: 'Phase 0: Procurement & Submittals', quantityKey: '__fixed__',
    rateRef: { trade: '', task: '' }, fixedDays: 5,
    predecessorIds: ['P1001'], fallbackPredecessorIds: ['P1000'], requiresTrades: ['Flooring'] },
  { activityId: 'P1003', name: 'Flooring Delivery', trade: 'Flooring',
    phase: 'Phase 0: Procurement & Submittals', quantityKey: '__fixed__',
    rateRef: { trade: '', task: '' }, fixedDays: 10,
    predecessorIds: ['P1002'], fallbackPredecessorIds: ['P1001'], requiresTrades: ['Flooring'] },

  // ── CMU Block / Masonry (lead ~30 wd) ───────────────────────────────────
  { activityId: 'P1100', name: 'Submit Masonry Submittals', trade: 'Masonry',
    phase: 'Phase 0: Procurement & Submittals', quantityKey: '__fixed__',
    rateRef: { trade: '', task: '' }, fixedDays: 5,
    predecessorIds: ['1000'], fallbackPredecessorIds: [], requiresTrades: ['Masonry'] },
  { activityId: 'P1101', name: 'Review & Approval — Masonry', trade: 'Masonry',
    phase: 'Phase 0: Procurement & Submittals', quantityKey: '__fixed__',
    rateRef: { trade: '', task: '' }, fixedDays: 10,
    predecessorIds: ['P1100'], fallbackPredecessorIds: ['1000'], requiresTrades: ['Masonry'] },
  { activityId: 'P1102', name: 'Purchase Block / Masonry', trade: 'Masonry',
    phase: 'Phase 0: Procurement & Submittals', quantityKey: '__fixed__',
    rateRef: { trade: '', task: '' }, fixedDays: 5,
    predecessorIds: ['P1101'], fallbackPredecessorIds: ['P1100'], requiresTrades: ['Masonry'] },
  { activityId: 'P1103', name: 'Block Delivery', trade: 'Masonry',
    phase: 'Phase 0: Procurement & Submittals', quantityKey: '__fixed__',
    rateRef: { trade: '', task: '' }, fixedDays: 10,
    predecessorIds: ['P1102'], fallbackPredecessorIds: ['P1101'], requiresTrades: ['Masonry'] },

  // ── Concrete / Rebar (lead ~45 wd) ──────────────────────────────────────
  { activityId: 'P1200', name: 'Submit Concrete Mix Designs', trade: 'Concrete',
    phase: 'Phase 0: Procurement & Submittals', quantityKey: '__fixed__',
    rateRef: { trade: '', task: '' }, fixedDays: 5,
    predecessorIds: ['1000'], fallbackPredecessorIds: [], requiresTrades: ['Concrete'] },
  { activityId: 'P1201', name: 'Review & Approval — Concrete', trade: 'Concrete',
    phase: 'Phase 0: Procurement & Submittals', quantityKey: '__fixed__',
    rateRef: { trade: '', task: '' }, fixedDays: 10,
    predecessorIds: ['P1200'], fallbackPredecessorIds: ['1000'], requiresTrades: ['Concrete'] },
  { activityId: 'P1202', name: 'Rebar Shop Drawings', trade: 'Concrete',
    phase: 'Phase 0: Procurement & Submittals', quantityKey: '__fixed__',
    rateRef: { trade: '', task: '' }, fixedDays: 10,
    predecessorIds: ['P1201'], fallbackPredecessorIds: ['P1200'], requiresTrades: ['Concrete'] },
  { activityId: 'P1203', name: 'Rebar Fabrication', trade: 'Concrete',
    phase: 'Phase 0: Procurement & Submittals', quantityKey: '__fixed__',
    rateRef: { trade: '', task: '' }, fixedDays: 15,
    predecessorIds: ['P1202'], fallbackPredecessorIds: ['P1201'], requiresTrades: ['Concrete'] },
  { activityId: 'P1204', name: 'Rebar Delivery', trade: 'Concrete',
    phase: 'Phase 0: Procurement & Submittals', quantityKey: '__fixed__',
    rateRef: { trade: '', task: '' }, fixedDays: 5,
    predecessorIds: ['P1203'], fallbackPredecessorIds: ['P1202'], requiresTrades: ['Concrete'] },
];
const MASTER_TEMPLATE: ActivityTemplate[] = [
  // ── Phase 1: Pre-Construction & Mobilization ──────────────────────────────
  {
    activityId: '1000',
    name: 'Project Mobilization',
    trade: 'Mobilization',
    phase: 'Phase 1: Pre-Construction & Mobilization',
    quantityKey: '__fixed__',
    rateRef: { trade: '', task: '' },
    fixedDays: 5,
    predecessorIds: [],
    fallbackPredecessorIds: [],
  },
  {
    activityId: '1010',
    name: 'Permits, Submittals & Owner Coordination',
    trade: 'Mobilization',
    phase: 'Phase 1: Pre-Construction & Mobilization',
    quantityKey: '__fixed__',
    rateRef: { trade: '', task: '' },
    fixedDays: 10,
    predecessorIds: ['1000'],
    fallbackPredecessorIds: [],
    minDays: 5,
  },
  {
    activityId: '1020',
    name: 'Site Survey & Temporary Facilities',
    trade: 'Mobilization',
    phase: 'Phase 1: Pre-Construction & Mobilization',
    quantityKey: '__fixed__',
    rateRef: { trade: '', task: '' },
    fixedDays: 3,
    predecessorIds: ['1000'],
    fallbackPredecessorIds: [],
  },

  // ── Phase 2: Site Work & Earthwork ────────────────────────────────────────
  {
    activityId: '2000',
    name: 'Site Clearing & Demolition',
    trade: 'Earthwork & Civil',
    phase: 'Phase 2: Site Work & Earthwork',
    quantityKey: '__fixed__',
    rateRef: { trade: '', task: '' },
    fixedDays: 5,
    predecessorIds: ['1010'],
    fallbackPredecessorIds: ['1010'],
    requiresTrades: ['Earthwork & Civil'],
    groundUpOnly: true,
  },
  {
    activityId: '2010',
    name: 'Mass Grading & Rough Cut/Fill',
    trade: 'Earthwork & Civil',
    phase: 'Phase 2: Site Work & Earthwork',
    quantityKey: 'mass_grading_cy',
    rateRef: { trade: 'Earthwork & Civil', task: 'Mass Grading (Small' },
    predecessorIds: ['2000'],
    fallbackPredecessorIds: ['1010'],
    requiresTrades: ['Earthwork & Civil'],
    groundUpOnly: true,
    minDays: 3,
  },
  {
    activityId: '2020',
    name: 'Fine Grading & Subgrade Preparation',
    trade: 'Earthwork & Civil',
    phase: 'Phase 2: Site Work & Earthwork',
    quantityKey: 'fine_grading_sf',
    rateRef: { trade: 'Earthwork & Civil', task: 'Fine Grading' },
    predecessorIds: ['2010'],
    fallbackPredecessorIds: ['1010'],
    requiresTrades: ['Earthwork & Civil'],
    groundUpOnly: true,
    minDays: 2,
  },
  {
    activityId: '2030',
    name: 'Underground Wet Utilities',
    trade: 'Earthwork & Civil',
    phase: 'Phase 2: Site Work & Earthwork',
    quantityKey: 'wet_utilities_lf',
    rateRef: { trade: 'Earthwork & Civil', task: 'Trenching (Wet Utilities - Normal)' },
    predecessorIds: ['2010'],
    fallbackPredecessorIds: ['1010'],
    requiresTrades: ['Earthwork & Civil'],
    groundUpOnly: true,
    minDays: 3,
  },
  {
    activityId: '2040',
    name: 'Storm Drain Installation',
    trade: 'Earthwork & Civil',
    phase: 'Phase 2: Site Work & Earthwork',
    quantityKey: 'storm_drain_lf',
    rateRef: { trade: 'Earthwork & Civil', task: 'Storm Drain' },
    predecessorIds: ['2010'],
    fallbackPredecessorIds: ['1010'],
    requiresTrades: ['Earthwork & Civil'],
    groundUpOnly: true,
    minDays: 2,
  },
  {
    activityId: '2050',
    name: 'Dry Utilities & Rough Electrical Underground',
    trade: 'Earthwork & Civil',
    phase: 'Phase 2: Site Work & Earthwork',
    quantityKey: 'dry_utilities_lf',
    rateRef: { trade: 'Earthwork & Civil', task: 'Dry Utilities' },
    predecessorIds: ['2010'],
    fallbackPredecessorIds: ['1010'],
    requiresTrades: ['Earthwork & Civil'],
    groundUpOnly: true,
    minDays: 2,
  },

  // ── Phase 3: Foundations ──────────────────────────────────────────────────
  {
    activityId: '3000',
    name: 'Footing Layout & Excavation',
    trade: 'Concrete',
    phase: 'Phase 3: Foundations',
    quantityKey: '__fixed__',
    rateRef: { trade: '', task: '' },
    fixedDays: 5,
    predecessorIds: ['2020'],
    fallbackPredecessorIds: ['1010'],
    requiresTrades: ['Concrete'],
    groundUpOnly: true,
  },
  {
    activityId: '3010',
    name: 'Form & Pour Footings',
    trade: 'Concrete',
    phase: 'Phase 3: Foundations',
    quantityKey: 'footings_lf',
    rateRef: { trade: 'Concrete', task: 'Foundations / Footings' },
    predecessorIds: ['3000'],
    fallbackPredecessorIds: ['2020'],
    requiresTrades: ['Concrete'],
    groundUpOnly: true,
    minDays: 3,
  },
  {
    activityId: '3020',
    name: 'Foundation Walls / Grade Beams',
    trade: 'Concrete',
    phase: 'Phase 3: Foundations',
    quantityKey: 'footings_lf',
    rateRef: { trade: 'Concrete', task: 'Concrete Pours' },
    predecessorIds: ['3010'],
    fallbackPredecessorIds: ['3000'],
    requiresTrades: ['Concrete'],
    groundUpOnly: true,
    minDays: 3,
  },
  {
    activityId: '3030',
    name: 'Underslab Plumbing & Mechanical',
    trade: 'Plumbing',
    phase: 'Phase 3: Foundations',
    quantityKey: 'underslab_plumbing_lf',
    rateRef: { trade: 'Plumbing', task: 'Underground Plumbing' },
    predecessorIds: ['3020'],
    fallbackPredecessorIds: ['3010'],
    requiresTrades: ['Plumbing'],
    groundUpOnly: true,
    minDays: 3,
  },
  {
    activityId: '3040',
    name: 'Slab on Grade Preparation',
    trade: 'Concrete',
    phase: 'Phase 3: Foundations',
    quantityKey: 'slab_prep_sf',
    rateRef: { trade: 'Concrete', task: 'Slab on Grade Prep' },
    predecessorIds: ['3030', '3020'],
    fallbackPredecessorIds: ['3020'],
    requiresTrades: ['Concrete'],
    groundUpOnly: true,
    minDays: 2,
  },
  {
    activityId: '3050',
    name: 'Pour Slab on Grade',
    trade: 'Concrete',
    phase: 'Phase 3: Foundations',
    quantityKey: 'slab_pour_sf',
    rateRef: { trade: 'Concrete', task: 'Concrete Flatwork' },
    predecessorIds: ['3040'],
    fallbackPredecessorIds: ['3030'],
    requiresTrades: ['Concrete'],
    groundUpOnly: true,
    minDays: 2,
  },

  // ── Phase 4: Structure ────────────────────────────────────────────────────
  {
    activityId: '4000',
    name: 'Structural Steel Erection',
    trade: 'Structural Steel',
    phase: 'Phase 4: Structure',
    quantityKey: 'steel_tons',
    rateRef: { trade: 'Structural Steel', task: 'Steel Erection (Standard)' },
    predecessorIds: ['3050'],
    fallbackPredecessorIds: ['1010'],
    requiresTrades: ['Structural Steel'],
    minDays: 3,
  },
  {
    activityId: '4010',
    name: 'Metal Decking',
    trade: 'Structural Steel',
    phase: 'Phase 4: Structure',
    quantityKey: 'decking_sf',
    rateRef: { trade: 'Structural Steel', task: 'Metal Decking' },
    predecessorIds: ['4000'],
    fallbackPredecessorIds: ['3050'],
    requiresTrades: ['Structural Steel'],
    minDays: 2,
  },
  {
    activityId: '4020',
    name: 'Metal Stud Framing — Exterior & Interior',
    trade: 'Framing',
    phase: 'Phase 4: Structure',
    quantityKey: 'framing_sf',
    rateRef: { trade: 'Framing', task: 'Metal Stud Framing' },
    predecessorIds: ['4000', '3050'],
    fallbackPredecessorIds: ['1010'],
    requiresTrades: ['Framing'],
    minDays: 5,
  },
  {
    activityId: '4030',
    name: 'Masonry (CMU Block)',
    trade: 'Masonry',
    phase: 'Phase 4: Structure',
    quantityKey: 'cmu_blocks',
    rateRef: { trade: 'Masonry', task: 'CMU Block' },
    predecessorIds: ['3050', '4000'],
    fallbackPredecessorIds: ['1010'],
    requiresTrades: ['Masonry'],
    groundUpOnly: true,
    minDays: 3,
  },

  // ── Phase 5: Building Envelope ────────────────────────────────────────────
  {
    activityId: '5000',
    name: 'Roofing System',
    trade: 'Roofing',
    phase: 'Phase 5: Building Envelope',
    quantityKey: 'roofing_sf',
    rateRef: { trade: 'Roofing', task: 'TPO / EPDM' },
    predecessorIds: ['4010', '4020'],
    fallbackPredecessorIds: ['4020', '1010'],
    requiresTrades: ['Roofing'],
    minDays: 3,
  },
  {
    activityId: '5010',
    name: 'Storefront & Glazing',
    trade: 'Windows & Glazing',
    phase: 'Phase 5: Building Envelope',
    quantityKey: 'storefront_sf',
    rateRef: { trade: 'Windows & Glazing', task: 'Storefront' },
    predecessorIds: ['4020'],
    fallbackPredecessorIds: ['1010'],
    requiresTrades: ['Windows & Glazing'],
    minDays: 2,
  },
  {
    activityId: '5020',
    name: 'Exterior Finishes (Stucco / EIFS)',
    trade: 'Exterior Finishes',
    phase: 'Phase 5: Building Envelope',
    quantityKey: 'stucco_sf',
    rateRef: { trade: 'Exterior Finishes', task: 'Stucco' },
    predecessorIds: ['4020', '5010'],
    fallbackPredecessorIds: ['4020'],
    requiresTrades: ['Exterior Finishes'],
    minDays: 3,
  },
  {
    activityId: '5030',
    name: 'Hollow Metal Doors & Frames (Rough)',
    trade: 'Doors & Hardware',
    phase: 'Phase 5: Building Envelope',
    quantityKey: 'hm_doors',
    rateRef: { trade: 'Doors & Hardware', task: 'Hollow Metal Doors' },
    predecessorIds: ['4020'],
    fallbackPredecessorIds: ['1010'],
    requiresTrades: ['Doors & Hardware'],
    minDays: 2,
  },

  // ── Phase 6: Rough-Ins (MEP) ──────────────────────────────────────────────
  {
    activityId: '6000',
    name: 'Fire Sprinkler Rough-In (Mains & Branches)',
    trade: 'Fire Sprinkler',
    phase: 'Phase 6: Rough-Ins (MEP)',
    quantityKey: 'sprinkler_pipe_lf',
    rateRef: { trade: 'Fire Sprinkler', task: 'Pipe' },
    predecessorIds: ['4020', '5000'],
    fallbackPredecessorIds: ['1010'],
    requiresTrades: ['Fire Sprinkler'],
    minDays: 3,
  },
  {
    activityId: '6010',
    name: 'HVAC Rough — Ductwork & Equipment',
    trade: 'HVAC',
    phase: 'Phase 6: Rough-Ins (MEP)',
    quantityKey: 'ductwork_lbs',
    rateRef: { trade: 'HVAC', task: 'Ductwork' },
    predecessorIds: ['4020'],
    fallbackPredecessorIds: ['1010'],
    requiresTrades: ['HVAC'],
    minDays: 5,
  },
  {
    activityId: '6020',
    name: 'Plumbing Rough-In (Above Grade)',
    trade: 'Plumbing',
    phase: 'Phase 6: Rough-Ins (MEP)',
    quantityKey: 'plumbing_rough_sf',
    rateRef: { trade: 'Plumbing', task: 'Plumbing Rough-In' },
    predecessorIds: ['4020', '3050'],
    fallbackPredecessorIds: ['1010'],
    requiresTrades: ['Plumbing'],
    minDays: 3,
  },
  {
    activityId: '6030',
    name: 'Electrical Conduit Rough-In & Wiring',
    trade: 'Electrical',
    phase: 'Phase 6: Rough-Ins (MEP)',
    quantityKey: 'conduit_lf',
    rateRef: { trade: 'Electrical', task: 'Conduit Rough-In' },
    predecessorIds: ['4020'],
    fallbackPredecessorIds: ['1010'],
    requiresTrades: ['Electrical'],
    minDays: 5,
  },
  {
    activityId: '6040',
    name: 'MEP Rough-In Inspections',
    trade: 'Mobilization',
    phase: 'Phase 6: Rough-Ins (MEP)',
    quantityKey: '__fixed__',
    rateRef: { trade: '', task: '' },
    fixedDays: 3,
    predecessorIds: ['6000', '6010', '6020', '6030'],
    fallbackPredecessorIds: ['6030', '6010', '1010'],
  },

  // ── Phase 7: Interior Finishes ────────────────────────────────────────────
  {
    activityId: '7000',
    name: 'Insulation (Batt & Board)',
    trade: 'Framing',
    phase: 'Phase 7: Interior Finishes',
    quantityKey: '__fixed__',
    rateRef: { trade: '', task: '' },
    fixedDays: 5,
    predecessorIds: ['6040'],
    fallbackPredecessorIds: ['6010', '6030', '1010'],
    requiresTrades: ['Framing'],
    minDays: 3,
  },
  {
    activityId: '7010',
    name: 'Drywall Hanging',
    trade: 'Drywall',
    phase: 'Phase 7: Interior Finishes',
    quantityKey: 'drywall_hang_sf',
    rateRef: { trade: 'Drywall', task: 'Drywall Hanging' },
    predecessorIds: ['7000', '6040'],
    fallbackPredecessorIds: ['6010', '6030', '1010'],
    requiresTrades: ['Drywall'],
    minDays: 5,
  },
  {
    activityId: '7020',
    name: 'Drywall Finishing (Level 4)',
    trade: 'Drywall',
    phase: 'Phase 7: Interior Finishes',
    quantityKey: 'drywall_finish_sf',
    rateRef: { trade: 'Drywall', task: 'Drywall Finishing (Level 4)' },
    predecessorIds: ['7010'],
    fallbackPredecessorIds: ['7000'],
    requiresTrades: ['Drywall'],
    minDays: 5,
  },
  {
    activityId: '7030',
    name: 'T-Bar Grid Ceiling Installation',
    trade: 'Drywall',
    phase: 'Phase 7: Interior Finishes',
    quantityKey: 'grid_ceiling_sf',
    rateRef: { trade: 'Drywall', task: 'Grid Ceiling' },
    predecessorIds: ['6040', '7010'],
    fallbackPredecessorIds: ['6010', '6000', '1010'],
    requiresTrades: ['Drywall'],
    minDays: 3,
  },
  {
    activityId: '7040',
    name: 'Interior Paint (Spray)',
    trade: 'Painting',
    phase: 'Phase 7: Interior Finishes',
    quantityKey: 'interior_paint_sf',
    rateRef: { trade: 'Painting', task: 'Interior Wall Paint (Spray)' },
    predecessorIds: ['7020'],
    fallbackPredecessorIds: ['7010'],
    requiresTrades: ['Painting'],
    minDays: 3,
  },
  {
    activityId: '7050',
    name: 'Ceiling Tile Installation',
    trade: 'Drywall',
    phase: 'Phase 7: Interior Finishes',
    quantityKey: 'ceiling_tile_sf',
    rateRef: { trade: 'Drywall', task: 'Ceiling Tile' },
    predecessorIds: ['7030', '7040'],
    fallbackPredecessorIds: ['7030'],
    requiresTrades: ['Drywall'],
    minDays: 2,
  },
  {
    activityId: '7060',
    name: 'Flooring Installation',
    trade: 'Flooring',
    phase: 'Phase 7: Interior Finishes',
    quantityKey: 'flooring_sf',
    rateRef: { trade: 'Flooring', task: 'Carpet Tile' },
    predecessorIds: ['7040'],
    fallbackPredecessorIds: ['7020'],
    requiresTrades: ['Flooring'],
    minDays: 3,
  },

  // ── Phase 8: Final MEP & Specialties ──────────────────────────────────────
  {
    activityId: '8000',
    name: 'HVAC Trim-Out & Equipment Commissioning',
    trade: 'HVAC',
    phase: 'Phase 8: Final MEP & Specialties',
    quantityKey: 'diffusers',
    rateRef: { trade: 'HVAC', task: 'Diffuser' },
    predecessorIds: ['7050', '7040'],
    fallbackPredecessorIds: ['7040', '6010'],
    requiresTrades: ['HVAC'],
    minDays: 3,
  },
  {
    activityId: '8010',
    name: 'Plumbing Finish Fixtures',
    trade: 'Plumbing',
    phase: 'Phase 8: Final MEP & Specialties',
    quantityKey: 'plumbing_fixtures',
    rateRef: { trade: 'Plumbing', task: 'Finish Fixtures' },
    predecessorIds: ['7060', '7040'],
    fallbackPredecessorIds: ['7040', '6020'],
    requiresTrades: ['Plumbing'],
    minDays: 2,
  },
  {
    activityId: '8020',
    name: 'Electrical Trim-Out & Panel Termination',
    trade: 'Electrical',
    phase: 'Phase 8: Final MEP & Specialties',
    quantityKey: 'devices_each',
    rateRef: { trade: 'Electrical', task: 'Device Trim-Out' },
    predecessorIds: ['7040'],
    fallbackPredecessorIds: ['7020'],
    requiresTrades: ['Electrical'],
    minDays: 3,
  },
  {
    activityId: '8030',
    name: 'Fire Sprinkler Trim & Head Install',
    trade: 'Fire Sprinkler',
    phase: 'Phase 8: Final MEP & Specialties',
    quantityKey: 'sprinkler_heads',
    rateRef: { trade: 'Fire Sprinkler', task: 'Head' },
    predecessorIds: ['7050'],
    fallbackPredecessorIds: ['7030'],
    requiresTrades: ['Fire Sprinkler'],
    minDays: 2,
  },
  {
    activityId: '8040',
    name: 'Door Hardware & Finish Hardware',
    trade: 'Doors & Hardware',
    phase: 'Phase 8: Final MEP & Specialties',
    quantityKey: 'hardware_openings',
    rateRef: { trade: 'Doors & Hardware', task: 'Hardware' },
    predecessorIds: ['7060'],
    fallbackPredecessorIds: ['7040'],
    requiresTrades: ['Doors & Hardware'],
    minDays: 2,
  },
  {
    activityId: '8050',
    name: 'Specialties, Millwork & Accessories',
    trade: 'Mobilization',
    phase: 'Phase 8: Final MEP & Specialties',
    quantityKey: '__fixed__',
    rateRef: { trade: '', task: '' },
    fixedDays: 5,
    predecessorIds: ['7060', '7040'],
    fallbackPredecessorIds: ['7040'],
    minDays: 3,
  },
  {
    activityId: '8060',
    name: 'Asphalt Paving & Site Concrete',
    trade: 'Earthwork & Civil',
    phase: 'Phase 8: Final MEP & Specialties',
    quantityKey: 'asphalt_tons',
    rateRef: { trade: 'Earthwork & Civil', task: 'Asphalt Paving' },
    predecessorIds: ['5020'],
    fallbackPredecessorIds: ['5000', '4020'],
    requiresTrades: ['Earthwork & Civil'],
    groundUpOnly: true,
    minDays: 2,
  },
  {
    activityId: '8070',
    name: 'Landscaping & Irrigation',
    trade: 'Landscaping',
    phase: 'Phase 8: Final MEP & Specialties',
    quantityKey: 'landscaping_sf',
    rateRef: { trade: 'Landscaping', task: 'Landscaping' },
    predecessorIds: ['8060'],
    fallbackPredecessorIds: ['8050'],
    requiresTrades: ['Landscaping'],
    minDays: 3,
  },

  // ── Phase 9: Closeout & Punchlist ─────────────────────────────────────────
  {
    activityId: '9000',
    name: 'Punchlist & Deficiency Corrections',
    trade: 'Closeout',
    phase: 'Phase 9: Closeout & Punchlist',
    quantityKey: 'punchlist_items',
    rateRef: { trade: 'Closeout', task: 'Punchlist' },
    predecessorIds: ['8000', '8010', '8020', '8030', '8040', '8050'],
    fallbackPredecessorIds: ['8050', '8020'],
    minDays: 5,
  },
  {
    activityId: '9010',
    name: 'Final Cleaning',
    trade: 'Closeout',
    phase: 'Phase 9: Closeout & Punchlist',
    quantityKey: 'cleaning_sf',
    rateRef: { trade: 'Closeout', task: 'Final Cleaning' },
    predecessorIds: ['9000'],
    fallbackPredecessorIds: ['8050'],
    minDays: 2,
  },
  {
    activityId: '9020',
    name: 'Final Inspections (Life Safety & Building)',
    trade: 'Closeout',
    phase: 'Phase 9: Closeout & Punchlist',
    quantityKey: '__fixed__',
    rateRef: { trade: '', task: '' },
    fixedDays: 5,
    predecessorIds: ['9000'],
    fallbackPredecessorIds: ['8030'],
    minDays: 3,
  },
  {
    activityId: '9030',
    name: 'Certificate of Occupancy & Owner Turnover',
    trade: 'Closeout',
    phase: 'Phase 9: Closeout & Punchlist',
    quantityKey: '__fixed__',
    rateRef: { trade: '', task: '' },
    fixedDays: 3,
    predecessorIds: ['9010', '9020'],
    fallbackPredecessorIds: ['9010'],
    minDays: 1,
  },
];

// ─── Activity Filtering ───────────────────────────────────────────────────────

function filterActivities(
  templates: ActivityTemplate[],
  selectedTrades: string[],
  isGroundUp: boolean
): ActivityTemplate[] {
  // Always include Mobilization + Closeout trades
  const coreAlwaysIncluded = ['Mobilization', 'Closeout'];

  return templates.filter((t) => {
    // Ground-up only check
    if (t.groundUpOnly && !isGroundUp) return false;

    // No trade restriction → always include (Mobilization/Closeout)
    if (!t.requiresTrades || t.requiresTrades.length === 0) return true;

    // Must have at least one required trade selected
    return t.requiresTrades.some((req) => selectedTrades.includes(req));
  });
}

// ─── Dependency Resolution ────────────────────────────────────────────────────

/**
 * Resolves predecessor activity IDs to internal integer IDs.
 * Falls back through fallbackPredecessorIds, then to previous phase gate.
 */
function resolvePredecessors(
  template: ActivityTemplate,
  activityIdToId: Map<string, number>,
  phaseGateId: number | null
): number[] {
  const tryList = [...template.predecessorIds, ...template.fallbackPredecessorIds];
  const resolved: number[] = [];

  for (const pid of tryList) {
    const id = activityIdToId.get(pid);
    if (id !== undefined) {
      resolved.push(id);
      break; // take the first match we can resolve
    }
  }

  // If nothing resolved, use phase gate (last activity of previous phase)
  if (resolved.length === 0 && phaseGateId !== null) {
    resolved.push(phaseGateId);
  }

  // For activities with multiple valid predecessors, grab all that exist
  // (re-run preferred list only for completeness)
  const allResolved = new Set<number>(resolved);
  for (const pid of template.predecessorIds) {
    const id = activityIdToId.get(pid);
    if (id !== undefined) allResolved.add(id);
  }

  return [...allResolved];
}

// ─── Date Utilities ───────────────────────────────────────────────────────────

/** Add N working days to a date string (YYYY-MM-DD), skipping Sat/Sun */
function addWorkingDays(startDateStr: string, days: number): string {
  const d = new Date(startDateStr + 'T00:00:00');
  let added = 0;
  while (added < days) {
    d.setDate(d.getDate() + 1);
    const dow = d.getDay(); // 0=Sun, 6=Sat
    if (dow !== 0 && dow !== 6) added++;
  }
  return d.toISOString().slice(0, 10);
}

/** Convert a working-day offset from project start to a calendar date */
function workingDayToDate(projectStart: string, workingDayOffset: number): string {
  if (workingDayOffset === 0) return projectStart;
  return addWorkingDays(projectStart, workingDayOffset);
}

/** Count calendar days between two dates */
function calendarDaysBetween(start: string, end: string): number {
  const a = new Date(start + 'T00:00:00');
  const b = new Date(end + 'T00:00:00');
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

// ─── CPM Algorithm ────────────────────────────────────────────────────────────

/**
 * Forward + Backward pass CPM.
 * Returns ES, EF, LS, LF, Float, and critical path array.
 */
function computeCPM(activities: ScheduleActivity[]): ScheduleActivity[] {
  const n = activities.length;
  if (n === 0) return activities;

  // Build ID → index map
  const idx = new Map<number, number>();
  activities.forEach((a, i) => idx.set(a.id, i));

  // Build successor list
  const successors: number[][] = Array.from({ length: n }, () => []);
  activities.forEach((a, i) => {
    a.predecessors.forEach((pid) => {
      const pi = idx.get(pid);
      if (pi !== undefined) successors[pi].push(i);
    });
  });

  // Working-day arrays
  const ES = new Array<number>(n).fill(0);
  const EF = new Array<number>(n).fill(0);
  const LS = new Array<number>(n).fill(0);
  const LF = new Array<number>(n).fill(0);

  // ── Forward Pass (topological order, activities are already sorted by phase/id) ──
  // Build in-degree for toposort
  const inDeg = new Array<number>(n).fill(0);
  activities.forEach((a, i) => {
    a.predecessors.forEach((pid) => {
      const pi = idx.get(pid);
      if (pi !== undefined) inDeg[i]++;
    });
  });

  const queue: number[] = [];
  inDeg.forEach((d, i) => { if (d === 0) queue.push(i); });
  const topoOrder: number[] = [];

  while (queue.length > 0) {
    const i = queue.shift()!;
    topoOrder.push(i);
    successors[i].forEach((j) => {
      inDeg[j]--;
      if (inDeg[j] === 0) queue.push(j);
    });
  }

  // Forward pass
  topoOrder.forEach((i) => {
    const a = activities[i];
    let maxPredEF = 0;
    a.predecessors.forEach((pid) => {
      const pi = idx.get(pid);
      if (pi !== undefined) maxPredEF = Math.max(maxPredEF, EF[pi]);
    });
    ES[i] = maxPredEF;
    EF[i] = ES[i] + a.duration;
  });

  // ── Backward Pass ──
  const projectEnd = Math.max(...EF);
  LF.fill(0);
  LS.fill(0);

  // Initialize: sinks get LF = projectEnd
  topoOrder.slice().reverse().forEach((i) => {
    if (successors[i].length === 0) {
      LF[i] = projectEnd;
    } else {
      LF[i] = Math.min(...successors[i].map((j) => LS[j]));
    }
    LS[i] = LF[i] - activities[i].duration;
  });

  // ── Assign results ──
  activities.forEach((a, i) => {
    a.totalFloat = LS[i] - ES[i];
    a.isCritical = a.totalFloat === 0;
  });

  return activities;
}

// ─── Delivery → Construction Activity Links ──────────────────────────────────
//
// Maps the last "Delivery" activityId in each procurement chain to a substring
// that must appear in the matching construction activity's name. The CPM engine
// will then decide whether the procurement or construction path is critical.

const DELIVERY_LINKS: Record<string, string> = {
  P104:  'Steel Erection',     // → Structural Steel Erection (4000)
  P304:  'Storefront',         // → Storefront & Glazing (5010)
  P404:  'Hollow Metal',       // → Hollow Metal Doors & Frames (5030)
  P504:  'HVAC Rough',         // → HVAC Rough — Ductwork (6010)
  P604:  'Sprinkler Rough',    // → Fire Sprinkler Rough-In (6000)
  P704:  'Electrical Conduit', // → Electrical Conduit Rough-In (6030)
  P803:  'Roofing',            // → Roofing System (5000)
  P904:  'Millwork',           // → Specialties, Millwork (8050)
  P1003: 'Flooring',           // → Flooring Installation (7060)
  P1103: 'CMU',                // → Masonry (CMU Block) (4030)
  P1204: 'Footing',            // → Form & Pour Footings (3010)
};

// ─── Main Engine ──────────────────────────────────────────────────────────────

export function generateSchedule(input: ScheduleInput): GeneratedSchedule {
  const {
    projectName,
    buildingType,
    structureType = 'Structural Steel Frame Structures',
    totalSF,
    stories,
    isGroundUp,
    selectedTrades,
    quantities: userQuantities = {},
    startDate,
  } = input;

  // 1. Estimate quantities, merge with user overrides
  const estQ = estimateQuantities(totalSF, stories, isGroundUp);
  const quantities: Record<string, number> = { ...estQ, ...userQuantities };

  // 2. Filter activity templates — procurement chains + base + structure-type additions
  const structureAdditions = isGroundUp
    ? (STRUCTURE_TYPE_TEMPLATES[structureType] ?? [])
    : [];
  // Procurement templates run from day 1 alongside early site work.
  // filterActivities uses requiresTrades to include only relevant chains.
  const combinedTemplate = [
    ...PROCUREMENT_TEMPLATES,
    ...MASTER_TEMPLATE,
    ...structureAdditions,
  ];
  const filtered = filterActivities(combinedTemplate, selectedTrades, isGroundUp);

  // 3. Assign sequential IDs + build activityId→id map
  const activityIdToId = new Map<string, number>();
  filtered.forEach((t, i) => activityIdToId.set(t.activityId, i + 1));

  // Track last activity per phase for fallback gates
  const phaseLastId = new Map<string, number>();
  filtered.forEach((t, i) => phaseLastId.set(t.phase, i + 1));

  // 4. Build ScheduleActivity list with durations
  const activities: ScheduleActivity[] = filtered.map((t, i) => {
    const id = i + 1;

    // Calculate duration
    let duration: number;
    if (t.scaledFixed !== undefined) {
      duration = Math.max(t.minDays ?? 1, t.scaledFixed(totalSF, stories));
    } else if (t.fixedDays !== undefined) {
      duration = t.fixedDays;
    } else {
      const qty = quantities[t.quantityKey] ?? 0;
      const rate = lookupRate(t.rateRef.trade, t.rateRef.task);
      const mid = rate?.ratePerDay.mid ?? 1;
      duration = calcDuration(qty, mid, stories, isGroundUp, t.minDays ?? 1, t.maxDays ?? 999);
    }

    // Resolve predecessors
    const phaseOrder = [
      'Phase 0: Procurement & Submittals',
      'Phase 1: Pre-Construction & Mobilization',
      'Phase 2: Site Work & Earthwork',
      'Phase 3: Foundations',
      'Phase 4: Structure',
      'Phase 5: Building Envelope',
      'Phase 6: Rough-Ins (MEP)',
      'Phase 7: Interior Finishes',
      'Phase 8: Final MEP & Specialties',
      'Phase 9: Closeout & Punchlist',
    ];
    const phaseIdx = phaseOrder.indexOf(t.phase);
    const prevPhase = phaseIdx > 0 ? phaseOrder[phaseIdx - 1] : null;
    const phaseGateId = prevPhase ? (phaseLastId.get(prevPhase) ?? null) : null;

    const predecessors = resolvePredecessors(t, activityIdToId, phaseGateId);

    return {
      id,
      activityId: t.activityId,
      name: t.name,
      trade: t.trade,
      phase: t.phase,
      duration,
      predecessors,
    } as ScheduleActivity;
  });

  // 4b. Link procurement delivery activities to matching construction activities.
  //     This must happen AFTER the activities array is built (IDs are assigned)
  //     but BEFORE CPM so the engine sees the full dependency graph.
  for (const [deliveryActId, linkSubstr] of Object.entries(DELIVERY_LINKS)) {
    const deliveryAct = activities.find((a) => a.activityId === deliveryActId);
    if (!deliveryAct) continue;

    // Find the first non-procurement activity whose name contains linkSubstr
    const constructionAct = activities.find(
      (a) =>
        !a.phase.startsWith('Phase 0') &&
        a.activityId !== deliveryActId &&
        a.name.toLowerCase().includes(linkSubstr.toLowerCase())
    );
    if (!constructionAct) continue;

    if (!constructionAct.predecessors.includes(deliveryAct.id)) {
      constructionAct.predecessors.push(deliveryAct.id);
    }
  }

  // 5. CPM calculation (assigns totalFloat, isCritical to each activity)
  computeCPM(activities);

  // 6. Convert working-day offsets to calendar dates
  const idToActivity = new Map<number, ScheduleActivity>();
  activities.forEach((a) => idToActivity.set(a.id, a));

  // We need ES/EF values — re-extract from CPM result
  // CPM modifies activities in place but doesn't store numeric ES/EF
  // Re-run to get numeric values for date conversion
  const n = activities.length;
  const idx2 = new Map<number, number>();
  activities.forEach((a, i) => idx2.set(a.id, i));

  const ES2 = new Array<number>(n).fill(0);
  const EF2 = new Array<number>(n).fill(0);
  const LS2 = new Array<number>(n).fill(0);
  const LF2 = new Array<number>(n).fill(0);

  // Rebuild successors
  const succ2: number[][] = Array.from({ length: n }, () => []);
  activities.forEach((a, i) => {
    a.predecessors.forEach((pid) => {
      const pi = idx2.get(pid);
      if (pi !== undefined) succ2[pi].push(i);
    });
  });

  // Topological sort (BFS Kahn's)
  const inDeg2 = new Array<number>(n).fill(0);
  activities.forEach((a, i) => {
    a.predecessors.forEach((pid) => {
      if (idx2.has(pid)) inDeg2[i]++;
    });
  });
  const q: number[] = [];
  inDeg2.forEach((d, i) => { if (d === 0) q.push(i); });
  const topo2: number[] = [];
  const tempQ = [...q];
  while (tempQ.length > 0) {
    const i = tempQ.shift()!;
    topo2.push(i);
    succ2[i].forEach((j) => { inDeg2[j]--; if (inDeg2[j] === 0) tempQ.push(j); });
  }

  // Forward pass (working days)
  topo2.forEach((i) => {
    const a = activities[i];
    let maxPredEF = 0;
    a.predecessors.forEach((pid) => {
      const pi = idx2.get(pid);
      if (pi !== undefined) maxPredEF = Math.max(maxPredEF, EF2[pi]);
    });
    ES2[i] = maxPredEF;
    EF2[i] = ES2[i] + a.duration;
  });

  const projectEndDay = Math.max(...EF2, 1);

  // Backward pass
  const LS2arr = new Array<number>(n).fill(projectEndDay);
  const LF2arr = new Array<number>(n).fill(projectEndDay);
  topo2.slice().reverse().forEach((i) => {
    if (succ2[i].length === 0) {
      LF2arr[i] = projectEndDay;
    } else {
      LF2arr[i] = Math.min(...succ2[i].map((j) => LS2arr[j]));
    }
    LS2arr[i] = LF2arr[i] - activities[i].duration;
  });

  // Assign calendar dates + float
  activities.forEach((a, i) => {
    a.earlyStart = workingDayToDate(startDate, ES2[i]);
    a.earlyFinish = workingDayToDate(startDate, EF2[i]);
    a.lateStart = workingDayToDate(startDate, LS2arr[i]);
    a.lateFinish = workingDayToDate(startDate, LF2arr[i]);
    a.totalFloat = LS2arr[i] - ES2[i];
    a.isCritical = a.totalFloat === 0;
  });

  // 7. Build critical path list
  const criticalPath = activities.filter((a) => a.isCritical).map((a) => a.id);

  // 8. Calculate end date
  const endDate = workingDayToDate(startDate, projectEndDay);
  const totalCalDays = calendarDaysBetween(startDate, endDate);

  // 9. Build summary
  const phaseMap = new Map<string, number>();
  activities.forEach((a, i) => {
    const phaseStart = ES2[i];
    const phaseEnd = EF2[i];
    const existing = phaseMap.get(a.phase) ?? 0;
    phaseMap.set(a.phase, Math.max(existing, phaseEnd));
  });

  // Phase durations: difference between phase start (min ES) and phase end (max EF)
  const phaseSummary: { name: string; duration: number }[] = [];
  const phaseNames = [...new Set(activities.map((a) => a.phase))];
  phaseNames.forEach((ph) => {
    const pActs = activities.filter((a) => a.phase === ph);
    const minES = Math.min(...pActs.map((_, ii) => ES2[activities.indexOf(_)]));
    const maxEF = Math.max(...pActs.map((_, ii) => EF2[activities.indexOf(_)]));
    phaseSummary.push({ name: ph, duration: maxEF - minES });
  });

  const tradeMap = new Map<string, { activities: number; days: number }>();
  activities.forEach((a) => {
    const existing = tradeMap.get(a.trade) ?? { activities: 0, days: 0 };
    tradeMap.set(a.trade, {
      activities: existing.activities + 1,
      days: existing.days + a.duration,
    });
  });
  const tradeBreakdown = [...tradeMap.entries()].map(([trade, s]) => ({
    trade,
    ...s,
  }));

  return {
    projectName,
    totalDuration: totalCalDays,
    startDate,
    endDate,
    activities,
    criticalPath,
    summary: {
      totalActivities: activities.length,
      totalDuration: projectEndDay,
      phases: phaseSummary,
      tradeBreakdown,
    },
  };
}

