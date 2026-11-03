-- ============================================================
-- ТЕХМАЙДАНЧИК — заявка БЕЗ реєстрації (для клієнтів з реклами)
-- 1) гість залишає ім'я, контакт і що потрібно — без акаунта й пароля;
-- 2) заявка потрапляє диспетчеру як звичайна (сповіщення в кабінеті + Telegram);
-- 3) захист від спаму: прихована пастка для ботів, ліміти за IP і телефоном, перевірка полів.
-- Виконувати ПІСЛЯ views_and_new_listings_setup.sql. Безпечно запускати повторно.
-- ============================================================

-- ---------- 1. Службові колонки ----------
alter table public.requests add column if not exists guest_notify_token text;   -- одноразовий «ключ» для Telegram
alter table public.requests add column if not exists guest_notified boolean not null default false;

-- ---------- 2. Журнал спроб (для лімітів) ----------
create table if not exists public.guest_request_log (
  id bigserial primary key,
  ip_hash text not null,
  phone_digits text,
  created_at timestamptz not null default now()
);
create index if not exists guest_request_log_ip_idx on public.guest_request_log (ip_hash, created_at desc);
create index if not exists guest_request_log_phone_idx on public.guest_request_log (phone_digits, created_at desc);
create index if not exists guest_request_log_time_idx on public.guest_request_log (created_at desc);
alter table public.guest_request_log enable row level security;
revoke all on public.guest_request_log from anon, authenticated;

-- ---------- 3. Подати заявку без акаунта ----------
create or replace function public.submit_guest_request(
  p_type text, p_region text, p_date_from date, p_date_to date, p_with_operator boolean,
  p_comment text, p_contact text, p_name text, p_hp text default null
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  nm text := left(trim(coalesce(p_name, '')), 60);
  ct text := left(trim(coalesce(p_contact, '')), 60);
  rg text := left(trim(coalesce(p_region, '')), 80);
  digits text := regexp_replace(coalesce(p_contact, ''), '\D', '', 'g');
  ip text := 'unknown';
  iph text;
  rid bigint;
  tok text;
begin
  -- залогінений користувач подає заявку звичайним способом
  if auth.uid() is not null then return jsonb_build_object('ok', false, 'reason', 'use_account'); end if;

  -- пастка для ботів: людина це поле не бачить і не заповнює. Боту показуємо «успіх», у базу не пишемо.
  if length(trim(coalesce(p_hp, ''))) > 0 then
    return jsonb_build_object('ok', true, 'request_id', 0);
  end if;

  if length(nm) < 2 then return jsonb_build_object('ok', false, 'reason', 'bad_name'); end if;
  if not (length(digits) between 9 and 13 or ct ~ '^@?[A-Za-z0-9_]{5,32}$') then
    return jsonb_build_object('ok', false, 'reason', 'bad_contact');
  end if;
  if not exists (select 1 from equipment_types where name = p_type) then
    return jsonb_build_object('ok', false, 'reason', 'bad_type');
  end if;
  if length(rg) < 2 then return jsonb_build_object('ok', false, 'reason', 'bad_region'); end if;
  if p_date_from is not null and p_date_from < current_date then
    return jsonb_build_object('ok', false, 'reason', 'past');
  end if;
  if p_date_from is not null and p_date_to is not null
     and (p_date_to < p_date_from or p_date_to - p_date_from > 365) then
    return jsonb_build_object('ok', false, 'reason', 'bad_dates');
  end if;

  -- IP з заголовків запиту: спершу cf-connecting-ip (його ставить Cloudflare, клієнт не підробить), далі x-forwarded-for
  begin
    ip := coalesce(
      nullif(trim(coalesce((current_setting('request.headers', true))::json ->> 'cf-connecting-ip', '')), ''),
      nullif(trim(split_part(coalesce((current_setting('request.headers', true))::json ->> 'x-forwarded-for', ''), ',', 1)), ''),
      'unknown');
  exception when others then
    ip := 'unknown';
  end;
  iph := md5(ip || ':tm-guest');

  -- ліміти: 4 заявки/год з одного IP, 3 заявки/добу з одного номера, 300 заявок/добу всього
  if (select count(*) from guest_request_log where ip_hash = iph and created_at > now() - interval '1 hour') >= 4
     or (length(digits) >= 9 and (select count(*) from guest_request_log where phone_digits = right(digits, 9) and created_at > now() - interval '1 day') >= 3)
     or (select count(*) from guest_request_log where created_at > now() - interval '1 day') >= 300 then
    return jsonb_build_object('ok', false, 'reason', 'too_many');
  end if;

  -- та сама заявка двічі поспіль
  if exists (select 1 from requests where client_id is null and contact = ct and type = p_type
              and created_at > now() - interval '10 minutes') then
    return jsonb_build_object('ok', false, 'reason', 'duplicate');
  end if;

  tok := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
  insert into requests (client_id, type, region, date_from, date_to, with_operator, comment, contact, requester_name,
                        is_public, guest_notify_token)
  values (null, p_type, rg, p_date_from, p_date_to, coalesce(p_with_operator, false),
          left(nullif(trim(coalesce(p_comment, '')), ''), 500), ct, nm, false, tok)
  returning id into rid;

  insert into guest_request_log (ip_hash, phone_digits) values (iph, case when length(digits) >= 9 then right(digits, 9) end);
  -- журнал чистимо від старого
  delete from guest_request_log where created_at < now() - interval '3 days';

  return jsonb_build_object('ok', true, 'request_id', rid, 'notify_token', tok);
end;
$$;
revoke all on function public.submit_guest_request(text, text, date, date, boolean, text, text, text, text) from public;
grant execute on function public.submit_guest_request(text, text, date, date, boolean, text, text, text, text) to anon, authenticated;

-- ---------- 4. Дані для Telegram: один раз, лише власнику ключа ----------
-- Сервер /api/notify отримує ключ від браузера, що створив заявку, і бере ТІЛЬКИ дані з бази.
create or replace function public.claim_guest_request_notice(p_request_id bigint, p_token text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare r requests%rowtype;
begin
  select * into r from requests
   where id = p_request_id and client_id is null and guest_notified = false
     and guest_notify_token is not null and guest_notify_token = p_token;
  if not found then return jsonb_build_object('ok', false); end if;
  update requests set guest_notified = true, guest_notify_token = null where id = r.id;
  return jsonb_build_object('ok', true, 'id', r.id, 'type', r.type, 'region', r.region,
    'date_from', r.date_from, 'date_to', r.date_to, 'with_operator', r.with_operator,
    'comment', r.comment, 'contact', r.contact, 'name', r.requester_name);
end;
$$;
revoke all on function public.claim_guest_request_notice(bigint, text) from public;
grant execute on function public.claim_guest_request_notice(bigint, text) to anon, authenticated;
