-- Executar no SQL Editor do projeto Supabase.
create table if not exists public.newsletter_subscribers (
  id bigint generated always as identity primary key,
  email text not null unique,
  source text not null default 'website',
  created_at timestamptz not null default now()
);
create table if not exists public.contact_messages (
  id bigint generated always as identity primary key,
  name text not null,
  email text not null,
  subject text not null default 'Informações gerais',
  message text not null,
  created_at timestamptz not null default now()
);
alter table public.newsletter_subscribers enable row level security;
alter table public.contact_messages enable row level security;
-- Sem políticas públicas de INSERT: os formulários usam a chave de serviço apenas
-- nas rotas de servidor Next.js. Nunca expor SUPABASE_SERVICE_ROLE_KEY no browser.
