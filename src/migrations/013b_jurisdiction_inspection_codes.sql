-- IronTrack Pulse — Migration 013b: EnerGov Cities Inspection Codes
-- Run AFTER 013_jurisdiction_inspection_codes.sql
--
-- DATA QUALITY NOTES:
-- Chandler codes 700-719 (structural) and 400-491 (civil) are CONFIRMED from official source
-- Chandler MEP and Finals codes are ESTIMATED based on common EnerGov patterns
-- All other EnerGov cities use Chandler as a template — codes likely similar but not verified
-- EnerGov cities covered: Chandler, Gilbert, Tempe, Glendale, Peoria, Surprise, Goodyear,
--   Buckeye, Queen Creek, Maricopa County (uses EnerGov/tylerhost.net, not Accela as originally listed)
-- ============================================================

-- ============================================================
-- EnerGov Standard Code Set (based on Chandler confirmed codes)
-- Used for all EnerGov cities below
-- ============================================================

-- We'll use a DO block to insert for multiple jurisdictions efficiently

-- === CHANDLER (EnerGov — Building codes CONFIRMED, MEP estimated) ===
-- Source: chandleraz.gov/government/departments/development-services/inspections
-- Confirmed structural codes: 700-719
-- Confirmed civil codes: 400-491

INSERT INTO jurisdiction_inspection_codes (jurisdiction_id, code, description, category, permit_type, is_commercial, is_residential, sort_order)
-- Civil / Site
SELECT id, '400', 'Civil Preconstruction Meeting', 'Civil', 'civil', true, false, 400 FROM jurisdictions WHERE name = 'City of Chandler'
UNION ALL SELECT id, '405', 'Drainage - Structures', 'Civil', 'civil', true, true, 405 FROM jurisdictions WHERE name = 'City of Chandler'
UNION ALL SELECT id, '406', 'Drainage - Pipes', 'Civil', 'civil', true, true, 406 FROM jurisdictions WHERE name = 'City of Chandler'
UNION ALL SELECT id, '407', 'Drainage - Drywell', 'Civil', 'civil', true, true, 407 FROM jurisdictions WHERE name = 'City of Chandler'
UNION ALL SELECT id, '410', 'Sanitary Sewer - Structures', 'Civil', 'civil', true, true, 410 FROM jurisdictions WHERE name = 'City of Chandler'
UNION ALL SELECT id, '411', 'Sanitary Sewer - Pipe', 'Civil', 'civil', true, true, 411 FROM jurisdictions WHERE name = 'City of Chandler'
UNION ALL SELECT id, '412', 'Sanitary Sewer - Pressure/Mandrel/Video', 'Civil', 'civil', true, true, 412 FROM jurisdictions WHERE name = 'City of Chandler'
UNION ALL SELECT id, '420', 'Reclaimed Water', 'Civil', 'civil', true, true, 420 FROM jurisdictions WHERE name = 'City of Chandler'
UNION ALL SELECT id, '421', 'Water - Fire', 'Civil', 'civil', true, true, 421 FROM jurisdictions WHERE name = 'City of Chandler'
UNION ALL SELECT id, '422', 'Water - Potable', 'Civil', 'civil', true, true, 422 FROM jurisdictions WHERE name = 'City of Chandler'
UNION ALL SELECT id, '423', 'Water - Pressure Test', 'Civil', 'civil', true, true, 423 FROM jurisdictions WHERE name = 'City of Chandler'
UNION ALL SELECT id, '435', 'Grading', 'Civil', 'civil', true, true, 435 FROM jurisdictions WHERE name = 'City of Chandler'
UNION ALL SELECT id, '440', 'Dry Utilities', 'Civil', 'civil', true, true, 440 FROM jurisdictions WHERE name = 'City of Chandler'
UNION ALL SELECT id, '450', 'Concrete', 'Civil', 'civil', true, true, 450 FROM jurisdictions WHERE name = 'City of Chandler'
UNION ALL SELECT id, '460', 'Paving - Subgrade', 'Civil', 'civil', true, true, 460 FROM jurisdictions WHERE name = 'City of Chandler'
UNION ALL SELECT id, '461', 'Paving - Base Course', 'Civil', 'civil', true, true, 461 FROM jurisdictions WHERE name = 'City of Chandler'
UNION ALL SELECT id, '462', 'Paving - Finish Course', 'Civil', 'civil', true, true, 462 FROM jurisdictions WHERE name = 'City of Chandler'
UNION ALL SELECT id, '463', 'Paving - Repair/Patch', 'Civil', 'civil', true, true, 463 FROM jurisdictions WHERE name = 'City of Chandler'
UNION ALL SELECT id, '470', 'Landscape (non-medians)', 'Civil', 'civil', true, true, 470 FROM jurisdictions WHERE name = 'City of Chandler'
UNION ALL SELECT id, '475', 'Median Landscape (Arterial Only)', 'Civil', 'civil', true, false, 475 FROM jurisdictions WHERE name = 'City of Chandler'
UNION ALL SELECT id, '480', 'Street Lights', 'Civil', 'civil', true, true, 480 FROM jurisdictions WHERE name = 'City of Chandler'
UNION ALL SELECT id, '481', 'Small Wireless Facility', 'Civil', 'civil', true, false, 481 FROM jurisdictions WHERE name = 'City of Chandler'
UNION ALL SELECT id, '485', 'Civil Courtesy Inspection', 'Civil', 'civil', true, true, 485 FROM jurisdictions WHERE name = 'City of Chandler'
UNION ALL SELECT id, '490', 'Civil Misc. (City Use Only)', 'Civil', 'civil', true, true, 490 FROM jurisdictions WHERE name = 'City of Chandler'
UNION ALL SELECT id, '491', 'Civil - Preliminary/Temporary C.O.', 'Civil', 'civil', true, true, 491 FROM jurisdictions WHERE name = 'City of Chandler'
-- Structural (CONFIRMED)
UNION ALL SELECT id, '700', 'Footing', 'Foundation', NULL, true, true, 700 FROM jurisdictions WHERE name = 'City of Chandler'
UNION ALL SELECT id, '701', 'Stem Wall', 'Foundation', NULL, true, true, 701 FROM jurisdictions WHERE name = 'City of Chandler'
UNION ALL SELECT id, '702', 'Basement Wall', 'Foundation', NULL, true, true, 702 FROM jurisdictions WHERE name = 'City of Chandler'
UNION ALL SELECT id, '703', 'Basement Pre-Backfill', 'Foundation', NULL, true, true, 703 FROM jurisdictions WHERE name = 'City of Chandler'
UNION ALL SELECT id, '704', 'Basement Slab', 'Foundation', NULL, true, true, 704 FROM jurisdictions WHERE name = 'City of Chandler'
UNION ALL SELECT id, '705', 'Retaining Wall Reinforced', 'Foundation', NULL, true, true, 705 FROM jurisdictions WHERE name = 'City of Chandler'
UNION ALL SELECT id, '706', 'Piers/Columns', 'Foundation', NULL, true, true, 706 FROM jurisdictions WHERE name = 'City of Chandler'
UNION ALL SELECT id, '707', 'Pre-Slab (SOG & PT)', 'Foundation', NULL, true, true, 707 FROM jurisdictions WHERE name = 'City of Chandler'
UNION ALL SELECT id, '708', 'Tilt Panels', 'Structural', 'commercial', true, false, 708 FROM jurisdictions WHERE name = 'City of Chandler'
UNION ALL SELECT id, '709', 'Strap & Shear', 'Rough', NULL, true, true, 709 FROM jurisdictions WHERE name = 'City of Chandler'
UNION ALL SELECT id, '710', 'Lath', 'Wall Cover', NULL, true, true, 710 FROM jurisdictions WHERE name = 'City of Chandler'
UNION ALL SELECT id, '711', 'GWB/Drywall', 'Wall Cover', NULL, true, true, 711 FROM jurisdictions WHERE name = 'City of Chandler'
UNION ALL SELECT id, '712', 'Above Ceiling (AGC)', 'Above Grid Ceiling', 'commercial', true, false, 712 FROM jurisdictions WHERE name = 'City of Chandler'
UNION ALL SELECT id, '713', 'Rough Frame', 'Rough', NULL, true, true, 713 FROM jurisdictions WHERE name = 'City of Chandler'
UNION ALL SELECT id, '714', 'Masonry', 'Masonry', NULL, true, true, 714 FROM jurisdictions WHERE name = 'City of Chandler'
UNION ALL SELECT id, '715', 'Structural Steel', 'Structural', 'commercial', true, false, 715 FROM jurisdictions WHERE name = 'City of Chandler'
UNION ALL SELECT id, '716', 'Roof Frame', 'Rough', NULL, true, true, 716 FROM jurisdictions WHERE name = 'City of Chandler'
UNION ALL SELECT id, '717', 'Structural Special', 'Structural', NULL, true, true, 717 FROM jurisdictions WHERE name = 'City of Chandler'
UNION ALL SELECT id, '718', 'Structural Other', 'Structural', NULL, true, true, 718 FROM jurisdictions WHERE name = 'City of Chandler'
UNION ALL SELECT id, '719', 'Structural Final', 'Structural', NULL, true, true, 719 FROM jurisdictions WHERE name = 'City of Chandler'
-- MEP (estimated based on EnerGov patterns)
UNION ALL SELECT id, '720', 'Rough Plumbing', 'Rough', NULL, true, true, 720 FROM jurisdictions WHERE name = 'City of Chandler'
UNION ALL SELECT id, '721', 'Under Slab Plumbing', 'Underground/Soils', NULL, true, true, 721 FROM jurisdictions WHERE name = 'City of Chandler'
UNION ALL SELECT id, '722', 'Rough Electrical', 'Rough', NULL, true, true, 722 FROM jurisdictions WHERE name = 'City of Chandler'
UNION ALL SELECT id, '723', 'Under Slab Electrical', 'Underground/Soils', NULL, true, true, 723 FROM jurisdictions WHERE name = 'City of Chandler'
UNION ALL SELECT id, '724', 'Temporary Power', 'Foundation', NULL, true, true, 724 FROM jurisdictions WHERE name = 'City of Chandler'
UNION ALL SELECT id, '725', 'Rough Mechanical', 'Rough', NULL, true, true, 725 FROM jurisdictions WHERE name = 'City of Chandler'
UNION ALL SELECT id, '726', 'Rough MEP Combo', 'Rough', NULL, true, true, 726 FROM jurisdictions WHERE name = 'City of Chandler'
UNION ALL SELECT id, '727', 'UG Sewer', 'Underground/Soils', NULL, true, true, 727 FROM jurisdictions WHERE name = 'City of Chandler'
UNION ALL SELECT id, '728', 'UG Water', 'Underground/Soils', NULL, true, true, 728 FROM jurisdictions WHERE name = 'City of Chandler'
UNION ALL SELECT id, '729', 'UG Gas', 'Underground/Soils', NULL, true, true, 729 FROM jurisdictions WHERE name = 'City of Chandler'
UNION ALL SELECT id, '730', 'Pre-Drywall Insulation', 'Rough', NULL, true, true, 730 FROM jurisdictions WHERE name = 'City of Chandler'
-- Finals (estimated)
UNION ALL SELECT id, '740', 'Final Plumbing', 'Finals', NULL, true, true, 740 FROM jurisdictions WHERE name = 'City of Chandler'
UNION ALL SELECT id, '741', 'Final Electrical', 'Finals', NULL, true, true, 741 FROM jurisdictions WHERE name = 'City of Chandler'
UNION ALL SELECT id, '742', 'Final Mechanical', 'Finals', NULL, true, true, 742 FROM jurisdictions WHERE name = 'City of Chandler'
UNION ALL SELECT id, '743', 'Final MEP Combo', 'Finals', NULL, true, true, 743 FROM jurisdictions WHERE name = 'City of Chandler'
UNION ALL SELECT id, '744', 'Final Insulation', 'Finals', NULL, true, true, 744 FROM jurisdictions WHERE name = 'City of Chandler'
UNION ALL SELECT id, '745', 'Final Gas', 'Finals', NULL, true, true, 745 FROM jurisdictions WHERE name = 'City of Chandler'
UNION ALL SELECT id, '746', 'Final Accessibility', 'Finals', 'commercial', true, false, 746 FROM jurisdictions WHERE name = 'City of Chandler'
UNION ALL SELECT id, '750', 'Final Building', 'Finals', NULL, true, true, 750 FROM jurisdictions WHERE name = 'City of Chandler'
UNION ALL SELECT id, '751', 'Final Combo', 'Finals', NULL, true, true, 751 FROM jurisdictions WHERE name = 'City of Chandler'
UNION ALL SELECT id, '752', 'Final Fence/Wall', 'Finals', NULL, true, true, 752 FROM jurisdictions WHERE name = 'City of Chandler'
UNION ALL SELECT id, '753', 'Final Carport/Patio', 'Finals', NULL, true, true, 753 FROM jurisdictions WHERE name = 'City of Chandler'
UNION ALL SELECT id, '754', 'Final Solar PV', 'Finals', 'solar', true, true, 754 FROM jurisdictions WHERE name = 'City of Chandler'
UNION ALL SELECT id, '760', 'Certificate of Occupancy', 'Certificate', 'commercial', true, false, 760 FROM jurisdictions WHERE name = 'City of Chandler'
UNION ALL SELECT id, '761', 'Temporary Certificate of Occupancy (TCO)', 'Certificate', 'commercial', true, false, 761 FROM jurisdictions WHERE name = 'City of Chandler'
-- Pool & Spa (estimated)
UNION ALL SELECT id, '770', 'Pool/Spa - Layout', 'Pool & Spa', 'pool', true, true, 770 FROM jurisdictions WHERE name = 'City of Chandler'
UNION ALL SELECT id, '771', 'Pool/Spa - Steel/Bond Beam', 'Pool & Spa', 'pool', true, true, 771 FROM jurisdictions WHERE name = 'City of Chandler'
UNION ALL SELECT id, '772', 'Pool/Spa - Gunite', 'Pool & Spa', 'pool', true, true, 772 FROM jurisdictions WHERE name = 'City of Chandler'
UNION ALL SELECT id, '773', 'Pool/Spa - Plumbing', 'Pool & Spa', 'pool', true, true, 773 FROM jurisdictions WHERE name = 'City of Chandler'
UNION ALL SELECT id, '774', 'Pool/Spa - Electrical', 'Pool & Spa', 'pool', true, true, 774 FROM jurisdictions WHERE name = 'City of Chandler'
UNION ALL SELECT id, '775', 'Pool/Spa - Safety Barrier', 'Pool & Spa', 'pool', true, true, 775 FROM jurisdictions WHERE name = 'City of Chandler'
UNION ALL SELECT id, '776', 'Pool/Spa - Final', 'Pool & Spa', 'pool', true, true, 776 FROM jurisdictions WHERE name = 'City of Chandler'
-- Fire (estimated)
UNION ALL SELECT id, '800', 'Fire Site', 'Fire', 'fire', true, true, 800 FROM jurisdictions WHERE name = 'City of Chandler'
UNION ALL SELECT id, '801', 'Fire Underground', 'Fire', 'fire', true, false, 801 FROM jurisdictions WHERE name = 'City of Chandler'
UNION ALL SELECT id, '802', 'Sprinkler - Rough', 'Fire', 'fire', true, false, 802 FROM jurisdictions WHERE name = 'City of Chandler'
UNION ALL SELECT id, '803', 'Sprinkler - Final', 'Fire', 'fire', true, false, 803 FROM jurisdictions WHERE name = 'City of Chandler'
UNION ALL SELECT id, '804', 'Fire Alarm - Rough', 'Fire', 'fire', true, false, 804 FROM jurisdictions WHERE name = 'City of Chandler'
UNION ALL SELECT id, '805', 'Fire Alarm - Final', 'Fire', 'fire', true, false, 805 FROM jurisdictions WHERE name = 'City of Chandler'
UNION ALL SELECT id, '806', 'Kitchen Hood', 'Fire', 'fire', true, false, 806 FROM jurisdictions WHERE name = 'City of Chandler'
UNION ALL SELECT id, '807', 'Fire Pump', 'Fire', 'fire', true, false, 807 FROM jurisdictions WHERE name = 'City of Chandler'
UNION ALL SELECT id, '808', 'Fire Final', 'Fire', 'fire', true, false, 808 FROM jurisdictions WHERE name = 'City of Chandler';

