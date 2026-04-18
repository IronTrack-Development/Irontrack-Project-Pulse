// Production Rates — National Averages
// Source: Kevin's cheatsheet (national averages, experienced crews)
// Mid = (low + high) / 2, used as default calculation rate

export interface ProductionRate {
  trade: string;
  task: string;
  unit: string; // SF, LF, CY, each, tons, lbs, etc.
  ratePerDay: { low: number; mid: number; high: number };
  crewSize?: string;
  notes?: string;
}

export const PRODUCTION_RATES: ProductionRate[] = [
  // ─── EARTHWORK & CIVIL ────────────────────────────────────────────────────

  {
    trade: 'Earthwork & Civil',
    task: 'Mass Grading (Large Equipment)',
    unit: 'CY',
    ratePerDay: { low: 2000, mid: 3500, high: 5000 },
    crewSize: 'Large scrapers/dozers',
    notes: 'Use for large site work (5+ acres)',
  },
  {
    trade: 'Earthwork & Civil',
    task: 'Mass Grading (Small Equipment)',
    unit: 'CY',
    ratePerDay: { low: 300, mid: 600, high: 900 },
    crewSize: 'Small dozers/excavators',
    notes: 'Standard commercial site (<5 acres)',
  },
  {
    trade: 'Earthwork & Civil',
    task: 'Fine Grading',
    unit: 'SF',
    ratePerDay: { low: 10000, mid: 15000, high: 20000 },
    notes: 'Final subgrade prep',
  },
  {
    trade: 'Earthwork & Civil',
    task: 'Asphalt Paving',
    unit: 'tons',
    ratePerDay: { low: 600, mid: 900, high: 1200 },
    notes: 'Full paving crew with roller',
  },
  {
    trade: 'Earthwork & Civil',
    task: 'Trenching (Wet Utilities - Normal)',
    unit: 'LF',
    ratePerDay: { low: 80, mid: 115, high: 150 },
    notes: 'Normal conditions; no rock/shoring',
  },
  {
    trade: 'Earthwork & Civil',
    task: 'Trenching (Wet Utilities - Deep/Rock)',
    unit: 'LF',
    ratePerDay: { low: 40, mid: 60, high: 80 },
    notes: 'Deep cut, rock, or shoring required',
  },
  {
    trade: 'Earthwork & Civil',
    task: 'Storm Drain Installation',
    unit: 'LF',
    ratePerDay: { low: 50, mid: 85, high: 120 },
    notes: 'RCP or HDPE storm pipe with structures',
  },
  {
    trade: 'Earthwork & Civil',
    task: 'Dry Utilities (Conduit in Trench)',
    unit: 'LF',
    ratePerDay: { low: 150, mid: 225, high: 300 },
    notes: 'Shallow trench + conduit only',
  },

  // ─── CONCRETE ────────────────────────────────────────────────────────────

  {
    trade: 'Concrete',
    task: 'Concrete Flatwork',
    unit: 'SF',
    ratePerDay: { low: 8000, mid: 10000, high: 12000 },
    notes: 'Slab on grade, decent flatwork crew',
  },
  {
    trade: 'Concrete',
    task: 'Foundations / Footings',
    unit: 'LF',
    ratePerDay: { low: 150, mid: 225, high: 300 },
    notes: 'Form, rebar, and pour; includes all sizes',
  },
  {
    trade: 'Concrete',
    task: 'Tilt-Up Panels',
    unit: 'each',
    ratePerDay: { low: 8, mid: 10, high: 12 },
    notes: 'Erection day only (after casting)',
  },
  {
    trade: 'Concrete',
    task: 'Slab on Grade Prep',
    unit: 'SF',
    ratePerDay: { low: 6000, mid: 8000, high: 10000 },
    notes: 'Base, vapor barrier, mesh/rebar, screed chairs',
  },
  {
    trade: 'Concrete',
    task: 'Concrete Pours (Walls/Columns)',
    unit: 'CY',
    ratePerDay: { low: 60, mid: 90, high: 120 },
    notes: 'Forming + placing; includes walls and columns',
  },

  // ─── MASONRY ─────────────────────────────────────────────────────────────

  {
    trade: 'Masonry',
    task: 'CMU Block (8x8x16)',
    unit: 'each',
    ratePerDay: { low: 500, mid: 700, high: 900 },
    crewSize: '4–5 man crew',
    notes: 'Standard commercial CMU; 1,000–1,200 for high-performance crew',
  },
  {
    trade: 'Masonry',
    task: 'Brick Veneer',
    unit: 'each',
    ratePerDay: { low: 700, mid: 950, high: 1200 },
    notes: 'Full veneer brick, mortar, ties',
  },
  {
    trade: 'Masonry',
    task: 'CMU Grouting',
    unit: 'CY',
    ratePerDay: { low: 64, mid: 80, high: 96 },
    notes: '8–12 CY/hr × 8 hr day; cell grouting',
  },

  // ─── STRUCTURAL STEEL ────────────────────────────────────────────────────

  {
    trade: 'Structural Steel',
    task: 'Steel Erection (Standard)',
    unit: 'tons',
    ratePerDay: { low: 25, mid: 32.5, high: 40 },
    notes: 'Open site, standard commercial',
  },
  {
    trade: 'Structural Steel',
    task: 'Steel Erection (Tight Urban/Multi-Story)',
    unit: 'tons',
    ratePerDay: { low: 15, mid: 20, high: 25 },
    notes: 'Constrained access or high-rise conditions',
  },
  {
    trade: 'Structural Steel',
    task: 'Metal Decking',
    unit: 'SF',
    ratePerDay: { low: 8000, mid: 10000, high: 12000 },
    notes: 'Composite or form deck, welded',
  },
  {
    trade: 'Structural Steel',
    task: 'Joists & Girders',
    unit: 'each',
    ratePerDay: { low: 30, mid: 45, high: 60 },
    notes: 'Open-web steel joists and girder erection',
  },

  // ─── CARPENTRY / FRAMING ─────────────────────────────────────────────────

  {
    trade: 'Framing',
    task: 'Metal Stud Framing (Interior)',
    unit: 'SF',
    ratePerDay: { low: 1400, mid: 1900, high: 2400 },
    crewSize: '10–12 man crew',
    notes: '7,000–12,000 SF/week per crew; converted to daily',
  },
  {
    trade: 'Framing',
    task: 'Wood Framing (Multifamily/Light Commercial)',
    unit: 'SF',
    ratePerDay: { low: 4000, mid: 5000, high: 6000 },
    notes: 'Floor area per day, full framing crew',
  },
  {
    trade: 'Framing',
    task: 'Blocking',
    unit: 'LF',
    ratePerDay: { low: 80, mid: 115, high: 150 },
    notes: 'Per man per day; scale by crew size',
  },

  // ─── DRYWALL ─────────────────────────────────────────────────────────────

  {
    trade: 'Drywall',
    task: 'Drywall Hanging',
    unit: 'SF',
    ratePerDay: { low: 4000, mid: 5000, high: 6000 },
    crewSize: '8–10 man crew',
    notes: 'Board only; standard 5/8" or 1/2"',
  },
  {
    trade: 'Drywall',
    task: 'Drywall Finishing (Level 4)',
    unit: 'SF',
    ratePerDay: { low: 3000, mid: 4000, high: 5000 },
    notes: 'Tape, bed, coat, sand — standard commercial',
  },
  {
    trade: 'Drywall',
    task: 'Drywall Finishing (Level 5)',
    unit: 'SF',
    ratePerDay: { low: 1500, mid: 2250, high: 3000 },
    notes: 'Skimcoat finish; high-end or hospital',
  },
  {
    trade: 'Drywall',
    task: 'Grid Ceiling / T-Bar Frame',
    unit: 'SF',
    ratePerDay: { low: 2000, mid: 3000, high: 4000 },
    notes: 'Main runners and cross tees',
  },
  {
    trade: 'Drywall',
    task: 'Ceiling Tile Installation',
    unit: 'SF',
    ratePerDay: { low: 3000, mid: 4000, high: 5000 },
    notes: 'ACT tiles in existing or new grid',
  },

  // ─── FIRE SPRINKLER ──────────────────────────────────────────────────────

  {
    trade: 'Fire Sprinkler',
    task: 'Sprinkler Pipe Installation',
    unit: 'LF',
    ratePerDay: { low: 300, mid: 450, high: 600 },
    crewSize: '3–5 man crew',
    notes: 'Mains + branches; wet system',
  },
  {
    trade: 'Fire Sprinkler',
    task: 'Sprinkler Head Installation',
    unit: 'each',
    ratePerDay: { low: 80, mid: 115, high: 150 },
    notes: 'Trim and heads after drywall',
  },

  // ─── HVAC ─────────────────────────────────────────────────────────────────

  {
    trade: 'HVAC',
    task: 'Ductwork Installation (Sheet Metal)',
    unit: 'lbs',
    ratePerDay: { low: 600, mid: 1050, high: 1500 },
    notes: 'Fabricated sheet metal; good crews hit 1,500+ lbs/day',
  },
  {
    trade: 'HVAC',
    task: 'VAV/RTU Unit Installation',
    unit: 'each',
    ratePerDay: { low: 2, mid: 3, high: 4 },
    notes: 'Set and make connections; excludes startup',
  },
  {
    trade: 'HVAC',
    task: 'Diffuser/Grille Installation',
    unit: 'each',
    ratePerDay: { low: 40, mid: 60, high: 80 },
    notes: 'Supply/return air devices',
  },
  {
    trade: 'HVAC',
    task: 'Hydronic Piping',
    unit: 'LF',
    ratePerDay: { low: 80, mid: 115, high: 150 },
    notes: 'Chilled/hot water piping; welded or grooved',
  },

  // ─── PLUMBING ─────────────────────────────────────────────────────────────

  {
    trade: 'Plumbing',
    task: 'Underground Plumbing',
    unit: 'LF',
    ratePerDay: { low: 120, mid: 185, high: 250 },
    notes: 'Below-slab waste, sanitary, and water service',
  },
  {
    trade: 'Plumbing',
    task: 'Plumbing Rough-In',
    unit: 'SF',
    ratePerDay: { low: 800, mid: 1000, high: 1200 },
    notes: 'Above-grade rough pipe per crew per day',
  },
  {
    trade: 'Plumbing',
    task: 'Plumbing Finish Fixtures',
    unit: 'each',
    ratePerDay: { low: 20, mid: 30, high: 40 },
    notes: 'Set, connect, and test fixtures',
  },

  // ─── ELECTRICAL ───────────────────────────────────────────────────────────

  {
    trade: 'Electrical',
    task: 'Conduit Rough-In',
    unit: 'LF',
    ratePerDay: { low: 250, mid: 425, high: 600 },
    notes: 'EMT or rigid conduit, all sizes',
  },
  {
    trade: 'Electrical',
    task: 'Branch Wiring',
    unit: 'SF',
    ratePerDay: { low: 3000, mid: 4500, high: 6000 },
    notes: 'MC cable or wire-in-conduit; building area per day',
  },
  {
    trade: 'Electrical',
    task: 'Device Trim-Out',
    unit: 'each',
    ratePerDay: { low: 30, mid: 45, high: 60 },
    notes: 'Devices, plates, and connections',
  },
  {
    trade: 'Electrical',
    task: 'Panel Setting & Termination',
    unit: 'each',
    ratePerDay: { low: 1, mid: 2, high: 3 },
    notes: 'Distribution panels and MCCs',
  },

  // ─── WINDOWS / GLAZING ───────────────────────────────────────────────────

  {
    trade: 'Windows & Glazing',
    task: 'Storefront System',
    unit: 'SF',
    ratePerDay: { low: 800, mid: 1150, high: 1500 },
    notes: 'Aluminum frame + glass storefront; includes sills',
  },
  {
    trade: 'Windows & Glazing',
    task: 'Curtainwall System',
    unit: 'SF',
    ratePerDay: { low: 300, mid: 450, high: 600 },
    notes: 'Structural curtainwall; includes stick or unitized',
  },
  {
    trade: 'Windows & Glazing',
    task: 'Doors & Frames (Install)',
    unit: 'each',
    ratePerDay: { low: 15, mid: 20, high: 25 },
    notes: 'Frame set, door hang, closer, and basic hardware',
  },

  // ─── EXTERIOR FINISHES ───────────────────────────────────────────────────

  {
    trade: 'Exterior Finishes',
    task: 'Stucco (3-Coat)',
    unit: 'SF',
    ratePerDay: { low: 2000, mid: 3000, high: 4000 },
    crewSize: 'Per crew',
    notes: 'Scratch, brown, and finish coats',
  },
  {
    trade: 'Exterior Finishes',
    task: 'EIFS (Exterior Insulation Finish System)',
    unit: 'SF',
    ratePerDay: { low: 1500, mid: 2000, high: 2500 },
    notes: 'Includes foam board, mesh, base coat, and finish',
  },
  {
    trade: 'Exterior Finishes',
    task: 'Fiber Cement Siding',
    unit: 'SF',
    ratePerDay: { low: 800, mid: 1200, high: 1600 },
    notes: 'HardiePlank or similar; includes WRB and trim',
  },

  // ─── ROOFING ─────────────────────────────────────────────────────────────

  {
    trade: 'Roofing',
    task: 'TPO / EPDM Membrane',
    unit: 'SF',
    ratePerDay: { low: 7000, mid: 9500, high: 12000 },
    notes: 'Fully adhered or mechanically fastened membrane',
  },
  {
    trade: 'Roofing',
    task: 'Asphalt Shingles',
    unit: 'SF',
    ratePerDay: { low: 2500, mid: 3500, high: 4500 },
    notes: '25–45 squares/day × 100 SF/square',
  },
  {
    trade: 'Roofing',
    task: 'Metal Roofing (Standing Seam)',
    unit: 'SF',
    ratePerDay: { low: 1500, mid: 2250, high: 3000 },
    notes: 'Standing seam panels; includes underlayment',
  },

  // ─── DOORS / HARDWARE ────────────────────────────────────────────────────

  {
    trade: 'Doors & Hardware',
    task: 'Hollow Metal Doors (Frame/Set/Hardware)',
    unit: 'each',
    ratePerDay: { low: 8, mid: 10, high: 12 },
    notes: 'HM frame, slab, closer, lever/lockset',
  },
  {
    trade: 'Doors & Hardware',
    task: 'Wood Doors (Interior)',
    unit: 'each',
    ratePerDay: { low: 6, mid: 8, high: 10 },
    notes: 'Wood slab in pre-hung frame',
  },
  {
    trade: 'Doors & Hardware',
    task: 'Door Hardware (Finish Hardware)',
    unit: 'each',
    ratePerDay: { low: 10, mid: 15, high: 20 },
    notes: 'Complete openings: knobs/levers, closers, stops',
  },

  // ─── PAINT ───────────────────────────────────────────────────────────────

  {
    trade: 'Painting',
    task: 'Interior Wall Paint (Spray)',
    unit: 'SF',
    ratePerDay: { low: 8000, mid: 11500, high: 15000 },
    notes: 'Airless spray; prime + 2 coats',
  },
  {
    trade: 'Painting',
    task: 'Interior Wall Paint (Roller)',
    unit: 'SF',
    ratePerDay: { low: 3000, mid: 4500, high: 6000 },
    notes: 'Roll + cut; standard latex',
  },
  {
    trade: 'Painting',
    task: 'Exterior Paint',
    unit: 'SF',
    ratePerDay: { low: 4000, mid: 6000, high: 8000 },
    notes: 'Spray or roller; acrylic over stucco/CMU',
  },

  // ─── FLOORING ────────────────────────────────────────────────────────────

  {
    trade: 'Flooring',
    task: 'Carpet Tile',
    unit: 'SF',
    ratePerDay: { low: 1500, mid: 2250, high: 3000 },
    notes: 'Peel-and-stick or glue-down modules',
  },
  {
    trade: 'Flooring',
    task: 'LVT / LVP (Luxury Vinyl)',
    unit: 'SF',
    ratePerDay: { low: 1000, mid: 1500, high: 2000 },
    notes: 'Click or glue-down; includes prep',
  },
  {
    trade: 'Flooring',
    task: 'Ceramic / Porcelain Tile',
    unit: 'SF',
    ratePerDay: { low: 300, mid: 450, high: 600 },
    notes: 'Thinset, layout, grout — standard 12x12 or 24x24',
  },
  {
    trade: 'Flooring',
    task: 'Polished Concrete',
    unit: 'SF',
    ratePerDay: { low: 6000, mid: 8000, high: 10000 },
    notes: 'Grind, polish, and seal existing slab',
  },

  // ─── LANDSCAPING ─────────────────────────────────────────────────────────

  {
    trade: 'Landscaping',
    task: 'Landscaping (Basic Plantings)',
    unit: 'SF',
    ratePerDay: { low: 5000, mid: 7500, high: 10000 },
    notes: 'Topsoil, groundcover, shrubs, and small trees',
  },
  {
    trade: 'Landscaping',
    task: 'Irrigation System',
    unit: 'LF',
    ratePerDay: { low: 400, mid: 600, high: 800 },
    notes: 'Mainline and lateral pipe install',
  },

  // ─── CLOSEOUT ─────────────────────────────────────────────────────────────

  {
    trade: 'Closeout',
    task: 'Punchlist Completion',
    unit: 'each',
    ratePerDay: { low: 20, mid: 30, high: 40 },
    notes: 'Items per crew per day; varies by complexity',
  },
  {
    trade: 'Closeout',
    task: 'Final Cleaning',
    unit: 'SF',
    ratePerDay: { low: 8000, mid: 11500, high: 15000 },
    notes: 'Construction clean; includes glass polish',
  },
];

