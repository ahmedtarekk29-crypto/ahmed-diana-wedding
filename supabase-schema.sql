create table if not exists public.rsvps (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  invite_code text,
  attending boolean not null,
  guest_count integer not null default 0 check (guest_count >= 0),
  guests jsonb not null default '[]'::jsonb,
  contact_name text,
  page_url text,
  user_agent text
);

alter table public.rsvps enable row level security;

drop policy if exists "Guests can submit RSVP" on public.rsvps;
create policy "Guests can submit RSVP"
on public.rsvps
for insert
to anon
with check (
  guest_count >= 0
  and jsonb_typeof(guests) = 'array'
);

create index if not exists rsvps_created_at_idx on public.rsvps (created_at desc);
create index if not exists rsvps_invite_code_idx on public.rsvps (invite_code);

create or replace view public.rsvp_summary as
select
  count(*) filter (where attending) as attending_responses,
  count(*) filter (where not attending) as declined_responses,
  coalesce(sum(guest_count) filter (where attending), 0) as total_guests
from public.rsvps;
