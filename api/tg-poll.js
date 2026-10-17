// Крок 3: сайт перевіряє, чи клієнт уже підтвердив номер у боті. Якщо так — видає одноразовий токен входу Supabase.
import { configured, sbRest, sbHeaders, SB_URL, safeEq, fresh } from "./_tg.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!configured()) return res.status(500).json({ error: "not configured" });
  const { code, secret } = req.body || {};
  if (!/^[a-f0-9]{24}$/.test(String(code || "")) || typeof secret !== "string") return res.status(400).json({ error: "bad request" });
  try {
    const q = await sbRest(`tg_login?code=eq.${code}&select=*`).then((r) => r.json());
    const row = Array.isArray(q) && q[0];
    if (!row || !safeEq(row.secret, secret)) return res.status(404).json({ status: "gone" });
    if (!fresh(row.created_at) && row.status !== "ready") return res.status(200).json({ status: "expired" });
    if (row.status === "pending") return res.status(200).json({ status: "pending" });
    if (row.status !== "ready") return res.status(200).json({ status: "gone" });

    // позначаємо використаним ДО видачі токена: код працює лише раз
    const claim = await sbRest(`tg_login?code=eq.${code}&status=eq.ready`, { method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify({ status: "used" }) }).then((r) => r.json());
    if (!Array.isArray(claim) || !claim[0]) return res.status(200).json({ status: "gone" });

    const email = `tg${row.tg_id}@tg.tehmaydan.com`;
    const meta = { name: row.tg_name || "Клієнт", phone: row.phone || "", org: "", role: row.role === "owner" ? "owner" : "client", telegram_id: row.tg_id };
    // створюємо користувача (якщо вже є — Supabase поверне помилку, це нормально)
    await fetch(`${SB_URL}/auth/v1/admin/users`, { method: "POST", headers: sbHeaders(), body: JSON.stringify({ email, email_confirm: true, user_metadata: meta }) });
    const gl = await fetch(`${SB_URL}/auth/v1/admin/generate_link`, { method: "POST", headers: sbHeaders(), body: JSON.stringify({ type: "magiclink", email }) }).then((r) => r.json());
    if (!gl || !gl.hashed_token) return res.status(500).json({ error: "Could not create session" });
    // якщо в профілі ще немає телефону — підставляємо підтверджений
    if (row.phone && gl.id) await sbRest(`profiles?id=eq.${gl.id}&or=(phone.is.null,phone.eq.)`, { method: "PATCH", body: JSON.stringify({ phone: row.phone }) });
    return res.status(200).json({ status: "ok", token_hash: gl.hashed_token });
  } catch (e) {
    return res.status(500).json({ error: "Server error" });
  }
}
