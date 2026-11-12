-- SHADI SMP website backend schema: public Feedback wall with private moderation.
-- Safe to re-run on a fresh or existing project.

create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.site_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  author_name text not null default 'بازیکن',
  category text not null check (char_length(category) <= 50),
  message text not null check (char_length(message) between 2 and 1200),
  admin_reply text,
  created_at timestamptz not null default now()
);

-- Upgrade previous Feedback-only installations.
alter table public.site_feedback alter column user_id drop not null;
alter table public.site_feedback add column if not exists author_name text not null default 'بازیکن';
alter table public.site_feedback add column if not exists admin_reply text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'site_feedback_author_name_length') then
    alter table public.site_feedback
      add constraint site_feedback_author_name_length
      check (char_length(btrim(author_name)) between 1 and 24);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'site_feedback_admin_reply_length') then
    alter table public.site_feedback
      add constraint site_feedback_admin_reply_length
      check (admin_reply is null or char_length(admin_reply) <= 1200);
  end if;
end $$;

alter table public.site_settings enable row level security;
alter table public.site_feedback enable row level security;

drop policy if exists "Anyone can read public site settings" on public.site_settings;
create policy "Anyone can read public site settings" on public.site_settings
  for select to anon, authenticated using (true);

drop policy if exists "Anyone can read public feedback" on public.site_feedback;
create policy "Anyone can read public feedback" on public.site_feedback
  for select to anon, authenticated using (true);

drop policy if exists "Anyone can submit anonymous feedback" on public.site_feedback;
drop policy if exists "Signed in users submit feedback" on public.site_feedback;
create policy "Anyone can submit anonymous feedback" on public.site_feedback
  for insert to anon, authenticated
  with check (
    user_id is null
    and char_length(btrim(author_name)) between 1 and 24
    and char_length(message) between 2 and 1200
  );

-- Public users may read and submit only. They cannot edit replies or delete messages.
revoke all on table public.site_feedback from anon, authenticated;
grant select, insert on table public.site_feedback to anon, authenticated;
grant select on table public.site_settings to anon, authenticated;

create index if not exists site_feedback_created_at_idx
  on public.site_feedback (created_at desc);

insert into public.site_settings (key, value) values
  ('server.address', '""'::jsonb),
  ('server.version', '"Paper 26.2"'::jsonb),
  ('site.announcement', '""'::jsonb)
on conflict (key) do nothing;
