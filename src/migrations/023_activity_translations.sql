-- Migration 023: Activity Translations Cache + API Usage Tracking
-- Supports AI-powered activity name translation with $5/month spending cap

CREATE TABLE IF NOT EXISTS activity_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_text TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'es',
  translated_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(original_text, language)
);

CREATE INDEX IF NOT EXISTS idx_activity_translations_lookup
  ON activity_translations(original_text, language);

ALTER TABLE activity_translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_activity_translations"
  ON activity_translations FOR ALL
  USING (true) WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS api_usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service TEXT NOT NULL DEFAULT 'anthropic',
  month TEXT NOT NULL,                         -- e.g. '2026-04'
  total_input_tokens BIGINT DEFAULT 0,
  total_output_tokens BIGINT DEFAULT 0,
  estimated_cost_cents INTEGER DEFAULT 0,      -- integer cents ($5 cap = 500)
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(service, month)
);

ALTER TABLE api_usage_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_api_usage"
  ON api_usage_tracking FOR ALL
  USING (true) WITH CHECK (true);
