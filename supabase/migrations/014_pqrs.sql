-- PQRS (Peticiones, Quejas, Reclamos, Sugerencias) module
-- Created: 2026-08-22

-- ============================================================
-- 1. PQRS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS pqrs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  created_by_name VARCHAR(100) NOT NULL,
  created_by_unit VARCHAR(20),

  subject VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN (
    'maintenance', 'noise', 'security', 'cleaning',
    'parking', 'common_areas', 'billing', 'other'
  )),

  priority VARCHAR(20) NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN (
    'open', 'in_progress', 'waiting', 'resolved', 'closed', 'reopened'
  )),

  unit VARCHAR(20),
  location_detail VARCHAR(255),

  assigned_to VARCHAR(100),

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  first_response_at TIMESTAMPTZ
);

-- ============================================================
-- 2. PQRS COMMENTS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS pqrs_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pqrs_id UUID NOT NULL REFERENCES pqrs(id) ON DELETE CASCADE,
  author_id UUID NOT NULL,
  author_name VARCHAR(100) NOT NULL,
  author_role VARCHAR(20) NOT NULL,
  content TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 3. INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_pqrs_building ON pqrs(building_id);
CREATE INDEX IF NOT EXISTS idx_pqrs_status ON pqrs(status);
CREATE INDEX IF NOT EXISTS idx_pqrs_category ON pqrs(category);
CREATE INDEX IF NOT EXISTS idx_pqrs_created_by ON pqrs(created_by);
CREATE INDEX IF NOT EXISTS idx_pqrs_comments_pqrs ON pqrs_comments(pqrs_id);

-- ============================================================
-- 4. ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE pqrs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pqrs_comments ENABLE ROW LEVEL SECURITY;

-- PQRS: residents can see PQRS from their building
CREATE POLICY "pqrs_select_building" ON pqrs FOR SELECT USING (
  building_id IN (SELECT building_id FROM users WHERE id = auth.uid()::text)
);

-- PQRS: residents can create PQRS as themselves
CREATE POLICY "pqrs_insert_resident" ON pqrs FOR INSERT WITH CHECK (
  created_by = auth.uid()::text
);

-- PQRS: admin/super_admin can update PQRS in their building
CREATE POLICY "pqrs_update_admin" ON pqrs FOR UPDATE USING (
  building_id IN (SELECT building_id FROM users WHERE id = auth.uid()::text AND role IN ('admin', 'super_admin'))
);

-- PQRS COMMENTS: anyone in the building can read comments
CREATE POLICY "pqrs_comments_select" ON pqrs_comments FOR SELECT USING (
  pqrs_id IN (SELECT id FROM pqrs WHERE building_id IN (SELECT building_id FROM users WHERE id = auth.uid()::text))
);

-- PQRS COMMENTS: any user can insert comments as themselves
CREATE POLICY "pqrs_comments_insert" ON pqrs_comments FOR INSERT WITH CHECK (
  author_id = auth.uid()::text
);

-- ============================================================
-- 5. UPDATED_AT TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION update_pqrs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS pqrs_updated_at_trigger ON pqrs;
CREATE TRIGGER pqrs_updated_at_trigger
  BEFORE UPDATE ON pqrs
  FOR EACH ROW
  EXECUTE FUNCTION update_pqrs_updated_at();
