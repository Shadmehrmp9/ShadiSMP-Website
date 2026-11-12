-- SHADI SMP website backend schema
-- Run once in Supabase SQL Editor. Uses Supabase Auth for password storage.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null check (username ~ '^[A-Za-z0-9_]{3,16}$'),
  created_at timestamptz not null default now()
);
create unique index if not exists profiles_username_lower_unique on public.profiles (lower(username));

create table if not exists public.site_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.site_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null check (char_length(category) <= 50),
  message text not null check (char_length(message) between 8 and 1200),
  created_at timestamptz not null default now()
);

create or replace function public.is_site_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.site_admins
    where user_id = auth.uid()
  );
$$;
revoke all on function public.is_site_admin() from public;
grant execute on function public.is_site_admin() to authenticated;

create or replace function public.handle_new_shadi_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  wanted_username text;
begin
  wanted_username := trim(coalesce(new.raw_user_meta_data ->> 'username', ''));
  if wanted_username !~ '^[A-Za-z0-9_]{3,16}$' then
    raise exception 'Username must be 3-16 characters using letters, numbers or underscore';
  end if;
  insert into public.profiles (id, username) values (new.id, wanted_username);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_shadi on auth.users;
create trigger on_auth_user_created_shadi
  after insert on auth.users
  for each row execute procedure public.handle_new_shadi_user();

alter table public.profiles enable row level security;
alter table public.site_admins enable row level security;
alter table public.site_settings enable row level security;
alter table public.site_feedback enable row level security;

drop policy if exists "Users read their own profile" on public.profiles;
create policy "Users read their own profile" on public.profiles
  for select to authenticated using (auth.uid() = id);
drop policy if exists "Admins read all profiles" on public.profiles;
create policy "Admins read all profiles" on public.profiles
  for select to authenticated using (public.is_site_admin());

drop policy if exists "Admins can see their own admin record" on public.site_admins;
create policy "Admins can see their own admin record" on public.site_admins
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "Anyone can read public site settings" on public.site_settings;
create policy "Anyone can read public site settings" on public.site_settings
  for select to anon, authenticated using (true);
drop policy if exists "Admins insert site settings" on public.site_settings;
create policy "Admins insert site settings" on public.site_settings
  for insert to authenticated with check (public.is_site_admin());
drop policy if exists "Admins update site settings" on public.site_settings;
create policy "Admins update site settings" on public.site_settings
  for update to authenticated using (public.is_site_admin()) with check (public.is_site_admin());

drop policy if exists "Signed in users submit feedback" on public.site_feedback;
create policy "Signed in users submit feedback" on public.site_feedback
  for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Only admins read feedback" on public.site_feedback;
create policy "Only admins read feedback" on public.site_feedback
  for select to authenticated using (public.is_site_admin());

grant select on public.site_settings to anon, authenticated;
grant select on public.profiles to authenticated;
grant select on public.site_admins to authenticated;
grant insert on public.site_feedback to authenticated;
grant select on public.site_feedback to authenticated;
grant insert, update on public.site_settings to authenticated;

insert into public.site_settings (key, value) values
  ('server.address', '""'::jsonb),
  ('server.version', '"Paper 26.2"'::jsonb),
  ('site.announcement', '""'::jsonb)
on conflict (key) do nothing;
