// Крок 2: Telegram викликає цей адрес, коли клієнт пише боту.
// GET ?setup=<TG_WEBHOOK_SECRET> — одноразово реєструє webhook (токен бота в адресу вводити не треба).
import { configured, sbRest, tg, safeEq, fresh, WEBHOOK_SECRET } from "./_tg.js";

const ADMIN_ID = String(process.env.TELEGRAM_CHAT_ID || "").trim();
const ROLE_NAME = { owners: "власників техніки", clients: "клієнтів" };
const subKeyboard = { inline_keyboard: [[{ text: "🚜 Я власник техніки", callback_data: "sub:owners" }], [{ text: "🏗 Я шукаю техніку (клієнт)", callback_data: "sub:clients" }]] };
const saveSub = (u, role) => sbRest("tg_subs?on_conflict=tg_id", { method: "POST", headers: { Prefer: "resolution=merge-duplicates" },
  body: JSON.stringify({ tg_id: u.id, role, name: [u.first_name, u.last_name].filter(Boolean).join(" ") || null, active: true }) });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default async function handler(req, res) {
  if (!configured()) return res.status(500).json({ error: "not configured" });

  if (req.method === "GET") {
    if (!safeEq(req.query && req.query.setup, WEBHOOK_SECRET)) return res.status(403).json({ error: "forbidden" });
    const host = req.headers["x-forwarded-host"] || req.headers.host;
    const r = await tg("setWebhook", { url: `https://${host}/api/tg-webhook`, secret_token: WEBHOOK_SECRET, allowed_updates: ["message", "callback_query"] });
    return res.status(200).json(await r.json().catch(() => ({ ok: false })));
  }
  if (req.method !== "POST") return res.status(405).end();
  if (!safeEq(req.headers["x-telegram-bot-api-secret-token"], WEBHOOK_SECRET)) return res.status(403).end();

  try {
    const cb = (req.body || {}).callback_query;
    if (cb && cb.from && /^sub:(owners|clients)$/.test(cb.data || "")) {
      const role = cb.data.slice(4);
      await sbRest("tg_subs?on_conflict=tg_id", { method: "POST", headers: { Prefer: "resolution=merge-duplicates" },
        body: JSON.stringify({ tg_id: cb.from.id, role, name: [cb.from.first_name, cb.from.last_name].filter(Boolean).join(" ") || null, active: true }) });
      await tg("answerCallbackQuery", { callback_query_id: cb.id, text: "Готово ✅" });
      await tg("sendMessage", { chat_id: cb.message ? cb.message.chat.id : cb.from.id, text: `Ви підписані на новини ТехМайданчика для ${ROLE_NAME[role]}. Відписатися можна командою /stop.` });
      return res.status(200).json({ ok: true });
    }
    const m = (req.body || {}).message;
    if (!m || !m.from || m.chat.type !== "private") return res.status(200).json({ ok: true });
    const say = (text, extra = {}) => tg("sendMessage", { chat_id: m.chat.id, text, ...extra });

    // Кнопка «Підписатися» з сайту: /start sub_owners | sub_clients — підписка одним натисканням
    const sb = /^\/start\s+sub_(owners|clients)$/.exec(m.text || "");
    if (sb) {
      await saveSub(m.from, sb[1]);
      await say(`Готово ✅ Ви підписані на новини ТехМайданчика для ${ROLE_NAME[sb[1]]}. Відписатися можна командою /stop.`);
      return res.status(200).json({ ok: true });
    }

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

    const cmd = (m.text || "").split(/\s+/)[0].split("@")[0];
    if (cmd === "/subscribe") { await say("Оберіть, які новини вам цікаві:", { reply_markup: subKeyboard }); return res.status(200).json({ ok: true }); }
    if (cmd === "/stop") {
      await sbRest(`tg_subs?tg_id=eq.${m.from.id}`, { method: "PATCH", body: JSON.stringify({ active: false }) });
      await say("Ви відписалися від розсилки. Повернутися можна командою /subscribe.");
      return res.status(200).json({ ok: true });
    }
    if (String(m.from.id) === ADMIN_ID && ADMIN_ID && (cmd === "/stats" || cmd === "/broadcast")) {
      if (cmd === "/stats") {
        const rows = await sbRest("tg_subs?active=eq.true&select=role").then((r) => r.json());
        const n = (k) => (Array.isArray(rows) ? rows.filter((x) => x.role === k).length : 0);
        await say(`Підписники: власники ${n("owners")}, клієнти ${n("clients")}.`);
        return res.status(200).json({ ok: true });
      }
      // /broadcast owners|clients|all Текст
      const bm = /^\/broadcast(?:@\w+)?\s+(owners|clients|all)\s+([\s\S]+)$/.exec(m.text || "");
      if (!bm) { await say("Формат: /broadcast owners|clients|all Текст повідомлення"); return res.status(200).json({ ok: true }); }
      const filter = bm[1] === "all" ? "" : `&role=eq.${bm[1]}`;
      const subs = await sbRest(`tg_subs?active=eq.true${filter}&select=tg_id&limit=200`).then((r) => r.json());
      if (!Array.isArray(subs) || !subs.length) { await say("Немає підписників для цієї групи."); return res.status(200).json({ ok: true }); }
      const text = bm[2].trim() + "\n\nВідписатися: /stop";
      let sent = 0, failed = 0;
      for (let i = 0; i < subs.length; i += 20) {
        const chunk = subs.slice(i, i + 20);
        const rs = await Promise.all(chunk.map((u) => tg("sendMessage", { chat_id: u.tg_id, text, disable_web_page_preview: false }).then(async (r) => ({ id: u.tg_id, ok: r.ok, code: r.status })).catch(() => ({ id: u.tg_id, ok: false, code: 0 }))));
        for (const r of rs) {
          if (r.ok) sent++; else { failed++; if (r.code === 403) await sbRest(`tg_subs?tg_id=eq.${r.id}`, { method: "PATCH", body: JSON.stringify({ active: false }) }); }
        }
        if (i + 20 < subs.length) await sleep(1000);
      }
      await say(`Розсилку завершено: надіслано ${sent}, помилок ${failed}.`);
      return res.status(200).json({ ok: true });
    }

    if (m.text && m.text.startsWith("/start")) await say("Вітаємо! Щоб увійти на ТехМайданчик, натисніть «Увійти через Telegram» на сайті tehmaydan.com.\n\nЩоб отримувати новини про техніку, натисніть /subscribe.");
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(200).json({ ok: true });
  }
}
