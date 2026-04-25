CREATE TABLE IF NOT EXISTS tm_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES daily_projects(id) ON DELETE CASCADE,
  ticket_number TEXT NOT NULL,
  sub_contact_id UUID REFERENCES company_contacts(id),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'disputed', 'invoiced')),
  total_labor_cost NUMERIC DEFAULT 0,
  total_material_cost NUMERIC DEFAULT 0,
  total_equipment_cost NUMERIC DEFAULT 0,
  total_cost NUMERIC GENERATED ALWAYS AS (total_labor_cost + total_material_cost + total_equipment_cost) STORED,
  gc_signature_path TEXT,
  gc_signed_by TEXT,
  gc_signed_at TIMESTAMPTZ,
  sub_signature_path TEXT,
  sub_signed_by TEXT,
  sub_signed_at TIMESTAMPTZ,
  dispute_reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tm_labor_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tm_tickets(id) ON DELETE CASCADE,
  trade TEXT NOT NULL,
  workers INTEGER NOT NULL DEFAULT 1,
  hours NUMERIC NOT NULL DEFAULT 0,
  rate NUMERIC,
  total NUMERIC GENERATED ALWAYS AS (workers * hours * COALESCE(rate, 0)) STORED,
  description TEXT
);

CREATE TABLE IF NOT EXISTS tm_material_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tm_tickets(id) ON DELETE CASCADE,
  item TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit TEXT DEFAULT 'ea',
  unit_cost NUMERIC DEFAULT 0,
  total NUMERIC GENERATED ALWAYS AS (quantity * unit_cost) STORED,
  receipt_photo_path TEXT
);

CREATE TABLE IF NOT EXISTS tm_equipment_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tm_tickets(id) ON DELETE CASCADE,
  equipment_type TEXT NOT NULL,
  hours NUMERIC NOT NULL DEFAULT 0,
  rate NUMERIC DEFAULT 0,
  total NUMERIC GENERATED ALWAYS AS (hours * rate) STORED,
  description TEXT
);

CREATE INDEX IF NOT EXISTS idx_tm_tickets_project ON tm_tickets(project_id);
CREATE INDEX IF NOT EXISTS idx_tm_tickets_sub ON tm_tickets(sub_contact_id);
CREATE INDEX IF NOT EXISTS idx_tm_labor_ticket ON tm_labor_items(ticket_id);
CREATE INDEX IF NOT EXISTS idx_tm_material_ticket ON tm_material_items(ticket_id);
CREATE INDEX IF NOT EXISTS idx_tm_equipment_ticket ON tm_equipment_items(ticket_id);

ALTER TABLE tm_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE tm_labor_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE tm_material_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE tm_equipment_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_tm_tickets" ON tm_tickets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_tm_labor" ON tm_labor_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_tm_materials" ON tm_material_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_tm_equipment" ON tm_equipment_items FOR ALL USING (true) WITH CHECK (true);

CREATE TRIGGER tm_tickets_updated_at BEFORE UPDATE ON tm_tickets FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Storage bucket for signatures and receipt photos
INSERT INTO storage.buckets (id, name, public) VALUES ('tm-attachments', 'tm-attachments', true) ON CONFLICT (id) DO NOTHING;
CREATE POLICY "allow_all_tm_attachments" ON storage.objects FOR ALL USING (bucket_id = 'tm-attachments') WITH CHECK (bucket_id = 'tm-attachments');
