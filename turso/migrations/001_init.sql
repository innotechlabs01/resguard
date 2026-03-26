-- Esquema inicial para entornos local / QA (Turso / libSQL).
-- Ejecutar con: turso db shell <database> < turso/migrations/001_init.sql
-- o herramienta equivalente según tu flujo.

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  clerk_user_id TEXT UNIQUE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'vigilante', 'usuario')),
  building_id TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_users_clerk ON users (clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_users_building ON users (building_id);