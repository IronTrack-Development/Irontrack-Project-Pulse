-- Migration 014: Coordination Meetings
-- Trade coordination meetings, agenda items, action items, meeting types, attendees

-- ─── Tables ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS coordination_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES daily_projects(id) ON DELETE CASCADE,
  meeting_date DATE NOT NULL,
  meeting_type TEXT NOT NULL DEFAULT 'weekly_coordination',
  title TEXT NOT NULL,
  location TEXT,
  facilitator TEXT,
  start_time TEXT,
  end_time TEXT,
  notes TEXT,
  summary TEXT,
  recurrence TEXT CHECK (recurrence IN ('none', 'daily', 'weekly', 'biweekly', 'monthly')),
  recurrence_day TEXT,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS coordination_agenda_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES coordination_meetings(id) ON DELETE CASCADE,
  activity_id UUID REFERENCES parsed_activities(id) ON DELETE SET NULL,
  sort_order INTEGER DEFAULT 0,
  title TEXT NOT NULL,
  trade TEXT,
  area TEXT,
  notes TEXT,
  has_conflict BOOLEAN DEFAULT false,
  conflict_description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'discussed', 'deferred', 'resolved')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS coordination_action_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES coordination_meetings(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES daily_projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to TEXT,
  assigned_company TEXT,
  assigned_trade TEXT,
  category TEXT DEFAULT 'general' CHECK (category IN (
    'general', 'rfi', 'material_delivery', 'manpower', 'equipment',
    'schedule', 'safety', 'drawing', 'submittal', 'inspection', 'custom'
  )),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  due_date DATE,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'cancelled')),
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS coordination_meeting_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES daily_projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  default_agenda TEXT[] DEFAULT '{}',
  default_duration_minutes INTEGER DEFAULT 60,
  is_system BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS coordination_attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES coordination_meetings(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  company TEXT,
  trade TEXT,
  present BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Indexes ──────────────────────────────────────────────────────────────────

CREATE INDEX idx_coord_meetings_project_date ON coordination_meetings(project_id, meeting_date DESC);
CREATE INDEX idx_coord_agenda_meeting ON coordination_agenda_items(meeting_id, sort_order);
CREATE INDEX idx_coord_actions_project ON coordination_action_items(project_id, status);
CREATE INDEX idx_coord_actions_meeting ON coordination_action_items(meeting_id);
CREATE INDEX idx_coord_attendees_meeting ON coordination_attendees(meeting_id);
CREATE INDEX idx_coord_meeting_types_project ON coordination_meeting_types(project_id);

-- ─── RLS (V1 — open access) ──────────────────────────────────────────────────

ALTER TABLE coordination_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE coordination_agenda_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE coordination_action_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE coordination_meeting_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE coordination_attendees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all" ON coordination_meetings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON coordination_agenda_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON coordination_action_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON coordination_meeting_types FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON coordination_attendees FOR ALL USING (true) WITH CHECK (true);

-- ─── Triggers ─────────────────────────────────────────────────────────────────

CREATE TRIGGER coord_meetings_updated_at
  BEFORE UPDATE ON coordination_meetings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER coord_actions_updated_at
  BEFORE UPDATE ON coordination_action_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── Seed Data: System Meeting Types ──────────────────────────────────────────

INSERT INTO coordination_meeting_types (name, default_agenda, default_duration_minutes, is_system) VALUES
('Weekly Coordination', ARRAY['Review 3-week lookahead','Trade conflicts and overlaps','Open action items','Material deliveries this week','Manpower needs','Safety concerns','Schedule changes','New business'], 60, true),
('OAC Meeting', ARRAY['Project status update','Schedule review','Budget update','Change orders','RFI status','Submittal status','Safety report','Owner items'], 90, true),
('Pre-Pour Meeting', ARRAY['Pour location and scope','Concrete mix design and supplier','Rebar inspection status','Embed and sleeve verification','Weather forecast','Pour sequence and crew','Pump or direct placement','Finish requirements and curing'], 30, true),
('Pull Planning Session', ARRAY['Define target milestone','Identify required tasks and handoffs','Map trade dependencies','Set weekly work plans','Identify constraints','Assign commitments','Review PPC from last cycle'], 120, true),
('Pre-Task Planning', ARRAY['Scope of work today','Hazards and controls','Required permits','Equipment and materials needed','Emergency procedures','Questions and concerns'], 15, true);
