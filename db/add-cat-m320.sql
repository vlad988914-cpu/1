-- ТехМайданчик: додати CAT M320 (Миколаїв). Supabase → SQL Editor.
-- Крок 1: знайти свій user id (скопіюйте значення id)
select id, email from auth.users where email = 'vlad988914@gmail.com';

-- Крок 2: вставте свій id замість ВАШ-USER-ID і виконайте.
-- price = 0 означає «Договірна» (сайт показує так).
insert into listings (owner_id, type, brand, region, price, unit, specs, owner_name, available, photos)
values (
  'ВАШ-USER-ID', 'Екскаватор', 'CAT M320', 'Миколаїв', 0, 'год',
  '{"Тип ходу":"Колісний","Поворот":"Повноповоротний (360°)","Оператор":"В комплекті","_video":"/videos/cat-m320.mp4","_poster":"/videos/cat-m320.jpg"}'::jsonb,
  'Миколаїв Буд', true, '{}'
);
-- Фото додайте через сайт (редагування оголошення) або Storage → listing-photos.
