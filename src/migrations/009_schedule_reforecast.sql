-- Migration 009: Schedule Reforecast Engine
-- Extends parsed_activities + adds snapshot/progress tracking tables

-- ═══════════════════════════════════════════════════════
-- 1. Extend parsed_activities with reforecast fields
-- ═══════════════════════════════════════════════════════

ALTER TABLE parsed_activities
  -- Baseline dates (original imported dates, never change after first import)
  ADD COLUMN IF NOT EXISTS baseline_start      DATE,
  ADD COLUMN IF NOT EXISTS baseline_finish     DATE,
  ADD COLUMN IF NOT EXISTS baseline_duration   INTEGER,

  -- Forecast dates (recalculated by engine)
  ADD COLUMN IF NOT EXISTS forecast_start      DATE,
  ADD COLUMN IF NOT EXISTS forecast_finish     DATE,

  -- Scheduling metadata
  ADD COLUMN IF NOT EXISTS early_start         DATE,
  ADD COLUMN IF NOT EXISTS early_finish        DATE,
  ADD COLUMN IF NOT EXISTS late_start          DATE,
  ADD COLUMN IF NOT EXISTS late_finish         DATE,
  ADD COLUMN IF NOT EXISTS is_critical         BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS total_float         INTEGER,
  ADD COLUMN IF NOT EXISTS free_float          INTEGER,

  -- Dependency detail (structured, replaces string arrays for engine use)
  ADD COLUMN IF NOT EXISTS dependency_links    JSONB DEFAULT '[]',
  -- Format: [{ "predecessor_id": "uuid", "type": "FS", "lag_days": 0 }]

  -- Override flag (user manually set remaining duration)
  ADD COLUMN IF NOT EXISTS manual_override     BOOLEAN DEFAULT false,

  -- Last reforecast timestamp
  ADD COLUMN IF NOT EXISTS last_reforecast_at  TIMESTAMPTZ;

-- Index for reforecast queries
CREATE INDEX IF NOT EXISTS idx_parsed_activities_is_critical
  ON parsed_activities (project_id, is_critical) WHERE is_critical = true;
CREATE INDEX IF NOT EXISTS idx_parsed_activities_forecast_start
  ON parsed_activities (project_id, forecast_start);

-- ═══════════════════════════════════════════════════════
-- 2. Progress updates log (audit trail)
-- ═══════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS progress_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES daily_projects(id) ON DELETE CASCADE,
  activity_id UUID REFERENCES parsed_activities(id) ON DELETE CASCADE,
  
  -- What changed
  previous_percent_complete  NUMERIC,
  new_percent_complete       NUMERIC,
  previous_remaining_duration INTEGER,
  new_remaining_duration     INTEGER,
  previous_status            TEXT,
  new_status                 TEXT,
  actual_start_set           DATE,
  actual_finish_set          DATE,
  manual_override            BOOLEAN DEFAULT false,
  
  -- Who / when
  updated_by                 TEXT,
  notes                      TEXT,
  created_at                 TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_progress_updates_project
  ON progress_updates(project_id);
CREATE INDEX IF NOT EXISTS idx_progress_updates_activity
  ON progress_updates(activity_id);
CREATE INDEX IF NOT EXISTS idx_progress_updates_created
  ON progress_updates(created_at DESC);

-- RLS
ALTER TABLE progress_updates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_progress_updates" ON progress_updates FOR ALL USING (true) WITH CHECK (true);

-- ═══════════════════════════════════════════════════════
-- 3. Schedule snapshots (point-in-time copies)
-- ═══════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS schedule_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES daily_projects(id) ON DELETE CASCADE,
  
  -- Snapshot metadata
  snapshot_name              TEXT,
  snapshot_type              TEXT DEFAULT 'reforecast',  -- 'baseline', 'reforecast', 'manual'
  trigger_description        TEXT,                       -- e.g. "Progress update on 3 tasks"
  
  -- Project-level results at time of snapshot
  baseline_finish_date       DATE,
  forecast_finish_date       DATE,
  completion_delta_days      INTEGER,                    -- forecast - baseline (positive = late)
  critical_path_changed      BOOLEAN DEFAULT false,
  total_activities           INTEGER,
  complete_activities        INTEGER,
  critical_activities        INTEGER,
  at_risk_activities         INTEGER,                    -- float <= 0 and not complete
  
  -- Full task data at snapshot time (JSONB array of all tasks)
  task_data                  JSONB,
  
  -- Recovery actions generated
  recovery_actions           JSONB DEFAULT '[]',
  
  -- Risk flags
  risk_flags                 JSONB DEFAULT '[]',
  
  -- Schedule impacts
  schedule_impacts           JSONB DEFAULT '[]',
  
  -- Export
  mspdi_export_path          TEXT,                       -- Supabase Storage path
  
  created_at                 TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_schedule_snapshots_project
  ON schedule_snapshots(project_id);
CREATE INDEX IF NOT EXISTS idx_schedule_snapshots_created
  ON schedule_snapshots(created_at DESC);

-- RLS
ALTER TABLE schedule_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_schedule_snapshots" ON schedule_snapshots FOR ALL USING (true) WITH CHECK (true);

-- ═══════════════════════════════════════════════════════
-- 4. One-time: backfill baseline dates from current dates
-- ═══════════════════════════════════════════════════════
-- Run this ONCE after migration to set baselines from imported data:
-- UPDATE parsed_activities
--   SET baseline_start = start_date,
--       baseline_finish = finish_date,
--       baseline_duration = original_duration,
--       forecast_start = start_date,
--       forecast_finish = finish_date
--   WHERE baseline_start IS NULL;
