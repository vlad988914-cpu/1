// «Дошка запитів»: клієнт вивішує заявку (дати, строк, ціна), власники відгукуються своєю технікою,
// клієнт обирає, диспетчер підтверджує — і лише тоді відкриваються контакти.
import React, { useState } from "react";
import { Plate, Label, Field, ErrorText, RoleTag, primaryBtn, smallBtn, selectStyle, inputStyle } from "./ui.jsx";
import { fmtDate, daysInclusive, rangesOverlap, todayLocal, unitLabel, BUDGET_UNITS } from "./services/deals.js";

const FONT = "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif";
const GREEN = "#6fae6f";
const RED = "#c96b5a";
const AMBER = "#FFB52E";

const ago = (iso) => {
  if (!iso) return "";
  const h = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 3600000));
  return h < 1 ? "щойно" : h < 24 ? `${h} год тому` : `${Math.round(h / 24)} дн тому`;
};

export function priceText(budget, unit) {
  if (budget === null || budget === undefined || Number(budget) <= 0) return "ціна договірна";
  return `${Number(budget).toLocaleString("uk-UA")} ₴ ${unitLabel(unit || "період")}`;
}

// ---------------- Картка запиту ----------------
function WantedCard({ item, user, onRespond, onUnpublish, onSignIn }) {
  const days = daysInclusive(item.req_date_from, item.req_date_to);
  const isOwner = user && user.role === "owner";
  return (
    <Plate style={{ padding: 14, display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <RoleTag kind="rent" />
          <Label>{item.req_type}</Label>
        </span>
        <span style={{ fontFamily: FONT, fontSize: 11.5, color: item.req_responses > 0 ? GREEN : "#70777D", border: `1px solid ${item.req_responses > 0 ? GREEN : "#2a2e32"}`, padding: "2px 8px" }}>
          {item.req_responses > 0 ? `Відгуків: ${item.req_responses}` : "Поки без відгуків"}
        </span>
      </div>
      <div style={{ fontFamily: FONT, fontSize: 17, fontWeight: 600 }}>{item.req_region}</div>
      <div style={{ fontFamily: FONT, fontSize: 13 }}>
        {item.req_date_from && item.req_date_to ? (
          <>
            {fmtDate(item.req_date_from)} — {fmtDate(item.req_date_to)} <span style={{ color: "#A3A8AD" }}>({days} {days === 1 ? "день" : days < 5 ? "дні" : "днів"})</span>
          </>
        ) : (
          <span style={{ color: "#A3A8AD" }}>дати за домовленістю</span>
        )}
      </div>
      <div style={{ fontFamily: FONT, fontSize: 16, fontWeight: 700, color: "#FF6A1A" }}>{priceText(item.req_budget, item.req_budget_unit)}</div>
      {item.req_with_operator && <div style={{ fontFamily: FONT, fontSize: 12, color: "#A3A8AD" }}>З оператором</div>}
      {item.req_comment && (
        <div style={{ fontFamily: FONT, fontSize: 12.5, color: "#D9DCDF", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {item.req_comment}
        </div>
      )}
      <div style={{ fontFamily: FONT, fontSize: 11.5, color: "#70777D" }}>
        Автор: {item.req_author} · {ago(item.req_created_at)}
      </div>

      <div style={{ marginTop: 4 }}>
        {item.req_mine ? (
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontFamily: FONT, fontSize: 12, color: AMBER }}>Це ваша заявка</span>
            <button onClick={() => onUnpublish(item.req_id)} style={{ ...smallBtn, padding: "6px 14px", fontSize: 12 }}>
              Зняти з дошки
            </button>
          </div>
        ) : !user ? (
          <button onClick={onSignIn} style={{ ...smallBtn, minHeight: 44, width: "100%" }}>
            Увійти, щоб відгукнутись
          </button>
        ) : isOwner ? (
          item.req_responded ? (
            <span style={{ fontFamily: FONT, fontSize: 12.5, color: GREEN }}>Ви вже відгукнулись</span>
          ) : (
            <button onClick={() => onRespond(item)} style={{ ...primaryBtn, minHeight: 44, width: "100%" }}>
              Запропонувати свою техніку
            </button>
          )
        ) : user.role === "dispatcher" ? null : (
          <span style={{ fontFamily: FONT, fontSize: 11.5, color: "#70777D" }}>Відгукуватись можуть власники техніки</span>
        )}
      </div>
    </Plate>
  );
}

// ---------------- Дошка ----------------
export function WantedBoard({ items, user, onPublish, onRespond, onUnpublish, onSignIn, loaded }) {
  const [type, setType] = useState("Усі");
  const [shownAll, setShownAll] = useState(false);
  const types = ["Усі", ...Array.from(new Set(items.map((i) => i.req_type)))];
  const list = items.filter((i) => type === "Усі" || i.req_type === type);
  const visible = shownAll ? list : list.slice(0, 6);

  return (
    <div style={{ padding: "8px 24px 48px", maxWidth: 1100, margin: "0 auto" }}>
      <h2 style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif", fontSize: 24, textTransform: "none", margin: "0 0 6px" }}>
        Дошка запитів
      </h2>
      <p style={{ fontFamily: FONT, fontSize: 13.5, color: "#A3A8AD", margin: "0 0 14px", maxWidth: 680 }}>
        Не знайшли потрібну техніку? Вивісьте свою заявку: дати, строк і ціну. Власники відгукнуться своєю технікою — ви оберете, а диспетчер підтвердить. Контакти відкриваються лише після підтвердження.
      </p>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 14 }}>
        <button onClick={onPublish} style={{ ...primaryBtn, minHeight: 44 }}>
          Вивісити свою заявку
        </button>
        {types.length > 2 && (
          <select aria-label="Тип техніки на дошці" value={type} onChange={(e) => setType(e.target.value)} style={selectStyle}>
            {types.map((t) => (
              <option key={t} value={t}>
                {t === "Усі" ? "Усі типи" : t}
              </option>
            ))}
          </select>
        )}
        <span style={{ fontFamily: FONT, fontSize: 12.5, color: "#70777D" }}>{items.length > 0 ? `Зараз шукають: ${items.length}` : ""}</span>
      </div>

      {loaded && list.length === 0 && (
        <div style={{ fontFamily: FONT, fontSize: 13, color: "#A3A8AD" }}>
          Поки що нікого не шукають. Будьте першим: вивісьте заявку — власники побачать її одразу.
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
        {visible.map((item) => (
          <WantedCard key={item.req_id} item={item} user={user} onRespond={onRespond} onUnpublish={onUnpublish} onSignIn={onSignIn} />
        ))}
      </div>
      {list.length > 6 && !shownAll && (
        <button onClick={() => setShownAll(true)} style={{ ...smallBtn, marginTop: 14 }}>
          Показати всі ({list.length})
        </button>
      )}
    </div>
  );
}

// ---------------- Форма відгуку власника ----------------
export function RespondForm({ request, myListings, busyRanges, onSubmit, onAddListing }) {
  const today = todayLocal();
  const candidates = myListings.filter((l) => l.type === request.req_type);
  const busyUntil = (l) => {
    if (!request.req_date_from || !request.req_date_to) return null;
    const hit = busyRanges.filter((r) => r.listing_id === l.id && r.date_to >= today && rangesOverlap(r.date_from, r.date_to, request.req_date_from, request.req_date_to));
    return hit.length ? hit.map((r) => r.date_to).sort().slice(-1)[0] : null;
  };
  const firstFree = candidates.find((l) => l.available && !busyUntil(l));
  const [listingId, setListingId] = useState(firstFree ? String(firstFree.id) : candidates[0] ? String(candidates[0].id) : "");
  const chosen = candidates.find((l) => String(l.id) === listingId);
  const [price, setPrice] = useState(chosen ? String(chosen.price) : "");
  const [unit, setUnit] = useState(chosen ? chosen.unit : "зміну");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const pick = (id) => {
    setListingId(id);
    const l = candidates.find((x) => String(x.id) === id);
    if (l) {
      setPrice(String(l.price));
      setUnit(l.unit);
    }
  };
  const blocked = !chosen || !chosen.available || !!busyUntil(chosen);
  const canSend = !!chosen && !blocked && Number(price) > 0 && !busy;

  if (candidates.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12, fontFamily: FONT, fontSize: 13.5 }}>
        <div>
          Для цієї заявки потрібна техніка типу <b>{request.req_type}</b>, а в вашому каталозі її немає.
        </div>
        <button onClick={onAddListing} style={{ ...primaryBtn, minHeight: 46 }}>
          Додати техніку в каталог
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (!canSend) return;
        setBusy(true);
        try {
          await onSubmit({ listingId: chosen.id, price: Number(price), unit, note });
        } finally {
          setBusy(false);
        }
      }}
      style={{ display: "flex", flexDirection: "column", gap: 12 }}
    >
      <div style={{ fontFamily: FONT, fontSize: 13, color: "#A3A8AD" }}>
        {request.req_type} · {request.req_region} ·{" "}
        {request.req_date_from && request.req_date_to ? `${fmtDate(request.req_date_from)} — ${fmtDate(request.req_date_to)}` : "дати за домовленістю"} ·{" "}
        <b style={{ color: "#FF6A1A" }}>{priceText(request.req_budget, request.req_budget_unit)}</b>
      </div>

      <Field label="Яку техніку пропонуєте">
        <select value={listingId} onChange={(e) => pick(e.target.value)} style={{ ...selectStyle, width: "100%", minHeight: 44 }}>
          {candidates.map((l) => (
            <option key={l.id} value={l.id}>
              {l.brand}
              {busyUntil(l) ? ` — зайнята до ${fmtDate(busyUntil(l))}` : !l.available ? " — недоступна" : ""}
            </option>
          ))}
        </select>
      </Field>
      {chosen && busyUntil(chosen) && <ErrorText>Ця техніка зайнята на дати заявки (до {fmtDate(busyUntil(chosen))}). Оберіть іншу.</ErrorText>}

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Field label="Ваша ціна, ₴" style={{ flex: "1 1 120px" }}>
          <input type="number" min="1" value={price} onChange={(e) => setPrice(e.target.value)} style={inputStyle} required />
        </Field>
        <Field label="Одиниця" style={{ flex: "1 1 140px" }}>
          <select value={unit} onChange={(e) => setUnit(e.target.value)} style={{ ...selectStyle, width: "100%", minHeight: 44 }}>
            {BUDGET_UNITS.map(([v, label]) => (
              <option key={v} value={v}>
                {label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Коментар (необов'язково): оператор, подача, умови">
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} style={{ ...inputStyle, resize: "vertical" }} />
      </Field>

      <button className="btn-premium-hover" type="submit" disabled={!canSend} style={{ ...primaryBtn, width: "100%", minHeight: 48, opacity: canSend ? 1 : 0.5, cursor: canSend ? "pointer" : "not-allowed" }}>
        {busy ? "Надсилаємо..." : "Надіслати пропозицію"}
      </button>
      <div style={{ fontFamily: FONT, fontSize: 11.5, color: "#70777D" }}>
        Клієнт побачить вашу техніку, ціну й коментар (без вашого телефону). Якщо він обере вашу пропозицію, диспетчер підтвердить оренду — і тоді відкриються контакти.
      </div>
    </form>
  );
}

// ---------------- «Мої відгуки» у кабінеті власника ----------------
const RESPONSE_STATE = {
  sent: { text: "Чекає вибору клієнта", color: AMBER },
  chosen: { text: "Клієнт обрав вашу техніку — диспетчер підтверджує", color: GREEN },
  declined: { text: "Не обрано або заявку закрито", color: "#70777D" },
  withdrawn: { text: "Ви забрали відгук", color: "#70777D" },
};

export function OwnerResponses({ items, onWithdraw, onRefresh }) {
  const [busyId, setBusyId] = useState(null);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <button onClick={onRefresh} style={{ ...smallBtn, alignSelf: "flex-start", padding: "5px 12px", fontSize: 12 }}>
        Оновити
      </button>
      {items.length === 0 && (
        <div style={{ fontFamily: FONT, fontSize: 13, color: "#A3A8AD" }}>
          Ви ще не відгукувались на заявки. Загляньте в «Дошку запитів» на головній сторінці.
        </div>
      )}
      {items.map((x) => {
        const done = x.status === "chosen" && x.request.status === "taken";
        const st = done ? { text: "Оренду підтверджено", color: GREEN } : RESPONSE_STATE[x.status] || RESPONSE_STATE.sent;
        return (
          <Plate key={x.id} style={{ padding: 14, display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <RoleTag kind="lease" />
                <Label>{x.listing.brand}</Label>
              </span>
              <span style={{ fontFamily: FONT, fontSize: 11.5, color: st.color }}>{st.text}</span>
            </div>
            <div style={{ fontFamily: FONT, fontSize: 14, fontWeight: 600 }}>
              {x.request.type} · {x.request.region}
            </div>
            <div style={{ fontFamily: FONT, fontSize: 12.5, color: "#A3A8AD" }}>
              {x.request.date_from && x.request.date_to ? `${fmtDate(x.request.date_from)} — ${fmtDate(x.request.date_to)}` : "дати за домовленістю"} · клієнт {x.request.author} · хоче {priceText(x.request.budget, x.request.budget_unit)}
            </div>
            <div style={{ fontFamily: FONT, fontSize: 13 }}>
              Ваша пропозиція: <b>{Number(x.price).toLocaleString("uk-UA")} ₴ {unitLabel(x.price_unit)}</b>
              {x.note ? <span style={{ color: "#A3A8AD" }}> · «{x.note}»</span> : null}
            </div>
            {x.status === "sent" && (
              <div>
                <button
                  disabled={busyId === x.id}
                  onClick={async () => {
                    setBusyId(x.id);
                    try {
                      await onWithdraw(x.id);
                    } finally {
                      setBusyId(null);
                    }
                  }}
                  style={{ ...smallBtn, padding: "6px 14px", fontSize: 12 }}
                >
                  Забрати відгук
                </button>
              </div>
            )}
          </Plate>
        );
      })}
    </div>
  );
}
