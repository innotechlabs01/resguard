-- Utility Readings & Bills module
-- Created: 2026-08-22

-- ============================================================
-- 1. UTILITY READINGS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS utility_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  unit_number VARCHAR(20) NOT NULL,
  service_type VARCHAR(20) NOT NULL CHECK (service_type IN ('water', 'gas', 'electricity')),

  reading_date DATE NOT NULL,
  previous_reading DECIMAL(12,2),
  current_reading DECIMAL(12,2),
  consumption DECIMAL(12,2) GENERATED ALWAYS AS (current_reading - previous_reading) STORED,

  rate_per_unit DECIMAL(12,4),
  total_charge DECIMAL(12,2) GENERATED ALWAYS AS ((current_reading - previous_reading) * rate_per_unit) STORED,

  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 2. UTILITY BILLS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS utility_bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  billing_period VARCHAR(7) NOT NULL, -- 'YYYY-MM'
  service_type VARCHAR(20) NOT NULL,

  total_consumption DECIMAL(12,2),
  total_charges DECIMAL(12,2),
  total_units_billed INTEGER,

  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'finalized', 'paid')),
  finalized_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 3. INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_utility_readings_building ON utility_readings(building_id);
CREATE INDEX IF NOT EXISTS idx_utility_readings_unit ON utility_readings(unit_number);
CREATE INDEX IF NOT EXISTS idx_utility_readings_service ON utility_readings(service_type);
CREATE INDEX IF NOT EXISTS idx_utility_bills_building ON utility_bills(building_id);

-- ============================================================
-- 4. ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE utility_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE utility_bills ENABLE ROW LEVEL SECURITY;

-- Readings: users in building can read
CREATE POLICY "utility_readings_select_building" ON utility_readings FOR SELECT USING (
  building_id IN (SELECT building_id FROM users WHERE id::text = auth.uid()::text)
);

-- Readings: admin can insert
CREATE POLICY "utility_readings_insert_admin" ON utility_readings FOR INSERT WITH CHECK (
  building_id IN (SELECT building_id FROM users WHERE id::text = auth.uid()::text AND role IN ('admin', 'super_admin'))
);

-- Bills: users in building can read
CREATE POLICY "utility_bills_select_building" ON utility_bills FOR SELECT USING (
  building_id IN (SELECT building_id FROM users WHERE id::text = auth.uid()::text)
);

-- Bills: admin can insert
CREATE POLICY "utility_bills_insert_admin" ON utility_bills FOR INSERT WITH CHECK (
  building_id IN (SELECT building_id FROM users WHERE id::text = auth.uid()::text AND role IN ('admin', 'super_admin'))
);
