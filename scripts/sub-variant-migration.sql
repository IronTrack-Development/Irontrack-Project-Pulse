-- ============================================================
-- IronTrack Project Pulse — Sub Variant Migration
-- Date: 2026-04-16
-- Run this in Supabase SQL Editor (or via CLI migration)
-- ============================================================

-- ---------------------------------------------------------------
-- Table: project_subs
-- Subcontractor companies assigned to a project, with their trades
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS project_subs (
  id             UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id     UUID        NOT NULL REFERENCES daily_projects(id) ON DELETE CASCADE,
  sub_name       TEXT        NOT NULL,
  contact_name   TEXT,
  contact_phone  TEXT,
  contact_email  TEXT,
  trades         TEXT[]      NOT NULL DEFAULT '{}', -- trade names matching inferTrade() output
  notes          TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, sub_name)
);

-- Automatically update updated_at on row change
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER project_subs_updated_at
  BEFORE UPDATE ON project_subs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ---------------------------------------------------------------
-- Table: sub_share_links
-- Unique share links for sub schedule views (token-based, no login)
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sub_share_links (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id  UUID        NOT NULL REFERENCES daily_projects(id) ON DELETE CASCADE,
  sub_id      UUID        NOT NULL REFERENCES project_subs(id) ON DELETE CASCADE,
  token       TEXT        UNIQUE NOT NULL,    -- URL-safe random token
  label       TEXT,                            -- optional human label ("Sent 2026-04-16")
  created_by  TEXT,                            -- user email/id who generated it
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  expires_at  TIMESTAMPTZ,                     -- NULL = never expires
  active      BOOLEAN     DEFAULT TRUE         -- set false to revoke
);

-- ---------------------------------------------------------------
-- Table: sub_schedule_views
-- Every time the sub link is opened or acknowledged
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sub_schedule_views (
  id                      UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  link_id                 UUID        NOT NULL REFERENCES sub_share_links(id) ON DELETE CASCADE,
  viewed_at               TIMESTAMPTZ DEFAULT NOW(),
  viewer_ip               TEXT,
  user_agent              TEXT,
  acknowledged            BOOLEAN     DEFAULT FALSE,
  acknowledged_by         TEXT,        -- name the sub typed in
  acknowledged_at         TIMESTAMPTZ,
  view_duration_seconds   INTEGER      -- optional, set via client ping
);

-- ============================================================
-- INDEXES — frequently queried columns
-- ============================================================

-- project_subs lookups
CREATE INDEX IF NOT EXISTS idx_project_subs_project_id    ON project_subs(project_id);
CREATE INDEX IF NOT EXISTS idx_project_subs_trades        ON project_subs USING GIN(trades);

-- sub_share_links lookups
CREATE INDEX IF NOT EXISTS idx_sub_share_links_token      ON sub_share_links(token);
CREATE INDEX IF NOT EXISTS idx_sub_share_links_project_id ON sub_share_links(project_id);
CREATE INDEX IF NOT EXISTS idx_sub_share_links_sub_id     ON sub_share_links(sub_id);
CREATE INDEX IF NOT EXISTS idx_sub_share_links_active     ON sub_share_links(active) WHERE active = TRUE;

-- sub_schedule_views lookups
CREATE INDEX IF NOT EXISTS idx_sub_schedule_views_link_id      ON sub_schedule_views(link_id);
CREATE INDEX IF NOT EXISTS idx_sub_schedule_views_acknowledged ON sub_schedule_views(acknowledged) WHERE acknowledged = TRUE;
CREATE INDEX IF NOT EXISTS idx_sub_schedule_views_viewed_at    ON sub_schedule_views(viewed_at DESC);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE project_subs         ENABLE ROW LEVEL SECURITY;
ALTER TABLE sub_share_links      ENABLE ROW LEVEL SECURITY;
ALTER TABLE sub_schedule_views   ENABLE ROW LEVEL SECURITY;

-- NOTE: The app uses the service role key (bypasses RLS) for all server-side
-- queries. These policies protect direct/client-side access to the tables.

-- project_subs: only the project owner can read/write
-- We join through daily_projects which has a user_id column
CREATE POLICY "project_subs_owner_select" ON project_subs
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM daily_projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "project_subs_owner_insert" ON project_subs
  FOR INSERT WITH CHECK (
    project_id IN (
      SELECT id FROM daily_projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "project_subs_owner_update" ON project_subs
  FOR UPDATE USING (
    project_id IN (
      SELECT id FROM daily_projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "project_subs_owner_delete" ON project_subs
  FOR DELETE USING (
    project_id IN (
      SELECT id FROM daily_projects WHERE user_id = auth.uid()
    )
  );

-- sub_share_links: only the project owner can read/write
CREATE POLICY "sub_share_links_owner_select" ON sub_share_links
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM daily_projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "sub_share_links_owner_insert" ON sub_share_links
  FOR INSERT WITH CHECK (
    project_id IN (
      SELECT id FROM daily_projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "sub_share_links_owner_update" ON sub_share_links
  FOR UPDATE USING (
    project_id IN (
      SELECT id FROM daily_projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "sub_share_links_owner_delete" ON sub_share_links
  FOR DELETE USING (
    project_id IN (
      SELECT id FROM daily_projects WHERE user_id = auth.uid()
    )
  );

-- sub_schedule_views: only the project owner can read; public inserts allowed
-- (public inserts are restricted to the API which uses service role)
CREATE POLICY "sub_schedule_views_owner_select" ON sub_schedule_views
  FOR SELECT USING (
    link_id IN (
      SELECT ssl.id FROM sub_share_links ssl
      JOIN daily_projects dp ON dp.id = ssl.project_id
      WHERE dp.user_id = auth.uid()
    )
  );

-- Allow anon insert for public acknowledge flow
-- (The API validates the token before inserting, using service role)
CREATE POLICY "sub_schedule_views_anon_insert" ON sub_schedule_views
  FOR INSERT WITH CHECK (TRUE);
