-- Executar antes de ativar o envio. Os subscritores antigos ficam pendentes de consentimento verificável.
alter table public.newsletter_subscribers add column if not exists consent_at timestamptz;
alter table public.newsletter_subscribers add column if not exists unsubscribed_at timestamptz;
create table if not exists public.newsletter_deliveries (
  id bigint generated always as identity primary key,
  campaign_id uuid not null,
  subscriber_id bigint not null references public.newsletter_subscribers(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','sent','failed')),
  sent_at timestamptz,
  error text,
  unique(campaign_id,subscriber_id)
);
alter table public.newsletter_deliveries enable row level security;
-- Apenas a API do servidor, usando service_role, pode escrever nesta tabela.
