-- ============================================================
-- ТЕХМАЙДАНЧИК — календар техніки + блокування користувачів
-- 1) власник (і диспетчер) відмічає на календарі будь-які дні зайнятими;
--    це зберігається і всі відвідувачі бачать зелене/червоне по цій техніці;
-- 2) диспетчер може заблокувати / розблокувати користувача.
-- Виконувати ПІСЛЯ users_setup.sql (і решти файлів). Безпечно запускати повторно.
-- ============================================================

-- ---------- 1. Дні, які власник позначив зайнятими вручну ----------
create table if not exists public.listing_blocks (
  listing_id bigint not null references public.listings(id) on delete cascade,
  day date not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (listing_id, day)
);
alter table public.listing_blocks enable row level security;
revoke all on public.listing_blocks from anon, authenticated;   -- читання і запис лише через функції нижче

-- ---------- 2. Публічна зайнятість для каталогу: броні + ручні дні (одним списком періодів) ----------
create or replace function public.listing_busy()
returns table (listing_id bigint, date_from date, date_to date)
language sql stable security definer set search_path = public as $$
  select * from (
    select b.listing_id, b.date_from, b.date_to
      from bookings b
     where b.status in ('reserved', 'confirmed') and b.date_to >= current_date
    union all
    select x.listing_id, min(x.day) as date_from, max(x.day) as date_to
      from (
        select lb.listing_id, lb.day,
               lb.day - (row_number() over (partition by lb.listing_id order by lb.day))::int as grp
          from listing_blocks lb
         where lb.day >= current_date
      ) x
     group by x.listing_id, x.grp
  ) u
  order by u.date_from;
$$;
grant execute on function public.listing_busy() to anon, authenticated;

-- Які саме дні позначені вручну (щоб власник міг їх звільнити; дні броней не чіпаємо)
create or replace function public.listing_block_days()
returns table (listing_id bigint, day date)
language sql stable security definer set search_path = public as $$
  select lb.listing_id, lb.day from listing_blocks lb where lb.day >= current_date order by lb.day;
$$;
grant execute on function public.listing_block_days() to anon, authenticated;

-- ---------- 3. ВЛАСНИК / ДИСПЕТЧЕР: позначити дні зайнятими або вільними ----------
create or replace function public.set_listing_days(p_listing_id bigint, p_days date[], p_busy boolean)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  l listings%rowtype;
  d date;
  n int := 0;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  select * into l from listings where id = p_listing_id;
  if not found then return jsonb_build_object('ok', false, 'reason', 'listing_not_found'); end if;
  if l.owner_id is distinct from auth.uid() and my_role() is distinct from 'dispatcher' then
    return jsonb_build_object('ok', false, 'reason', 'not_your_listing');
  end if;
  if p_days is null or coalesce(array_length(p_days, 1), 0) = 0 then
    return jsonb_build_object('ok', true, 'changed', 0);
  end if;
  if array_length(p_days, 1) > 400 then
    return jsonb_build_object('ok', false, 'reason', 'too_many_days');
  end if;

  foreach d in array p_days loop
    continue when d is null or d < current_date;
    if p_busy then
      -- день, який уже зайнятий підтвердженою орендою, окремо не позначаємо
      continue when exists (
        select 1 from bookings b
         where b.listing_id = l.id and b.status in ('reserved', 'confirmed')
           and d between b.date_from and b.date_to);
      insert into listing_blocks (listing_id, day, created_by) values (l.id, d, auth.uid())
        on conflict do nothing;
    else
      delete from listing_blocks where listing_id = l.id and day = d;
    end if;
    n := n + 1;
  end loop;
  return jsonb_build_object('ok', true, 'changed', n);
end;
$$;
revoke all on function public.set_listing_days(bigint, date[], boolean) from public, anon;
grant execute on function public.set_listing_days(bigint, date[], boolean) to authenticated;

-- ---------- 4. Клієнт не може забронювати ручні дні (і заблокований користувач — нічого) ----------
alter table public.profiles add column if not exists blocked boolean not null default false;
alter table public.profiles add column if not exists blocked_at timestamptz;

