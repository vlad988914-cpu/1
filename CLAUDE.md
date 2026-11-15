# ТехМайданчик (tehmaydan.com)

Біржа оренди будівельної техніки: власники техніки та клієнти, диспетчер у Миколаєві. Інтерфейс і SEO — українською.

## Стек
- React 18 + Vite (`src/`), основний файл `src/EquipmentMarketplace.jsx`.
- Supabase: таблиці з RLS, RPC-функції, роль через `my_role()`. Клієнт: `src/supabaseClient.js`.
- Vercel: статичний сайт + serverless-функції в `api/` (Telegram-бот, `chat.js`, `notify.js`).
- SEO-сторінки генеруються скриптом `scripts/gen-seo-pages.mjs` у `public/orenda`, `public/katalog`, `public/vlasnykam`, `public/sitemap.xml`.
- Аналітика: GA4 / Google Ads (`AW-18540775028`, події у `src/track.js`), PostHog.

## Команди
- `npm run dev` — локально; `npm run build` — збірка; `npm test` — тести.
- `npm run seo` — перегенерація SEO-сторінок + перевірка метаданих.

## Правила
- Після `node scripts/gen-seo-pages.mjs` НЕ комітити зміни в `public/katalog` (генератор переписує їх зайвими змінами). Комітити лише `public/orenda`, `public/vlasnykam`, `public/sitemap.xml`, якщо змінювався відповідний код.
- SQL для бази — окремі файли `db/RUN-ME-*.sql`: безпечні для повторного запуску, `security definer` лише з перевіркою ролі, у кінці коментар як відкотити. Власник запускає їх вручну в Supabase → SQL Editor.
- Видалення даних «м'яке» (позначка `archived_at`), а не `delete`.
- Змінювати лише те, про що просили. Зміни — окремою гілкою та запитом на злиття; зливає власник сам.
- Не вставляти ключі та токени в код чи чат; секрети живуть у змінних Vercel/GitHub.

## Мова
Власник пише російською і любить коротко та кроками. Тексти сайту та реклами — українською.
