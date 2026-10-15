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
create policy "reviews read" on listing_reviews for select using (true);
create policy "reviews insert" on listing_reviews for insert to authenticated
  with check (user_id = auth.uid() and not exists (select 1 from listings l where l.id = listing_id and l.owner_id = auth.uid()));
create policy "reviews update" on listing_reviews for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and not exists (select 1 from listings l where l.id = listing_id and l.owner_id = auth.uid()));
create policy "reviews delete" on listing_reviews for delete to authenticated using (user_id = auth.uid());
