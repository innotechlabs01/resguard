-- 032_rls_hardening.sql
-- Comprehensive RLS hardening: fixes H3 (write policies without building scope),
-- N1 (026 policies without building scope), role escalation via users UPDATE,
-- broken votes policies (clerk_user_id), and ticket_events (WITH CHECK true).
--
-- Applies to: all tables with INSERT/UPDATE policies missing building_id scoping.
-- Pattern: super_admin operates on any building; admin/vigilante/usuario scoped
-- to their own building via get_user_building_id().

-- ============================================================
-- 1. ROLE ESCALATION GUARD: trigger on public.users
--    Prevents any non-super_admin from changing role or building_id
--    via direct UPDATE (mobile anon key surface). The web API already
--    enforces this in requireAuth/PUT handler, but RLS is the only
--    defense for the mobile anon-key connection.
-- ============================================================

CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS TRIGGER AS $$
BEGIN
  -- Only fire when role or building assignment changes
  IF (NEW.role IS DISTINCT FROM OLD.role)
     OR (NEW.building_id IS DISTINCT FROM OLD.building_id) THEN
    IF public.get_user_role() IS DISTINCT FROM 'super_admin' THEN
      RAISE EXCEPTION 'FORBIDDEN: only super_admin can change role or building assignment'
        USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop if exists to allow re-run
DROP TRIGGER IF EXISTS prevent_role_escalation_trigger ON public.users;
CREATE TRIGGER prevent_role_escalation_trigger
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_role_escalation();

-- ============================================================
-- 2. USERS: add self-update policy (profile fields only; trigger
--    above blocks role/building_id changes)
-- ============================================================

DROP POLICY IF EXISTS "users_update_own" ON public.users;
CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (id::text = auth.uid()::text);

-- ============================================================
-- 3. PAYMENTS: scope INSERT/UPDATE by building
-- ============================================================

DROP POLICY IF EXISTS "payments_insert_admin" ON public.payments;
CREATE POLICY "payments_insert_admin" ON public.payments
  FOR INSERT WITH CHECK (
    public.get_user_role() = 'super_admin'
    OR (public.get_user_role() = 'admin' AND building_id = public.get_user_building_id())
  );

DROP POLICY IF EXISTS "payments_update_admin" ON public.payments;
CREATE POLICY "payments_update_admin" ON public.payments
  FOR UPDATE USING (
    public.get_user_role() = 'super_admin'
    OR (public.get_user_role() = 'admin' AND building_id = public.get_user_building_id())
  );

-- ============================================================
-- 4. PARKING_SPOTS: scope INSERT/UPDATE by building
-- ============================================================

DROP POLICY IF EXISTS "parking_insert_admin" ON public.parking_spots;
CREATE POLICY "parking_insert_admin" ON public.parking_spots
  FOR INSERT WITH CHECK (
    public.get_user_role() = 'super_admin'
    OR (public.get_user_role() IN ('admin', 'vigilante') AND building_id = public.get_user_building_id())
  );

DROP POLICY IF EXISTS "parking_update_admin" ON public.parking_spots;
CREATE POLICY "parking_update_admin" ON public.parking_spots
  FOR UPDATE USING (
    public.get_user_role() = 'super_admin'
    OR (public.get_user_role() IN ('admin', 'vigilante') AND building_id = public.get_user_building_id())
  );

-- ============================================================
-- 5. VISITORS: scope INSERT/UPDATE by building
-- ============================================================

DROP POLICY IF EXISTS "visitors_insert_guard" ON public.visitors;
CREATE POLICY "visitors_insert_guard" ON public.visitors
  FOR INSERT WITH CHECK (
    public.get_user_role() = 'super_admin'
    OR (public.get_user_role() IN ('admin', 'vigilante') AND building_id = public.get_user_building_id())
  );

DROP POLICY IF EXISTS "visitors_update_guard" ON public.visitors;
CREATE POLICY "visitors_update_guard" ON public.visitors
  FOR UPDATE USING (
    public.get_user_role() = 'super_admin'
    OR (public.get_user_role() IN ('admin', 'vigilante') AND building_id = public.get_user_building_id())
  );

