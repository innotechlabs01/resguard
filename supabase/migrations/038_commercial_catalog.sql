-- 038_commercial_catalog.sql
-- Updates the plan catalog with the 5-tier commercial pricing model.
-- Old plans (basic/pro/premium at 99k/199k/349k) are DEACTIVATED, not deleted.
-- New plans use the pricing from the business strategy.

-- Deactivate old plans (preserve for existing subscriptions)
UPDATE public.plans SET is_active = false, updated_at = now()
WHERE code IN ('basic', 'pro', 'premium');

-- ── New commercial catalog ──

-- Hogar: 1 vivienda individual
INSERT INTO public.plans (code, name, description, price_cop, billing_interval, max_units, max_buildings, max_admin_users, organization_types, features, is_active)
VALUES (
  'hogar',
  'Hogar',
  'Para una vivienda o propiedad individual. Comunicación y gestión básica de tu casa.',
  19900,
  'monthly',
  1,
  1,
  1,
  ARRAY['hogar'],
  '{"visitors": true, "communications": true, "notifications": true, "parking": false, "reservations": false, "payments": false, "pqrs": false}',
  true
)
ON CONFLICT (code) DO UPDATE SET
  price_cop = 19900,
  description = 'Para una vivienda o propiedad individual. Comunicación y gestión básica de tu casa.',
  max_units = 1,
  max_buildings = 1,
  max_admin_users = 1,
  organization_types = ARRAY['hogar'],
  features = '{"visitors": true, "communications": true, "notifications": true, "parking": false, "reservations": false, "payments": false, "pqrs": false}',
  is_active = true,
  updated_at = now();

-- Grupo pequeño: comunidades residenciales pequeñas
INSERT INTO public.plans (code, name, description, price_cop, billing_interval, max_units, max_buildings, max_admin_users, organization_types, features, is_active)
VALUES (
  'grupo',
  'Grupo Pequeño',
  'Para comunidades residenciales pequeñas. Gestión de visitantes, avisos y parqueaderos.',
  59900,
  'monthly',
  20,
  1,
  2,
  ARRAY['grupo'],
  '{"visitors": true, "communications": true, "notifications": true, "parking": true, "reservations": true, "payments": false, "pqrs": false}',
  true
)
ON CONFLICT (code) DO UPDATE SET
  price_cop = 59900,
  description = 'Para comunidades residenciales pequeñas. Gestión de visitantes, avisos y parqueaderos.',
  max_units = 20,
  max_buildings = 1,
  max_admin_users = 2,
  organization_types = ARRAY['grupo'],
  features = '{"visitors": true, "communications": true, "notifications": true, "parking": true, "reservations": true, "payments": false, "pqrs": false}',
  is_active = true,
  updated_at = now();

-- Comunidad: copropiedades con necesidades administrativas amplias
INSERT INTO public.plans (code, name, description, price_cop, billing_interval, max_units, max_buildings, max_admin_users, organization_types, features, is_active)
VALUES (
  'comunidad',
  'Comunidad',
  'Para copropiedades con necesidades administrativas amplias. Incluye pagos, PQRS y reportes.',
  119900,
  'monthly',
  100,
  2,
  5,
  ARRAY['comunidad', 'grupo'],
  '{"visitors": true, "communications": true, "notifications": true, "parking": true, "reservations": true, "payments": true, "pqrs": true, "reports": true}',
  true
)
ON CONFLICT (code) DO UPDATE SET
  price_cop = 119900,
  description = 'Para copropiedades con necesidades administrativas amplias. Incluye pagos, PQRS y reportes.',
  max_units = 100,
  max_buildings = 2,
  max_admin_users = 5,
  organization_types = ARRAY['comunidad', 'grupo'],
  features = '{"visitors": true, "communications": true, "notifications": true, "parking": true, "reservations": true, "payments": true, "pqrs": true, "reports": true}',
  is_active = true,
  updated_at = now();

-- Profesional: comunidades y administraciones de mayor tamaño
INSERT INTO public.plans (code, name, description, price_cop, billing_interval, max_units, max_buildings, max_admin_users, organization_types, features, is_active)
VALUES (
  'profesional',
  'Profesional',
  'Para comunidades y administraciones de mayor tamaño. Todas las funciones, multi-edificio.',
  199900,
  'monthly',
  500,
  5,
  10,
  ARRAY['comunidad', 'inmobiliaria'],
  '{"visitors": true, "communications": true, "notifications": true, "parking": true, "reservations": true, "payments": true, "pqrs": true, "reports": true, "assemblies": true, "maintenance": true, "surveys": true, "helpdesk": true}',
  true
)
ON CONFLICT (code) DO UPDATE SET
  price_cop = 199900,
  description = 'Para comunidades y administraciones de mayor tamaño. Todas las funciones, multi-edificio.',
  max_units = 500,
  max_buildings = 5,
  max_admin_users = 10,
  organization_types = ARRAY['comunidad', 'inmobiliaria'],
  features = '{"visitors": true, "communications": true, "notifications": true, "parking": true, "reservations": true, "payments": true, "pqrs": true, "reports": true, "assemblies": true, "maintenance": true, "surveys": true, "helpdesk": true}',
  is_active = true,
  updated_at = now();

-- Inmobiliarias: contratación según volumen
INSERT INTO public.plans (code, name, description, price_cop, billing_interval, max_units, max_buildings, max_admin_users, organization_types, features, is_active)
VALUES (
  'inmobiliaria',
  'Inmobiliarias',
  'Para empresas que gestionan varias propiedades. Precio según volumen contratado — hablemos.',
  0,
  'monthly',
  10000,
  1000,
  100,
  ARRAY['inmobiliaria'],
  '{"visitors": true, "communications": true, "notifications": true, "parking": true, "reservations": true, "payments": true, "pqrs": true, "reports": true, "assemblies": true, "maintenance": true, "surveys": true, "helpdesk": true, "multi_building": true, "priority_support": true}',
  true
)
ON CONFLICT (code) DO UPDATE SET
  price_cop = 0,
  description = 'Para empresas que gestionan varias propiedades. Precio según volumen contratado — hablemos.',
  max_units = 10000,
  max_buildings = 1000,
  max_admin_users = 100,
  organization_types = ARRAY['inmobiliaria'],
  features = '{"visitors": true, "communications": true, "notifications": true, "parking": true, "reservations": true, "payments": true, "pqrs": true, "reports": true, "assemblies": true, "maintenance": true, "surveys": true, "helpdesk": true, "multi_building": true, "priority_support": true}',
  is_active = true,
  updated_at = now();

-- ── Grace period column on subscriptions (if not already from 037) ──
-- 037 already added grace_period_end, so this is a no-op check
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'grace_period_days'
  ) THEN
    ALTER TABLE public.subscriptions
      ADD COLUMN grace_period_days INTEGER NOT NULL DEFAULT 5;
  END IF;
END $$;
