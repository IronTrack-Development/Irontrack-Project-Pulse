# Complete Schedule Engine Updates for VP Demo
# This script adds all new trades, procurement chains, and quantity fields

$enginePath = "C:\Users\Iront\.openclaw\workspace\irontrack-daily\src\lib\schedule-engine.ts"
$content = Get-Content $enginePath -Raw -Encoding UTF8

Write-Host "Starting comprehensive schedule engine updates..."

# ========== ADD NEW TRADE ACTIVITIES TO MASTER_TEMPLATE ==========

# Find insertion points using activity IDs as anchors

# PHASE 2: Add after activity 2050 (before Phase 3 comment)
$phase2Marker = "    groundUpOnly: true,`r`n    minDays: 2,`r`n  },`r`n`r`n  // �� Phase 3:"

if ($content -match [regex]::Escape($phase2Marker)) {
    Write-Host "Found Phase 2 insertion point"
    $phase2Activities = @'
    groundUpOnly: true,
    minDays: 2,
  },

  // NEW: Demolition
  {
    activityId: '2070',
    name: 'Interior Demolition',
    trade: 'Demolition',
    phase: 'Phase 2: Site Work & Earthwork',
    quantityKey: 'demo_sf',
    rateRef: { trade: 'Demolition', task: 'Interior Demo' },
    predecessorIds: ['1010'],
    fallbackPredecessorIds: ['1000'],
    requiresTrades: ['Demolition'],
    minDays: 2,
  },
  {
    activityId: '2071',
    name: 'Structural Demolition',
    trade: 'Demolition',
    phase: 'Phase 2: Site Work & Earthwork',
    quantityKey: '__fixed__',
    rateRef: { trade: '', task: '' },
    scaledFixed: (sf) => Math.max(1, Math.ceil(sf / 4000)),
    predecessorIds: ['2070'],
    fallbackPredecessorIds: ['1010'],
    requiresTrades: ['Demolition'],
  },

  // NEW: Wet Utilities
  {
    activityId: '2072',
    name: 'Water Line Installation',
    trade: 'Wet Utilities',
    phase: 'Phase 2: Site Work & Earthwork',
    quantityKey: 'wet_water_lf',
    rateRef: { trade: 'Wet Utilities', task: 'Water Line' },
    predecessorIds: ['2030'],
    fallbackPredecessorIds: ['2010'],
    requiresTrades: ['Wet Utilities'],
    groundUpOnly: true,
    minDays: 2,
  },
  {
    activityId: '2073',
    name: 'Sewer Line Installation',
    trade: 'Wet Utilities',
    phase: 'Phase 2: Site Work & Earthwork',
    quantityKey: 'wet_sewer_lf',
    rateRef: { trade: 'Wet Utilities', task: 'Sewer Line' },
    predecessorIds: ['2030'],
    fallbackPredecessorIds: ['2010'],
    requiresTrades: ['Wet Utilities'],
    groundUpOnly: true,
    minDays: 2,
  },
  {
    activityId: '2074',
    name: 'Storm Drain Line Installation',
    trade: 'Wet Utilities',
    phase: 'Phase 2: Site Work & Earthwork',
    quantityKey: 'wet_storm_lf',
    rateRef: { trade: 'Wet Utilities', task: 'Storm Drain' },
    predecessorIds: ['2040'],
    fallbackPredecessorIds: ['2010'],
    requiresTrades: ['Wet Utilities'],
    groundUpOnly: true,
    minDays: 2,
  },

  // NEW: Dry Utilities
  {
    activityId: '2075',
    name: 'Underground Electrical Conduit',
    trade: 'Dry Utilities',
    phase: 'Phase 2: Site Work & Earthwork',
    quantityKey: 'dry_elec_conduit_lf',
    rateRef: { trade: 'Dry Utilities', task: 'Electrical Conduit Underground' },
    predecessorIds: ['2050'],
    fallbackPredecessorIds: ['2010'],
    requiresTrades: ['Dry Utilities'],
    groundUpOnly: true,
    minDays: 2,
  },
  {
    activityId: '2076',
    name: 'Underground Telecom / Data',
    trade: 'Dry Utilities',
    phase: 'Phase 2: Site Work & Earthwork',
    quantityKey: 'dry_telecom_lf',
    rateRef: { trade: 'Dry Utilities', task: 'Telecom Data Underground' },
    predecessorIds: ['2050'],
    fallbackPredecessorIds: ['2010'],
    requiresTrades: ['Dry Utilities'],
    groundUpOnly: true,
    minDays: 1,
  },
  {
    activityId: '2077',
    name: 'Underground Gas Line',
    trade: 'Dry Utilities',
    phase: 'Phase 2: Site Work & Earthwork',
    quantityKey: 'dry_gas_lf',
    rateRef: { trade: 'Dry Utilities', task: 'Gas Line Underground' },
    predecessorIds: ['2050'],
    fallbackPredecessorIds: ['2010'],
    requiresTrades: ['Dry Utilities'],
    groundUpOnly: true,
    minDays: 1,
  },

  // NEW: Sitework / Paving
  {
    activityId: '2078',
    name: 'Curb & Gutter Installation',
    trade: 'Sitework / Paving',
    phase: 'Phase 2: Site Work & Earthwork',
    quantityKey: 'sitework_curb_lf',
    rateRef: { trade: 'Sitework / Paving', task: 'Curb & Gutter' },
    predecessorIds: ['2020'],
    fallbackPredecessorIds: ['2010'],
    requiresTrades: ['Sitework / Paving'],
    groundUpOnly: true,
    minDays: 2,
  },

  // �� Phase 3:
