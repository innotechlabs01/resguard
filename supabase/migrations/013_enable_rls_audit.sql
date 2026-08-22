-- Re-enable RLS on phantom tables and fix permissive WITH CHECK (true)

ALTER TABLE public.intercom_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intercom_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intercom_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intercom_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assemblies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agenda_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assembly_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assembly_vote_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_tokens ENABLE ROW LEVEL SECURITY;

-- Drop overly permissive policies from 010
DROP POLICY IF EXISTS "Service role can insert notifications" ON public.app_notifications;
DROP POLICY IF EXISTS "Service role can update notifications" ON public.app_notifications;
DROP POLICY IF EXISTS "Service role can insert device tokens" ON public.device_tokens;
DROP POLICY IF EXISTS "Service role can update device tokens" ON public.device_tokens;
DROP POLICY IF EXISTS "Service role can delete device tokens" ON public.device_tokens;

-- Corrected policies: service_role bypasses RLS, so these apply to anon/authenticated (Clerk JWT)
-- app_notifications: user reads own + service inserts
CREATE POLICY "app_notifications_select_own" ON public.app_notifications
  FOR SELECT USING (
    user_id = (auth.jwt() ->> 'sub') OR public.get_user_role() IN ('admin','super_admin')
  );
CREATE POLICY "app_notifications_insert_service" ON public.app_notifications
  FOR INSERT WITH CHECK (
    public.get_user_role() IN ('admin','super_admin') OR user_id = (auth.jwt() ->> 'sub')
  );

-- device_tokens: owner can read/insert own
CREATE POLICY "device_tokens_select_own" ON public.device_tokens
  FOR SELECT USING (user_id = (auth.jwt() ->> 'sub') OR public.get_user_role() IN ('admin','super_admin'));
CREATE POLICY "device_tokens_insert_own" ON public.device_tokens
  FOR INSERT WITH CHECK (user_id = (auth.jwt() ->> 'sub'));
CREATE POLICY "device_tokens_update_own" ON public.device_tokens
  FOR UPDATE USING (user_id = (auth.jwt() ->> 'sub')) WITH CHECK (user_id = (auth.jwt() ->> 'sub'));

-- Phantom tables: building-scoped read
CREATE POLICY "intercom_units_select_building" ON public.intercom_units
  FOR SELECT USING (building_id = public.get_user_building_id() OR public.get_user_role() = 'super_admin');
CREATE POLICY "intercom_calls_select_building" ON public.intercom_calls
  FOR SELECT USING (building_id = public.get_user_building_id() OR public.get_user_role() = 'super_admin');
CREATE POLICY "assemblies_select_building" ON public.assemblies
  FOR SELECT USING (building_id = public.get_user_building_id() OR public.get_user_role() = 'super_admin');
CREATE POLICY "assemblies_insert_admin" ON public.assemblies
  FOR INSERT WITH CHECK (public.get_user_role() IN ('admin','super_admin'));
CREATE POLICY "agenda_items_select_building" ON public.agenda_items
  FOR SELECT USING (
    assembly_id IN (SELECT id FROM public.assemblies WHERE building_id = public.get_user_building_id())
    OR public.get_user_role() = 'super_admin'
  );
CREATE POLICY "votes_select_own" ON public.votes
  FOR SELECT USING (user_id IN (SELECT id FROM public.users WHERE clerk_user_id = (auth.jwt() ->> 'sub')) OR public.get_user_role() IN ('admin','super_admin'));
CREATE POLICY "votes_insert_own" ON public.votes
  FOR INSERT WITH CHECK (user_id IN (SELECT id FROM public.users WHERE clerk_user_id = (auth.jwt() ->> 'sub')));

-- payment_audits: admin read
CREATE POLICY "payment_audits_select_admin" ON public.payment_audits
  FOR SELECT USING (public.get_user_role() IN ('admin','super_admin'));
CREATE POLICY "payment_audits_insert_admin" ON public.payment_audits
  FOR INSERT WITH CHECK (public.get_user_role() IN ('admin','super_admin'));
