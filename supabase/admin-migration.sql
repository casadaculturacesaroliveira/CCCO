-- Executar no SQL Editor DO MESMO projeto Supabase usado pelo website.
-- Preserva as tabelas contact_messages e newsletter_subscribers existentes.
create table if not exists public.admin_users (user_id uuid primary key references auth.users(id) on delete cascade);
create table if not exists public.events (
 id uuid primary key default gen_random_uuid(), title text not null, category text not null default 'Outro',
 description text not null default '', starts_at timestamptz, location text not null default '',
 image_url text not null default '', ticket_url text not null default '',
 status text not null default 'draft' check (status in ('draft','published')),
 created_at timestamptz not null default now()
);
create table if not exists public.site_content (
 id uuid primary key default gen_random_uuid(), key text not null unique,
 title text not null default '', body text not null default '', created_at timestamptz not null default now()
);
create table if not exists public.site_settings (
 id uuid primary key default gen_random_uuid(), key text not null unique,
 value text not null default '', created_at timestamptz not null default now()
);
create or replace function public.is_ccco_admin() returns boolean
 language sql stable security definer set search_path=public
 as $$ select exists(select 1 from public.admin_users where user_id=auth.uid()) $$;
revoke all on function public.is_ccco_admin() from public;
grant execute on function public.is_ccco_admin() to authenticated,anon;
alter table public.admin_users enable row level security;
alter table public.events enable row level security;
alter table public.site_content enable row level security;
alter table public.site_settings enable row level security;
alter table public.contact_messages enable row level security;
alter table public.newsletter_subscribers enable row level security;
drop policy if exists "ccco_admin_self" on public.admin_users;
create policy "ccco_admin_self" on public.admin_users for select to authenticated using (user_id=auth.uid());
drop policy if exists "ccco_public_events" on public.events;
create policy "ccco_public_events" on public.events for select to anon,authenticated using (status='published' or public.is_ccco_admin());
drop policy if exists "ccco_manage_events" on public.events;
create policy "ccco_manage_events" on public.events for all to authenticated using (public.is_ccco_admin()) with check (public.is_ccco_admin());
drop policy if exists "ccco_public_content" on public.site_content;
create policy "ccco_public_content" on public.site_content for select to anon,authenticated using(true);
drop policy if exists "ccco_manage_content" on public.site_content;
create policy "ccco_manage_content" on public.site_content for all to authenticated using(public.is_ccco_admin()) with check(public.is_ccco_admin());
drop policy if exists "ccco_public_settings" on public.site_settings;
create policy "ccco_public_settings" on public.site_settings for select to anon,authenticated using(true);
drop policy if exists "ccco_manage_settings" on public.site_settings;
create policy "ccco_manage_settings" on public.site_settings for all to authenticated using(public.is_ccco_admin()) with check(public.is_ccco_admin());
drop policy if exists "ccco_read_messages" on public.contact_messages;
create policy "ccco_read_messages" on public.contact_messages for select to authenticated using(public.is_ccco_admin());
drop policy if exists "ccco_read_subscribers" on public.newsletter_subscribers;
create policy "ccco_read_subscribers" on public.newsletter_subscribers for select to authenticated using(public.is_ccco_admin());
-- Criar o utilizador no Supabase Authentication > Users; depois:
-- insert into public.admin_users(user_id) values ('UUID_REAL_DO_UTILIZADOR');
