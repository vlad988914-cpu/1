-- ТехМайданчик: чистка тестових даних і наповнення каталогу.
-- Запускати в Supabase → SQL Editor. Крок 1 і 2 — переглянути, 3 — видалити, 4 — додати свою техніку.
-- ВАЖЛИВО: видалення назавжди. Спершу виконайте SELECT і переконайтесь, що в списку лише тестові записи.

-- 1. Усі оголошення (перегляд)
select id, brand, type, region, price, unit, owner_name, owner_id, created_at from listings order by created_at desc;

-- 2. Усі заявки (перегляд)
select id, status, created_at, * from requests order by created_at desc;

-- 3. Видалення (розкоментуйте потрібне, підставивши id зі списків вище)
-- delete from listings where id in ('ID-1','ID-2');
-- delete from requests where id in ('ID-1','ID-2');
-- або ВСІ тестові заявки одразу (лише якщо справжніх ще немає!):
-- delete from requests;

-- 4. Додати свою техніку. owner_id — ваш id користувача (див. запит нижче), фото додаються через сайт.
-- select id, email from auth.users where email = 'vlad988914@gmail.com';
-- insert into listings (owner_id, type, brand, region, price, unit, specs, owner_name, available, photos) values
--  ('ВАШ-USER-ID', 'Екскаватор', 'CAT 320', 'Миколаїв', 2000, 'год',
--   '{"Вага":"20 т","Об''єм ковша":"1.0 м³"}'::jsonb, 'РЕМСЕРВІС-Н', true, '{}');
