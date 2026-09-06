-- Secretaría Documental
create table if not exists document_categories (
  id uuid primary key default gen_random_uuid(),
  building_id uuid not null references buildings(id) on delete cascade,
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  building_id uuid not null references buildings(id) on delete cascade,
  category_id uuid references document_categories(id) on delete set null,
  title text not null,
  description text,
  created_by uuid not null references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  current_version_id uuid
);

create table if not exists document_versions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents(id) on delete cascade,
  version_number int not null,
  storage_path text not null,
  mime_type text,
  file_size bigint,
  checksum text,
  uploaded_by uuid not null references users(id),
  uploaded_at timestamptz not null default now(),
  change_note text,
  unique(document_id, version_number)
);

create table if not exists document_signatures (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents(id) on delete cascade,
  version_id uuid references document_versions(id) on delete set null,
  signed_by uuid not null references users(id),
  signed_at timestamptz not null default now(),
  status text not null check (status in ('pending','approved','rejected')),
  signature_note text
);

alter table document_versions add constraint fk_current_version foreign key (document_id) references documents(id);
-- RLS
alter table document_categories enable row level security;
alter table documents enable row level security;
alter table document_versions enable row level security;
alter table document_signatures enable row level security;
