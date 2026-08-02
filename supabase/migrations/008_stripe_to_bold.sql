-- Migración para cambiar de Stripe a Bold
-- Agregar columnas de Bold y cambiar stripe_account_id a bold_account_id

-- Agregar columna bold_account_id si no existe
ALTER TABLE public.buildings ADD COLUMN IF NOT EXISTS bold_account_id TEXT;

-- Actualizar stripe_account_id a bold_account_id (copiar datos si existen)
UPDATE public.buildings SET bold_account_id = stripe_account_id WHERE bold_account_id IS NULL AND stripe_account_id IS NOT NULL;

-- Agregar columnas faltantes a buildings si no existen
ALTER TABLE public.buildings ADD COLUMN IF NOT EXISTS outstanding_balance INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.buildings ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMPTZ;
ALTER TABLE public.buildings ADD COLUMN IF NOT EXISTS subscription_status TEXT NOT NULL DEFAULT 'active';

-- Crear tabla de estadísticas del sistema si no existe
CREATE TABLE IF NOT EXISTS public.system_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  total_buildings INTEGER NOT NULL DEFAULT 0,
  active_buildings INTEGER NOT NULL DEFAULT 0,
  total_residents INTEGER NOT NULL DEFAULT 0,
  total_revenue INTEGER NOT NULL DEFAULT 0,
  monthly_recurring_revenue INTEGER NOT NULL DEFAULT 0,
  pending_payments INTEGER NOT NULL DEFAULT 0,
  system_alerts INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insertar estadísticas iniciales si la tabla está vacía
INSERT INTO public.system_stats (id, total_buildings, active_buildings, total_residents, total_revenue, monthly_recurring_revenue, pending_payments, system_alerts)
SELECT
  gen_random_uuid(),
  COUNT(*) as total_buildings,
  COUNT(*) FILTER (WHERE subscription_status = 'active') as active_buildings,
  0 as total_residents,
  SUM(monthly_fee) as total_revenue,
  SUM(monthly_fee) FILTER (WHERE subscription_status = 'active') as monthly_recurring_revenue,
  SUM(outstanding_balance) as pending_payments,
  0 as system_alerts
FROM public.buildings
WHERE NOT EXISTS (SELECT 1 FROM public.system_stats);
