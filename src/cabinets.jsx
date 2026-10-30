// Кабінети клієнта й власника та панель сповіщень.
// Принцип екрана: «що мені тут зробити далі?» — активна дія завжди найпомітніша.
import React, { useState, useRef } from "react";
import { Plate, Label, Field, ErrorText, RoleTag, primaryBtn, smallBtn, selectStyle, inputStyle } from "./ui.jsx";
import { fetchListingViewers, bookingPhase, fmtDate, fmtPeriod, fmtDateTime, daysInclusive, rangesOverlap, todayLocal, unitLabel } from "./services/deals.js";
import { OwnerResponses } from "./wanted.jsx";
import { SlidingTabs } from "./motion/index.jsx";
import { useLang, useTx, LOCALES, trType, trUnit } from "./lang.js";

const FONT = "'Manrope', -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif";
const GREEN = "#B9F6CA";
const RED = "#FFD0C4";
const AMBER = "#FFF0D2";

const confirmBtn = {
  ...primaryBtn,
  background: "linear-gradient(180deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.04) 42%, rgba(255,255,255,0) 100%), linear-gradient(90deg, rgba(62,154,92,0.62), rgba(185,246,202,0.46)), rgba(22,14,9,0.6)",
  border: "1px solid rgba(150,215,160,0.7)",
  boxShadow: "inset 0 1.5px 0 rgba(255,255,255,0.4), inset 0 -9px 14px -7px rgba(185,246,202,0.6), 0 10px 20px -9px rgba(185,246,202,0.7), 0 2px 5px rgba(0,0,0,0.45)",
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
    <div role="tablist" style={{ borderBottom: "1px solid #EFA06A", marginBottom: 14 }}>
      <SlidingTabs
        tabs={tabs}
        value={value}
        onChange={onChange}
        buttonStyle={(active) => ({ background: "none", border: "none", color: active ? "#F4F4F1" : "#FFE6D0", fontFamily: FONT, fontSize: 13, padding: "10px 12px", cursor: "pointer", whiteSpace: "nowrap", minHeight: 44 })}
        renderLabel={(t) => (
          <>
            {t.label}
            {t.count > 0 && (
              <span key={t.count} className="mo-badge-pop" style={{ display: "inline-block", marginLeft: 6, background: t.alert ? "#FFE3BD" : "#E99660", color: t.alert ? "#3A1405" : "#F4F4F1", borderRadius: 980, padding: "1px 7px", fontSize: 11, fontWeight: 600 }}>
                {t.count}
              </span>
            )}
          </>
        )}
      />
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
  <div style={{ fontFamily: FONT, fontSize: 13, color: "#FFE6D0", padding: "8px 2px" }}>{children}</div>
);

function EquipmentPhoto({ listing, height = 150 }) {
  const photo = listing?.photos && listing.photos[0];
  return photo ? (
    <img src={photo} alt={listing.brand} style={{ width: "100%", height, objectFit: "cover", display: "block", borderRadius: 10, background: "#7A2807" }} />
  ) : (
    <div style={{ height: 70, borderRadius: 10, background: "#7A2807", border: "1px dashed #E99660", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT, fontSize: 12, color: "#FFD3B0" }}>
      {listing?.type || "Техніка"}
    </div>
  );
}

function EquipmentFacts({ listing }) {
  const specs = Object.entries(listing?.specs || {}).filter(([, v]) => v && v !== "—").slice(0, 3);
  return (
    <div style={{ fontFamily: FONT, fontSize: 12.5, color: "#FFE6D0", display: "flex", flexDirection: "column", gap: 2 }}>
      <div>
        {listing.type} · {listing.region}
        {listing.owner_name ? ` · ${listing.owner_name}` : ""}
      </div>
      <div style={{ color: "#F4F4F1" }}>
        {listing.price} ₴/{listing.unit}
        {specs.length > 0 && <span style={{ color: "#FFE6D0" }}> · {specs.map(([k, v]) => `${k}: ${v}`).join(" · ")}</span>}
      </div>
    </div>
  );
}

const DECLINE_REASONS = ["Не підходить ціна", "Не підходять дати", "Знайшов іншу техніку", "Більше не потрібно", "Інша причина"];

const OFFER_STATUS = {
  proposed: { text: "Очікує вашої відповіді", color: AMBER },
  accepted: { text: "Ви підтвердили", color: GREEN },
  declined: { text: "Ви відхилили", color: "#FFD3B0" },
  expired: { text: "Час на відповідь минув", color: "#FFD3B0" },
  withdrawn: { text: "Знято диспетчером", color: "#FFD3B0" },
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
    <Plate style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10, borderColor: "rgba(255,226,170,0.35)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <Label>Вам запропонували техніку · заявка №{offer.request_id}</Label>
        <StatusBadge color={AMBER}>Потрібна ваша відповідь</StatusBadge>
      </div>
      <EquipmentPhoto listing={l} />
      <div style={{ fontFamily: FONT, fontSize: 19, fontWeight: 600 }}>{l.brand}</div>
      <EquipmentFacts listing={l} />
      <div style={{ fontFamily: FONT, fontSize: 13 }}>
        <span style={{ color: "#FFE6D0" }}>Період: </span>
        {fmtPeriod(offer.date_from, offer.date_to)}
      </div>
      <div style={{ fontFamily: FONT, fontSize: 11.5, color: "#FFD3B0" }}>Відповісти до {fmtDateTime(offer.expires_at)}</div>

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
          <label style={{ fontFamily: FONT, fontSize: 12, color: "#FFE6D0" }}>
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
            <button disabled={busy} onClick={() => act("declined", reason)} style={{ ...declineBtn, background: "rgba(255,208,196,0.12)" }}>
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
  expired: { step: 0, text: "Заявка закрита без результату", color: "#FFD3B0" },
  cancelled: { step: 0, text: "Заявку скасовано", color: RED },
};