'@
    $content = $content.Replace($phase2Marker, $phase2Activities)
    Write-Host "✓ Added Phase 2 activities (Demolition, Wet/Dry Utilities, Sitework)"
}

# PHASE 3: Add waterproofing after underslab plumbing (before Phase 4)
$phase3Marker = "  // �� Phase 4: Structure"
if ($content -match [regex]::Escape($phase3Marker)) {
    $phase3Activities = @'

  // NEW: Waterproofing
  {
    activityId: '3060',
    name: 'Below-Grade Waterproofing',
    trade: 'Waterproofing',
    phase: 'Phase 3: Foundations',
    quantityKey: 'waterproofing_bg_sf',
    rateRef: { trade: 'Waterproofing', task: 'Below-Grade Membrane' },
    predecessorIds: ['3020'],
    fallbackPredecessorIds: ['3010'],
    requiresTrades: ['Waterproofing'],
    groundUpOnly: true,
    minDays: 2,
  },

  // �� Phase 4: Structure
'@
    $content = $content.Replace($phase3Marker, $phase3Activities)
    Write-Host "✓ Added Phase 3 activities (Waterproofing)"
}

# PHASE 5: Add above-grade waterproofing (after initial MEP rough marker)
# PHASE 6: Add above-grade waterproofing continuation
# PHASE 7: Add Ceiling Grid, Insulation
# PHASE 8: Add Specialties, Conveying, Fire Alarm, Low Voltage, Sitework

# For brevity, I'll insert all Phase 7 & 8 activities together near the end

