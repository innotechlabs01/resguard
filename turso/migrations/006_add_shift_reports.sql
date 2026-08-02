-- Shift reports table for security guard shift tracking
-- Turso / libSQL version

CREATE TABLE IF NOT EXISTS shift_reports (
  id TEXT PRIMARY KEY,
  building_id TEXT NOT NULL,
  guard_name TEXT NOT NULL,
  shift_start TEXT NOT NULL,
  shift_end TEXT,
  incidents TEXT,
  notes TEXT,
  audio_transcription TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (building_id) REFERENCES buildings(id)
);

CREATE INDEX IF NOT EXISTS idx_shift_reports_building ON shift_reports(building_id);
CREATE INDEX IF NOT EXISTS idx_shift_reports_guard ON shift_reports(guard_name);
CREATE INDEX IF NOT EXISTS idx_shift_reports_shift_start ON shift_reports(shift_start);
