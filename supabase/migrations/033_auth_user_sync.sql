-- 033_auth_user_sync.sql
-- Auth lifecycle: sync auth.users → public.users on signup.
-- Fixes N7: self sign-up previously created an auth account with NO profile
-- row → requireAuth returned 401 → account was unusable.
--
-- New users get role 'usuario' with null building_id (unassigned).
-- An admin/super_admin later assigns them to a building via the web panel.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role, building_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    'usuario',
    NULL
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop if exists to allow re-run
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