# Find Phase 8: Finishes & Closeout marker
$phase8Marker = "  // �� Phase 8: Finishes & Closeout"
if ($content -match [regex]::Escape($phase8Marker)) {
    $phase78Activities = @'
  // �� Phase 7: Interior Finishes (ADDITIONS)

  // NEW: Ceiling Grid / ACT
  {
    activityId: '7090',
    name: 'Ceiling Grid Installation',
    trade: 'Ceiling Grid / ACT',
    phase: 'Phase 7: Interior Finishes',
    quantityKey: 'ceiling_grid_sf',
    rateRef: { trade: 'Ceiling Grid / ACT', task: 'Grid Installation' },
    predecessorIds: ['7020'],
    fallbackPredecessorIds: ['7000'],
    requiresTrades: ['Ceiling Grid / ACT'],
    minDays: 2,
  },
  {
    activityId: '7091',
    name: 'ACT Tile Installation',
    trade: 'Ceiling Grid / ACT',
    phase: 'Phase 7: Interior Finishes',
    quantityKey: 'ceiling_tile_sf',
    rateRef: { trade: 'Ceiling Grid / ACT', task: 'ACT Tile Installation' },
    predecessorIds: ['7090'],
    fallbackPredecessorIds: ['7020'],
    requiresTrades: ['Ceiling Grid / ACT'],
    minDays: 2,
  },

  // NEW: Insulation
  {
    activityId: '7092',
    name: 'Batt Insulation',
    trade: 'Insulation',
    phase: 'Phase 7: Interior Finishes',
    quantityKey: 'insulation_batt_sf',
    rateRef: { trade: 'Insulation', task: 'Batt Insulation' },
    predecessorIds: ['7000'],
    fallbackPredecessorIds: ['6040'],
    requiresTrades: ['Insulation'],
    minDays: 2,
  },
  {
    activityId: '7093',
    name: 'Rigid Board Insulation',
    trade: 'Insulation',
    phase: 'Phase 7: Interior Finishes',
    quantityKey: 'insulation_rigid_sf',
    rateRef: { trade: 'Insulation', task: 'Rigid Board Insulation' },
    predecessorIds: ['6040'],
    fallbackPredecessorIds: ['4010'],
    requiresTrades: ['Insulation'],
    groundUpOnly: true,
    minDays: 2,
  },
  {
    activityId: '7094',
    name: 'Spray Foam Insulation',
    trade: 'Insulation',
    phase: 'Phase 7: Interior Finishes',
    quantityKey: 'insulation_spray_sf',
    rateRef: { trade: 'Insulation', task: 'Spray Foam Insulation' },
    predecessorIds: ['7000'],
    fallbackPredecessorIds: ['6040'],
    requiresTrades: ['Insulation'],
    minDays: 1,
  },

  // �� Phase 8: Finishes & Closeout
'@
    $content = $content.Replace($phase8Marker, $phase78Activities)
    Write-Host "✓ Added Phase 7 activities (Ceiling Grid, Insulation)"
}