create or replace function public.request_listing(
  p_listing_id bigint, p_date_from date, p_date_to date,
  p_comment text default null, p_with_operator boolean default false
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  l listings%rowtype;
  pr profiles%rowtype;
  busy_to date;
  rid bigint;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  select * into pr from profiles where id = auth.uid();
  if not found then return jsonb_build_object('ok', false, 'reason', 'no_profile'); end if;
  if pr.blocked then return jsonb_build_object('ok', false, 'reason', 'blocked'); end if;

  if p_date_from is null or p_date_to is null or p_date_to < p_date_from then
    return jsonb_build_object('ok', false, 'reason', 'bad_dates');
  end if;
  if p_date_from < current_date then return jsonb_build_object('ok', false, 'reason', 'past'); end if;

  select * into l from listings where id = p_listing_id;
  if not found then return jsonb_build_object('ok', false, 'reason', 'listing_not_found'); end if;
  if l.owner_id = auth.uid() then return jsonb_build_object('ok', false, 'reason', 'own_listing'); end if;
  if not l.available then return jsonb_build_object('ok', false, 'reason', 'unavailable'); end if;

  select max(x) into busy_to from (
    select b.date_to as x from bookings b
     where b.listing_id = l.id and b.status in ('reserved', 'confirmed')
       and daterange(b.date_from, b.date_to, '[]') && daterange(p_date_from, p_date_to, '[]')
    union all
    select lb.day from listing_blocks lb
     where lb.listing_id = l.id and lb.day between p_date_from and p_date_to
  ) q;
  if busy_to is not null then
    return jsonb_build_object('ok', false, 'reason', 'busy', 'busy_until', busy_to);
  end if;

  if exists (select 1 from requests where client_id = auth.uid() and listing_id = l.id
              and status in ('new', 'dispatched', 'offered', 'booked')
              and date_from = p_date_from and date_to = p_date_to) then
    return jsonb_build_object('ok', false, 'reason', 'duplicate');
  end if;

  insert into requests (client_id, type, region, date_from, date_to, with_operator, comment, contact, requester_name, listing_id)
  values (auth.uid(), l.type, l.region, p_date_from, p_date_to, coalesce(p_with_operator, false),
          left(nullif(trim(coalesce(p_comment, '')), ''), 500), pr.phone, pr.name, l.id)
  returning id into rid;

  return jsonb_build_object('ok', true, 'request_id', rid);
end;
$$;

-- заблокований не може створювати заявки і напряму
drop policy if exists "requests: registered client creates requests" on requests;
create policy "requests: registered client creates requests"
  on requests for insert to authenticated
  with check (client_id = auth.uid()
              and not coalesce((select p.blocked from profiles p where p.id = auth.uid()), false));

-- ---------- 5. Захист: поле blocked змінює лише диспетчер через функцію ----------
create or replace function public.profiles_protect_blocked() returns trigger language plpgsql as $$
begin
  if (new.blocked is distinct from old.blocked or new.blocked_at is distinct from old.blocked_at)
     and auth.uid() is not null
     and coalesce(current_setting('app.allow_block_change', true), '') <> 'on' then
    raise exception 'Blocking is allowed only for the dispatcher';
  end if;
  return new;
end;
$$;
drop trigger if exists profiles_protect_blocked_trg on profiles;
create trigger profiles_protect_blocked_trg before update on profiles
  for each row execute function public.profiles_protect_blocked();

-- ---------- 6. ДИСПЕТЧЕР: заблокувати / розблокувати користувача ----------
-- Заблокований не може увійти, нічого не бронює, а його техніка зникає з каталогу.
-- Розблокування повертає вхід; техніку власник вмикає сам (кнопка «Позначити вільною»).
create or replace function public.set_user_blocked(p_user_id uuid, p_blocked boolean)
returns jsonb language plpgsql security definer set search_path = public as $$
declare target profiles%rowtype;
begin
  if my_role() is distinct from 'dispatcher' then raise exception 'Only dispatcher'; end if;
  if p_user_id = auth.uid() then return jsonb_build_object('ok', false, 'reason', 'self'); end if;
  select * into target from profiles where id = p_user_id;
  if not found then return jsonb_build_object('ok', false, 'reason', 'not_found'); end if;
  if target.role = 'dispatcher' then return jsonb_build_object('ok', false, 'reason', 'is_dispatcher'); end if;

  perform set_config('app.allow_block_change', 'on', true);
  update profiles set blocked = coalesce(p_blocked, false),
                      blocked_at = case when coalesce(p_blocked, false) then now() else null end
   where id = p_user_id;
  perform set_config('app.allow_block_change', '', true);

  if coalesce(p_blocked, false) then
    update auth.users set banned_until = now() + interval '100 years' where id = p_user_id;
    update listings set available = false where owner_id = p_user_id;
    begin
      delete from auth.sessions where user_id = p_user_id;
    exception when others then null;
    end;
  else
    update auth.users set banned_until = null where id = p_user_id;
  end if;

  perform _log(null, null, null, case when coalesce(p_blocked, false) then 'user_blocked' else 'user_unblocked' end,
    jsonb_build_object('name', target.name, 'email', target.email, 'role', target.role));
  return jsonb_build_object('ok', true, 'blocked', coalesce(p_blocked, false));
end;
$$;
revoke all on function public.set_user_blocked(uuid, boolean) from public, anon;
grant execute on function public.set_user_blocked(uuid, boolean) to authenticated;
