-- IronTrack Pulse — Migration 013c: Accela & CitizenServe Cities
-- Run AFTER 013b_jurisdiction_inspection_codes.sql
--
-- DATA QUALITY NOTES:
-- Phoenix, Mesa, Scottsdale use Accela permitting system
-- Maricopa County uses Accela (older records) / EnerGov (current - see 013b)
-- Tucson uses CitizenServe
-- Scottsdale has a published inspection code lookup PDF (image-based, not extractable)
--   but description types are documented on their website
-- All codes in this file are ESTIMATED based on typical Accela AZ implementations
-- and Scottsdale's published inspection type descriptions
-- ============================================================

-- ============================================================
-- SCOTTSDALE INSPECTION TYPES
-- Source: scottsdaleaz.gov/planning-development/inspection-services
-- Types confirmed by name, codes are estimated (PDF was image-only)
-- ============================================================
DO $$
DECLARE jid UUID;
BEGIN
  SELECT id INTO jid FROM jurisdictions WHERE name = 'City of Scottsdale';
  IF jid IS NOT NULL THEN
    INSERT INTO jurisdiction_inspection_codes (jurisdiction_id, code, description, category, permit_type, is_commercial, is_residential, sort_order) VALUES
      -- Foundation
      (jid, 'BLDG-100', 'Foundation Inspection', 'Foundation', NULL, true, true, 100),
      (jid, 'BLDG-101', 'Footing/Ufer Ground', 'Foundation', NULL, true, true, 101),
      (jid, 'BLDG-102', 'Pre-Slab', 'Foundation', NULL, true, true, 102),
      (jid, 'BLDG-103', 'Post-Tension Slab', 'Foundation', NULL, true, true, 103),
      (jid, 'BLDG-104', 'Stem Wall', 'Foundation', NULL, true, true, 104),
      (jid, 'BLDG-105', 'Temporary Power', 'Foundation', NULL, true, true, 105),
      -- Underground
      (jid, 'BLDG-200', 'Under-Slab Plumbing', 'Underground/Soils', NULL, true, true, 200),
      (jid, 'BLDG-201', 'Under-Slab Electrical', 'Underground/Soils', NULL, true, true, 201),
      (jid, 'BLDG-202', 'Under-Slab Mechanical', 'Underground/Soils', NULL, true, true, 202),
      (jid, 'BLDG-203', 'UG Sewer', 'Underground/Soils', NULL, true, true, 203),
      (jid, 'BLDG-204', 'UG Water Service', 'Underground/Soils', NULL, true, true, 204),
      (jid, 'BLDG-205', 'UG Gas Service', 'Underground/Soils', NULL, true, true, 205),
      (jid, 'BLDG-206', 'UG Electric Service', 'Underground/Soils', NULL, true, true, 206),
      -- Rough
      (jid, 'BLDG-300', 'Roof Deck/Strap & Shear Wall', 'Rough', NULL, true, true, 300),
      (jid, 'BLDG-301', 'Rough Framing', 'Rough', NULL, true, true, 301),
      (jid, 'BLDG-302', 'Masonry', 'Masonry', NULL, true, true, 302),
      (jid, 'BLDG-310', 'Rough Plumbing', 'Rough', NULL, true, true, 310),
      (jid, 'BLDG-311', 'Rough Electrical', 'Rough', NULL, true, true, 311),
      (jid, 'BLDG-312', 'Rough Mechanical', 'Rough', NULL, true, true, 312),
      (jid, 'BLDG-313', 'Rough Combo (MEP)', 'Rough', NULL, true, true, 313),
      (jid, 'BLDG-320', 'Insulation', 'Rough', NULL, true, true, 320),
      -- Wall Cover
      (jid, 'BLDG-330', 'Lath/Gypsum Board', 'Wall Cover', NULL, true, true, 330),
      (jid, 'BLDG-331', 'Water-Resistant Barrier', 'Wall Cover', NULL, true, true, 331),
      (jid, 'BLDG-332', 'Window/Door Flashing', 'Wall Cover', NULL, true, true, 332),
      -- Commercial-specific
      (jid, 'BLDG-400', 'Above Ceiling (AGC)', 'Above Grid Ceiling', 'commercial', true, false, 400),
      (jid, 'BLDG-401', 'Tilt-Up Panels', 'Structural', 'commercial', true, false, 401),
      (jid, 'BLDG-402', 'Structural Steel', 'Structural', 'commercial', true, false, 402),
      (jid, 'BLDG-403', 'Special Inspection Review', 'Structural', 'commercial', true, false, 403),
      -- Pre-site & Site
      (jid, 'SITE-100', 'Pre-Site Inspection', 'Site', NULL, true, true, 500),
      (jid, 'SITE-200', 'Final Site Inspection', 'Site', NULL, true, true, 501),
      (jid, 'SITE-300', 'Lowest Floor Elevation (FEMA)', 'Site', NULL, true, true, 502),
      -- Finals
      (jid, 'BLDG-900', 'Final Plumbing', 'Finals', NULL, true, true, 900),
      (jid, 'BLDG-901', 'Final Electrical', 'Finals', NULL, true, true, 901),
      (jid, 'BLDG-902', 'Final Mechanical', 'Finals', NULL, true, true, 902),
      (jid, 'BLDG-903', 'Final Gas', 'Finals', NULL, true, true, 903),
      (jid, 'BLDG-904', 'Final Insulation', 'Finals', NULL, true, true, 904),
      (jid, 'BLDG-910', 'Final Building', 'Finals', NULL, true, true, 910),
      (jid, 'BLDG-911', 'Final Accessibility', 'Finals', 'commercial', true, false, 911),
      (jid, 'BLDG-912', 'Final Combo', 'Finals', NULL, true, true, 912),
      (jid, 'BLDG-920', 'Certificate of Occupancy', 'Certificate', 'commercial', true, false, 920),
      (jid, 'BLDG-921', 'Temporary Certificate of Occupancy (TCO)', 'Certificate', 'commercial', true, false, 921),
      (jid, 'BLDG-930', 'Final Solar PV', 'Finals', 'solar', true, true, 930),
      (jid, 'BLDG-931', 'MPU/Derate', 'Finals', NULL, true, true, 931),
      -- Pool & Spa
      (jid, 'POOL-100', 'Pool/Spa - Layout/Setbacks', 'Pool & Spa', 'pool', true, true, 1000),
      (jid, 'POOL-200', 'Pool/Spa - Bond Beam/Steel', 'Pool & Spa', 'pool', true, true, 1001),
      (jid, 'POOL-300', 'Pool/Spa - Plumbing Rough', 'Pool & Spa', 'pool', true, true, 1002),
      (jid, 'POOL-400', 'Pool/Spa - Electrical Rough', 'Pool & Spa', 'pool', true, true, 1003),
      (jid, 'POOL-500', 'Pool/Spa - Safety Barrier', 'Pool & Spa', 'pool', true, true, 1004),
      (jid, 'POOL-900', 'Pool/Spa - Final', 'Pool & Spa', 'pool', true, true, 1005),
      -- Fire
      (jid, 'FIRE-100', 'Fire Site', 'Fire', 'fire', true, true, 1100),
      (jid, 'FIRE-200', 'Sprinkler Underground', 'Fire', 'fire', true, false, 1101),
      (jid, 'FIRE-300', 'Sprinkler Rough', 'Fire', 'fire', true, false, 1102),
      (jid, 'FIRE-400', 'Sprinkler Final', 'Fire', 'fire', true, false, 1103),
      (jid, 'FIRE-500', 'Fire Alarm Rough', 'Fire', 'fire', true, false, 1104),
      (jid, 'FIRE-600', 'Fire Alarm Final', 'Fire', 'fire', true, false, 1105),
      (jid, 'FIRE-700', 'Kitchen Hood', 'Fire', 'fire', true, false, 1106),
      (jid, 'FIRE-800', 'Fire Final', 'Fire', 'fire', true, false, 1107),
      -- Civil/ROW
      (jid, 'ROW-100', 'Grading and Dirt Haul', 'Civil', 'civil', true, false, 1200),
      (jid, 'ROW-200', 'Sewer Line', 'Civil', 'civil', true, false, 1201),
      (jid, 'ROW-300', 'Water Line', 'Civil', 'civil', true, false, 1202),
      (jid, 'ROW-400', 'Storm Drain', 'Civil', 'civil', true, false, 1203),
      (jid, 'ROW-500', 'Concrete Placement', 'Civil', 'civil', true, false, 1204),
      (jid, 'ROW-600', 'Pavement Placement', 'Civil', 'civil', true, false, 1205),
      (jid, 'ROW-700', 'Utility/Communication Lines', 'Civil', 'civil', true, false, 1206);
  END IF;
