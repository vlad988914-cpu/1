// Диспетчерська: «Підібрати техніку → Запропонувати клієнту → Підтвердити оренду» прямо в картці заявки.
import React, { useState } from "react";
import { Label, RoleTag, primaryBtn, smallBtn, inputStyle, miniBtn } from "./ui.jsx";
import { fmtDate, fmtPeriod, fmtDateTime, todayLocal, unitLabel } from "./services/deals.js";

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

// Клієнт сам обрав техніку й дати: диспетчер підтверджує одним кліком або відхиляє з причиною.
export function WantedActions({ req, listing, allBookings, onConfirm, onDecline, compact }) {
  const [declining, setDeclining] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const conflicts = conflictsFor(req.listingId, req.dateFrom, req.dateTo, allBookings);
  const busyUntil = conflicts.length ? conflicts.map((c) => c.date_to).sort().slice(-1)[0] : null;
  const datesOk = !!(req.dateFrom && req.dateTo);
  const blocked = !datesOk || !!busyUntil || (listing && !listing.available);
  const go = async (fn) => {
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, fontFamily: FONT, fontSize: 12.5 }}>
      <div>
        {compact && (
          <span>
            <b>{req.requesterName || "Клієнт"}</b> ·{" "}
            {req.contact ? <a href={`tel:${String(req.contact).replace(/[^\d+]/g, "")}`} style={{ color: "#F4F4F1" }}>{req.contact}</a> : null} ·{" "}
          </span>
        )}
        {fmtPeriod(req.dateFrom, req.dateTo)}
        {req.withOperator ? " · з оператором" : ""}
        {busyUntil ? <span style={{ color: RED }}> · зайнята до {fmtDate(busyUntil)}</span> : datesOk ? <span style={{ color: GREEN }}> · дати вільні</span> : <span style={{ color: AMBER }}> · дати не вказано</span>}
      </div>
      {req.comment && <div style={{ color: "#A3A8AD" }}>{req.comment}</div>}
      {!declining ? (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            disabled={blocked || busy}
            onClick={() => go(() => onConfirm(req))}
            style={{ ...primaryBtn, padding: "9px 18px", fontSize: 13, opacity: blocked ? 0.45 : 1, cursor: blocked ? "not-allowed" : "pointer" }}
          >
            Підтвердити оренду
          </button>
          <button disabled={busy} onClick={() => setDeclining(true)} style={miniBtn(RED)}>
            Відхилити
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Причина (побачить клієнт)" style={{ ...inputStyle, flex: 1, minWidth: 160, padding: "8px 10px", fontSize: 12.5 }} />
          <button disabled={busy} onClick={() => go(async () => { await onDecline(req.id, reason); setDeclining(false); setReason(""); })} style={miniBtn(RED)}>
            Відхилити
          </button>
          <button onClick={() => setDeclining(false)} style={miniBtn("#A3A8AD")}>Назад</button>
        </div>
      )}
    </div>
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