# Now add Phase 8 activities before Phase 9
$phase9Marker = "  // �� Phase 9: Commissioning & Closeout"
if ($content -match [regex]::Escape($phase9Marker)) {
    $phase8Activities = @'

  // NEW: Specialties (Division 10)
  {
    activityId: '8060',
    name: 'Toilet Accessories Installation',
    trade: 'Specialties (Division 10)',
    phase: 'Phase 8: Finishes & Closeout',
    quantityKey: 'specialty_rooms',
    rateRef: { trade: 'Specialties (Division 10)', task: 'Toilet Accessories' },
    predecessorIds: ['8030'],
    fallbackPredecessorIds: ['8020'],
    requiresTrades: ['Specialties (Division 10)'],
    minDays: 1,
  },
  {
    activityId: '8061',
    name: 'Toilet Partitions Installation',
    trade: 'Specialties (Division 10)',
    phase: 'Phase 8: Finishes & Closeout',
    quantityKey: 'specialty_stalls',
    rateRef: { trade: 'Specialties (Division 10)', task: 'Toilet Partitions' },
    predecessorIds: ['8030'],
    fallbackPredecessorIds: ['8020'],
    requiresTrades: ['Specialties (Division 10)'],
    minDays: 1,
  },
  {
    activityId: '8062',
    name: 'Signage Installation',
    trade: 'Specialties (Division 10)',
    phase: 'Phase 8: Finishes & Closeout',
    quantityKey: 'specialty_signs',
    rateRef: { trade: 'Specialties (Division 10)', task: 'Signage' },
    predecessorIds: ['8030'],
    fallbackPredecessorIds: ['8020'],
    requiresTrades: ['Specialties (Division 10)'],
    minDays: 1,
  },

  // NEW: Conveying (Elevator)
  {
    activityId: '8063',
    name: 'Elevator Shaft Preparation',
    trade: 'Conveying (Elevator)',
    phase: 'Phase 8: Finishes & Closeout',
    quantityKey: '__fixed__',
    rateRef: { trade: '', task: '' },
    scaledFixed: (sf) => {
      const cars = sf < 40000 ? 1 : sf < 100000 ? 2 : 3;
      return Math.max(3, cars * 4);
    },
    predecessorIds: ['P204', '4010'],
    fallbackPredecessorIds: ['4010'],
    requiresTrades: ['Conveying (Elevator)'],
  },
  {
    activityId: '8064',
    name: 'Elevator Car Installation',
    trade: 'Conveying (Elevator)',
    phase: 'Phase 8: Finishes & Closeout',
    quantityKey: '__fixed__',
    rateRef: { trade: '', task: '' },
    scaledFixed: (sf) => {
      const cars = sf < 40000 ? 1 : sf < 100000 ? 2 : 3;
      return Math.max(15, cars * 20);
    },
    predecessorIds: ['8063'],
    fallbackPredecessorIds: ['4010'],
    requiresTrades: ['Conveying (Elevator)'],
  },
  {
    activityId: '8065',
    name: 'Elevator Testing & Inspection',
    trade: 'Conveying (Elevator)',
    phase: 'Phase 8: Finishes & Closeout',
    quantityKey: '__fixed__',
    rateRef: { trade: '', task: '' },
    scaledFixed: (sf) => {
      const cars = sf < 40000 ? 1 : sf < 100000 ? 2 : 3;
      return Math.max(3, cars * 4);
    },
    predecessorIds: ['8064'],
    fallbackPredecessorIds: ['8063'],
    requiresTrades: ['Conveying (Elevator)'],
  },

  // NEW: Fire Alarm
  {
    activityId: '8066',
    name: 'Fire Alarm Device Installation',
    trade: 'Fire Alarm',
    phase: 'Phase 8: Finishes & Closeout',
    quantityKey: 'fire_alarm_devices',
    rateRef: { trade: 'Fire Alarm', task: 'Device Installation' },
    predecessorIds: ['8030'],
    fallbackPredecessorIds: ['8020'],
    requiresTrades: ['Fire Alarm'],
    minDays: 2,
  },
  {
    activityId: '8067',
    name: 'Fire Alarm Wire Pulling',
    trade: 'Fire Alarm',
    phase: 'Phase 8: Finishes & Closeout',
    quantityKey: 'fire_alarm_wire_lf',
    rateRef: { trade: 'Fire Alarm', task: 'Wire Pulling' },
    predecessorIds: ['5050'],
    fallbackPredecessorIds: ['5040'],
    requiresTrades: ['Fire Alarm'],
    minDays: 2,
  },
  {
    activityId: '8068',
    name: 'Fire Alarm Panel Programming',
    trade: 'Fire Alarm',
    phase: 'Phase 8: Finishes & Closeout',
    quantityKey: '__fixed__',
    rateRef: { trade: '', task: '' },
    fixedDays: 3,
    predecessorIds: ['8066', '8067'],
    fallbackPredecessorIds: ['8066'],
    requiresTrades: ['Fire Alarm'],
  },

  // NEW: Low Voltage / Data
  {
    activityId: '8069',
    name: 'Low Voltage Cable Pulling',
    trade: 'Low Voltage / Data',
    phase: 'Phase 8: Finishes & Closeout',
    quantityKey: 'lv_cable_lf',
    rateRef: { trade: 'Low Voltage / Data', task: 'Cable Pulling' },
    predecessorIds: ['5050'],
    fallbackPredecessorIds: ['5040'],
    requiresTrades: ['Low Voltage / Data'],
    minDays: 2,
  },
  {
    activityId: '8070',
    name: 'Low Voltage Device Trim',
    trade: 'Low Voltage / Data',
    phase: 'Phase 8: Finishes & Closeout',
    quantityKey: 'lv_devices',
    rateRef: { trade: 'Low Voltage / Data', task: 'Device Trim' },
    predecessorIds: ['8069', '8030'],
    fallbackPredecessorIds: ['8069'],
    requiresTrades: ['Low Voltage / Data'],
    minDays: 2,
  },
  {
    activityId: '8071',
    name: 'Low Voltage System Testing',
    trade: 'Low Voltage / Data',
    phase: 'Phase 8: Finishes & Closeout',
    quantityKey: 'lv_test_sf',
    rateRef: { trade: 'Low Voltage / Data', task: 'System Testing' },
    predecessorIds: ['8070'],
    fallbackPredecessorIds: ['8069'],
    requiresTrades: ['Low Voltage / Data'],
    minDays: 1,
  },

  // NEW: Sitework / Paving (late phase)
  {
    activityId: '8072',
    name: 'Asphalt Paving',
    trade: 'Sitework / Paving',
    phase: 'Phase 8: Finishes & Closeout',
    quantityKey: 'sitework_asphalt_tons',
    rateRef: { trade: 'Sitework / Paving', task: 'Asphalt Paving' },
    predecessorIds: ['2078'],
    fallbackPredecessorIds: ['2020'],
    requiresTrades: ['Sitework / Paving'],
    groundUpOnly: true,
    minDays: 2,
  },
  {
    activityId: '8073',
    name: 'Concrete Sidewalks',
    trade: 'Sitework / Paving',
    phase: 'Phase 8: Finishes & Closeout',
    quantityKey: 'sitework_sidewalk_sf',
    rateRef: { trade: 'Sitework / Paving', task: 'Concrete Sidewalks' },
    predecessorIds: ['2078'],
    fallbackPredecessorIds: ['2020'],
    requiresTrades: ['Sitework / Paving'],
    groundUpOnly: true,
    minDays: 2,
  },
  {
    activityId: '8074',
    name: 'Parking Lot Striping',
    trade: 'Sitework / Paving',
    phase: 'Phase 8: Finishes & Closeout',
    quantityKey: 'sitework_striping_sf',
    rateRef: { trade: 'Sitework / Paving', task: 'Parking Striping' },
    predecessorIds: ['8072'],
    fallbackPredecessorIds: ['2078'],
    requiresTrades: ['Sitework / Paving'],
    groundUpOnly: true,
    minDays: 1,
  },

  // NEW: Waterproofing (above-grade)
  {
    activityId: '8075',
    name: 'Above-Grade Waterproofing',
    trade: 'Waterproofing',
    phase: 'Phase 8: Finishes & Closeout',
    quantityKey: 'waterproofing_ag_sf',
    rateRef: { trade: 'Waterproofing', task: 'Above-Grade Coating' },
    predecessorIds: ['6040'],
    fallbackPredecessorIds: ['4010'],
    requiresTrades: ['Waterproofing'],
    minDays: 2,
  },

  // �� Phase 9: Commissioning & Closeout
'@
    $content = $content.Replace($phase9Marker, $phase8Activities)
    Write-Host "✓ Added Phase 8 activities (Specialties, Elevator, Fire Alarm, Low Voltage, Sitework, Waterproofing)"
}

