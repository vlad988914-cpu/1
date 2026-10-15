// Спільні елементи інтерфейсу: картка, підпис, кнопки, поля, модальне вікно.
// Винесено з головного файлу, щоб нові екрани (кабінети, диспетчерська) могли ними користуватись.
import React, { useCallback, useEffect, useRef, useState } from "react";

export const Plate = ({ children, style, className, onClick }) => (
  <div
    className={`mo-spot ${className || ""}`.trim()}
    onClick={onClick}
    style={{
      position: "relative",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 16,
      background: "#15181A",
      boxShadow: "0 1px 2px rgba(0,0,0,0.3), 0 8px 24px rgba(0,0,0,0.25)",
      ...style,
    }}
  >
    {children}
  </div>
);

export const Label = ({ children }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 7, fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif", fontSize: 11, letterSpacing: "0.01em", color: "#A3A8AD" }}>
    <span style={{ width: 11, height: 1.4, background: "#FF6A1A", flexShrink: 0 }} />
    {children}
  </div>
);

export const badgeStyle = {
  fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif",
  fontSize: 11,
  padding: "5px 10px",
  height: "fit-content",
};

export const miniBtn = (color) => ({
  background: "linear-gradient(180deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.02) 45%, rgba(255,255,255,0.05) 100%), rgba(14,16,20,0.58)",
  border: `1px solid ${color}`,
  color,
  borderRadius: 980,
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.35), inset 0 -6px 9px -6px currentColor, 0 7px 12px -8px currentColor, 0 1px 3px rgba(0,0,0,0.4)",
  backdropFilter: "blur(8px)",
  WebkitBackdropFilter: "blur(8px)",
  fontFamily: LG_FONT,
  fontSize: 10.5,
  padding: "4px 11px",
  cursor: "pointer",
});

export function ErrorText({ children }) {
  return (
    <span style={{ color: "#c96b5a", fontSize: 11, fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif" }}>{children}</span>
  );
}

export function Field({ label, children, style }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6, ...style }}>
      <span style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif", fontSize: 10.5, letterSpacing: "0.08em", textTransform: "none", color: "#A3A8AD" }}>
        {label}
      </span>
      {children}
    </label>
  );
}

import "./liquid.css";

// Liquid glass: темне скло, кольорова кромка, блик зверху, кольорове світіння знизу
const LG_FONT = "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif";
export const lgGlass = (rgb, fill = 0.16) => ({
  background: `linear-gradient(180deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.03) 40%, rgba(${rgb},${fill}) 100%), rgba(14,16,20,0.58)`,
  border: `1px solid rgba(${rgb},0.6)`,
  boxShadow: `inset 0 1.5px 0 rgba(255,255,255,0.38), inset 0 -9px 14px -7px rgba(${rgb},0.55), inset 0 0 0 1px rgba(255,255,255,0.05), 0 10px 20px -9px rgba(${rgb},0.65), 0 2px 5px rgba(0,0,0,0.45)`,
  backdropFilter: "blur(10px) saturate(1.5)",
  WebkitBackdropFilter: "blur(10px) saturate(1.5)",
});

export const primaryBtn = {
  ...lgGlass("255,106,26", 0.5),
  background: "linear-gradient(180deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.04) 42%, rgba(255,181,46,0.0) 100%), linear-gradient(90deg, rgba(255,106,26,0.62), rgba(255,181,46,0.46)), rgba(14,16,20,0.6)",
  border: "1px solid rgba(255,196,130,0.7)",
  color: "#ffffff",
  textShadow: "0 1px 2px rgba(0,0,0,0.55)",
  borderRadius: 980,
  padding: "12px 22px",
  fontFamily: LG_FONT,
  fontSize: 14,
  fontWeight: 600,
  letterSpacing: "-0.01em",
  textTransform: "none",
  cursor: "pointer",
};

export const smallBtn = {
  ...lgGlass("255,255,255", 0.07),
  border: "1px solid rgba(255,255,255,0.3)",
  boxShadow: "inset 0 1.5px 0 rgba(255,255,255,0.35), inset 0 -8px 12px -7px rgba(255,255,255,0.18), inset 0 0 0 1px rgba(255,255,255,0.04), 0 9px 16px -10px currentColor, 0 2px 5px rgba(0,0,0,0.4)",
  color: "#ffffff",
  borderRadius: 980,
  padding: "8px 16px",
  fontFamily: LG_FONT,
  fontSize: 13,
  fontWeight: 500,
  letterSpacing: "-0.01em",
  textTransform: "none",
  transition: "border-color 0.2s ease, color 0.2s ease, transform 0.2s ease",
};

