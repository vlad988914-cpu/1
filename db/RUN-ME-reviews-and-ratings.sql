-- ТехМайданчик: відгуки + рейтинг. Можна запускати повторно (безпечно).

-- ТехМайданчик: рейтинг техніки (1–5 зірок). Виконати один раз у Supabase → SQL Editor.
create table if not exists listing_ratings (
  listing_id bigint not null references listings(id) on delete cascade,
  user_id    uuid   not null references auth.users(id) on delete cascade default auth.uid(),
  stars      smallint not null check (stars between 1 and 5),
  created_at timestamptz not null default now(),
  primary key (listing_id, user_id)
);
alter table listing_ratings enable row level security;

-- бачать усі (рейтинг публічний)
drop policy if exists "ratings read" on listing_ratings;
create policy "ratings read" on listing_ratings for select using (true);
-- ставити/змінювати оцінку може лише увійшов користувач, і не власник цього оголошення
drop policy if exists "ratings insert" on listing_ratings;
create policy "ratings insert" on listing_ratings for insert to authenticated
  with check (user_id = auth.uid() and not exists (select 1 from listings l where l.id = listing_id and l.owner_id = auth.uid()));
drop policy if exists "ratings update" on listing_ratings;
create policy "ratings update" on listing_ratings for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and not exists (select 1 from listings l where l.id = listing_id and l.owner_id = auth.uid()));
drop policy if exists "ratings delete" on listing_ratings;
create policy "ratings delete" on listing_ratings for delete to authenticated using (user_id = auth.uid());


-- ТехМайданчик: текстові відгуки про техніку. Виконати один раз у Supabase → SQL Editor.
create table if not exists listing_reviews (
  listing_id  bigint not null references listings(id) on delete cascade,
  user_id     uuid   not null references auth.users(id) on delete cascade default auth.uid(),
  author_name text   not null default 'Клієнт',
  body        text   not null check (char_length(body) between 5 and 800),
  created_at  timestamptz not null default now(),
  primary key (listing_id, user_id)
);
alter table listing_reviews enable row level security;
drop policy if exists "reviews read" on listing_reviews;
create policy "reviews read" on listing_reviews for select using (true);
drop policy if exists "reviews insert" on listing_reviews;
create policy "reviews insert" on listing_reviews for insert to authenticated
  with check (user_id = auth.uid() and not exists (select 1 from listings l where l.id = listing_id and l.owner_id = auth.uid()));
drop policy if exists "reviews update" on listing_reviews;
create policy "reviews update" on listing_reviews for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and not exists (select 1 from listings l where l.id = listing_id and l.owner_id = auth.uid()));
drop policy if exists "reviews delete" on listing_reviews;
create policy "reviews delete" on listing_reviews for delete to authenticated using (user_id = auth.uid());
