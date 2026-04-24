-- IronTrack Pulse — Migration 013d: Generic IBC/IRC Inspection Codes
-- Run AFTER 013c_jurisdiction_inspection_codes.sql
--
-- DATA QUALITY: ALL CODES ARE GENERIC (IBC/IRC standard types)
-- These are NOT jurisdiction-specific codes — they are a standardized set
-- based on IBC/IRC required inspection points, adapted for Arizona.
-- Jurisdictions in this file could not have specific codes verified.
-- When a contractor schedules, they should confirm the actual code
-- with the local building department.
--
-- Jurisdictions covered by this file:
--   Cities: Apache Junction, Benson, Bisbee, Bullhead City, Casa Grande,
--           Coolidge, Cottonwood, Douglas, El Mirage, Eloy, Flagstaff,
--           Globe, Holbrook, Kingman, Lake Havasu City, Marana, Maricopa,
--           Nogales, Oro Valley, Page, Prescott, Prescott Valley, Safford,
--           San Luis, Sedona, Show Low, Sierra Vista, Somerton, South Tucson,
--           Tolleson, Tombstone, Willcox, Winslow, Yuma
--   Towns: Camp Verde, Carefree, Cave Creek, Chino Valley, Clarkdale,
--           Clifton, Colorado City, Dewey-Humboldt, Duncan, Eagar, Florence,
--           Fountain Hills, Fredonia, Gila Bend, Guadalupe, Hayden,
--           Huachuca City, Jerome, Kearny, Litchfield Park, Mammoth, Miami,
--           Paradise Valley, Parker, Patagonia, Payson, Pima, Pinetop-Lakeside,
--           Quartzsite, Sahuarita, San Tan Valley, Snowflake, Springerville,
--           St. Johns, Star Valley, Superior, Taylor, Thatcher, Tusayan,
--           Wellton, Wickenburg, Williams, Winkelman, Youngtown
--   Counties: Apache, Cochise, Coconino, Gila, Graham, Greenlee, La Paz,
--             Mohave, Navajo, Santa Cruz, Yavapai, Yuma
-- ============================================================

-- Generic IBC/IRC standard inspection code set
-- Based on IRC R109 and IBC 1705 required inspection points

DO $$
DECLARE
  jid UUID;
  jurisdiction_names TEXT[] := ARRAY[
    -- Cities
    'City of Apache Junction',
    'City of Benson',
    'City of Bisbee',
    'City of Bullhead City',
    'City of Casa Grande',
    'City of Coolidge',
    'City of Cottonwood',
    'City of Douglas',
    'City of El Mirage',
    'City of Eloy',
    'City of Flagstaff',
    'City of Globe',
    'City of Holbrook',
    'City of Kingman',
    'City of Lake Havasu City',
    'City of Marana',
    'City of Maricopa',
    'City of Nogales',
    'City of Oro Valley',
    'City of Page',
    'City of Prescott',
    'City of Prescott Valley',
    'City of Safford',
    'City of San Luis',
    'City of Sedona',
    'City of Show Low',
    'City of Sierra Vista',
    'City of Somerton',
    'City of South Tucson',
    'City of Tolleson',
    'City of Tombstone',
    'City of Willcox',
    'City of Winslow',
    'City of Yuma',
    -- Towns
    'Town of Camp Verde',
    'Town of Carefree',
    'Town of Cave Creek',
    'Town of Chino Valley',
    'Town of Clarkdale',
    'Town of Clifton',
    'Town of Colorado City',
    'Town of Dewey-Humboldt',
    'Town of Duncan',
    'Town of Eagar',
    'Town of Florence',
    'Town of Fountain Hills',
    'Town of Fredonia',
    'Town of Gila Bend',
    'Town of Guadalupe',
    'Town of Hayden',
    'Town of Huachuca City',
    'Town of Jerome',
    'Town of Kearny',
    'Town of Litchfield Park',
    'Town of Mammoth',
    'Town of Miami',
    'Town of Paradise Valley',
    'Town of Parker',
    'Town of Patagonia',
    'Town of Payson',
    'Town of Pima',
    'Town of Pinetop-Lakeside',
    'Town of Quartzsite',
    'Town of Sahuarita',
    'Town of San Tan Valley',
    'Town of Snowflake',
    'Town of Springerville',
    'Town of St. Johns',
    'Town of Star Valley',
    'Town of Superior',
    'Town of Taylor',
    'Town of Thatcher',
    'Town of Tusayan',
    'Town of Wellton',
    'Town of Wickenburg',
    'Town of Williams',
    'Town of Winkelman',
    'Town of Youngtown',
    -- Counties
    'Apache County',
    'Cochise County',
    'Coconino County',
    'Gila County',
    'Graham County',
    'Greenlee County',
    'La Paz County',
    'Mohave County',
    'Navajo County',
    'Santa Cruz County',
    'Yavapai County',
    'Yuma County'
  ];
  jname TEXT;