const CANCELABLE = ["new", "dispatched", "offered"];

function RequestCard({ req, onCancel, onTogglePublic, onChoose }) {
  const base = REQUEST_INFO[req.status] || REQUEST_INFO.new;
  const info =
    req.status === "new" && req.listing_id
      ? { ...base, text: "Диспетчер перевіряє вашу бронь і підтвердить — ви отримаєте сповіщення" }
      : req.status === "new" && req.is_public
      ? { ...base, text: "Заявка на дошці запитів: власники можуть відгукнутись, диспетчер теж підбирає техніку" }
      : base;
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [choosing, setChoosing] = useState(null);
  const responses = req.responses || [];
  return (
    <Plate style={{ padding: 14, display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <RoleTag kind="rent" />
          <Label>Заявка №{req.id}</Label>
        </span>
        <StatusBadge color={info.color}>{info.text.split(" — ")[0].split(",")[0]}</StatusBadge>
      </div>
      <div style={{ fontFamily: FONT, fontSize: 17, fontWeight: 600 }}>
        {req.listing_brand ? req.listing_brand : `${req.type} — ${req.region}`}
      </div>
      {req.listing_brand && (
        <div style={{ fontFamily: FONT, fontSize: 12.5, color: "#FFE6D0" }}>
          {req.type} · {req.region}
        </div>
      )}
      <div style={{ fontFamily: FONT, fontSize: 12.5, color: "#FFE6D0" }}>
        {fmtPeriod(req.date_from, req.date_to)}
        {req.with_operator ? " · з оператором" : ""}
        {req.budget ? ` · ${Number(req.budget).toLocaleString("uk-UA")} ₴ ${unitLabel(req.budget_unit || "період")}` : ""}
      </div>
      {req.comment && <div style={{ fontFamily: FONT, fontSize: 12.5, color: "#F4F4F1" }}>{req.comment}</div>}
      {info.step > 0 && (
        <div style={{ display: "flex", gap: 4, marginTop: 4 }} aria-label="Хід заявки">
          {REQUEST_STEPS.map((name, i) => (
            <div key={name} style={{ flex: 1 }}>
              <div style={{ height: 4, borderRadius: 2, background: i < info.step ? (req.status === "taken" ? GREEN : "#FFE3BD") : "#E99660" }} />
              <div style={{ fontFamily: FONT, fontSize: 10.5, color: i < info.step ? "#F4F4F1" : "#FFD3B0", marginTop: 4 }}>{name}</div>
            </div>
          ))}
        </div>
      )}
      <div style={{ fontFamily: FONT, fontSize: 12.5, color: info.color }}>{info.text}</div>

      {onTogglePublic && CANCELABLE.includes(req.status) && !req.listing_id && (
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontFamily: FONT, fontSize: 12, color: req.is_public ? GREEN : "#FFD3B0" }}>
            {req.is_public ? "● Заявку видно на дошці запитів" : "Заявка не вивішена на дошці"}
          </span>
          <button onClick={() => onTogglePublic(req.id, !req.is_public)} style={{ ...smallBtn, padding: "5px 12px", fontSize: 12 }}>
            {req.is_public ? "Зняти з дошки" : "Вивісити на дошці"}
          </button>
        </div>
      )}

      {responses.length > 0 && (
        <div style={{ borderTop: "1px dashed #F2AE7C", paddingTop: 10, display: "flex", flexDirection: "column", gap: 10 }}>
          <Label>Відгуки власників ({responses.length})</Label>
          {responses.map((r) => {
            const l = r.listing;
            const specs = Object.entries(l.specs || {}).filter(([, v]) => v && v !== "—").slice(0, 3);
            return (
              <div key={r.id} style={{ border: `1px solid ${r.status === "chosen" ? GREEN : "#E99660"}`, padding: "10px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
                <EquipmentPhoto listing={l} height={110} />
                <div style={{ fontFamily: FONT, fontSize: 15, fontWeight: 600 }}>{l.brand}</div>
                <div style={{ fontFamily: FONT, fontSize: 12.5, color: "#FFE6D0" }}>
                  {l.type} · {l.region}
                  {l.owner_name ? ` · ${l.owner_name}` : ""}
                  {specs.length > 0 ? ` · ${specs.map(([k, v]) => `${k}: ${v}`).join(" · ")}` : ""}
                </div>
                <div style={{ fontFamily: FONT, fontSize: 16, fontWeight: 700, color: "#FFE3BD" }}>
                  {Number(r.price).toLocaleString("uk-UA")} ₴ {unitLabel(r.price_unit)}
                </div>
                {r.note && <div style={{ fontFamily: FONT, fontSize: 12.5, color: "#FFF1E3" }}>«{r.note}»</div>}
                {r.status === "chosen" ? (
                  <div style={{ fontFamily: FONT, fontSize: 12.5, color: GREEN }}>Обрано — диспетчер підтверджує оренду</div>
                ) : (
                  !req.listing_id &&
                  onChoose && (
                    <button
                      disabled={choosing === r.id}
                      onClick={async () => {
                        setChoosing(r.id);
                        try {
                          await onChoose(r.id);
                        } finally {
                          setChoosing(null);
                        }
                      }}
                      style={{ ...confirmBtn, flex: "none", width: "100%", opacity: choosing === r.id ? 0.6 : 1 }}
                    >
                      Обрати цю пропозицію
                    </button>
                  )
                )}
              </div>
            );
          })}
        </div>
      )}

      {onCancel && CANCELABLE.includes(req.status) &&
        (asking ? (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontFamily: FONT, fontSize: 12, color: "#FFE6D0" }}>Скасувати заявку?</span>
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
          <button onClick={() => setAsking(true)} style={{ background: "none", border: "none", color: "#FFD3B0", cursor: "pointer", fontFamily: FONT, fontSize: 12, textDecoration: "underline", padding: 0, alignSelf: "flex-start" }}>
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
  completed: { text: "Завершена", color: "#FFD3B0" },
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
    <div style={{ padding: "10px 12px", background: "rgba(185,246,202,0.1)", border: `1px solid ${GREEN}`, fontFamily: FONT, fontSize: 13 }}>
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
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <RoleTag kind="rent" />
          <Label>Оренда{booking.request_id ? ` · заявка №${booking.request_id}` : ""}</Label>
        </span>
        <StatusBadge color={info.color}>{info.text.split(" — ")[0]}</StatusBadge>
      </div>
      <div style={{ fontFamily: FONT, fontSize: 17, fontWeight: 600 }}>{l.brand}</div>
      <EquipmentFacts listing={l} />
      <div style={{ fontFamily: FONT, fontSize: 13 }}>
        <span style={{ color: "#FFE6D0" }}>Період: </span>
        {fmtPeriod(booking.date_from, booking.date_to)}
      </div>
      {phase === "reserved" && <div style={{ fontFamily: FONT, fontSize: 12.5, color: AMBER }}>{info.text}</div>}
      {booking.owner_contact && <ContactBlock title="Контакт власника техніки" name={booking.owner_contact.name} phone={booking.owner_contact.phone} />}
    </Plate>
  );
}

// ---- Кабінет клієнта ----
export function ClientCabinet({ data, onRespond, onRefresh, onCancelRequest, onTogglePublic, onChooseResponse, initialTab }) {
  const pending = data.offers.filter((o) => o.status === "proposed");
  const history = data.offers.filter((o) => o.status !== "proposed");
  const hasRental = data.bookings.some((b) => ["reserved", "confirmed"].includes(b.status));
  const newResponses = data.requests.reduce((n, r) => n + (r.responses || []).filter((x) => x.status === "sent" && !r.listing_id).length, 0);
  // Спершу те, що вимагає дії: пропозиція → відгуки на заявку → оренда з контактом → заявки
  const [tab, setTab] = useState(initialTab || (pending.length ? "offers" : newResponses ? "requests" : hasRental ? "rentals" : "requests"));
  const [showHistory, setShowHistory] = useState(false);

  const tabs = [
    { key: "offers", label: "Пропозиції", count: pending.length, alert: true },
    { key: "requests", label: "Мої заявки", count: newResponses > 0 ? newResponses : data.requests.length, alert: newResponses > 0 },
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
                <button onClick={() => setShowHistory((s) => !s)} style={{ background: "none", border: "none", color: "#FFE6D0", cursor: "pointer", fontFamily: FONT, fontSize: 12, padding: 0 }}>
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
              <RequestCard key={r.id} req={r} onCancel={onCancelRequest} onTogglePublic={onTogglePublic} onChoose={onChooseResponse} />
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
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <RoleTag kind="lease" />
          <Label>{l.brand}</Label>
        </span>
        <StatusBadge color={info.color}>{info.text.split(" — ")[0]}</StatusBadge>
      </div>
      <div style={{ fontFamily: FONT, fontSize: 16, fontWeight: 600 }}>{fmtPeriod(booking.date_from, booking.date_to)}</div>
      <div style={{ fontFamily: FONT, fontSize: 12.5, color: "#FFE6D0" }}>
        {l.type} · {booking.request?.region || l.region}
        {booking.request?.with_operator ? " · з оператором" : ""}
      </div>
      {booking.request?.comment && <div style={{ fontFamily: FONT, fontSize: 12.5, color: "#F4F4F1" }}>{booking.request.comment}</div>}
      <div style={{ fontFamily: FONT, fontSize: 12.5 }}>
        <span style={{ color: "#FFE6D0" }}>Клієнт: </span>
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

// ---- «Моя техніка»: уся техніка власника, скільки разів дивились і хто ----
function StatCell({ label, value, hot }) {
  return (
    <div style={{ minWidth: 64 }}>
      <div style={{ fontSize: 18, fontWeight: 700, color: hot ? "#B9F6CA" : "#F4F4F1", lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: 11, color: "#FFE6D0" }}>{label}</div>
    </div>
  );
}

function ViewersList({ listingId }) {
  const [rows, setRows] = useState(null);
  React.useEffect(() => {
    let alive = true;
    fetchListingViewers(listingId, 50).then((r) => { if (alive) setRows(r); });
    return () => { alive = false; };
  }, [listingId]);
  if (rows === null) return <Empty>Завантажуємо…</Empty>;
  if (rows.length === 0) return <Empty>Перегляди з'являться тут, коли хтось відкриє вашу техніку.</Empty>;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0, fontFamily: FONT, fontSize: 12.5 }}>
      {rows.map((v, i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 10, padding: "7px 0", borderTop: i ? "1px dashed #F2AE7C" : "none" }}>
          <span>
            <span style={{ color: v.is_member ? "#B9F6CA" : "#FFE6D0" }}>{v.is_member ? "● " : "○ "}</span>
            {v.name ? <b>{v.name}</b> : v.is_member ? "Зареєстрований клієнт" : "Гість сайту"}
            {v.phone ? ` · ${v.phone}` : ""}
            {v.hits > 1 ? ` · ${v.hits}×` : ""}
          </span>
          <span style={{ color: "#FFE6D0", whiteSpace: "nowrap" }}>{fmtDateTime(v.last_at)}</span>
        </div>
      ))}
      <div style={{ fontSize: 11, color: "#FFE6D0", paddingTop: 6 }}>
        Контакти клієнтів бачить диспетчер — він підбирає техніку під заявки та зв'язується з вами.
      </div>
    </div>
  );
}

function OwnerListings({ listings, stats, onOpen, onEdit, onRefresh }) {
  const [openId, setOpenId] = useState(null);
  const byId = {};
  (stats || []).forEach((x) => { byId[x.listing_id] = x; });
  const sum = (k) => listings.reduce((a, l) => a + Number((byId[l.id] || {})[k] || 0), 0);
  const sorted = [...listings].sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", gap: 22, flexWrap: "wrap", alignItems: "flex-end" }}>
        <StatCell label="одиниць техніки" value={listings.length} />
        <StatCell label="переглядів сьогодні" value={sum("views_today")} hot={sum("views_today") > 0} />
        <StatCell label="за 7 днів" value={sum("views_7d")} />
        <StatCell label="за весь час" value={sum("views_total")} />
        <button onClick={onRefresh} style={{ ...smallBtn, marginLeft: "auto", padding: "5px 12px", fontSize: 12 }}>Оновити</button>
      </div>
      {sorted.length === 0 && <Empty>Ви ще не додали жодної техніки. Натисніть «Додати техніку» на головній сторінці.</Empty>}
      {sorted.map((l) => {
        const st = byId[l.id] || {};
        const open = openId === l.id;
        return (
          <div key={l.id} style={{ border: `1px solid ${Number(st.views_today) > 0 ? "rgba(124,240,174,.55)" : "#E99660"}`, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10, fontFamily: FONT, fontSize: 12.5 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <span>
                <b style={{ fontSize: 15 }}>{l.brand}</b> · {l.type} · {l.region} · {l.price} ₴/{l.unit}
              </span>
              {l.available ? <span style={{ color: GREEN }}>вільна</span> : <span style={{ color: RED }}>зайнята</span>}
            </div>
            <div style={{ display: "flex", gap: 22, flexWrap: "wrap" }}>
              <StatCell label="сьогодні" value={Number(st.views_today || 0)} hot={Number(st.views_today) > 0} />
              <StatCell label="за 7 днів" value={Number(st.views_7d || 0)} />
              <StatCell label="всього" value={Number(st.views_total || 0)} />
              <StatCell label="відвідувачів" value={Number(st.visitors || 0)} />
              <StatCell label="заявок" value={Number(st.requests_total || 0)} hot={Number(st.requests_total) > 0} />
            </div>
            {st.last_view_at && <div style={{ color: "#FFE6D0" }}>Останній перегляд: {fmtDateTime(st.last_view_at)}</div>}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button onClick={() => setOpenId(open ? null : l.id)} aria-expanded={open} style={smallBtn}>
                {open ? "Сховати переглядачів" : "Хто дивився"}
              </button>
              <button onClick={() => onEdit && onEdit(l)} style={{ ...smallBtn, borderColor: "#FFE3BD", color: "#FFE3BD" }}>Редагувати</button>
              <button onClick={() => onOpen(l)} style={smallBtn}>Відкрити сторінку</button>
            </div>
            {open && <ViewersList listingId={l.id} />}
          </div>
        );
      })}
    </div>
  );
}

export function OwnerCabinet({ tab, setTab, inboxItems, bookings, responses = [], onWithdrawResponse, onRefreshResponses, onRespondRequest, onRefreshInbox, onRefreshBookings, myListings = [], stats = [], onOpenListing, onEditListing }) {
  const pendingRequests = inboxItems.filter((x) => x.dispatch_status === "sent" && x.req_status !== "taken").length;
  const reserved = bookings.filter((b) => b.status === "reserved").length;
  return (
    <div>
      <Tabs
        tabs={[
          { key: "mine", label: "Моя техніка", count: 0 },
          { key: "rentals", label: "Оренди моєї техніки", count: reserved, alert: true },
          { key: "responses", label: "Мої відгуки", count: responses.filter((x) => x.status === "chosen" && x.request.status !== "taken").length, alert: true },
          { key: "requests", label: "Запити від диспетчера", count: pendingRequests, alert: true },
        ]}
        value={tab}
        onChange={setTab}
      />
      {tab === "mine" ? (
        <OwnerListings listings={myListings} stats={stats} onOpen={onOpenListing || (() => {})} onEdit={onEditListing} onRefresh={onRefreshBookings} />
      ) : tab === "rentals" ? (
        <OwnerBookings bookings={bookings} onRefresh={onRefreshBookings} />
      ) : tab === "responses" ? (
        <OwnerResponses items={responses} onWithdraw={onWithdrawResponse} onRefresh={onRefreshResponses} />
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
  offer_expired: "#FFD3B0",
  offer_conflict: RED,
  booking_reserved: AMBER,
  booking_confirmed: GREEN,
  booking_cancelled: RED,
  request_declined: AMBER,
  request_cancelled: "#FFD3B0",
  role_changed: GREEN,
  new_user: AMBER,
  new_listing: GREEN,
  wanted_response: AMBER,
  response_chosen: GREEN,
  response_closed: "#FFD3B0",
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
            background: n.read_at ? "transparent" : "rgba(255,214,160,0.07)",
            border: "1px solid #E99660",
            borderLeft: `3px solid ${KIND_COLOR[n.kind] || "#FFD3B0"}`,
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
          {n.body && <span style={{ fontSize: 12, color: "#FFE6D0" }}>{n.body}</span>}
          <span style={{ fontSize: 11, color: "#FFD3B0" }}>{fmtDateTime(n.created_at)}</span>
        </button>
      ))}
    </div>
  );
}

// ---- Кабінет власника: запити від диспетчера (було в головному файлі) ----
const INBOX_STATUS = {
  sent: { text: "Очікує вашої відповіді", color: "#FFF0D2" },
  accepted: { text: "Ви прийняли", color: "#B9F6CA" },
  rejected: { text: "Ви відмовились", color: "#FFD3B0" },
  expired: { text: "Заявку взяв інший власник", color: "#FFD3B0" },
};

// Кабінет власника: запити від диспетчера з кнопками «Прийняти» / «Відмовитись».
// Телефон клієнта приходить із бази лише після того, як власник прийняв заявку.
export function OwnerInbox({ items, onRespond, onRefresh }) {
  const [busyId, setBusyId] = useState(null);
  const font = "'Manrope', -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif";

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
      <div style={{ display: "flex", flexDirection: "column", gap: 12, fontFamily: font, fontSize: 13, color: "#FFE6D0" }}>
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
          <div key={x.dispatch_id} style={{ border: "1px solid #FFDCC0", padding: "14px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
              <Label>Заявка #{x.request_id}</Label>
              <span style={{ fontFamily: font, fontSize: 11.5, color: st.color }}>{st.text}</span>
            </div>
            <div style={{ fontFamily: font, fontSize: 16, fontWeight: 600 }}>
              {x.req_type} — {x.req_region}
            </div>
            <div style={{ fontFamily: font, fontSize: 12.5, color: "#FFE6D0" }}>
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
              <div style={{ marginTop: 4, padding: "10px 12px", background: "rgba(185,246,202,0.1)", border: "1px solid #B9F6CA", fontFamily: font, fontSize: 13 }}>
                <div style={{ color: "#B9F6CA", fontSize: 11, marginBottom: 4 }}>Контакт клієнта</div>
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
// Дати обирають кліками по календарю (як у світових сервісах бронювання): перший день → останній день.
export function BookingForm({ listing, busyRanges, onSubmit, initialFrom = "", initialTo = "" }) {
  const lang = useLang();
  const T = useTx();
  const today = todayLocal();
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);
  const [operator, setOperator] = useState(false);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  // Дати вже обрано на сторінці техніки — календар згорнуто, його можна відкрити кнопкою «Змінити дати»
  const [showCal, setShowCal] = useState(!(initialFrom && initialTo));

  const taken = (busyRanges || [])
    .filter((r) => r.listing_id === listing.id && r.date_to >= today)
    .sort((a, b) => (a.date_from < b.date_from ? -1 : 1));
  const ready = !!(from && to && to >= from);
  const clash = ready ? taken.find((r) => rangesOverlap(r.date_from, r.date_to, from, to)) : null;
  const days = daysInclusive(from, to);
  const estimate = days > 0 && (listing.unit === "добу" || listing.unit === "зміну") ? days * Number(listing.price) : null;
  const canSend = ready && !clash && !busy;

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
        <div style={{ fontFamily: FONT, fontSize: 12.5, color: "#FFE6D0" }}>
          {trType(listing.type, lang)} · {listing.region} · {listing.price > 0 ? `${listing.price} ₴/${trUnit(listing.unit, lang)}` : "Договірна"}
        </div>
      </div>

      {showCal ? (
        <AvailabilityCalendar
          ranges={taken}
          months={2}
          selectFrom={from}
          selectTo={to}
          onChange={(a, b) => { setFrom(a); setTo(b); }}
          price={listing.price}
          unit={listing.unit}
        />
      ) : (
        <div style={{ border: "1px solid rgba(124,240,174,.55)", background: "rgba(46,204,113,.12)", borderRadius: 16, padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap", fontFamily: FONT }}>
          <div>
            <div style={{ fontSize: 11.5, color: "#BFF5D4" }}>{T.datesLabel}</div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{fmtDate(from)} — {fmtDate(to)} <span style={{ fontWeight: 500, fontSize: 13, color: "#BFF5D4" }}>· {days} {T.daysShort}</span></div>
          </div>
          <button type="button" onClick={() => setShowCal(true)} style={{ ...smallBtn, minHeight: 40 }}>{T.changeDates}</button>
        </div>
      )}
      {clash && <ErrorText>{T.clash(fmtDate(clash.date_from), fmtDate(clash.date_to))}</ErrorText>}

      {estimate !== null && !clash && (
        <div style={{ fontFamily: FONT, fontSize: 13 }}>
          {T.estimate} {listing.price} ₴ × {days} = <b>{estimate.toLocaleString(LOCALES[lang] || "uk-UA")} ₴</b>
          <span style={{ color: "#FFD3B0" }}>{T.estimateNote}</span>
        </div>
      )}

      <label style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: FONT, fontSize: 13, color: "#FFE6D0", cursor: "pointer" }}>
        <input type="checkbox" checked={operator} onChange={(e) => setOperator(e.target.checked)} style={{ accentColor: "#FFE3BD", width: 18, height: 18 }} />
        {T.withOp}
      </label>

      <Field label={T.comment}>
        <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={2} style={{ ...inputStyle, resize: "vertical" }} />
      </Field>

      <button className="btn-premium-hover" type="submit" disabled={!canSend} style={{ ...primaryBtn, width: "100%", minHeight: 48, opacity: canSend ? 1 : 0.5, cursor: canSend ? "pointer" : "not-allowed" }}>
        {busy ? T.sending : T.sendBook}
      </button>
      <div style={{ fontFamily: FONT, fontSize: 11.5, color: "#FFD3B0" }}>
        {T.dispInfo}
      </div>
    </form>
  );
}


// ---- Календар: зеленим — вільно, червоним — зайнято; клік по днях обирає період (можна через кілька місяців) ----
const isoOf = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
// Кінець періоду: за кількістю днів або за календарними місяцями («1 місяць» від 12.11 = до 11.12)
const endFor = (startIso, spec) => {
  const d = new Date(startIso + "T00:00:00");
  if (spec.days) { d.setDate(d.getDate() + spec.days - 1); return isoOf(d); }
  const day = d.getDate();
  d.setDate(1); d.setMonth(d.getMonth() + spec.months);
  d.setDate(Math.min(day, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()));
  d.setDate(d.getDate() - 1);
  return isoOf(d);
};
const MAX_MONTHS = 12; // скільки місяців уперед можна переглядати

export function AvailabilityCalendar({ ranges, months = 2, selectFrom: selFromProp, selectTo: selToProp, onChange, price, unit, manage = false, manual, onApply }) {
  const lang = useLang();
  const T = useTx();
  const today = todayLocal();
  const interactive = manage || typeof onChange === "function";
  // Режим «власник керує днями»: клік по дню зберігає його як зайнятий/вільний у базі
  const [mmode, setMmode] = useState("days"); // days | range
  const [mFrom, setMFrom] = useState("");
  const [mTo, setMTo] = useState("");
  const [pend, setPend] = useState({});
  const [saving, setSaving] = useState(false);
  const [okMsg, setOkMsg] = useState(false);
  const manualSet = new Set(manual || []);
  const selectFrom = manage ? (mmode === "range" ? mFrom : "") : selFromProp;
  const selectTo = manage ? (mmode === "range" ? mTo : "") : selToProp;
  const visible = Math.max(1, months);
  const maxOffset = Math.max(0, MAX_MONTHS - visible);
  const [offset, setOffset] = useState(0);
  const [hover, setHover] = useState("");
  const [hint, setHint] = useState("");
  const [dur, setDur] = useState("");
  const list = ranges || [];
  const clashIn = (a, b) => list.some((r) => rangesOverlap(r.date_from, r.date_to, a, b));
  const hasFrom = !!selectFrom;
  const hasRange = !!(selectFrom && selectTo && selectTo >= selectFrom);
  const previewTo = interactive && hasFrom && !hasRange && hover && hover >= selectFrom && (manage || !clashIn(selectFrom, hover)) ? hover : "";

  const okTimer = useRef(null);
  const flash = () => { setOkMsg(true); clearTimeout(okTimer.current); okTimer.current = setTimeout(() => setOkMsg(false), 2600); };
  const dayBusy = (iso) => (pend[iso] !== undefined ? pend[iso] : list.some((r) => r.date_from <= iso && iso <= r.date_to));
  const dayBooked = (iso) => pend[iso] === undefined && list.some((r) => r.date_from <= iso && iso <= r.date_to) && !manualSet.has(iso);
  const applyDays = async (days, busy) => {
    if (!days.length || !onApply) return;
    setSaving(true);
    setPend((o) => { const n = { ...o }; days.forEach((d) => { n[d] = busy; }); return n; });
    try { await onApply(days, busy); flash(); } finally {
      setPend((o) => { const n = { ...o }; days.forEach((d) => { delete n[d]; }); return n; });
      setSaving(false);
    }
  };
  const rangeDays = () => {
    if (!(mFrom && mTo && mTo >= mFrom)) return [];
    const out = [];
    for (let d = new Date(mFrom + "T00:00:00"); isoOf(d) <= mTo; d.setDate(d.getDate() + 1)) {
      const iso = isoOf(d);
      if (iso >= today && !dayBooked(iso)) out.push(iso);
    }
    return out;
  };
  const pick = (iso) => {
    if (!interactive) return;
    if (manage) {
      if (mmode === "days") { applyDays([iso], !dayBusy(iso)); return; }
      if (!mFrom || (mFrom && mTo) || iso < mFrom) { setMFrom(iso); setMTo(""); return; }
      setMTo(iso);
      return;
    }
    setHint("");
    setDur("");
    if (!hasFrom || hasRange || iso < selectFrom) { onChange(iso, ""); return; }
    if (clashIn(selectFrom, iso)) { setHint(T.pickClash); onChange(iso, ""); return; }
    onChange(selectFrom, iso);
  };

  // Швидкий вибір строку: початок — найближча дата, коли техніка вільна весь строк
  const pickDuration = (key, spec) => {
    let start = selectFrom && selectFrom >= today ? selectFrom : today;
    for (let i = 0; i < 400; i++) {
      const end = endFor(start, spec);
      if (!clashIn(start, end)) {
        const now = new Date();
        const s = new Date(start + "T00:00:00");
        const diff = (s.getFullYear() - now.getFullYear()) * 12 + (s.getMonth() - now.getMonth());
        setOffset(Math.max(0, Math.min(maxOffset, diff)));
        setHint(""); setDur(key); onChange(start, end);
        return;
      }
      const d = new Date(start + "T00:00:00"); d.setDate(d.getDate() + 1); start = isoOf(d);
    }
    setDur(key);
  };
  const DURS = [["w", T.week, { days: 7 }], ["m1", T.m1, { months: 1 }], ["m2", T.m2, { months: 2 }], ["m3", T.m3, { months: 3 }]];

  const base = new Date();
  const blocks = [];
  for (let m = 0; m < visible; m++) {
    const first = new Date(base.getFullYear(), base.getMonth() + offset + m, 1);
    const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
    const lead = (first.getDay() + 6) % 7; // тиждень починається з понеділка
    const cells = Array(lead).fill(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const iso = `${first.getFullYear()}-${String(first.getMonth() + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const edge = iso === selectFrom || (hasRange && iso === selectTo);
      cells.push({
        d,
        iso,
        busy: manage ? dayBusy(iso) : list.some((r) => r.date_from <= iso && iso <= r.date_to),
        booked: manage ? dayBooked(iso) : false,
        manual: manage ? manualSet.has(iso) || pend[iso] === true : false,
        past: iso < today,
        today: iso === today,
        edge,
        mid: !edge && hasRange && iso > selectFrom && iso < selectTo,
        prev: !edge && !!previewTo && iso > selectFrom && iso <= previewTo,
      });
    }
    const title = first.toLocaleDateString(LOCALES[lang] || "uk-UA", { month: "long", year: "numeric" });
    blocks.push({ key: `${first.getFullYear()}-${first.getMonth()}`, title: title.charAt(0).toUpperCase() + title.slice(1), cells });
  }

  const cellStyle = (c) => {
    const st = {
      minHeight: 42, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: FONT, fontSize: 14, fontWeight: 600, border: "1px solid transparent", padding: 0, margin: 0,
      transition: "background .15s, border-color .15s, transform .15s", WebkitTapHighlightColor: "transparent",
    };
    if (c.past) Object.assign(st, { color: "rgba(244,244,241,.26)", fontWeight: 400 });
    else if (c.busy) Object.assign(st, { background: "rgba(255,77,77,.24)", borderColor: "rgba(255,110,110,.6)", color: "#FFC2C2", textDecoration: "line-through", textDecorationThickness: 1 });
    else if (c.edge) Object.assign(st, { background: "#2ECC71", borderColor: "#9BF5C0", color: "#05260F", fontWeight: 800, boxShadow: "0 0 0 2px rgba(46,204,113,.35)" });
    else if (c.mid) Object.assign(st, { background: "rgba(46,204,113,.72)", borderColor: "rgba(155,245,192,.7)", color: "#05260F" });
    else if (c.prev) Object.assign(st, { background: "rgba(46,204,113,.34)", borderColor: "rgba(155,245,192,.6)", color: "#EFFFF5" });
    else Object.assign(st, { background: "rgba(46,204,113,.33)", borderColor: "rgba(46,204,113,.85)", color: "#D9FFE8" });
    if (c.today) Object.assign(st, { outline: "2px solid #8FF5BA", outlineOffset: -2, boxShadow: "0 0 0 3px rgba(143,245,186,.28), 0 0 14px rgba(46,204,113,.45)" });
    if (manage && !c.past && (c.edge || c.mid || c.prev)) Object.assign(st, { outline: "2px solid #FFE3BD", outlineOffset: -2 });
    return st;
  };

  const days = hasRange ? daysInclusive(selectFrom, selectTo) : 0;
  const estimate = days > 0 && price > 0 && (unit === "добу" || unit === "зміну") ? days * Number(price) : null;
  const navBtn = (disabled) => ({
    width: 44, height: 44, borderRadius: 980, border: "1px solid rgba(255,190,120,.55)", background: "rgba(255,255,255,.06)",
    color: "#FFF0D2", fontSize: 20, lineHeight: 1, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.35 : 1, fontFamily: FONT,
  });
  const dot = (bg, bd) => ({ display: "inline-block", width: 12, height: 12, borderRadius: 4, background: bg, border: `1px solid ${bd}`, marginRight: 6, verticalAlign: "middle" });

  return (
    <section
      aria-label={T.calLabel}
      className="av-cal"
      style={{
        display: "flex", flexDirection: "column", gap: 14, padding: 16, borderRadius: 20,
        background: "linear-gradient(165deg, #2A130A 0%, #170A05 100%)",
        border: "1.5px solid rgba(124,240,174,.55)",
        boxShadow: "0 18px 44px -22px rgba(0,0,0,.9), 0 0 0 1px rgba(46,204,113,.12), inset 0 1px 0 rgba(190,255,215,.14)",
      }}
    >
      {interactive && !manage && (
        <div className="lp-dur" role="group" aria-label={T.quick}>
          {DURS.map(([k, label, spec]) => (
            <button type="button" key={k} data-on={dur === k ? "1" : "0"} onClick={() => pickDuration(k, spec)}>{label}</button>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: 16, fontFamily: FONT, fontSize: 12, color: "#FFE6D0", flexWrap: "wrap" }}>
        <span><span style={dot("rgba(46,204,113,.5)", "rgba(46,204,113,.95)")} />{T.free}</span>
        <span><span style={dot("rgba(255,77,77,.4)", "rgba(255,110,110,.8)")} />{T.busy}</span>
        {interactive && !manage && <span><span style={dot("#2ECC71", "#9BF5C0")} />{T.pickedLegend}</span>}
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <button type="button" aria-label={T.prevM} disabled={offset <= 0} onClick={() => setOffset((o) => Math.max(0, o - 1))} style={navBtn(offset <= 0)}>‹</button>
        <div style={{ fontFamily: FONT, fontSize: 12, color: "#FFD3B0", textAlign: "center" }}>
          {blocks[0].title}{blocks.length > 1 ? ` — ${blocks[blocks.length - 1].title}` : ""}
        </div>
        <button type="button" aria-label={T.nextM} disabled={offset >= maxOffset} onClick={() => setOffset((o) => Math.min(maxOffset, o + 1))} style={navBtn(offset >= maxOffset)}>›</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 22 }}>
        {blocks.map((b) => (
          <div key={b.key} role="grid" aria-label={b.title} onMouseLeave={() => setHover("")}>
            <div style={{ fontFamily: FONT, fontSize: 15, fontWeight: 700, marginBottom: 8, color: "#FFF0D2" }}>{b.title}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, textAlign: "center" }}>
              {T.weekdays.map((w) => (
                <div key={w} style={{ color: "#FFD3B0", fontFamily: FONT, fontSize: 12, padding: "2px 0" }}>{w}</div>
              ))}
              {b.cells.map((cell, i) => {
                if (!cell) return <div key={`e${i}`} />;
                const label = `${cell.d} ${b.title}, ${cell.busy ? T.busyCap : T.freeCap}`;
                const canClick = interactive && !cell.past && (manage ? !cell.booked : !cell.busy);
                return canClick ? (
                  <button
                    key={cell.iso}
                    type="button"
                    role="gridcell"
                    aria-label={label}
                    aria-pressed={manage ? (cell.busy ? "true" : "false") : (cell.edge || cell.mid ? "true" : "false")}
                    data-busy={cell.busy ? "1" : "0"}
                    onClick={() => pick(cell.iso)}
                    onMouseEnter={() => setHover(cell.iso)}
                    style={{ ...cellStyle(cell), cursor: "pointer" }}
                  >
                    {cell.d}
                  </button>
                ) : (
                  <div key={cell.iso} role="gridcell" aria-label={label} aria-disabled="true" data-busy={cell.busy ? "1" : "0"} title={cell.busy ? T.busyCap : T.freeCap} style={cellStyle(cell)}>
                    {cell.d}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {manage && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, fontFamily: FONT }}>
          <div style={{ fontSize: 13, color: "#FFE6D0", lineHeight: 1.45 }}>{T.mgHint}</div>
          <div className="lp-dur" role="group" aria-label={T.mgDays}>
            <button type="button" data-on={mmode === "days" ? "1" : "0"} onClick={() => { setMmode("days"); setMFrom(""); setMTo(""); }}>{T.mgDays}</button>
            <button type="button" data-on={mmode === "range" ? "1" : "0"} onClick={() => setMmode("range")}>{T.mgRange}</button>
          </div>
          {mmode === "range" && (
            <div aria-live="polite" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ fontSize: 14, color: "#FFE6D0" }}>
                {mFrom && mTo ? <b>{fmtDate(mFrom)} — {fmtDate(mTo)} · {daysInclusive(mFrom, mTo)} {T.daysShort}</b> : mFrom ? T.pickEnd : T.mgRangeHint}
              </div>
              {mFrom && mTo && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button type="button" disabled={saving} onClick={async () => { await applyDays(rangeDays(), true); setMFrom(""); setMTo(""); }} style={{ ...primaryBtn, minHeight: 44, padding: "0 18px" }}>{T.mgMarkBusy}</button>
                  <button type="button" disabled={saving} onClick={async () => { await applyDays(rangeDays(), false); setMFrom(""); setMTo(""); }} style={{ ...smallBtn, minHeight: 44 }}>{T.mgMarkFree}</button>
                  <button type="button" onClick={() => { setMFrom(""); setMTo(""); }} style={{ ...smallBtn, minHeight: 44 }}>{T.mgCancel}</button>
                </div>
              )}
            </div>
          )}
          <div aria-live="polite" style={{ minHeight: 20, fontSize: 13, color: "#BFF5D4", fontWeight: 600 }}>{okMsg ? "✓ " + T.mgSaved : ""}</div>
          <div style={{ fontSize: 12, color: "#FFD3B0" }}>{T.mgBookedNote}</div>
        </div>
      )}

      {interactive && !manage && (
        <div aria-live="polite" style={{ fontFamily: FONT, fontSize: 14, minHeight: 22 }}>
          {hint ? (
            <span style={{ color: "#FFB9B9", fontWeight: 600 }}>{hint}</span>
          ) : hasRange ? (
            <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
              <span>
                <span style={{ color: "#BFF5D4" }}>{T.chosen}: </span>
                <b>{fmtDate(selectFrom)} — {fmtDate(selectTo)}</b> · {days} {T.daysShort}
                {estimate !== null && <b style={{ color: "#FFF0D2" }}> · ≈ {estimate.toLocaleString(LOCALES[lang] || "uk-UA")} ₴</b>}
              </span>
              <button type="button" onClick={() => { setDur(""); setHint(""); onChange("", ""); }} style={{ ...smallBtn, minHeight: 36, padding: "0 14px" }}>{T.clearDates}</button>
            </span>
          ) : (
            <span style={{ color: "#FFE6D0" }}>{hasFrom ? T.pickEnd : T.pickStart}</span>
          )}
        </div>
      )}
    </section>
  );
}
