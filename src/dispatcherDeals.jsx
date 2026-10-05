// Диспетчерська: «Підібрати техніку → Запропонувати клієнту → Підтвердити оренду» прямо в картці заявки.
import React, { useState } from "react";
import { Label, primaryBtn, smallBtn, inputStyle, miniBtn } from "./ui.jsx";
import { fmtDate, fmtPeriod, fmtDateTime } from "./services/deals.js";

const FONT = "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif";
const GREEN = "#6fae6f";
const RED = "#c96b5a";
const AMBER = "#FFB52E";

const overlaps = (aFrom, aTo, bFrom, bTo) => aFrom <= bTo && bFrom <= aTo;

// Бронювання техніки, що перетинаються з періодом (для підказки «зайнята до…»)
export function conflictsFor(listingId, from, to, bookings) {
  if (!from || !to) return [];
  return bookings.filter(
    (b) => b.listing_id === listingId && ["reserved", "confirmed"].includes(b.status) && overlaps(b.date_from, b.date_to, from, to)
  );
}

const OFFER_LABEL = {
  proposed: { text: "очікує відповіді клієнта", color: AMBER },
  accepted: { text: "клієнт підтвердив", color: GREEN },
  declined: { text: "клієнт відхилив", color: RED },
  expired: { text: "час вийшов", color: "#70777D" },
  withdrawn: { text: "знято", color: "#70777D" },
};
const BOOKING_LABEL = {
  reserved: { text: "резерв — потрібне ваше підтвердження", color: AMBER },
  confirmed: { text: "оренду підтверджено", color: GREEN },
  completed: { text: "завершена", color: "#70777D" },
  cancelled: { text: "скасовано", color: RED },
};

const EVENT_TEXT = {
  request_created: () => "Клієнт створив заявку",
  offer_proposed: (d) => `Запропоновано ${d.brand || "техніку"}`,
  offer_accepted: (d) => `Клієнт підтвердив ${d.brand || ""}`.trim(),
  offer_declined: (d) => `Клієнт відхилив${d.reason ? `: ${d.reason}` : ""}`,
  offer_expired: () => "Пропозиція прострочена",
  offer_conflict: () => "Конфлікт дат: техніку тим часом зайняли",
  booking_reserved: (d) => `Створено бронь ${fmtPeriod(d.date_from, d.date_to)}`,
  booking_confirmed: () => "Оренду підтверджено",
  booking_cancelled: (d) => `Оренду скасовано${d.reason ? `: ${d.reason}` : ""}`,
  booking_manual: (d) => `Оформлено за телефоном: ${d.brand || ""}`.trim(),
};
export const eventText = (ev) => (EVENT_TEXT[ev.action] ? EVENT_TEXT[ev.action](ev.details || {}) : ev.action);

export function EventLog({ events }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {events.map((ev) => (
        <div key={ev.id} style={{ fontSize: 11.5, fontFamily: FONT, color: "#A3A8AD", display: "flex", gap: 8 }}>
          <span style={{ color: "#70777D", whiteSpace: "nowrap" }}>{fmtDateTime(ev.created_at)}</span>
          <span>{eventText(ev)}</span>
        </div>
      ))}
    </div>
  );
}

