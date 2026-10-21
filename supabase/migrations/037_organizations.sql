-- 037_organizations.sql
-- Multi-tenant foundation: organizations as the contracting client,
-- memberships linking users to orgs, plan limits, subscription restructure.
--
-- Design decisions:
-- - organizations can represent: hogar (1 building), grupo (2-5),
--   comunidad, inmobiliaria (N buildings)
-- - subscription follows the ORGANIZATION (contracting client), not each building
-- - all new columns are NULLABLE for backward compatibility with existing data
-- - existing buildings without organization_id continue to work (legacy mode)
-- - grace period: 5 calendar days after period_end before blocking

-- ============================================================
-- 1. ORGANIZATIONS — the tenant / contracting client
-- ============================================================

CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('hogar', 'grupo', 'comunidad', 'inmobiliaria')),
  owner_user_id UUID REFERENCES public.users(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'blocked', 'canceled')),
  contact_email TEXT,
  contact_phone TEXT,
  created_by_user_id UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_organizations_owner ON public.organizations(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_organizations_type ON public.organizations(type);

-- ============================================================
-- 2. ORGANIZATION_MEMBERS — user ↔ organization relationship
-- ============================================================

CREATE TABLE IF NOT EXISTS public.organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('titular', 'admin', 'resident')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'invited', 'revoked', 'expired')),
  invited_by_user_id UUID REFERENCES public.users(id),
  invited_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_org_members_org ON public.organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_role ON public.organization_members(role, status);

-- ============================================================
-- 3. BUILDINGS — add organization_id (nullable for legacy compat)
-- ============================================================

ALTER TABLE public.buildings
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_buildings_organization ON public.buildings(organization_id);

-- ============================================================
-- 4. USERS — add organization_id for quick lookup (derived from members)
-- ============================================================

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_users_organization ON public.users(organization_id);

-- ============================================================
-- 5. PLANS — add multi-tenant limits
-- ============================================================

ALTER TABLE public.plans
  ADD COLUMN IF NOT EXISTS max_buildings INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS max_admin_users INTEGER DEFAULT 3,
  ADD COLUMN IF NOT EXISTS organization_types TEXT[] DEFAULT ARRAY['hogar'];

-- Seed the 3 commercial tiers with proper limits
UPDATE public.plans SET
  max_buildings = 1,
  max_admin_users = 2,
  organization_types = ARRAY['hogar']
WHERE code = 'basico';

UPDATE public.plans SET
  max_buildings = 5,
  max_admin_users = 10,
  organization_types = ARRAY['grupo', 'comunidad']
WHERE code = 'profesional';

UPDATE public.plans SET
  max_buildings = 1000,
  max_admin_users = 100,
  organization_types = ARRAY['comunidad', 'inmobiliaria']
WHERE code = 'corporativo';

-- ============================================================
-- 6. SUBSCRIPTIONS — add organization_id + grace period
-- ============================================================

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS grace_period_end TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_subscriptions_organization ON public.subscriptions(organization_id);

-- ============================================================
-- 7. AUDIT_LOG — privileged actions (super_admin, role changes, org ops)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID REFERENCES public.users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_actor ON public.audit_log(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON public.audit_log(created_at DESC);

-- ============================================================
-- 8. HELPER: get user's organization(s)
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_user_org_id()
RETURNS UUID AS $$
  SELECT organization_id FROM public.users WHERE id::text = auth.uid()::text LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.get_user_org_role()
RETURNS TEXT AS $$
  SELECT om.role FROM public.organization_members om
  WHERE om.user_id::text = auth.uid()::text AND om.status = 'active'
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- 9. HELPER: subscription status for an organization
--    Returns: 'active', 'grace_period', 'blocked', 'none'
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_org_subscription_status(org_id UUID)
RETURNS TEXT AS $$
DECLARE
  sub_status TEXT;
  sub_period_end TIMESTAMPTZ;
  sub_grace_end TIMESTAMPTZ;
  sub_blocked_at TIMESTAMPTZ;
BEGIN
  SELECT status, current_period_end, grace_period_end, blocked_at
  INTO sub_status, sub_period_end, sub_grace_end, sub_blocked_at
  FROM public.subscriptions
  WHERE organization_id = org_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN 'none';
  END IF;

  IF sub_blocked_at IS NOT NULL THEN
    RETURN 'blocked';
  END IF;

  IF sub_status = 'active' AND sub_period_end > now() THEN
    RETURN 'active';
  END IF;

  -- Period ended: check grace
  IF sub_grace_end IS NOT NULL AND sub_grace_end > now() THEN
    RETURN 'grace_period';
  END IF;

  -- Grace expired
  RETURN 'blocked';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================
-- 10. RLS POLICIES
-- ============================================================

-- organizations: members can read their org; super_admin can read all
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_select_member" ON public.organizations
  FOR SELECT USING (
    id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id::text = auth.uid()::text AND status = 'active'
    )
    OR owner_user_id::text = auth.uid()::text
    OR public.get_user_role() = 'super_admin'
  );

