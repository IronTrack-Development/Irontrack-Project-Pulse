-- Migration 021: Sub Ops — Subcontractor Field Operations
-- Manages sub companies, foremen, dispatches, check-ins, production logs, blockers, and SOPs

-- ═══════════════════════════════════════════════════════════
-- Tables
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS sub_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  trade TEXT,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  logo_path TEXT,
  company_code TEXT UNIQUE,
  stripe_customer_id TEXT,
  subscription_status TEXT DEFAULT 'inactive',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sub_foremen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES sub_companies(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  trade TEXT,
  certifications TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  avatar_path TEXT,
  hire_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sub_dispatches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES sub_companies(id) ON DELETE CASCADE,
  foreman_id UUID NOT NULL REFERENCES sub_foremen(id) ON DELETE CASCADE,
  project_name TEXT NOT NULL,
  project_location TEXT,
  dispatch_date DATE NOT NULL,
  scope_of_work TEXT NOT NULL,
  priority_notes TEXT,
  safety_focus TEXT,
  material_notes TEXT,
  special_instructions TEXT,
  expected_crew_size INTEGER,
  expected_hours NUMERIC,
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'acknowledged', 'in_progress', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sub_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispatch_id UUID REFERENCES sub_dispatches(id) ON DELETE SET NULL,
  foreman_id UUID NOT NULL REFERENCES sub_foremen(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES sub_companies(id) ON DELETE CASCADE,
  checkin_date DATE NOT NULL,
  checkin_time TIMESTAMPTZ DEFAULT NOW(),
  crew_count INTEGER,
  crew_hours NUMERIC,
  on_site BOOLEAN DEFAULT true,
  site_photo_path TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sub_production_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checkin_id UUID REFERENCES sub_checkins(id) ON DELETE CASCADE,
  foreman_id UUID NOT NULL REFERENCES sub_foremen(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES sub_companies(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  description TEXT NOT NULL,
  quantity NUMERIC,
  unit TEXT,
  estimated_quantity NUMERIC,
  estimated_unit TEXT,
  photo_path TEXT,
  area TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sub_blockers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  foreman_id UUID NOT NULL REFERENCES sub_foremen(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES sub_companies(id) ON DELETE CASCADE,
  dispatch_id UUID REFERENCES sub_dispatches(id) ON DELETE SET NULL,
  blocker_date DATE NOT NULL,
  category TEXT DEFAULT 'other' CHECK (category IN ('material', 'gc_delay', 'weather', 'manpower', 'equipment', 'drawing', 'inspection', 'access', 'other')),
  description TEXT NOT NULL,
  impact TEXT,
  photo_path TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sub_sops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES sub_companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT DEFAULT 'general' CHECK (category IN ('safety', 'quality', 'install_procedure', 'company_policy', 'equipment', 'training', 'general')),
  description TEXT,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sub_sop_acknowledgments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sop_id UUID NOT NULL REFERENCES sub_sops(id) ON DELETE CASCADE,
  foreman_id UUID NOT NULL REFERENCES sub_foremen(id) ON DELETE CASCADE,
  acknowledged_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(sop_id, foreman_id)
);

CREATE TABLE IF NOT EXISTS sub_dispatch_sops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispatch_id UUID NOT NULL REFERENCES sub_dispatches(id) ON DELETE CASCADE,
  sop_id UUID NOT NULL REFERENCES sub_sops(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(dispatch_id, sop_id)
);

-- ═══════════════════════════════════════════════════════════
-- Indexes
-- ═══════════════════════════════════════════════════════════

CREATE INDEX idx_sub_foremen_company ON sub_foremen(company_id);
CREATE INDEX idx_sub_dispatches_company_date ON sub_dispatches(company_id, dispatch_date DESC);
CREATE INDEX idx_sub_dispatches_foreman_date ON sub_dispatches(foreman_id, dispatch_date DESC);
CREATE INDEX idx_sub_checkins_foreman_date ON sub_checkins(foreman_id, checkin_date DESC);
CREATE INDEX idx_sub_checkins_company_date ON sub_checkins(company_id, checkin_date DESC);
CREATE INDEX idx_sub_production_company ON sub_production_logs(company_id, log_date DESC);
CREATE INDEX idx_sub_blockers_company ON sub_blockers(company_id, status);
CREATE INDEX idx_sub_sops_company ON sub_sops(company_id, category);
CREATE INDEX idx_sub_sop_acks_sop ON sub_sop_acknowledgments(sop_id);
CREATE INDEX idx_sub_sop_acks_foreman ON sub_sop_acknowledgments(foreman_id);

-- ═══════════════════════════════════════════════════════════
-- Row Level Security (V1 — open access)
-- ═══════════════════════════════════════════════════════════

ALTER TABLE sub_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE sub_foremen ENABLE ROW LEVEL SECURITY;
ALTER TABLE sub_dispatches ENABLE ROW LEVEL SECURITY;
ALTER TABLE sub_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE sub_production_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sub_blockers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sub_sops ENABLE ROW LEVEL SECURITY;
ALTER TABLE sub_sop_acknowledgments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sub_dispatch_sops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all" ON sub_companies FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON sub_foremen FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON sub_dispatches FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON sub_checkins FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON sub_production_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON sub_blockers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON sub_sops FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON sub_sop_acknowledgments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON sub_dispatch_sops FOR ALL USING (true) WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════
-- Triggers (updated_at)
-- ═══════════════════════════════════════════════════════════

CREATE TRIGGER sub_companies_updated_at BEFORE UPDATE ON sub_companies FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER sub_foremen_updated_at BEFORE UPDATE ON sub_foremen FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER sub_dispatches_updated_at BEFORE UPDATE ON sub_dispatches FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER sub_blockers_updated_at BEFORE UPDATE ON sub_blockers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER sub_sops_updated_at BEFORE UPDATE ON sub_sops FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ═══════════════════════════════════════════════════════════
-- Storage Buckets
-- ═══════════════════════════════════════════════════════════

INSERT INTO storage.buckets (id, name, public) VALUES ('sub-checkin-photos', 'sub-checkin-photos', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('sub-production-photos', 'sub-production-photos', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('sub-sop-files', 'sub-sop-files', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('sub-blocker-photos', 'sub-blocker-photos', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "allow_all_sub_checkin_uploads" ON storage.objects FOR ALL USING (bucket_id = 'sub-checkin-photos') WITH CHECK (bucket_id = 'sub-checkin-photos');
CREATE POLICY "allow_all_sub_production_uploads" ON storage.objects FOR ALL USING (bucket_id = 'sub-production-photos') WITH CHECK (bucket_id = 'sub-production-photos');
CREATE POLICY "allow_all_sub_sop_uploads" ON storage.objects FOR ALL USING (bucket_id = 'sub-sop-files') WITH CHECK (bucket_id = 'sub-sop-files');
CREATE POLICY "allow_all_sub_blocker_uploads" ON storage.objects FOR ALL USING (bucket_id = 'sub-blocker-photos') WITH CHECK (bucket_id = 'sub-blocker-photos');
