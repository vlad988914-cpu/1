// Крок 2: Telegram викликає цей адрес, коли клієнт пише боту.
// GET ?setup=<TG_WEBHOOK_SECRET> — одноразово реєструє webhook (токен бота в адресу вводити не треба).
import { configured, sbRest, tg, safeEq, fresh, WEBHOOK_SECRET } from "./_tg.js";

export default async function handler(req, res) {
  if (!configured()) return res.status(500).json({ error: "not configured" });

  if (req.method === "GET") {
    if (!safeEq(req.query && req.query.setup, WEBHOOK_SECRET)) return res.status(403).json({ error: "forbidden" });
    const host = req.headers["x-forwarded-host"] || req.headers.host;
    const r = await tg("setWebhook", { url: `https://${host}/api/tg-webhook`, secret_token: WEBHOOK_SECRET, allowed_updates: ["message"] });
    return res.status(200).json(await r.json().catch(() => ({ ok: false })));
  }
  if (req.method !== "POST") return res.status(405).end();
  if (!safeEq(req.headers["x-telegram-bot-api-secret-token"], WEBHOOK_SECRET)) return res.status(403).end();

  try {
    const m = (req.body || {}).message;
    if (!m || !m.from || m.chat.type !== "private") return res.status(200).json({ ok: true });
    const say = (text, extra = {}) => tg("sendMessage", { chat_id: m.chat.id, text, ...extra });

    // Клієнт натиснув «Старт» з сайту: /start <code>
    const st = /^\/start\s+([a-f0-9]{24})$/.exec(m.text || "");
    if (st) {
      const q = await sbRest(`tg_login?code=eq.${st[1]}&status=eq.pending&select=code,created_at`).then((r) => r.json());
      if (!Array.isArray(q) || !q[0] || !fresh(q[0].created_at)) {
        await say("Це посилання вже не діє. Поверніться на сайт і натисніть «Увійти через Telegram» ще раз.");
        return res.status(200).json({ ok: true });
      }
      await sbRest(`tg_login?code=eq.${st[1]}`, { method: "PATCH", body: JSON.stringify({ tg_id: m.from.id, tg_name: [m.from.first_name, m.from.last_name].filter(Boolean).join(" ") }) });
      await say("Щоб підтвердити вхід на ТехМайданчик, натисніть кнопку нижче й поділіться номером телефону.", {
        reply_markup: { keyboard: [[{ text: "📱 Поділитися номером", request_contact: true }]], resize_keyboard: true, one_time_keyboard: true },
      });
      return res.status(200).json({ ok: true });
    }

    // Клієнт поділився СВОЇМ контактом
    if (m.contact) {
      if (m.contact.user_id !== m.from.id) {
        await say("Надішліть, будь ласка, власний номер кнопкою «Поділитися номером».");
        return res.status(200).json({ ok: true });
      }
      const q = await sbRest(`tg_login?tg_id=eq.${m.from.id}&status=eq.pending&order=created_at.desc&limit=1&select=code,created_at`).then((r) => r.json());
      if (!Array.isArray(q) || !q[0] || !fresh(q[0].created_at)) {
        await say("Сеанс входу завершився. Поверніться на сайт і почніть вхід ще раз.", { reply_markup: { remove_keyboard: true } });
        return res.status(200).json({ ok: true });
      }
      const digits = String(m.contact.phone_number || "").replace(/\D/g, "");
      const name = [m.contact.first_name, m.contact.last_name].filter(Boolean).join(" ") || m.from.first_name || "Клієнт";
      await sbRest(`tg_login?code=eq.${q[0].code}&status=eq.pending`, { method: "PATCH", body: JSON.stringify({ status: "ready", phone: digits ? "+" + digits : null, tg_name: name }) });
      await say("Готово ✅ Поверніться на сайт — вхід виконається автоматично.", { reply_markup: { remove_keyboard: true } });
      return res.status(200).json({ ok: true });
    }

    if (m.text && m.text.startsWith("/start")) await say("Вітаємо! Щоб увійти на ТехМайданчик, натисніть «Увійти через Telegram» на сайті tehmaydan.com.");
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(200).json({ ok: true });
  }
}
