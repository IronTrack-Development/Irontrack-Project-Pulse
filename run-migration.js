const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://cftckycnvxntldxnbiee.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmdGNreWNudnhudGxkeG5iaWVlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDc5OTcwOCwiZXhwIjoyMDkwMzc1NzA4fQ.kv5YzKr5NFX12pr2lZOLbMUbaVSOYQtT2M4eE7p05E8';

async function execSQL(sql) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'apikey': KEY,
      'Authorization': `Bearer ${KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify({ sql_text: sql }),
  });
  const text = await response.text();
  return { status: response.status, body: text };
}

async function createBucket() {
  // Use the storage API directly
  const response = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
    method: 'POST',
    headers: {
      'apikey': KEY,
      'Authorization': `Bearer ${KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id: 'rfi-photos', name: 'rfi-photos', public: true }),
  });
  const text = await response.text();
  return { status: response.status, body: text };
}

async function main() {
  // Part 1: Tables, indexes, RLS policies, trigger
  const tableSql = `
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

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'rfis' AND policyname = 'allow_all_rfis') THEN
    CREATE POLICY "allow_all_rfis" ON rfis FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'rfi_responses' AND policyname = 'allow_all_rfi_responses') THEN
    CREATE POLICY "allow_all_rfi_responses" ON rfi_responses FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'rfi_photos' AND policyname = 'allow_all_rfi_photos') THEN
    CREATE POLICY "allow_all_rfi_photos" ON rfi_photos FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'rfis_updated_at') THEN
    CREATE TRIGGER rfis_updated_at
      BEFORE UPDATE ON rfis
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;
`;

  console.log('Running table migration...');
  const r1 = await execSQL(tableSql);
  console.log('Tables:', r1.status, r1.body || '(empty - success)');

  // Part 2: Create storage bucket via Storage API
  console.log('Creating storage bucket...');
  const r2 = await createBucket();
  console.log('Bucket:', r2.status, r2.body);
}

main().catch(console.error);
