-- Emergency project data RLS lockdown.
-- Locks old V1 allow-all project policies to the authenticated project owner.

CREATE OR REPLACE FUNCTION public.irontrack_owns_project(project_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.role() = 'service_role'
    OR EXISTS (
      SELECT 1
      FROM public.daily_projects
      WHERE id = project_uuid
        AND user_id = auth.uid()
    );
$$;

GRANT EXECUTE ON FUNCTION public.irontrack_owns_project(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.irontrack_owns_project(uuid) TO service_role;

DO $$
DECLARE
  table_name text;
  policy_name text;
  direct_project_tables text[] := ARRAY[
    'schedule_uploads',
    'parsed_activities',
    'daily_risks',
    'daily_briefs',
    'ready_checks',
    'ready_check_contacts',
    'issue_reports',
    'progress_updates',
    'schedule_snapshots',
    'week_share_links',
    'project_jurisdiction',
    'inspection_requests',
    'toolbox_talks',
    'coordination_meetings',
    'coordination_action_items',
    'project_contacts',
    'directory_join_tokens',
    'submittals',
    'rfis',
    'tm_tickets',
    'punch_items',
    'drawing_sets'
  ];
  nullable_project_tables text[] := ARRAY[
    'toolbox_talk_templates',
    'coordination_meeting_types'
  ];
BEGIN
  ALTER TABLE public.daily_projects ENABLE ROW LEVEL SECURITY;

  FOR policy_name IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'daily_projects'
      AND (
        policyname ILIKE 'allow_all%'
        OR policyname ILIKE 'Allow all%'
        OR policyname = 'allow_all'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.daily_projects', policy_name);
  END LOOP;

  DROP POLICY IF EXISTS project_owner_access ON public.daily_projects;
  CREATE POLICY project_owner_access ON public.daily_projects
    FOR ALL
    USING (auth.role() = 'service_role' OR user_id = auth.uid())
    WITH CHECK (auth.role() = 'service_role' OR user_id = auth.uid());

  FOREACH table_name IN ARRAY direct_project_tables
  LOOP
    IF to_regclass(format('public.%I', table_name)) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);

      FOR policy_name IN
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = table_name
          AND (
            policyname ILIKE 'allow_all%'
            OR policyname ILIKE 'Allow all%'
            OR policyname = 'allow_all'
          )
      LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_name, table_name);
      END LOOP;

      EXECUTE format('DROP POLICY IF EXISTS project_owner_access ON public.%I', table_name);
      EXECUTE format(
        'CREATE POLICY project_owner_access ON public.%I FOR ALL USING (public.irontrack_owns_project(project_id)) WITH CHECK (public.irontrack_owns_project(project_id))',
        table_name
      );
    END IF;
  END LOOP;

  FOREACH table_name IN ARRAY nullable_project_tables
  LOOP
    IF to_regclass(format('public.%I', table_name)) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);

      FOR policy_name IN
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = table_name
          AND (
            policyname ILIKE 'allow_all%'
            OR policyname ILIKE 'Allow all%'
            OR policyname = 'allow_all'
          )
      LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_name, table_name);
      END LOOP;

      EXECUTE format('DROP POLICY IF EXISTS project_owner_or_system_read ON public.%I', table_name);
      EXECUTE format('DROP POLICY IF EXISTS project_owner_write ON public.%I', table_name);
      EXECUTE format('DROP POLICY IF EXISTS project_owner_update ON public.%I', table_name);
      EXECUTE format('DROP POLICY IF EXISTS project_owner_delete ON public.%I', table_name);
      EXECUTE format(
        'CREATE POLICY project_owner_or_system_read ON public.%I FOR SELECT USING (project_id IS NULL OR public.irontrack_owns_project(project_id))',
        table_name
      );
      EXECUTE format(
        'CREATE POLICY project_owner_write ON public.%I FOR INSERT WITH CHECK (public.irontrack_owns_project(project_id))',
        table_name
      );
      EXECUTE format(
        'CREATE POLICY project_owner_update ON public.%I FOR UPDATE USING (public.irontrack_owns_project(project_id)) WITH CHECK (public.irontrack_owns_project(project_id))',
        table_name
      );
      EXECUTE format(
        'CREATE POLICY project_owner_delete ON public.%I FOR DELETE USING (public.irontrack_owns_project(project_id))',
        table_name
      );
    END IF;
  END LOOP;
END
$$;

DO $$
DECLARE
  policy_name text;
