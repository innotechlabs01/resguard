-- 036_sales_leads.sql
-- Sales leads from the landing page contact form.
-- Captures potential customers (property managers) for the sales team.

CREATE TABLE IF NOT EXISTS public.sales_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company_name TEXT,
  building_count INTEGER DEFAULT 1,
  unit_count INTEGER,
  interest TEXT,
  message TEXT,
  plan_interest TEXT CHECK (plan_interest IN ('basico', 'profesional', 'corporativo', 'no_se')),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'demo', 'negotiation', 'won', 'lost')),
  source TEXT DEFAULT 'landing',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sales_leads_status ON public.sales_leads(status);
CREATE INDEX IF NOT EXISTS idx_sales_leads_created ON public.sales_leads(created_at DESC);

-- Public INSERT (landing form, anonymous)
CREATE POLICY "sales_leads_insert_public" ON public.sales_leads
  FOR INSERT WITH CHECK (true);

-- Only super_admin can read/manage leads
CREATE POLICY "sales_leads_select_admin" ON public.sales_leads
  FOR SELECT USING (public.get_user_role() = 'super_admin');

CREATE POLICY "sales_leads_update_admin" ON public.sales_leads
  FOR UPDATE USING (public.get_user_role() = 'super_admin');

CREATE POLICY "sales_leads_delete_admin" ON public.sales_leads
  FOR DELETE USING (public.get_user_role() = 'super_admin');
