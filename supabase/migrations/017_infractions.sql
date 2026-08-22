-- Convivencia + Multas con Derecho de Réplica module
-- Created: 2026-08-22

-- ============================================================
-- 1. INFRACTION REPORTS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS infraction_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL,
  reporter_name VARCHAR(100) NOT NULL,
  reporter_unit VARCHAR(20),

  -- Infracción reportada
  infraction_type VARCHAR(50) NOT NULL CHECK (infraction_type IN (
    'noise', 'pet', 'parking', 'common_area', 'smoking',
    'trash', 'construction', 'other'
  )),
  description TEXT NOT NULL,
  location VARCHAR(255),

  -- Unidad infractora
  target_unit VARCHAR(20) NOT NULL,

  -- Workflow
  status VARCHAR(20) NOT NULL DEFAULT 'reported' CHECK (status IN (
    'reported',      -- Reportado
    'notified',      -- Infractor notificado
    'reply_pending', -- Esperando réplica (48h)
    'reply_received',-- Réplica recibida
    'fine_issued',   -- Multa emitida
    'dismissed',     -- Desestimado
    'escalated'      -- Escalado a asamblea
  )),

  -- Réplica del infractor
  reply TEXT,
  reply_at TIMESTAMPTZ,
  reply_deadline TIMESTAMPTZ,

  -- Decisión admin
  admin_decision VARCHAR(20) CHECK (admin_decision IN ('fine', 'dismiss', 'escalate')),
  admin_notes TEXT,
  decided_by VARCHAR(100),
  decided_at TIMESTAMPTZ,

  -- Multa asociada (si aplica)
  fine_amount DECIMAL(12,2),
  fine_id UUID,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 2. INFRACTION EVIDENCES TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS infraction_evidences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  infraction_id UUID NOT NULL REFERENCES infraction_reports(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('photo', 'audio', 'document')),
  url TEXT NOT NULL,
  uploaded_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 3. INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_infractions_building ON infraction_reports(building_id);
CREATE INDEX IF NOT EXISTS idx_infractions_status ON infraction_reports(status);
CREATE INDEX IF NOT EXISTS idx_infractions_target ON infraction_reports(target_unit);
CREATE INDEX IF NOT EXISTS idx_infraction_evidences_infraction ON infraction_evidences(infraction_id);

-- ============================================================
-- 4. ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE infraction_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE infraction_evidences ENABLE ROW LEVEL SECURITY;

-- Infractions: residents can see infractions from their building
CREATE POLICY "infractions_select_building" ON infraction_reports FOR SELECT USING (
  building_id IN (SELECT building_id FROM users WHERE id::text = auth.uid()::text)
);

-- Infractions: residents can create infractions as themselves
CREATE POLICY "infractions_insert_resident" ON infraction_reports FOR INSERT WITH CHECK (
  reporter_id::text = auth.uid()::text
);

-- Infractions: admin/super_admin can update infractions in their building
CREATE POLICY "infractions_update_admin" ON infraction_reports FOR UPDATE USING (
  building_id IN (SELECT building_id FROM users WHERE id::text = auth.uid()::text AND role IN ('admin', 'super_admin'))
);

-- Evidences: anyone in the building can read evidences
CREATE POLICY "infraction_evidences_select" ON infraction_evidences FOR SELECT USING (
  infraction_id IN (SELECT id FROM infraction_reports WHERE building_id IN (SELECT building_id FROM users WHERE id::text = auth.uid()::text))
);

-- Evidences: any user can insert evidences as themselves
CREATE POLICY "infraction_evidences_insert" ON infraction_evidences FOR INSERT WITH CHECK (
  uploaded_by = auth.uid()
);

-- ============================================================
-- 5. UPDATED_AT TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION update_infractions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS infractions_updated_at_trigger ON infraction_reports;
CREATE TRIGGER infractions_updated_at_trigger
  BEFORE UPDATE ON infraction_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_infractions_updated_at();
