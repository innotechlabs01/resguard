-- Fix get_user_role / get_user_building_id to use Clerk JWT (auth.jwt()->>'sub' = users.clerk_user_id)
-- Previous version used auth.uid()::text = users.id which is always null (no Supabase auth users).

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role FROM public.users
  WHERE clerk_user_id = (auth.jwt() ->> 'sub')
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_user_building_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT building_id FROM public.users
  WHERE clerk_user_id = (auth.jwt() ->> 'sub')
  LIMIT 1;
$$;

-- Ensure functions are accessible
GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_user_building_id() TO authenticated, anon;