-- ============================================================
-- ENERGOV TEMPLATE — Applies to multiple cities
-- All codes below are ESTIMATED based on Chandler EnerGov pattern
-- Each city customizes their EnerGov implementation but structural
-- codes are often identical or very similar
-- ============================================================

-- Helper: We'll insert the EnerGov template for each city
-- Cities: Gilbert, Tempe, Glendale, Peoria, Surprise, Goodyear, Buckeye, Maricopa County

DO $$
DECLARE
  jid UUID;
  city_names TEXT[] := ARRAY[
    'Town of Gilbert',
    'City of Tempe',
    'City of Glendale',
    'City of Peoria',
    'City of Surprise',
    'City of Goodyear',
    'City of Buckeye',
    'Maricopa County'
  ];
  city_name TEXT;
BEGIN
  FOREACH city_name IN ARRAY city_names LOOP
    SELECT id INTO jid FROM jurisdictions WHERE name = city_name;
    IF jid IS NOT NULL THEN

      -- Foundation / Structural (CONFIRMED for Chandler, template for others)
      INSERT INTO jurisdiction_inspection_codes (jurisdiction_id, code, description, category, permit_type, is_commercial, is_residential, sort_order) VALUES
        (jid, '700', 'Footing', 'Foundation', NULL, true, true, 700),
        (jid, '701', 'Stem Wall', 'Foundation', NULL, true, true, 701),
        (jid, '702', 'Basement Wall', 'Foundation', NULL, true, true, 702),
        (jid, '703', 'Basement Pre-Backfill', 'Foundation', NULL, true, true, 703),
        (jid, '704', 'Basement Slab', 'Foundation', NULL, true, true, 704),
        (jid, '705', 'Retaining Wall Reinforced', 'Foundation', NULL, true, true, 705),
        (jid, '706', 'Piers/Columns', 'Foundation', NULL, true, true, 706),
        (jid, '707', 'Pre-Slab (SOG & PT)', 'Foundation', NULL, true, true, 707),
        (jid, '708', 'Tilt Panels', 'Structural', 'commercial', true, false, 708),
        (jid, '709', 'Strap & Shear', 'Rough', NULL, true, true, 709),
        (jid, '710', 'Lath', 'Wall Cover', NULL, true, true, 710),
        (jid, '711', 'GWB/Drywall', 'Wall Cover', NULL, true, true, 711),
        (jid, '712', 'Above Ceiling (AGC)', 'Above Grid Ceiling', 'commercial', true, false, 712),
        (jid, '713', 'Rough Frame', 'Rough', NULL, true, true, 713),
        (jid, '714', 'Masonry', 'Masonry', NULL, true, true, 714),
        (jid, '715', 'Structural Steel', 'Structural', 'commercial', true, false, 715),
        (jid, '716', 'Roof Frame', 'Rough', NULL, true, true, 716),
        (jid, '717', 'Structural Special', 'Structural', NULL, true, true, 717),
        (jid, '718', 'Structural Other', 'Structural', NULL, true, true, 718),
        (jid, '719', 'Structural Final', 'Structural', NULL, true, true, 719),
        -- MEP
        (jid, '720', 'Rough Plumbing', 'Rough', NULL, true, true, 720),
        (jid, '721', 'Under Slab Plumbing', 'Underground/Soils', NULL, true, true, 721),
        (jid, '722', 'Rough Electrical', 'Rough', NULL, true, true, 722),
        (jid, '723', 'Under Slab Electrical', 'Underground/Soils', NULL, true, true, 723),
        (jid, '724', 'Temporary Power', 'Foundation', NULL, true, true, 724),
        (jid, '725', 'Rough Mechanical', 'Rough', NULL, true, true, 725),
        (jid, '726', 'Rough MEP Combo', 'Rough', NULL, true, true, 726),
        (jid, '727', 'UG Sewer', 'Underground/Soils', NULL, true, true, 727),
        (jid, '728', 'UG Water', 'Underground/Soils', NULL, true, true, 728),
        (jid, '729', 'UG Gas', 'Underground/Soils', NULL, true, true, 729),
        (jid, '730', 'Pre-Drywall Insulation', 'Rough', NULL, true, true, 730),
        -- Finals
        (jid, '740', 'Final Plumbing', 'Finals', NULL, true, true, 740),
        (jid, '741', 'Final Electrical', 'Finals', NULL, true, true, 741),
        (jid, '742', 'Final Mechanical', 'Finals', NULL, true, true, 742),
        (jid, '743', 'Final MEP Combo', 'Finals', NULL, true, true, 743),
        (jid, '744', 'Final Insulation', 'Finals', NULL, true, true, 744),
        (jid, '745', 'Final Gas', 'Finals', NULL, true, true, 745),
        (jid, '746', 'Final Accessibility', 'Finals', 'commercial', true, false, 746),
        (jid, '750', 'Final Building', 'Finals', NULL, true, true, 750),
        (jid, '751', 'Final Combo', 'Finals', NULL, true, true, 751),
        (jid, '752', 'Final Fence/Wall', 'Finals', NULL, true, true, 752),
        (jid, '753', 'Final Carport/Patio', 'Finals', NULL, true, true, 753),
        (jid, '754', 'Final Solar PV', 'Finals', 'solar', true, true, 754),
        (jid, '760', 'Certificate of Occupancy', 'Certificate', 'commercial', true, false, 760),
        (jid, '761', 'Temporary Certificate of Occupancy (TCO)', 'Certificate', 'commercial', true, false, 761),
        -- Pool & Spa
        (jid, '770', 'Pool/Spa - Layout', 'Pool & Spa', 'pool', true, true, 770),
        (jid, '771', 'Pool/Spa - Steel/Bond Beam', 'Pool & Spa', 'pool', true, true, 771),
        (jid, '772', 'Pool/Spa - Gunite', 'Pool & Spa', 'pool', true, true, 772),
        (jid, '773', 'Pool/Spa - Plumbing', 'Pool & Spa', 'pool', true, true, 773),
        (jid, '774', 'Pool/Spa - Electrical', 'Pool & Spa', 'pool', true, true, 774),
        (jid, '775', 'Pool/Spa - Safety Barrier', 'Pool & Spa', 'pool', true, true, 775),
        (jid, '776', 'Pool/Spa - Final', 'Pool & Spa', 'pool', true, true, 776),
        -- Fire
        (jid, '800', 'Fire Site', 'Fire', 'fire', true, true, 800),
        (jid, '801', 'Fire Underground', 'Fire', 'fire', true, false, 801),
        (jid, '802', 'Sprinkler - Rough', 'Fire', 'fire', true, false, 802),
        (jid, '803', 'Sprinkler - Final', 'Fire', 'fire', true, false, 803),
        (jid, '804', 'Fire Alarm - Rough', 'Fire', 'fire', true, false, 804),
        (jid, '805', 'Fire Alarm - Final', 'Fire', 'fire', true, false, 805),
        (jid, '806', 'Kitchen Hood', 'Fire', 'fire', true, false, 806),
        (jid, '807', 'Fire Pump', 'Fire', 'fire', true, false, 807),
        (jid, '808', 'Fire Final', 'Fire', 'fire', true, false, 808);

    END IF;
  END LOOP;
