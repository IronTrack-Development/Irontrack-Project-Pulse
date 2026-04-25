-- Migration 019: Drawing Sets, Sheets, and Pins

CREATE TABLE IF NOT EXISTS drawing_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES daily_projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  revision TEXT DEFAULT 'Rev 0',
  description TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  uploaded_by TEXT,
  is_current BOOLEAN DEFAULT true,
  sheet_count INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS drawing_sheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  set_id UUID NOT NULL REFERENCES drawing_sets(id) ON DELETE CASCADE,
  sheet_number TEXT NOT NULL,
  sheet_title TEXT,
  discipline TEXT CHECK (discipline IN ('architectural', 'structural', 'mechanical', 'electrical', 'plumbing', 'civil', 'landscape', 'fire_protection', 'general', 'other')),
  storage_path TEXT NOT NULL,
  thumbnail_path TEXT,
  page_index INTEGER DEFAULT 0,
  width INTEGER,
  height INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS drawing_pins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sheet_id UUID NOT NULL REFERENCES drawing_sheets(id) ON DELETE CASCADE,
  pin_type TEXT NOT NULL CHECK (pin_type IN ('rfi', 'punch', 'submittal', 'note', 'photo')),
  reference_id UUID,
  x_percent NUMERIC NOT NULL,
  y_percent NUMERIC NOT NULL,
  label TEXT,
  notes TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_drawing_sets_project ON drawing_sets(project_id);
CREATE INDEX IF NOT EXISTS idx_drawing_sheets_set ON drawing_sheets(set_id);
CREATE INDEX IF NOT EXISTS idx_drawing_pins_sheet ON drawing_pins(sheet_id);
CREATE INDEX IF NOT EXISTS idx_drawing_pins_type ON drawing_pins(pin_type);

ALTER TABLE drawing_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE drawing_sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE drawing_pins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_drawing_sets" ON drawing_sets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_drawing_sheets" ON drawing_sheets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_drawing_pins" ON drawing_pins FOR ALL USING (true) WITH CHECK (true);

INSERT INTO storage.buckets (id, name, public) VALUES ('drawings', 'drawings', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "allow_all_drawings_uploads" ON storage.objects FOR ALL USING (bucket_id = 'drawings') WITH CHECK (bucket_id = 'drawings');
