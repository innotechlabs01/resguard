-- Add outstanding_balance column to buildings table
-- Turso / libSQL version

ALTER TABLE buildings ADD COLUMN outstanding_balance INTEGER NOT NULL DEFAULT 0;