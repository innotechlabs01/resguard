-- Migración para cambiar de Stripe a Bold (Turso/SQLite)
-- Agregar columnas de Bold

-- Agregar columna bold_account_id
ALTER TABLE buildings ADD COLUMN bold_account_id TEXT;

-- Agregar columnas faltantes a buildings
ALTER TABLE buildings ADD COLUMN outstanding_balance INTEGER NOT NULL DEFAULT 0;
ALTER TABLE buildings ADD COLUMN last_payment_date TEXT;
ALTER TABLE buildings ADD COLUMN subscription_status TEXT NOT NULL DEFAULT 'active';

-- Crear tabla de estadísticas del sistema si no existe
CREATE TABLE IF NOT EXISTS system_stats (
  id TEXT PRIMARY KEY,
  total_buildings INTEGER NOT NULL DEFAULT 0,
  active_buildings INTEGER NOT NULL DEFAULT 0,
  total_residents INTEGER NOT NULL DEFAULT 0,
  total_revenue INTEGER NOT NULL DEFAULT 0,
  monthly_recurring_revenue INTEGER NOT NULL DEFAULT 0,
  pending_payments INTEGER NOT NULL DEFAULT 0,
  system_alerts INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Insertar estadísticas iniciales si la tabla está vacía
INSERT INTO system_stats (id, total_buildings, active_buildings, total_residents, total_revenue, monthly_recurring_revenue, pending_payments, system_alerts)
SELECT
  lower(hex(randomblob(16))),
  COALESCE((SELECT COUNT(*) FROM buildings), 0) as total_buildings,
  COALESCE((SELECT COUNT(*) FROM buildings WHERE subscription_status = 'active'), 0) as active_buildings,
  0 as total_residents,
  COALESCE((SELECT SUM(monthly_fee) FROM buildings), 0) as total_revenue,
  COALESCE((SELECT SUM(monthly_fee) FROM buildings WHERE subscription_status = 'active'), 0) as monthly_recurring_revenue,
  COALESCE((SELECT SUM(outstanding_balance) FROM buildings), 0) as pending_payments,
  0 as system_alerts
WHERE NOT EXISTS (SELECT 1 FROM system_stats LIMIT 1);
