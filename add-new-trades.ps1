# Script to add new trade activities to schedule-engine.ts
$enginePath = "C:\Users\Iront\.openclaw\workspace\irontrack-daily\src\lib\schedule-engine.ts"
$content = Get-Content $enginePath -Raw -Encoding UTF8

# ========== PHASE 2 ADDITIONS ==========

# Add new Phase 2 activities before Phase 3
$phase2Insert = @'

  // Demolition
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

  // Wet Utilities
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

  // Dry Utilities
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

  // Sitework
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

'@

$content = $content.Replace(
    "  // �� Phase 3: Foundations ��������������������������������������������������",
    $phase2Insert + "  // �� Phase 3: Foundations ��������������������������������������������������"
)

Write-Host "Phase 2 additions complete"

# ========== PHASE 3 ADDITIONS ==========

# Add waterproofing after underslab plumbing
$phase3Insert = @'

  // Waterproofing
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
'@

$content = $content.Replace(
    "  // �� Phase 4: Structure ��������������������������������������������������",
    $phase3Insert + "  // �� Phase 4: Structure ��������������������������������������������������"
)

Write-Host "Phase 3 additions complete"

# ========== UPDATE EXISTING ACTIVITIES WITH PROCUREMENT PREDECESSORS ==========

# Update steel erection to wait for steel delivery
$content = $content.Replace(
    "    activityId: '4000',`r`n    name: 'Steel Erection',`r`n    trade: 'Structural Steel',`r`n    phase: 'Phase 4: Structure',`r`n    quantityKey: 'steel_tons',`r`n    rateRef: { trade: 'Structural Steel', task: 'Steel Erection (Standard)' },`r`n    predecessorIds: ['3050'],",
    "    activityId: '4000',`r`n    name: 'Steel Erection',`r`n    trade: 'Structural Steel',`r`n    phase: 'Phase 4: Structure',`r`n    quantityKey: 'steel_tons',`r`n    rateRef: { trade: 'Structural Steel', task: 'Steel Erection (Standard)' },`r`n    predecessorIds: ['P104', '3050'],"
)

# Update storefront to wait for window delivery
$content = $content.Replace(
    "    activityId: '6020',`r`n    name: 'Storefront Installation',`r`n    trade: 'Windows & Glazing',`r`n    phase: 'Phase 6: Exterior Enclosure',`r`n    quantityKey: 'storefront_sf',`r`n    rateRef: { trade: 'Windows & Glazing', task: 'Storefront System' },`r`n    predecessorIds: ['4010'],",
    "    activityId: '6020',`r`n    name: 'Storefront Installation',`r`n    trade: 'Windows & Glazing',`r`n    phase: 'Phase 6: Exterior Enclosure',`r`n    quantityKey: 'storefront_sf',`r`n    rateRef: { trade: 'Windows & Glazing', task: 'Storefront System' },`r`n    predecessorIds: ['P304', '4010'],"
)

# Update doors to wait for door delivery
$content = $content.Replace(
    "    activityId: '7060',`r`n    name: 'Hollow Metal Doors & Frames',`r`n    trade: 'Doors & Hardware',`r`n    phase: 'Phase 7: Interior Finishes',`r`n    quantityKey: 'hm_doors',`r`n    rateRef: { trade: 'Doors & Hardware', task: 'Hollow Metal Doors' },`r`n    predecessorIds: ['7000'],",
    "    activityId: '7060',`r`n    name: 'Hollow Metal Doors & Frames',`r`n    trade: 'Doors & Hardware',`r`n    phase: 'Phase 7: Interior Finishes',`r`n    quantityKey: 'hm_doors',`r`n    rateRef: { trade: 'Doors & Hardware', task: 'Hollow Metal Doors' },`r`n    predecessorIds: ['P404', '7000'],"
)

# Update HVAC rough to wait for equipment delivery
$content = $content.Replace(
    "    activityId: '5020',`r`n    name: 'HVAC Rough-In (Ductwork)',`r`n    trade: 'HVAC',`r`n    phase: 'Phase 5: MEP Rough-In',`r`n    quantityKey: 'ductwork_lbs',`r`n    rateRef: { trade: 'HVAC', task: 'Ductwork Installation' },`r`n    predecessorIds: ['5000'],",
    "    activityId: '5020',`r`n    name: 'HVAC Rough-In (Ductwork)',`r`n    trade: 'HVAC',`r`n    phase: 'Phase 5: MEP Rough-In',`r`n    quantityKey: 'ductwork_lbs',`r`n    rateRef: { trade: 'HVAC', task: 'Ductwork Installation' },`r`n    predecessorIds: ['P504', '5000'],"
)

# Update fire sprinkler to wait for sprinkler delivery
$content = $content.Replace(
    "    activityId: '5010',`r`n    name: 'Fire Sprinkler Rough-In',`r`n    trade: 'Fire Sprinkler',`r`n    phase: 'Phase 5: MEP Rough-In',`r`n    quantityKey: 'sprinkler_pipe_lf',`r`n    rateRef: { trade: 'Fire Sprinkler', task: 'Sprinkler Pipe Installation' },`r`n    predecessorIds: ['5000'],",
    "    activityId: '5010',`r`n    name: 'Fire Sprinkler Rough-In',`r`n    trade: 'Fire Sprinkler',`r`n    phase: 'Phase 5: MEP Rough-In',`r`n    quantityKey: 'sprinkler_pipe_lf',`r`n    rateRef: { trade: 'Fire Sprinkler', task: 'Sprinkler Pipe Installation' },`r`n    predecessorIds: ['P604', '5000'],"
)

# Update electrical rough to wait for switchgear delivery
$content = $content.Replace(
    "    activityId: '5040',`r`n    name: 'Electrical Rough-In (Conduit & Wire)',`r`n    trade: 'Electrical',`r`n    phase: 'Phase 5: MEP Rough-In',`r`n    quantityKey: 'conduit_lf',`r`n    rateRef: { trade: 'Electrical', task: 'Conduit Rough-In' },`r`n    predecessorIds: ['5000'],",
    "    activityId: '5040',`r`n    name: 'Electrical Rough-In (Conduit & Wire)',`r`n    trade: 'Electrical',`r`n    phase: 'Phase 5: MEP Rough-In',`r`n    quantityKey: 'conduit_lf',`r`n    rateRef: { trade: 'Electrical', task: 'Conduit Rough-In' },`r`n    predecessorIds: ['P704', '5000'],"
)

# Update roofing to wait for material delivery
$content = $content.Replace(
    "    activityId: '6040',`r`n    name: 'Roofing Installation',`r`n    trade: 'Roofing',`r`n    phase: 'Phase 6: Exterior Enclosure',`r`n    quantityKey: 'roofing_sf',`r`n    rateRef: { trade: 'Roofing', task: 'TPO / EPDM Membrane' },`r`n    predecessorIds: ['4010'],",
    "    activityId: '6040',`r`n    name: 'Roofing Installation',`r`n    trade: 'Roofing',`r`n    phase: 'Phase 6: Exterior Enclosure',`r`n    quantityKey: 'roofing_sf',`r`n    rateRef: { trade: 'Roofing', task: 'TPO / EPDM Membrane' },`r`n    predecessorIds: ['P803', '4010'],"
)

Write-Host "Updated procurement predecessors"

# Save the file
Set-Content $enginePath -Value $content -Encoding UTF8 -NoNewline
Write-Host "Complete! File saved."
