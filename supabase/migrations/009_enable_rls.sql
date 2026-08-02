-- RLS (Row Level Security) policies for Supabase
-- Applied after all tables are created

-- ============================================================
-- 1. ENABLE RLS ON ALL TABLES
-- ============================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parking_spots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.residents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rental_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_stats ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 2. HELPER FUNCTION: get current user's role and building_id
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.users WHERE id = auth.uid()::text LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.get_user_building_id()
RETURNS UUID AS $$
  SELECT building_id FROM public.users WHERE id = auth.uid()::text LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- 3. USERS TABLE POLICIES
-- ============================================================

-- Everyone can read their own profile
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT USING (id = auth.uid()::text);

-- super_admin can read all users
CREATE POLICY "users_select_admin" ON public.users
  FOR SELECT USING (public.get_user_role() = 'super_admin');

-- admin can read users in their building
CREATE POLICY "users_select_building" ON public.users
  FOR SELECT USING (
    public.get_user_role() = 'admin' AND building_id = public.get_user_building_id()
  );

-- super_admin can insert users
CREATE POLICY "users_insert_admin" ON public.users
  FOR INSERT WITH CHECK (public.get_user_role() = 'super_admin');

-- super_admin can update all users, admin can update users in their building
CREATE POLICY "users_update_admin" ON public.users
  FOR UPDATE USING (
    public.get_user_role() = 'super_admin'
    OR (public.get_user_role() = 'admin' AND building_id = public.get_user_building_id())
  );

-- super_admin can delete users
CREATE POLICY "users_delete_admin" ON public.users
  FOR DELETE USING (public.get_user_role() = 'super_admin');

-- ============================================================
-- 4. BUILDINGS TABLE POLICIES
-- ============================================================

-- super_admin can see all buildings
CREATE POLICY "buildings_select_admin" ON public.buildings
  FOR SELECT USING (public.get_user_role() = 'super_admin');

-- admin/vigilante can see their building
CREATE POLICY "buildings_select_building" ON public.buildings
  FOR SELECT USING (id = public.get_user_building_id());

-- usuario can see their building
CREATE POLICY "buildings_select_user" ON public.buildings
  FOR SELECT USING (id = public.get_user_building_id());

-- super_admin can manage buildings
CREATE POLICY "buildings_insert_admin" ON public.buildings
  FOR INSERT WITH CHECK (public.get_user_role() = 'super_admin');

CREATE POLICY "buildings_update_admin" ON public.buildings
  FOR UPDATE USING (public.get_user_role() = 'super_admin');

CREATE POLICY "buildings_delete_admin" ON public.buildings
  FOR DELETE USING (public.get_user_role() = 'super_admin');

-- ============================================================
-- 5. PAYMENTS TABLE POLICIES
-- ============================================================

CREATE POLICY "payments_select_admin" ON public.payments
  FOR SELECT USING (public.get_user_role() = 'super_admin');

CREATE POLICY "payments_select_building" ON public.payments
  FOR SELECT USING (
    public.get_user_role() IN ('admin', 'vigilante')
    AND building_id = public.get_user_building_id()
  );

CREATE POLICY "payments_select_user" ON public.payments
  FOR SELECT USING (
    public.get_user_role() = 'usuario'
    AND building_id = public.get_user_building_id()
  );

CREATE POLICY "payments_insert_admin" ON public.payments
  FOR INSERT WITH CHECK (
    public.get_user_role() IN ('super_admin', 'admin')
  );

CREATE POLICY "payments_update_admin" ON public.payments
  FOR UPDATE USING (
    public.get_user_role() IN ('super_admin', 'admin')
  );

CREATE POLICY "payments_delete_admin" ON public.payments
  FOR DELETE USING (public.get_user_role() = 'super_admin');

-- ============================================================
-- 6. PARKING_SPOTS TABLE POLICIES
-- ============================================================

CREATE POLICY "parking_select_all" ON public.parking_spots
  FOR SELECT USING (
    public.get_user_role() IN ('super_admin', 'admin', 'vigilante', 'usuario')
    AND building_id = public.get_user_building_id()
  );

CREATE POLICY "parking_insert_admin" ON public.parking_spots
  FOR INSERT WITH CHECK (
    public.get_user_role() IN ('super_admin', 'admin', 'vigilante')
  );

