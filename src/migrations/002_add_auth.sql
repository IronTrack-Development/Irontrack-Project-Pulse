-- Add user_id to daily_projects
ALTER TABLE daily_projects ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Update RLS policies to be user-scoped
DROP POLICY IF EXISTS "allow_all_daily_projects" ON daily_projects;
DROP POLICY IF EXISTS "allow_all_schedule_uploads" ON schedule_uploads;
DROP POLICY IF EXISTS "allow_all_parsed_activities" ON parsed_activities;
DROP POLICY IF EXISTS "allow_all_daily_risks" ON daily_risks;
DROP POLICY IF EXISTS "allow_all_daily_briefs" ON daily_briefs;

CREATE POLICY "users_own_projects" ON daily_projects FOR ALL 
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_own_uploads" ON schedule_uploads FOR ALL
  USING (project_id IN (SELECT id FROM daily_projects WHERE user_id = auth.uid()))
  WITH CHECK (project_id IN (SELECT id FROM daily_projects WHERE user_id = auth.uid()));

CREATE POLICY "users_own_activities" ON parsed_activities FOR ALL
  USING (project_id IN (SELECT id FROM daily_projects WHERE user_id = auth.uid()))
  WITH CHECK (project_id IN (SELECT id FROM daily_projects WHERE user_id = auth.uid()));

CREATE POLICY "users_own_risks" ON daily_risks FOR ALL
  USING (project_id IN (SELECT id FROM daily_projects WHERE user_id = auth.uid()))
  WITH CHECK (project_id IN (SELECT id FROM daily_projects WHERE user_id = auth.uid()));

CREATE POLICY "users_own_briefs" ON daily_briefs FOR ALL
  USING (project_id IN (SELECT id FROM daily_projects WHERE user_id = auth.uid()))
  WITH CHECK (project_id IN (SELECT id FROM daily_projects WHERE user_id = auth.uid()));

-- Also allow service role to bypass (for API routes)
CREATE POLICY "service_role_all_projects" ON daily_projects FOR ALL
  USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "service_role_all_uploads" ON schedule_uploads FOR ALL
  USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "service_role_all_activities" ON parsed_activities FOR ALL
  USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "service_role_all_risks" ON daily_risks FOR ALL
  USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "service_role_all_briefs" ON daily_briefs FOR ALL
  USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