-- ============================================================
-- 6. ALERTS: scope INSERT by building
-- ============================================================

DROP POLICY IF EXISTS "alerts_insert_admin" ON public.alerts;
CREATE POLICY "alerts_insert_admin" ON public.alerts
  FOR INSERT WITH CHECK (
    public.get_user_role() = 'super_admin'
    OR (public.get_user_role() = 'admin' AND building_id = public.get_user_building_id())
  );

-- ============================================================
-- 7. RESIDENTS: scope INSERT/UPDATE/DELETE by building
-- ============================================================

DROP POLICY IF EXISTS "residents_insert_admin" ON public.residents;
CREATE POLICY "residents_insert_admin" ON public.residents
  FOR INSERT WITH CHECK (
    public.get_user_role() = 'super_admin'
    OR (public.get_user_role() = 'admin' AND building_id = public.get_user_building_id())
  );

DROP POLICY IF EXISTS "residents_update_admin" ON public.residents;
CREATE POLICY "residents_update_admin" ON public.residents
  FOR UPDATE USING (
    public.get_user_role() = 'super_admin'
    OR (public.get_user_role() = 'admin' AND building_id = public.get_user_building_id())
  );

DROP POLICY IF EXISTS "residents_delete_admin" ON public.residents;
CREATE POLICY "residents_delete_admin" ON public.residents
  FOR DELETE USING (
    public.get_user_role() = 'super_admin'
    OR (public.get_user_role() = 'admin' AND building_id = public.get_user_building_id())
  );

-- ============================================================
-- 8. TENANTS: scope INSERT/UPDATE/DELETE by building
-- ============================================================

DROP POLICY IF EXISTS "tenants_insert_admin" ON public.tenants;
CREATE POLICY "tenants_insert_admin" ON public.tenants
  FOR INSERT WITH CHECK (
    public.get_user_role() = 'super_admin'
    OR (public.get_user_role() = 'admin' AND building_id = public.get_user_building_id())
  );

DROP POLICY IF EXISTS "tenants_update_admin" ON public.tenants;
CREATE POLICY "tenants_update_admin" ON public.tenants
  FOR UPDATE USING (
    public.get_user_role() = 'super_admin'
    OR (public.get_user_role() = 'admin' AND building_id = public.get_user_building_id())
  );

DROP POLICY IF EXISTS "tenants_delete_admin" ON public.tenants;
CREATE POLICY "tenants_delete_admin" ON public.tenants
  FOR DELETE USING (
    public.get_user_role() = 'super_admin'
    OR (public.get_user_role() = 'admin' AND building_id = public.get_user_building_id())
  );

-- ============================================================
-- 9. TENANT_VEHICLES: scope INSERT/UPDATE by building
-- ============================================================

DROP POLICY IF EXISTS "tenant_vehicles_insert_admin" ON public.tenant_vehicles;
CREATE POLICY "tenant_vehicles_insert_admin" ON public.tenant_vehicles
  FOR INSERT WITH CHECK (
    public.get_user_role() = 'super_admin'
    OR (public.get_user_role() = 'admin' AND building_id = public.get_user_building_id())
  );

DROP POLICY IF EXISTS "tenant_vehicles_update_admin" ON public.tenant_vehicles;
CREATE POLICY "tenant_vehicles_update_admin" ON public.tenant_vehicles
  FOR UPDATE USING (
    public.get_user_role() = 'super_admin'
    OR (public.get_user_role() = 'admin' AND building_id = public.get_user_building_id())
  );

-- ============================================================
-- 10. RENTAL_LISTINGS: scope INSERT by building
-- ============================================================

DROP POLICY IF EXISTS "rental_listings_insert_admin" ON public.rental_listings;
CREATE POLICY "rental_listings_insert_admin" ON public.rental_listings
  FOR INSERT WITH CHECK (
    public.get_user_role() = 'super_admin'
    OR (public.get_user_role() IN ('admin', 'usuario') AND building_id = public.get_user_building_id())
  );

