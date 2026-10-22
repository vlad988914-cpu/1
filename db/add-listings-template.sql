-- ТехМайданчик: шаблон додавання оголошень (Supabase → SQL Editor).
-- ВАЖЛИВО: кожен рядок виконуйте ЛИШЕ після того, як власник техніки підтвердив
-- модель, ціну та погодився на публікацію. Нічого не вигадуємо.
-- price = 0 -> сайт покаже «Договірна». unit: 'год' | 'зміна' | 'рейс'.
-- owner_id = id користувача, що керуватиме оголошенням:
--   select id, email from auth.users where email = '...';
-- Типи (type) мають збігатися з типами на сайті: 'Екскаватор', 'Міні-екскаватор',
-- 'Маніпулятор', 'Автовишка' — перевірте через: select distinct type from listings;

-- 1) Міні-екскаватор, Львів
-- insert into listings (owner_id, type, brand, region, price, unit, specs, owner_name, available, photos) values (
--   'OWNER-USER-ID', 'Міні-екскаватор', 'МОДЕЛЬ', 'Львів', 0, 'год',
--   '{"Оператор":"ТАК/НІ","Доставка":"за домовленістю"}'::jsonb, 'НАЗВА ВЛАСНИКА', true, '{}');

-- 2) Маніпулятор, Київ
-- insert into listings (owner_id, type, brand, region, price, unit, specs, owner_name, available, photos) values (
--   'OWNER-USER-ID', 'Маніпулятор', 'МОДЕЛЬ', 'Київ', 0, 'год',
--   '{"Вантажопідйомність":"З ПАСПОРТА","Довжина кузова":"З ПАСПОРТА"}'::jsonb, 'НАЗВА ВЛАСНИКА', true, '{}');

-- 3) Автовишка, Одеса
-- insert into listings (owner_id, type, brand, region, price, unit, specs, owner_name, available, photos) values (
--   'OWNER-USER-ID', 'Автовишка', 'МОДЕЛЬ', 'Одеса', 0, 'год',
--   '{"Робоча висота":"З ПАСПОРТА","Оператор":"ТАК/НІ"}'::jsonb, 'НАЗВА ВЛАСНИКА', true, '{}');
