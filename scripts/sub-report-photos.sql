-- Migration: Add photo_urls column to sub_progress_reports
-- Run this after the base sub-progress-reports.sql migration

ALTER TABLE sub_progress_reports
  ADD COLUMN IF NOT EXISTS photo_urls TEXT[] DEFAULT '{}';

-- Create the Supabase Storage bucket for report photos (run once in dashboard or via API)
-- Bucket name: report-photos
-- Policy: service role can read/write; anon can read public URLs
-- NOTE: Create this bucket manually in the Supabase dashboard if it doesn't exist.
-- Suggested settings: Public bucket = true (so photo URLs are shareable with GC)

COMMENT ON COLUMN sub_progress_reports.photo_urls IS
  'Array of public Supabase Storage URLs for photos attached to this report. Uploaded at submit time.';
