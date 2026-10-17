// Спільні функції для входу через Telegram (серверна частина).
import crypto from "node:crypto";

const FALLBACK_URL = "https://jsyjqudermvbylaweuqj.supabase.co";
const url = String(process.env.VITE_SUPABASE_URL || "").trim();
export const SB_URL = /^https:\/\/[a-z0-9]+\.supabase\.co$/.test(url) ? url : FALLBACK_URL;
export const SERVICE_KEY = String(process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
export const BOT_TOKEN = String(process.env.TELEGRAM_BOT_TOKEN || "").trim();
export const WEBHOOK_SECRET = String(process.env.TG_WEBHOOK_SECRET || "").trim();
export const TTL_MS = 10 * 60 * 1000;

// Новий формат ключа (sb_secret_...) не є JWT: його передаємо лише в apikey. Старий (eyJ...) — також у Authorization.
export const sbHeaders = (extra = {}) => ({
  apikey: SERVICE_KEY,
  ...(SERVICE_KEY.startsWith("sb_secret_") ? {} : { Authorization: `Bearer ${SERVICE_KEY}` }),
  "Content-Type": "application/json",
  ...extra,
});
export const sbRest = (path, opt = {}) => fetch(`${SB_URL}/rest/v1/${path}`, { ...opt, headers: sbHeaders(opt.headers) });
export const rnd = (n) => crypto.randomBytes(n).toString("hex");
export const safeEq = (a, b) => {
  const x = Buffer.from(String(a || "")), y = Buffer.from(String(b || ""));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};
export const fresh = (iso) => Date.now() - new Date(iso).getTime() < TTL_MS;
export const tg = (method, body) =>
  fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
export const configured = () => !!(SERVICE_KEY && BOT_TOKEN && WEBHOOK_SECRET);
