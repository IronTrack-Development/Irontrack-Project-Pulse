-- Company-wide contacts directory
CREATE TABLE IF NOT EXISTS company_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  company TEXT,
  email TEXT,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN ('architect', 'engineer', 'subcontractor', 'supplier', 'owner', 'owners_rep', 'inspector', 'internal', 'other')),
  trade TEXT,  -- for subs: electrical, plumbing, HVAC, etc
  discipline TEXT,  -- for engineers: structural, MEP, civil, etc
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_via TEXT DEFAULT 'manual' CHECK (created_via IN ('manual', 'qr_join', 'import'))
);

-- Per-project contact assignments
CREATE TABLE IF NOT EXISTS project_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES daily_projects(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES company_contacts(id) ON DELETE CASCADE,
  role_on_project TEXT,  -- can differ from their company role
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  joined_at TIMESTAMPTZ,
  invite_token TEXT UNIQUE,
  UNIQUE(project_id, contact_id)
);

-- QR/link join tokens for projects
CREATE TABLE IF NOT EXISTS directory_join_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES daily_projects(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_company_contacts_email ON company_contacts(email);
CREATE INDEX IF NOT EXISTS idx_project_contacts_project ON project_contacts(project_id);
CREATE INDEX IF NOT EXISTS idx_project_contacts_contact ON project_contacts(contact_id);
CREATE INDEX IF NOT EXISTS idx_directory_join_tokens_token ON directory_join_tokens(token);

-- RLS
ALTER TABLE company_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE directory_join_tokens ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'company_contacts' AND policyname = 'allow_all_company_contacts'
  ) THEN
    CREATE POLICY "allow_all_company_contacts" ON company_contacts FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'project_contacts' AND policyname = 'allow_all_project_contacts'
  ) THEN
    CREATE POLICY "allow_all_project_contacts" ON project_contacts FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'directory_join_tokens' AND policyname = 'allow_all_directory_join_tokens'
  ) THEN
    CREATE POLICY "allow_all_directory_join_tokens" ON directory_join_tokens FOR ALL USING (true) WITH CHECK (true);
  END IF;
END
$$;

-- updated_at trigger
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'company_contacts_updated_at'
  ) THEN
    CREATE TRIGGER company_contacts_updated_at
      BEFORE UPDATE ON company_contacts
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END
$$;
