-- Migración 030: planes de suscripción SaaS (plans, subscriptions, subscription_events).
-- planes reales en COP, RLS en las 3 tablas, índice parcial único: 1 suscripción
-- activa por edificio.

-- ---------------------------------------------------------------------------
-- plans (catálogo público, readable por cualquier autenticado)
-- ---------------------------------------------------------------------------
create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[a-z0-9_-]+$'),
  name text not null,
  description text,
  price_cop integer not null check (price_cop >= 0),
  billing_interval text not null default 'monthly' check (billing_interval in ('monthly', 'yearly')),
  max_units integer check (max_units is null or max_units > 0),
  features jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.plans enable row level security;

-- Lectura pública del catálogo: cualquier usuario autenticado puede listar planes activos.
create policy "plans: authenticated read"
on public.plans
for select
to authenticated
using (is_active = true);

-- Escritura del catálogo solo vía service_role (API routes web). Sin política
-- de insert/update/delete para authenticated/anon: el catálogo lo administra
-- el equipo ResGuard desde el backend con service_role.

-- ---------------------------------------------------------------------------
-- subscriptions (1 suscripción activa por edificio)
-- ---------------------------------------------------------------------------
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  -- Sin FK a buildings: esa tabla no existe en las migraciones locales
  -- (ver deuda conocida en AGENTS.md). El filtro multi-tenant se hace por
  -- users.building_id en RLS y en las API routes.
  building_id uuid not null,
  plan_id uuid not null references public.plans (id),
  status text not null default 'trial' check (status in ('trial', 'active', 'past_due', 'canceled')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  canceled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_subscriptions_building on public.subscriptions (building_id);
create index if not exists idx_subscriptions_plan on public.subscriptions (plan_id);
create index if not exists idx_subscriptions_status on public.subscriptions (status);

-- Índice parcial único: un edificio solo puede tener UNA suscripción activa.
-- trial/past_due/canceled no bloquean; solo 'active' exige exclusividad.
create unique index if not exists subscriptions_one_active_per_building
on public.subscriptions (building_id)
where status = 'active';

alter table public.subscriptions enable row level security;

-- Lectura: el usuario solo ve la suscripción de SU edificio.
create policy "subscriptions: read own building"
on public.subscriptions
for select
to authenticated
using (
  exists (
    select 1 from public.users u
    where u.id = auth.uid()
      and u.building_id = subscriptions.building_id
  )
);

-- Escritura solo via service_role (webhooks de Bold / API routes web). Sin
-- políticas insert/update/delete para authenticated: crear, cambiar o
-- cancelar suscripciones siempre pasa por el backend.

-- ---------------------------------------------------------------------------
-- subscription_events (audit log de ciclo de vida)
-- ---------------------------------------------------------------------------
create table if not exists public.subscription_events (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.subscriptions (id) on delete cascade,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_subscription_events_sub
on public.subscription_events (subscription_id, created_at desc);

alter table public.subscription_events enable row level security;

-- Lectura: el usuario solo ve eventos de suscripciones de SU edificio.
create policy "subscription_events: read own building"
on public.subscription_events
for select
to authenticated
using (
  exists (
    select 1
    from public.subscriptions s
    join public.users u on u.building_id = s.building_id
    where s.id = subscription_events.subscription_id
      and u.id = auth.uid()
  )
);

-- Escritura solo via service_role (los eventos los emite el backend).

-- ---------------------------------------------------------------------------
-- Seed: 3 planes reales con precios en COP.
-- on conflict (code) protege la idempotencia del push.
-- ---------------------------------------------------------------------------
insert into public.plans (code, name, description, price_cop, billing_interval, max_units, features) values
  ('basic', 'Plan Básico',
   'Para conjuntos pequeños que inician la digitalización: residentes, avisos y portería básica.',
   99000, 'monthly', 50,
   '["residentes", "avisos", "porteria"]'::jsonb),
  ('pro', 'Plan Profesional',
   'Para conjuntos medianos: todo lo del Básico más reservas, pagos Bold y reportería.',
   199000, 'monthly', 150,
   '["residentes", "avisos", "porteria", "reservas", "pagos", "reportes"]'::jsonb),
  ('premium', 'Plan Premium',
   'Para conjuntos grandes: todo lo del Profesional más helpdesk, votaciones y soporte prioritario.',
   349000, 'monthly', null,
   '["residentes", "avisos", "porteria", "reservas", "pagos", "reportes", "helpdesk", "votaciones", "soporte_prioritario"]'::jsonb)
on conflict (code) do update set
  name = excluded.name,
  description = excluded.description,
  price_cop = excluded.price_cop,
  billing_interval = excluded.billing_interval,
  max_units = excluded.max_units,
  features = excluded.features,
  is_active = true;
