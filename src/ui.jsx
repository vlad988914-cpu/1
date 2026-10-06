// Спільні елементи інтерфейсу: картка, підпис, кнопки, поля, модальне вікно.
// Винесено з головного файлу, щоб нові екрани (кабінети, диспетчерська) могли ними користуватись.
import React, { useEffect, useRef } from "react";

export const Plate = ({ children, style, className, onClick }) => (
  <div
    className={className}
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
  background: "none",
  border: `1px solid ${color}`,
  color,
  fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif",
  fontSize: 10.5,
  padding: "3px 8px",
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

export const primaryBtn = {
  background: "linear-gradient(90deg, #FF6A1A, #FFB52E)",
  color: "#08090A",
  border: "none",
  borderRadius: 980,
  padding: "12px 22px",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif",
  fontSize: 14,
  fontWeight: 600,
  letterSpacing: "-0.01em",
  textTransform: "none",
  cursor: "pointer",
  boxShadow: "0 4px 16px rgba(255, 90, 31, 0.3)",
};

export const smallBtn = {
  background: "transparent",
  color: "#ffffff",
  border: "1px solid rgba(255,255,255,0.18)",
  borderRadius: 980,
  padding: "8px 16px",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif",
  fontSize: 13,
  fontWeight: 500,
  letterSpacing: "-0.01em",
  textTransform: "none",
  transition: "border-color 0.2s ease, color 0.2s ease",
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

  useEffect(() => {
    closeBtnRef.current?.focus();
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
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
            onClick={onClose}
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
