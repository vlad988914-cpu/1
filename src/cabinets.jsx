// Кабінети клієнта й власника та панель сповіщень.
// Принцип екрана: «що мені тут зробити далі?» — активна дія завжди найпомітніша.
import React, { useState } from "react";
import { Plate, Label, Field, ErrorText, primaryBtn, smallBtn, selectStyle, inputStyle } from "./ui.jsx";
import { bookingPhase, fmtDate, fmtPeriod, fmtDateTime, daysInclusive, rangesOverlap, todayLocal } from "./services/deals.js";

const FONT = "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif";
const GREEN = "#6fae6f";
const RED = "#c96b5a";
const AMBER = "#FFB52E";

const confirmBtn = {
  ...primaryBtn,
  background: "linear-gradient(90deg, #3e9a5c, #6fae6f)",
  color: "#08090A",
  boxShadow: "0 4px 16px rgba(111,174,111,0.3)",
  minHeight: 48,
  flex: "1 1 140px",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};
const declineBtn = {
  ...smallBtn,
  borderColor: RED,
  color: RED,
  minHeight: 48,
  flex: "1 1 140px",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};

function Tabs({ tabs, value, onChange }) {
  return (
    <div role="tablist" style={{ display: "flex", gap: 4, borderBottom: "1px solid #202428", marginBottom: 14, overflowX: "auto" }}>
      {tabs.map((t) => {
        const active = t.key === value;
        return (
          <button
            key={t.key}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.key)}
            style={{
              background: "none",
              border: "none",
              borderBottom: `2px solid ${active ? "#FF6A1A" : "transparent"}`,
              color: active ? "#F4F4F1" : "#A3A8AD",
              fontFamily: FONT,
              fontSize: 13,
              padding: "10px 12px",
              cursor: "pointer",
              whiteSpace: "nowrap",
              minHeight: 44,
            }}
          >
            {t.label}
            {t.count > 0 && (
              <span style={{ marginLeft: 6, background: t.alert ? "#FF6A1A" : "#2a2e32", color: t.alert ? "#08090A" : "#F4F4F1", borderRadius: 980, padding: "1px 7px", fontSize: 11, fontWeight: 600 }}>
                {t.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function StatusBadge({ color, children }) {
  return (
    <span style={{ fontFamily: FONT, fontSize: 11.5, color, border: `1px solid ${color}`, padding: "3px 9px", borderRadius: 4, whiteSpace: "nowrap" }}>
      {children}
    </span>
  );
}

const Empty = ({ children }) => (
  <div style={{ fontFamily: FONT, fontSize: 13, color: "#A3A8AD", padding: "8px 2px" }}>{children}</div>
);

function EquipmentPhoto({ listing, height = 150 }) {
  const photo = listing?.photos && listing.photos[0];
  return photo ? (
    <img src={photo} alt={listing.brand} style={{ width: "100%", height, objectFit: "cover", display: "block", borderRadius: 10, background: "#0e1012" }} />
  ) : (
    <div style={{ height: 70, borderRadius: 10, background: "#0e1012", border: "1px dashed #2a2e32", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT, fontSize: 12, color: "#70777D" }}>
      {listing?.type || "Техніка"}
    </div>
  );
}

function EquipmentFacts({ listing }) {
  const specs = Object.entries(listing?.specs || {}).filter(([, v]) => v && v !== "—").slice(0, 3);
  return (
    <div style={{ fontFamily: FONT, fontSize: 12.5, color: "#A3A8AD", display: "flex", flexDirection: "column", gap: 2 }}>
      <div>
        {listing.type} · {listing.region}
        {listing.owner_name ? ` · ${listing.owner_name}` : ""}
      </div>
      <div style={{ color: "#F4F4F1" }}>
        {listing.price} ₴/{listing.unit}
        {specs.length > 0 && <span style={{ color: "#A3A8AD" }}> · {specs.map(([k, v]) => `${k}: ${v}`).join(" · ")}</span>}
      </div>
    </div>
  );
}

const DECLINE_REASONS = ["Не підходить ціна", "Не підходять дати", "Знайшов іншу техніку", "Більше не потрібно", "Інша причина"];

const OFFER_STATUS = {
  proposed: { text: "Очікує вашої відповіді", color: AMBER },
  accepted: { text: "Ви підтвердили", color: GREEN },
  declined: { text: "Ви відхилили", color: "#70777D" },
  expired: { text: "Час на відповідь минув", color: "#70777D" },
  withdrawn: { text: "Знято диспетчером", color: "#70777D" },
};

function OfferCard({ offer, onRespond }) {
  const [declining, setDeclining] = useState(false);
  const [reason, setReason] = useState(DECLINE_REASONS[0]);
  const [busy, setBusy] = useState(false);
  const l = offer.listing;

  const act = async (action, why) => {
    setBusy(true);
    try {
      await onRespond(offer.id, action, why);
    } finally {
      setBusy(false);
      setDeclining(false);
    }
  };

  return (
    <Plate style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10, borderColor: "rgba(255,181,46,0.35)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <Label>Вам запропонували техніку · заявка №{offer.request_id}</Label>
        <StatusBadge color={AMBER}>Потрібна ваша відповідь</StatusBadge>
      </div>
      <EquipmentPhoto listing={l} />
      <div style={{ fontFamily: FONT, fontSize: 19, fontWeight: 600 }}>{l.brand}</div>
      <EquipmentFacts listing={l} />
      <div style={{ fontFamily: FONT, fontSize: 13 }}>
        <span style={{ color: "#A3A8AD" }}>Період: </span>
        {fmtPeriod(offer.date_from, offer.date_to)}
      </div>
      <div style={{ fontFamily: FONT, fontSize: 11.5, color: "#70777D" }}>Відповісти до {fmtDateTime(offer.expires_at)}</div>

      {!declining ? (
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 4 }}>
          <button disabled={busy} onClick={() => act("accepted")} style={{ ...confirmBtn, opacity: busy ? 0.6 : 1 }}>
            Підтвердити
          </button>
          <button disabled={busy} onClick={() => setDeclining(true)} style={declineBtn}>
            Відхилити
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
          <label style={{ fontFamily: FONT, fontSize: 12, color: "#A3A8AD" }}>
            Причина (побачить диспетчер)
            <select value={reason} onChange={(e) => setReason(e.target.value)} style={{ ...selectStyle, width: "100%", marginTop: 4, minHeight: 44 }}>
              {DECLINE_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button disabled={busy} onClick={() => act("declined", reason)} style={{ ...declineBtn, background: "rgba(201,107,90,0.12)" }}>
              Відхилити пропозицію
            </button>
            <button disabled={busy} onClick={() => setDeclining(false)} style={{ ...smallBtn, minHeight: 48 }}>
              Назад
            </button>
          </div>
        </div>
      )}
    </Plate>
  );
}

const REQUEST_STEPS = ["Заявка", "Підбір", "Пропозиція", "Оренда"];
const REQUEST_INFO = {
  new: { step: 1, text: "Диспетчер підбирає техніку для вас", color: AMBER },
  dispatched: { step: 1, text: "Запит надіслано власникам, чекаємо відповіді", color: AMBER },
  offered: { step: 2, text: "Вам запропоновано техніку — відповідь на вкладці «Пропозиції»", color: AMBER },
  booked: { step: 3, text: "Ви підтвердили — очікуємо підтвердження диспетчера", color: AMBER },
  taken: { step: 4, text: "Оренду підтверджено", color: GREEN },
  expired: { step: 0, text: "Заявка закрита без результату", color: "#70777D" },
  cancelled: { step: 0, text: "Заявку скасовано", color: RED },
};

const CANCELABLE = ["new", "dispatched", "offered"];

function RequestCard({ req, onCancel }) {
  const base = REQUEST_INFO[req.status] || REQUEST_INFO.new;
  const info =
    req.status === "new" && req.listing_id
      ? { ...base, text: "Диспетчер перевіряє вашу бронь і підтвердить — ви отримаєте сповіщення" }
      : base;
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  return (
    <Plate style={{ padding: 14, display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
        <Label>Заявка №{req.id}</Label>
        <StatusBadge color={info.color}>{info.text.split(" — ")[0].split(",")[0]}</StatusBadge>
      </div>
      <div style={{ fontFamily: FONT, fontSize: 17, fontWeight: 600 }}>
        {req.listing_brand ? req.listing_brand : `${req.type} — ${req.region}`}
      </div>
      {req.listing_brand && (
        <div style={{ fontFamily: FONT, fontSize: 12.5, color: "#A3A8AD" }}>
          {req.type} · {req.region}
        </div>
      )}
      <div style={{ fontFamily: FONT, fontSize: 12.5, color: "#A3A8AD" }}>
        {fmtPeriod(req.date_from, req.date_to)}
        {req.with_operator ? " · з оператором" : ""}
        {req.budget ? ` · бюджет ${req.budget} ₴` : ""}
      </div>
      {req.comment && <div style={{ fontFamily: FONT, fontSize: 12.5, color: "#F4F4F1" }}>{req.comment}</div>}
      {info.step > 0 && (
        <div style={{ display: "flex", gap: 4, marginTop: 4 }} aria-label="Хід заявки">
          {REQUEST_STEPS.map((name, i) => (
            <div key={name} style={{ flex: 1 }}>
              <div style={{ height: 4, borderRadius: 2, background: i < info.step ? (req.status === "taken" ? GREEN : "#FF6A1A") : "#2a2e32" }} />
              <div style={{ fontFamily: FONT, fontSize: 10.5, color: i < info.step ? "#F4F4F1" : "#70777D", marginTop: 4 }}>{name}</div>
            </div>
          ))}
        </div>
      )}
      <div style={{ fontFamily: FONT, fontSize: 12.5, color: info.color }}>{info.text}</div>
      {onCancel && CANCELABLE.includes(req.status) &&
        (asking ? (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontFamily: FONT, fontSize: 12, color: "#A3A8AD" }}>Скасувати заявку?</span>
            <button
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await onCancel(req.id);
                } finally {
                  setBusy(false);
                  setAsking(false);
                }
              }}
              style={{ ...smallBtn, borderColor: RED, color: RED, padding: "6px 14px", fontSize: 12 }}
            >
              Так, скасувати
            </button>
            <button onClick={() => setAsking(false)} style={{ ...smallBtn, padding: "6px 14px", fontSize: 12 }}>
              Ні
            </button>
          </div>
        ) : (
          <button onClick={() => setAsking(true)} style={{ background: "none", border: "none", color: "#70777D", cursor: "pointer", fontFamily: FONT, fontSize: 12, textDecoration: "underline", padding: 0, alignSelf: "flex-start" }}>
            Скасувати заявку
          </button>
        ))}
    </Plate>
  );
}

const PHASE_INFO = {
  reserved: { text: "Резерв — очікує підтвердження диспетчера", color: AMBER },
  confirmed: { text: "Оренду підтверджено", color: GREEN },
  active: { text: "Оренда триває", color: GREEN },
  completed: { text: "Завершена", color: "#70777D" },
  cancelled: { text: "Скасована", color: RED },
};

function contactHref(c) {
  const v = String(c || "").trim();
  if (/^[+\d\s()-]{7,}$/.test(v)) return `tel:${v.replace(/[^\d+]/g, "")}`;
  if (v.startsWith("@")) return `https://t.me/${v.slice(1)}`;
  return null;
}

function ContactBlock({ title, name, phone }) {
  const href = contactHref(phone);
  return (
    <div style={{ padding: "10px 12px", background: "rgba(111,174,111,0.1)", border: `1px solid ${GREEN}`, fontFamily: FONT, fontSize: 13 }}>
      <div style={{ color: GREEN, fontSize: 11, marginBottom: 4 }}>{title}</div>
      <div style={{ fontWeight: 600 }}>{name || "—"}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginTop: 2 }}>
        {href ? (
          <a href={href} style={{ color: "#F4F4F1" }} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer">
            {phone}
          </a>
        ) : (
          <span>{phone}</span>
        )}
        <button type="button" onClick={() => navigator.clipboard?.writeText(phone || "")} style={{ ...smallBtn, padding: "3px 10px", fontSize: 11 }}>
          Скопіювати
        </button>
      </div>
    </div>
  );
}

function ClientBookingCard({ booking }) {
  const phase = bookingPhase(booking);
  const info = PHASE_INFO[phase];
  const l = booking.listing;
  return (
    <Plate style={{ padding: 14, display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
        <Label>Оренда{booking.request_id ? ` · заявка №${booking.request_id}` : ""}</Label>
        <StatusBadge color={info.color}>{info.text.split(" — ")[0]}</StatusBadge>
      </div>
      <div style={{ fontFamily: FONT, fontSize: 17, fontWeight: 600 }}>{l.brand}</div>
      <EquipmentFacts listing={l} />
      <div style={{ fontFamily: FONT, fontSize: 13 }}>
        <span style={{ color: "#A3A8AD" }}>Період: </span>
        {fmtPeriod(booking.date_from, booking.date_to)}
      </div>
      {phase === "reserved" && <div style={{ fontFamily: FONT, fontSize: 12.5, color: AMBER }}>{info.text}</div>}
      {booking.owner_contact && <ContactBlock title="Контакт власника техніки" name={booking.owner_contact.name} phone={booking.owner_contact.phone} />}
    </Plate>
  );
}

// ---- Кабінет клієнта ----
export function ClientCabinet({ data, onRespond, onRefresh, onCancelRequest, initialTab }) {
  const pending = data.offers.filter((o) => o.status === "proposed");
  const history = data.offers.filter((o) => o.status !== "proposed");
  const hasRental = data.bookings.some((b) => ["reserved", "confirmed"].includes(b.status));
  // Спершу те, що вимагає дії або вже підтверджено: пропозиція → оренда з контактом → заявки
  const [tab, setTab] = useState(initialTab || (pending.length ? "offers" : hasRental ? "rentals" : "requests"));
  const [showHistory, setShowHistory] = useState(false);

  const tabs = [
    { key: "offers", label: "Пропозиції", count: pending.length, alert: true },
    { key: "requests", label: "Мої заявки", count: data.requests.length },
    { key: "rentals", label: "Мої оренди", count: data.bookings.filter((b) => ["reserved", "confirmed"].includes(b.status)).length },
  ];

  return (
    <div>
      <Tabs tabs={tabs} value={tab} onChange={setTab} />
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <button onClick={onRefresh} style={{ ...smallBtn, alignSelf: "flex-start", padding: "5px 12px", fontSize: 12 }}>
          Оновити
        </button>

        {tab === "offers" && (
          <>
            {pending.length === 0 && <Empty>Нових пропозицій поки немає. Щойно диспетчер підбере техніку, вона з'явиться тут і ви отримаєте сповіщення.</Empty>}
            {pending.map((o) => (
              <OfferCard key={o.id} offer={o} onRespond={onRespond} />
            ))}
            {history.length > 0 && (
              <div>
                <button onClick={() => setShowHistory((s) => !s)} style={{ background: "none", border: "none", color: "#A3A8AD", cursor: "pointer", fontFamily: FONT, fontSize: 12, padding: 0 }}>
                  {showHistory ? "▲ Сховати історію" : `▼ Історія пропозицій (${history.length})`}
                </button>
                {showHistory && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
                    {history.map((o) => {
                      const st = OFFER_STATUS[o.status] || OFFER_STATUS.withdrawn;
                      return (
                        <div key={o.id} style={{ fontFamily: FONT, fontSize: 12.5, display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                          <span>
                            {o.listing.brand} · {fmtPeriod(o.date_from, o.date_to)}
                          </span>
                          <span style={{ color: st.color }}>
                            {st.text}
                            {o.decline_reason ? ` — ${o.decline_reason}` : ""}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {tab === "requests" && (
          <>
            {data.requests.length === 0 && <Empty>Заявок поки немає. Натисніть «Залишити заявку» на головній сторінці.</Empty>}
            {data.requests.map((r) => (
              <RequestCard key={r.id} req={r} onCancel={onCancelRequest} />
            ))}
          </>
        )}

        {tab === "rentals" && (
          <>
            {data.bookings.length === 0 && <Empty>Оренд поки немає. Після підтвердження пропозиції оренда з'явиться тут.</Empty>}
            {data.bookings.map((b) => (
              <ClientBookingCard key={b.id} booking={b} />
            ))}
          </>
        )}
      </div>
    </div>
  );
}

// ---- Кабінет власника: оренди його техніки ----
function OwnerBookingCard({ booking }) {
  const phase = bookingPhase(booking);
  const info = PHASE_INFO[phase];
  const l = booking.listing;
  const c = booking.client || {};
  return (
    <Plate style={{ padding: 14, display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
        <Label>{l.brand}</Label>
        <StatusBadge color={info.color}>{info.text.split(" — ")[0]}</StatusBadge>
      </div>
      <div style={{ fontFamily: FONT, fontSize: 16, fontWeight: 600 }}>{fmtPeriod(booking.date_from, booking.date_to)}</div>
      <div style={{ fontFamily: FONT, fontSize: 12.5, color: "#A3A8AD" }}>
        {l.type} · {booking.request?.region || l.region}
        {booking.request?.with_operator ? " · з оператором" : ""}
      </div>
      {booking.request?.comment && <div style={{ fontFamily: FONT, fontSize: 12.5, color: "#F4F4F1" }}>{booking.request.comment}</div>}
      <div style={{ fontFamily: FONT, fontSize: 12.5 }}>
        <span style={{ color: "#A3A8AD" }}>Клієнт: </span>
        {c.name || "—"}
      </div>
      {phase === "reserved" && (
        <div style={{ fontFamily: FONT, fontSize: 12, color: AMBER }}>Диспетчер підтверджує оренду. Телефон клієнта з'явиться після підтвердження.</div>
      )}
      {c.phone && <ContactBlock title="Контакт клієнта" name={c.name} phone={c.phone} />}
    </Plate>
  );
}

export function OwnerBookings({ bookings, onRefresh }) {
  const order = { reserved: 0, confirmed: 1, active: 1, completed: 2, cancelled: 3 };
  const sorted = [...bookings].sort((a, b) => order[bookingPhase(a)] - order[bookingPhase(b)]);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <button onClick={onRefresh} style={{ ...smallBtn, alignSelf: "flex-start", padding: "5px 12px", fontSize: 12 }}>
        Оновити
      </button>
      {sorted.length === 0 && <Empty>Оренд вашої техніки поки немає. Коли клієнт підтвердить вашу техніку, вона з'явиться тут.</Empty>}
      {sorted.map((b) => (
        <OwnerBookingCard key={b.id} booking={b} />
      ))}
    </div>
  );
}

export function OwnerCabinet({ tab, setTab, inboxItems, bookings, onRespondRequest, onRefreshInbox, onRefreshBookings }) {
  const pendingRequests = inboxItems.filter((x) => x.dispatch_status === "sent" && x.req_status !== "taken").length;
  const reserved = bookings.filter((b) => b.status === "reserved").length;
  return (
    <div>
      <Tabs
        tabs={[
          { key: "rentals", label: "Оренди моєї техніки", count: reserved, alert: true },
          { key: "requests", label: "Запити від диспетчера", count: pendingRequests, alert: true },
        ]}
        value={tab}
        onChange={setTab}
      />
      {tab === "rentals" ? (
        <OwnerBookings bookings={bookings} onRefresh={onRefreshBookings} />
      ) : (
        <OwnerInbox items={inboxItems} onRespond={onRespondRequest} onRefresh={onRefreshInbox} />
      )}
    </div>
  );
}

// ---- Сповіщення ----
const KIND_COLOR = {
  new_request: RED,
  offer_proposed: AMBER,
  offer_accepted: GREEN,
  offer_declined: RED,
  offer_expired: "#70777D",
  offer_conflict: RED,
  booking_reserved: AMBER,
  booking_confirmed: GREEN,
  booking_cancelled: RED,
  request_declined: AMBER,
  request_cancelled: "#70777D",
  role_changed: GREEN,
  new_user: AMBER,
};

export function NotificationsPanel({ items, onOpenItem, onMarkAll }) {
  const unread = items.filter((n) => !n.read_at).length;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {unread > 0 && (
        <button onClick={onMarkAll} style={{ ...smallBtn, alignSelf: "flex-start", padding: "5px 12px", fontSize: 12 }}>
          Позначити всі прочитаними
        </button>
      )}
      {items.length === 0 && <Empty>Сповіщень поки немає.</Empty>}
      {items.map((n) => (
        <button
          key={n.id}
          onClick={() => onOpenItem(n)}
          style={{
            textAlign: "left",
            background: n.read_at ? "transparent" : "rgba(255,106,26,0.07)",
            border: "1px solid #2a2e32",
            borderLeft: `3px solid ${KIND_COLOR[n.kind] || "#70777D"}`,
            color: "#F4F4F1",
            padding: "10px 12px",
            cursor: "pointer",
            fontFamily: FONT,
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          <span style={{ fontSize: 13, fontWeight: n.read_at ? 400 : 600 }}>{n.title}</span>
          {n.body && <span style={{ fontSize: 12, color: "#A3A8AD" }}>{n.body}</span>}
          <span style={{ fontSize: 11, color: "#70777D" }}>{fmtDateTime(n.created_at)}</span>
        </button>
      ))}
    </div>
  );
}

// ---- Кабінет власника: запити від диспетчера (було в головному файлі) ----
const INBOX_STATUS = {
  sent: { text: "Очікує вашої відповіді", color: "#FFB52E" },
  accepted: { text: "Ви прийняли", color: "#6fae6f" },
  rejected: { text: "Ви відмовились", color: "#70777D" },
  expired: { text: "Заявку взяв інший власник", color: "#70777D" },
};

// Кабінет власника: запити від диспетчера з кнопками «Прийняти» / «Відмовитись».
// Телефон клієнта приходить із бази лише після того, як власник прийняв заявку.
export function OwnerInbox({ items, onRespond, onRefresh }) {
  const [busyId, setBusyId] = useState(null);
  const font = "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif";

  const act = async (id, action) => {
    setBusyId(id);
    try {
      await onRespond(id, action);
    } finally {
      setBusyId(null);
    }
  };

  const contactLink = (c) => {
    const v = String(c || "").trim();
    if (/^[+\d\s()-]{7,}$/.test(v)) return `tel:${v.replace(/[^\d+]/g, "")}`;
    if (v.startsWith("@")) return `https://t.me/${v.slice(1)}`;
    return null;
  };

  if (!items.length) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12, fontFamily: font, fontSize: 13, color: "#A3A8AD" }}>
        <div>Поки запитів немає. Коли диспетчер надішле вам заявку на вашу техніку, вона з'явиться тут.</div>
        <button onClick={onRefresh} style={smallBtn}>Оновити</button>
      </div>
    );
  }

  const isPending = (x) => x.dispatch_status === "sent" && x.req_status !== "taken";
  const ordered = [...items.filter(isPending), ...items.filter((x) => !isPending(x))];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <button onClick={onRefresh} style={{ ...smallBtn, alignSelf: "flex-start" }}>Оновити</button>
      {ordered.map((x) => {
        const st = INBOX_STATUS[x.dispatch_status] || INBOX_STATUS.sent;
        const link = contactLink(x.req_contact);
        return (
          <div key={x.dispatch_id} style={{ border: "1px solid #63696D", padding: "14px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
              <Label>Заявка #{x.request_id}</Label>
              <span style={{ fontFamily: font, fontSize: 11.5, color: st.color }}>{st.text}</span>
            </div>
            <div style={{ fontFamily: font, fontSize: 16, fontWeight: 600 }}>
              {x.req_type} — {x.req_region}
            </div>
            <div style={{ fontFamily: font, fontSize: 12.5, color: "#A3A8AD" }}>
              Бюджет: {x.req_budget ? `${x.req_budget} ₴` : "—"} · Дата: {x.req_date_from || "не вказано"}
            </div>
            {x.req_comment && <div style={{ fontFamily: font, fontSize: 12.5, color: "#F4F4F1" }}>{x.req_comment}</div>}

            {isPending(x) && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
                <button disabled={busyId === x.dispatch_id} onClick={() => act(x.dispatch_id, "accepted")} style={{ ...primaryBtn, opacity: busyId === x.dispatch_id ? 0.6 : 1 }}>
                  Прийняти
                </button>
                <button disabled={busyId === x.dispatch_id} onClick={() => act(x.dispatch_id, "rejected")} style={smallBtn}>
                  Відмовитись
                </button>
              </div>
            )}

            {x.dispatch_status === "accepted" && (
              <div style={{ marginTop: 4, padding: "10px 12px", background: "rgba(111,174,111,0.1)", border: "1px solid #6fae6f", fontFamily: font, fontSize: 13 }}>
                <div style={{ color: "#6fae6f", fontSize: 11, marginBottom: 4 }}>Контакт клієнта</div>
                <div style={{ fontWeight: 600 }}>{x.req_requester_name || "Клієнт"}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginTop: 2 }}>
                  {link ? (
                    <a href={link} style={{ color: "#F4F4F1" }} target={link.startsWith("http") ? "_blank" : undefined} rel="noreferrer">
                      {x.req_contact}
                    </a>
                  ) : (
                    <span>{x.req_contact}</span>
                  )}
                  <button type="button" onClick={() => navigator.clipboard?.writeText(x.req_contact || "")} style={{ ...smallBtn, padding: "3px 10px", fontSize: 11 }}>
                    Скопіювати
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}


// ---- Бронювання техніки клієнтом: техніка + дати → заявка диспетчеру ----
export function BookingForm({ listing, busyRanges, onSubmit, initialFrom = "", initialTo = "" }) {
  const today = todayLocal();
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);
  const [operator, setOperator] = useState(false);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  // Календар зайнятості видно ДО відправки — як у світових сервісах бронювання
  const taken = (busyRanges || [])
    .filter((r) => r.listing_id === listing.id && r.date_to >= today)
    .sort((a, b) => (a.date_from < b.date_from ? -1 : 1));
  const reversed = !!(from && to && to < from);
  const clash = from && to && !reversed ? taken.find((r) => rangesOverlap(r.date_from, r.date_to, from, to)) : null;
  const days = daysInclusive(from, to);
  const estimate = days > 0 && (listing.unit === "добу" || listing.unit === "зміну") ? days * Number(listing.price) : null;
  const canSend = !!from && !!to && !reversed && !clash && !busy;

  const submit = async (e) => {
    e.preventDefault();
    if (!canSend) return;
    setBusy(true);
    try {
      await onSubmit({ dateFrom: from, dateTo: to, withOperator: operator, comment });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div>
        <div style={{ fontFamily: FONT, fontSize: 18, fontWeight: 600 }}>{listing.brand}</div>
        <div style={{ fontFamily: FONT, fontSize: 12.5, color: "#A3A8AD" }}>
          {listing.type} · {listing.region} · {listing.price} ₴/{listing.unit}
        </div>
      </div>

      {taken.length > 0 ? (
        <div style={{ padding: "10px 12px", border: "1px solid #c96b5a", background: "rgba(201,107,90,0.08)", fontFamily: FONT, fontSize: 12.5 }}>
          <div style={{ color: "#e0a89c", fontWeight: 600, marginBottom: 4 }}>Ці дати вже зайняті</div>
          {taken.map((r, i) => (
            <div key={i} style={{ color: "#e0a89c" }}>
              {fmtDate(r.date_from)} — {fmtDate(r.date_to)}
            </div>
          ))}
        </div>
      ) : (
        <div style={{ fontFamily: FONT, fontSize: 12.5, color: GREEN }}>Найближчим часом техніка вільна</div>
      )}

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Field label="З якого дня" style={{ flex: "1 1 140px" }}>
          <input type="date" aria-label="З якого дня" min={today} value={from} onChange={(e) => setFrom(e.target.value)} style={inputStyle} required />
        </Field>
        <Field label="По який день" style={{ flex: "1 1 140px" }}>
          <input type="date" aria-label="По який день" min={from || today} value={to} onChange={(e) => setTo(e.target.value)} style={inputStyle} required />
        </Field>
      </div>
      {reversed && <ErrorText>Кінець періоду не може бути раніше за початок</ErrorText>}
      {clash && <ErrorText>Ці дати зайняті ({fmtDate(clash.date_from)} — {fmtDate(clash.date_to)}). Оберіть інші.</ErrorText>}

      {estimate !== null && !clash && (
        <div style={{ fontFamily: FONT, fontSize: 13 }}>
          Орієнтовно: {listing.price} ₴ × {days} = <b>{estimate.toLocaleString("uk-UA")} ₴</b>
          <span style={{ color: "#70777D" }}> (без доставки; остаточну ціну підтвердить диспетчер)</span>
        </div>
      )}

      <label style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: FONT, fontSize: 13, color: "#A3A8AD", cursor: "pointer" }}>
        <input type="checkbox" checked={operator} onChange={(e) => setOperator(e.target.checked)} style={{ accentColor: "#FF6A1A", width: 18, height: 18 }} />
        Потрібна техніка з оператором
      </label>

      <Field label="Коментар (необов'язково): що робитимете, адреса об'єкта">
        <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={2} style={{ ...inputStyle, resize: "vertical" }} />
      </Field>

      <button className="btn-premium-hover" type="submit" disabled={!canSend} style={{ ...primaryBtn, width: "100%", minHeight: 48, opacity: canSend ? 1 : 0.5, cursor: canSend ? "pointer" : "not-allowed" }}>
        {busy ? "Надсилаємо..." : "Надіслати заявку на бронь"}
      </button>
      <div style={{ fontFamily: FONT, fontSize: 11.5, color: "#70777D" }}>
        Диспетчер перевірить дати й підтвердить — зазвичай протягом години в робочий час. Контакт власника відкриється у вашому кабінеті після підтвердження.
      </div>
    </form>
  );
}


// ---- Календар зайнятості техніки (2 місяці): червоним — зайнято ----
const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"];

export function AvailabilityCalendar({ ranges, months = 2, selectFrom, selectTo }) {
  const today = todayLocal();
  const base = new Date();
  const blocks = [];
  for (let m = 0; m < months; m++) {
    const first = new Date(base.getFullYear(), base.getMonth() + m, 1);
    const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
    const lead = (first.getDay() + 6) % 7; // тиждень починається з понеділка
    const cells = Array(lead).fill(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const iso = `${first.getFullYear()}-${String(first.getMonth() + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      cells.push({
        d,
        iso,
        busy: (ranges || []).some((r) => r.date_from <= iso && iso <= r.date_to),
        past: iso < today,
        today: iso === today,
        sel: !!(selectFrom && selectTo && iso >= selectFrom && iso <= selectTo),
      });
    }
    blocks.push({ title: first.toLocaleDateString("uk-UA", { month: "long", year: "numeric" }), cells });
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }} aria-label="Календар зайнятості">
      <div style={{ display: "flex", gap: 14, fontFamily: FONT, fontSize: 11.5, color: "#A3A8AD", flexWrap: "wrap" }}>
        <span><span style={{ display: "inline-block", width: 10, height: 10, background: "rgba(201,107,90,0.55)", marginRight: 6, verticalAlign: "middle" }} />зайнято</span>
        <span><span style={{ display: "inline-block", width: 10, height: 10, border: "1px solid #63696D", marginRight: 6, verticalAlign: "middle" }} />вільно</span>
        {selectFrom && selectTo && <span><span style={{ display: "inline-block", width: 10, height: 10, border: "1px solid #FF6A1A", marginRight: 6, verticalAlign: "middle" }} />ваші дати</span>}
      </div>
      <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
        {blocks.map((b) => (
          <div key={b.title} style={{ flex: "1 1 220px", minWidth: 210 }}>
            <div style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, marginBottom: 6, textTransform: "capitalize" }}>{b.title}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, fontFamily: FONT, fontSize: 11.5, textAlign: "center" }}>
              {WEEKDAYS.map((w) => (
                <div key={w} style={{ color: "#70777D", padding: "2px 0" }}>{w}</div>
              ))}
              {b.cells.map((cell, i) =>
                cell ? (
                  <div
                    key={cell.iso}
                    title={cell.busy ? "Зайнято" : "Вільно"}
                    data-busy={cell.busy ? "1" : "0"}
                    style={{
                      padding: "5px 0",
                      background: cell.busy ? "rgba(201,107,90,0.45)" : "transparent",
                      color: cell.busy ? "#f0c4ba" : "#F4F4F1",
                      opacity: cell.past ? 0.35 : 1,
                      outline: cell.sel ? "1px solid #FF6A1A" : "none",
                      fontWeight: cell.today ? 700 : 400,
                      textDecoration: cell.today ? "underline" : "none",
                    }}
                  >
                    {cell.d}
                  </div>
                ) : (
                  <div key={`e${i}`} />
                )
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