END $$;

-- ============================================================
-- ACCELA TEMPLATE — Phoenix, Mesa (estimated)
-- These are the largest AZ jurisdictions by volume
-- Phoenix uses Accela with category-based inspection naming
-- Codes are estimated based on common Phoenix/Mesa Accela practices
-- ============================================================
DO $$
DECLARE
  jid UUID;
  city_names TEXT[] := ARRAY['City of Phoenix', 'City of Mesa'];
  city_name TEXT;
BEGIN
  FOREACH city_name IN ARRAY city_names LOOP
    SELECT id INTO jid FROM jurisdictions WHERE name = city_name;
    IF jid IS NOT NULL THEN
      INSERT INTO jurisdiction_inspection_codes (jurisdiction_id, code, description, category, permit_type, is_commercial, is_residential, sort_order) VALUES
        -- Foundation
        (jid, 'BLDG-FTNG', 'Footing/Foundation', 'Foundation', NULL, true, true, 100),
        (jid, 'BLDG-UFER', 'Ufer Ground', 'Foundation', NULL, true, true, 101),
        (jid, 'BLDG-STEM', 'Stem Wall', 'Foundation', NULL, true, true, 102),
        (jid, 'BLDG-SLAB', 'Pre-Slab', 'Foundation', NULL, true, true, 103),
        (jid, 'BLDG-PTSB', 'Post-Tension Slab', 'Foundation', NULL, true, true, 104),
        (jid, 'BLDG-TPWR', 'Temporary Power', 'Foundation', NULL, true, true, 105),
        (jid, 'BLDG-SETB', 'Layout/Setbacks', 'Foundation', NULL, true, true, 106),
        -- Underground
        (jid, 'BLDG-UGPL', 'Under Slab Plumbing', 'Underground/Soils', NULL, true, true, 200),
        (jid, 'BLDG-UGEL', 'Under Slab Electrical', 'Underground/Soils', NULL, true, true, 201),
        (jid, 'BLDG-UGCO', 'Under Slab Combo', 'Underground/Soils', NULL, true, true, 202),
        (jid, 'BLDG-UGSW', 'UG Building Sewer', 'Underground/Soils', NULL, true, true, 203),
        (jid, 'BLDG-UGWS', 'UG Water Service', 'Underground/Soils', NULL, true, true, 204),
        (jid, 'BLDG-UGES', 'UG Electric Service', 'Underground/Soils', NULL, true, true, 205),
        (jid, 'BLDG-UGGS', 'UG Gas Service', 'Underground/Soils', NULL, true, true, 206),
        -- Rough
        (jid, 'BLDG-SHWR', 'Shear Wall/Braced Wall', 'Rough', NULL, true, true, 300),
        (jid, 'BLDG-TRSS', 'Roof Truss/Nail', 'Rough', NULL, true, true, 301),
        (jid, 'BLDG-STSH', 'Strap & Shear Combo', 'Rough', NULL, true, true, 302),
        (jid, 'BLDG-RFMG', 'Rough Framing', 'Rough', NULL, true, true, 303),
        (jid, 'BLDG-RFCO', 'Rough Combo', 'Rough', NULL, true, true, 304),
        (jid, 'MECH-RFMG', 'Rough Mechanical', 'Rough', NULL, true, true, 310),
        (jid, 'PLMB-RFMG', 'Rough Plumbing', 'Rough', NULL, true, true, 311),
        (jid, 'ELEC-RFMG', 'Rough Electrical', 'Rough', NULL, true, true, 312),
        (jid, 'BLDG-INSL', 'Pre-Drywall Insulation', 'Rough', NULL, true, true, 320),
        (jid, 'BLDG-SHWR-TST', 'Pre-Slope & Shower Liner Test', 'Rough', NULL, true, true, 321),
        -- Masonry
        (jid, 'BLDG-WFTG', 'Wall Footings', 'Masonry', NULL, true, true, 400),
        (jid, 'BLDG-BDBM', 'Bond Beam', 'Masonry', NULL, true, true, 401),
        (jid, 'BLDG-WGRT', 'Wall Grout', 'Masonry', NULL, true, true, 402),
        -- Wall Cover
        (jid, 'BLDG-WDFL', 'Window/Door Flashing', 'Wall Cover', NULL, true, true, 500),
        (jid, 'BLDG-WRBL', 'Water-Resistant Barrier', 'Wall Cover', NULL, true, true, 501),
        (jid, 'BLDG-DRWL', 'Drywall Nail', 'Wall Cover', NULL, true, true, 502),
        (jid, 'BLDG-LATL', 'Lath Nail', 'Wall Cover', NULL, true, true, 503),
        -- Commercial structural
        (jid, 'BLDG-TLTP', 'Tilt-Up Panels', 'Structural', 'commercial', true, false, 600),
        (jid, 'BLDG-AGCF', 'Above Grid Ceiling (AGC)', 'Above Grid Ceiling', 'commercial', true, false, 601),
        (jid, 'BLDG-SREL', 'Service Entrance Section', 'Rough', 'commercial', true, false, 602),
        (jid, 'BLDG-DPNL', 'Distribution Panels', 'Rough', 'commercial', true, false, 603),
        (jid, 'BLDG-SPIR', 'Special Inspection Review', 'Structural', 'commercial', true, false, 604),
        (jid, 'BLDG-STRC', 'Storage Racking', 'Misc', 'commercial', true, false, 605),
        -- Finals
        (jid, 'MECH-FNLM', 'Final Mechanical', 'Finals', NULL, true, true, 900),
        (jid, 'PLMB-FNLM', 'Final Plumbing', 'Finals', NULL, true, true, 901),
        (jid, 'ELEC-FNLM', 'Final Electrical', 'Finals', NULL, true, true, 902),
        (jid, 'BLDG-FINS', 'Final Insulation', 'Finals', NULL, true, true, 903),
        (jid, 'BLDG-FNLB', 'Final Building', 'Finals', NULL, true, true, 904),
        (jid, 'BLDG-FNCO', 'Final Combo', 'Finals', NULL, true, true, 905),
        (jid, 'BLDG-FNFN', 'Final Fence', 'Finals', NULL, true, true, 906),
        (jid, 'BLDG-FNCP', 'Final Carport/Patio', 'Finals', NULL, true, true, 907),
        (jid, 'BLDG-FGAS', 'Final Gas', 'Finals', NULL, true, true, 908),
        (jid, 'BLDG-MPUD', 'MPU/Derate', 'Finals', NULL, true, true, 909),
        (jid, 'BLDG-SLRV', 'Final Solar PV', 'Finals', 'solar', true, true, 910),
        (jid, 'BLDG-BKFL', 'Backflow Cert', 'Finals', NULL, true, true, 911),
        (jid, 'BLDG-FACC', 'Final Accessibility', 'Finals', 'commercial', true, false, 912),
        -- Certificate
        (jid, 'BLDG-PLNN', 'Planning Site Inspection', 'Planning', 'commercial', true, false, 950),
        (jid, 'BLDG-PLNF', 'Planning Final', 'Planning', 'commercial', true, false, 951),
        (jid, 'BLDG-CO',   'Certificate of Occupancy', 'Certificate', 'commercial', true, false, 960),
        (jid, 'BLDG-TCO',  'Temporary Certificate of Occupancy', 'Certificate', 'commercial', true, false, 961),
        (jid, 'BLDG-CC',   'Certificate of Completion', 'Certificate', 'commercial', true, false, 962),
        -- Pool & Spa
        (jid, 'POOL-LAYT', 'Pool/Spa - Layout/Setbacks', 'Pool & Spa', 'pool', true, true, 1100),
        (jid, 'POOL-STEL', 'Pool/Spa - Bond Beam/Steel', 'Pool & Spa', 'pool', true, true, 1101),
        (jid, 'POOL-GNIT', 'Pool/Spa - Gunite/Shell', 'Pool & Spa', 'pool', true, true, 1102),
        (jid, 'POOL-PLMB', 'Pool/Spa - Rough Plumbing', 'Pool & Spa', 'pool', true, true, 1103),
        (jid, 'POOL-ELEC', 'Pool/Spa - Rough Electrical', 'Pool & Spa', 'pool', true, true, 1104),
        (jid, 'POOL-SFTY', 'Pool/Spa - Safety Barrier', 'Pool & Spa', 'pool', true, true, 1105),
        (jid, 'POOL-FNLB', 'Pool/Spa - Final', 'Pool & Spa', 'pool', true, true, 1106),
        -- Fire
        (jid, 'FIRE-SITE', 'Fire Site', 'Fire', 'fire', true, true, 1200),
        (jid, 'FIRE-UGND', 'Fire Underground Water Supply', 'Fire', 'fire', true, false, 1201),
        (jid, 'FIRE-SPRG', 'Sprinkler Rough', 'Fire', 'fire', true, false, 1202),
        (jid, 'FIRE-SPRF', 'Sprinkler Final', 'Fire', 'fire', true, false, 1203),
        (jid, 'FIRE-ALRG', 'Fire Alarm Rough', 'Fire', 'fire', true, false, 1204),
        (jid, 'FIRE-ALRF', 'Fire Alarm Final', 'Fire', 'fire', true, false, 1205),
        (jid, 'FIRE-KHOD', 'Kitchen Hood', 'Fire', 'fire', true, false, 1206),
        (jid, 'FIRE-PUMP', 'Fire Pump', 'Fire', 'fire', true, false, 1207),
        (jid, 'FIRE-FNLB', 'Fire Final', 'Fire', 'fire', true, false, 1208),
        (jid, 'FIRE-HAZM', 'Hazmat', 'Fire', 'fire', true, false, 1209),
        -- Misc
        (jid, 'BLDG-MISC', 'Courtesy Inspection', 'Misc', NULL, true, true, 1300),
        (jid, 'BLDG-AFHR', 'After Hours Inspection', 'Misc', NULL, true, true, 1301),
        (jid, 'BLDG-LFEV', 'Lowest Floor Elevation (FEMA)', 'Misc', NULL, true, true, 1302);
    END IF;
  END LOOP;