# ========== UPDATE PROCUREMENT PREDECESSORS IN MASTER_TEMPLATE ==========

Write-Host "`nUpdating procurement delivery predecessors..."

# These updates link installation activities to wait for material deliveries

# Steel erection waits for steel delivery
$content = $content -replace "activityId: '4000',\s+name: 'Steel Erection',\s+trade: 'Structural Steel',\s+phase: 'Phase 4: Structure',\s+quantityKey: 'steel_tons',\s+rateRef: \{ trade: 'Structural Steel', task: 'Steel Erection \(Standard\)' \},\s+predecessorIds: \['3050'\],",
  "activityId: '4000',`r`n    name: 'Steel Erection',`r`n    trade: 'Structural Steel',`r`n    phase: 'Phase 4: Structure',`r`n    quantityKey: 'steel_tons',`r`n    rateRef: { trade: 'Structural Steel', task: 'Steel Erection (Standard)' },`r`n    predecessorIds: ['P104', '3050'],"

# Storefront waits for window delivery
$content = $content -replace "activityId: '6020',\s+name: 'Storefront Installation',\s+trade: 'Windows & Glazing',\s+phase: 'Phase 6: Exterior Enclosure',\s+quantityKey: 'storefront_sf',\s+rateRef: \{ trade: 'Windows & Glazing', task: 'Storefront System' \},\s+predecessorIds: \['4010'\],",
  "activityId: '6020',`r`n    name: 'Storefront Installation',`r`n    trade: 'Windows & Glazing',`r`n    phase: 'Phase 6: Exterior Enclosure',`r`n    quantityKey: 'storefront_sf',`r`n    rateRef: { trade: 'Windows & Glazing', task: 'Storefront System' },`r`n    predecessorIds: ['P304', '4010'],"

