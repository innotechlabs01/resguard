-- Chat Threads & Messages module (contextualized per unit)
-- Created: 2026-08-22

-- ============================================================
-- 1. CHAT THREADS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS chat_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  unit_number VARCHAR(20) NOT NULL,
  thread_type VARCHAR(20) NOT NULL CHECK (thread_type IN ('vigilante', 'admin', 'ai')),
  subject VARCHAR(255),
  last_message_at TIMESTAMPTZ,
  last_message_preview VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 2. CHAT THREAD MESSAGES TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS chat_thread_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES chat_threads(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  sender_name VARCHAR(100) NOT NULL,
  sender_role VARCHAR(20) NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 3. INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_chat_threads_building ON chat_threads(building_id);
CREATE INDEX IF NOT EXISTS idx_chat_threads_unit ON chat_threads(unit_number);
CREATE INDEX IF NOT EXISTS idx_chat_threads_building_unit ON chat_threads(building_id, unit_number);
CREATE INDEX IF NOT EXISTS idx_chat_thread_messages_thread ON chat_thread_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_chat_thread_messages_created ON chat_thread_messages(created_at);

-- ============================================================
-- 4. ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_thread_messages ENABLE ROW LEVEL SECURITY;

-- Staff (vigilante, admin, super_admin) can see all threads in their building
CREATE POLICY "chat_threads_select_staff" ON chat_threads FOR SELECT USING (
  building_id IN (SELECT building_id FROM users WHERE id::text = auth.uid()::text AND role IN ('vigilante', 'admin', 'super_admin'))
);

-- Resident can see threads for their building (unit filtering done at app level)
CREATE POLICY "chat_threads_select_resident" ON chat_threads FOR SELECT USING (
  building_id IN (SELECT building_id FROM users WHERE id::text = auth.uid()::text)
);

-- Staff can create threads
CREATE POLICY "chat_threads_insert_staff" ON chat_threads FOR INSERT WITH CHECK (
  building_id IN (SELECT building_id FROM users WHERE id::text = auth.uid()::text AND role IN ('vigilante', 'admin', 'super_admin'))
);

-- Staff can update threads (for last_message_at/preview)
CREATE POLICY "chat_threads_update_staff" ON chat_threads FOR UPDATE USING (
  building_id IN (SELECT building_id FROM users WHERE id::text = auth.uid()::text AND role IN ('vigilante', 'admin', 'super_admin'))
);

-- Messages visible to participants of the thread
CREATE POLICY "chat_thread_messages_select" ON chat_thread_messages FOR SELECT USING (
  thread_id IN (SELECT id FROM chat_threads WHERE
    building_id IN (SELECT building_id FROM users WHERE id::text = auth.uid()::text)
  )
);

-- Users can insert messages as themselves
CREATE POLICY "chat_thread_messages_insert" ON chat_thread_messages FOR INSERT WITH CHECK (
  sender_id::text = auth.uid()::text
);

-- Users can update read status on their own messages
CREATE POLICY "chat_thread_messages_update_read" ON chat_thread_messages FOR UPDATE USING (
  sender_id::text = auth.uid()::text OR
  thread_id IN (SELECT id FROM chat_threads WHERE
    building_id IN (SELECT building_id FROM users WHERE id::text = auth.uid()::text)
  )
);
