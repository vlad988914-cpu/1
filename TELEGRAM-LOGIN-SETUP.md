# Вхід клієнтів через Telegram — налаштування (4 кроки)

1. **Supabase → SQL Editor → New query:** вставте вміст файлу `db/telegram-login.sql` → Run (один раз).
2. **Vercel → проєкт → Settings → Environment Variables:** додайте (для Production):
   - `SUPABASE_SERVICE_ROLE_KEY` — Supabase → Project Settings → API Keys → блок Secret keys → default (sb_secret_...) → Reveal → Copy. Або вкладка Legacy → service_role. Нікому не показувати й не вставляти в чат.
   - `TG_WEBHOOK_SECRET` — придумайте довгий випадковий рядок (латиниця й цифри, 20+ символів).
   `TELEGRAM_BOT_TOKEN` уже є. Після додавання → Deployments → Redeploy.
3. **Один раз відкрийте в браузері** (підставте свій секрет):
   `https://www.tehmaydan.com/api/tg-webhook?setup=ВАШ_TG_WEBHOOK_SECRET`
   Має відповісти `{"ok":true,"result":true,...}`.
4. Перевірка: відкрийте сайт у режимі інкогніто → Вхід → «Увійти через Telegram» → Старт → «Поділитися номером» → сайт сам вас впустить.