END $$;

-- ============================================================
-- TOWN OF QUEEN CREEK (uses 'url' portal but EnerGov-like structure)
-- Using EnerGov template codes — NOT verified
-- ============================================================
DO $$
DECLARE jid UUID;
BEGIN
  SELECT id INTO jid FROM jurisdictions WHERE name = 'Town of Queen Creek';
  IF jid IS NOT NULL THEN
    INSERT INTO jurisdiction_inspection_codes (jurisdiction_id, code, description, category, permit_type, is_commercial, is_residential, sort_order) VALUES
      (jid, '700', 'Footing', 'Foundation', NULL, true, true, 700),
      (jid, '701', 'Stem Wall', 'Foundation', NULL, true, true, 701),
      (jid, '707', 'Pre-Slab (SOG & PT)', 'Foundation', NULL, true, true, 707),
      (jid, '709', 'Strap & Shear', 'Rough', NULL, true, true, 709),
      (jid, '710', 'Lath', 'Wall Cover', NULL, true, true, 710),
      (jid, '711', 'GWB/Drywall', 'Wall Cover', NULL, true, true, 711),
      (jid, '713', 'Rough Frame', 'Rough', NULL, true, true, 713),
      (jid, '720', 'Rough Plumbing', 'Rough', NULL, true, true, 720),
      (jid, '721', 'Under Slab Plumbing', 'Underground/Soils', NULL, true, true, 721),
      (jid, '722', 'Rough Electrical', 'Rough', NULL, true, true, 722),
      (jid, '724', 'Temporary Power', 'Foundation', NULL, true, true, 724),
      (jid, '725', 'Rough Mechanical', 'Rough', NULL, true, true, 725),
      (jid, '730', 'Pre-Drywall Insulation', 'Rough', NULL, true, true, 730),
      (jid, '740', 'Final Plumbing', 'Finals', NULL, true, true, 740),
      (jid, '741', 'Final Electrical', 'Finals', NULL, true, true, 741),
      (jid, '742', 'Final Mechanical', 'Finals', NULL, true, true, 742),
      (jid, '750', 'Final Building', 'Finals', NULL, true, true, 750),
      (jid, '754', 'Final Solar PV', 'Finals', 'solar', true, true, 754),
      (jid, '760', 'Certificate of Occupancy', 'Certificate', 'commercial', true, false, 760),
      (jid, '770', 'Pool/Spa - Layout', 'Pool & Spa', 'pool', true, true, 770),
      (jid, '771', 'Pool/Spa - Steel/Bond Beam', 'Pool & Spa', 'pool', true, true, 771),
      (jid, '776', 'Pool/Spa - Final', 'Pool & Spa', 'pool', true, true, 776),
      (jid, '800', 'Fire Site', 'Fire', 'fire', true, true, 800),
      (jid, '803', 'Sprinkler - Final', 'Fire', 'fire', true, false, 803),
      (jid, '808', 'Fire Final', 'Fire', 'fire', true, false, 808);
  END IF;
END $$;
