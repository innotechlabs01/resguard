-- 035_common_area_reservations.sql
-- Reservas de zonas comunes: sala social, gimnasio, BBQ, etc.
-- Table: common_areas (catálogo por edificio) + area_reservations (reservas).

CREATE TABLE IF NOT EXISTS public.common_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id UUID NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  max_capacity INTEGER DEFAULT 10,
  max_duration_hours INTEGER DEFAULT 4,
  advance_notice_hours INTEGER DEFAULT 24,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_common_areas_building ON public.common_areas(building_id);

CREATE TABLE IF NOT EXISTS public.area_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  area_id UUID NOT NULL REFERENCES public.common_areas(id) ON DELETE CASCADE,
  building_id UUID NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id),
  user_name TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_area_reservations_building ON public.area_reservations(building_id);
CREATE INDEX IF NOT EXISTS idx_area_reservations_area ON public.area_reservations(area_id);
CREATE INDEX IF NOT EXISTS idx_area_reservations_user ON public.area_reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_area_reservations_time ON public.area_reservations(start_time);

-- Prevent overlapping reservations for the same area (not cancelled)
CREATE OR REPLACE FUNCTION public.prevent_overlapping_reservation()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status != 'cancelled' THEN
    IF EXISTS (
      SELECT 1 FROM public.area_reservations
      WHERE area_id = NEW.area_id
        AND status NOT IN ('cancelled')
        AND id != NEW.id
        AND tstzrange(NEW.start_time, NEW.end_time) && tstzrange(start_time, end_time)
    ) THEN
      RAISE EXCEPTION 'Time slot already reserved for this area'
        USING ERRCODE = '23P01';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS prevent_overlapping_reservation_trigger ON public.area_reservations;
CREATE TRIGGER prevent_overlapping_reservation_trigger
  BEFORE INSERT OR UPDATE ON public.area_reservations
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_overlapping_reservation();

-- ── RLS ──

ALTER TABLE public.common_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.area_reservations ENABLE ROW LEVEL SECURITY;

-- common_areas: read for building members
CREATE POLICY "common_areas_select_building" ON public.common_areas
  FOR SELECT USING (
    building_id = public.get_user_building_id()
    OR public.get_user_role() = 'super_admin'
  );

-- common_areas: admin manages
CREATE POLICY "common_areas_insert_admin" ON public.common_areas
  FOR INSERT WITH CHECK (
    public.get_user_role() = 'super_admin'
    OR (public.get_user_role() = 'admin' AND building_id = public.get_user_building_id())
  );

CREATE POLICY "common_areas_update_admin" ON public.common_areas
  FOR UPDATE USING (
    public.get_user_role() = 'super_admin'
    OR (public.get_user_role() = 'admin' AND building_id = public.get_user_building_id())
  );

-- area_reservations: users see reservations in their building
CREATE POLICY "area_reservations_select_building" ON public.area_reservations
  FOR SELECT USING (
    building_id = public.get_user_building_id()
    OR public.get_user_role() = 'super_admin'
  );

-- area_reservations: residents create their own
CREATE POLICY "area_reservations_insert_own" ON public.area_reservations
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND building_id = public.get_user_building_id()
  );

-- area_reservations: users cancel their own; admins manage building
CREATE POLICY "area_reservations_update_own" ON public.area_reservations
  FOR UPDATE USING (
    user_id = auth.uid()
    OR (public.get_user_role() = 'admin' AND building_id = public.get_user_building_id())
    OR public.get_user_role() = 'super_admin'
  );

CREATE POLICY "area_reservations_delete_admin" ON public.area_reservations
  FOR DELETE USING (
    public.get_user_role() IN ('admin', 'super_admin')
    AND (public.get_user_role() = 'super_admin' OR building_id = public.get_user_building_id())
  );
