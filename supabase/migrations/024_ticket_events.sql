-- Ticket events / timeline for PQRS + Convivencia (help desk) module
-- Created: 2026-09-06

-- ============================================================
-- 1. TICKET EVENTS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS ticket_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(20) NOT NULL CHECK (entity_type IN ('pqrs', 'infraction')),
  entity_id UUID NOT NULL,
  event_type VARCHAR(50) NOT NULL,
  actor_name VARCHAR(100),
  old_value TEXT,
  new_value TEXT,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 2. INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_ticket_events_entity
  ON ticket_events(entity_type, entity_id, created_at);

-- ============================================================
-- 3. ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE ticket_events ENABLE ROW LEVEL SECURITY;

-- Events: residents can read events for tickets in their building
CREATE POLICY "ticket_events_select_building" ON ticket_events FOR SELECT USING (
  entity_type = 'pqrs'
    AND entity_id IN (SELECT id FROM pqrs WHERE building_id IN (SELECT building_id FROM users WHERE id::text = auth.uid()::text))
  OR
  entity_type = 'infraction'
    AND entity_id IN (SELECT id FROM infraction_reports WHERE building_id IN (SELECT building_id FROM users WHERE id::text = auth.uid()::text))
);

-- Events: any user can insert events (recorded server-side by the app)
CREATE POLICY "ticket_events_insert" ON ticket_events FOR INSERT WITH CHECK (true);
