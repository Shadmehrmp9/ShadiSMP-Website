-- SHADI SMP website backend schema: anonymous Feedback only.
-- Safe to re-run. Legacy account/profile tables, if any, are not used by the website.

create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.site_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  category text not null check (char_length(category) <= 50),
  message text not null check (char_length(message) between 8 and 1200),
  created_at timestamptz not null default now()
);

-- Upgrade older installations where Feedback previously required a signed-in user.
alter table public.site_feedback alter column user_id drop not null;

-- The website no longer creates accounts or exposes an admin panel.
drop trigger if exists on_auth_user_created_shadi on auth.users;
drop function if exists public.handle_new_shadi_user() cascade;
drop policy if exists "Signed in users submit feedback" on public.site_feedback;
drop policy if exists "Anyone can submit anonymous feedback" on public.site_feedback;
drop policy if exists "Only admins read feedback" on public.site_feedback;

alter table public.site_settings enable row level security;
alter table public.site_feedback enable row level security;

drop policy if exists "Anyone can read public site settings" on public.site_settings;
create policy "Anyone can read public site settings" on public.site_settings
  for select to anon, authenticated using (true);

create policy "Anyone can submit anonymous feedback" on public.site_feedback
  for insert to anon, authenticated
  with check (user_id is null);

-- Feedback is insert-only from the public website. Read messages in Supabase Dashboard.
revoke all on table public.site_feedback from anon, authenticated;
grant insert on public.site_feedback to anon, authenticated;
grant select on public.site_settings to anon, authenticated;

insert into public.site_settings (key, value) values
  ('server.address', '""'::jsonb),
  ('server.version', '"Paper 26.2"'::jsonb),
  ('site.announcement', '""'::jsonb)
on conflict (key) do nothing;
