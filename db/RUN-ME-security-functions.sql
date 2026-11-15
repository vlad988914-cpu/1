-- ============================================================
-- ТЕХМАЙДАНЧИК — дрібне зміцнення функцій (попередження Security Advisor). Не терміново, сайт працює і без цього.
-- Частина A: закріпити search_path у 3 функцій (захист від підміни схем).
-- Частина B: службову функцію реєстрації handle_new_user більше не можна викликати з браузера
--            (тригер реєстрації працює як раніше: права на виклик перевіряються лише при створенні тригера).
-- Відкат частини B: grant execute on function public.handle_new_user() to anon, authenticated;
-- Безпечно запускати повторно.
-- ============================================================
-- Частина A
alter function public.my_role() set search_path = public, pg_temp;
alter function public.profiles_protect_role() set search_path = public, pg_temp;
alter function public.profiles_protect_blocked() set search_path = public, pg_temp;

-- Частина B
revoke execute on function public.handle_new_user() from public, anon, authenticated;
