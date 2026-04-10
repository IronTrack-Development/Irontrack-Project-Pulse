/**
 * IronTrack Daily — Demo Seed Data
 * Run: npx tsx src/seed/seed-demo.ts
 */
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

function d(offsetDays: number): string {
  const date = new Date("2026-04-08");
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().split("T")[0];
}

async function seed() {
  console.log("🌱 Seeding IronTrack Daily demo data...");

  // Clear existing demo data
  const { data: existing } = await supabase
    .from("daily_projects")
    .select("id")
    .in("name", ["The Marshall", "Papago Sprouts"]);
  if (existing && existing.length > 0) {
    for (const p of existing) {
      await supabase.from("daily_projects").delete().eq("id", p.id);
    }
  }

  // ────────────────────────────────────────────────
  // PROJECT 1: The Marshall
  // ────────────────────────────────────────────────
  const { data: marshall, error: e1 } = await supabase
    .from("daily_projects")
    .insert({
      name: "The Marshall",
      project_number: "PHX-2024-0142",
      client_name: "Marshall Development Group",
      location: "Tempe, AZ",
      start_date: d(-180),
      target_finish_date: d(120),
      status: "active",
      health_score: 72,
    })
    .select()
    .single();
  if (e1) { console.error("Error creating The Marshall:", e1); return; }
  console.log("✅ Created The Marshall:", marshall.id);

  const marshallActivities = [
    // COMPLETE
    { activity_id: "M001", activity_name: "Site Mobilization & Permits", trade: "Permits", original_duration: 10, start_date: d(-180), finish_date: d(-171), actual_start: d(-180), actual_finish: d(-170), percent_complete: 100, status: "complete", milestone: false, wbs: "01.01", area: "Site" },
    { activity_id: "M002", activity_name: "Survey & Layout", trade: "Survey", original_duration: 5, start_date: d(-170), finish_date: d(-166), actual_start: d(-170), actual_finish: d(-166), percent_complete: 100, status: "complete", milestone: false, wbs: "01.02", area: "Site" },
    { activity_id: "M003", activity_name: "Demolition of Existing Structure", trade: "Demolition", original_duration: 14, start_date: d(-165), finish_date: d(-152), actual_start: d(-165), actual_finish: d(-151), percent_complete: 100, status: "complete", milestone: false, wbs: "02.01", area: "Site" },
    { activity_id: "M004", activity_name: "Mass Excavation & Earthwork", trade: "Earthwork", original_duration: 20, start_date: d(-152), finish_date: d(-133), actual_start: d(-152), actual_finish: d(-132), percent_complete: 100, status: "complete", milestone: false, wbs: "03.01", area: "Site" },
    { activity_id: "M005", activity_name: "Underground Utilities — Sewer", trade: "Underground", original_duration: 10, start_date: d(-135), finish_date: d(-126), actual_start: d(-135), actual_finish: d(-125), percent_complete: 100, status: "complete", milestone: false, wbs: "03.02", area: "Site" },
    { activity_id: "M006", activity_name: "Underground Utilities — Water", trade: "Underground", original_duration: 8, start_date: d(-128), finish_date: d(-121), actual_start: d(-128), actual_finish: d(-120), percent_complete: 100, status: "complete", milestone: false, wbs: "03.03", area: "Site" },
    { activity_id: "M007", activity_name: "Footings & Grade Beams — Level P1", trade: "Concrete", original_duration: 18, start_date: d(-125), finish_date: d(-108), actual_start: d(-125), actual_finish: d(-107), percent_complete: 100, status: "complete", milestone: false, wbs: "04.01", area: "P1" },
    { activity_id: "M008", activity_name: "Slab on Grade — Level P1", trade: "Concrete", original_duration: 12, start_date: d(-108), finish_date: d(-97), actual_start: d(-108), actual_finish: d(-96), percent_complete: 100, status: "complete", milestone: false, wbs: "04.02", area: "P1" },
    { activity_id: "M009", activity_name: "Structural Steel Erection — Floors 1-3", trade: "Structural Steel", original_duration: 25, start_date: d(-97), finish_date: d(-73), actual_start: d(-97), actual_finish: d(-72), percent_complete: 100, status: "complete", milestone: false, wbs: "05.01", area: "Floors 1-3" },
    { activity_id: "M010", activity_name: "Structural Steel Erection — Floors 4-7", trade: "Structural Steel", original_duration: 25, start_date: d(-73), finish_date: d(-49), actual_start: d(-73), actual_finish: d(-48), percent_complete: 100, status: "complete", milestone: false, wbs: "05.02", area: "Floors 4-7" },
    { activity_id: "M011", activity_name: "Structural Steel Complete", trade: "Structural Steel", original_duration: 0, start_date: d(-48), finish_date: d(-48), actual_start: d(-48), actual_finish: d(-48), percent_complete: 100, status: "complete", milestone: true, wbs: "05.99", area: "Building" },
    { activity_id: "M012", activity_name: "Metal Deck & Concrete Floors — Levels 1-4", trade: "Concrete", original_duration: 30, start_date: d(-80), finish_date: d(-51), actual_start: d(-80), actual_finish: d(-50), percent_complete: 100, status: "complete", milestone: false, wbs: "06.01", area: "Floors 1-4" },
    { activity_id: "M013", activity_name: "Metal Deck & Concrete Floors — Levels 5-7", trade: "Concrete", original_duration: 25, start_date: d(-55), finish_date: d(-31), actual_start: d(-55), actual_finish: d(-30), percent_complete: 100, status: "complete", milestone: false, wbs: "06.02", area: "Floors 5-7" },
    { activity_id: "M014", activity_name: "Roofing — Waterproof Membrane", trade: "Waterproofing", original_duration: 10, start_date: d(-32), finish_date: d(-23), actual_start: d(-32), actual_finish: d(-22), percent_complete: 100, status: "complete", milestone: false, wbs: "07.01", area: "Roof" },
    { activity_id: "M015", activity_name: "Roofing System Complete", trade: "Roofing", original_duration: 8, start_date: d(-24), finish_date: d(-17), actual_start: d(-24), actual_finish: d(-16), percent_complete: 100, status: "complete", milestone: false, wbs: "07.02", area: "Roof" },
    // IN PROGRESS
    { activity_id: "M016", activity_name: "Exterior Framing — Level 1", trade: "Framing", original_duration: 14, start_date: d(-20), finish_date: d(-7), actual_start: d(-20), actual_finish: null, percent_complete: 75, status: "in_progress", milestone: false, wbs: "08.01", area: "Level 1", predecessor_ids: ["M013"] },
    { activity_id: "M017", activity_name: "Exterior Framing — Level 2", trade: "Framing", original_duration: 14, start_date: d(-14), finish_date: d(-1), actual_start: d(-14), actual_finish: null, percent_complete: 60, status: "in_progress", milestone: false, wbs: "08.02", area: "Level 2", predecessor_ids: ["M016"] },
    { activity_id: "M018", activity_name: "Exterior Framing — Level 3", trade: "Framing", original_duration: 14, start_date: d(-7), finish_date: d(6), actual_start: d(-7), actual_finish: null, percent_complete: 40, status: "in_progress", milestone: false, wbs: "08.03", area: "Level 3", predecessor_ids: ["M017"] },
    { activity_id: "M019", activity_name: "Plumbing Rough — Levels 1-2", trade: "Plumbing", original_duration: 18, start_date: d(-15), finish_date: d(2), actual_start: d(-15), actual_finish: null, percent_complete: 65, status: "in_progress", milestone: false, wbs: "09.01", area: "Levels 1-2", predecessor_ids: ["M016"] },
    { activity_id: "M020", activity_name: "Electrical Rough — Level 1 Conduit", trade: "Electrical", original_duration: 12, start_date: d(-12), finish_date: d(-1), actual_start: d(-12), actual_finish: null, percent_complete: 70, status: "in_progress", milestone: false, wbs: "10.01", area: "Level 1", predecessor_ids: ["M016"] },
    { activity_id: "M021", activity_name: "HVAC Duct Main Trunk Lines", trade: "HVAC", original_duration: 20, start_date: d(-18), finish_date: d(1), actual_start: d(-18), actual_finish: null, percent_complete: 55, status: "in_progress", milestone: false, wbs: "11.01", area: "Building", predecessor_ids: ["M013"] },
    { activity_id: "M022", activity_name: "Storefront Glazing — Level 1", trade: "Windows/Glazing", original_duration: 10, start_date: d(-8), finish_date: d(1), actual_start: d(-8), actual_finish: null, percent_complete: 50, status: "in_progress", milestone: false, wbs: "12.01", area: "Level 1", predecessor_ids: ["M016"] },
    { activity_id: "M023", activity_name: "Masonry CMU Stair Cores", trade: "Masonry", original_duration: 16, start_date: d(-22), finish_date: d(-7), actual_start: d(-22), actual_finish: null, percent_complete: 80, status: "in_progress", milestone: false, wbs: "13.01", area: "Building" },
    // UPCOMING — near-term
    { activity_id: "M024", activity_name: "Above Ceiling Rough Inspection — Level 1", trade: "Inspection", original_duration: 1, start_date: d(3), finish_date: d(3), actual_start: null, actual_finish: null, percent_complete: 0, status: "not_started", milestone: true, wbs: "14.01", area: "Level 1", predecessor_ids: ["M019", "M020", "M021"] },
    { activity_id: "M025", activity_name: "Drywall Framing — Level 1", trade: "Drywall", original_duration: 12, start_date: d(4), finish_date: d(15), actual_start: null, actual_finish: null, percent_complete: 0, status: "not_started", milestone: false, wbs: "15.01", area: "Level 1", predecessor_ids: ["M024"] },
    { activity_id: "M026", activity_name: "Insulation — Exterior Walls Level 1-2", trade: "Insulation", original_duration: 8, start_date: d(5), finish_date: d(12), actual_start: null, actual_finish: null, percent_complete: 0, status: "not_started", milestone: false, wbs: "16.01", area: "Levels 1-2", predecessor_ids: ["M017"] },
    { activity_id: "M027", activity_name: "Fire Sprinkler Rough — Level 1-2", trade: "Fire Protection", original_duration: 14, start_date: d(2), finish_date: d(15), actual_start: null, actual_finish: null, percent_complete: 0, status: "not_started", milestone: false, wbs: "17.01", area: "Levels 1-2", predecessor_ids: ["M024"] },
    { activity_id: "M028", activity_name: "Elevator Pit & Rail Fabrication", trade: "Elevator", original_duration: 20, start_date: d(6), finish_date: d(25), actual_start: null, actual_finish: null, percent_complete: 0, status: "not_started", milestone: false, wbs: "18.01", area: "Core" },
    { activity_id: "M029", activity_name: "Exterior Framing — Level 4", trade: "Framing", original_duration: 14, start_date: d(6), finish_date: d(19), actual_start: null, actual_finish: null, percent_complete: 0, status: "not_started", milestone: false, wbs: "08.04", area: "Level 4", predecessor_ids: ["M018"] },
    { activity_id: "M030", activity_name: "Plumbing Rough — Level 3", trade: "Plumbing", original_duration: 14, start_date: d(3), finish_date: d(16), actual_start: null, actual_finish: null, percent_complete: 0, status: "not_started", milestone: false, wbs: "09.03", area: "Level 3", predecessor_ids: ["M018"] },
    // LATE (past start, not started)
    { activity_id: "M031", activity_name: "Window Submittals — Levels 3-7", trade: "Submittals", original_duration: 5, start_date: d(-8), finish_date: d(-4), actual_start: null, actual_finish: null, percent_complete: 0, status: "late", milestone: false, wbs: "19.01", area: "Building" },
    { activity_id: "M032", activity_name: "Electrical Panel Submittals — Main Service", trade: "Submittals", original_duration: 3, start_date: d(-6), finish_date: d(-4), actual_start: null, actual_finish: null, percent_complete: 0, status: "late", milestone: false, wbs: "19.02", area: "Building" },
    { activity_id: "M033", activity_name: "Flooring Material Delivery — Level 1", trade: "Delivery", original_duration: 1, start_date: d(-3), finish_date: d(-3), actual_start: null, actual_finish: null, percent_complete: 0, status: "late", milestone: false, wbs: "20.01", area: "Level 1" },
    // FUTURE
    { activity_id: "M034", activity_name: "Drywall Board & Tape — Level 1", trade: "Drywall", original_duration: 10, start_date: d(16), finish_date: d(25), actual_start: null, actual_finish: null, percent_complete: 0, status: "not_started", milestone: false, wbs: "15.02", area: "Level 1", predecessor_ids: ["M025"] },
    { activity_id: "M035", activity_name: "Interior Paint — Level 1", trade: "Painting", original_duration: 8, start_date: d(26), finish_date: d(33), actual_start: null, actual_finish: null, percent_complete: 0, status: "not_started", milestone: false, wbs: "21.01", area: "Level 1", predecessor_ids: ["M034"] },
    { activity_id: "M036", activity_name: "Tile Work — Unit Bathrooms L1", trade: "Flooring", original_duration: 10, start_date: d(28), finish_date: d(37), actual_start: null, actual_finish: null, percent_complete: 0, status: "not_started", milestone: false, wbs: "22.01", area: "Level 1", predecessor_ids: ["M034"] },
    { activity_id: "M037", activity_name: "Doors, Frames & Hardware — Level 1", trade: "Doors/Hardware", original_duration: 8, start_date: d(30), finish_date: d(37), actual_start: null, actual_finish: null, percent_complete: 0, status: "not_started", milestone: false, wbs: "23.01", area: "Level 1", predecessor_ids: ["M034"] },
    { activity_id: "M038", activity_name: "Electrical Trim Out — Level 1", trade: "Electrical", original_duration: 8, start_date: d(35), finish_date: d(42), actual_start: null, actual_finish: null, percent_complete: 0, status: "not_started", milestone: false, wbs: "10.10", area: "Level 1", predecessor_ids: ["M035"] },
    { activity_id: "M039", activity_name: "Plumbing Trim Out — Level 1", trade: "Plumbing", original_duration: 6, start_date: d(35), finish_date: d(40), actual_start: null, actual_finish: null, percent_complete: 0, status: "not_started", milestone: false, wbs: "09.10", area: "Level 1", predecessor_ids: ["M035"] },
    { activity_id: "M040", activity_name: "Level 1 Substantial Completion", trade: "Inspection", original_duration: 0, start_date: d(45), finish_date: d(45), actual_start: null, actual_finish: null, percent_complete: 0, status: "not_started", milestone: true, wbs: "99.01", area: "Level 1", predecessor_ids: ["M038", "M039"] },
    { activity_id: "M041", activity_name: "Landscape & Hardscape — Phase 1", trade: "Landscape", original_duration: 18, start_date: d(70), finish_date: d(87), actual_start: null, actual_finish: null, percent_complete: 0, status: "not_started", milestone: false, wbs: "24.01", area: "Site" },
    { activity_id: "M042", activity_name: "Final Punch List & Closeout", trade: "Closeout", original_duration: 10, start_date: d(100), finish_date: d(109), actual_start: null, actual_finish: null, percent_complete: 0, status: "not_started", milestone: false, wbs: "99.99", area: "Building" },
    { activity_id: "M043", activity_name: "Certificate of Occupancy", trade: "Permits", original_duration: 0, start_date: d(115), finish_date: d(115), actual_start: null, actual_finish: null, percent_complete: 0, status: "not_started", milestone: true, wbs: "99.CO", area: "Building" },
    { activity_id: "M044", activity_name: "HVAC Equipment Fabrication & Delivery", trade: "Fabrication", original_duration: 25, start_date: d(-5), finish_date: d(19), actual_start: d(-5), actual_finish: null, percent_complete: 20, status: "in_progress", milestone: false, wbs: "11.10", area: "Building" },
    { activity_id: "M045", activity_name: "Fire Protection Submittal Review", trade: "Submittals", original_duration: 5, start_date: d(-10), finish_date: d(-6), actual_start: null, actual_finish: null, percent_complete: 0, status: "late", milestone: false, wbs: "17.00", area: "Building" },
    { activity_id: "M046", activity_name: "Exterior Framing — Levels 5-7", trade: "Framing", original_duration: 21, start_date: d(19), finish_date: d(39), actual_start: null, actual_finish: null, percent_complete: 0, status: "not_started", milestone: false, wbs: "08.05", area: "Levels 5-7", predecessor_ids: ["M029"] },
    { activity_id: "M047", activity_name: "MEP Coordination Meetings", trade: "General", original_duration: 120, start_date: d(-60), finish_date: d(59), actual_start: d(-60), actual_finish: null, percent_complete: 50, status: "in_progress", milestone: false, wbs: "00.01", area: "Building" },
    { activity_id: "M048", activity_name: "Parking Garage Waterproofing", trade: "Waterproofing", original_duration: 12, start_date: d(15), finish_date: d(26), actual_start: null, actual_finish: null, percent_complete: 0, status: "not_started", milestone: false, wbs: "07.10", area: "P1" },
    { activity_id: "M049", activity_name: "Steel Stair Fabrication & Install", trade: "Structural Steel", original_duration: 16, start_date: d(5), finish_date: d(20), actual_start: null, actual_finish: null, percent_complete: 0, status: "not_started", milestone: false, wbs: "05.10", area: "Building" },
    { activity_id: "M050", activity_name: "Corridor Framing — Levels 1-3", trade: "Framing", original_duration: 12, start_date: d(0), finish_date: d(11), actual_start: d(0), actual_finish: null, percent_complete: 10, status: "in_progress", milestone: false, wbs: "08.10", area: "Corridors", predecessor_ids: ["M023"] },
  ];

  const { error: actErr1 } = await supabase.from("parsed_activities").insert(
    marshallActivities.map((a) => ({ ...a, project_id: marshall.id }))
  );
  if (actErr1) { console.error("Error inserting Marshall activities:", actErr1); return; }
  console.log(`✅ Inserted ${marshallActivities.length} activities for The Marshall`);

  // ────────────────────────────────────────────────
  // PROJECT 2: Papago Sprouts
  // ────────────────────────────────────────────────
  const { data: papago, error: e2 } = await supabase
    .from("daily_projects")
    .insert({
      name: "Papago Sprouts",
      project_number: "PHX-2025-0031",
      client_name: "Verde Retail Partners",
      location: "Phoenix, AZ",
      start_date: d(-90),
      target_finish_date: d(180),
      status: "active",
      health_score: 88,
    })
    .select()
    .single();
  if (e2) { console.error("Error creating Papago Sprouts:", e2); return; }
  console.log("✅ Created Papago Sprouts:", papago.id);

  const papagoActivities = [
    // COMPLETE
    { activity_id: "P001", activity_name: "Permits & Site Plan Approval", trade: "Permits", original_duration: 15, start_date: d(-90), finish_date: d(-76), actual_start: d(-90), actual_finish: d(-75), percent_complete: 100, status: "complete", milestone: false, wbs: "01.01", area: "Site" },
    { activity_id: "P002", activity_name: "Surveying & Site Grading", trade: "Survey", original_duration: 5, start_date: d(-76), finish_date: d(-72), actual_start: d(-76), actual_finish: d(-71), percent_complete: 100, status: "complete", milestone: false, wbs: "01.02", area: "Site" },
    { activity_id: "P003", activity_name: "Mass Grading & Rough Grade", trade: "Earthwork", original_duration: 18, start_date: d(-72), finish_date: d(-55), actual_start: d(-72), actual_finish: d(-54), percent_complete: 100, status: "complete", milestone: false, wbs: "02.01", area: "Site" },
    { activity_id: "P004", activity_name: "Underground Storm Drain", trade: "Underground", original_duration: 12, start_date: d(-56), finish_date: d(-45), actual_start: d(-56), actual_finish: d(-44), percent_complete: 100, status: "complete", milestone: false, wbs: "02.02", area: "Site" },
    { activity_id: "P005", activity_name: "Underground Electrical Primary", trade: "Electrical", original_duration: 8, start_date: d(-55), finish_date: d(-48), actual_start: d(-55), actual_finish: d(-47), percent_complete: 100, status: "complete", milestone: false, wbs: "03.01", area: "Site" },
    { activity_id: "P006", activity_name: "Underground Plumbing — Main", trade: "Plumbing", original_duration: 10, start_date: d(-52), finish_date: d(-43), actual_start: d(-52), actual_finish: d(-42), percent_complete: 100, status: "complete", milestone: false, wbs: "03.02", area: "Grocery" },
    { activity_id: "P007", activity_name: "Slab on Grade — Grocery Building", trade: "Concrete", original_duration: 14, start_date: d(-45), finish_date: d(-32), actual_start: d(-45), actual_finish: d(-31), percent_complete: 100, status: "complete", milestone: false, wbs: "04.01", area: "Grocery" },
    { activity_id: "P008", activity_name: "Slab on Grade — Parking Structure", trade: "Concrete", original_duration: 20, start_date: d(-42), finish_date: d(-23), actual_start: d(-42), actual_finish: d(-22), percent_complete: 100, status: "complete", milestone: false, wbs: "04.02", area: "Parking" },
    { activity_id: "P009", activity_name: "Structural Steel — Grocery Building", trade: "Structural Steel", original_duration: 16, start_date: d(-32), finish_date: d(-17), actual_start: d(-32), actual_finish: d(-16), percent_complete: 100, status: "complete", milestone: false, wbs: "05.01", area: "Grocery" },
    { activity_id: "P010", activity_name: "Structural Steel Complete — Grocery", trade: "Structural Steel", original_duration: 0, start_date: d(-16), finish_date: d(-16), actual_start: d(-16), actual_finish: d(-16), percent_complete: 100, status: "complete", milestone: true, wbs: "05.99", area: "Grocery" },
    { activity_id: "P011", activity_name: "Metal Roof Deck — Grocery", trade: "Roofing", original_duration: 10, start_date: d(-18), finish_date: d(-9), actual_start: d(-18), actual_finish: d(-8), percent_complete: 100, status: "complete", milestone: false, wbs: "06.01", area: "Grocery" },
    { activity_id: "P012", activity_name: "Masonry — CMU Exterior Walls", trade: "Masonry", original_duration: 18, start_date: d(-20), finish_date: d(-3), actual_start: d(-20), actual_finish: d(-2), percent_complete: 100, status: "complete", milestone: false, wbs: "07.01", area: "Grocery" },
    // IN PROGRESS
    { activity_id: "P013", activity_name: "Roofing Membrane & Insulation", trade: "Roofing", original_duration: 10, start_date: d(-8), finish_date: d(1), actual_start: d(-8), actual_finish: null, percent_complete: 65, status: "in_progress", milestone: false, wbs: "06.02", area: "Grocery", predecessor_ids: ["P011"] },
    { activity_id: "P014", activity_name: "Interior Framing — Grocery Shell", trade: "Framing", original_duration: 14, start_date: d(-5), finish_date: d(8), actual_start: d(-5), actual_finish: null, percent_complete: 40, status: "in_progress", milestone: false, wbs: "08.01", area: "Grocery", predecessor_ids: ["P012"] },
    { activity_id: "P015", activity_name: "Plumbing Rough — Grocery Interior", trade: "Plumbing", original_duration: 16, start_date: d(-3), finish_date: d(12), actual_start: d(-3), actual_finish: null, percent_complete: 25, status: "in_progress", milestone: false, wbs: "09.01", area: "Grocery", predecessor_ids: ["P007"] },
    { activity_id: "P016", activity_name: "HVAC Ductwork — Grocery Main Hall", trade: "HVAC", original_duration: 18, start_date: d(-2), finish_date: d(15), actual_start: d(-2), actual_finish: null, percent_complete: 15, status: "in_progress", milestone: false, wbs: "10.01", area: "Grocery", predecessor_ids: ["P009"] },
    { activity_id: "P017", activity_name: "Electrical Rough Conduit — Grocery", trade: "Electrical", original_duration: 14, start_date: d(-4), finish_date: d(9), actual_start: d(-4), actual_finish: null, percent_complete: 35, status: "in_progress", milestone: false, wbs: "11.01", area: "Grocery", predecessor_ids: ["P014"] },
    { activity_id: "P018", activity_name: "Fire Sprinkler Rough — Grocery", trade: "Fire Protection", original_duration: 14, start_date: d(-1), finish_date: d(12), actual_start: d(-1), actual_finish: null, percent_complete: 10, status: "in_progress", milestone: false, wbs: "12.01", area: "Grocery", predecessor_ids: ["P014"] },
    { activity_id: "P019", activity_name: "Parking Structure — Level 1 Walls", trade: "Concrete", original_duration: 16, start_date: d(-6), finish_date: d(9), actual_start: d(-6), actual_finish: null, percent_complete: 45, status: "in_progress", milestone: false, wbs: "04.10", area: "Parking", predecessor_ids: ["P008"] },
    // UPCOMING
    { activity_id: "P020", activity_name: "Storefront Glazing — Grocery Entry", trade: "Windows/Glazing", original_duration: 8, start_date: d(9), finish_date: d(16), actual_start: null, actual_finish: null, percent_complete: 0, status: "not_started", milestone: false, wbs: "13.01", area: "Grocery", predecessor_ids: ["P014"] },
    { activity_id: "P021", activity_name: "Above Ceiling Rough Inspection — Grocery", trade: "Inspection", original_duration: 1, start_date: d(14), finish_date: d(14), actual_start: null, actual_finish: null, percent_complete: 0, status: "not_started", milestone: true, wbs: "14.01", area: "Grocery", predecessor_ids: ["P015", "P016", "P017", "P018"] },
    { activity_id: "P022", activity_name: "Insulation — Grocery Walls & Roof", trade: "Insulation", original_duration: 8, start_date: d(16), finish_date: d(23), actual_start: null, actual_finish: null, percent_complete: 0, status: "not_started", milestone: false, wbs: "15.01", area: "Grocery", predecessor_ids: ["P021"] },
    { activity_id: "P023", activity_name: "Drywall — Grocery Interior", trade: "Drywall", original_duration: 12, start_date: d(20), finish_date: d(31), actual_start: null, actual_finish: null, percent_complete: 0, status: "not_started", milestone: false, wbs: "16.01", area: "Grocery", predecessor_ids: ["P022"] },
    { activity_id: "P024", activity_name: "Flooring — Grocery Polished Concrete", trade: "Flooring", original_duration: 8, start_date: d(32), finish_date: d(39), actual_start: null, actual_finish: null, percent_complete: 0, status: "not_started", milestone: false, wbs: "17.01", area: "Grocery", predecessor_ids: ["P023"] },
    { activity_id: "P025", activity_name: "Interior Paint — Grocery", trade: "Painting", original_duration: 7, start_date: d(33), finish_date: d(39), actual_start: null, actual_finish: null, percent_complete: 0, status: "not_started", milestone: false, wbs: "18.01", area: "Grocery", predecessor_ids: ["P023"] },
    { activity_id: "P026", activity_name: "Refrigeration Equipment Delivery & Install", trade: "Delivery", original_duration: 10, start_date: d(40), finish_date: d(49), actual_start: null, actual_finish: null, percent_complete: 0, status: "not_started", milestone: false, wbs: "19.01", area: "Grocery", predecessor_ids: ["P024"] },
    { activity_id: "P027", activity_name: "Electrical Panel & Main Service", trade: "Electrical", original_duration: 5, start_date: d(20), finish_date: d(24), actual_start: null, actual_finish: null, percent_complete: 0, status: "not_started", milestone: false, wbs: "11.10", area: "Grocery", predecessor_ids: ["P017"] },
    { activity_id: "P028", activity_name: "Parking Structure — Level 2 Deck", trade: "Concrete", original_duration: 18, start_date: d(10), finish_date: d(27), actual_start: null, actual_finish: null, percent_complete: 0, status: "not_started", milestone: false, wbs: "04.11", area: "Parking", predecessor_ids: ["P019"] },
    { activity_id: "P029", activity_name: "Landscape — Site Perimeter", trade: "Landscape", original_duration: 15, start_date: d(60), finish_date: d(74), actual_start: null, actual_finish: null, percent_complete: 0, status: "not_started", milestone: false, wbs: "20.01", area: "Site" },
    { activity_id: "P030", activity_name: "Site Lighting & Electrical", trade: "Electrical", original_duration: 12, start_date: d(55), finish_date: d(66), actual_start: null, actual_finish: null, percent_complete: 0, status: "not_started", milestone: false, wbs: "11.20", area: "Site" },
    { activity_id: "P031", activity_name: "Grocery Building Substantial Completion", trade: "Inspection", original_duration: 0, start_date: d(55), finish_date: d(55), actual_start: null, actual_finish: null, percent_complete: 0, status: "not_started", milestone: true, wbs: "99.01", area: "Grocery", predecessor_ids: ["P024", "P025", "P027"] },
    { activity_id: "P032", activity_name: "Parking Structure Complete", trade: "Inspection", original_duration: 0, start_date: d(90), finish_date: d(90), actual_start: null, actual_finish: null, percent_complete: 0, status: "not_started", milestone: true, wbs: "99.02", area: "Parking", predecessor_ids: ["P028"] },
    { activity_id: "P033", activity_name: "Grand Opening Readiness", trade: "Closeout", original_duration: 7, start_date: d(170), finish_date: d(176), actual_start: null, actual_finish: null, percent_complete: 0, status: "not_started", milestone: false, wbs: "99.99", area: "Site" },
    { activity_id: "P034", activity_name: "Certificate of Occupancy — Grocery", trade: "Permits", original_duration: 0, start_date: d(178), finish_date: d(178), actual_start: null, actual_finish: null, percent_complete: 0, status: "not_started", milestone: true, wbs: "99.CO", area: "Grocery" },
    { activity_id: "P035", activity_name: "Waterproofing — Parking Deck Level 1", trade: "Waterproofing", original_duration: 6, start_date: d(28), finish_date: d(33), actual_start: null, actual_finish: null, percent_complete: 0, status: "not_started", milestone: false, wbs: "07.10", area: "Parking", predecessor_ids: ["P028"] },
    { activity_id: "P036", activity_name: "Doors, Frames & Hardware — Grocery", trade: "Doors/Hardware", original_duration: 6, start_date: d(35), finish_date: d(40), actual_start: null, actual_finish: null, percent_complete: 0, status: "not_started", milestone: false, wbs: "21.01", area: "Grocery", predecessor_ids: ["P023"] },
    { activity_id: "P037", activity_name: "Plumbing Trim Out — Grocery", trade: "Plumbing", original_duration: 5, start_date: d(42), finish_date: d(46), actual_start: null, actual_finish: null, percent_complete: 0, status: "not_started", milestone: false, wbs: "09.10", area: "Grocery", predecessor_ids: ["P024"] },
    { activity_id: "P038", activity_name: "MEP Submittals — HVAC Equipment", trade: "Submittals", original_duration: 7, start_date: d(-15), finish_date: d(-9), actual_start: d(-15), actual_finish: d(-8), percent_complete: 100, status: "complete", milestone: false, wbs: "00.02", area: "Grocery" },
    { activity_id: "P039", activity_name: "Refrigeration Equipment Fabrication", trade: "Fabrication", original_duration: 30, start_date: d(-5), finish_date: d(24), actual_start: d(-5), actual_finish: null, percent_complete: 20, status: "in_progress", milestone: false, wbs: "19.00", area: "Grocery" },
    { activity_id: "P040", activity_name: "Civil Grading — Parking Lot", trade: "Earthwork", original_duration: 8, start_date: d(35), finish_date: d(42), actual_start: null, actual_finish: null, percent_complete: 0, status: "not_started", milestone: false, wbs: "02.10", area: "Site" },
    { activity_id: "P041", activity_name: "Asphalt Paving — Parking Lot", trade: "General", original_duration: 5, start_date: d(43), finish_date: d(47), actual_start: null, actual_finish: null, percent_complete: 0, status: "not_started", milestone: false, wbs: "02.11", area: "Site", predecessor_ids: ["P040"] },
    { activity_id: "P042", activity_name: "Electrical Trim — Grocery Interior", trade: "Electrical", original_duration: 7, start_date: d(45), finish_date: d(51), actual_start: null, actual_finish: null, percent_complete: 0, status: "not_started", milestone: false, wbs: "11.11", area: "Grocery", predecessor_ids: ["P027"] },
    { activity_id: "P043", activity_name: "Fire Alarm & Life Safety Install", trade: "Fire Protection", original_duration: 8, start_date: d(38), finish_date: d(45), actual_start: null, actual_finish: null, percent_complete: 0, status: "not_started", milestone: false, wbs: "12.10", area: "Grocery", predecessor_ids: ["P021"] },
    { activity_id: "P044", activity_name: "Ceiling Grid & Tile — Grocery Office", trade: "General", original_duration: 5, start_date: d(36), finish_date: d(40), actual_start: null, actual_finish: null, percent_complete: 0, status: "not_started", milestone: false, wbs: "22.01", area: "Grocery Office", predecessor_ids: ["P023"] },
    { activity_id: "P045", activity_name: "Building Signage Installation", trade: "General", original_duration: 3, start_date: d(160), finish_date: d(162), actual_start: null, actual_finish: null, percent_complete: 0, status: "not_started", milestone: false, wbs: "25.01", area: "Site" },
    { activity_id: "P046", activity_name: "Irrigation System — Site", trade: "Landscape", original_duration: 8, start_date: d(55), finish_date: d(62), actual_start: null, actual_finish: null, percent_complete: 0, status: "not_started", milestone: false, wbs: "20.02", area: "Site" },
    { activity_id: "P047", activity_name: "Final Health Department Inspection", trade: "Inspection", original_duration: 1, start_date: d(165), finish_date: d(165), actual_start: null, actual_finish: null, percent_complete: 0, status: "not_started", milestone: true, wbs: "99.HD", area: "Grocery", predecessor_ids: ["P031"] },
    { activity_id: "P048", activity_name: "HVAC Equipment Start-Up & Commissioning", trade: "HVAC", original_duration: 5, start_date: d(48), finish_date: d(52), actual_start: null, actual_finish: null, percent_complete: 0, status: "not_started", milestone: false, wbs: "10.10", area: "Grocery", predecessor_ids: ["P027"] },
    { activity_id: "P049", activity_name: "Window Film & Tinting", trade: "Windows/Glazing", original_duration: 2, start_date: d(50), finish_date: d(51), actual_start: null, actual_finish: null, percent_complete: 0, status: "not_started", milestone: false, wbs: "13.10", area: "Grocery", predecessor_ids: ["P020"] },
    { activity_id: "P050", activity_name: "Project Closeout Documentation", trade: "Closeout", original_duration: 14, start_date: d(160), finish_date: d(173), actual_start: null, actual_finish: null, percent_complete: 0, status: "not_started", milestone: false, wbs: "99.98", area: "Project" },
  ];

  const { error: actErr2 } = await supabase.from("parsed_activities").insert(
    papagoActivities.map((a) => ({ ...a, project_id: papago.id }))
  );
  if (actErr2) { console.error("Error inserting Papago activities:", actErr2); return; }
  console.log(`✅ Inserted ${papagoActivities.length} activities for Papago Sprouts`);

  // Run risk detection manually for seed data
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const [projectId, activities] of [
    [marshall.id, marshallActivities],
    [papago.id, papagoActivities],
  ] as [string, typeof marshallActivities][]) {
    // Simple risk seed without the full engine
    const risks = [];
    for (const a of activities) {
      if (a.status === "late" && a.start_date) {
        const start = new Date(a.start_date);
        const daysLate = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        risks.push({
          project_id: projectId,
          risk_type: "DELAYED_START",
          severity: daysLate > 5 ? "high" : "medium",
          title: `Delayed Start: ${a.activity_name}`,
          description: `Activity is ${daysLate} days past scheduled start and has not begun.`,
          suggested_action: "Contact responsible party and confirm mobilization timeline.",
          status: "open",
        });
      }
      if (a.trade === "Inspection" && a.milestone && a.status === "not_started" && a.finish_date) {
        const fin = new Date(a.finish_date);
        const daysUntil = Math.floor((fin.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (daysUntil >= 0 && daysUntil <= 14) {
          risks.push({
            project_id: projectId,
            risk_type: "MILESTONE_AT_RISK",
            severity: "high",
            title: `Milestone At Risk: ${a.activity_name}`,
            description: `Milestone due in ${daysUntil} days with pending predecessor work.`,
            suggested_action: "Escalate to PM. Verify predecessor completion and book inspection.",
            status: "open",
          });
        }
      }
    }
    if (risks.length > 0) {
      await supabase.from("daily_risks").insert(risks);
    }

    // Update health score
    const { data: allRisks } = await supabase.from("daily_risks").select("*").eq("project_id", projectId).eq("status", "open");
    const highCount = (allRisks || []).filter(r => r.severity === "high").length;
    const medCount = (allRisks || []).filter(r => r.severity === "medium").length;
    let score = 100 - (highCount * 10) - (medCount * 5);
    score = Math.max(0, Math.min(100, score));
    await supabase.from("daily_projects").update({ health_score: score }).eq("id", projectId);
    console.log(`✅ ${projectId}: ${risks.length} risks seeded, health score: ${score}`);
  }

  console.log("\n🎉 Demo seed complete! Open the app at http://localhost:3030");
}

seed().catch(console.error);
