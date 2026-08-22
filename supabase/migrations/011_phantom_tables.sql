-- Phantom tables: reconcile WEB queries + Mobile 002_citofono_asambleas
-- All IF NOT EXISTS for idempotent prod push

CREATE TABLE IF NOT EXISTS public.intercom_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id UUID NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  unit_number TEXT NOT NULL,
  owner_id UUID REFERENCES public.users(id),
  owner_name TEXT,
  owner_phone TEXT,
  owner_email TEXT,
  tenant_id UUID REFERENCES public.users(id),
  tenant_name TEXT,
  tenant_phone TEXT,
  tenant_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_intercom_units_building ON public.intercom_units(building_id);

CREATE TABLE IF NOT EXISTS public.intercom_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id UUID NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES public.intercom_units(id) ON DELETE SET NULL,
  unit_number TEXT NOT NULL,
  caller_type TEXT NOT NULL,
  caller_name TEXT,
  caller_message TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  responded_at TIMESTAMPTZ,
  responded_by UUID REFERENCES public.users(id),
  response_note TEXT
);
CREATE INDEX IF NOT EXISTS idx_intercom_calls_building ON public.intercom_calls(building_id);

-- Mobile aliases
CREATE TABLE IF NOT EXISTS public.intercom_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id UUID NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  unit_number TEXT NOT NULL,
  device_token TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.intercom_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id UUID NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  intercom_call_id UUID REFERENCES public.intercom_calls(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.assemblies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id UUID NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  date DATE,
  time TEXT,
  location TEXT,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'scheduled',
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_assemblies_building ON public.assemblies(building_id);

CREATE TABLE IF NOT EXISTS public.agenda_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assembly_id UUID NOT NULL REFERENCES public.assemblies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  vote_type TEXT,
  options JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.assembly_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assembly_id UUID NOT NULL REFERENCES public.assemblies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  options TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  required_quorum INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.users(id)
);
CREATE TABLE IF NOT EXISTS public.votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agenda_item_id UUID REFERENCES public.agenda_items(id) ON DELETE CASCADE,
  assembly_vote_id UUID REFERENCES public.assembly_votes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id),
  encrypted_vote TEXT,
  vote_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(agenda_item_id, user_id)
);
CREATE TABLE IF NOT EXISTS public.assembly_vote_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vote_id UUID NOT NULL REFERENCES public.assembly_votes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id),
  user_name TEXT NOT NULL,
  unit TEXT NOT NULL,
  option_id TEXT NOT NULL,
  voted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.payment_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
  clerk_user_id TEXT,
  prev_status TEXT,
  new_status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_payment_audits_payment ON public.payment_audits(payment_id);

CREATE TABLE IF NOT EXISTS public.app_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.device_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  token TEXT NOT NULL,
  platform TEXT,
  role TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_device_tokens_user ON public.device_tokens(user_id);
