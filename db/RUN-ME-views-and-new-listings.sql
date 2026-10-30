-- ============================================================
-- ТЕХМАЙДАНЧИК — перегляди техніки, «нова техніка» для диспетчера,
-- Telegram про нову реєстрацію
-- 1) кожен перегляд сторінки техніки рахується (один відвідувач — один раз на добу);
-- 2) власник у кабінеті бачить усю свою техніку, перегляди і хто дивився;
-- 3) диспетчер отримує сповіщення, коли додана нова техніка;
-- 4) позначка «про цю реєстрацію вже написали в Telegram» (щоб не було дублів).
-- Виконувати ПІСЛЯ calendar_blocks_setup.sql. Безпечно запускати повторно.
-- ============================================================

-- ---------- 1. Перегляди ----------
create table if not exists public.listing_views (
  id bigserial primary key,
  listing_id bigint not null references public.listings(id) on delete cascade,
  viewer_id uuid references public.profiles(id) on delete cascade,   -- null = гість
  who text not null,                    -- 'u:<uuid>' для користувача, 'g:<anon id>' для гостя
  day date not null default current_date,
  hits int not null default 1,
  first_at timestamptz not null default now(),
  last_at timestamptz not null default now(),
  unique (listing_id, who, day)
);
create index if not exists listing_views_listing_idx on public.listing_views (listing_id, last_at desc);
alter table public.listing_views enable row level security;
revoke all on public.listing_views from anon, authenticated;   -- лише через функції нижче

-- Записати перегляд. Не рахуємо власника власної техніки та диспетчера.
create or replace function public.track_listing_view(p_listing_id bigint, p_visitor text default null)
returns void language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  l listings%rowtype;
  w text;
  v text := left(regexp_replace(coalesce(p_visitor, ''), '[^A-Za-z0-9_-]', '', 'g'), 64);
begin
  select * into l from listings where id = p_listing_id;
  if not found then return; end if;
  if uid is not null then
    if l.owner_id = uid or my_role() = 'dispatcher' then return; end if;
    w := 'u:' || uid::text;
  else
    if length(v) < 8 then return; end if;
    w := 'g:' || v;
  end if;
  insert into listing_views (listing_id, viewer_id, who)
  values (l.id, uid, w)
  on conflict (listing_id, who, day) do update
    set hits = listing_views.hits + 1, last_at = now();
end;
$$;
revoke all on function public.track_listing_view(bigint, text) from public;
grant execute on function public.track_listing_view(bigint, text) to anon, authenticated;

-- ---------- 2. Статистика по техніці ----------
-- Власник отримує рядки лише своєї техніки, диспетчер — усієї.
create or replace function public.listing_stats()
returns table (
  listing_id bigint, views_total bigint, views_7d bigint, views_today bigint,
  visitors bigint, members bigint, requests_total bigint, last_view_at timestamptz
)
language sql stable security definer set search_path = public as $$
  select l.id,
         coalesce(sum(v.hits), 0)::bigint,
         coalesce(sum(v.hits) filter (where v.day >= current_date - 6), 0)::bigint,
         coalesce(sum(v.hits) filter (where v.day = current_date), 0)::bigint,
         count(distinct v.who)::bigint,
         count(distinct v.viewer_id)::bigint,
         (select count(*) from requests r where r.listing_id = l.id)::bigint,
         max(v.last_at)
    from listings l
    left join listing_views v on v.listing_id = l.id
   where auth.uid() is not null
     and (l.owner_id = auth.uid() or my_role() = 'dispatcher')
   group by l.id;
$$;
revoke all on function public.listing_stats() from public, anon;
grant execute on function public.listing_stats() to authenticated;

-- Хто дивився. Власник бачить, коли і чи це зареєстрований клієнт чи гість
-- (контакти клієнтів — лише у диспетчера, як і в решті сайту). Диспетчер бачить ім'я та телефон.
create or replace function public.listing_viewers(p_listing_id bigint, p_limit int default 50)
returns table (
  last_at timestamptz, day date, hits int, is_member boolean,
  name text, phone text, email text
)
language plpgsql stable security definer set search_path = public as $$
declare
  l listings%rowtype;
  disp boolean := (my_role() = 'dispatcher');
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  select * into l from listings where id = p_listing_id;
  if not found then return; end if;
  if l.owner_id is distinct from auth.uid() and not disp then return; end if;
  return query
    select v.last_at, v.day, v.hits, (v.viewer_id is not null),
           case when disp then p.name else null end,
           case when disp then p.phone else null end,
           case when disp then p.email else null end
      from listing_views v
      left join profiles p on p.id = v.viewer_id
     where v.listing_id = p_listing_id
     order by v.last_at desc
     limit greatest(1, least(coalesce(p_limit, 50), 200));
end;
$$;
revoke all on function public.listing_viewers(bigint, int) from public, anon;
grant execute on function public.listing_viewers(bigint, int) to authenticated;

-- ---------- 3. Нова техніка -> сповіщення диспетчерам ----------
create or replace function public._on_new_listing() returns trigger
language plpgsql security definer set search_path = public as $$
declare owner_role text;
begin
  select role into owner_role from profiles where id = new.owner_id;
  if owner_role is distinct from 'dispatcher' then
    perform public._notify_dispatchers(
      'new_listing',
      'Нова техніка: ' || new.type || ' ' || new.brand,
      new.region || ' · ' || trim(to_char(new.price, 'FM999999990.##')) || ' ₴/' || new.unit
        || ' · ' || coalesce(nullif(new.owner_name, ''), (select name from profiles where id = new.owner_id), 'власник'));
  end if;
  return new;
end;
$$;
drop trigger if exists listings_after_insert on public.listings;
create trigger listings_after_insert after insert on public.listings
  for each row execute function public._on_new_listing();
revoke all on function public._on_new_listing() from public, anon, authenticated;

-- ---------- 4. Telegram про нову реєстрацію: один раз на акаунт ----------
-- Існуючі користувачі вже вважаються «повідомленими» (default true на момент додавання колонки),
-- нові отримують false і піднімаються один раз після першого входу.
alter table public.profiles add column if not exists tg_notified boolean not null default true;
alter table public.profiles alter column tg_notified set default false;

create or replace function public.claim_registration_notice()
returns boolean language plpgsql security definer set search_path = public as $$
declare got int;
begin
  if auth.uid() is null then return false; end if;
  update profiles set tg_notified = true
   where id = auth.uid() and tg_notified = false and role <> 'dispatcher';
  get diagnostics got = row_count;
  return got > 0;
end;
$$;
revoke all on function public.claim_registration_notice() from public, anon;
grant execute on function public.claim_registration_notice() to authenticated;