BEGIN
  IF to_regclass('public.report_issues') IS NOT NULL THEN
    ALTER TABLE public.report_issues ENABLE ROW LEVEL SECURITY;
    FOR policy_name IN
      SELECT policyname FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'report_issues'
        AND (policyname ILIKE 'allow_all%' OR policyname = 'allow_all')
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.report_issues', policy_name);
    END LOOP;
    DROP POLICY IF EXISTS project_owner_access ON public.report_issues;
    CREATE POLICY project_owner_access ON public.report_issues
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.issue_reports r
          WHERE r.id = report_id
            AND public.irontrack_owns_project(r.project_id)
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.issue_reports r
          WHERE r.id = report_id
            AND public.irontrack_owns_project(r.project_id)
        )
      );
  END IF;

  IF to_regclass('public.coordination_agenda_items') IS NOT NULL THEN
    ALTER TABLE public.coordination_agenda_items ENABLE ROW LEVEL SECURITY;
    FOR policy_name IN
      SELECT policyname FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'coordination_agenda_items'
        AND (policyname ILIKE 'allow_all%' OR policyname = 'allow_all')
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.coordination_agenda_items', policy_name);
    END LOOP;
    DROP POLICY IF EXISTS project_owner_access ON public.coordination_agenda_items;
    CREATE POLICY project_owner_access ON public.coordination_agenda_items
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.coordination_meetings m
          WHERE m.id = meeting_id
            AND public.irontrack_owns_project(m.project_id)
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.coordination_meetings m
          WHERE m.id = meeting_id
            AND public.irontrack_owns_project(m.project_id)
        )
      );
  END IF;

  IF to_regclass('public.coordination_attendees') IS NOT NULL THEN
    ALTER TABLE public.coordination_attendees ENABLE ROW LEVEL SECURITY;
    FOR policy_name IN
      SELECT policyname FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'coordination_attendees'
        AND (policyname ILIKE 'allow_all%' OR policyname = 'allow_all')
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.coordination_attendees', policy_name);
    END LOOP;
    DROP POLICY IF EXISTS project_owner_access ON public.coordination_attendees;
    CREATE POLICY project_owner_access ON public.coordination_attendees
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.coordination_meetings m
          WHERE m.id = meeting_id
            AND public.irontrack_owns_project(m.project_id)
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.coordination_meetings m
          WHERE m.id = meeting_id
            AND public.irontrack_owns_project(m.project_id)
        )
      );
  END IF;

  IF to_regclass('public.toolbox_talk_attendees') IS NOT NULL THEN
    ALTER TABLE public.toolbox_talk_attendees ENABLE ROW LEVEL SECURITY;
    FOR policy_name IN
      SELECT policyname FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'toolbox_talk_attendees'
        AND (policyname ILIKE 'allow_all%' OR policyname = 'allow_all')
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.toolbox_talk_attendees', policy_name);
    END LOOP;
    DROP POLICY IF EXISTS project_owner_access ON public.toolbox_talk_attendees;
    CREATE POLICY project_owner_access ON public.toolbox_talk_attendees
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.toolbox_talks t
          WHERE t.id = talk_id
            AND public.irontrack_owns_project(t.project_id)
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.toolbox_talks t
          WHERE t.id = talk_id
            AND public.irontrack_owns_project(t.project_id)
        )
      );
  END IF;
END
$$;

DO $$
DECLARE
  policy_name text;
BEGIN
  IF to_regclass('public.submittal_revisions') IS NOT NULL THEN
    ALTER TABLE public.submittal_revisions ENABLE ROW LEVEL SECURITY;
    FOR policy_name IN
      SELECT policyname FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'submittal_revisions'
        AND (policyname ILIKE 'allow_all%' OR policyname = 'allow_all')
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.submittal_revisions', policy_name);
    END LOOP;
    DROP POLICY IF EXISTS project_owner_access ON public.submittal_revisions;
    CREATE POLICY project_owner_access ON public.submittal_revisions
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.submittals s
          WHERE s.id = submittal_id
            AND public.irontrack_owns_project(s.project_id)
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.submittals s
          WHERE s.id = submittal_id
            AND public.irontrack_owns_project(s.project_id)
        )
      );
  END IF;

  IF to_regclass('public.rfi_responses') IS NOT NULL THEN
    ALTER TABLE public.rfi_responses ENABLE ROW LEVEL SECURITY;
    FOR policy_name IN
      SELECT policyname FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'rfi_responses'
        AND (policyname ILIKE 'allow_all%' OR policyname = 'allow_all')
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.rfi_responses', policy_name);
    END LOOP;
    DROP POLICY IF EXISTS project_owner_access ON public.rfi_responses;
    CREATE POLICY project_owner_access ON public.rfi_responses
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.rfis r
          WHERE r.id = rfi_id
            AND public.irontrack_owns_project(r.project_id)
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.rfis r
          WHERE r.id = rfi_id
            AND public.irontrack_owns_project(r.project_id)
        )
      );
  END IF;

  IF to_regclass('public.rfi_photos') IS NOT NULL THEN
    ALTER TABLE public.rfi_photos ENABLE ROW LEVEL SECURITY;
    FOR policy_name IN
      SELECT policyname FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'rfi_photos'
        AND (policyname ILIKE 'allow_all%' OR policyname = 'allow_all')
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.rfi_photos', policy_name);
    END LOOP;
    DROP POLICY IF EXISTS project_owner_access ON public.rfi_photos;
    CREATE POLICY project_owner_access ON public.rfi_photos
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.rfis r
          WHERE r.id = rfi_id
            AND public.irontrack_owns_project(r.project_id)
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.rfis r
          WHERE r.id = rfi_id
            AND public.irontrack_owns_project(r.project_id)
        )
      );
  END IF;