-- ============================================================
-- 11. MARKETPLACE_PRODUCTS: scope INSERT by building
-- ============================================================

DROP POLICY IF EXISTS "marketplace_insert_admin" ON public.marketplace_products;
CREATE POLICY "marketplace_insert_admin" ON public.marketplace_products
  FOR INSERT WITH CHECK (
    public.get_user_role() = 'super_admin'
    OR (public.get_user_role() IN ('admin', 'usuario') AND building_id = public.get_user_building_id())
  );

-- ============================================================
-- 12. COMMUNICATIONS: scope INSERT/UPDATE by building
-- ============================================================

DROP POLICY IF EXISTS "communications_insert_admin" ON public.communications;
CREATE POLICY "communications_insert_admin" ON public.communications
  FOR INSERT WITH CHECK (
    public.get_user_role() = 'super_admin'
    OR (public.get_user_role() = 'admin' AND building_id = public.get_user_building_id())
  );

DROP POLICY IF EXISTS "communications_update_admin" ON public.communications;
CREATE POLICY "communications_update_admin" ON public.communications
  FOR UPDATE USING (
    public.get_user_role() = 'super_admin'
    OR (public.get_user_role() = 'admin' AND building_id = public.get_user_building_id())
  );

-- ============================================================
-- 13. SHIFT_REPORTS: scope INSERT/UPDATE by building
-- ============================================================

DROP POLICY IF EXISTS "shift_reports_insert_guard" ON public.shift_reports;
CREATE POLICY "shift_reports_insert_guard" ON public.shift_reports
  FOR INSERT WITH CHECK (
    public.get_user_role() = 'super_admin'
    OR (public.get_user_role() IN ('admin', 'vigilante') AND building_id = public.get_user_building_id())
  );

DROP POLICY IF EXISTS "shift_reports_update_guard" ON public.shift_reports;
CREATE POLICY "shift_reports_update_guard" ON public.shift_reports
  FOR UPDATE USING (
    public.get_user_role() = 'super_admin'
    OR (public.get_user_role() IN ('admin', 'vigilante') AND building_id = public.get_user_building_id())
  );

-- ============================================================
-- 14. CHAT_MESSAGES: scope INSERT by building
-- ============================================================

DROP POLICY IF EXISTS "chat_messages_insert_all" ON public.chat_messages;
CREATE POLICY "chat_messages_insert_all" ON public.chat_messages
  FOR INSERT WITH CHECK (
    public.get_user_role() = 'super_admin'
    OR (public.get_user_role() IN ('admin', 'vigilante', 'usuario') AND building_id = public.get_user_building_id())
  );

-- ============================================================
-- 15. ASSEMBLIES (from 013): scope INSERT by building
-- ============================================================

DROP POLICY IF EXISTS "assemblies_insert_admin" ON public.assemblies;
CREATE POLICY "assemblies_insert_admin" ON public.assemblies
  FOR INSERT WITH CHECK (
    public.get_user_role() = 'super_admin'
    OR (public.get_user_role() = 'admin' AND building_id = public.get_user_building_id())
  );

-- ============================================================
-- 16. AGENDA_ITEMS (from 026): scope INSERT/UPDATE by building (indirect via assemblies)
-- ============================================================

DROP POLICY IF EXISTS "agenda_items_insert_admin" ON public.agenda_items;
CREATE POLICY "agenda_items_insert_admin" ON public.agenda_items
  FOR INSERT WITH CHECK (
    public.get_user_role() = 'super_admin'
    OR (
      public.get_user_role() = 'admin'
      AND assembly_id IN (
        SELECT id FROM public.assemblies WHERE building_id = public.get_user_building_id()
      )
    )
  );

DROP POLICY IF EXISTS "agenda_items_update_admin" ON public.agenda_items;
CREATE POLICY "agenda_items_update_admin" ON public.agenda_items
  FOR UPDATE USING (
    public.get_user_role() = 'super_admin'
    OR (
      public.get_user_role() = 'admin'
      AND assembly_id IN (
        SELECT id FROM public.assemblies WHERE building_id = public.get_user_building_id()
      )
    )
  );