END $$;

-- ============================================================
-- CITY OF TUCSON (CitizenServe system — ESTIMATED)
-- Tucson's CitizenServe portal uses descriptive type names
-- ============================================================
DO $$
DECLARE jid UUID;
BEGIN
  SELECT id INTO jid FROM jurisdictions WHERE name = 'City of Tucson';
  IF jid IS NOT NULL THEN
    INSERT INTO jurisdiction_inspection_codes (jurisdiction_id, code, description, category, permit_type, is_commercial, is_residential, sort_order) VALUES
      -- Foundation
      (jid, 'BLD-01', 'Footing/Foundation', 'Foundation', NULL, true, true, 100),
      (jid, 'BLD-02', 'Ufer Ground', 'Foundation', NULL, true, true, 101),
      (jid, 'BLD-03', 'Stem Wall', 'Foundation', NULL, true, true, 102),
      (jid, 'BLD-04', 'Pre-Slab', 'Foundation', NULL, true, true, 103),
      (jid, 'BLD-05', 'Post-Tension Slab', 'Foundation', NULL, true, true, 104),
      (jid, 'BLD-06', 'Temporary Power', 'Foundation', NULL, true, true, 105),
      -- Underground
      (jid, 'BLD-10', 'Under Slab Plumbing', 'Underground/Soils', NULL, true, true, 200),
      (jid, 'BLD-11', 'Under Slab Electrical', 'Underground/Soils', NULL, true, true, 201),
      (jid, 'BLD-12', 'UG Building Sewer', 'Underground/Soils', NULL, true, true, 202),
      (jid, 'BLD-13', 'UG Water Service', 'Underground/Soils', NULL, true, true, 203),
      (jid, 'BLD-14', 'UG Gas Service', 'Underground/Soils', NULL, true, true, 204),
      -- Rough
      (jid, 'BLD-20', 'Rough Framing', 'Rough', NULL, true, true, 300),
      (jid, 'BLD-21', 'Strap & Shear Wall', 'Rough', NULL, true, true, 301),
      (jid, 'BLD-22', 'Masonry', 'Masonry', NULL, true, true, 302),
      (jid, 'PLM-20', 'Rough Plumbing', 'Rough', NULL, true, true, 310),
      (jid, 'ELC-20', 'Rough Electrical', 'Rough', NULL, true, true, 311),
      (jid, 'MEC-20', 'Rough Mechanical', 'Rough', NULL, true, true, 312),
      (jid, 'BLD-23', 'Pre-Drywall Insulation', 'Rough', NULL, true, true, 320),
      -- Wall Cover
      (jid, 'BLD-30', 'Lath/Gypsum Board', 'Wall Cover', NULL, true, true, 400),
      (jid, 'BLD-31', 'Water-Resistant Barrier', 'Wall Cover', NULL, true, true, 401),
      -- Commercial
      (jid, 'BLD-40', 'Above Grid Ceiling', 'Above Grid Ceiling', 'commercial', true, false, 500),
      (jid, 'BLD-41', 'Tilt-Up Panels', 'Structural', 'commercial', true, false, 501),
      (jid, 'BLD-42', 'Special Inspection Review', 'Structural', 'commercial', true, false, 502),
      -- Finals
      (jid, 'PLM-90', 'Final Plumbing', 'Finals', NULL, true, true, 900),
      (jid, 'ELC-90', 'Final Electrical', 'Finals', NULL, true, true, 901),
      (jid, 'MEC-90', 'Final Mechanical', 'Finals', NULL, true, true, 902),
      (jid, 'BLD-90', 'Final Building', 'Finals', NULL, true, true, 903),
      (jid, 'BLD-91', 'Final Accessibility', 'Finals', 'commercial', true, false, 904),
      (jid, 'BLD-92', 'Final Gas', 'Finals', NULL, true, true, 905),
      (jid, 'BLD-93', 'Final Insulation', 'Finals', NULL, true, true, 906),
      (jid, 'BLD-94', 'Final Solar PV', 'Finals', 'solar', true, true, 907),
      (jid, 'BLD-95', 'MPU/Derate', 'Finals', NULL, true, true, 908),
      (jid, 'BLD-96', 'Certificate of Occupancy', 'Certificate', 'commercial', true, false, 909),
      (jid, 'BLD-97', 'Temporary Certificate of Occupancy', 'Certificate', 'commercial', true, false, 910),
      -- Pool
      (jid, 'POOL-01', 'Pool/Spa - Layout', 'Pool & Spa', 'pool', true, true, 1000),
      (jid, 'POOL-02', 'Pool/Spa - Bond Beam/Steel', 'Pool & Spa', 'pool', true, true, 1001),
      (jid, 'POOL-03', 'Pool/Spa - Rough Plumbing', 'Pool & Spa', 'pool', true, true, 1002),
      (jid, 'POOL-04', 'Pool/Spa - Rough Electrical', 'Pool & Spa', 'pool', true, true, 1003),
      (jid, 'POOL-05', 'Pool/Spa - Safety Barrier', 'Pool & Spa', 'pool', true, true, 1004),
      (jid, 'POOL-90', 'Pool/Spa - Final', 'Pool & Spa', 'pool', true, true, 1005),
      -- Fire
      (jid, 'FIR-01', 'Fire Site', 'Fire', 'fire', true, true, 1100),
      (jid, 'FIR-02', 'Sprinkler Rough', 'Fire', 'fire', true, false, 1101),
      (jid, 'FIR-03', 'Sprinkler Final', 'Fire', 'fire', true, false, 1102),
      (jid, 'FIR-04', 'Fire Alarm Rough', 'Fire', 'fire', true, false, 1103),
      (jid, 'FIR-05', 'Fire Alarm Final', 'Fire', 'fire', true, false, 1104),
      (jid, 'FIR-06', 'Kitchen Hood', 'Fire', 'fire', true, false, 1105),
      (jid, 'FIR-90', 'Fire Final', 'Fire', 'fire', true, false, 1106);
  END IF;