CREATE POLICY "org_insert_authenticated" ON public.organizations
  FOR INSERT WITH CHECK (
    owner_user_id::text = auth.uid()::text
    OR public.get_user_role() = 'super_admin'
  );

CREATE POLICY "org_update_owner_admin" ON public.organizations
  FOR UPDATE USING (
    owner_user_id::text = auth.uid()::text
    OR public.get_user_role() = 'super_admin'
    OR (
      EXISTS (
        SELECT 1 FROM public.organization_members om
        WHERE om.user_id::text = auth.uid()::text
          AND om.organization_id = id
          AND om.role IN ('titular', 'admin')
          AND om.status = 'active'
      )
    )
  );

-- organization_members: members can see their org's members
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_members_select" ON public.organization_members
  FOR SELECT USING (
    user_id::text = auth.uid()::text
    OR organization_id = public.get_user_org_id()
    OR public.get_user_role() = 'super_admin'
  );

CREATE POLICY "org_members_insert" ON public.organization_members
  FOR INSERT WITH CHECK (
    -- Only org owner, org admin, or super_admin can invite
    public.get_user_role() = 'super_admin'
    OR EXISTS (
      SELECT 1 FROM public.organizations o
      WHERE o.id = organization_id
        AND o.owner_user_id::text = auth.uid()::text
    )
    OR EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = organization_id
        AND om.user_id::text = auth.uid()::text
        AND om.role IN ('titular', 'admin')
        AND om.status = 'active'
    )
  );

CREATE POLICY "org_members_update" ON public.organization_members
  FOR UPDATE USING (
    user_id::text = auth.uid()::text
    OR public.get_user_role() = 'super_admin'
    OR EXISTS (
      SELECT 1 FROM public.organization_members om2
      WHERE om2.organization_id = organization_id
        AND om2.user_id::text = auth.uid()::text
        AND om2.role IN ('titular', 'admin')
        AND om2.status = 'active'
    )
  );

CREATE POLICY "org_members_delete" ON public.organization_members
  FOR DELETE USING (
    public.get_user_role() = 'super_admin'
    OR EXISTS (
      SELECT 1 FROM public.organization_members om2
      WHERE om2.organization_id = organization_id
        AND om2.user_id::text = auth.uid()::text
        AND om2.role = 'titular'
        AND om2.status = 'active'
    )
  );

-- audit_log: only super_admin can read
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_select_super" ON public.audit_log
  FOR SELECT USING (public.get_user_role() = 'super_admin');

-- service_role inserts (via API routes)
CREATE POLICY "audit_insert_service" ON public.audit_log
  FOR INSERT WITH CHECK (true);

-- ============================================================
-- 11. Buildings RLS update: add organization-based access
-- ============================================================

-- New policy: org members can see buildings in their organization
CREATE POLICY "buildings_select_org_member" ON public.buildings
  FOR SELECT USING (
    organization_id IN (
      SELECT om.organization_id FROM public.organization_members om
      WHERE om.user_id::text = auth.uid()::text AND om.status = 'active'
    )
  );

-- ============================================================
-- 12. NOTIFICATIONS about subscription status changes
-- ============================================================

-- Helper to move subscription to blocked state after grace expires
CREATE OR REPLACE FUNCTION public.check_and_block_expired_subscriptions()
RETURNS INTEGER AS $$
DECLARE
  blocked_count INTEGER := 0;
BEGIN
  UPDATE public.subscriptions
  SET status = 'blocked', blocked_at = now(), updated_at = now()
  WHERE grace_period_end IS NOT NULL
    AND grace_period_end < now()
    AND status NOT IN ('blocked', 'canceled');

  GET DIAGNOSTICS blocked_count = ROW_COUNT;
  RETURN blocked_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
