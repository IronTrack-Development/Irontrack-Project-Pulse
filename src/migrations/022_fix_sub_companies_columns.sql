-- Migration 022: Fix sub_companies column names + add missing Stripe columns
-- Fixes mismatch between migration 021 (column: name) and application code (column: company_name)
-- Also adds stripe_customer_id, subscription_status, and company_code columns

-- Rename 'name' to 'company_name' if it exists as 'name'
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sub_companies' AND column_name = 'name'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sub_companies' AND column_name = 'company_name'
  ) THEN
    ALTER TABLE sub_companies RENAME COLUMN name TO company_name;
  END IF;
END $$;

-- Add stripe_customer_id if missing
ALTER TABLE sub_companies ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Add subscription_status if missing
ALTER TABLE sub_companies ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive';

-- Add company_code if missing
ALTER TABLE sub_companies ADD COLUMN IF NOT EXISTS company_code TEXT UNIQUE;

-- Add check constraint on subscription_status (safe to add — will fail silently if exists)
DO $$
BEGIN
  ALTER TABLE sub_companies ADD CONSTRAINT sub_companies_subscription_status_check
    CHECK (subscription_status IN ('inactive', 'active', 'past_due', 'cancelled'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create index on stripe_customer_id for webhook lookups
CREATE INDEX IF NOT EXISTS idx_sub_companies_stripe_customer ON sub_companies(stripe_customer_id);

-- Create index on company_code for join lookups
CREATE INDEX IF NOT EXISTS idx_sub_companies_code ON sub_companies(company_code);
