-- Additional tables for the residential management system
-- Turso / libSQL version
-- Adding system_stats table (users table already exists)

-- System stats table (singleton table for system-wide statistics)
CREATE TABLE IF NOT EXISTS system_stats (
  id INTEGER PRIMARY KEY CHECK (id = 1), -- Forces singleton pattern
  total_buildings INTEGER NOT NULL,
  active_buildings INTEGER NOT NULL,
  total_residents INTEGER NOT NULL,
  total_revenue INTEGER NOT NULL,
  monthly_recurring_revenue INTEGER NOT NULL,
  pending_payments INTEGER NOT NULL,
  system_alerts INTEGER NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Insert initial system stats record if it doesn't exist
INSERT OR IGNORE INTO system_stats (id, total_buildings, active_buildings, total_residents, total_revenue, monthly_recurring_revenue, pending_payments, system_alerts)
VALUES (1, 0, 0, 0, 0, 0, 0, 0);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_system_stats_id ON system_stats(id);