CREATE POLICY "parking_update_admin" ON public.parking_spots
  FOR UPDATE USING (
    public.get_user_role() IN ('super_admin', 'admin', 'vigilante')
  );

CREATE POLICY "parking_delete_admin" ON public.parking_spots
  FOR DELETE USING (public.get_user_role() = 'super_admin');

-- ============================================================
-- 7. VISITORS TABLE POLICIES
-- ============================================================

CREATE POLICY "visitors_select_all" ON public.visitors
  FOR SELECT USING (
    public.get_user_role() IN ('super_admin', 'admin', 'vigilante', 'usuario')
    AND building_id = public.get_user_building_id()
  );

CREATE POLICY "visitors_insert_guard" ON public.visitors
  FOR INSERT WITH CHECK (
    public.get_user_role() IN ('super_admin', 'admin', 'vigilante')
  );

CREATE POLICY "visitors_update_guard" ON public.visitors
  FOR UPDATE USING (
    public.get_user_role() IN ('super_admin', 'admin', 'vigilante')
  );

-- ============================================================
-- 8. ALERTS TABLE POLICIES
-- ============================================================

CREATE POLICY "alerts_select_all" ON public.alerts
  FOR SELECT USING (
    public.get_user_role() IN ('super_admin', 'admin', 'vigilante', 'usuario')
    AND building_id = public.get_user_building_id()
  );

CREATE POLICY "alerts_insert_admin" ON public.alerts
  FOR INSERT WITH CHECK (
    public.get_user_role() IN ('super_admin', 'admin')
  );

CREATE POLICY "alerts_update_all" ON public.alerts
  FOR UPDATE USING (
    public.get_user_role() IN ('super_admin', 'admin', 'vigilante', 'usuario')
    AND building_id = public.get_user_building_id()
  );

-- ============================================================
-- 9. RESIDENTS TABLE POLICIES
-- ============================================================

CREATE POLICY "residents_select_all" ON public.residents
  FOR SELECT USING (
    public.get_user_role() IN ('super_admin', 'admin', 'vigilante', 'usuario')
    AND building_id = public.get_user_building_id()
  );

CREATE POLICY "residents_insert_admin" ON public.residents
  FOR INSERT WITH CHECK (
    public.get_user_role() IN ('super_admin', 'admin')
  );

CREATE POLICY "residents_update_admin" ON public.residents
  FOR UPDATE USING (
    public.get_user_role() IN ('super_admin', 'admin')
  );

CREATE POLICY "residents_delete_admin" ON public.residents
  FOR DELETE USING (public.get_user_role() = 'super_admin');

-- ============================================================
-- 10. TENANTS TABLE POLICIES
-- ============================================================

CREATE POLICY "tenants_select_all" ON public.tenants
  FOR SELECT USING (
    public.get_user_role() IN ('super_admin', 'admin', 'vigilante', 'usuario')
    AND building_id = public.get_user_building_id()
  );

CREATE POLICY "tenants_insert_admin" ON public.tenants
  FOR INSERT WITH CHECK (
    public.get_user_role() IN ('super_admin', 'admin')
  );

CREATE POLICY "tenants_update_admin" ON public.tenants
  FOR UPDATE USING (
    public.get_user_role() IN ('super_admin', 'admin')
  );

CREATE POLICY "tenants_delete_admin" ON public.tenants
  FOR DELETE USING (public.get_user_role() = 'super_admin');

-- ============================================================
-- 11. TENANT_VEHICLES TABLE POLICIES
-- ============================================================

CREATE POLICY "tenant_vehicles_select_all" ON public.tenant_vehicles
  FOR SELECT USING (
    public.get_user_role() IN ('super_admin', 'admin', 'vigilante', 'usuario')
  );

CREATE POLICY "tenant_vehicles_insert_admin" ON public.tenant_vehicles
  FOR INSERT WITH CHECK (
    public.get_user_role() IN ('super_admin', 'admin')
  );

CREATE POLICY "tenant_vehicles_update_admin" ON public.tenant_vehicles
  FOR UPDATE USING (
    public.get_user_role() IN ('super_admin', 'admin')
  );

-- ============================================================
-- 12. RENTAL_LISTINGS TABLE POLICIES
-- ============================================================