END $$;

-- ============================================================
-- PIMA COUNTY (url portal — ESTIMATED generic codes)
-- ============================================================
DO $$
DECLARE jid UUID;
BEGIN
  SELECT id INTO jid FROM jurisdictions WHERE name = 'Pima County';
  IF jid IS NOT NULL THEN
    INSERT INTO jurisdiction_inspection_codes (jurisdiction_id, code, description, category, permit_type, is_commercial, is_residential, sort_order) VALUES
      (jid, '101', 'Footing/Foundation', 'Foundation', NULL, true, true, 100),
      (jid, '102', 'Ufer Ground', 'Foundation', NULL, true, true, 101),
      (jid, '103', 'Stem Wall', 'Foundation', NULL, true, true, 102),
      (jid, '104', 'Pre-Slab', 'Foundation', NULL, true, true, 103),
      (jid, '105', 'Temporary Power', 'Foundation', NULL, true, true, 104),
      (jid, '201', 'Under Slab Plumbing', 'Underground/Soils', NULL, true, true, 200),
      (jid, '202', 'Under Slab Electrical', 'Underground/Soils', NULL, true, true, 201),
      (jid, '203', 'UG Sewer', 'Underground/Soils', NULL, true, true, 202),
      (jid, '204', 'UG Water', 'Underground/Soils', NULL, true, true, 203),
      (jid, '205', 'UG Gas', 'Underground/Soils', NULL, true, true, 204),
      (jid, '301', 'Rough Framing', 'Rough', NULL, true, true, 300),
      (jid, '302', 'Strap & Shear Wall', 'Rough', NULL, true, true, 301),
      (jid, '303', 'Rough Plumbing', 'Rough', NULL, true, true, 302),
      (jid, '304', 'Rough Electrical', 'Rough', NULL, true, true, 303),
      (jid, '305', 'Rough Mechanical', 'Rough', NULL, true, true, 304),
      (jid, '306', 'Rough Combo', 'Rough', NULL, true, true, 305),
      (jid, '307', 'Masonry', 'Masonry', NULL, true, true, 306),
      (jid, '308', 'Pre-Drywall Insulation', 'Rough', NULL, true, true, 307),
      (jid, '401', 'Lath/Gypsum Board', 'Wall Cover', NULL, true, true, 400),
      (jid, '402', 'Water-Resistant Barrier', 'Wall Cover', NULL, true, true, 401),
      (jid, '501', 'Above Grid Ceiling', 'Above Grid Ceiling', 'commercial', true, false, 500),
      (jid, '901', 'Final Plumbing', 'Finals', NULL, true, true, 900),
      (jid, '902', 'Final Electrical', 'Finals', NULL, true, true, 901),
      (jid, '903', 'Final Mechanical', 'Finals', NULL, true, true, 902),
      (jid, '904', 'Final Gas', 'Finals', NULL, true, true, 903),
      (jid, '905', 'Final Insulation', 'Finals', NULL, true, true, 904),
      (jid, '910', 'Final Building', 'Finals', NULL, true, true, 905),
      (jid, '911', 'Final Accessibility', 'Finals', 'commercial', true, false, 906),
      (jid, '912', 'Final Combo', 'Finals', NULL, true, true, 907),
      (jid, '913', 'Final Solar PV', 'Finals', 'solar', true, true, 908),
      (jid, '920', 'Certificate of Occupancy', 'Certificate', 'commercial', true, false, 909),
      (jid, '921', 'Temporary Certificate of Occupancy', 'Certificate', 'commercial', true, false, 910);
  END IF;
