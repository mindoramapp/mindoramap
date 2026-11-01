-- Keepalive that writes. A read-only ping every 3 days did not stop the free project from being
-- paused in October 2026, so the daily ping (GitHub Actions + the owner's notebook) now calls
-- keepalive(), which updates a single fixed row: real database writes, nothing a caller controls.

create table if not exists public.keepalive (
  id smallint primary key default 1 check (id = 1),
  pinged_at timestamptz not null default now(),
  pings bigint not null default 0
);

alter table public.keepalive enable row level security;
-- No policies: clients can't read or write the table directly, only through keepalive().
revoke all on table public.keepalive from public, anon, authenticated;

insert into public.keepalive (id) values (1) on conflict (id) do nothing;

create or replace function public.keepalive()
returns timestamptz
language sql
volatile
security definer
set search_path = public
as $$
  update public.keepalive
     set pinged_at = now(), pings = pings + 1
   where id = 1
  returning pinged_at;
$$;

revoke execute on function public.keepalive() from public;
grant execute on function public.keepalive() to anon, authenticated;
