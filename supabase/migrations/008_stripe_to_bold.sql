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
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  total_buildings INTEGER NOT NULL DEFAULT 0,
  active_buildings INTEGER NOT NULL DEFAULT 0,
  total_residents INTEGER NOT NULL DEFAULT 0,
  total_revenue BIGINT NOT NULL DEFAULT 0,
  monthly_recurring_revenue BIGINT NOT NULL DEFAULT 0,
  pending_payments INTEGER NOT NULL DEFAULT 0,
  system_alerts INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insertar estadísticas iniciales si la tabla está vacía
INSERT INTO public.system_stats (id, total_buildings, active_buildings, total_residents, total_revenue, monthly_recurring_revenue, pending_payments, system_alerts)
SELECT
  1,
  COUNT(*),
  COUNT(*) FILTER (WHERE subscription_status = 'active'),
  0,
  COALESCE(SUM(monthly_fee), 0),
  COALESCE(SUM(monthly_fee) FILTER (WHERE subscription_status = 'active'), 0),
  COALESCE(SUM(outstanding_balance), 0),
  0
FROM public.buildings
ON CONFLICT (id) DO NOTHING;
