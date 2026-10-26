// Проста кнопка «Підписатися в Telegram»: /api/tg-subscribe?role=owners|clients → відкриває бота й підписує одним натисканням Start.
import { BOT_TOKEN } from "./_tg.js";

let botName = "";
export default async function handler(req, res) {
  try {
    if (!botName && BOT_TOKEN) {
      const me = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getMe`).then((r) => r.json());
      botName = me && me.result && me.result.username ? me.result.username : "";
    }
    if (!botName) return res.status(502).send("Bot unavailable");
    const role = (req.query && req.query.role) === "owners" ? "owners" : "clients";
    res.setHeader("Cache-Control", "no-store");
    res.writeHead(302, { Location: `https://t.me/${botName}?start=sub_${role}` });
    return res.end();
  } catch (e) {
    return res.status(500).send("Server error");
  }
}