BEGIN
  FOREACH jname IN ARRAY jurisdiction_names LOOP
    SELECT id INTO jid FROM jurisdictions WHERE name = jname;
    IF jid IS NOT NULL THEN

      -- Foundation Inspections
      INSERT INTO jurisdiction_inspection_codes
        (jurisdiction_id, code, description, category, permit_type, is_commercial, is_residential, sort_order)
      VALUES
        (jid, 'GEN-F01', 'Footing/Foundation', 'Foundation', NULL, true, true, 100),
        (jid, 'GEN-F02', 'Ufer Ground', 'Foundation', NULL, true, true, 101),
        (jid, 'GEN-F03', 'Stem Wall', 'Foundation', NULL, true, true, 102),
        (jid, 'GEN-F04', 'Pre-Slab', 'Foundation', NULL, true, true, 103),
        (jid, 'GEN-F05', 'Post-Tension Slab', 'Foundation', NULL, true, true, 104),
        (jid, 'GEN-F06', 'Temporary Power', 'Foundation', NULL, true, true, 105),
        (jid, 'GEN-F07', 'Retaining Wall', 'Foundation', NULL, true, true, 106),

        -- Underground / Under-Slab
        (jid, 'GEN-U01', 'Under Slab Plumbing', 'Underground/Soils', NULL, true, true, 200),
        (jid, 'GEN-U02', 'Under Slab Electrical', 'Underground/Soils', NULL, true, true, 201),
        (jid, 'GEN-U03', 'Under Slab Combo', 'Underground/Soils', NULL, true, true, 202),
        (jid, 'GEN-U04', 'UG Building Sewer', 'Underground/Soils', NULL, true, true, 203),
        (jid, 'GEN-U05', 'UG Water Service', 'Underground/Soils', NULL, true, true, 204),
        (jid, 'GEN-U06', 'UG Gas Service', 'Underground/Soils', NULL, true, true, 205),
        (jid, 'GEN-U07', 'UG Electric Service', 'Underground/Soils', NULL, true, true, 206),

        -- Rough / Framing
        (jid, 'GEN-R01', 'Strap & Shear Wall', 'Rough', NULL, true, true, 300),
        (jid, 'GEN-R02', 'Rough Framing', 'Rough', NULL, true, true, 301),
        (jid, 'GEN-R03', 'Rough Plumbing', 'Rough', NULL, true, true, 302),
        (jid, 'GEN-R04', 'Rough Electrical', 'Rough', NULL, true, true, 303),
        (jid, 'GEN-R05', 'Rough Mechanical', 'Rough', NULL, true, true, 304),
        (jid, 'GEN-R06', 'Rough Combo (MEP)', 'Rough', NULL, true, true, 305),
        (jid, 'GEN-R07', 'Pre-Drywall Insulation', 'Rough', NULL, true, true, 306),

        -- Masonry
        (jid, 'GEN-M01', 'Masonry - Wall Footings', 'Masonry', NULL, true, true, 400),
        (jid, 'GEN-M02', 'Masonry - Bond Beam', 'Masonry', NULL, true, true, 401),
        (jid, 'GEN-M03', 'Masonry - Wall Grout', 'Masonry', NULL, true, true, 402),

        -- Wall Cover
        (jid, 'GEN-W01', 'Window/Door Flashing', 'Wall Cover', NULL, true, true, 500),
        (jid, 'GEN-W02', 'Water-Resistant Barrier', 'Wall Cover', NULL, true, true, 501),
        (jid, 'GEN-W03', 'Lath/Gypsum Board', 'Wall Cover', NULL, true, true, 502),
        (jid, 'GEN-W04', 'Drywall Nail', 'Wall Cover', NULL, true, true, 503),

        -- Commercial Structural
        (jid, 'GEN-S01', 'Tilt-Up Panels', 'Structural', 'commercial', true, false, 600),
        (jid, 'GEN-S02', 'Structural Steel', 'Structural', 'commercial', true, false, 601),
        (jid, 'GEN-S03', 'Above Grid Ceiling (AGC)', 'Above Grid Ceiling', 'commercial', true, false, 602),
        (jid, 'GEN-S04', 'Special Inspection Review', 'Structural', 'commercial', true, false, 603),

        -- Finals
        (jid, 'GEN-X01', 'Final Plumbing', 'Finals', NULL, true, true, 900),
        (jid, 'GEN-X02', 'Final Electrical', 'Finals', NULL, true, true, 901),
        (jid, 'GEN-X03', 'Final Mechanical', 'Finals', NULL, true, true, 902),
        (jid, 'GEN-X04', 'Final Gas', 'Finals', NULL, true, true, 903),
        (jid, 'GEN-X05', 'Final Insulation', 'Finals', NULL, true, true, 904),
        (jid, 'GEN-X06', 'Backflow Certification', 'Finals', NULL, true, true, 905),
        (jid, 'GEN-X07', 'Final Building', 'Finals', NULL, true, true, 906),
        (jid, 'GEN-X08', 'Final Accessibility', 'Finals', 'commercial', true, false, 907),
        (jid, 'GEN-X09', 'Final Combo', 'Finals', NULL, true, true, 908),
        (jid, 'GEN-X10', 'Final Fence/Wall', 'Finals', NULL, true, true, 909),
        (jid, 'GEN-X11', 'Final Carport/Patio Cover', 'Finals', NULL, true, true, 910),
        (jid, 'GEN-X12', 'Final Solar PV', 'Finals', 'solar', true, true, 911),
        (jid, 'GEN-X13', 'MPU/Derate', 'Finals', NULL, true, true, 912),

        -- Certificate
        (jid, 'GEN-C01', 'Certificate of Occupancy', 'Certificate', 'commercial', true, false, 950),
        (jid, 'GEN-C02', 'Temporary Certificate of Occupancy', 'Certificate', 'commercial', true, false, 951),
        (jid, 'GEN-C03', 'Certificate of Completion', 'Certificate', 'commercial', true, false, 952),

        -- Pool & Spa
        (jid, 'GEN-P01', 'Pool/Spa - Layout/Setbacks', 'Pool & Spa', 'pool', true, true, 1000),
        (jid, 'GEN-P02', 'Pool/Spa - Bond Beam/Steel', 'Pool & Spa', 'pool', true, true, 1001),
        (jid, 'GEN-P03', 'Pool/Spa - Gunite/Shell', 'Pool & Spa', 'pool', true, true, 1002),
        (jid, 'GEN-P04', 'Pool/Spa - Rough Plumbing', 'Pool & Spa', 'pool', true, true, 1003),
        (jid, 'GEN-P05', 'Pool/Spa - Rough Electrical', 'Pool & Spa', 'pool', true, true, 1004),
        (jid, 'GEN-P06', 'Pool/Spa - Safety Barrier', 'Pool & Spa', 'pool', true, true, 1005),
        (jid, 'GEN-P07', 'Pool/Spa - Final', 'Pool & Spa', 'pool', true, true, 1006),

        -- Fire
        (jid, 'GEN-FR01', 'Fire Site', 'Fire', 'fire', true, true, 1100),
        (jid, 'GEN-FR02', 'Sprinkler Rough', 'Fire', 'fire', true, false, 1101),
        (jid, 'GEN-FR03', 'Sprinkler Final', 'Fire', 'fire', true, false, 1102),
        (jid, 'GEN-FR04', 'Fire Alarm Rough', 'Fire', 'fire', true, false, 1103),
        (jid, 'GEN-FR05', 'Fire Alarm Final', 'Fire', 'fire', true, false, 1104),
        (jid, 'GEN-FR06', 'Kitchen Hood', 'Fire', 'fire', true, false, 1105),
        (jid, 'GEN-FR07', 'Fire Final', 'Fire', 'fire', true, false, 1106),

        -- Demo
        (jid, 'GEN-D01', 'Demo - Final Grading', 'Demo', 'demo', true, true, 1200),
        (jid, 'GEN-D02', 'Demo - Final Building', 'Demo', 'demo', true, true, 1201),

        -- Signs
        (jid, 'GEN-SG01', 'Sign - Structural', 'Signs', 'sign', true, false, 1300),
        (jid, 'GEN-SG02', 'Sign - Electrical', 'Signs', 'sign', true, false, 1301),
        (jid, 'GEN-SG03', 'Sign - Final', 'Signs', 'sign', true, false, 1302),

        -- Misc
        (jid, 'GEN-Z01', 'Courtesy Inspection', 'Misc', NULL, true, true, 1400),
        (jid, 'GEN-Z02', 'After Hours Inspection', 'Misc', NULL, true, true, 1401),
        (jid, 'GEN-Z03', 'Lowest Floor Elevation (FEMA)', 'Misc', NULL, true, true, 1402),
        (jid, 'GEN-Z04', 'Landscape Irrigation', 'Misc', NULL, true, true, 1403);

    END IF;
  END LOOP;
END $$;