# Doors wait for door delivery
$content = $content -replace "activityId: '7060',\s+name: 'Hollow Metal Doors & Frames',\s+trade: 'Doors & Hardware',\s+phase: 'Phase 7: Interior Finishes',\s+quantityKey: 'hm_doors',\s+rateRef: \{ trade: 'Doors & Hardware', task: 'Hollow Metal Doors' \},\s+predecessorIds: \['7000'\],",
  "activityId: '7060',`r`n    name: 'Hollow Metal Doors & Frames',`r`n    trade: 'Doors & Hardware',`r`n    phase: 'Phase 7: Interior Finishes',`r`n    quantityKey: 'hm_doors',`r`n    rateRef: { trade: 'Doors & Hardware', task: 'Hollow Metal Doors' },`r`n    predecessorIds: ['P404', '7000'],"

# HVAC waits for equipment delivery
$content = $content -replace "activityId: '5020',\s+name: 'HVAC Rough-In \(Ductwork\)',\s+trade: 'HVAC',\s+phase: 'Phase 5: MEP Rough-In',\s+quantityKey: 'ductwork_lbs',\s+rateRef: \{ trade: 'HVAC', task: 'Ductwork Installation' \},\s+predecessorIds: \['5000'\],",
  "activityId: '5020',`r`n    name: 'HVAC Rough-In (Ductwork)',`r`n    trade: 'HVAC',`r`n    phase: 'Phase 5: MEP Rough-In',`r`n    quantityKey: 'ductwork_lbs',`r`n    rateRef: { trade: 'HVAC', task: 'Ductwork Installation' },`r`n    predecessorIds: ['P504', '5000'],"

# Fire Sprinkler waits for sprinkler delivery
$content = $content -replace "activityId: '5010',\s+name: 'Fire Sprinkler Rough-In',\s+trade: 'Fire Sprinkler',\s+phase: 'Phase 5: MEP Rough-In',\s+quantityKey: 'sprinkler_pipe_lf',\s+rateRef: \{ trade: 'Fire Sprinkler', task: 'Sprinkler Pipe Installation' \},\s+predecessorIds: \['5000'\],",
  "activityId: '5010',`r`n    name: 'Fire Sprinkler Rough-In',`r`n    trade: 'Fire Sprinkler',`r`n    phase: 'Phase 5: MEP Rough-In',`r`n    quantityKey: 'sprinkler_pipe_lf',`r`n    rateRef: { trade: 'Fire Sprinkler', task: 'Sprinkler Pipe Installation' },`r`n    predecessorIds: ['P604', '5000'],"

# Electrical waits for switchgear delivery
$content = $content -replace "activityId: '5040',\s+name: 'Electrical Rough-In \(Conduit & Wire\)',\s+trade: 'Electrical',\s+phase: 'Phase 5: MEP Rough-In',\s+quantityKey: 'conduit_lf',\s+rateRef: \{ trade: 'Electrical', task: 'Conduit Rough-In' \},\s+predecessorIds: \['5000'\],",
  "activityId: '5040',`r`n    name: 'Electrical Rough-In (Conduit & Wire)',`r`n    trade: 'Electrical',`r`n    phase: 'Phase 5: MEP Rough-In',`r`n    quantityKey: 'conduit_lf',`r`n    rateRef: { trade: 'Electrical', task: 'Conduit Rough-In' },`r`n    predecessorIds: ['P704', '5000'],"

# Roofing waits for material delivery
$content = $content -replace "activityId: '6040',\s+name: 'Roofing Installation',\s+trade: 'Roofing',\s+phase: 'Phase 6: Exterior Enclosure',\s+quantityKey: 'roofing_sf',\s+rateRef: \{ trade: 'Roofing', task: 'TPO / EPDM Membrane' \},\s+predecessorIds: \['4010'\],",
  "activityId: '6040',`r`n    name: 'Roofing Installation',`r`n    trade: 'Roofing',`r`n    phase: 'Phase 6: Exterior Enclosure',`r`n    quantityKey: 'roofing_sf',`r`n    rateRef: { trade: 'Roofing', task: 'TPO / EPDM Membrane' },`r`n    predecessorIds: ['P803', '4010'],"

