-- Emergency RLS lockdown for pre-launch security hardening.
-- Focused on the live leakage areas discovered during rollout QA:
--   1. Sub Ops / sub_companies and related company-scoped tables
--   2. Daily log tables, which still allowed open reads
--   3. Ready checks, which still allowed open reads

-- Ensure the ownership column exists for sub company authorization.
ALTER TABLE sub_companies
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_sub_companies_user_id ON sub_companies(user_id);

-- ---------------------------------------------------------------------------
-- Sub companies and sub-ops core tables
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "allow_all" ON sub_companies;
DROP POLICY IF EXISTS "sub_companies_owner_select" ON sub_companies;
DROP POLICY IF EXISTS "sub_companies_owner_update" ON sub_companies;
DROP POLICY IF EXISTS "sub_companies_insert" ON sub_companies;

CREATE POLICY "sub_companies_owner_select" ON sub_companies
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "sub_companies_owner_insert" ON sub_companies
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "sub_companies_owner_update" ON sub_companies
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "sub_companies_owner_delete" ON sub_companies
  FOR DELETE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "allow_all" ON sub_foremen;
CREATE POLICY "sub_foremen_company_owner" ON sub_foremen
  FOR ALL USING (
    company_id IN (SELECT id FROM sub_companies WHERE user_id = auth.uid())
  )
  WITH CHECK (
    company_id IN (SELECT id FROM sub_companies WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "allow_all" ON sub_dispatches;
CREATE POLICY "sub_dispatches_company_owner" ON sub_dispatches
  FOR ALL USING (
    company_id IN (SELECT id FROM sub_companies WHERE user_id = auth.uid())
  )
  WITH CHECK (
    company_id IN (SELECT id FROM sub_companies WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "allow_all" ON sub_checkins;
CREATE POLICY "sub_checkins_company_owner" ON sub_checkins
  FOR ALL USING (
    company_id IN (SELECT id FROM sub_companies WHERE user_id = auth.uid())
  )
  WITH CHECK (
    company_id IN (SELECT id FROM sub_companies WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "allow_all" ON sub_production_logs;
CREATE POLICY "sub_production_logs_company_owner" ON sub_production_logs
  FOR ALL USING (
    company_id IN (SELECT id FROM sub_companies WHERE user_id = auth.uid())
  )
  WITH CHECK (
    company_id IN (SELECT id FROM sub_companies WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "allow_all" ON sub_blockers;
CREATE POLICY "sub_blockers_company_owner" ON sub_blockers
  FOR ALL USING (
    company_id IN (SELECT id FROM sub_companies WHERE user_id = auth.uid())
  )
  WITH CHECK (
    company_id IN (SELECT id FROM sub_companies WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "allow_all" ON sub_sops;
CREATE POLICY "sub_sops_company_owner" ON sub_sops
  FOR ALL USING (
    company_id IN (SELECT id FROM sub_companies WHERE user_id = auth.uid())
  )
  WITH CHECK (
    company_id IN (SELECT id FROM sub_companies WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "allow_all" ON sub_sop_acknowledgments;
CREATE POLICY "sub_sop_acknowledgments_company_owner" ON sub_sop_acknowledgments
  FOR ALL USING (
    sop_id IN (
      SELECT id FROM sub_sops
      WHERE company_id IN (SELECT id FROM sub_companies WHERE user_id = auth.uid())
    )
  )
  WITH CHECK (
    sop_id IN (
      SELECT id FROM sub_sops
      WHERE company_id IN (SELECT id FROM sub_companies WHERE user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "allow_all" ON sub_dispatch_sops;
CREATE POLICY "sub_dispatch_sops_company_owner" ON sub_dispatch_sops
  FOR ALL USING (
    dispatch_id IN (
      SELECT id FROM sub_dispatches
      WHERE company_id IN (SELECT id FROM sub_companies WHERE user_id = auth.uid())
    )
  )
  WITH CHECK (
    dispatch_id IN (
      SELECT id FROM sub_dispatches
      WHERE company_id IN (SELECT id FROM sub_companies WHERE user_id = auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- Handoff tracker tables
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "allow_all" ON sub_departments;
CREATE POLICY "sub_departments_company_owner" ON sub_departments
  FOR ALL USING (
    company_id IN (SELECT id FROM sub_companies WHERE user_id = auth.uid())
  )
  WITH CHECK (
    company_id IN (SELECT id FROM sub_companies WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "allow_all" ON sub_crew_members;
CREATE POLICY "sub_crew_members_company_owner" ON sub_crew_members
  FOR ALL USING (
    company_id IN (SELECT id FROM sub_companies WHERE user_id = auth.uid())
  )
  WITH CHECK (
    company_id IN (SELECT id FROM sub_companies WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "allow_all" ON sub_handoff_areas;
CREATE POLICY "sub_handoff_areas_company_owner" ON sub_handoff_areas
  FOR ALL USING (
    company_id IN (SELECT id FROM sub_companies WHERE user_id = auth.uid())
  )
  WITH CHECK (
    company_id IN (SELECT id FROM sub_companies WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "allow_all" ON sub_handoffs;
CREATE POLICY "sub_handoffs_company_owner" ON sub_handoffs
  FOR ALL USING (
    company_id IN (SELECT id FROM sub_companies WHERE user_id = auth.uid())
  )
  WITH CHECK (
    company_id IN (SELECT id FROM sub_companies WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "allow_all" ON sub_handoff_checklist_templates;
CREATE POLICY "sub_handoff_checklist_templates_company_owner" ON sub_handoff_checklist_templates
  FOR ALL USING (
    company_id IN (SELECT id FROM sub_companies WHERE user_id = auth.uid())
  )
  WITH CHECK (
    company_id IN (SELECT id FROM sub_companies WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "allow_all" ON sub_handoff_checklist_items;
CREATE POLICY "sub_handoff_checklist_items_company_owner" ON sub_handoff_checklist_items
  FOR ALL USING (
    handoff_id IN (
      SELECT id FROM sub_handoffs
      WHERE company_id IN (SELECT id FROM sub_companies WHERE user_id = auth.uid())
    )
  )
  WITH CHECK (
    handoff_id IN (
      SELECT id FROM sub_handoffs
      WHERE company_id IN (SELECT id FROM sub_companies WHERE user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "allow_all" ON sub_handoff_photos;
CREATE POLICY "sub_handoff_photos_company_owner" ON sub_handoff_photos
  FOR ALL USING (
    handoff_id IN (
      SELECT id FROM sub_handoffs
      WHERE company_id IN (SELECT id FROM sub_companies WHERE user_id = auth.uid())
    )
  )
  WITH CHECK (
    handoff_id IN (
      SELECT id FROM sub_handoffs
      WHERE company_id IN (SELECT id FROM sub_companies WHERE user_id = auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- Daily logs
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "allow_all_daily_logs" ON daily_logs;
CREATE POLICY "daily_logs_owner" ON daily_logs
  FOR ALL USING (
    project_id IN (SELECT id FROM daily_projects WHERE user_id = auth.uid())
  )
  WITH CHECK (
    project_id IN (SELECT id FROM daily_projects WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "allow_all_daily_log_progress" ON daily_log_progress;
CREATE POLICY "daily_log_progress_owner" ON daily_log_progress
  FOR ALL USING (
    daily_log_id IN (
      SELECT id FROM daily_logs
      WHERE project_id IN (SELECT id FROM daily_projects WHERE user_id = auth.uid())
    )
  )
  WITH CHECK (
    daily_log_id IN (
      SELECT id FROM daily_logs
      WHERE project_id IN (SELECT id FROM daily_projects WHERE user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "allow_all_daily_log_photos" ON daily_log_photos;
CREATE POLICY "daily_log_photos_owner" ON daily_log_photos
  FOR ALL USING (
    daily_log_id IN (
      SELECT id FROM daily_logs
      WHERE project_id IN (SELECT id FROM daily_projects WHERE user_id = auth.uid())
    )
  )
  WITH CHECK (
    daily_log_id IN (
      SELECT id FROM daily_logs
      WHERE project_id IN (SELECT id FROM daily_projects WHERE user_id = auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- Ready checks
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "allow_all_ready_checks" ON ready_checks;
CREATE POLICY "ready_checks_owner" ON ready_checks
  FOR ALL USING (
    project_id IN (SELECT id FROM daily_projects WHERE user_id = auth.uid())
  )
  WITH CHECK (
    project_id IN (SELECT id FROM daily_projects WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "allow_all_ready_check_contacts" ON ready_check_contacts;
CREATE POLICY "ready_check_contacts_owner" ON ready_check_contacts
  FOR ALL USING (
    project_id IN (SELECT id FROM daily_projects WHERE user_id = auth.uid())
  )
  WITH CHECK (
    project_id IN (SELECT id FROM daily_projects WHERE user_id = auth.uid())
  );
