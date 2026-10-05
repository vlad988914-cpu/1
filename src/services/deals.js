// Слой сервісів «Угода»: усі звернення до бази для пропозицій, броні, кабінетів
// і сповіщень — в одному місці. Інтерфейс не знає про Supabase напряму,
// тому бекенд можна змінити, не переписуючи екрани.
import { supabase } from "../supabaseClient";

// Людські пояснення відмов, які повертають серверні функції
export const REASON_TEXT = {
  busy: "Техніка вже зайнята в цей період",
  unavailable: "Власник позначив техніку як недоступну",
  already_proposed: "Цю техніку вже запропоновано по цій заявці",
  anonymous_client: "Клієнт без акаунта: підтвердьте оренду за телефоном",
  request_closed: "Заявка вже закрита",
  request_not_found: "Заявку не знайдено",
  listing_not_found: "Оголошення не знайдено",
  bad_dates: "Перевірте дати: кінець раніше за початок",
  not_found: "Запис не знайдено",
  already_answered: "На це вже відповіли",
  expired: "Час на відповідь минув — попросіть диспетчера надіслати пропозицію знову",
  not_reserved: "Бронь уже підтверджено або скасовано",
  not_active: "Бронь уже не активна",
  offline: "Немає з'єднання з базою",
  past: "Дата початку вже минула — оберіть сьогодні або пізніше",
  duplicate: "Ви вже надсилали таку саму заявку на ці дати",
  own_listing: "Це ваша власна техніка",
  no_profile: "Профіль не знайдено — вийдіть і увійдіть знову",
  has_booking: "Оренду вже підтверджено — для скасування зверніться до диспетчера",
  already_cancelled: "Заявку вже скасовано",
  no_listing: "У заявці не вибрано техніку",
  is_dispatcher: "Роль диспетчера змінюється лише через SQL",
  bad_role: "Недопустима роль",
};
export const reasonText = (res) => REASON_TEXT[res?.reason] || res?.message || "Не вдалося виконати дію";

// Виклик серверної функції: завжди повертає { ok, reason?, ...дані }
async function call(fn, args) {
  if (!supabase) return { ok: false, reason: "offline" };
  try {
    const { data, error } = await supabase.rpc(fn, args);
    if (error) return { ok: false, reason: "error", message: error.message };
    return data && typeof data === "object" && "ok" in data ? data : { ok: true, data };
  } catch (e) {
    return { ok: false, reason: "offline", message: e.message };
  }
}

// ---- Диспетчер ----
export const proposeOffer = (requestId, listingId, dateFrom, dateTo) =>
  call("propose_offer", { p_request_id: requestId, p_listing_id: listingId, p_date_from: dateFrom, p_date_to: dateTo });
export const confirmBooking = (bookingId) => call("confirm_booking", { p_booking_id: bookingId });
export const cancelBooking = (bookingId, reason) => call("cancel_booking", { p_booking_id: bookingId, p_reason: reason || null });
export const createManualBooking = (requestId, listingId, dateFrom, dateTo) =>
  call("create_manual_booking", { p_request_id: requestId, p_listing_id: listingId, p_date_from: dateFrom, p_date_to: dateTo });

export const declineListingRequest = (requestId, reason) =>
  call("decline_listing_request", { p_request_id: requestId, p_reason: reason || null });
export const setUserRole = (userId, role) => call("set_user_role", { p_user_id: userId, p_role: role });

// ---- Клієнт ----
// Забронювати конкретну техніку на дати: заявка одразу йде диспетчеру
export const requestListing = (listingId, dateFrom, dateTo, comment, withOperator) =>
  call("request_listing", {
    p_listing_id: listingId, p_date_from: dateFrom, p_date_to: dateTo,
    p_comment: comment || null, p_with_operator: !!withOperator,
  });
export const cancelMyRequest = (requestId) => call("cancel_my_request", { p_request_id: requestId });
export const respondToOffer = (offerId, action, reason) =>
  call("respond_to_offer", { p_offer_id: offerId, p_action: action, p_reason: reason || null });

const EMPTY_CLIENT = { requests: [], offers: [], bookings: [] };
export async function fetchClientCabinet() {
  const res = await call("client_cabinet", {});
  return res.ok && res.data ? { ...EMPTY_CLIENT, ...res.data } : EMPTY_CLIENT;
}

// ---- Власник ----
export async function fetchOwnerCabinet() {
  const res = await call("owner_cabinet", {});
  return res.ok && res.data && Array.isArray(res.data.bookings) ? res.data.bookings : [];
}

// ---- Каталог: зайнятість техніки без даних про клієнтів ----
export async function fetchListingBusy() {
  const res = await call("listing_busy", {});
  return res.ok && Array.isArray(res.data) ? res.data : [];
}

// ---- Диспетчер: усі пропозиції, броні та журнал ----
export async function fetchDispatcherDeals() {
  if (!supabase) return { offers: [], bookings: [], events: [] };
  const [o, b, e] = await Promise.all([
    supabase.from("offers").select("*").order("created_at", { ascending: true }),
    supabase.from("bookings").select("*").order("created_at", { ascending: true }),
    supabase.from("activity_log").select("*").order("created_at", { ascending: true }).limit(1000),
  ]);
  const err = o.error || b.error || e.error;
  if (err) console.error("Supabase load (deals) failed:", err.message);
  return { offers: o.data || [], bookings: b.data || [], events: e.data || [] };
}

// ---- Сповіщення ----
export async function fetchNotifications(limit = 40) {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.error("Supabase load (notifications) failed:", error.message);
    return [];
  }
  return data || [];
}

export async function markNotificationsRead(ids) {
  if (!supabase) return;
  let q = supabase.from("notifications").update({ read_at: new Date().toISOString() }).is("read_at", null);
  if (Array.isArray(ids)) q = q.in("id", ids);
  const { error } = await q;
  if (error) console.error("Supabase update (notifications) failed:", error.message);
}

// ---- Допоміжне: статуси броні й дати ----
const todayStr = () => new Date().toLocaleDateString("sv-SE"); // локальна дата YYYY-MM-DD

// Зберігаємо в базі reserved / confirmed / completed / cancelled, а «триває» і «завершена»
// для підтвердженої оренди визначаємо за датами.
export function bookingPhase(b, today = todayStr()) {
  if (b.status === "cancelled") return "cancelled";
  if (b.status === "reserved") return "reserved";
  if (b.status === "completed" || b.date_to < today) return "completed";
  if (b.date_from <= today) return "active";
  return "confirmed";
}

export const fmtDate = (d) => {
  if (!d) return "—";
  const [y, m, day] = String(d).slice(0, 10).split("-");
  return `${day}.${m}.${y}`;
};
export const fmtPeriod = (a, b) => (a && b ? `${fmtDate(a)} — ${fmtDate(b)}` : "період не вказано");
export const fmtDateTime = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString("uk-UA", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
};

// Кількість днів у періоді (включно з обома кінцями) — для орієнтовної вартості
export const daysInclusive = (from, to) => {
  if (!from || !to || to < from) return 0;
  return Math.round((new Date(to) - new Date(from)) / 86400000) + 1;
};
export const rangesOverlap = (aFrom, aTo, bFrom, bTo) => aFrom <= bTo && bFrom <= aTo;
export const todayLocal = () => todayStr();
