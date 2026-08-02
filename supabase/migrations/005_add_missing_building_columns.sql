-- Add missing columns to buildings table
-- Supabase / PostgreSQL version

ALTER TABLE public.buildings ADD COLUMN last_payment_date TIMESTAMPTZ;
ALTER TABLE public.buildings ADD COLUMN subscription_status TEXT NOT NULL DEFAULT 'active';