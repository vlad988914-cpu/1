# Підключення ШІ-помічника (5 хвилин)

Помічник працює через серверну функцію `api/chat.js`. Їй потрібен ваш ключ Anthropic.

1. Зайдіть на https://console.anthropic.com → Settings → API Keys → Create Key. Скопіюйте ключ (sk-ant-...).
   Рекомендую одразу в Billing виставити невеликий ліміт витрат.
2. Vercel → ваш проєкт → Settings → Environment Variables:
   - Name: ANTHROPIC_API_KEY
   - Value: ваш ключ
   - Environments: Production (+ Preview)
   → Save
3. Deployments → останній деплой → ⋯ → Redeploy (щоб змінна підхопилась).

Без ключа помічник НЕ ламається: працює локальний режим (підбір техніки за ключовими словами, по темі сайту).
Ключ нікому не показуйте і не вставляйте в код/чат.
