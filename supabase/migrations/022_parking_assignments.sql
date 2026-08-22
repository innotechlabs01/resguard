-- Tabla separada de parqueaderos de alquiler entre residentes
-- NO confundir con parking_spots que es para visitantes

CREATE TABLE IF NOT EXISTS parking_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  spot_code VARCHAR(20) NOT NULL,
  
  -- Estado: 'owner' (propietario con vehículo), 'rented' (alquilado), 'available' (disponible)
  assignment_type VARCHAR(20) NOT NULL DEFAULT 'available' CHECK (assignment_type IN ('owner', 'rented', 'available')),
  
  -- Datos del propietario del parqueadero
  owner_id UUID,
  owner_name VARCHAR(100),
  owner_unit VARCHAR(20),
  
  -- Datos del inquilino (solo si assignment_type = 'rented')
  tenant_name VARCHAR(100),
  tenant_unit VARCHAR(20),
  
  -- Datos del vehículo (aplica para owner y rented)
  vehicle_plate VARCHAR(20),
  vehicle_brand VARCHAR(50),
  vehicle_color VARCHAR(30),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(building_id, spot_code)
);

CREATE INDEX idx_parking_assignments_building ON parking_assignments(building_id);
CREATE INDEX idx_parking_assignments_type ON parking_assignments(assignment_type);
CREATE INDEX idx_parking_assignments_owner ON parking_assignments(owner_id);

ALTER TABLE parking_assignments ENABLE ROW LEVEL SECURITY;

-- Todos los del edificio pueden ver
CREATE POLICY "parking_assignments_select_building" ON parking_assignments
  FOR SELECT USING (
    building_id IN (SELECT building_id FROM users WHERE id::text = auth.uid()::text)
  );

-- Propietarios pueden crear/actualizar sus propios parqueaderos
CREATE POLICY "parking_assignments_insert_resident" ON parking_assignments
  FOR INSERT WITH CHECK (
    building_id IN (SELECT building_id FROM users WHERE id::text = auth.uid()::text)
  );

CREATE POLICY "parking_assignments_update_resident" ON parking_assignments
  FOR UPDATE USING (
    building_id IN (SELECT building_id FROM users WHERE id::text = auth.uid()::text)
  );

-- Admin puede eliminar
CREATE POLICY "parking_assignments_delete_admin" ON parking_assignments
  FOR DELETE USING (
    building_id IN (
      SELECT building_id FROM users WHERE id::text = auth.uid()::text 
      AND role IN ('admin', 'super_admin')
    )
  );

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_parking_assignments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER parking_assignments_updated_at
  BEFORE UPDATE ON parking_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_parking_assignments_updated_at();
