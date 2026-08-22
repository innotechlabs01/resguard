-- Preventive Maintenance + Work Orders module
-- Created: 2026-08-22

-- ============================================================
-- 1. MAINTENANCE SCHEDULES TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS maintenance_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL CHECK (category IN (
    'elevator', 'plumbing', 'electrical', 'painting',
    'gardening', 'cleaning', 'security_system', 'other'
  )),
  frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('weekly', 'biweekly', 'monthly', 'quarterly', 'yearly')),
  next_due DATE NOT NULL,
  last_completed DATE,
  assigned_provider VARCHAR(100),
  assigned_provider_phone VARCHAR(20),
  estimated_cost DECIMAL(12,2),
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 2. WORK ORDERS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS work_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID REFERENCES maintenance_schedules(id) ON DELETE SET NULL,
  building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'in_progress', 'completed', 'cancelled'
  )),
  priority VARCHAR(20) DEFAULT 'normal',
  assigned_provider VARCHAR(100),
  assigned_provider_phone VARCHAR(20),
  scheduled_date DATE,
  completed_date DATE,
  actual_cost DECIMAL(12,2),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 3. INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_maintenance_building ON maintenance_schedules(building_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_next_due ON maintenance_schedules(next_due);
CREATE INDEX IF NOT EXISTS idx_work_orders_building ON work_orders(building_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_status ON work_orders(status);
CREATE INDEX IF NOT EXISTS idx_work_orders_scheduled ON work_orders(scheduled_date);

-- ============================================================
-- 4. ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE maintenance_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;

-- Maintenance schedules: building members can read
CREATE POLICY "maintenance_select_building" ON maintenance_schedules FOR SELECT USING (
  building_id IN (SELECT building_id FROM users WHERE id = auth.uid()::text)
);

-- Maintenance schedules: admin/super_admin can insert
CREATE POLICY "maintenance_insert_admin" ON maintenance_schedules FOR INSERT WITH CHECK (
  building_id IN (SELECT building_id FROM users WHERE id = auth.uid()::text AND role IN ('admin', 'super_admin'))
);

-- Maintenance schedules: admin/super_admin can update
CREATE POLICY "maintenance_update_admin" ON maintenance_schedules FOR UPDATE USING (
  building_id IN (SELECT building_id FROM users WHERE id = auth.uid()::text AND role IN ('admin', 'super_admin'))
);

-- Work orders: building members can read
CREATE POLICY "work_orders_select_building" ON work_orders FOR SELECT USING (
  building_id IN (SELECT building_id FROM users WHERE id = auth.uid()::text)
);

-- Work orders: admin/super_admin can insert
CREATE POLICY "work_orders_insert_admin" ON work_orders FOR INSERT WITH CHECK (
  building_id IN (SELECT building_id FROM users WHERE id = auth.uid()::text AND role IN ('admin', 'super_admin'))
);

-- Work orders: admin/super_admin can update
CREATE POLICY "work_orders_update_admin" ON work_orders FOR UPDATE USING (
  building_id IN (SELECT building_id FROM users WHERE id = auth.uid()::text AND role IN ('admin', 'super_admin'))
);

-- ============================================================
-- 5. UPDATED_AT TRIGGERS
-- ============================================================

CREATE OR REPLACE FUNCTION update_maintenance_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS maintenance_schedules_updated_at_trigger ON maintenance_schedules;
CREATE TRIGGER maintenance_schedules_updated_at_trigger
  BEFORE UPDATE ON maintenance_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_maintenance_updated_at();

DROP TRIGGER IF EXISTS work_orders_updated_at_trigger ON work_orders;
CREATE TRIGGER work_orders_updated_at_trigger
  BEFORE UPDATE ON work_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_maintenance_updated_at();
