-- ============================================================
-- sub_companies migration
-- Run in Supabase SQL editor or via psql
-- ============================================================

CREATE TABLE IF NOT EXISTS sub_companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE sub_companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sub_companies_owner_select" ON sub_companies
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "sub_companies_owner_update" ON sub_companies
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "sub_companies_insert" ON sub_companies
  FOR INSERT WITH CHECK (TRUE);

CREATE INDEX IF NOT EXISTS idx_sub_companies_user_id ON sub_companies(user_id);
CREATE INDEX IF NOT EXISTS idx_sub_companies_name ON sub_companies(company_name);

-- Link project_subs to sub_companies for matching
ALTER TABLE project_subs
  ADD COLUMN IF NOT EXISTS sub_company_id UUID REFERENCES sub_companies(id);
