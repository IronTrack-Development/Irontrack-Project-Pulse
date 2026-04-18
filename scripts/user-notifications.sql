-- Migration: user_notifications table
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS user_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_notifications_owner" ON user_notifications
  FOR ALL USING (user_id = auth.uid());

CREATE INDEX idx_user_notifications_user ON user_notifications(user_id, read, created_at DESC);
