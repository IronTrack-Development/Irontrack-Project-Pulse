-- IronTrack Pulse — Migration 011: Daily Logs
-- Run this in the Supabase SQL Editor

-- ============================================================
-- 1. daily_logs — one per project per day
-- ============================================================
CREATE TABLE IF NOT EXISTS daily_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES daily_projects(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  superintendent TEXT,
  weather JSONB DEFAULT '{}',
  crew JSONB DEFAULT '[]',
  deliveries TEXT,
  equipment TEXT[] DEFAULT '{}',
  delay_codes TEXT[] DEFAULT '{}',
  delay_narrative TEXT,
  lost_crew_hours NUMERIC DEFAULT 0,
  toolbox_talk TEXT,
  incidents TEXT,
  visitors TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'locked')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  locked_at TIMESTAMPTZ,
  UNIQUE(project_id, log_date)
);

-- ============================================================
-- 2. daily_log_progress — activity snapshots per log
-- ============================================================
CREATE TABLE IF NOT EXISTS daily_log_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_log_id UUID NOT NULL REFERENCES daily_logs(id) ON DELETE CASCADE,
  activity_id UUID REFERENCES parsed_activities(id) ON DELETE SET NULL,
  pct_complete_before NUMERIC DEFAULT 0,
  pct_complete_after NUMERIC DEFAULT 0,
  note TEXT
);

-- ============================================================
-- 3. daily_log_photos — photo metadata
-- ============================================================
CREATE TABLE IF NOT EXISTS daily_log_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_log_id UUID NOT NULL REFERENCES daily_logs(id) ON DELETE CASCADE,
  activity_id UUID REFERENCES parsed_activities(id) ON DELETE SET NULL,
  storage_path TEXT NOT NULL,
  taken_at TIMESTAMPTZ,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  caption TEXT,
  gps_lat NUMERIC,
  gps_lon NUMERIC
);

-- ============================================================
-- 4. Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_daily_logs_project_date ON daily_logs(project_id, log_date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_log_progress_activity ON daily_log_progress(activity_id);
CREATE INDEX IF NOT EXISTS idx_daily_log_progress_log ON daily_log_progress(daily_log_id);
CREATE INDEX IF NOT EXISTS idx_daily_log_photos_log ON daily_log_photos(daily_log_id);

-- ============================================================
-- 5. RLS — open access V1 (matches existing pattern)
-- ============================================================
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_log_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_log_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_daily_logs" ON daily_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_daily_log_progress" ON daily_log_progress FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_daily_log_photos" ON daily_log_photos FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- 6. updated_at trigger for daily_logs
-- ============================================================
CREATE TRIGGER daily_logs_updated_at
  BEFORE UPDATE ON daily_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 7. Storage bucket for daily log photos
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('daily-log-photos', 'daily-log-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: allow all uploads (V1)
CREATE POLICY "allow_all_daily_log_photo_uploads"
ON storage.objects FOR ALL
USING (bucket_id = 'daily-log-photos')
WITH CHECK (bucket_id = 'daily-log-photos');
