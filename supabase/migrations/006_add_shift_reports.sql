-- Shift reports table for security guard shift tracking
-- Supabase / PostgreSQL version

CREATE TABLE IF NOT EXISTS public.shift_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id UUID NOT NULL,
  guard_name TEXT NOT NULL,
  shift_start TIMESTAMPTZ NOT NULL,
  shift_end TIMESTAMPTZ,
  incidents TEXT[],
  notes TEXT,
  audio_transcription TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (building_id) REFERENCES public.buildings(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_shift_reports_building ON public.shift_reports(building_id);
CREATE INDEX IF NOT EXISTS idx_shift_reports_guard ON public.shift_reports(guard_name);
CREATE INDEX IF NOT EXISTS idx_shift_reports_shift_start ON public.shift_reports(shift_start);
