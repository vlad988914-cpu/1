-- ============================================================
-- ТЕХМАЙДАНЧИК — закрити довідники від змін ззовні (лист Supabase: rls_disabled_in_public)
-- Таблиці equipment_types і regions були без Row-Level Security: будь-хто за адресою проєкту міг їх змінити чи видалити.
-- Після цього: читати можуть усі (як і раніше), змінювати — ніхто з браузера; правки лише в Supabase (Table Editor / SQL).
-- Безпечно запускати повторно.
-- ============================================================
alter table public.equipment_types enable row level security;
alter table public.regions enable row level security;

drop policy if exists "equipment_types: read for all" on public.equipment_types;
create policy "equipment_types: read for all" on public.equipment_types for select to anon, authenticated using (true);

drop policy if exists "regions: read for all" on public.regions;
create policy "regions: read for all" on public.regions for select to anon, authenticated using (true);

-- на всяк випадок прибираємо права на запис для браузерних ролей
revoke insert, update, delete, truncate on public.equipment_types from anon, authenticated;
revoke insert, update, delete, truncate on public.regions from anon, authenticated;
