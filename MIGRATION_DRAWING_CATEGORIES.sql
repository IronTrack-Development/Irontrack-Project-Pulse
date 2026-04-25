-- Migration: Drawing Categories for Manual Sheet Organization
-- Run this in Supabase Dashboard > SQL Editor
-- https://app.supabase.com/project/cftckycnvxntldxnbiee/sql/new

-- 1. Custom categories per drawing set
CREATE TABLE IF NOT EXISTS drawing_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  set_id UUID NOT NULL REFERENCES drawing_sets(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  discipline TEXT DEFAULT 'other',
  sort_order INTEGER DEFAULT 0,
  color TEXT DEFAULT '#6B7280'
);

CREATE INDEX IF NOT EXISTS idx_drawing_categories_set ON drawing_categories(set_id);

ALTER TABLE drawing_categories ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename='drawing_categories' 
    AND policyname='allow_all_drawing_categories'
  ) THEN
    CREATE POLICY "allow_all_drawing_categories" 
      ON drawing_categories FOR ALL 
      USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 2. Add category reference to drawing_sheets
ALTER TABLE drawing_sheets ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES drawing_categories(id);
ALTER TABLE drawing_sheets ADD COLUMN IF NOT EXISTS custom_category TEXT;
