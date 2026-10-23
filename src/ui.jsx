// Спільні елементи інтерфейсу: картка, підпис, кнопки, поля, модальне вікно.
// Винесено з головного файлу, щоб нові екрани (кабінети, диспетчерська) могли ними користуватись.
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTx } from "./lang.js";

export const Plate = ({ children, style, className, onClick }) => (
  <div
    className={`mo-spot ${className || ""}`.trim()}
    onClick={onClick}
    style={{
      position: "relative",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 16,
      background: "#A53C0D",
      boxShadow: "0 1px 2px rgba(0,0,0,0.3), 0 8px 24px rgba(0,0,0,0.25)",
      ...style,
    }}
  >
    {children}
  </div>
);

export const Label = ({ children }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 7, fontFamily: "'Manrope', -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif", fontSize: 11, letterSpacing: "0.01em", color: "#FFE6D0" }}>
    <span style={{ width: 11, height: 1.4, background: "#FFE3BD", flexShrink: 0 }} />
    {children}
  </div>
);

export const badgeStyle = {
  fontFamily: "'Manrope', -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif",
  fontSize: 11,
  padding: "5px 10px",
  height: "fit-content",
};

export const miniBtn = (color) => ({
  background: "linear-gradient(180deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.02) 45%, rgba(255,255,255,0.05) 100%), rgba(22,14,9,0.58)",
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
    <span style={{ color: "#FFD0C4", fontSize: 11, fontFamily: "'Manrope', -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif" }}>{children}</span>
  );
}

export function Field({ label, children, style }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6, ...style }}>
      <span style={{ fontFamily: "'Manrope', -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif", fontSize: 10.5, letterSpacing: "0.08em", textTransform: "none", color: "#FFE6D0" }}>
        {label}
      </span>
      {children}
    </label>
  );
}

import "./liquid.css";

// Liquid glass: темне скло, кольорова кромка, блик зверху, кольорове світіння знизу
const LG_FONT = "'Manrope', -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif";
export const lgGlass = (rgb, fill = 0.16) => ({
  background: `linear-gradient(180deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.03) 40%, rgba(${rgb},${fill}) 100%), rgba(22,14,9,0.58)`,
  border: `1px solid rgba(${rgb},0.6)`,
  boxShadow: `inset 0 1.5px 0 rgba(255,255,255,0.38), inset 0 -9px 14px -7px rgba(${rgb},0.55), inset 0 0 0 1px rgba(255,255,255,0.05), 0 10px 20px -9px rgba(${rgb},0.65), 0 2px 5px rgba(0,0,0,0.45)`,
  backdropFilter: "blur(10px) saturate(1.5)",
  WebkitBackdropFilter: "blur(10px) saturate(1.5)",
});

export const primaryBtn = {
  background: "linear-gradient(180deg, #FFF3DC 0%, #FFD9A0 100%)",
  border: "1px solid rgba(255,240,215,0.9)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.8), 0 10px 22px -10px rgba(60,15,0,0.65), 0 2px 5px rgba(0,0,0,0.25)",
  color: "#3A1405",
  textShadow: "none",
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
  background: "#A53C0D",
  color: "#ffffff",
  border: "1px solid #FFDCC0",
  borderRadius: 8,
  padding: "9px 12px",
  fontFamily: "'Manrope', -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif",
  fontSize: 13,
};

export const inputStyle = {
  background: "#A53C0D",
  color: "#ffffff",
  border: "1px solid #FFDCC0",
  borderRadius: 8,
  padding: "10px 12px",
  fontFamily: "'Manrope', -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif",
  fontSize: 14,
  outline: "none",
};

export function Modal({ children, onClose, title, splitLeft, wide }) {
  const titleId = useRef(`modal-title-${Math.random().toString(36).slice(2, 9)}`).current;
  const closeBtnRef = useRef(null);
  const [closing, setClosing] = useState(false);
  const exitTimer = useRef(null);

  // onClose у батьків часто створюється заново при кожному рендері. Тримаємо його в ref,
  // щоб ефекти НЕ перезапускались (інакше фокус «стрибає» з поля вводу, клавіатура ховається).
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Уход короче входа (≈75%): сначала проигрываем анимацию, потом сообщаем родителю
  const requestClose = useCallback(() => {
    if (exitTimer.current) return;
    const reduce = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      onCloseRef.current();
      return;
    }
    setClosing(true);
    exitTimer.current = setTimeout(() => onCloseRef.current(), 200);
  }, []);
  useEffect(() => () => clearTimeout(exitTimer.current), []);

  // Фокус на кнопку закриття — лише один раз при відкритті і лише якщо фокус ще не у полі вводу
  useEffect(() => {
    const ae = document.activeElement;
    if (!(ae && /^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName))) closeBtnRef.current?.focus();
  }, []);

  useEffect(() => {
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
        background: "rgba(22,14,9,.7)",
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
          background: "#A53C0D",
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
              background: "linear-gradient(180deg, #A53C0D, #3A1405)",
              borderRight: "1px solid #EFA06A",
              padding: 28,
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end",
            }}
            className="auth-split-left"
          >
            <div style={{ fontFamily: "'Manrope', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif", fontSize: 26, fontWeight: 600, lineHeight: 1.15 }}>
              ТЕХНІКА<br />ПОЧИНАЄТЬСЯ<br />З ПРАВИЛЬНОГО<br /><span style={{ color: "#FFE3BD" }}>ЗАПИТУ.</span>
            </div>
          </div>
        )}
        <div style={{ padding: 24, flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h2 id={titleId} style={{ fontFamily: "'Manrope', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif", textTransform: "none", fontSize: 18, margin: 0 }}>
            {title}
          </h2>
          <button
            ref={closeBtnRef}
            onClick={requestClose}
            aria-label="Закрити"
            style={{ background: "none", border: "none", color: "#FFE6D0", fontSize: 20, cursor: "pointer", padding: 10, margin: -10 }}
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
  const color = rent ? "#B9F6CA" : "#FFE3BD";
  return (
    <span
      style={{
        display: "inline-block",
        fontFamily: "'Manrope', -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif",
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
  const backText = useTx().back;
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => { if (e.key === "Escape") onCloseRef.current(); };
    document.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prev; document.removeEventListener("keydown", onKey); };
  }, []);
  return (
    <div className="lp-page" role="dialog" aria-modal="true" aria-label={title}>
      <div className="lp-bar">
        <button type="button" className="lp-back" onClick={onClose}>
          <span aria-hidden="true">←</span> {backText}
        </button>
        {crumb && <span className="lp-crumb">{crumb}</span>}
      </div>
      <div className="lp-body">{children}</div>
    </div>
  );
}
