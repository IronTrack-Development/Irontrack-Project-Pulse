CREATE TABLE IF NOT EXISTS rfis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES daily_projects(id) ON DELETE CASCADE,
  rfi_number TEXT NOT NULL,
  subject TEXT NOT NULL,
  question TEXT NOT NULL,
  spec_section TEXT,
  drawing_reference TEXT,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('critical', 'high', 'normal', 'low')),
  assigned_to UUID REFERENCES company_contacts(id),
  ball_in_court TEXT DEFAULT 'contractor' CHECK (ball_in_court IN ('contractor', 'architect', 'engineer', 'owner', 'sub')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'under_review', 'answered', 'closed')),
  cost_impact BOOLEAN DEFAULT false,
  schedule_impact BOOLEAN DEFAULT false,
  due_date DATE,
  submitted_date DATE,
  answered_date DATE,
  notes TEXT,
  ai_drafted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rfi_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfi_id UUID NOT NULL REFERENCES rfis(id) ON DELETE CASCADE,
  response_text TEXT NOT NULL,
  responded_by UUID REFERENCES company_contacts(id),
  responded_by_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rfi_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfi_id UUID NOT NULL REFERENCES rfis(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  caption TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rfis_project ON rfis(project_id);
CREATE INDEX IF NOT EXISTS idx_rfis_status ON rfis(status);
CREATE INDEX IF NOT EXISTS idx_rfi_responses_rfi ON rfi_responses(rfi_id);
CREATE INDEX IF NOT EXISTS idx_rfi_photos_rfi ON rfi_photos(rfi_id);

ALTER TABLE rfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfi_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfi_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_rfis" ON rfis FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_rfi_responses" ON rfi_responses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_rfi_photos" ON rfi_photos FOR ALL USING (true) WITH CHECK (true);

CREATE TRIGGER rfis_updated_at
  BEFORE UPDATE ON rfis
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

INSERT INTO storage.buckets (id, name, public) VALUES ('rfi-photos', 'rfi-photos', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "allow_all_rfi_photo_uploads" ON storage.objects
  FOR ALL USING (bucket_id = 'rfi-photos') WITH CHECK (bucket_id = 'rfi-photos');
