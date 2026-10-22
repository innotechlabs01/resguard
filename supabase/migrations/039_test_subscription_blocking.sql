-- 039_test_subscription_blocking.sql
-- Migración de prueba para verificar el bloqueo por mora
-- Crea una organización de prueba, una suscripción vencida con grace_period_end en el pasado
-- para probar el cron de bloqueo automático

-- Insertar una organización de prueba si no existe
INSERT INTO public.organizations (name, type, owner_user_id, status, contact_email, contact_phone)
VALUES ('Edificio Prueba QA', 'comunidad', NULL, 'active', 'test@resguard.com', '+573000000000')
ON CONFLICT (name) DO NOTHING;

-- Insertar un plan de prueba si no existe
INSERT INTO public.plans (code, name, description, price_cop, billing_interval, max_units, max_buildings, max_admin_users, organization_types, features, is_active)
VALUES ('comunidad', 'Comunidad', 'Para copropiedades con necesidades administrativas amplias', 119900, 'monthly', 100, 2, 5, ARRAY['comunidad', 'grupo'], '{"visitors": true, "communications": true, "notifications": true, "parking": true, "reservations": true, "payments": true, "pqrs": true}', true)
ON CONFLICT (code) DO UPDATE SET
  price_cop = 119900,
  is_active = true;

-- Crear una suscripción vencida con gracia expirada para probar el bloqueo
DO $$
DECLARE
  org_id UUID;
  plan_id UUID;
BEGIN
  SELECT id INTO org_id FROM public.organizations WHERE name = 'Edificio Prueba QA' LIMIT 1;
  SELECT id INTO plan_id FROM public.plans WHERE code = 'comunidad' AND is_active = true LIMIT 1;

  IF org_id IS NOT NULL AND plan_id IS NOT NULL THEN
    -- Insertar suscripción vencida con gracia expirada (hace 5 días)
    INSERT INTO public.subscriptions (
      organization_id,
      plan_id,
      status,
      current_period_start,
      current_period_end,
      grace_period_end,
      created_at,
      updated_at
    )
    VALUES (
      org_id,
      plan_id,
      'past_due',
      now() - interval '30 days',
      now() - interval '10 days',
      now() - interval '5 days',
      now() - interval '30 days',
      now() - interval '10 days'
    )
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Suscripción de prueba creada para organización %', org_id;
  ELSE
    RAISE NOTICE 'No se pudo crear la suscripción de prueba - organización o plan no encontrado';
  END IF;
END $$;
