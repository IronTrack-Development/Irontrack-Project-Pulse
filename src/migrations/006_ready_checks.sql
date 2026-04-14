-- Ready Check contacts (reusable per project per trade)
CREATE TABLE IF NOT EXISTS ready_check_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES daily_projects(id) ON DELETE CASCADE,
  user_id UUID,
  trade TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  company TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ready Checks (the actual mobilization requests)
CREATE TABLE IF NOT EXISTS ready_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES daily_projects(id) ON DELETE CASCADE,
  activity_id UUID REFERENCES parsed_activities(id) ON DELETE SET NULL,
  user_id UUID,

  -- Contact info (snapshot at time of send)
  contact_id UUID REFERENCES ready_check_contacts(id),
  contact_name TEXT NOT NULL,
  contact_company TEXT,
  contact_phone TEXT,
  contact_email TEXT,

  -- Activity snapshot
  activity_name TEXT NOT NULL,
  trade TEXT,
  start_date DATE,
  normalized_building TEXT,

  -- Check details
  check_type TEXT NOT NULL DEFAULT 'standard',  -- 'standard', 'critical_path', 'friendly_reminder'
  message_text TEXT NOT NULL,
  send_method TEXT,  -- 'sms', 'email', 'copy', null if not yet sent

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'draft',  -- 'draft', 'sent', 'awaiting_response', 'confirmed', 'no_response', 'issue_flagged'
  sent_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  response_notes TEXT,

  -- Follow-up tracking
  follow_up_count INTEGER DEFAULT 0,
  last_follow_up_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ready_checks_project ON ready_checks(project_id);
CREATE INDEX IF NOT EXISTS idx_ready_checks_activity ON ready_checks(activity_id);
CREATE INDEX IF NOT EXISTS idx_ready_checks_status ON ready_checks(status);
CREATE INDEX IF NOT EXISTS idx_ready_check_contacts_project ON ready_check_contacts(project_id, trade);

-- RLS
ALTER TABLE ready_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE ready_check_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_ready_checks" ON ready_checks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_ready_check_contacts" ON ready_check_contacts FOR ALL USING (true) WITH CHECK (true);

-- Updated_at trigger
CREATE TRIGGER ready_checks_updated_at BEFORE UPDATE ON ready_checks FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER ready_check_contacts_updated_at BEFORE UPDATE ON ready_check_contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
