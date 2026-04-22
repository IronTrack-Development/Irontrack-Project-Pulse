-- Migration 010: Week Share Links (QR code shareable lookaheads)

CREATE TABLE IF NOT EXISTS week_share_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES daily_projects(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  week_number INTEGER NOT NULL DEFAULT 1,  -- 1, 2, or 3
  active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_week_share_links_token ON week_share_links(token);
CREATE INDEX IF NOT EXISTS idx_week_share_links_project ON week_share_links(project_id);

ALTER TABLE week_share_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_week_share_links" ON week_share_links FOR ALL USING (true) WITH CHECK (true);
