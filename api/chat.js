// Vercel serverless function: безпечний проксі до Anthropic API.
// Ключ зберігається ТІЛЬКИ на сервері (змінна середовища ANTHROPIC_API_KEY), у браузер не потрапляє.

import { kbPromptText } from "../shared/workKnowledge.js";

const TYPES = ["Екскаватор", "Навантажувач", "Самоскид", "Гідромолот", "Кран", "Бульдозер", "Каток"];
const REGIONS = [
  "Київ", "Харків", "Дніпро", "Одеса", "Львів", "Запоріжжя", "Вінниця", "Житомир", "Івано-Франківськ",
  "Кропивницький", "Луцьк", "Миколаїв", "Полтава", "Рівне", "Суми", "Тернопіль", "Ужгород",
  "Хмельницький", "Черкаси", "Чернігів", "Чернівці", "Мукачево",
];

const BASE_PROMPT = `Ти — помічник сайту ТехМайданчик (біржа оренди будівельної техніки в Україні: клієнти залишають заявки, власники техніки відгукуються, диспетчер керує розсилкою).
Говори просто й дружньо, без жаргону: клієнт може зовсім не розбиратися в техніці.

ТІЛЬКИ ТЕМА САЙТУ: підбір техніки під роботу, різниця між видами техніки, як проходить робота, на що звернути увагу, як оформити заявку чи здати техніку. На сторонні теми ввічливо відмов одним реченням і поверни розмову до техніки.

Клієнт пише задачу («треба викопати траншею»), питання про техніку («чим відрізняється X від Y») або питання про сайт.

ПРАВИЛА:
- Для задачі: поясни, яка техніка потрібна і ЧОМУ; запропонуй 2–3 варіанти виконання з простим поясненням різниці («міні-екскаватор — для вузького двору, мінус — малий ківш»); коротко опиши, як це проходить; назви 2–3 типові помилки. Якщо даних бракує — постав одне уточнююче питання.
- Для питання про різницю: чесно поясни різницю простими словами й скажи, що обрати в якій ситуації.
- Спирайся на ДОВІДКУ нижче. Не вигадуй цін, наявності й характеристик конкретних машин. Ціни — лише орієнтовні діапазони з довідки.
- Техніка з каталогу — тільки зі списку [${TYPES.join(", ")}]. Якщо потрібна спецтехніка поза каталогом (ямобур, автобетонозмішувач, асфальтоукладальник, грейдер) — прямо скажи про це й порадь вказати в заявці.
- Для земляних робіт обов'язково нагадай про перевірку підземних комунікацій.
- Відповідай мовою клієнта (українська, російська або англійська).

ФОРМАТ — ЛИШЕ JSON, без markdown і без тексту навколо:
{
  "type": головний тип техніки зі списку або null,
  "types": [усі потрібні типи техніки з каталогу] або null,
  "region": один зі списку [${REGIONS.join(", ")}] або null,
  "budget": число (гривні) або null,
  "comment": "1 речення українською — суть задачі для заявки",
  "reply": "2–3 речення — головна відповідь",
  "sections": [
    {"title": "Яка техніка потрібна", "items": ["Екскаватор — обов'язково: ..."]},
    {"title": "Який варіант обрати", "items": ["..."]},
    {"title": "Як це проходить", "items": ["..."], "ordered": true},
    {"title": "Часті помилки", "items": ["..."]}
  ],
  "options": ["2–4 короткі подальші кроки чи питання; один із них «Створити заявку»"]
}
sections — до 4 розділів, у кожному до 5 пунктів, пункт не довший за 25 слів. Для простого питання sections можна не додавати.`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = (process.env.ANTHROPIC_API_KEY || "").trim();
  if (!apiKey) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY is not configured" });
  }

  const body = req.body || {};
  let messages = Array.isArray(body.messages) ? body.messages : [];

  // Санітизація: лише user/assistant, короткий текст, останні 12 повідомлень
  messages = messages
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .map((m) => ({ role: m.role, content: m.content.slice(0, 1500) }))
    .slice(-12);

  // API вимагає, щоб перше повідомлення було від user
  while (messages.length && messages[0].role !== "user") messages.shift();
  if (!messages.length) {
    return res.status(400).json({ error: "No user message" });
  }

  // Довідка: деталі лише по темі, яку клієнт обговорює в останніх повідомленнях
  const recentUserText = messages
    .filter((m) => m.role === "user")
    .slice(-3)
    .map((m) => m.content)
    .join(" ");
  const system = `${BASE_PROMPT}\n\n${kbPromptText(recentUserText)}`;

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
        max_tokens: 1600,
        system,
        messages,
      }),
    });

    const data = await upstream.json();
    if (!upstream.ok) {
      console.error("Anthropic error:", upstream.status, data?.error?.message);
      return res.status(502).json({ error: "Upstream error", detail: data?.error?.message || null });
    }
    return res.status(200).json({ content: data.content });
  } catch (err) {
    console.error("Anthropic unreachable:", err?.message);
    return res.status(502).json({ error: "Upstream unreachable" });
  }
}