// ─── Lookup helpers ──────────────────────────────────────────────────────────

/** Get production rate by trade + partial task name match */
export function getRate(trade: string, taskFragment: string): ProductionRate | undefined {
  return PRODUCTION_RATES.find(
    (r) =>
      r.trade.toLowerCase() === trade.toLowerCase() &&
      r.task.toLowerCase().includes(taskFragment.toLowerCase())
  );
}

/** All unique trade names */
export const ALL_TRADES: string[] = [
  ...new Set(PRODUCTION_RATES.map((r) => r.trade)),
];

/** Default trades selected by building type */
export const BUILDING_TYPE_DEFAULTS: Record<string, string[]> = {
  'Restaurant TI': [
    'Framing', 'Drywall', 'HVAC', 'Plumbing', 'Electrical',
    'Fire Sprinkler', 'Painting', 'Flooring', 'Doors & Hardware',
    'Windows & Glazing',
  ],
  Hotel: [
    'Concrete', 'Structural Steel', 'Framing', 'Drywall', 'HVAC',
    'Plumbing', 'Electrical', 'Fire Sprinkler', 'Roofing',
    'Painting', 'Flooring', 'Doors & Hardware', 'Windows & Glazing',
    'Exterior Finishes', 'Landscaping',
  ],
  'Self-Storage': [
    'Earthwork & Civil', 'Concrete', 'Structural Steel', 'Roofing',
    'Electrical', 'Doors & Hardware', 'Painting',
  ],
  'Retail TI': [
    'Framing', 'Drywall', 'HVAC', 'Plumbing', 'Electrical',
    'Fire Sprinkler', 'Painting', 'Flooring', 'Doors & Hardware',
    'Windows & Glazing',
  ],
  'Office TI': [
    'Framing', 'Drywall', 'HVAC', 'Plumbing', 'Electrical',
    'Fire Sprinkler', 'Painting', 'Flooring', 'Doors & Hardware',
    'Windows & Glazing',
  ],
  Industrial: [
    'Earthwork & Civil', 'Concrete', 'Structural Steel', 'Masonry',
    'Roofing', 'HVAC', 'Plumbing', 'Electrical', 'Fire Sprinkler',
    'Doors & Hardware', 'Windows & Glazing', 'Painting',
  ],
  Medical: [
    'Framing', 'Drywall', 'HVAC', 'Plumbing', 'Electrical',
    'Fire Sprinkler', 'Painting', 'Flooring', 'Doors & Hardware',
    'Windows & Glazing', 'Exterior Finishes',
  ],
  Education: [
    'Earthwork & Civil', 'Concrete', 'Masonry', 'Framing', 'Drywall',
    'HVAC', 'Plumbing', 'Electrical', 'Fire Sprinkler', 'Roofing',
    'Painting', 'Flooring', 'Doors & Hardware', 'Windows & Glazing',
    'Exterior Finishes', 'Landscaping',
  ],
  'Multi-Family': [
    'Earthwork & Civil', 'Concrete', 'Framing', 'Drywall', 'HVAC',
    'Plumbing', 'Electrical', 'Fire Sprinkler', 'Roofing',
    'Painting', 'Flooring', 'Doors & Hardware', 'Windows & Glazing',
    'Exterior Finishes', 'Landscaping',
  ],
  'Ground-Up Commercial': [
    'Earthwork & Civil', 'Concrete', 'Structural Steel', 'Masonry',
    'Framing', 'Drywall', 'HVAC', 'Plumbing', 'Electrical',
    'Fire Sprinkler', 'Roofing', 'Painting', 'Flooring',
    'Doors & Hardware', 'Windows & Glazing', 'Exterior Finishes',
    'Landscaping',
  ],
  'Mixed-Use': [
    'Earthwork & Civil', 'Concrete', 'Structural Steel', 'Masonry',
    'Framing', 'Drywall', 'HVAC', 'Plumbing', 'Electrical',
    'Fire Sprinkler', 'Roofing', 'Painting', 'Flooring',
    'Doors & Hardware', 'Windows & Glazing', 'Exterior Finishes',
    'Landscaping',
  ],
};

export const BUILDING_TYPES = Object.keys(BUILDING_TYPE_DEFAULTS);
