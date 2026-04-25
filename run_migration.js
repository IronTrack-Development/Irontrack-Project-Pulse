const fs = require('fs');

const SUPABASE_URL = 'https://cftckycnvxntldxnbiee.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmdGNreWNudnhudGxkeG5iaWVlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDc5OTcwOCwiZXhwIjoyMDkwMzc1NzA4fQ.kv5YzKr5NFX12pr2lZOLbMUbaVSOYQtT2M4eE7p05E8';

async function execSql(sql) {
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'apikey': KEY,
      'Authorization': `Bearer ${KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify({ sql_text: sql }),
  });
  const text = await resp.text();
  if (!resp.ok) {
    throw new Error(`SQL failed (${resp.status}): ${text}`);
  }
  return text;
}

async function createBucket() {
  // Use Supabase Storage API to create bucket
  const resp = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
    method: 'POST',
    headers: {
      'apikey': KEY,
      'Authorization': `Bearer ${KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id: 'drawings', name: 'drawings', public: true }),
  });
  const text = await resp.text();
  if (!resp.ok && !text.includes('already exists') && !text.includes('Duplicate')) {
    console.warn('Bucket creation result:', resp.status, text);
  } else {
    console.log('Bucket OK:', text);
  }
}

async function run() {
  // Step 1: Core tables, indexes, RLS
  const coreSql = `
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
`;

  console.log('Running core migration...');
  await execSql(coreSql);
  console.log('Core migration done!');

  // Step 2: Storage bucket via Storage API
  console.log('Creating storage bucket...');
  await createBucket();
  
  console.log('Migration complete!');
}

run().catch(err => {
  console.error('Migration error:', err.message);
  process.exit(1);
});
