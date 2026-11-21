-- 040_fix_user_unit_and_fks.sql
-- T-058: Ensure unit and phone columns on public.users, user_id on public.residents,
-- and drop restrictive foreign keys referencing public.residents(id) on owner_id/seller_id/author_id
-- so that those columns can store public.users(id) or public.residents(id) without FK 23503 violations.

-- 1. Ensure unit and phone on public.users
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS unit TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT;

CREATE INDEX IF NOT EXISTS idx_users_building_unit ON public.users(building_id, unit);

-- 2. Ensure user_id and extended tenant/listing columns on public.residents, and make phone nullable
ALTER TABLE public.residents
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS owner_id UUID,
  ADD COLUMN IF NOT EXISTS owner_name TEXT,
  ADD COLUMN IF NOT EXISTS lease_end TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS has_rental_listing BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS has_marketplace_listing BOOLEAN NOT NULL DEFAULT FALSE,
  ALTER COLUMN phone DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_residents_user_id ON public.residents(user_id);

-- 3. Drop restrictive FOREIGN KEY constraints to public.residents(id) on:
--    - public.tenants(owner_id)
--    - public.rental_listings(owner_id)
--    - public.marketplace_products(seller_id)
--    - public.communications(author_id)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT
      tc.table_name,
      tc.constraint_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
      AND (
        (tc.table_name = 'tenants' AND kcu.column_name = 'owner_id')
        OR (tc.table_name = 'rental_listings' AND kcu.column_name = 'owner_id')
        OR (tc.table_name = 'marketplace_products' AND kcu.column_name = 'seller_id')
        OR (tc.table_name = 'communications' AND kcu.column_name = 'author_id')
      )
  LOOP
    EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT IF EXISTS %I', r.table_name, r.constraint_name);
  END LOOP;
END $$;

-- 4. Backfill residents.user_id and users.unit / users.phone for existing matched email + building_id
UPDATE public.residents AS res
SET user_id = u.id
FROM public.users AS u
WHERE res.user_id IS NULL
  AND res.building_id = u.building_id
  AND res.email IS NOT NULL
  AND lower(res.email) = lower(u.email);

UPDATE public.users AS u
SET
  unit = COALESCE(u.unit, res.unit),
  phone = COALESCE(u.phone, res.phone)
FROM public.residents AS res
WHERE u.building_id = res.building_id
  AND (
    res.user_id = u.id
    OR (res.email IS NOT NULL AND lower(res.email) = lower(u.email))
  )
  AND (u.unit IS NULL OR u.phone IS NULL);
