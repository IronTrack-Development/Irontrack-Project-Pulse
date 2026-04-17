-- Add company_code to sub_companies table
-- This is the 6-character alphanumeric code subs give to GCs for instant matching
-- Format: IT-XXXXXX (e.g., IT-482916)

ALTER TABLE sub_companies 
  ADD COLUMN IF NOT EXISTS company_code TEXT UNIQUE;

-- Generate codes for any existing companies that don't have one
-- (This is idempotent — safe to run multiple times)
UPDATE sub_companies 
SET company_code = 'IT-' || UPPER(SUBSTR(MD5(RANDOM()::TEXT), 1, 6))
WHERE company_code IS NULL;

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_sub_companies_code ON sub_companies(company_code);

-- Add company_code field to project_subs for direct code-based linking
ALTER TABLE project_subs
  ADD COLUMN IF NOT EXISTS linked_company_code TEXT;
