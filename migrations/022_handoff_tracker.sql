-- 022: Internal Handoff Tracker for Sub Ops

CREATE TABLE IF NOT EXISTS sub_departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES sub_companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  trade TEXT,
  sort_order INTEGER DEFAULT 0,
  color TEXT DEFAULT '#F97316',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sub_crew_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES sub_companies(id) ON DELETE CASCADE,
  department_id UUID REFERENCES sub_departments(id) ON DELETE SET NULL,
  foreman_id UUID REFERENCES sub_foremen(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'journeyman' CHECK (role IN ('foreman', 'journeyman', 'apprentice', 'helper', 'superintendent', 'project_manager', 'other')),
  phone TEXT,
  email TEXT,
  hourly_rate NUMERIC,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sub_handoff_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES sub_companies(id) ON DELETE CASCADE,
  project_name TEXT NOT NULL,
  area_name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sub_handoffs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES sub_companies(id) ON DELETE CASCADE,
  area_id UUID NOT NULL REFERENCES sub_handoff_areas(id) ON DELETE CASCADE,
  from_department_id UUID NOT NULL REFERENCES sub_departments(id) ON DELETE CASCADE,
  to_department_id UUID NOT NULL REFERENCES sub_departments(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'ready_for_handoff', 'handed_off', 'accepted', 'issue_flagged')),
  handoff_date DATE,
  accepted_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sub_handoff_checklist_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES sub_companies(id) ON DELETE CASCADE,
  from_department_id UUID REFERENCES sub_departments(id) ON DELETE SET NULL,
  to_department_id UUID REFERENCES sub_departments(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  items TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sub_handoff_checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  handoff_id UUID NOT NULL REFERENCES sub_handoffs(id) ON DELETE CASCADE,
  item_text TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  completed_by TEXT,
  completed_at TIMESTAMPTZ,
  photo_path TEXT,
  notes TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sub_handoff_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  handoff_id UUID NOT NULL REFERENCES sub_handoffs(id) ON DELETE CASCADE,
  photo_path TEXT NOT NULL,
  caption TEXT,
  taken_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_sub_departments_company ON sub_departments(company_id, sort_order);
CREATE INDEX idx_sub_crew_members_company ON sub_crew_members(company_id);
CREATE INDEX idx_sub_crew_members_dept ON sub_crew_members(department_id);
CREATE INDEX idx_sub_handoff_areas_company ON sub_handoff_areas(company_id);
CREATE INDEX idx_sub_handoffs_area ON sub_handoffs(area_id);
CREATE INDEX idx_sub_handoffs_company ON sub_handoffs(company_id, status);
CREATE INDEX idx_sub_handoff_checklist_handoff ON sub_handoff_checklist_items(handoff_id, sort_order);
CREATE INDEX idx_sub_handoff_photos_handoff ON sub_handoff_photos(handoff_id);

-- RLS
ALTER TABLE sub_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sub_crew_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE sub_handoff_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE sub_handoffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sub_handoff_checklist_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE sub_handoff_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sub_handoff_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all" ON sub_departments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON sub_crew_members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON sub_handoff_areas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON sub_handoffs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON sub_handoff_checklist_templates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON sub_handoff_checklist_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON sub_handoff_photos FOR ALL USING (true) WITH CHECK (true);

-- Triggers
CREATE TRIGGER sub_departments_updated_at BEFORE UPDATE ON sub_departments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER sub_crew_members_updated_at BEFORE UPDATE ON sub_crew_members FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER sub_handoffs_updated_at BEFORE UPDATE ON sub_handoffs FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER sub_handoff_templates_updated_at BEFORE UPDATE ON sub_handoff_checklist_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('sub-handoff-photos', 'sub-handoff-photos', true) ON CONFLICT (id) DO NOTHING;
CREATE POLICY "allow_all_sub_handoff_uploads" ON storage.objects FOR ALL USING (bucket_id = 'sub-handoff-photos') WITH CHECK (bucket_id = 'sub-handoff-photos');
