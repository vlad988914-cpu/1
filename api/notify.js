// Vercel serverless function: надсилає нову заявку в ваш Telegram.
// Токен бота і chat id зберігаються ТІЛЬКИ у змінних середовища Vercel.

const esc = (s) => String(s ?? "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
const cut = (s, n) => esc(String(s ?? "").slice(0, n));

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return res.status(500).json({ error: "Telegram is not configured" });

  const b = req.body || {};
  // Мінімальна валідація, щоб не слати порожні/сміттєві повідомлення
  if (typeof b.type !== "string" || typeof b.contact !== "string" || b.contact.trim().length < 5) {
    return res.status(400).json({ error: "Invalid request" });
  }

  const lines = [
    "🆕 <b>Нова заявка на сайті ТехМайданчик</b>",
    "",
    `<b>Техніка:</b> ${cut(b.type, 50)}`,
    `<b>Регіон:</b> ${cut(b.region, 50) || "—"}`,
    `<b>Коли потрібно:</b> ${cut(b.dateFrom, 20) || "—"}`,
    `<b>Бюджет:</b> ${b.budget ? cut(b.budget, 12) + " ₴" : "—"}`,
    `<b>Опис:</b> ${cut(b.comment, 500) || "—"}`,
    "",
    `<b>Клієнт:</b> ${cut(b.requesterName, 60) || "—"}`,
    `<b>Контакт:</b> ${cut(b.contact, 40)}`,
  ];

  try {
    const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: lines.join("\n"), parse_mode: "HTML" }),
    });
    if (!r.ok) return res.status(502).json({ error: "Telegram error" });
    return res.status(200).json({ ok: true });
  } catch {
    return res.status(502).json({ error: "Telegram unreachable" });
  }
}
