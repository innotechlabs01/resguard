-- Add missing columns to buildings table
-- Turso / libSQL version

ALTER TABLE buildings ADD COLUMN last_payment_date TEXT;
ALTER TABLE buildings ADD COLUMN subscription_status TEXT NOT NULL DEFAULT 'active';