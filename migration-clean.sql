-- IronTrack Daily — Clean Migration (no duplicate policy errors)

DROP TABLE IF EXISTS daily_briefs CASCADE;
DROP TABLE IF EXISTS daily_risks CASCADE;
DROP TABLE IF EXISTS parsed_activities CASCADE;
DROP TABLE IF EXISTS schedule_uploads CASCADE;
DROP TABLE IF EXISTS daily_projects CASCADE;

CREATE TABLE daily_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  project_number TEXT,
  client_name TEXT,
  location TEXT,
  start_date DATE,
  target_finish_date DATE,
  status TEXT DEFAULT 'active',
  health_score INTEGER DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE schedule_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES daily_projects(id) ON DELETE CASCADE,
  original_filename TEXT NOT NULL,
  file_type TEXT,
  parse_status TEXT DEFAULT 'pending',
  activity_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE parsed_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES daily_projects(id) ON DELETE CASCADE,
  upload_id UUID REFERENCES schedule_uploads(id) ON DELETE CASCADE,
  activity_id TEXT,
  activity_name TEXT NOT NULL,
  wbs TEXT,
  area TEXT,
  phase TEXT,
  trade TEXT,
  original_duration INTEGER,
  remaining_duration INTEGER,
  start_date DATE,
  finish_date DATE,
  actual_start DATE,
  actual_finish DATE,
  percent_complete NUMERIC DEFAULT 0,
  predecessor_ids TEXT[],
  successor_ids TEXT[],
  milestone BOOLEAN DEFAULT false,
  activity_type TEXT,
  status TEXT DEFAULT 'not_started',
  float_days INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE daily_risks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES daily_projects(id) ON DELETE CASCADE,
  activity_id UUID REFERENCES parsed_activities(id),
  risk_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  suggested_action TEXT,
  status TEXT DEFAULT 'open',
  detected_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE daily_briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES daily_projects(id) ON DELETE CASCADE,
  brief_date DATE NOT NULL,
  summary JSONB,
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_activities_project ON parsed_activities(project_id);
CREATE INDEX idx_activities_status ON parsed_activities(status);
CREATE INDEX idx_activities_start ON parsed_activities(start_date);
CREATE INDEX idx_activities_finish ON parsed_activities(finish_date);
CREATE INDEX idx_risks_project ON daily_risks(project_id);
CREATE INDEX idx_risks_severity ON daily_risks(severity);

-- RLS open access for V1
ALTER TABLE daily_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE parsed_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_risks ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_briefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "open_daily_projects" ON daily_projects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_schedule_uploads" ON schedule_uploads FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_parsed_activities" ON parsed_activities FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_daily_risks" ON daily_risks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_daily_briefs" ON daily_briefs FOR ALL USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';
