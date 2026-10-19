-- 034_bold_webhook_events.sql
-- M2 fix: idempotency store for Bold webhook events.
-- Prevents replay attacks (a re-sent PAID after past_due re-activating).

CREATE TABLE IF NOT EXISTS public.bold_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_hash TEXT NOT NULL UNIQUE, -- sha256 of raw body (anti-replay)
  bold_link_id TEXT NOT NULL,     -- Bold payment link / subscription ref
  status TEXT NOT NULL,            -- Bold status received
  payload JSONB,                  -- full raw body for debugging
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bold_webhook_events_link
  ON public.bold_webhook_events (bold_link_id);

CREATE INDEX IF NOT EXISTS idx_bold_webhook_events_processed_at
  ON public.bold_webhook_events (processed_at DESC);

-- Retention: auto-delete events older than 30 days
-- (executed by a scheduled job or manual cleanup)
