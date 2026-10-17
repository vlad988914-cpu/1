// Крок 1: сайт просить одноразовий код входу. Повертає посилання на нашого бота.
import { configured, sbRest, rnd, BOT_TOKEN } from "./_tg.js";

let botName = "";
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!configured()) return res.status(500).json({ error: "Telegram login is not configured" });
  try {
    if (!botName) {
      const me = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getMe`).then((r) => r.json());
      botName = me && me.result && me.result.username ? me.result.username : "";
    }
    if (!botName) return res.status(502).json({ error: "Bot unavailable" });
    const role = (req.body || {}).role === "owner" ? "owner" : "client";
    const code = rnd(12), secret = rnd(24);
    // прибираємо старі коди (старші за добу)
    await sbRest(`tg_login?created_at=lt.${encodeURIComponent(new Date(Date.now() - 86400000).toISOString())}`, { method: "DELETE" });
    const r = await sbRest("tg_login", { method: "POST", body: JSON.stringify({ code, secret, role }) });
    if (!r.ok) return res.status(500).json({ error: "Could not create login code" });
    return res.status(200).json({ code, secret, url: `https://t.me/${botName}?start=${code}` });
  } catch (e) {
    return res.status(500).json({ error: "Server error" });
  }
}
