-- Migration 013 — BATCH 1 of 3: Tables, indexes, RLS, trigger
-- Paste this into Supabase SQL Editor and run first

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
