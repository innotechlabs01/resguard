-- Esquema inicial para productivo (Supabase / PostgreSQL).
-- Aplicar con: supabase db push / SQL editor / migraciones del proyecto.

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text unique,
  email text not null,
  name text not null,
  role text not null check (role in ('super_admin', 'admin', 'vigilante', 'usuario')),
  building_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists idx_users_clerk on public.users (clerk_user_id);
create index if not exists idx_users_building on public.users (building_id);

-- Habilitar RLS y políticas según el modelo de acceso (Clerk + building_id).