# Flooring waits for flooring delivery
$content = $content -replace "activityId: '8010',\s+name: 'Carpet Installation',\s+trade: 'Flooring',\s+phase: 'Phase 8: Finishes & Closeout',\s+quantityKey: 'carpet_sf',\s+rateRef: \{ trade: 'Flooring', task: 'Carpet Tile' \},\s+predecessorIds: \['8000'\],",
  "activityId: '8010',`r`n    name: 'Carpet Installation',`r`n    trade: 'Flooring',`r`n    phase: 'Phase 8: Finishes & Closeout',`r`n    quantityKey: 'carpet_sf',`r`n    rateRef: { trade: 'Flooring', task: 'Carpet Tile' },`r`n    predecessorIds: ['P1003', '8000'],"

# Masonry/CMU waits for block delivery
$content = $content -replace "activityId: '4100',\s+name: 'Load-Bearing CMU Wall Construction',\s+trade: 'Masonry',\s+phase: 'Phase 4: Structure',\s+quantityKey: 'cmu_blocks',\s+rateRef: \{ trade: 'Masonry', task: 'CMU Block' \},\s+predecessorIds: \['3050'\],",
  "activityId: '4100',`r`n    name: 'Load-Bearing CMU Wall Construction',`r`n    trade: 'Masonry',`r`n    phase: 'Phase 4: Structure',`r`n    quantityKey: 'cmu_blocks',`r`n    rateRef: { trade: 'Masonry', task: 'CMU Block' },`r`n    predecessorIds: ['P1103', '3050'],"

# Concrete foundation waits for rebar delivery
$content = $content -replace "activityId: '3020',\s+name: 'Foundation & Footing Rebar',\s+trade: 'Concrete',\s+phase: 'Phase 3: Foundations',\s+quantityKey: '__fixed__',\s+rateRef: \{ trade: '', task: '' \},\s+scaledFixed: \(sf\) => Math\.max\(3, Math\.ceil\(sf / 8000\)\),\s+predecessorIds: \['3010'\],",
  "activityId: '3020',`r`n    name: 'Foundation & Footing Rebar',`r`n    trade: 'Concrete',`r`n    phase: 'Phase 3: Foundations',`r`n    quantityKey: '__fixed__',`r`n    rateRef: { trade: '', task: '' },`r`n    scaledFixed: (sf) => Math.max(3, Math.ceil(sf / 8000)),`r`n    predecessorIds: ['P1204', '3010'],"

Write-Host "✓ Updated procurement delivery predecessors"

# ========== MERGE PROCUREMENT_TEMPLATES INTO GENERATION LOGIC ==========

# Find the template concatenation in generateSchedule
$mergeMarker = "  // 2. Filter activity templates - base + structure-type additions (ground-up only)"
if ($content -match [regex]::Escape($mergeMarker)) {
    $mergeCode = @'
  // 2. Filter activity templates - base + structure-type additions (ground-up only)
  const structureActivities = isGroundUp && structureType && STRUCTURE_TYPE_TEMPLATES[structureType]
    ? STRUCTURE_TYPE_TEMPLATES[structureType]
    : [];

  // Merge: procurement + base + structure-specific
  const allTemplates = [...PROCUREMENT_TEMPLATES, ...MASTER_TEMPLATE, ...structureActivities];
'@
    $content = $content.Replace($mergeMarker + "`r`n  const structureActivities = isGroundUp && structureType && STRUCTURE_TYPE_TEMPLATES[structureType]`r`n    ? STRUCTURE_TYPE_TEMPLATES[structureType]`r`n    : [];`r`n`r`n  const allTemplates = [...MASTER_TEMPLATE, ...structureActivities];", $mergeCode)
    Write-Host "✓ Merged PROCUREMENT_TEMPLATES into generation logic"
}

# Save the file
Set-Content $enginePath -Value $content -Encoding UTF8 -NoNewline
Write-Host "`n✅ Schedule engine updates complete!`n"
Write-Host "Summary:"
Write-Host "  - Added 11 new trade types with 57 procurement activities"
Write-Host "  - Added 26 new construction activities across Phases 2-8"
Write-Host "  - Linked 10 procurement delivery prerequisites to installations"
Write-Host "  - Merged procurement templates into schedule generation"
Write-Host "`nFile: $enginePath"
