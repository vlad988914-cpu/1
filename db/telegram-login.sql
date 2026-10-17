-- Вхід через Telegram: тимчасові одноразові коди. Запускати один раз у Supabase → SQL Editor.
-- Таблиця закрита для браузера (RLS без політик): читає й пише лише сервер сайту через service_role.
create table if not exists public.tg_login (
  code        text primary key,
  secret      text not null,
  role        text not null default 'client',
  status      text not null default 'pending',   -- pending -> ready -> used
  tg_id       bigint,
  tg_name     text,
  phone       text,
  created_at  timestamptz not null default now()
);
alter table public.tg_login enable row level security;
create index if not exists tg_login_tg_id_idx on public.tg_login (tg_id, created_at desc);
