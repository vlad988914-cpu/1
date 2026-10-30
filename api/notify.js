// Vercel serverless function: надсилає нову заявку в ваш Telegram.
// Токен бота і chat id зберігаються ТІЛЬКИ у змінних середовища Vercel.

// Лише зареєстровані користувачі: перевіряємо токен входу в Supabase, інакше кожен міг би слати вам повідомлення.
const FALLBACK_URL = "https://jsyjqudermvbylaweuqj.supabase.co";
const FALLBACK_KEY = "sb_publishable_ShJs7HgeVml_QbQO5pvb1g_yCaWV8ai"; // публічний ключ, безпечний у браузері
const pick = (v, ok, fallback) => {
  const t = String(v || "").trim();
  return ok(t) ? t : fallback;
};
const SB_URL = pick(process.env.VITE_SUPABASE_URL, (v) => /^https:\/\/[a-z0-9]+\.supabase\.co$/.test(v), FALLBACK_URL);
const SB_KEY = pick(process.env.VITE_SUPABASE_ANON_KEY, (v) => v.startsWith("sb_publishable_") || v.startsWith("eyJ"), FALLBACK_KEY);

async function verifyUser(authHeader) {
  const m = /^Bearer (.+)$/.exec(String(authHeader || ""));
  if (!m) return null;
  try {
    const r = await fetch(`${SB_URL}/auth/v1/user`, { headers: { apikey: SB_KEY, Authorization: `Bearer ${m[1]}` } });
    if (!r.ok) return null;
    const u = await r.json().catch(() => null);
    return u && u.id ? u : null;
  } catch (e) {
    return null;
  }
}

const esc = (s) => String(s ?? "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
const cut = (s, n) => esc(String(s ?? "").slice(0, n));

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const user = await verifyUser(req.headers.authorization);
  if (!user) return res.status(401).json({ error: "Sign in required" });

  // .trim() рятує від випадкового пробілу в кінці значення, вставленого в Vercel
  const token = (process.env.TELEGRAM_BOT_TOKEN || "").trim();
  const chatId = (process.env.TELEGRAM_CHAT_ID || "").trim();
  if (!token || !chatId) return res.status(500).json({ error: "Telegram is not configured" });

  const b = req.body || {};
  let lines;

  if (b.kind === "new_user" || b.kind === "new_listing") {
    // Дані беремо з бази, а не з запиту: так ніхто не підробить повідомлення. Права — токен самого користувача.
    const sbHeaders = { apikey: SB_KEY, Authorization: req.headers.authorization };
    try {
      if (b.kind === "new_user") {
        const rr = await fetch(`${SB_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}&select=name,org,phone,email,role`, { headers: sbHeaders });
        const p = (await rr.json().catch(() => []))[0];
        if (!p) return res.status(404).json({ error: "Profile not found" });
        lines = [
          p.role === "owner" ? "🚜 <b>Нова реєстрація: ВЛАСНИК техніки</b>" : "👤 <b>Нова реєстрація: клієнт</b>",
          "",
          `<b>Ім'я:</b> ${cut(p.name, 60) || "—"}`,
          p.org ? `<b>Компанія:</b> ${cut(p.org, 80)}` : null,
          `<b>Телефон:</b> ${cut(p.phone, 30) || "—"}`,
          `<b>Email:</b> ${cut(p.email, 80) || "—"}`,
        ].filter((x) => x !== null);
      } else {
        const id = Number(b.listingId);
        if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid listing" });
        const rr = await fetch(`${SB_URL}/rest/v1/listings?id=eq.${id}&select=id,owner_id,type,brand,region,price,unit,owner_name,specs`, { headers: sbHeaders });
        const l = (await rr.json().catch(() => []))[0];
        if (!l || l.owner_id !== user.id) return res.status(403).json({ error: "Not your listing" });
        const pr = await fetch(`${SB_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}&select=name,org,phone,email`, { headers: sbHeaders });
        const p = (await pr.json().catch(() => []))[0] || {};
        const specs = Object.entries(l.specs || {}).slice(0, 4).map(([k, v]) => `${cut(k, 30)}: ${cut(v, 30)}`).join(", ");
        lines = [
          "🆕 <b>Нова техніка на сайті ТехМайданчик</b>",
          "",
          `<b>${cut(l.type, 50)}</b> · ${cut(l.brand, 60)}`,
          `<b>Місто:</b> ${cut(l.region, 50)}`,
          `<b>Ціна:</b> ${cut(l.price, 12)} ₴/${cut(l.unit, 10)}`,
          specs ? `<b>Параметри:</b> ${specs}` : null,
          "",
          `<b>Власник:</b> ${cut(l.owner_name || p.name, 60) || "—"}${p.org ? " · " + cut(p.org, 60) : ""}`,
          `<b>Телефон:</b> ${cut(p.phone, 30) || "—"}`,
          `<b>Email:</b> ${cut(p.email, 80) || "—"}`,
        ].filter((x) => x !== null);
      }
    } catch (e) {
      return res.status(502).json({ error: "Database unreachable" });
    }
  } else {
    if (typeof b.type !== "string" || typeof b.contact !== "string" || b.contact.trim().length < 5) {
      return res.status(400).json({ error: "Invalid request" });
    }
    lines = [
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
  }

  try {
    const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: lines.join("\n"), parse_mode: "HTML" }),
    });
    const data = await r.json().catch(() => null);
    if (!r.ok) {
      // Логуємо справжню причину відмови Telegram — видно у Vercel → Журнали
      console.error("Telegram sendMessage failed:", r.status, data);
      return res.status(502).json({ error: "Telegram error", detail: data?.description || null });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Telegram unreachable:", err?.message);
    return res.status(502).json({ error: "Telegram unreachable" });
  }
}