END $$;

-- ============================================================
-- PINAL COUNTY (url portal — ESTIMATED generic codes)
-- ============================================================
DO $$
DECLARE jid UUID;
BEGIN
  SELECT id INTO jid FROM jurisdictions WHERE name = 'Pinal County';
  IF jid IS NOT NULL THEN
    INSERT INTO jurisdiction_inspection_codes (jurisdiction_id, code, description, category, permit_type, is_commercial, is_residential, sort_order) VALUES
      (jid, '101', 'Footing/Foundation', 'Foundation', NULL, true, true, 100),
      (jid, '102', 'Ufer Ground', 'Foundation', NULL, true, true, 101),
      (jid, '103', 'Stem Wall', 'Foundation', NULL, true, true, 102),
      (jid, '104', 'Pre-Slab', 'Foundation', NULL, true, true, 103),
      (jid, '105', 'Temporary Power', 'Foundation', NULL, true, true, 104),
      (jid, '201', 'Under Slab Plumbing', 'Underground/Soils', NULL, true, true, 200),
      (jid, '202', 'Under Slab Electrical', 'Underground/Soils', NULL, true, true, 201),
      (jid, '203', 'UG Sewer', 'Underground/Soils', NULL, true, true, 202),
      (jid, '204', 'UG Water', 'Underground/Soils', NULL, true, true, 203),
      (jid, '205', 'UG Gas', 'Underground/Soils', NULL, true, true, 204),
      (jid, '301', 'Rough Framing', 'Rough', NULL, true, true, 300),
      (jid, '302', 'Rough Plumbing', 'Rough', NULL, true, true, 301),
      (jid, '303', 'Rough Electrical', 'Rough', NULL, true, true, 302),
      (jid, '304', 'Rough Mechanical', 'Rough', NULL, true, true, 303),
      (jid, '305', 'Masonry', 'Masonry', NULL, true, true, 304),
      (jid, '306', 'Pre-Drywall Insulation', 'Rough', NULL, true, true, 305),
      (jid, '401', 'Lath/Gypsum Board', 'Wall Cover', NULL, true, true, 400),
      (jid, '901', 'Final Plumbing', 'Finals', NULL, true, true, 900),
      (jid, '902', 'Final Electrical', 'Finals', NULL, true, true, 901),
      (jid, '903', 'Final Mechanical', 'Finals', NULL, true, true, 902),
      (jid, '904', 'Final Gas', 'Finals', NULL, true, true, 903),
      (jid, '910', 'Final Building', 'Finals', NULL, true, true, 904),
      (jid, '920', 'Certificate of Occupancy', 'Certificate', 'commercial', true, false, 905);
  END IF;
END $$;
