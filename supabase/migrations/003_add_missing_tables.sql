-- Additional tables for the residential management system
-- Supabase / PostgreSQL version
-- Adding system_stats table (users table already exists)

-- System stats table (singleton table for system-wide statistics)
CREATE TABLE IF NOT EXISTS public.system_stats (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1), -- Forces singleton pattern
  total_buildings INTEGER NOT NULL,
  active_buildings INTEGER NOT NULL,
  total_residents INTEGER NOT NULL,
  total_revenue BIGINT NOT NULL,
  monthly_recurring_revenue BIGINT NOT NULL,
  pending_payments INTEGER NOT NULL,
  system_alerts INTEGER NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert initial system stats record if it doesn't exist
INSERT INTO public.system_stats (id, total_buildings, active_buildings, total_residents, total_revenue, monthly_recurring_revenue, pending_payments, system_alerts)
VALUES (1, 0, 0, 0, 0, 0, 0, 0)
ON CONFLICT (id) DO NOTHING;

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_system_stats_id ON public.system_stats(id);