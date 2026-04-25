CREATE TABLE IF NOT EXISTS punch_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES daily_projects(id) ON DELETE CASCADE,
  item_number TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT,
  building TEXT,
  floor TEXT,
  room TEXT,
  trade TEXT,
  assigned_to UUID REFERENCES company_contacts(id),
  priority TEXT DEFAULT 'standard' CHECK (priority IN ('life_safety', 'code', 'standard', 'cosmetic')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'ready_for_reinspect', 'closed', 'disputed')),
  due_date DATE,
  closed_date DATE,
  closed_by TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS punch_item_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  punch_item_id UUID NOT NULL REFERENCES punch_items(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  photo_type TEXT DEFAULT 'issue' CHECK (photo_type IN ('issue', 'completed')),
  caption TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_punch_items_project ON punch_items(project_id);
CREATE INDEX IF NOT EXISTS idx_punch_items_status ON punch_items(status);
CREATE INDEX IF NOT EXISTS idx_punch_items_assigned ON punch_items(assigned_to);
CREATE INDEX IF NOT EXISTS idx_punch_photos_item ON punch_item_photos(punch_item_id);

ALTER TABLE punch_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE punch_item_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_all_punch_items" ON punch_items;
CREATE POLICY "allow_all_punch_items" ON punch_items FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_punch_photos" ON punch_item_photos;
CREATE POLICY "allow_all_punch_photos" ON punch_item_photos FOR ALL USING (true) WITH CHECK (true);

DROP TRIGGER IF EXISTS punch_items_updated_at ON punch_items;
CREATE TRIGGER punch_items_updated_at BEFORE UPDATE ON punch_items FOR EACH ROW EXECUTE FUNCTION update_updated_at();

INSERT INTO storage.buckets (id, name, public) VALUES ('punch-photos', 'punch-photos', true) ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "allow_all_punch_photo_uploads" ON storage.objects;
CREATE POLICY "allow_all_punch_photo_uploads" ON storage.objects FOR ALL USING (bucket_id = 'punch-photos') WITH CHECK (bucket_id = 'punch-photos');