export function DealsSection({ req, listings, allBookings, onPropose, onManual, onConfirm, onCancel }) {
  const [from, setFrom] = useState(req.dateFrom || "");
  const [to, setTo] = useState(req.dateTo || "");
  const [busyKey, setBusyKey] = useState(null);
  const [cancelFor, setCancelFor] = useState(null);
  const [reason, setReason] = useState("");

  const brandOf = (id) => (listings.find((l) => l.id === id) || {}).brand || `#${id}`;
  const closed = ["booked", "taken", "cancelled", "expired"].includes(req.status);
  const datesOk = from && to && to >= from;

  const run = async (key, fn) => {
    setBusyKey(key);
    try {
      await fn();
    } finally {
      setBusyKey(null);
    }
  };

  // Підходяща техніка: той самий тип, реальні оголошення. Спершу — на яку клієнт відгукнувся,
  // далі вільна в потрібному регіоні, далі решта; зайнята — внизу з датою звільнення.
  const candidates = listings
    .filter((l) => l.ownerId && l.type === req.type)
    .map((l) => {
      const conflicts = conflictsFor(l.id, from, to, allBookings);
      const busyUntil = conflicts.length ? conflicts.map((c) => c.date_to).sort().slice(-1)[0] : null;
      return { l, busyUntil, blocked: !l.available || !!busyUntil };
    })
    .sort((a, b) => {
      const rank = (x) => (x.l.id === req.listingId ? 0 : 1) + (x.blocked ? 10 : 0) + (x.l.region === req.region ? 0 : 2);
      return rank(a) - rank(b) || a.l.price - b.l.price;
    });

  const hasAccount = req.hasAccount;

  return (
    <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px dashed #63696D" }}>
      {/* Пропозиції та броні по заявці */}
      {(req.offers.length > 0 || req.bookings.length > 0) && (
        <div style={{ marginBottom: 14 }}>
          <Label>Угода</Label>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
            {req.offers.map((o) => {
              const st = OFFER_LABEL[o.status] || OFFER_LABEL.withdrawn;
              return (
                <div key={`o${o.id}`} style={{ fontFamily: FONT, fontSize: 12.5, display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                  <span>
                    Пропозиція: <b>{brandOf(o.listing_id)}</b> · {fmtPeriod(o.date_from, o.date_to)}
                  </span>
                  <span style={{ color: st.color }}>
                    {st.text}
                    {o.status === "proposed" ? ` (до ${fmtDateTime(o.expires_at)})` : ""}
                    {o.decline_reason ? ` — ${o.decline_reason}` : ""}
                  </span>
                </div>
              );
            })}
            {req.bookings.map((b) => {
              const st = BOOKING_LABEL[b.status] || BOOKING_LABEL.cancelled;
              return (
                <div key={`b${b.id}`} style={{ border: `1px solid ${st.color}`, padding: "10px 12px", fontFamily: FONT, fontSize: 12.5, display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                    <span>
                      Бронь: <b>{brandOf(b.listing_id)}</b> · {fmtPeriod(b.date_from, b.date_to)}
                    </span>
                    <span style={{ color: st.color }}>{st.text}</span>
                  </div>
                  {["reserved", "confirmed"].includes(b.status) && (
                    cancelFor === b.id ? (
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Причина (побачать клієнт і власник)" style={{ ...inputStyle, flex: 1, minWidth: 160, padding: "8px 10px", fontSize: 12.5 }} />
                        <button disabled={busyKey === `c${b.id}`} onClick={() => run(`c${b.id}`, async () => { await onCancel(b.id, reason); setCancelFor(null); setReason(""); })} style={miniBtn(RED)}>
                          Скасувати бронь
                        </button>
                        <button onClick={() => setCancelFor(null)} style={miniBtn("#A3A8AD")}>Назад</button>
                      </div>
                    ) : (
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {b.status === "reserved" && (
                          <button disabled={busyKey === `k${b.id}`} onClick={() => run(`k${b.id}`, () => onConfirm(b.id))} style={{ ...primaryBtn, padding: "9px 18px", fontSize: 13 }}>
                            Підтвердити оренду
                          </button>
                        )}
                        <button onClick={() => setCancelFor(b.id)} style={miniBtn(RED)}>
                          Скасувати
                        </button>
                      </div>
                    )
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Підбір техніки */}
      {!closed && (
        <div>
          <Label>Підібрати техніку · {req.type}</Label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginTop: 8, fontFamily: FONT, fontSize: 12 }}>
            <span style={{ color: "#A3A8AD" }}>Період оренди:</span>
            <input type="date" aria-label="Початок оренди" value={from} onChange={(e) => setFrom(e.target.value)} style={{ ...inputStyle, padding: "6px 8px", fontSize: 12.5 }} />
            <span>—</span>
            <input type="date" aria-label="Кінець оренди" value={to} onChange={(e) => setTo(e.target.value)} style={{ ...inputStyle, padding: "6px 8px", fontSize: 12.5 }} />
          </div>
          {!hasAccount && (
            <div style={{ fontFamily: FONT, fontSize: 12, color: AMBER, marginTop: 8 }}>
              Клієнт без акаунта: онлайн-пропозиція неможлива. Домовтеся по телефону {req.contact} і натисніть «Підтвердити за телефоном».
            </div>
          )}
          {!datesOk && <div style={{ fontFamily: FONT, fontSize: 12, color: "#A3A8AD", marginTop: 6 }}>Вкажіть період, щоб перевірити зайнятість і надіслати пропозицію.</div>}

          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
            {candidates.length === 0 && (
              <div style={{ fontFamily: FONT, fontSize: 12.5, color: "#A3A8AD" }}>
                У каталозі немає техніки цього типу. Скористайтеся блоком «Запитати у власників» нижче.
              </div>
            )}
            {candidates.map(({ l, busyUntil, blocked }) => {
              const key = `p${l.id}`;
              const target = l.id === req.listingId;
              return (
                <div key={l.id} style={{ border: `1px solid ${target ? "#FF6A1A" : "#2a2e32"}`, padding: "10px 12px", fontFamily: FONT, fontSize: 12.5, display: "flex", flexDirection: "column", gap: 6, opacity: blocked ? 0.85 : 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                    <span>
                      <b>{l.brand}</b> · {l.owner} · {l.region} · {l.price} ₴/{l.unit}
                    </span>
                    {!l.available ? (
                      <span style={{ color: RED }}>недоступна</span>
                    ) : busyUntil ? (
                      <span style={{ color: RED }}>зайнята до {fmtDate(busyUntil)}</span>
                    ) : (
                      <span style={{ color: GREEN }}>вільна</span>
                    )}
                  </div>
                  {target && <div style={{ color: "#FF6A1A", fontSize: 11.5 }}>Клієнт відгукнувся саме на це оголошення</div>}
                  <div>
                    {hasAccount ? (
                      <button
                        disabled={blocked || !datesOk || busyKey === key}
                        onClick={() => run(key, () => onPropose(req.id, l.id, from, to))}
                        style={{ ...smallBtn, borderColor: blocked || !datesOk ? "#3a3f44" : "#FF6A1A", color: blocked || !datesOk ? "#70777D" : "#FF6A1A", cursor: blocked || !datesOk ? "not-allowed" : "pointer" }}
                      >
                        Запропонувати клієнту
                      </button>
                    ) : (
                      <button
                        disabled={blocked || !datesOk || busyKey === key}
                        onClick={() => run(key, () => onManual(req.id, l.id, from, to))}
                        style={{ ...smallBtn, borderColor: blocked || !datesOk ? "#3a3f44" : GREEN, color: blocked || !datesOk ? "#70777D" : GREEN, cursor: blocked || !datesOk ? "not-allowed" : "pointer" }}
                      >
                        Підтвердити за телефоном
                      </button>
                    )}
                    {hasAccount && !blocked && datesOk && (
                      <button
                        disabled={busyKey === `m${l.id}`}
                        onClick={() => run(`m${l.id}`, () => onManual(req.id, l.id, from, to))}
                        style={{ ...smallBtn, marginLeft: 8, borderColor: "#3a3f44", color: "#A3A8AD", fontSize: 12 }}
                        title="Клієнт уже погодився по телефону — оформити оренду одразу"
                      >
                        Підтвердити за телефоном
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
