-- Migration 005: Add WBS hierarchy and raw metadata columns to parsed_activities
-- All columns are nullable — fully non-breaking for existing data

ALTER TABLE parsed_activities
  -- Raw metadata from source
  ADD COLUMN IF NOT EXISTS constraint_type      TEXT,
  ADD COLUMN IF NOT EXISTS constraint_date      DATE,
  ADD COLUMN IF NOT EXISTS resource_names       TEXT,
  ADD COLUMN IF NOT EXISTS notes                TEXT,
  ADD COLUMN IF NOT EXISTS external_task_id     TEXT,
  ADD COLUMN IF NOT EXISTS external_unique_id   TEXT,
  ADD COLUMN IF NOT EXISTS outline_level        INTEGER,
  ADD COLUMN IF NOT EXISTS parent_activity_name TEXT,

  -- Normalized hierarchy (extracted from WBS ancestry)
  ADD COLUMN IF NOT EXISTS normalized_building  TEXT,
  ADD COLUMN IF NOT EXISTS normalized_phase     TEXT,
  ADD COLUMN IF NOT EXISTS normalized_area      TEXT,
  ADD COLUMN IF NOT EXISTS normalized_work_type TEXT,
  ADD COLUMN IF NOT EXISTS normalized_trade     TEXT;

-- Indexes for filtering by building and phase (most common UI filters)
CREATE INDEX IF NOT EXISTS idx_parsed_activities_normalized_building
  ON parsed_activities (project_id, normalized_building)
  WHERE normalized_building IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_parsed_activities_normalized_phase
  ON parsed_activities (project_id, normalized_phase)
  WHERE normalized_phase IS NOT NULL;
