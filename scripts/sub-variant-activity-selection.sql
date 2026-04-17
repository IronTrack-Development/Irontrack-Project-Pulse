-- ============================================================
-- Sub Variant — Activity Selection Migration
-- Adds ability for GC to hand-pick which activities each sub sees
-- Run in Supabase SQL Editor after sub-variant-migration.sql
-- ============================================================

-- Add activity_ids column to project_subs
-- This stores the specific activity IDs the GC wants to share with this sub
-- NULL means "use trade-based filtering" (backward compatible)
ALTER TABLE project_subs 
  ADD COLUMN IF NOT EXISTS activity_ids UUID[] DEFAULT NULL;

-- Index for activity_ids lookups
CREATE INDEX IF NOT EXISTS idx_project_subs_activity_ids 
  ON project_subs USING GIN(activity_ids);
