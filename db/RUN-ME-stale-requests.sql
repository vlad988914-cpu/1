-- Неактуальні заявки: диспетчер прибирає з диспетчерської заявки, дати робіт у яких уже минули.
-- Запускати один раз у Supabase → SQL Editor. Повторний запуск безпечний.
-- Рядки з бази НЕ видаляються: заявка отримує позначку archived_at і зникає з диспетчерської та з «Дошки запитів».

alter table public.requests add column if not exists archived_at timestamptz;

create or replace function public.archive_requests(p_ids bigint[])
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  n int;
  today date := (now() at time zone 'Europe/Kyiv')::date;
begin
  if my_role() is distinct from 'dispatcher' then raise exception 'Only dispatcher'; end if;
  if p_ids is null or array_length(p_ids, 1) is null then return jsonb_build_object('ok', true, 'count', 0); end if;

  -- лише заявки з минулою датою й без закритої угоди: актуальні й виконані прибрати не можна
  update requests
     set archived_at = now(), is_public = false
   where id = any(p_ids)
     and archived_at is null
     and status is distinct from 'taken'
     and coalesce(date_to, date_from) < today;
  get diagnostics n = row_count;

  if n = 0 then return jsonb_build_object('ok', false, 'reason', 'error', 'message', 'Заявка ще актуальна або вже прибрана'); end if;
  return jsonb_build_object('ok', true, 'count', n);
end $$;

revoke all on function public.archive_requests(bigint[]) from public, anon;
grant execute on function public.archive_requests(bigint[]) to authenticated;

-- Якщо заявку прибрали помилково, повернути її можна так (підставте номер):
--   update public.requests set archived_at = null where id = 123;
