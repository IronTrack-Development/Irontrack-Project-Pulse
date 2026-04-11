-- 004_upload_limits.sql
-- Add upload tracking and storage quotas for rate limiting

-- Track daily uploads per user
CREATE TABLE IF NOT EXISTS user_uploads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  upload_date DATE NOT NULL DEFAULT CURRENT_DATE,
  upload_count INTEGER NOT NULL DEFAULT 1,
  total_size_bytes BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, upload_date)
);

-- Track total storage per user
CREATE TABLE IF NOT EXISTS user_storage (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_bytes BIGINT NOT NULL DEFAULT 0,
  file_count INTEGER NOT NULL DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_user_uploads_user_date ON user_uploads(user_id, upload_date);

-- Enable RLS
ALTER TABLE user_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_storage ENABLE ROW LEVEL SECURITY;

-- RLS policies (users can only see their own data)
CREATE POLICY "Users can view own upload stats" ON user_uploads
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own storage stats" ON user_storage
  FOR SELECT USING (auth.uid() = user_id);

-- Function to increment daily uploads
CREATE OR REPLACE FUNCTION increment_daily_uploads(p_user_id UUID, p_file_size BIGINT)
RETURNS VOID AS $$
BEGIN
  INSERT INTO user_uploads (user_id, upload_date, upload_count, total_size_bytes)
  VALUES (p_user_id, CURRENT_DATE, 1, p_file_size)
  ON CONFLICT (user_id, upload_date)
  DO UPDATE SET
    upload_count = user_uploads.upload_count + 1,
    total_size_bytes = user_uploads.total_size_bytes + p_file_size;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment user storage
CREATE OR REPLACE FUNCTION increment_user_storage(p_user_id UUID, p_file_size BIGINT)
RETURNS VOID AS $$
BEGIN
  INSERT INTO user_storage (user_id, total_bytes, file_count, last_updated)
  VALUES (p_user_id, p_file_size, 1, NOW())
  ON CONFLICT (user_id)
  DO UPDATE SET
    total_bytes = user_storage.total_bytes + p_file_size,
    file_count = user_storage.file_count + 1,
    last_updated = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrement user storage (for deletions)
CREATE OR REPLACE FUNCTION decrement_user_storage(p_user_id UUID, p_file_size BIGINT)
RETURNS VOID AS $$
BEGIN
  UPDATE user_storage
  SET
    total_bytes = GREATEST(0, total_bytes - p_file_size),
    file_count = GREATEST(0, file_count - 1),
    last_updated = NOW()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
