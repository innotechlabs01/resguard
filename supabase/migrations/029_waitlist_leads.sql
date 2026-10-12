-- T-020: waitlist leads captured from the public landing page.
-- Email-only form (nombre/conjunto/teléfono quedan para el follow-up humano).

create table if not exists waitlist_leads (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  source text not null default 'landing',
  created_at timestamptz not null default now()
);

alter table waitlist_leads enable row level security;

-- Anonymous visitors may only INSERT leads with a syntactically valid email.
-- No SELECT/UPDATE/DELETE policy: leads are readable only via service_role.
create policy "waitlist leads: anon insert with valid email"
on waitlist_leads
for insert
to anon, authenticated
with check (
  auth.role() = 'anon'
  and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
);
