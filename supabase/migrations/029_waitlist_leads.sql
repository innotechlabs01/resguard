-- T-020: waitlist leads captured from the public landing page.
-- Email-only form (nombre/conjunto/teléfono quedan para el follow-up humano).

create table if not exists waitlist_leads (
  id uuid primary key default gen_random_uuid(),
  -- Uniqueness is enforced case-insensitively via the functional unique
  -- index below (FOO@x == foo@x). A plain `unique` constraint here would be
  -- case-sensitive (Postgres has no case-insensitive text without citext,
  -- and the functional index is the simplest Supabase-compatible pattern).
  email text not null,
  source text not null default 'landing',
  created_at timestamptz not null default now()
);

alter table waitlist_leads enable row level security;

-- Anonymous visitors may only INSERT leads with a syntactically valid email.
-- Target role is `anon` only: the real flow is an unauthenticated visitor
-- from the public landing form (authenticated sessions don't use it), and
-- the grant must match what WITH CHECK can actually satisfy.
-- No SELECT/UPDATE/DELETE policy: leads are readable only via service_role.
create policy "waitlist leads: anon insert with valid email"
on waitlist_leads
for insert
to anon
with check (
  auth.role() = 'anon'
  and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
);

-- Case-insensitive uniqueness at the DB level: the app lowercases emails,
-- but direct PostgREST inserts would bypass that. This functional unique
-- index makes the guarantee regardless of the caller.
create unique index if not exists waitlist_leads_email_lower_key
on waitlist_leads (lower(email));