-- ============================================================
-- 17. ASSEMBLIES UPDATE (from 026): scope by building
-- ============================================================

DROP POLICY IF EXISTS "assemblies_update_admin" ON public.assemblies;
CREATE POLICY "assemblies_update_admin" ON public.assemblies
  FOR UPDATE USING (
    public.get_user_role() = 'super_admin'
    OR (public.get_user_role() = 'admin' AND building_id = public.get_user_building_id())
  );

-- ============================================================
-- 18. VOTES (from 013): fix broken clerk_user_id references.
--     users.id = auth.uid() (Supabase model), not clerk_user_id.
-- ============================================================

DROP POLICY IF EXISTS "votes_select_own" ON public.votes;
CREATE POLICY "votes_select_own" ON public.votes
  FOR SELECT USING (
    user_id = auth.uid()
    OR (
      public.get_user_role() IN ('admin', 'super_admin')
      AND user_id IN (
        SELECT id FROM public.users WHERE building_id = public.get_user_building_id()
      )
    )
  );

DROP POLICY IF EXISTS "votes_insert_own" ON public.votes;
CREATE POLICY "votes_insert_own" ON public.votes
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND agenda_item_id IN (
      SELECT ai.id FROM public.agenda_items ai
      JOIN public.assemblies a ON a.id = ai.assembly_id
      WHERE a.building_id = public.get_user_building_id()
    )
  );

-- ============================================================
-- 19. PAYMENT_AUDITS (from 013): scope by building (indirect via payments)
-- ============================================================

DROP POLICY IF EXISTS "payment_audits_insert_admin" ON public.payment_audits;
CREATE POLICY "payment_audits_insert_admin" ON public.payment_audits
  FOR INSERT WITH CHECK (
    public.get_user_role() IN ('admin', 'super_admin')
    AND payment_id IN (
      SELECT id FROM public.payments WHERE building_id = public.get_user_building_id()
    )
  );

-- ============================================================
-- 20. TICKET_EVENTS (from 024): replace WITH CHECK (true) with building scope
--     ticket_events has no building_id; entity_id references pqrs or infraction_reports
-- ============================================================

DROP POLICY IF EXISTS "ticket_events_insert" ON public.ticket_events;
CREATE POLICY "ticket_events_insert" ON public.ticket_events
  FOR INSERT WITH CHECK (
    -- entity_type='pqrs': entity_id is a pqrs.id in the caller's building
    (entity_type = 'pqrs' AND entity_id IN (
      SELECT id FROM public.pqrs WHERE building_id = public.get_user_building_id()
    ))
    OR
    -- entity_type='infraction': entity_id is an infraction_reports.id in the caller's building
    (entity_type = 'infraction' AND entity_id IN (
      SELECT id FROM public.infraction_reports WHERE building_id = public.get_user_building_id()
    ))
  );

-- ============================================================
-- 21. DEVICE_TOKENS (from 013): restrict admin SELECT to own building
-- ============================================================

DROP POLICY IF EXISTS "device_tokens_select_own" ON public.device_tokens;
CREATE POLICY "device_tokens_select_own" ON public.device_tokens
  FOR SELECT USING (
    user_id = auth.uid()
    OR (
      public.get_user_role() IN ('admin', 'super_admin')
      AND user_id IN (
        SELECT id FROM public.users WHERE building_id = public.get_user_building_id()
      )
    )
  );

-- ============================================================
-- 22. APP_NOTIFICATIONS (from 010): ensure SELECT scoped to own user_id
-- ============================================================

DROP POLICY IF EXISTS "app_notifications_select_own" ON public.app_notifications;
CREATE POLICY "app_notifications_select_own" ON public.app_notifications
  FOR SELECT USING (
    user_id = auth.uid()::text
    OR (
      public.get_user_role() IN ('admin', 'super_admin')
      AND user_id IN (
        SELECT id::text FROM public.users WHERE building_id = public.get_user_building_id()
      )
    )
  );
