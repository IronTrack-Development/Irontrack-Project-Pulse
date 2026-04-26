-- 020_field_reports.sql — Photo-first field reports

CREATE TABLE IF NOT EXISTS field_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES daily_projects(id) ON DELETE CASCADE,
  report_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  photo_path TEXT,
  photo_caption TEXT,
  assigned_to TEXT,
  assigned_company TEXT,
  comments TEXT,
  location TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  linked_activity_id UUID REFERENCES parsed_activities(id) ON DELETE SET NULL,
  trade TEXT,
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_field_reports_project ON field_reports(project_id, created_at DESC);
CREATE INDEX idx_field_reports_status ON field_reports(project_id, status);

ALTER TABLE field_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_field_reports" ON field_reports FOR ALL USING (true) WITH CHECK (true);

CREATE TRIGGER field_reports_updated_at
  BEFORE UPDATE ON field_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Storage bucket for report photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('field-report-photos', 'field-report-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "allow_all_field_report_photo_uploads"
ON storage.objects FOR ALL
USING (bucket_id = 'field-report-photos')
WITH CHECK (bucket_id = 'field-report-photos');
