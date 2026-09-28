// Vercel serverless function: безпечний проксі до Anthropic API.
// Ключ зберігається ТІЛЬКИ на сервері (змінна середовища ANTHROPIC_API_KEY), у браузер не потрапляє.

const TYPES = ["Екскаватор", "Навантажувач", "Самоскид", "Гідромолот", "Кран", "Бульдозер"];
const REGIONS = ["Ужгород", "Мукачево", "Львів", "Київ", "Миколаїв", "Одеса"];

const SYSTEM_PROMPT = `Ти — помічник сайту ТехМайданчик, біржі оренди будівельної техніки в Україні (клієнти залишають заявки, власники техніки відгукуються, диспетчер керує розсилкою).

ТИ ВІДПОВІДАЄШ ЛИШЕ НА ТЕМУ САЙТУ: підбір будівельної техніки під задачу, порівняння типів техніки, як оформити заявку, як здати свою техніку, як працює біржа. На сторонні теми ввічливо відмов одним реченням і поверни розмову до техніки.

Клієнт може написати:
1. Опис задачі (наприклад: "потрібно викопати траншею під фундамент у Ужгороді") — визнач, яка техніка потрібна, і поясни, чому саме вона.
2. Загальне питання про техніку (наприклад: "чим екскаватор відрізняється від навантажувача") — дай коротку конкретну відповідь по суті.
3. Питання про сайт (як здати техніку, як працює диспетчер) — коротко поясни.

Визнач з повідомлення:
- type: одне значення зі списку [${TYPES.join(", ")}], або null якщо це не запит на підбір техніки
- region: одне значення зі списку [${REGIONS.join(", ")}], або null якщо не згадано
- budget: число (гривні), або null якщо не згадано
- comment: короткий переказ задачі клієнта, 1 речення, українською (для заявки)
- reply: твоя відповідь клієнту, 2-3 речення, МОВОЮ КЛІЄНТА (українська, російська або англійська). Для задачі — обов'язково поясни, яка функція техніки вирішує задачу. Не вигадуй цін, наявності чи характеристик конкретних машин.

Відповідай ЛИШЕ у форматі JSON, без тексту навколо, без markdown:
{"type": ..., "region": ..., "budget": ..., "comment": "...", "reply": "..."}`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY is not configured" });
  }

  const body = req.body || {};
  let messages = Array.isArray(body.messages) ? body.messages : [];

  // Санітизація: лише user/assistant, короткий текст, останні 12 повідомлень
  messages = messages
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .map((m) => ({ role: m.role, content: m.content.slice(0, 1000) }))
    .slice(-12);

  // API вимагає, щоб перше повідомлення було від user
  while (messages.length && messages[0].role !== "user") messages.shift();
  if (!messages.length) {
    return res.status(400).json({ error: "No user message" });
  }

  try {
    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001",
        max_tokens: 500,
        system: SYSTEM_PROMPT,
        messages,
      }),
    });

    const data = await upstream.json();
    if (!upstream.ok) {
      return res.status(502).json({ error: "Upstream error", detail: data?.error?.message || null });
    }
    return res.status(200).json({ content: data.content });
  } catch (err) {
    return res.status(502).json({ error: "Upstream unreachable" });
  }
}
