-- Add outstanding_balance column to buildings table
-- Supabase / PostgreSQL version

ALTER TABLE public.buildings ADD COLUMN outstanding_balance INTEGER NOT NULL DEFAULT 0;