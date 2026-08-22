-- Onboarding Digital de Nuevos Residentes module
-- Created: 2026-08-22

-- ============================================================
-- 1. ONBOARDING CHECKLISTS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS onboarding_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  user_name VARCHAR(100) NOT NULL,
  user_unit VARCHAR(20),

  status VARCHAR(20) DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed')),

  -- Items del checklist
  signed_regulation BOOLEAN DEFAULT false,
  received_keys BOOLEAN DEFAULT false,
  met_vigilante BOOLEAN DEFAULT false,
  met_admin BOOLEAN DEFAULT false,
  parking_assigned BOOLEAN DEFAULT false,
  wifi_configured BOOLEAN DEFAULT false,
  emergency_numbers BOOLEAN DEFAULT false,

  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 2. INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_onboarding_building ON onboarding_checklists(building_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_user ON onboarding_checklists(user_id);

-- ============================================================
-- 3. ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE onboarding_checklists ENABLE ROW LEVEL SECURITY;

-- Onboarding: residents can see checklists from their building
CREATE POLICY "onboarding_select_building" ON onboarding_checklists FOR SELECT USING (
  building_id IN (SELECT building_id FROM users WHERE id = auth.uid()::text)
);

-- Onboarding: admin/super_admin can create checklists
CREATE POLICY "onboarding_insert_admin" ON onboarding_checklists FOR INSERT WITH CHECK (
  building_id IN (SELECT building_id FROM users WHERE id = auth.uid()::text AND role IN ('admin', 'super_admin'))
);

-- Onboarding: users can update their own checklist or admin can update any
CREATE POLICY "onboarding_update_own" ON onboarding_checklists FOR UPDATE USING (
  user_id = auth.uid()::text OR
  building_id IN (SELECT building_id FROM users WHERE id = auth.uid()::text AND role IN ('admin', 'super_admin'))
);

-- ============================================================
-- 4. UPDATED_AT TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION update_onboarding_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS onboarding_updated_at_trigger ON onboarding_checklists;
CREATE TRIGGER onboarding_updated_at_trigger
  BEFORE UPDATE ON onboarding_checklists
  FOR EACH ROW
  EXECUTE FUNCTION update_onboarding_updated_at();
