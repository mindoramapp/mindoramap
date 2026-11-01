-- Open signup: accounts no longer need an invite code. New profiles get access_granted_at on
-- creation, and accounts that were waiting for a code are released now. Blocking (status) and
-- has_app_access() stay as they are, so an admin can still block an account.

create or replace function public.handle_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
  v_display_name text;
  v_role text;
  v_access_granted_at timestamptz;
  v_existing_role text;
  v_existing_access_granted_at timestamptz;
begin
  v_email := lower(coalesce(new.email, ''));
  v_display_name := trim(
    coalesce(
      new.raw_user_meta_data ->> 'name',
      split_part(v_email, '@', 1),
      'Usuário'
    )
  );
  select role, access_granted_at
  into v_existing_role, v_existing_access_granted_at
  from public.user_profiles
  where user_id = new.id;

  v_role := coalesce(v_existing_role, 'member');
  -- Open signup: every new account gets access right away (it used to wait for an invite code).
  v_access_granted_at := coalesce(v_existing_access_granted_at, timezone('utc', now()));

  insert into public.user_profiles (
    user_id,
    email,
    display_name,
    role,
    access_granted_at,
    last_seen_at
  )
  values (
    new.id,
    v_email,
    coalesce(nullif(v_display_name, ''), 'Usuário'),
    v_role,
    v_access_granted_at,
    timezone('utc', now())
  )
  on conflict (user_id) do update
  set
    email = excluded.email,
    display_name = excluded.display_name,
    role = excluded.role,
    access_granted_at = coalesce(public.user_profiles.access_granted_at, excluded.access_granted_at),
    updated_at = timezone('utc', now());

  return new;
end;
$$;

update public.user_profiles
   set access_granted_at = timezone('utc', now()),
       updated_at = timezone('utc', now())
 where access_granted_at is null
   and status = 'active';
