-- RLS Policies for app_notifications and device_tokens tables
-- Tables are created in migration 011, so we wrap everything in DO blocks

-- =====================================================
-- app_notifications table
-- =====================================================
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'app_notifications') THEN
    ALTER TABLE app_notifications ENABLE ROW LEVEL SECURITY;

    -- Users can read their own notifications
    DROP POLICY IF EXISTS "Users can read own notifications" ON app_notifications;
    CREATE POLICY "Users can read own notifications" ON app_notifications
      FOR SELECT USING (
        user_id = auth.uid()::text
        OR user_id = 'vigilante'
        OR user_id = 'admin'
      );

    -- Service role can insert notifications
    DROP POLICY IF EXISTS "Service role can insert notifications" ON app_notifications;
    CREATE POLICY "Service role can insert notifications" ON app_notifications
      FOR INSERT WITH CHECK (true);

    -- Users can update their own notifications
    DROP POLICY IF EXISTS "Users can update own notifications" ON app_notifications;
    CREATE POLICY "Users can update own notifications" ON app_notifications
      FOR UPDATE USING (user_id = auth.uid()::text)
      WITH CHECK (user_id = auth.uid()::text);

    -- Service role can update any notification
    DROP POLICY IF EXISTS "Service role can update notifications" ON app_notifications;
    CREATE POLICY "Service role can update notifications" ON app_notifications
      FOR UPDATE USING (true) WITH CHECK (true);
  END IF;
END $$;

-- =====================================================
-- device_tokens table
-- =====================================================
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'device_tokens') THEN
    ALTER TABLE device_tokens ENABLE ROW LEVEL SECURITY;

    -- Users can read their own device tokens
    DROP POLICY IF EXISTS "Users can read own device tokens" ON device_tokens;
    CREATE POLICY "Users can read own device tokens" ON device_tokens
      FOR SELECT USING (
        user_id = auth.uid()::text
        OR user_id = 'anonymous'
      );

    -- Service role can insert device tokens
    DROP POLICY IF EXISTS "Service role can insert device tokens" ON device_tokens;
    CREATE POLICY "Service role can insert device tokens" ON device_tokens
      FOR INSERT WITH CHECK (true);

    -- Service role can update device tokens
    DROP POLICY IF EXISTS "Service role can update device tokens" ON device_tokens;
    CREATE POLICY "Service role can update device tokens" ON device_tokens
      FOR UPDATE USING (true) WITH CHECK (true);

    -- Service role can delete device tokens
    DROP POLICY IF EXISTS "Service role can delete device tokens" ON device_tokens;
    CREATE POLICY "Service role can delete device tokens" ON device_tokens
      FOR DELETE USING (true);
  END IF;
END $$;

-- =====================================================
-- Indexes (only if tables exist)
-- =====================================================
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'app_notifications') THEN
    CREATE INDEX IF NOT EXISTS idx_app_notifications_user_id ON app_notifications(user_id);
    CREATE INDEX IF NOT EXISTS idx_app_notifications_created_at ON app_notifications(created_at DESC);
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'device_tokens') THEN
    CREATE INDEX IF NOT EXISTS idx_device_tokens_user_id ON device_tokens(user_id);
    CREATE INDEX IF NOT EXISTS idx_device_tokens_role ON device_tokens(role);
    CREATE INDEX IF NOT EXISTS idx_device_tokens_token ON device_tokens(token);
    CREATE INDEX IF NOT EXISTS idx_device_tokens_is_active ON device_tokens(is_active);
  END IF;
END $$;
