-- Issue Reports (one per schedule item per session)
CREATE TABLE IF NOT EXISTS issue_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES daily_projects(id) ON DELETE CASCADE,
  activity_id UUID REFERENCES parsed_activities(id) ON DELETE SET NULL,
  user_id UUID,
  
  -- Report metadata
  report_number TEXT,           -- auto-generated: IR-001, IR-002, etc.
  activity_name TEXT NOT NULL,
  project_name TEXT,
  trade TEXT,
  normalized_building TEXT,
  prepared_by TEXT,
  report_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Summary
  issue_count INTEGER DEFAULT 0,
  overall_assessment TEXT,      -- auto-generated from issues
  
  -- Status
  status TEXT NOT NULL DEFAULT 'draft',  -- 'draft', 'generated', 'shared'
  
  -- PDF storage
  pdf_path TEXT,                -- Supabase Storage path to generated PDF
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual issues within a report
CREATE TABLE IF NOT EXISTS report_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES issue_reports(id) ON DELETE CASCADE,
  
  -- Issue details
  issue_number INTEGER NOT NULL,   -- 1, 2, 3, etc. within the report
  title TEXT NOT NULL,
  note TEXT,
  location TEXT,
  priority TEXT NOT NULL DEFAULT 'medium',  -- 'high', 'medium', 'low'
  category TEXT NOT NULL DEFAULT 'qa_qc',   -- 'qa_qc', 'safety', 'schedule'
  status TEXT NOT NULL DEFAULT 'open',      -- 'open', 'in_progress', 'resolved'
  
  -- Photo storage (array of Supabase Storage paths)
  photo_paths TEXT[] DEFAULT '{}',
  photo_captions TEXT[] DEFAULT '{}',
  
  -- Trade (inherited from activity or manual)
  trade TEXT,
  
  -- Potential impact (short text)
  potential_impact TEXT,
  action_needed TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_issue_reports_project ON issue_reports(project_id);
CREATE INDEX IF NOT EXISTS idx_issue_reports_activity ON issue_reports(activity_id);
CREATE INDEX IF NOT EXISTS idx_issue_reports_status ON issue_reports(status);
CREATE INDEX IF NOT EXISTS idx_report_issues_report ON report_issues(report_id);

-- RLS
ALTER TABLE issue_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_issues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_issue_reports" ON issue_reports FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_report_issues" ON report_issues FOR ALL USING (true) WITH CHECK (true);

-- Triggers
CREATE TRIGGER issue_reports_updated_at BEFORE UPDATE ON issue_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER report_issues_updated_at BEFORE UPDATE ON report_issues FOR EACH ROW EXECUTE FUNCTION update_updated_at();