export const selectStyle = {
  background: "#191C1F",
  color: "#ffffff",
  border: "1px solid #63696D",
  borderRadius: 8,
  padding: "9px 12px",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif",
  fontSize: 13,
};

export const inputStyle = {
  background: "#191C1F",
  color: "#ffffff",
  border: "1px solid #63696D",
  borderRadius: 8,
  padding: "10px 12px",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif",
  fontSize: 14,
  outline: "none",
};

export function Modal({ children, onClose, title, splitLeft, wide }) {
  const titleId = useRef(`modal-title-${Math.random().toString(36).slice(2, 9)}`).current;
  const closeBtnRef = useRef(null);
  const [closing, setClosing] = useState(false);
  const exitTimer = useRef(null);

  // Уход короче входа (≈75%): сначала проигрываем анимацию, потом сообщаем родителю
  const requestClose = useCallback(() => {
    if (exitTimer.current) return;
    const reduce = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      onClose();
      return;
    }
    setClosing(true);
    exitTimer.current = setTimeout(onClose, 200);
  }, [onClose]);
  useEffect(() => () => clearTimeout(exitTimer.current), []);

  useEffect(() => {
    closeBtnRef.current?.focus();
    const onKeyDown = (e) => {
      if (e.key === "Escape") requestClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [requestClose]);

  return (
    <div
      className="mo-backdrop"
      data-closing={closing ? "" : undefined}
      onClick={requestClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(10,9,8,.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        zIndex: 50,
      }}
    >
      <div
        className="mo-dialog"
        data-closing={closing ? "" : undefined}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        style={{
          background: "#15181A",
          border: "1px solid #48484a",
          width: "100%",
          maxWidth: splitLeft ? 760 : wide ? 640 : 460,
          maxHeight: "88vh",
          overflowY: "auto",
          display: splitLeft ? "flex" : "block",
        }}
      >
        {splitLeft && (
          <div
            style={{
              flex: "0 0 280px",
              background: "linear-gradient(180deg, #191C1F, #08090A)",
              borderRight: "1px solid #202428",
              padding: 28,
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end",
            }}
            className="auth-split-left"
          >
            <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif", fontSize: 26, fontWeight: 600, lineHeight: 1.15 }}>
              ТЕХНІКА<br />ПОЧИНАЄТЬСЯ<br />З ПРАВИЛЬНОГО<br /><span style={{ color: "#FF6A1A" }}>ЗАПИТУ.</span>
            </div>
          </div>
        )}
        <div style={{ padding: 24, flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h2 id={titleId} style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif", textTransform: "none", fontSize: 18, margin: 0 }}>
            {title}
          </h2>
          <button
            ref={closeBtnRef}
            onClick={requestClose}
            aria-label="Закрити"
            style={{ background: "none", border: "none", color: "#A3A8AD", fontSize: 20, cursor: "pointer", padding: 10, margin: -10 }}
          >
            ×
          </button>
        </div>
        {children}
        </div>
      </div>
    </div>
  );
}


// Пометка на карточках: хто це — той, хто орендує, чи той, хто здає техніку
export function RoleTag({ kind, style }) {
  const rent = kind === "rent";
  const color = rent ? "#6fae6f" : "#FF6A1A";
  return (
    <span
      style={{
        display: "inline-block",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif",
        fontSize: 10.5,
        fontWeight: 700,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        color,
        border: `1px solid ${color}`,
        padding: "2px 7px",
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {rent ? "Орендую" : "Здаю техніку"}
    </span>
  );
}

// Повноекранна сторінка поверх каталогу (картка техніки): верхня панель «Назад», зручно на телефоні.
export function PageShell({ children, onClose, title, crumb }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prev; document.removeEventListener("keydown", onKey); };
  }, [onClose]);
  return (
    <div className="lp-page" role="dialog" aria-modal="true" aria-label={title}>
      <div className="lp-bar">
        <button type="button" className="lp-back" onClick={onClose}>
          <span aria-hidden="true">←</span> Назад до каталогу
        </button>
        {crumb && <span className="lp-crumb">{crumb}</span>}
      </div>
      <div className="lp-body">{children}</div>
    </div>
  );
}
