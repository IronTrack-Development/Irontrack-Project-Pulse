CREATE TABLE IF NOT EXISTS sub_progress_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  link_id UUID NOT NULL REFERENCES sub_share_links(id) ON DELETE CASCADE,
  sub_id UUID NOT NULL REFERENCES project_subs(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES daily_projects(id) ON DELETE CASCADE,
  report_date DATE NOT NULL DEFAULT CURRENT_DATE,
  submitted_by TEXT NOT NULL,
  worked_on_activities JSONB NOT NULL DEFAULT '[]',
  manpower_count INTEGER,
  total_hours NUMERIC(6,1),
  delay_reasons TEXT[] DEFAULT '{}',
  notes TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(link_id, report_date)
);

ALTER TABLE sub_progress_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sub_progress_reports_owner_select" ON sub_progress_reports
  FOR SELECT USING (
    project_id IN (SELECT id FROM daily_projects WHERE user_id = auth.uid())
  );

CREATE POLICY "sub_progress_reports_anon_insert" ON sub_progress_reports
  FOR INSERT WITH CHECK (TRUE);

CREATE INDEX IF NOT EXISTS idx_sub_progress_reports_project ON sub_progress_reports(project_id);
CREATE INDEX IF NOT EXISTS idx_sub_progress_reports_sub ON sub_progress_reports(sub_id);
CREATE INDEX IF NOT EXISTS idx_sub_progress_reports_date ON sub_progress_reports(report_date DESC);