END
$$;

DO $$
DECLARE
  policy_name text;
  table_name text;
  ticket_child_tables text[] := ARRAY[
    'tm_labor_items',
    'tm_material_items',
    'tm_equipment_items'
  ];
BEGIN
  FOREACH table_name IN ARRAY ticket_child_tables
  LOOP
    IF to_regclass(format('public.%I', table_name)) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
      FOR policy_name IN
        SELECT policyname FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = table_name
          AND (policyname ILIKE 'allow_all%' OR policyname = 'allow_all')
      LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_name, table_name);
      END LOOP;

      EXECUTE format('DROP POLICY IF EXISTS project_owner_access ON public.%I', table_name);
      EXECUTE format(
        'CREATE POLICY project_owner_access ON public.%I FOR ALL USING (EXISTS (SELECT 1 FROM public.tm_tickets t WHERE t.id = ticket_id AND public.irontrack_owns_project(t.project_id))) WITH CHECK (EXISTS (SELECT 1 FROM public.tm_tickets t WHERE t.id = ticket_id AND public.irontrack_owns_project(t.project_id)))',
        table_name
      );
    END IF;
  END LOOP;
END
$$;

DO $$
DECLARE
  policy_name text;
BEGIN
  IF to_regclass('public.punch_item_photos') IS NOT NULL THEN
    ALTER TABLE public.punch_item_photos ENABLE ROW LEVEL SECURITY;
    FOR policy_name IN
      SELECT policyname FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'punch_item_photos'
        AND (policyname ILIKE 'allow_all%' OR policyname = 'allow_all')
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.punch_item_photos', policy_name);
    END LOOP;
    DROP POLICY IF EXISTS project_owner_access ON public.punch_item_photos;
    CREATE POLICY project_owner_access ON public.punch_item_photos
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.punch_items p
          WHERE p.id = punch_item_id
            AND public.irontrack_owns_project(p.project_id)
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.punch_items p
          WHERE p.id = punch_item_id
            AND public.irontrack_owns_project(p.project_id)
        )
      );
  END IF;

  IF to_regclass('public.drawing_sheets') IS NOT NULL THEN
    ALTER TABLE public.drawing_sheets ENABLE ROW LEVEL SECURITY;
    FOR policy_name IN
      SELECT policyname FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'drawing_sheets'
        AND (policyname ILIKE 'allow_all%' OR policyname = 'allow_all')
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.drawing_sheets', policy_name);
    END LOOP;
    DROP POLICY IF EXISTS project_owner_access ON public.drawing_sheets;
    CREATE POLICY project_owner_access ON public.drawing_sheets
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.drawing_sets d
          WHERE d.id = set_id
            AND public.irontrack_owns_project(d.project_id)
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.drawing_sets d
          WHERE d.id = set_id
            AND public.irontrack_owns_project(d.project_id)
        )
      );
  END IF;

  IF to_regclass('public.drawing_pins') IS NOT NULL THEN
    ALTER TABLE public.drawing_pins ENABLE ROW LEVEL SECURITY;
    FOR policy_name IN
      SELECT policyname FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'drawing_pins'
        AND (policyname ILIKE 'allow_all%' OR policyname = 'allow_all')
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.drawing_pins', policy_name);
    END LOOP;
    DROP POLICY IF EXISTS project_owner_access ON public.drawing_pins;
    CREATE POLICY project_owner_access ON public.drawing_pins
      FOR ALL
      USING (
        EXISTS (
          SELECT 1
          FROM public.drawing_sheets s
          JOIN public.drawing_sets d ON d.id = s.set_id
          WHERE s.id = sheet_id
            AND public.irontrack_owns_project(d.project_id)
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM public.drawing_sheets s
          JOIN public.drawing_sets d ON d.id = s.set_id
          WHERE s.id = sheet_id
            AND public.irontrack_owns_project(d.project_id)
        )
      );
  END IF;
END
$$;
