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
create policy "ratings read" on listing_ratings for select using (true);
-- ставити/змінювати оцінку може лише увійшов користувач, і не власник цього оголошення
create policy "ratings insert" on listing_ratings for insert to authenticated
  with check (user_id = auth.uid() and not exists (select 1 from listings l where l.id = listing_id and l.owner_id = auth.uid()));
create policy "ratings update" on listing_ratings for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and not exists (select 1 from listings l where l.id = listing_id and l.owner_id = auth.uid()));
create policy "ratings delete" on listing_ratings for delete to authenticated using (user_id = auth.uid());
