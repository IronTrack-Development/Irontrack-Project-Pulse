-- Fix: Allow multiple reports per day from different foremen on the same link
-- Old constraint: UNIQUE(link_id, report_date) — only one report per day per link
-- New constraint: UNIQUE(link_id, report_date, submitted_by) — one per foreman per day

-- Drop old constraint
ALTER TABLE sub_progress_reports DROP CONSTRAINT IF EXISTS sub_progress_reports_link_id_report_date_key;

-- Add new constraint that includes submitted_by
ALTER TABLE sub_progress_reports ADD CONSTRAINT sub_progress_reports_link_date_submitter_key 
  UNIQUE(link_id, report_date, submitted_by);
