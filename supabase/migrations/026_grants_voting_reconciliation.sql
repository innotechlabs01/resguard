-- 026: grants + reconciled voting model (agenda_items + votes as source of truth)
--
-- Blocked root cause: migrations never granted DML to anon/authenticated/service_role,
-- so every REST call returned 42501 (permission denied) and the web backend could not
-- reach the local Supabase. RLS remains ENABLED on every table; grants do not disable it.

-- 1. Schema usage + DML grants (RLS still enforced row-by-row)
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO anon, authenticated, service_role;

-- 2. agenda_items: admin create/update policies (SELECT building-scoped policy already exists)
CREATE POLICY agenda_items_insert_admin ON agenda_items
  FOR INSERT
  WITH CHECK (get_user_role() = ANY (ARRAY['admin'::text, 'super_admin'::text]));

CREATE POLICY agenda_items_update_admin ON agenda_items
  FOR UPDATE
  USING (get_user_role() = ANY (ARRAY['admin'::text, 'super_admin'::text]));

-- 3. assemblies: admin update policy for lifecycle (INSERT/SELECT policies already exist)
CREATE POLICY assemblies_update_admin ON assemblies
  FOR UPDATE
  USING (get_user_role() = ANY (ARRAY['admin'::text, 'super_admin'::text]));

-- 4. votes: add plaintext option_id so the server can tally without disclosing individual
--    ballots to clients. encrypted_vote + vote_hash remain for audit/proof.
ALTER TABLE public.votes ADD COLUMN IF NOT EXISTS option_id TEXT;

-- 5. Legacy parallel model (assembly_votes / assembly_vote_responses) is DEPRECATED.
--    Tables are left in place (RLS ON, no policies) for a later archive migration;
--    no new code path will write to them.