export function DealsSection({ req, listings, users = [], allBookings, onPropose, onManual, onConfirm, onCancel, onDecline }) {
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

  const wantedListing = req.listingId ? listings.find((l) => l.id === req.listingId) : null;

  return (
    <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px dashed #63696D" }}>
      {/* Відгуки власників на заявку з дошки */}
      {!closed && !req.listingId && liveResponses(req).length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <ResponsesBlock req={req} listings={listings} users={users} allBookings={allBookings} dateFrom={from} dateTo={to} onConfirm={(listingId, f, t) => onManual(req.id, listingId, f, t)} />
        </div>
      )}

      {/* Клієнт сам обрав техніку й дати: підтвердити одним кліком */}
      {!closed && req.listingId && (
        <div style={{ border: "1px solid #FF6A1A", padding: "12px 14px", marginBottom: 14, display: "flex", flexDirection: "column", gap: 8 }}>
          <Label>Клієнт обрав цю техніку</Label>
          <div style={{ fontFamily: FONT, fontSize: 15, fontWeight: 600 }}>
            {wantedListing ? wantedListing.brand : `Оголошення №${req.listingId}`}
            {wantedListing && <span style={{ fontWeight: 400, fontSize: 12.5, color: "#A3A8AD" }}> · {wantedListing.owner} · {wantedListing.price} ₴/{wantedListing.unit}</span>}
          </div>
          {chosenResponse(req) && (
            <div style={{ fontFamily: FONT, fontSize: 12.5, color: "#FF6A1A" }}>
              Ціна за пропозицією власника: <b>{Number(chosenResponse(req).price).toLocaleString("uk-UA")} ₴ {unitLabel(chosenResponse(req).price_unit)}</b>
            </div>
          )}
          <WantedActions req={req} listing={wantedListing} allBookings={allBookings} onConfirm={(r) => onManual(r.id, r.listingId, r.dateFrom, r.dateTo)} onDecline={onDecline} />
          <div style={{ fontFamily: FONT, fontSize: 11.5, color: "#70777D" }}>
            Після підтвердження клієнт і власник одразу бачать контакти одне одного. Або запропонуйте іншу техніку нижче.
          </div>
        </div>
      )}

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


// ---- Вкладка «Техніка»: хто хоче кожну одиницю, коли вона зайнята ----
export function EquipmentBoard({ listings, requests, allBookings, onConfirm, onDecline }) {
  const [q, setQ] = useState("");
  const today = todayLocal();
  const rows = listings
    .filter((l) => l.ownerId)
    .map((l) => ({
      l,
      wanting: requests.filter((r) => r.listingId === l.id && ["new", "dispatched", "offered"].includes(r.status)),
      bookings: allBookings
        .filter((b) => b.listing_id === l.id && ["reserved", "confirmed"].includes(b.status) && b.date_to >= today)
        .sort((a, b) => (a.date_from < b.date_from ? -1 : 1)),
    }))
    .filter(({ l }) => !q || `${l.brand} ${l.owner} ${l.type} ${l.region}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => b.wanting.length - a.wanting.length || String(a.l.brand).localeCompare(String(b.l.brand)));

  const allRows = listings.filter((l) => l.ownerId);
  const busyNowCount = allRows.filter((l) => !l.available || allBookings.some((b) => b.listing_id === l.id && ["reserved", "confirmed"].includes(b.status) && b.date_from <= today && b.date_to >= today)).length;
  const demandCount = allRows.filter((l) => requests.some((r) => r.listingId === l.id && ["new", "dispatched", "offered"].includes(r.status))).length;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Stat big label="Техніки в каталозі" value={allRows.length} />
        <Stat label="Вільна зараз" value={allRows.length - busyNowCount} />
        <Stat label="Зайнята зараз" value={busyNowCount} />
        <Stat label="На яку є запити" value={demandCount} accent={demandCount > 0} />
      </div>
      <input aria-label="Пошук техніки" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Пошук: марка, власник, тип, місто" style={{ ...inputStyle, maxWidth: 360 }} />
      {rows.length === 0 && <div style={{ fontFamily: FONT, fontSize: 13, color: "#A3A8AD" }}>Техніки в каталозі поки немає.</div>}
      {rows.map(({ l, wanting, bookings }) => {
        const nowBooking = bookings.find((b) => b.date_from <= today && b.date_to >= today);
        return (
          <div key={l.id} style={{ border: `1px solid ${wanting.length ? "#FF6A1A" : "#2a2e32"}`, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8, fontFamily: FONT, fontSize: 12.5 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <RoleTag kind="lease" />
                <span>
                  <b style={{ fontSize: 15 }}>{l.brand}</b> · {l.type} · {l.owner} · {l.region} · {l.price} ₴/{l.unit}
                </span>
              </span>
              {!l.available ? <span style={{ color: RED }}>недоступна</span> : nowBooking ? <span style={{ color: RED }}>зайнята до {fmtDate(nowBooking.date_to)}</span> : <span style={{ color: GREEN }}>вільна</span>}
            </div>
            {bookings.length > 0 && (
              <div style={{ color: "#A3A8AD" }}>
                Оренди: {bookings.map((b) => `${fmtDate(b.date_from).slice(0, 5)}–${fmtDate(b.date_to).slice(0, 5)}${b.status === "reserved" ? " (резерв)" : ""}`).join(" · ")}
              </div>
            )}
            {wanting.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 8, borderTop: "1px dashed #3a3f44" }}>
                <Label>Хочуть цю техніку ({wanting.length})</Label>
                {wanting.map((r) => (
                  <div key={r.id} style={{ paddingLeft: 10, borderLeft: "2px solid #FF6A1A" }}>
                    <WantedActions compact req={r} listing={l} allBookings={allBookings} onConfirm={(x) => onConfirm(x)} onDecline={onDecline} />
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ---- Вкладка «Користувачі»: скільки всього, хто новий, видалення ----
const ROLE_LABEL = { client: "Клієнт", owner: "Власник", dispatcher: "Диспетчер" };
const ROLE_COLOR = { client: "#A3A8AD", owner: AMBER, dispatcher: GREEN };
const DAY_MS = 86400000;

function Stat({ label, value, accent, big }) {
  return (
    <div style={{ border: `1px solid ${accent ? "#FF6A1A" : "#2a2e32"}`, padding: big ? "12px 18px" : "10px 14px", minWidth: big ? 170 : 120 }}>
      <div style={{ fontFamily: FONT, fontSize: big ? 30 : 20, fontWeight: 700, color: accent ? "#FF6A1A" : "#F4F4F1", lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontFamily: FONT, fontSize: 11.5, color: "#A3A8AD", marginTop: 4 }}>{label}</div>
    </div>
  );
}

export function UsersBoard({ users: allUsers, requests, bookings, listings, currentUserId, seenSince, onSetRole, onDelete, lockRole }) {
  const users = lockRole ? allUsers.filter((u) => u.role === lockRole) : allUsers;
  const [q, setQ] = useState("");
  const [role, setRole] = useState("all");
  const today = todayLocal();
  const now = Date.now();
  const age = (u) => now - new Date(u.created_at).getTime();
  const isStaff = (u) => u.role === "dispatcher";
  const isNew = (u) => !isStaff(u) && age(u) < 7 * DAY_MS;
  const isUnseen = (u) => !isStaff(u) && !!seenSince && u.created_at > seenSince;

  const total = users.length;
  const clients = users.filter((u) => u.role === "client").length;
  const owners = users.filter((u) => u.role === "owner").length;
  const newWeek = users.filter(isNew).length;
  const newToday = users.filter((u) => !isStaff(u) && age(u) < DAY_MS).length;
  const unseen = users.filter(isUnseen).length;

  const ownerOfListing = (id) => (listings.find((l) => l.id === id) || {}).ownerId;
  const activeRentals = (u) =>
    bookings.filter(
      (b) => ["reserved", "confirmed"].includes(b.status) && b.date_to >= today && (b.client_id === u.id || ownerOfListing(b.listing_id) === u.id)
    ).length;

  const filters = lockRole
    ? [
        ["all", "Усі", total],
        ["new", "Нові (7 днів)", newWeek],
      ]
    : [
        ["all", "Усі", total],
        ["new", "Нові (7 днів)", newWeek],
        ["client", "Клієнти", clients],
        ["owner", "Власники", owners],
        ["dispatcher", "Диспетчери", users.filter(isStaff).length],
      ];
  const shown = users
    .filter((u) => (role === "all" ? true : role === "new" ? isNew(u) : u.role === role))
    .filter((u) => !q || `${u.name} ${u.org || ""} ${u.phone} ${u.email}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));

  const askDelete = (u) => {
    const what = u.role === "owner" ? "акаунт, його техніку з каталогу та незавершені заявки" : "акаунт і незавершені заявки";
    if (window.confirm(`Видалити «${u.name}» (${u.email})?\n\nБуде видалено ${what}. Скасувати це не можна.`)) onDelete(u.id);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Stat big label={lockRole === "owner" ? "Усього власників" : lockRole === "client" ? "Усього клієнтів" : "Усього зареєстровано"} value={total} />
        {!lockRole && <Stat label="Клієнтів" value={clients} />}
        {!lockRole && <Stat label="Власників" value={owners} />}
        <Stat label="Нових за 7 днів" value={newWeek} accent={newWeek > 0} />
        <Stat label="Нових сьогодні" value={newToday} accent={newToday > 0} />
        <Stat label="Після вашого останнього візиту" value={unseen} accent={unseen > 0} />
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        {filters.map(([k, label, count]) => (
          <button key={k} onClick={() => setRole(k)} style={{ ...smallBtn, padding: "5px 12px", fontSize: 12, borderColor: role === k ? "#FF6A1A" : "rgba(255,255,255,0.18)", color: role === k ? "#FF6A1A" : "#ffffff" }}>
            {label} ({count})
          </button>
        ))}
        <input aria-label="Пошук користувача" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ім'я, телефон, email" style={{ ...inputStyle, padding: "7px 10px", fontSize: 12.5, minWidth: 200 }} />
      </div>

      {shown.length === 0 && <div style={{ fontFamily: FONT, fontSize: 13, color: "#A3A8AD" }}>Нікого не знайдено.</div>}

      {shown.map((u) => {
        const reqCount = requests.filter((r) => r.clientId === u.id).length;
        const rentCount = activeRentals(u);
        const mine = u.id === currentUserId;
        const canDelete = !isStaff(u) && !mine;
        return (
          <div key={u.id} style={{ border: `1px solid ${isUnseen(u) ? "#FF6A1A" : "#2a2e32"}`, padding: "10px 14px", fontFamily: FONT, fontSize: 12.5, display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <span>
                <b style={{ fontSize: 14 }}>{u.name}</b>
                {u.org ? <span style={{ color: "#A3A8AD" }}> · {u.org}</span> : null}
                {isNew(u) && <span style={{ marginLeft: 8, background: "#FF6A1A", color: "#08090A", fontSize: 10.5, fontWeight: 700, padding: "2px 7px", letterSpacing: "0.04em" }}>НОВИЙ</span>}
              </span>
              <span style={{ color: ROLE_COLOR[u.role], border: `1px solid ${ROLE_COLOR[u.role]}`, padding: "2px 8px", fontSize: 11.5 }}>{ROLE_LABEL[u.role] || u.role}</span>
            </div>
            <div style={{ color: "#A3A8AD" }}>
              {u.phone && u.phone !== "—" ? <a href={`tel:${String(u.phone).replace(/[^\d+]/g, "")}`} style={{ color: "#F4F4F1" }}>{u.phone}</a> : "телефон не вказано"} · {u.email}
            </div>
            <div style={{ color: "#70777D" }}>
              Зареєстровано {fmtDate(String(u.created_at).slice(0, 10))} · заявок: {reqCount} · активних оренд: {rentCount}
            </div>
            {!isStaff(u) && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", paddingTop: 4 }}>
                <button
                  onClick={() => {
                    const to = u.role === "owner" ? "client" : "owner";
                    if (window.confirm(`Змінити роль «${u.name}» на «${ROLE_LABEL[to]}»?`)) onSetRole(u.id, to);
                  }}
                  style={miniBtn("#A3A8AD")}
                >
                  {u.role === "owner" ? "Зробити клієнтом" : "Зробити власником"}
                </button>
                {canDelete && (
                  <button
                    onClick={() => askDelete(u)}
                    disabled={rentCount > 0}
                    title={rentCount > 0 ? "Є активні оренди — спершу скасуйте їх" : "Видалити користувача"}
                    style={{ ...miniBtn(RED), opacity: rentCount > 0 ? 0.4 : 1, cursor: rentCount > 0 ? "not-allowed" : "pointer" }}
                  >
                    Видалити
                  </button>
                )}
                {rentCount > 0 && <span style={{ color: AMBER, fontSize: 11.5, alignSelf: "center" }}>є активні оренди — видалення недоступне</span>}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Відгуки власників на заявку з дошки: диспетчер підтверджує оренду з обраною пропозицією одним кліком
const liveResponses = (req) => (req.responses || []).filter((r) => ["sent", "chosen"].includes(r.status));
export const chosenResponse = (req) => (req.responses || []).find((r) => r.listing_id === req.listingId && ["sent", "chosen"].includes(r.status)) || null;

export function ResponsesBlock({ req, listings, users, allBookings, dateFrom, dateTo, onConfirm }) {
  const [busyKey, setBusyKey] = useState(null);
  const rs = liveResponses(req);
  if (!rs.length) return null;
  const from = dateFrom !== undefined ? dateFrom : req.dateFrom;
  const to = dateTo !== undefined ? dateTo : req.dateTo;
  const datesOk = !!(from && to && to >= from);
  return (
    <div style={{ border: "1px solid #FFB52E", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10, fontFamily: FONT, fontSize: 12.5 }}>
      <Label>Відгуки власників ({rs.length})</Label>
      {!datesOk && <div style={{ color: AMBER }}>У заявці немає дат — вкажіть період у блоці «Підібрати техніку» (вкладка «Заявки»), щоб підтвердити.</div>}
      {rs.map((r) => {
        const l = listings.find((x) => x.id === r.listing_id);
        const owner = users.find((u) => u.id === r.owner_id);
        const conflicts = conflictsFor(r.listing_id, from, to, allBookings);
        const busyUntil = conflicts.length ? conflicts.map((c) => c.date_to).sort().slice(-1)[0] : null;
        const blocked = !datesOk || !!busyUntil || (l && !l.available);
        return (
          <div key={r.id} style={{ borderLeft: `2px solid ${r.status === "chosen" ? GREEN : "#3a3f44"}`, paddingLeft: 10, display: "flex", flexDirection: "column", gap: 4 }}>
            <div>
              <b style={{ fontSize: 14 }}>{l ? l.brand : `№${r.listing_id}`}</b> · {owner ? owner.org || owner.name : l ? l.owner : "власник"}
              {owner && owner.phone && owner.phone !== "—" ? <> · <a href={`tel:${String(owner.phone).replace(/[^\d+]/g, "")}`} style={{ color: "#F4F4F1" }}>{owner.phone}</a></> : null}
            </div>
            <div>
              <b style={{ color: "#FF6A1A" }}>{Number(r.price).toLocaleString("uk-UA")} ₴ {unitLabel(r.price_unit)}</b>
              {r.note ? <span style={{ color: "#A3A8AD" }}> · «{r.note}»</span> : null}
              {busyUntil ? <span style={{ color: RED }}> · зайнята до {fmtDate(busyUntil)}</span> : null}
              {r.status === "chosen" ? <span style={{ color: GREEN }}> · клієнт обрав цю пропозицію</span> : null}
            </div>
            <div>
              <button
                disabled={blocked || busyKey === r.id}
                onClick={async () => {
                  setBusyKey(r.id);
                  try {
                    await onConfirm(r.listing_id, from, to);
                  } finally {
                    setBusyKey(null);
                  }
                }}
                style={{ ...primaryBtn, padding: "8px 16px", fontSize: 12.5, opacity: blocked ? 0.45 : 1, cursor: blocked ? "not-allowed" : "pointer" }}
              >
                Підтвердити оренду з цією пропозицією
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---- Вкладка «Хто в кого»: один екран — клієнт → яку техніку → у якого власника ----
const PAIR_STATE = {
  wanted: { text: "Клієнт хоче цю техніку — потрібне ваше рішення", color: AMBER, rank: 0 },
  reserved: { text: "Клієнт підтвердив — підтвердіть оренду", color: AMBER, rank: 0 },
  offered: { text: "Запропоновано клієнту, чекаємо відповіді", color: "#A3A8AD", rank: 1 },
  responses: { text: "Є відгуки власників — оберіть і підтвердіть", color: AMBER, rank: 0 },
  open: { text: "Техніку ще не обрано", color: "#A3A8AD", rank: 2 },
  confirmed: { text: "Оренду підтверджено", color: GREEN, rank: 3 },
  active: { text: "Оренда триває", color: GREEN, rank: 3 },
};
const telHref = (v) => `tel:${String(v || "").replace(/[^\d+]/g, "")}`;
const hoursAgo = (iso) => {
  if (!iso) return "";
  const h = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 3600000));
  return h < 1 ? "щойно" : h < 24 ? `${h} год тому` : `${Math.round(h / 24)} дн тому`;
};

function PhoneLink({ value }) {
  if (!value || value === "—") return <span style={{ color: "#70777D" }}>телефон не вказано</span>;
  return <a href={telHref(value)} style={{ color: "#F4F4F1" }}>{value}</a>;
}

export function PairsBoard({ requests, listings, offers, bookings, users, onConfirm, onDecline, onConfirmBooking, onManual, onOpenRequests }) {
  const [filter, setFilter] = useState("all");
  const [busyKey, setBusyKey] = useState(null);
  const today = todayLocal();
  const L = (id) => listings.find((l) => l.id === id) || null;
  const U = (id) => users.find((u) => u.id === id) || null;
  const ownerOf = (l) => {
    if (!l) return null;
    const u = U(l.ownerId);
    return { name: (u && (u.org || u.name)) || l.owner, phone: u ? u.phone : null };
  };

  const rows = [];
  const hasBooking = new Set();
  bookings.forEach((b) => {
    if (!["reserved", "confirmed"].includes(b.status) || b.date_to < today) return;
    const req = requests.find((r) => r.id === b.request_id) || null;
    const cu = U(b.client_id);
    const client = req ? { name: req.requesterName || "Клієнт", phone: req.contact } : cu ? { name: cu.name, phone: cu.phone } : { name: "Клієнт", phone: null };
    const l = L(b.listing_id);
    rows.push({
      key: `b${b.id}`, state: b.status === "reserved" ? "reserved" : b.date_from <= today ? "active" : "confirmed",
      client, listing: l, owner: ownerOf(l), from: b.date_from, to: b.date_to, req, booking: b, sort: b.date_from,
    });
    if (b.request_id) hasBooking.add(b.request_id);
  });
  requests.forEach((r) => {
    if (hasBooking.has(r.id) || ["cancelled", "expired", "taken", "booked"].includes(r.status)) return;
    const client = { name: r.requesterName || "Клієнт", phone: r.contact };
    if (r.listingId) {
      const l = L(r.listingId);
      rows.push({ key: `w${r.id}`, state: "wanted", client, listing: l, owner: ownerOf(l), from: r.dateFrom, to: r.dateTo, req: r, sort: r.createdAt || "" });
      return;
    }
    const prop = offers.find((o) => o.request_id === r.id && o.status === "proposed");
    if (prop) {
      const l = L(prop.listing_id);
      rows.push({ key: `o${r.id}`, state: "offered", client, listing: l, owner: ownerOf(l), from: prop.date_from, to: prop.date_to, req: r, sort: r.createdAt || "" });
      return;
    }
    rows.push({ key: `n${r.id}`, state: liveResponses(r).length ? "responses" : "open", client, listing: null, owner: null, from: r.dateFrom, to: r.dateTo, req: r, sort: r.createdAt || "" });
  });
  rows.sort((a, b) => PAIR_STATE[a.state].rank - PAIR_STATE[b.state].rank || (a.sort < b.sort ? -1 : 1));

  const groups = {
    all: { label: "Усе", test: () => true },
    decide: { label: "Чекають рішення", test: (r) => PAIR_STATE[r.state].rank === 0 },
    done: { label: "Підтверджені", test: (r) => PAIR_STATE[r.state].rank === 3 },
    open: { label: "Без техніки", test: (r) => r.state === "open" || r.state === "responses" },
  };
  const shown = rows.filter(groups[filter].test);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {Object.entries(groups).map(([k, g]) => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            style={{ ...smallBtn, padding: "6px 14px", fontSize: 12.5, borderColor: filter === k ? "#FF6A1A" : "rgba(255,255,255,0.18)", color: filter === k ? "#FF6A1A" : "#ffffff" }}
          >
            {g.label} ({rows.filter(g.test).length})
          </button>
        ))}
      </div>

      {shown.length === 0 && (
        <div style={{ fontFamily: FONT, fontSize: 13, color: "#A3A8AD" }}>
          {rows.length === 0 ? "Поки ніхто нічого не хоче орендувати. Щойно клієнт забронює техніку, вона з'явиться тут." : "У цій групі нічого немає."}
        </div>
      )}

      {shown.map((row) => {
        const st = PAIR_STATE[row.state];
        const l = row.listing;
        return (
          <div key={row.key} style={{ border: `1px solid ${st.color === "#A3A8AD" ? "#2a2e32" : st.color}`, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10, fontFamily: FONT, fontSize: 12.5 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
              <span style={{ color: st.color, fontWeight: 600 }}>{st.text}</span>
              {row.req && <span style={{ color: "#70777D" }}>заявка №{row.req.id}{row.req.createdAt ? ` · ${hoursAgo(row.req.createdAt)}` : ""}</span>}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 14 }}>
              <div>
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}><RoleTag kind="rent" /><Label>Хто хоче орендувати</Label></span>
                <div style={{ fontSize: 15, fontWeight: 600, marginTop: 6 }}>{row.client.name}</div>
                <PhoneLink value={row.client.phone} />
              </div>
              <div>
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}><RoleTag kind="lease" /><Label>У кого</Label></span>
                {l ? (
                  <>
                    <div style={{ fontSize: 15, fontWeight: 600, marginTop: 6 }}>
                      {l.brand} <span style={{ fontWeight: 400, fontSize: 12.5, color: "#A3A8AD" }}>· {l.type} · {l.price} ₴/{l.unit}</span>
                    </div>
                    <div>
                      Власник: <b>{row.owner ? row.owner.name : "—"}</b> · <PhoneLink value={row.owner && row.owner.phone} />
                    </div>
                  </>
                ) : (
                  <div style={{ marginTop: 6, color: "#A3A8AD" }}>
                    {row.req ? `${row.req.type}, ${row.req.region}` : "—"}
                  </div>
                )}
              </div>
            </div>

            {row.state === "wanted" ? (
              <>
                {chosenResponse(row.req) && (
                  <div style={{ color: "#FF6A1A" }}>
                    Ціна за пропозицією власника: <b>{Number(chosenResponse(row.req).price).toLocaleString("uk-UA")} ₴ {unitLabel(chosenResponse(row.req).price_unit)}</b>
                  </div>
                )}
                <WantedActions req={row.req} listing={l} allBookings={bookings} onConfirm={onConfirm} onDecline={onDecline} />
              </>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div>
                  {fmtPeriod(row.from, row.to)}
                  {row.req && row.req.withOperator ? " · з оператором" : ""}
                </div>
                {row.req && row.req.comment && <div style={{ color: "#A3A8AD" }}>{row.req.comment}</div>}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {row.state === "reserved" && (
                    <button
                      disabled={busyKey === row.key}
                      onClick={async () => {
                        setBusyKey(row.key);
                        try {
                          await onConfirmBooking(row.booking.id);
                        } finally {
                          setBusyKey(null);
                        }
                      }}
                      style={{ ...primaryBtn, padding: "9px 18px", fontSize: 13 }}
                    >
                      Підтвердити оренду
                    </button>
                  )}
                  {(row.state === "open" || row.state === "responses") && (
                    <button onClick={onOpenRequests} style={miniBtn("#FF6A1A")}>Підібрати техніку →</button>
                  )}
                </div>
                {row.state === "responses" && (
                  <ResponsesBlock req={row.req} listings={listings} users={users} allBookings={bookings} onConfirm={(listingId, f, t) => onManual(row.req.id, listingId, f, t)} />
                )}
                {row.req && row.req.isPublic && row.state !== "responses" && <div style={{ color: "#70777D" }}>Заявка вивішена на дошці запитів</div>}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