CREATE POLICY "rental_listings_select_all" ON public.rental_listings
  FOR SELECT USING (
    public.get_user_role() IN ('super_admin', 'admin', 'vigilante', 'usuario')
    AND building_id = public.get_user_building_id()
  );

CREATE POLICY "rental_listings_insert_admin" ON public.rental_listings
  FOR INSERT WITH CHECK (
    public.get_user_role() IN ('super_admin', 'admin', 'usuario')
  );

CREATE POLICY "rental_listings_update_owner" ON public.rental_listings
  FOR UPDATE USING (
    public.get_user_role() = 'super_admin'
    OR owner_id IN (SELECT id FROM public.residents WHERE building_id = public.get_user_building_id())
  );

-- ============================================================
-- 13. MARKETPLACE_PRODUCTS TABLE POLICIES
-- ============================================================

CREATE POLICY "marketplace_select_all" ON public.marketplace_products
  FOR SELECT USING (
    public.get_user_role() IN ('super_admin', 'admin', 'vigilante', 'usuario')
    AND building_id = public.get_user_building_id()
  );

CREATE POLICY "marketplace_insert_admin" ON public.marketplace_products
  FOR INSERT WITH CHECK (
    public.get_user_role() IN ('super_admin', 'admin', 'usuario')
  );

CREATE POLICY "marketplace_update_owner" ON public.marketplace_products
  FOR UPDATE USING (
    public.get_user_role() = 'super_admin'
    OR seller_id IN (SELECT id FROM public.residents WHERE building_id = public.get_user_building_id())
  );

-- ============================================================
-- 14. COMMUNICATIONS TABLE POLICIES
-- ============================================================

CREATE POLICY "communications_select_all" ON public.communications
  FOR SELECT USING (
    public.get_user_role() IN ('super_admin', 'admin', 'vigilante', 'usuario')
    AND building_id = public.get_user_building_id()
  );

CREATE POLICY "communications_insert_admin" ON public.communications
  FOR INSERT WITH CHECK (
    public.get_user_role() IN ('super_admin', 'admin')
  );

CREATE POLICY "communications_update_admin" ON public.communications
  FOR UPDATE USING (
    public.get_user_role() IN ('super_admin', 'admin')
  );

-- ============================================================
-- 15. SHIFT_REPORTS TABLE POLICIES
-- ============================================================

CREATE POLICY "shift_reports_select_all" ON public.shift_reports
  FOR SELECT USING (
    public.get_user_role() IN ('super_admin', 'admin', 'vigilante')
    AND building_id = public.get_user_building_id()
  );

CREATE POLICY "shift_reports_insert_guard" ON public.shift_reports
  FOR INSERT WITH CHECK (
    public.get_user_role() IN ('super_admin', 'admin', 'vigilante')
  );

CREATE POLICY "shift_reports_update_guard" ON public.shift_reports
  FOR UPDATE USING (
    public.get_user_role() IN ('super_admin', 'admin', 'vigilante')
  );

-- ============================================================
-- 16. CHAT_MESSAGES TABLE POLICIES
-- ============================================================

CREATE POLICY "chat_messages_select_all" ON public.chat_messages
  FOR SELECT USING (
    public.get_user_role() IN ('super_admin', 'admin', 'vigilante', 'usuario')
    AND building_id = public.get_user_building_id()
  );

CREATE POLICY "chat_messages_insert_all" ON public.chat_messages
  FOR INSERT WITH CHECK (
    public.get_user_role() IN ('super_admin', 'admin', 'vigilante', 'usuario')
  );

-- ============================================================
-- 17. SYSTEM_STATS TABLE POLICIES
-- ============================================================

-- Only super_admin can read/write system stats
CREATE POLICY "system_stats_select_admin" ON public.system_stats
  FOR SELECT USING (public.get_user_role() = 'super_admin');

CREATE POLICY "system_stats_update_admin" ON public.system_stats
  FOR UPDATE USING (public.get_user_role() = 'super_admin');

CREATE POLICY "system_stats_insert_admin" ON public.system_stats
  FOR INSERT WITH CHECK (public.get_user_role() = 'super_admin');

-- ============================================================
-- 18. SERVICE ROLE BYPASS (for API routes using service key)
-- ============================================================

-- The service_role key bypasses RLS, so API routes using it work normally.
-- For user-facing queries via anon key, RLS is enforced.
