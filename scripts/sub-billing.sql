-- Migration: sub_companies billing columns
-- Run this in Supabase SQL Editor

ALTER TABLE sub_companies ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'beta';
ALTER TABLE sub_companies ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE sub_companies ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMPTZ;
