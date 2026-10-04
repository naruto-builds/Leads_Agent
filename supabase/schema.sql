create table leads (
  id uuid primary key default gen_random_uuid(),
  phone text not null unique,
  name text,
  language text,
  temperature text check (temperature in ('hot','warm','cold')),
  profile jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table calls (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  execution_id text not null unique,
  status text not null default 'queued',
  duration_s numeric,
  transcript text,
  summary text,
  intent_reason text,
  raw jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index calls_lead_id_idx on calls(lead_id);

create table callbacks (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  call_id uuid references calls(id) on delete set null,
  due_at timestamptz not null,
  phrase text,
  status text not null default 'pending'
    check (status in ('pending','processing','done','failed','cancelled')),
  attempts int not null default 0,
  created_at timestamptz not null default now()
);
create index callbacks_due_idx on callbacks(due_at) where status = 'pending';

create table webhook_events (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  event_key text not null,
  payload jsonb,
  received_at timestamptz not null default now(),
  unique (source, event_key)
);

alter table leads enable row level security;
alter table calls enable row level security;
alter table callbacks enable row level security;
alter table webhook_events enable row level security;