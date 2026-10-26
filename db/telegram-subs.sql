-- Підписники розсилки Telegram-бота. Запустити один раз у Supabase → SQL Editor.
-- Таблиця закрита для браузера (RLS без політик): читає й пише лише сервер сайту через service_role.
create table if not exists public.tg_subs (
  tg_id       bigint primary key,
  role        text not null check (role in ('owners', 'clients')),
  name        text,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);
alter table public.tg_subs enable row level security;
create index if not exists tg_subs_role_idx on public.tg_subs (role, active);
