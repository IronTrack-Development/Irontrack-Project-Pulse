-- IronTrack Pulse — Migration 013: Jurisdiction Inspection Codes
-- Run this in the Supabase SQL Editor AFTER migration 012

-- ============================================================
-- TABLE DEFINITION
-- ============================================================

CREATE TABLE IF NOT EXISTS jurisdiction_inspection_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jurisdiction_id UUID NOT NULL REFERENCES jurisdictions(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  permit_type TEXT,           -- 'residential', 'commercial', 'fire', 'pool', 'solar', 'demo', 'sign', 'civil', NULL (all)
  is_commercial BOOLEAN DEFAULT true,
  is_residential BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jic_jurisdiction ON jurisdiction_inspection_codes(jurisdiction_id);
CREATE INDEX IF NOT EXISTS idx_jic_category ON jurisdiction_inspection_codes(category);

ALTER TABLE jurisdiction_inspection_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_jurisdiction_inspection_codes" ON jurisdiction_inspection_codes
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- NOTE ON DATA QUALITY
-- Specific = pulled from official city documents / web sources
-- EnerGov Template = Chandler-confirmed codes used as template
-- Accela Template = Standard Accela-style codes for AZ
-- Generic = IBC/IRC standardized codes, NOT jurisdiction-specific
-- ============================================================


-- ============================================================
-- CITY OF AVONDALE (SELECTXT system — CONFIRMED SPECIFIC CODES)
-- Source: Official Avondale Building Dept inspection code sheet
-- ============================================================

-- === Avondale Residential (BLDRES) — Foundation ===
INSERT INTO jurisdiction_inspection_codes (jurisdiction_id, code, description, category, permit_type, is_commercial, is_residential, sort_order)
SELECT id, '100', 'Layout/Setbacks', 'Foundation', 'residential', false, true, 100 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '105', 'Footing/Ufer', 'Foundation', 'residential', false, true, 105 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '110', 'Stem', 'Foundation', 'residential', false, true, 110 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '115', 'Pre-Slab/Interior Footing', 'Foundation', 'residential', false, true, 115 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '120', 'Post-Tension Slab', 'Foundation', 'residential', false, true, 120 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '125', 'Foundation Combo', 'Foundation', 'residential', false, true, 125 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '130', 'Fence', 'Foundation', 'residential', false, true, 130 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '135', 'Early/Temp Power', 'Foundation', 'residential', false, true, 135 FROM jurisdictions WHERE name = 'City of Avondale';

-- === Avondale Residential — Underground/Soils ===
INSERT INTO jurisdiction_inspection_codes (jurisdiction_id, code, description, category, permit_type, is_commercial, is_residential, sort_order)
SELECT id, '150', 'Under Slab Plumbing', 'Underground/Soils', 'residential', false, true, 150 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '155', 'Under Slab Electrical', 'Underground/Soils', 'residential', false, true, 155 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '160', 'Under Slab Combo', 'Underground/Soils', 'residential', false, true, 160 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '165', 'UG Building Sewer', 'Underground/Soils', 'residential', false, true, 165 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '170', 'UG Water Service', 'Underground/Soils', 'residential', false, true, 170 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '175', 'UG Electric Service', 'Underground/Soils', 'residential', false, true, 175 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '180', 'UG Gas Service', 'Underground/Soils', 'residential', false, true, 180 FROM jurisdictions WHERE name = 'City of Avondale';

-- === Avondale Residential — Rough ===
INSERT INTO jurisdiction_inspection_codes (jurisdiction_id, code, description, category, permit_type, is_commercial, is_residential, sort_order)
SELECT id, '200', 'Shear Wall/Braced Wall', 'Rough', 'residential', false, true, 200 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '205', 'Roof Truss/Nail', 'Rough', 'residential', false, true, 205 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '206', 'Strap & Shear Combo', 'Rough', 'residential', false, true, 206 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '210', 'Rough Mechanical', 'Rough', 'residential', false, true, 210 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '215', 'Rough Plumbing', 'Rough', 'residential', false, true, 215 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '220', 'Rough Electric', 'Rough', 'residential', false, true, 220 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '240', 'Rough Framing', 'Rough', 'residential', false, true, 240 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '245', 'Rough Combo', 'Rough', 'residential', false, true, 245 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '250', 'Pre-Drywall Insulation', 'Rough', 'residential', false, true, 250 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '255', 'Pre-Slope & Shower Liner Test', 'Rough', 'residential', false, true, 255 FROM jurisdictions WHERE name = 'City of Avondale';

-- === Avondale Residential — Masonry ===
INSERT INTO jurisdiction_inspection_codes (jurisdiction_id, code, description, category, permit_type, is_commercial, is_residential, sort_order)
SELECT id, '270', 'Wall Footings', 'Masonry', 'residential', false, true, 270 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '275', 'Bond Beam', 'Masonry', 'residential', false, true, 275 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '280', 'Wall Grout', 'Masonry', 'residential', false, true, 280 FROM jurisdictions WHERE name = 'City of Avondale';

-- === Avondale Residential — Wall Cover ===
INSERT INTO jurisdiction_inspection_codes (jurisdiction_id, code, description, category, permit_type, is_commercial, is_residential, sort_order)
SELECT id, '300', 'Window/Door Flashing', 'Wall Cover', 'residential', false, true, 300 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '310', 'Water-Resistant Barrier', 'Wall Cover', 'residential', false, true, 310 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '320', 'Wall Cover Combo', 'Wall Cover', 'residential', false, true, 320 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '330', 'Drywall Nail', 'Wall Cover', 'residential', false, true, 330 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '340', 'Lath Nail', 'Wall Cover', 'residential', false, true, 340 FROM jurisdictions WHERE name = 'City of Avondale';

-- === Avondale — Signs ===
INSERT INTO jurisdiction_inspection_codes (jurisdiction_id, code, description, category, permit_type, is_commercial, is_residential, sort_order)
SELECT id, '500', 'Sign - Electrical Rough', 'Signs', 'sign', true, false, 500 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '505', 'Sign - Electrical', 'Signs', 'sign', true, false, 505 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '510', 'Sign - Final', 'Signs', 'sign', true, false, 510 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '515', 'Sign - Final Electrical', 'Signs', 'sign', true, false, 515 FROM jurisdictions WHERE name = 'City of Avondale';

-- === Avondale — Misc ===
INSERT INTO jurisdiction_inspection_codes (jurisdiction_id, code, description, category, permit_type, is_commercial, is_residential, sort_order)
SELECT id, '550', 'After Hours', 'Misc', NULL, true, true, 550 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '555', 'Landscape Irrigation', 'Misc', NULL, true, true, 555 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '560', 'Courtesy', 'Misc', NULL, true, true, 560 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '570', 'Non-Permitted', 'Misc', NULL, true, true, 570 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '580', 'Lowest Floor Elevation', 'Misc', NULL, true, true, 580 FROM jurisdictions WHERE name = 'City of Avondale';

-- === Avondale Residential — Finals ===
INSERT INTO jurisdiction_inspection_codes (jurisdiction_id, code, description, category, permit_type, is_commercial, is_residential, sort_order)
SELECT id, '605', 'Backflow Cert', 'Finals', 'residential', false, true, 605 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '610', 'Final Mechanical', 'Finals', 'residential', false, true, 610 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '615', 'Final Plumbing', 'Finals', 'residential', false, true, 615 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '620', 'Final Electrical', 'Finals', 'residential', false, true, 620 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '625', 'Final Insulation', 'Finals', 'residential', false, true, 625 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '630', 'Final Building', 'Finals', 'residential', false, true, 630 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '640', 'Final Combo', 'Finals', 'residential', false, true, 640 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '650', 'Final Fence', 'Finals', 'residential', false, true, 650 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '655', 'Final Carport/Patio', 'Finals', 'residential', false, true, 655 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '660', 'Final Gas', 'Finals', 'residential', false, true, 660 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '665', 'MPU/Derate', 'Finals', 'residential', false, true, 665 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '670', 'Final Solar PV', 'Finals', 'solar', false, true, 670 FROM jurisdictions WHERE name = 'City of Avondale';

-- === Avondale — Demo ===
INSERT INTO jurisdiction_inspection_codes (jurisdiction_id, code, description, category, permit_type, is_commercial, is_residential, sort_order)
SELECT id, '675', 'Demo - Final Grading', 'Demo', 'demo', true, true, 675 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '680', 'Demo - Final Building', 'Demo', 'demo', true, true, 680 FROM jurisdictions WHERE name = 'City of Avondale';

-- === Avondale — Manufactured Home (700-735) ===
INSERT INTO jurisdiction_inspection_codes (jurisdiction_id, code, description, category, permit_type, is_commercial, is_residential, sort_order)
SELECT id, '700', 'Manufactured Home - Layout/Setbacks', 'Manufactured Home', 'residential', false, true, 700 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '705', 'Manufactured Home - Footing/Pier', 'Manufactured Home', 'residential', false, true, 705 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '710', 'Manufactured Home - Setup', 'Manufactured Home', 'residential', false, true, 710 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '715', 'Manufactured Home - Electrical', 'Manufactured Home', 'residential', false, true, 715 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '720', 'Manufactured Home - Plumbing', 'Manufactured Home', 'residential', false, true, 720 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '725', 'Manufactured Home - Mechanical', 'Manufactured Home', 'residential', false, true, 725 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '730', 'Manufactured Home - Tie-Down', 'Manufactured Home', 'residential', false, true, 730 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '735', 'Manufactured Home - Final', 'Manufactured Home', 'residential', false, true, 735 FROM jurisdictions WHERE name = 'City of Avondale';

-- === Avondale — Pool & Spa (740-795) ===
INSERT INTO jurisdiction_inspection_codes (jurisdiction_id, code, description, category, permit_type, is_commercial, is_residential, sort_order)
SELECT id, '740', 'Pool/Spa - Layout/Setbacks', 'Pool & Spa', 'pool', true, true, 740 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '745', 'Pool/Spa - Bond Beam/Steel', 'Pool & Spa', 'pool', true, true, 745 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '750', 'Pool/Spa - Gunite/Shell', 'Pool & Spa', 'pool', true, true, 750 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '755', 'Pool/Spa - Rough Plumbing', 'Pool & Spa', 'pool', true, true, 755 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '760', 'Pool/Spa - Rough Electrical', 'Pool & Spa', 'pool', true, true, 760 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '765', 'Pool/Spa - Gas Rough', 'Pool & Spa', 'pool', true, true, 765 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '770', 'Pool/Spa - Decking', 'Pool & Spa', 'pool', true, true, 770 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '775', 'Pool/Spa - Safety Barrier/Fence', 'Pool & Spa', 'pool', true, true, 775 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '780', 'Pool/Spa - Final Plumbing', 'Pool & Spa', 'pool', true, true, 780 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '785', 'Pool/Spa - Final Electrical', 'Pool & Spa', 'pool', true, true, 785 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '790', 'Pool/Spa - Final Gas', 'Pool & Spa', 'pool', true, true, 790 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '795', 'Pool/Spa - Final', 'Pool & Spa', 'pool', true, true, 795 FROM jurisdictions WHERE name = 'City of Avondale';

-- === Avondale — Fire (Master) ===
INSERT INTO jurisdiction_inspection_codes (jurisdiction_id, code, description, category, permit_type, is_commercial, is_residential, sort_order)
SELECT id, '900', 'Fire Site', 'Fire', 'fire', true, true, 900 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '901', 'UG Water Supply - Hydrostatic Test', 'Fire', 'fire', true, false, 901 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '902', 'UG Water Supply - Flush', 'Fire', 'fire', true, false, 902 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '903', 'UG Water Supply - Other', 'Fire', 'fire', true, false, 903 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '905', 'Construction Access', 'Fire', 'fire', true, false, 905 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '911', 'Fire Final (Residential)', 'Fire', 'fire', false, true, 911 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '914', 'Sprinkler - Underground', 'Fire', 'fire', true, false, 914 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '915', 'Sprinkler - Overhead Rough', 'Fire', 'fire', true, false, 915 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '916', 'Kitchen Hood', 'Fire', 'fire', true, false, 916 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '917', 'Alt Suppression - Rough', 'Fire', 'fire', true, false, 917 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '918', 'Alt Suppression - Final', 'Fire', 'fire', true, false, 918 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '919', 'Sprinkler - Final', 'Fire', 'fire', true, false, 919 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '921', 'Alarm - Rough', 'Fire', 'fire', true, false, 921 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '922', 'Access Control', 'Fire', 'fire', true, false, 922 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '929', 'Alarm - Final', 'Fire', 'fire', true, false, 929 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '939', 'Fire Pump', 'Fire', 'fire', true, false, 939 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '944', 'Fire Access Site', 'Fire', 'fire', true, false, 944 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '948', 'Certificate of Occupancy (Fire)', 'Fire', 'fire', true, false, 948 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '949', 'Final Commercial (Fire)', 'Fire', 'fire', true, false, 949 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '961', 'Hazmat - Site Assessment', 'Fire', 'fire', true, false, 961 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '962', 'Hazmat - Initial', 'Fire', 'fire', true, false, 962 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '963', 'Hazmat - Rough', 'Fire', 'fire', true, false, 963 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '964', 'Hazmat - Mechanical', 'Fire', 'fire', true, false, 964 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '965', 'Hazmat - Electrical', 'Fire', 'fire', true, false, 965 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '966', 'Hazmat - Plumbing', 'Fire', 'fire', true, false, 966 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '967', 'Hazmat - Sprinkler', 'Fire', 'fire', true, false, 967 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '968', 'Hazmat - Final', 'Fire', 'fire', true, false, 968 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '969', 'Hazmat - Other', 'Fire', 'fire', true, false, 969 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '988', 'Certificate of Occupancy (Residential Fire)', 'Fire', 'fire', false, true, 988 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '989', 'Final Residential (Fire)', 'Fire', 'fire', false, true, 989 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '990', 'Special Events', 'Fire', 'fire', true, false, 990 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '999', 'Other', 'Fire', 'fire', true, true, 999 FROM jurisdictions WHERE name = 'City of Avondale';

-- === Avondale Commercial (BLDCOM) — Additional codes beyond residential ===
INSERT INTO jurisdiction_inspection_codes (jurisdiction_id, code, description, category, permit_type, is_commercial, is_residential, sort_order)
-- Commercial-only foundation (same codes as residential but COM type)
SELECT id, '100', 'Layout/Setbacks', 'Foundation', 'commercial', true, false, 100 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '105', 'Footing/Ufer', 'Foundation', 'commercial', true, false, 105 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '110', 'Stem', 'Foundation', 'commercial', true, false, 110 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '115', 'Pre-Slab/Interior Footing', 'Foundation', 'commercial', true, false, 115 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '120', 'Post-Tension Slab', 'Foundation', 'commercial', true, false, 120 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '125', 'Foundation Combo', 'Foundation', 'commercial', true, false, 125 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '135', 'Early/Temp Power', 'Foundation', 'commercial', true, false, 135 FROM jurisdictions WHERE name = 'City of Avondale'
-- Commercial underground
UNION ALL SELECT id, '150', 'Under Slab Plumbing', 'Underground/Soils', 'commercial', true, false, 150 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '155', 'Under Slab Electrical', 'Underground/Soils', 'commercial', true, false, 155 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '160', 'Under Slab Combo', 'Underground/Soils', 'commercial', true, false, 160 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '165', 'UG Building Sewer', 'Underground/Soils', 'commercial', true, false, 165 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '170', 'UG Water Service', 'Underground/Soils', 'commercial', true, false, 170 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '175', 'UG Electric Service', 'Underground/Soils', 'commercial', true, false, 175 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '180', 'UG Gas Service', 'Underground/Soils', 'commercial', true, false, 180 FROM jurisdictions WHERE name = 'City of Avondale'
-- Commercial rough
UNION ALL SELECT id, '200', 'Shear Wall/Braced Wall', 'Rough', 'commercial', true, false, 200 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '205', 'Roof Truss/Nail', 'Rough', 'commercial', true, false, 205 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '210', 'Rough Mechanical', 'Rough', 'commercial', true, false, 210 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '215', 'Rough Plumbing', 'Rough', 'commercial', true, false, 215 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '220', 'Rough Electric', 'Rough', 'commercial', true, false, 220 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '225', 'Service Entrance Section', 'Rough', 'commercial', true, false, 225 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '230', 'Distribution Panels', 'Rough', 'commercial', true, false, 230 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '235', 'Other Electric', 'Rough', 'commercial', true, false, 235 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '240', 'Rough Framing', 'Rough', 'commercial', true, false, 240 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '245', 'Rough Combo', 'Rough', 'commercial', true, false, 245 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '250', 'Pre-Drywall Insulation', 'Rough', 'commercial', true, false, 250 FROM jurisdictions WHERE name = 'City of Avondale'
-- Commercial masonry
UNION ALL SELECT id, '270', 'Wall Footings', 'Masonry', 'commercial', true, false, 270 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '275', 'Bond Beam', 'Masonry', 'commercial', true, false, 275 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '280', 'Wall Grout', 'Masonry', 'commercial', true, false, 280 FROM jurisdictions WHERE name = 'City of Avondale'
-- Commercial structural
UNION ALL SELECT id, '350', 'Tilt Panels', 'Structural', 'commercial', true, false, 350 FROM jurisdictions WHERE name = 'City of Avondale'
-- Above Grid Ceiling (AGC) — Commercial only
UNION ALL SELECT id, '400', 'AGC - Framing', 'Above Grid Ceiling', 'commercial', true, false, 400 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '405', 'AGC - Plumbing', 'Above Grid Ceiling', 'commercial', true, false, 405 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '410', 'AGC - Electrical', 'Above Grid Ceiling', 'commercial', true, false, 410 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '415', 'AGC - Mechanical', 'Above Grid Ceiling', 'commercial', true, false, 415 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '420', 'AGC - Fire Dampers', 'Above Grid Ceiling', 'commercial', true, false, 420 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '425', 'AGC - Labeling', 'Above Grid Ceiling', 'commercial', true, false, 425 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '430', 'AGC - Roof Drain', 'Above Grid Ceiling', 'commercial', true, false, 430 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '435', 'AGC - HVAC Pre-Wrap', 'Above Grid Ceiling', 'commercial', true, false, 435 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '440', 'AGC - Combo', 'Above Grid Ceiling', 'commercial', true, false, 440 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '445', 'AGC - Grease Duct Test', 'Above Grid Ceiling', 'commercial', true, false, 445 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '450', 'AGC - Type I Hood Test', 'Above Grid Ceiling', 'commercial', true, false, 450 FROM jurisdictions WHERE name = 'City of Avondale'
-- Commercial misc
UNION ALL SELECT id, '565', 'Storage Racking', 'Misc', 'commercial', true, false, 565 FROM jurisdictions WHERE name = 'City of Avondale'
-- Commercial finals
UNION ALL SELECT id, '600', 'Special Inspection Review', 'Finals', 'commercial', true, false, 600 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '605', 'Backflow Cert', 'Finals', 'commercial', true, false, 605 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '610', 'Final Mechanical', 'Finals', 'commercial', true, false, 610 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '615', 'Final Plumbing', 'Finals', 'commercial', true, false, 615 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '620', 'Final Electrical', 'Finals', 'commercial', true, false, 620 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '625', 'Final Insulation', 'Finals', 'commercial', true, false, 625 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '630', 'Final Building', 'Finals', 'commercial', true, false, 630 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '635', 'Final Accessibility', 'Finals', 'commercial', true, false, 635 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '640', 'Final Combo', 'Finals', 'commercial', true, false, 640 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '645', 'Final Combo (Commercial)', 'Finals', 'commercial', true, false, 645 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '660', 'Final Gas', 'Finals', 'commercial', true, false, 660 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '665', 'MPU/Derate', 'Finals', 'commercial', true, false, 665 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '670', 'Final Solar PV', 'Finals', 'solar', true, false, 670 FROM jurisdictions WHERE name = 'City of Avondale'
-- Planning
UNION ALL SELECT id, '800', 'Planning Site Inspection', 'Planning', 'commercial', true, false, 800 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '820', 'Planning Final', 'Planning', 'commercial', true, false, 820 FROM jurisdictions WHERE name = 'City of Avondale'
-- CO / TCO
UNION ALL SELECT id, '870', 'Certificate of Completion', 'Certificate', 'commercial', true, false, 870 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '880', 'Temporary Certificate of Occupancy (TCO)', 'Certificate', 'commercial', true, false, 880 FROM jurisdictions WHERE name = 'City of Avondale'
UNION ALL SELECT id, '890', 'Certificate of Occupancy (CO)', 'Certificate', 'commercial', true, false, 890 FROM jurisdictions WHERE name = 'City of Avondale';
