CREATE TABLE IF NOT EXISTS submittals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES daily_projects(id) ON DELETE CASCADE,
  submittal_number TEXT NOT NULL,
  spec_section TEXT,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID REFERENCES company_contacts(id),
  reviewer_id UUID REFERENCES company_contacts(id),
  ball_in_court TEXT DEFAULT 'contractor' CHECK (ball_in_court IN ('contractor', 'architect', 'engineer', 'owner', 'sub')),
  status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_preparation', 'submitted', 'under_review', 'approved', 'approved_as_noted', 'revise_resubmit', 'rejected')),
  required_by DATE,
  submitted_date DATE,
  returned_date DATE,
  lead_time_days INTEGER,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('critical', 'high', 'normal', 'low')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS submittal_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submittal_id UUID NOT NULL REFERENCES submittals(id) ON DELETE CASCADE,
  revision_number INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL,
  notes TEXT,
  changed_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_submittals_project ON submittals(project_id);
CREATE INDEX IF NOT EXISTS idx_submittals_status ON submittals(status);
CREATE INDEX IF NOT EXISTS idx_submittal_revisions_submittal ON submittal_revisions(submittal_id);

ALTER TABLE submittals ENABLE ROW LEVEL SECURITY;
ALTER TABLE submittal_revisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_submittals" ON submittals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_submittal_revisions" ON submittal_revisions FOR ALL USING (true) WITH CHECK (true);

CREATE TRIGGER submittals_updated_at
  BEFORE UPDATE ON submittals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
