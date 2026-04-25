-- Migration 013: Safety Toolbox Talks
-- Adds toolbox talk documentation, attendance tracking, and template library

-- ── Table: toolbox_talks ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS toolbox_talks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES daily_projects(id) ON DELETE CASCADE,
  talk_date DATE NOT NULL,
  topic TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'falls', 'electrical', 'excavation', 'confined_space',
    'scaffolding', 'ppe', 'heat_illness', 'cold_stress',
    'fire_prevention', 'hazcom', 'lockout_tagout', 'crane_rigging',
    'housekeeping', 'hand_power_tools', 'ladders', 'silica',
    'struck_by', 'caught_between', 'traffic_control', 'general', 'custom'
  )),
  presenter TEXT,
  duration_minutes INTEGER DEFAULT 15,
  location TEXT,
  weather_conditions TEXT,
  notes TEXT,
  talking_points TEXT[] DEFAULT '{}',
  corrective_actions TEXT,
  follow_up_needed BOOLEAN DEFAULT false,
  follow_up_notes TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'completed', 'locked')),
  linked_activity_id UUID REFERENCES parsed_activities(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  locked_at TIMESTAMPTZ
);

-- ── Table: toolbox_talk_attendees ─────────────────────────────────
CREATE TABLE IF NOT EXISTS toolbox_talk_attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  talk_id UUID NOT NULL REFERENCES toolbox_talks(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  trade TEXT,
  company TEXT,
  signed BOOLEAN DEFAULT false,
  signed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Table: toolbox_talk_templates ─────────────────────────────────
CREATE TABLE IF NOT EXISTS toolbox_talk_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  talking_points TEXT[] NOT NULL,
  hazards TEXT[] DEFAULT '{}',
  ppe_required TEXT[] DEFAULT '{}',
  duration_minutes INTEGER DEFAULT 15,
  osha_reference TEXT,
  is_system BOOLEAN DEFAULT true,
  project_id UUID REFERENCES daily_projects(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Indexes ───────────────────────────────────────────────────────
CREATE INDEX idx_toolbox_talks_project_date ON toolbox_talks(project_id, talk_date DESC);
CREATE INDEX idx_toolbox_talk_attendees_talk ON toolbox_talk_attendees(talk_id);
CREATE INDEX idx_toolbox_talk_templates_category ON toolbox_talk_templates(category);

-- ── RLS (V1 — open access) ───────────────────────────────────────
ALTER TABLE toolbox_talks ENABLE ROW LEVEL SECURITY;
ALTER TABLE toolbox_talk_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE toolbox_talk_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_toolbox_talks" ON toolbox_talks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_toolbox_talk_attendees" ON toolbox_talk_attendees FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_toolbox_talk_templates" ON toolbox_talk_templates FOR ALL USING (true) WITH CHECK (true);

-- ── Updated_at trigger ────────────────────────────────────────────
CREATE TRIGGER toolbox_talks_updated_at
  BEFORE UPDATE ON toolbox_talks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Seed Data: 20 Pre-built OSHA Toolbox Talk Templates ──────────

INSERT INTO toolbox_talk_templates (category, title, talking_points, hazards, ppe_required, duration_minutes, osha_reference, is_system) VALUES

-- 1. Falls — Working at Heights
('falls', 'Working at Heights — Fall Prevention', 
  ARRAY[
    'Any work 6 feet or more above a lower level requires fall protection per OSHA standards. This includes edges, holes, and open sides.',
    'Before starting elevated work, inspect your harness for frayed webbing, cracked D-rings, and proper stitching. A damaged harness is the same as no harness.',
    'Anchor points must support 5,000 lbs per attached worker. Never tie off to conduit, handrails, or unsecured structures.',
    'Guardrails must be 42 inches high (±3 inches) with a mid-rail at 21 inches. Check that all connections are tight before trusting them.',
    'Cover all floor holes with material rated for twice the expected load. Mark covers clearly — write "HOLE" on them and secure so they cannot be displaced.',
    'Self-retracting lifelines (SRLs) must be inspected before each use. Check the housing for cracks and test the brake by giving a sharp tug.',
    'Report any missing or damaged fall protection immediately. If you see an unprotected edge, stop work and notify your foreman — do not walk past it.'
  ],
  ARRAY['falls from elevation', 'unprotected edges', 'floor openings', 'inadequate anchorage'],
  ARRAY['full body harness', 'hard hat with chin strap', 'safety glasses', 'work boots'],
  15, '29 CFR 1926.501-503', true),

-- 2. Falls — Ladder Safety
('ladders', 'Ladder Safety — Setup, Inspection & Use',
  ARRAY[
    'Inspect every ladder before use: check rungs, side rails, spreaders, and feet. If anything is bent, cracked, or missing — tag it out and remove it from service.',
    'Set extension ladders at a 4:1 ratio — for every 4 feet of height, the base should be 1 foot away from the wall. Extend 3 feet above the landing.',
    'Maintain three points of contact at all times: two hands and one foot, or two feet and one hand. Never carry tools in your hands while climbing.',
    'Never stand on the top two rungs of a stepladder or the top three rungs of an extension ladder. Use the right size ladder for the job.',
    'Place ladders on firm, level surfaces. Never set a ladder on scaffolding, boxes, or unstable ground. Use leg levelers on uneven terrain.',
    'Do not use metal ladders near electrical work or energized equipment. Use fiberglass ladders rated for electrical exposure.',
    'Secure the top and bottom of extension ladders to prevent displacement. Have a spotter at the base when working in high-traffic areas.'
  ],
  ARRAY['falls from ladders', 'ladder tip-over', 'electrical contact', 'overreaching'],
  ARRAY['hard hat', 'safety glasses', 'work boots', 'gloves'],
  10, '29 CFR 1926.1053', true),

-- 3. Falls — Scaffolding
('scaffolding', 'Scaffolding Safety — Erection, Use & Dismantling',
  ARRAY[
    'Only competent persons may erect, modify, or dismantle scaffolding. If you are not trained, do not touch scaffold components.',
    'Inspect scaffolding at the start of each shift and after any event that could affect integrity — storms, impacts, or extended idle periods.',
    'All scaffold platforms must be fully planked with no gaps greater than 1 inch. Planks must extend 6 to 12 inches past supports.',
    'Guardrails, mid-rails, and toeboards are required on all open sides when the platform is 10 feet or more above the ground.',
    'Never exceed the scaffold load rating. Know the rated capacity and account for workers, tools, and materials combined.',
    'Lock all caster wheels on mobile scaffolds before anyone climbs. Never move a mobile scaffold with workers on the platform.',
    'Access scaffolds via built-in ladders, stair towers, or approved access points only — never climb cross-braces.'
  ],
  ARRAY['scaffold collapse', 'falls from scaffold', 'falling objects', 'platform failure'],
  ARRAY['hard hat', 'safety glasses', 'work boots', 'harness when required'],
  15, '29 CFR 1926.451-454', true),

-- 4. Electrical — Arc Flash & Shock Prevention
('electrical', 'Arc Flash & Electrical Shock Prevention',
  ARRAY[
    'Assume all electrical circuits are energized until you personally verify they are de-energized using a rated voltage tester. Test the tester before and after use.',
    'Only qualified electrical workers may perform work on or near energized circuits. If you are not qualified, maintain the approach boundary distance.',
    'Wear arc-rated PPE appropriate to the incident energy level. Check the arc flash label on every panel before opening — it tells you the required PPE category.',
    'Never use damaged or unrated tools near electrical equipment. All hand tools must be insulated and rated for the voltage present.',
    'Keep all panel doors and covers closed and secured when not actively being worked on. Missing knockouts and open enclosures are an arc flash risk.',
    'Know the location of the nearest emergency disconnect and how to use it. In an electrical emergency, de-energize first — do not touch the victim if they are still in contact with the source.'
  ],
  ARRAY['arc flash', 'electrical shock', 'electrocution', 'burns'],
  ARRAY['arc-rated clothing', 'insulated gloves', 'face shield', 'safety glasses', 'voltage-rated tools'],
  15, '29 CFR 1926.405-408 / NFPA 70E', true),

-- 5. Electrical — GFCI & Temporary Power
('electrical', 'GFCI Protection & Temporary Power Safety',
  ARRAY[
    'All 120-volt, 15 and 20 amp receptacles on construction sites must be GFCI-protected. No exceptions — this applies to extension cords, power strips, and temporary panels.',
    'Test GFCIs before each use by pressing the TEST button. The RESET button should pop out. If it does not trip, the GFCI is defective — remove it from service.',
    'Inspect all extension cords daily: look for exposed conductors, damaged insulation, missing ground prongs, and proper strain relief. Damaged cords get cut and trashed — do not tape them.',
    'Route temporary power cords to avoid damage from traffic, sharp edges, and pinch points. Cords cannot run through doorways, windows, or holes unless protected from damage.',
    'Temporary lighting must be protected by guards unless the bulbs are deeply recessed. Broken lamps in wet areas are a shock hazard.',
    'Never daisy-chain power strips or use indoor-rated cords outdoors. Match the cord to the environment and the load.'
  ],
  ARRAY['electrical shock', 'electrocution', 'damaged cords', 'ground faults'],
  ARRAY['safety glasses', 'insulated gloves when testing', 'work boots'],
  10, '29 CFR 1926.404-405', true),

-- 6. Struck-By — Overhead Hazards
('struck_by', 'Struck-By Hazards — Overhead Protection',
  ARRAY[
    'Hard hats are mandatory in all areas where there is a risk of falling objects, overhead work, or low clearance. Wear them properly — not backwards unless designed for it.',
    'Never work directly below overhead operations without barriers or a controlled access zone. If a crew is working above, no one should be standing underneath without protection.',
    'Secure all tools and materials at height with lanyards, toe boards, or debris nets. A 2-pound wrench dropped from 6 stories hits with over 200 pounds of force.',
    'Barricade areas below crane operations, overhead lifts, and leading-edge work. Use flagging tape, cones, and signage to define the drop zone.',
    'Inspect hard hats daily for cracks, dents, and UV degradation. Replace the suspension liner if it is stretched out or damaged. Replace the shell per manufacturer guidelines.',
    'During demolition, establish exclusion zones around the work area. Debris can travel much farther than expected — especially in wind.'
  ],
  ARRAY['falling tools', 'falling materials', 'overhead crane loads', 'demolition debris'],
  ARRAY['hard hat', 'safety glasses', 'high-visibility vest', 'steel-toe boots'],
  10, '29 CFR 1926.250-252', true),

-- 7. Struck-By — Heavy Equipment Blind Spots
('struck_by', 'Heavy Equipment Blind Spots & Pedestrian Safety',
  ARRAY[
    'Heavy equipment operators have significant blind spots on all sides. If you cannot see the operator''s mirrors, the operator cannot see you. Stay in the operator''s line of sight.',
    'Establish designated pedestrian walkways and equipment travel paths on site. Foot traffic and heavy equipment should never share the same lane without barriers.',
    'Spotters are required when equipment is backing up or operating in congested areas. Use radios and maintain visual contact with the operator at all times.',
    'High-visibility vests are required in all equipment operating areas. Class 2 minimum during the day, Class 3 at night or in low-visibility conditions.',
    'Never approach heavy equipment until the operator has acknowledged your presence and the machine is stationary. Make eye contact or use a radio — do not assume they see you.',
    'Dump trucks, excavators, and loaders should have functioning backup alarms. If the alarm is not working, shut the equipment down until it is repaired.',
    'During fueling, shut off the engine and do not smoke within 50 feet. Keep a fire extinguisher readily accessible at all fueling locations.'
  ],
  ARRAY['struck by equipment', 'backing accidents', 'crushed by vehicle', 'pedestrian contact'],
  ARRAY['high-visibility vest', 'hard hat', 'safety glasses', 'steel-toe boots'],
  15, '29 CFR 1926.600-602', true),

-- 8. Caught In/Between — Trenching & Excavation
('excavation', 'Trenching & Excavation Safety',
  ARRAY[
    'All excavations 5 feet or deeper require a protective system: sloping, benching, shoring, or a trench box. There are no exceptions — even for "just a few minutes."',
    'A competent person must inspect the excavation daily, after every rainstorm, and after any event that could affect conditions. Document every inspection.',
    'Never enter a trench that does not have a safe means of egress within 25 feet of travel. Ladders must extend 3 feet above the top of the trench.',
    'Keep all spoil piles, materials, and equipment at least 2 feet from the edge of the excavation. Surcharge loading is the leading cause of trench wall failure.',
    'Know the location of all underground utilities before digging. Call 811 at least 48 hours before excavation. Hand-dig within the tolerance zone of marked utilities.',
    'Watch for signs of distress: tension cracks in the soil, bulging at the base, water seepage, or previously backfilled ground. If you see any of these, evacuate immediately.',
    'Atmospheric testing is required in excavations deeper than 4 feet where hazardous atmospheres could exist — near landfills, fuel tanks, or gas lines.'
  ],
  ARRAY['cave-in', 'engulfment', 'atmospheric hazards', 'falling into excavation', 'utility strikes'],
  ARRAY['hard hat', 'high-visibility vest', 'work boots', 'gas monitor when required'],
  15, '29 CFR 1926.650-652', true),

-- 9. Caught In/Between — Machine Guarding
('caught_between', 'Caught In/Between — Machine Guarding & Pinch Points',
  ARRAY[
    'Never remove, bypass, or disable machine guards. Guards exist because someone was injured or killed at that exact point. Treat them as non-negotiable.',
    'Identify all pinch points, nip points, and rotating parts before starting work near machinery. If your hands or clothing could get pulled in, add a guard or stay clear.',
    'Loose clothing, jewelry, long hair, and lanyards near rotating equipment are catch hazards. Secure everything before operating or working near moving parts.',
    'Before performing maintenance on any equipment, follow Lockout/Tagout procedures. "I''ll just be a second" has been the last thing too many people said.',
    'Inspect all guards and safety devices at the start of each shift. If a guard is damaged or missing, tag the machine out and notify your supervisor immediately.',
    'Keep hands and fingers clear of shear points on hydraulic tools, metal brakes, and presses. Use push sticks, jigs, or remote controls when available.'
  ],
  ARRAY['caught in machinery', 'pinch points', 'rotating parts', 'crushing', 'amputation'],
  ARRAY['safety glasses', 'close-fitting clothing', 'work gloves when appropriate', 'hearing protection'],
  10, '29 CFR 1926.300-307', true),

-- 10. Confined Space Entry
('confined_space', 'Confined Space Entry — Permit & Non-Permit',
  ARRAY[
    'A confined space has limited entry/exit, is not designed for continuous occupancy, and is large enough to bodily enter. Manholes, tanks, vaults, and pits all qualify.',
    'Before entry, test the atmosphere for oxygen (19.5-23.5%), combustible gas (<10% LEL), and toxic gases (H₂S <10ppm, CO <35ppm). Test at multiple levels — gases stratify.',
    'A completed entry permit must be posted at the opening before anyone enters. The permit lists hazards, controls, rescue provisions, and authorized entrants.',
    'An attendant must be stationed at the opening at all times during entry. The attendant''s only job is to monitor entrants and summon rescue — they do not enter the space.',
    'Continuous ventilation with a mechanical blower is required to maintain safe atmospheric conditions. Position the duct to reach the work area at the bottom of the space.',
    'Have a rescue plan before entry. Non-entry rescue (retrieval systems with tripod and winch) is preferred. If the plan relies on the fire department, confirm their response time.',
    'If atmospheric conditions change or an entrant feels lightheaded, nauseated, or disoriented — evacuate immediately. Do not re-enter to rescue without proper equipment and training.'
  ],
  ARRAY['oxygen deficiency', 'toxic atmosphere', 'engulfment', 'entrapment', 'combustible atmosphere'],
  ARRAY['gas monitor (4-gas)', 'full body harness', 'retrieval line', 'hard hat', 'safety glasses'],
  20, '29 CFR 1926.1200-1213', true),

-- 11. PPE — Selection & Inspection
('ppe', 'PPE Selection, Inspection & Proper Use',
  ARRAY[
    'PPE is the last line of defense — not the first. Always look for ways to eliminate or control the hazard before relying on personal protective equipment.',
    'Hard hats: inspect the shell for cracks and the suspension for elasticity. Replace after any impact, even if damage is not visible. UV-degraded shells get chalky — replace them.',
    'Safety glasses must meet ANSI Z87.1 — look for the marking on the lens and frame. Use side shields in all construction environments. Prescription glasses are not safety glasses unless rated.',
    'Hearing protection is required when noise exceeds 85 dBA (8-hour TWA). If you have to raise your voice to talk to someone 3 feet away, you need hearing protection.',
    'Gloves must match the hazard: cut-resistant for sharp materials, chemical-resistant for solvents, insulated for electrical work. The wrong glove is worse than no glove — it creates false confidence.',
    'High-visibility vests are required wherever vehicle or equipment traffic is present. Class 2 minimum for daytime, Class 3 for nighttime or highway-adjacent work.',
    'Respiratory protection requires medical clearance, fit testing, and training before use. A dust mask is not a respirator — know the difference and use the right protection for the exposure.'
  ],
  ARRAY['head injury', 'eye injury', 'hearing loss', 'hand injury', 'respiratory exposure'],
  ARRAY['hard hat', 'safety glasses', 'hearing protection', 'work gloves', 'high-visibility vest', 'steel-toe boots'],
  15, '29 CFR 1926.95-107', true),

-- 12. Heat Illness Prevention
('heat_illness', 'Heat Illness Prevention — Water, Rest, Shade',
  ARRAY[
    'Heat illness kills construction workers every year. The three defenses are simple: water, rest, and shade. Every crew must have all three available when temperatures exceed 80°F.',
    'Drink water before you feel thirsty — by the time you are thirsty, you are already dehydrated. Target one cup (8 oz) every 15-20 minutes. Avoid energy drinks and excessive caffeine.',
    'Know the signs of heat exhaustion: heavy sweating, weakness, cold/clammy skin, nausea, dizziness, fast/weak pulse. Move the person to shade, cool them down, and call for help.',
    'Heat stroke is a medical emergency: high body temperature (>103°F), hot/red/dry skin, rapid pulse, confusion, loss of consciousness. Call 911 immediately and cool aggressively with water/ice.',
    'New and returning workers need an acclimatization period. Start with 20% of normal workload on day one and increase 20% each day over the first week.',
    'Schedule heavy work for early morning when possible. Rotate crews through shade breaks. Monitor each other — a buddy system catches heat illness early.',
    'Ensure shade structures are set up before work begins. If natural shade is not available, pop-up canopies or tarps must be provided within a reasonable distance of the work area.'
  ],
  ARRAY['heat exhaustion', 'heat stroke', 'dehydration', 'heat cramps', 'rhabdomyolysis'],
  ARRAY['light-colored clothing', 'wide-brim hard hat', 'cooling towels', 'sunscreen'],
  15, '29 CFR 1926.960 / OSHA Heat NEP', true),

-- 13. Cold Stress Awareness
('cold_stress', 'Cold Stress — Hypothermia, Frostbite & Prevention',
  ARRAY[
    'Cold stress occurs when the body cannot maintain its core temperature. Wind chill is the real danger — a 35°F day with 25 mph wind feels like 23°F on exposed skin.',
    'Dress in layers: a moisture-wicking base layer, an insulating middle layer, and a wind/water-resistant outer layer. Avoid cotton next to skin — it holds moisture and accelerates heat loss.',
    'Know the signs of hypothermia: uncontrollable shivering, slurred speech, confusion, drowsiness, loss of coordination. This is a medical emergency — call 911 and warm the person gradually.',
    'Frostbite affects fingers, toes, ears, and the nose first. Watch for numbness, tingling, or skin that appears waxy, white, or grayish-yellow. Do not rub frostbitten skin.',
    'Take frequent warming breaks in a heated area. Have warm, sweet beverages available — avoid alcohol and caffeine, which impair the body''s ability to regulate temperature.',
    'Schedule outdoor work during the warmest part of the day when possible. Increase rest periods as temperatures drop and wind increases.'
  ],
  ARRAY['hypothermia', 'frostbite', 'trench foot', 'impaired dexterity', 'slips on ice'],
  ARRAY['insulated work gloves', 'thermal hard hat liner', 'insulated boots', 'layered clothing'],
  10, '29 CFR 1926.960 / OSHA Cold Stress Guide', true),

-- 14. Fire Prevention & Hot Work
('fire_prevention', 'Fire Prevention & Hot Work Permits',
  ARRAY[
    'A hot work permit is required for any cutting, welding, brazing, or grinding operation. The permit must be completed before work begins and posted at the work location.',
    'Clear all combustible materials within 35 feet of hot work. If combustibles cannot be moved, cover them with fire-resistant blankets or welding curtains.',
    'A fire watch must remain at the hot work location for at least 30 minutes after work is completed. The fire watch must have a charged fire extinguisher within reach.',
    'Know the location and type of fire extinguishers on your project. A 10-lb ABC extinguisher must be within 100 feet of all hot work. Confirm the gauge shows a full charge.',
    'Keep all compressed gas cylinders upright, capped when not in use, and secured with chains. Separate oxygen and fuel gas cylinders by 20 feet or a 5-foot fire-rated barrier.',
    'Report any smell of gas, propane, or unusual odors immediately. Evacuate the area before investigating. Never use an open flame to check for gas leaks.',
    'Maintain clear access to fire exits, extinguishers, and alarm pull stations at all times. Storage, materials, and equipment must not block egress paths.'
  ],
  ARRAY['fire', 'explosion', 'burns', 'smoke inhalation', 'compressed gas hazards'],
  ARRAY['welding helmet', 'fire-resistant clothing', 'welding gloves', 'safety glasses with side shields'],
  15, '29 CFR 1926.352-354', true),

-- 15. Hazard Communication (HazCom/GHS)
('hazcom', 'Hazard Communication — GHS Labels & SDS',
  ARRAY[
    'Every chemical on site must have a Safety Data Sheet (SDS) accessible to all workers. Know where the SDS binder is located on your project — ask if you do not know.',
    'GHS labels have six key elements: product name, signal word (Danger or Warning), hazard statements, precautionary statements, pictograms, and supplier information. Never use a chemical with a missing or illegible label.',
    'If you transfer a chemical to a secondary container, that container must be labeled with the product name and the applicable hazards. No unmarked containers — ever.',
    'The nine GHS pictograms tell you the hazard type at a glance: flame, oxidizer, compressed gas, corrosion, skull and crossbones, exclamation mark, health hazard, environment, exploding bomb. Learn them.',
    'Before using any chemical you haven''t used before, read the SDS. Section 2 (hazards), Section 4 (first aid), and Section 8 (exposure controls/PPE) are the most critical sections.',
    'Incompatible chemicals must be stored separately. Acids and bases, oxidizers and flammables — mixing them (even from spills) can cause fires, explosions, or toxic gas release.'
  ],
  ARRAY['chemical exposure', 'inhalation', 'skin contact', 'chemical burn', 'toxic reaction'],
  ARRAY['chemical-resistant gloves', 'safety glasses or goggles', 'respirator when required', 'face shield for splash risk'],
  10, '29 CFR 1926.59 / 29 CFR 1910.1200', true),

-- 16. Lockout/Tagout (LOTO)
('lockout_tagout', 'Lockout/Tagout — Energy Isolation for Maintenance',
  ARRAY[
    'Lockout/Tagout applies to ANY energy source: electrical, pneumatic, hydraulic, mechanical, thermal, chemical, and gravity. If it can move, flow, or release, it must be isolated.',
    'Only trained, authorized employees may perform lockout/tagout. Each person working on the equipment must apply their own lock and tag — no sharing locks.',
    'The six steps of LOTO: (1) Notify affected employees, (2) Shut down equipment using normal procedures, (3) Isolate all energy sources, (4) Apply locks and tags, (5) Release stored energy, (6) Verify zero energy state.',
    'After locking out, attempt to start the equipment to verify it is de-energized. Also test for residual voltage, pressure, or stored mechanical energy. Verify, then work.',
    'Tags are information devices, not energy-isolating devices. A tag without a lock is insufficient unless a lock physically cannot be applied — and that exception must be documented.',
    'Before removing your lock, inspect the work area, ensure all tools are removed, confirm all guards are replaced, and account for all workers. The last lock off means the equipment is live.',
    'Never remove another person''s lock. If a worker leaves without removing their lock, only the site supervisor can authorize removal after verifying the worker has left and the equipment is clear.'
  ],
  ARRAY['unexpected energization', 'electrocution', 'crushing', 'amputation', 'burns'],
  ARRAY['personal lockout padlock', 'lockout hasp', 'tags', 'voltage tester'],
  15, '29 CFR 1926.417 / 29 CFR 1910.147', true),

-- 17. Crane & Rigging Safety
('crane_rigging', 'Crane & Rigging Safety — Lifts, Signals & Inspections',
  ARRAY[
    'Only qualified riggers may rig loads and only qualified signal persons may direct crane operations. These designations require documented training — do not self-appoint.',
    'Before every lift, create a lift plan: load weight, rigging configuration, crane capacity at radius, ground conditions, overhead obstructions, and wind speed limits. Critical lifts (>75% capacity) require an engineered lift plan.',
    'Inspect all slings, shackles, and rigging hardware before use. Remove from service: frayed wire rope, stretched chain links, cut synthetic slings, or any hardware with visible damage.',
    'Maintain a minimum clearance of 20 feet from power lines for all crane operations, or the voltage-specific distance in Table A of 29 CFR 1926.1408, whichever is greater.',
    'Never walk under a suspended load. Establish a barricaded drop zone around every lift. If you must travel through the area, wait until the load is placed and the rigging is slack.',
    'Use tag lines to control load rotation and swing. Never wrap a tag line around your hand or body — if the load moves unexpectedly, you need to be able to let go instantly.',
    'Outriggers must be fully extended and set on adequate blocking before any lift. Never rely on tires for stability — the crane''s capacity chart assumes outriggers are properly deployed.'
  ],
  ARRAY['dropped load', 'crane tip-over', 'power line contact', 'struck by load', 'rigging failure'],
  ARRAY['hard hat', 'safety glasses', 'high-visibility vest', 'work gloves', 'steel-toe boots'],
  20, '29 CFR 1926.1400-1442', true),

-- 18. Silica Dust Exposure
('silica', 'Silica Dust Exposure — Control & Prevention',
  ARRAY[
    'Crystalline silica is found in concrete, brick, block, morite, granite, and sand. Cutting, drilling, grinding, or demolishing these materials generates respirable silica dust that causes silicosis — a permanent, incurable lung disease.',
    'OSHA''s permissible exposure limit (PEL) for respirable crystalline silica is 50 µg/m³ as an 8-hour TWA. Many common tasks exceed this limit without controls.',
    'Use Table 1 controls when available: wet cutting with continuous water, vacuum dust collection systems, or enclosed cabs with HEPA filtration. These are your first-line defenses.',
    'When engineering controls are not feasible, respiratory protection is required. A minimum of an N95 is needed for short-duration work; a half-face respirator with P100 filters for sustained exposure.',
    'Never dry-sweep silica dust. Use HEPA vacuums or wet methods to clean up. Compressed air blow-down of silica dust is prohibited — it creates a hazardous cloud.',
    'Workers exposed above the action level (25 µg/m³) must be enrolled in a medical surveillance program including chest X-ray and lung function testing every 3 years.'
  ],
  ARRAY['silicosis', 'lung cancer', 'COPD', 'kidney disease', 'respirable dust exposure'],
  ARRAY['N95 or P100 respirator', 'safety glasses or goggles', 'disposable coveralls when warranted'],
  10, '29 CFR 1926.1153', true),

-- 19. Hand & Power Tool Safety
('hand_power_tools', 'Hand & Power Tool Safety — Inspection & Proper Use',
  ARRAY[
    'Inspect all tools before use: check for cracked handles, mushroomed heads, frayed cords, damaged guards, and loose parts. Defective tools must be removed from service immediately.',
    'Never remove or bypass a guard on a power tool. Guards exist because that tool has injured someone in exactly that way. If the guard interferes with the work, get the right tool.',
    'Use the right tool for the job — the correct size, type, and rated capacity. Using a tool beyond its design (prying with a wrench, hammering with pliers) causes injuries and breaks tools.',
    'Wear eye protection when using any striking tool, cutting tool, or power tool. Impact-rated safety glasses (ANSI Z87+) are required for tasks that generate flying particles.',
    'Pneumatic tools must have safety clips or retainers to prevent attachments from being ejected. Never point a pneumatic nailer at anyone, even if you believe it is empty.',
    'When using grinders, ensure the RPM rating of the wheel matches or exceeds the grinder''s RPM. An over-speed disc can shatter and send fragments like shrapnel.',
    'Disconnect power tools from their power source before changing blades, bits, or accessories. For corded tools, unplug. For pneumatic, disconnect the air line. For battery, remove the battery.'
  ],
  ARRAY['lacerations', 'eye injury', 'hand/finger amputation', 'flying debris', 'electrical shock'],
  ARRAY['safety glasses', 'work gloves', 'hearing protection for loud tools', 'face shield for grinding'],
  10, '29 CFR 1926.300-307', true),

-- 20. Housekeeping & Slip/Trip/Fall Prevention
('housekeeping', 'Housekeeping — Slip, Trip & Fall Prevention',
  ARRAY[
    'Good housekeeping is not optional — it is an OSHA requirement and the single most effective way to prevent slips, trips, and falls on a construction site.',
    'Clean as you go. Do not wait until the end of the shift to pick up debris, coil cords, and stack materials. A cluttered work area is an injury waiting to happen.',
    'All walkways, stairways, and access paths must be kept clear of tools, cords, debris, and standing water. If it is in the path, move it or mark it.',
    'Stack materials neatly and securely. Leaning stacks, unsecured pipe, and loose lumber are struck-by and trip hazards. Use dunnage to keep materials off the ground and organized.',
    'Manage cords and hoses: run them overhead when possible, use cord covers at crossings, and coil excess. A cord across a walkway is a guaranteed trip within the hour.',
    'Report and clean up spills immediately — water, oil, mud, concrete slurry. On smooth surfaces, apply absorbent material. Mark wet areas until they are dry.',
    'Maintain proper lighting in all work and travel areas. Temporary lighting is required in stairwells, corridors, and interior spaces. If you cannot see the hazard, you cannot avoid it.'
  ],
  ARRAY['slips', 'trips', 'falls on same level', 'struck by falling materials', 'fire from debris accumulation'],
  ARRAY['hard hat', 'safety glasses', 'work boots with tread', 'high-visibility vest'],
  10, '29 CFR 1926.25', true);
