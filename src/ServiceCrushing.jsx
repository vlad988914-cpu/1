import React from "react";

/**
 * Окремий блок послуги «Дроблення бетону на будмайданчику».
 * Ціна не вказана: її додає власник. Регіон: Миколаїв і Миколаївська область.
 */
export default function ServiceCrushing({ onRequest }) {
  return (
    <section id="service-droblennya" aria-labelledby="service-droblennya-h" className="svc-crush" style={{ padding: "72px 24px", borderBottom: "1px solid #EFA06A" }}>
      <style>{`
        .svc-crush-grid { display: grid; grid-template-columns: minmax(0, 320px) minmax(0, 1fr); gap: 48px; align-items: center; max-width: 960px; margin: 0 auto; }
        @media (max-width: 760px) { .svc-crush-grid { grid-template-columns: 1fr; gap: 28px; } }
      `}</style>
      <div className="svc-crush-grid">
        <div style={{ position: "relative", borderRadius: 14, overflow: "hidden", aspectRatio: "9 / 16", width: "100%", background: "#111" }}>
          <video
            src="/service/droblennya-betonu.mp4"
            poster="/service/droblennya-betonu-poster.jpg"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            aria-label="Дроблення бетону екскаватором з роторною дробаркою на будмайданчику"
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        </div>
        <div>
          <div style={{ fontFamily: "'Manrope', -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif", fontSize: 12, color: "#FFD3B0", letterSpacing: "0.04em", marginBottom: 10 }}>
            НАША ПОСЛУГА
          </div>
          <h2 id="service-droblennya-h" style={{ fontFamily: "'Manrope', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif", fontSize: 26, lineHeight: 1.2, margin: "0 0 14px" }}>
            Дроблення бетону на будмайданчику
          </h2>
          <p style={{ fontSize: 15.5, lineHeight: 1.55, color: "#F4F4F1", margin: "0 0 14px" }}>
            Роторна дробарка на екскаваторі розбиває бетонні плити й конструкції прямо на майданчику. На виході — щебінь.
          </p>
          <p style={{ fontSize: 15.5, lineHeight: 1.55, color: "#F4F4F1", margin: "0 0 24px" }}>
            Працюємо в Миколаєві та Миколаївській області. Опишіть об'єкт у заявці, і ми підкажемо, чи підходить дроблення саме для вашої роботи.
          </p>
          <button
            type="button"
            onClick={() => onRequest && onRequest()}
            style={{ background: "#FFE3BD", color: "#1a1a1a", border: "none", borderRadius: 10, padding: "13px 22px", fontSize: 15, fontWeight: 600, cursor: "pointer" }}
          >
            Залишити заявку
          </button>
        </div>
      </div>
    </section>
  );
}
