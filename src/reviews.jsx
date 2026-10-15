// Відгуки про техніку: бачать усі, писати можуть лише зареєстровані (не власник цієї техніки).
import React, { useState } from "react";
import { Label, Field, ErrorText, primaryBtn, smallBtn, inputStyle } from "./ui.jsx";

const FONT = "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif";
const fmt = (iso) => { try { return new Date(iso).toLocaleDateString("uk-UA", { day: "numeric", month: "long", year: "numeric" }); } catch { return ""; } };

export function ListingReviews({ items, available, user, isOwnerOfListing, onSubmit, onDelete, onSignIn }) {
  const mine = user ? items.find((r) => r.user_id === user.id) : null;
  const [text, setText] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const send = async (e) => {
    e.preventDefault();
    const v = text.trim();
    if (v.length < 5) { setErr("Напишіть хоча б кілька слів (від 5 символів)"); return; }
    setErr(""); setBusy(true);
    const ok = await onSubmit(v);
    setBusy(false);
    if (ok) setText("");
  };
  return (
    <div>
      <Label>Відгуки клієнтів{items.length ? ` · ${items.length}` : ""}</Label>
      {!available && <div style={{ marginTop: 8, fontFamily: FONT, fontSize: 13, color: "#70777D" }}>Відгуки з'являться найближчим часом.</div>}
      {available && items.length === 0 && <div style={{ marginTop: 8, fontFamily: FONT, fontSize: 13, color: "#A3A8AD" }}>Відгуків поки немає. Орендували цю техніку? Поділіться враженням.</div>}
      {available && (
        <div style={{ marginTop: 6 }}>
          {items.map((r) => (
            <div key={r.user_id} className="rv-item">
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontFamily: FONT, fontSize: 13 }}>
                <b>{r.author_name || "Клієнт"}</b>
                <span style={{ color: "#70777D" }}>{fmt(r.created_at)}</span>
              </div>
              <p style={{ margin: "6px 0 0", fontFamily: FONT, fontSize: 14, lineHeight: 1.55, color: "#D9DCDF", whiteSpace: "pre-wrap" }}>{r.body}</p>
              {user && r.user_id === user.id && (
                <button type="button" onClick={onDelete} style={{ ...smallBtn, marginTop: 8, minHeight: 36 }}>Видалити мій відгук</button>
              )}
            </div>
          ))}
        </div>
      )}
      {available && !user && (
        <button type="button" onClick={onSignIn} style={{ ...smallBtn, marginTop: 10 }}>Увійти, щоб залишити відгук</button>
      )}
      {available && user && isOwnerOfListing && <div style={{ marginTop: 10, fontFamily: FONT, fontSize: 12.5, color: "#70777D" }}>Власник не може залишати відгуки про власну техніку.</div>}
      {available && user && !isOwnerOfListing && !mine && (
        <form onSubmit={send} style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
          <Field label="Ваш відгук">
            <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} maxLength={800} placeholder="Стан техніки, оператор, пунктуальність власника" style={{ ...inputStyle, resize: "vertical" }} />
          </Field>
          {err && <ErrorText>{err}</ErrorText>}
          <button type="submit" disabled={busy} style={{ ...smallBtn, minHeight: 44, opacity: busy ? 0.6 : 1 }}>{busy ? "Зберігаємо..." : "Надіслати відгук"}</button>
        </form>
      )}
    </div>
  );
}
