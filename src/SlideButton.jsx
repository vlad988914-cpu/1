import React, { useEffect } from "react";

// Кнопка «Book a demo»: світла таблетка, зліва жовтий квадрат із точковою стрілкою.
// При наведенні квадрат розтікається на всю кнопку, текст ховається, стрілки біжать. При натисканні кнопка втискається.
const CSS = `
.sb{position:relative;display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:40px;padding:0 20px 0 50px;border:0;border-radius:999px;cursor:pointer;
  font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif;font-size:14px;font-weight:500;letter-spacing:.005em;color:#16120A;white-space:nowrap;
  background:linear-gradient(180deg,#FFFDF8 0%,#F1E9D6 100%);
  box-shadow:inset 0 1px 0 #fff,inset 0 -2px 4px rgba(120,90,20,.18),0 0 0 1px rgba(255,184,28,.35),0 8px 22px rgba(0,0,0,.45),0 0 18px rgba(255,184,28,.12);
  transition:transform .14s ease-out,box-shadow .14s ease-out;-webkit-tap-highlight-color:transparent;user-select:none;overflow:hidden}
.sb.sb-sm{min-height:36px;padding:0 16px 0 44px;font-size:13px}
.sb-fill{position:absolute;left:4px;top:4px;bottom:4px;width:calc(var(--sbh,32px));border-radius:999px;overflow:hidden;
  background:linear-gradient(135deg,#FFD25A 0%,#FFB81C 55%,#FF9A1A 100%);
  box-shadow:inset 0 1px 0 rgba(255,244,200,.9),inset 0 -2px 3px rgba(150,80,0,.3);
  transition:width .62s cubic-bezier(.65,.05,.2,1)}
.sb-arrows{position:absolute;left:0;top:0;bottom:0;display:flex;align-items:center;gap:6px;padding-left:calc((var(--sbh,32px) - 18px) / 2)}
.sb-arrows svg{flex:none;width:18px;height:18px;opacity:.9}
.sb-arrows svg:not(:first-child){opacity:0;transform:translateX(-10px);transition:opacity .35s ease,transform .5s ease}
.sb-label{position:relative;display:inline-flex;align-items:center;gap:8px;transition:opacity .28s ease,transform .45s ease}
@keyframes sb-march{from{transform:translateX(0)}to{transform:translateX(28px)}}
@media (hover:hover){
  .sb:hover .sb-fill{width:calc(100% - 8px)}
  .sb:hover .sb-label{opacity:0;transform:translateX(14px)}
  .sb:hover .sb-arrows svg:not(:first-child){opacity:.85;transform:none}
  .sb:hover .sb-arrows svg:nth-child(2){transition-delay:.08s}.sb:hover .sb-arrows svg:nth-child(3){transition-delay:.14s}
  .sb:hover .sb-arrows svg:nth-child(4){transition-delay:.2s}.sb:hover .sb-arrows svg:nth-child(5){transition-delay:.26s}
  .sb:hover .sb-arrows svg:nth-child(n+6){transition-delay:.32s}
  .sb:hover{box-shadow:inset 0 1px 0 #fff,inset 0 -2px 4px rgba(120,90,20,.18),0 0 0 1px rgba(255,184,28,.6),0 10px 26px rgba(0,0,0,.5),0 0 26px rgba(255,184,28,.28)}
}
button.sb:not(:disabled):active{transform:translateY(3px) scale(.985);
  box-shadow:inset 0 3px 8px rgba(90,60,0,.45),inset 0 -1px 0 rgba(255,255,255,.7),0 0 0 1px rgba(255,184,28,.6),0 2px 6px rgba(0,0,0,.5)}
.sb:focus-visible{outline:2px solid #FFB81C;outline-offset:3px}
@media (hover:none){ .sb:active .sb-fill{width:calc(100% - 8px)} .sb:active .sb-label{opacity:0} }
@media (prefers-reduced-motion:reduce){.sb,.sb-fill,.sb-label,.sb-arrows svg{transition:none!important}}
`;

function Chevron() {
  // точкова стрілка ›
  const d = [[6, 4], [10, 8], [14, 12], [10, 16], [6, 20], [10, 12], [14, 8], [14, 16]];
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {d.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={i < 5 ? 1.5 : 1.1} fill="#4A2F00" />)}
    </svg>
  );
}

export default function SlideButton({ label, icon = null, onClick, type = "button", small = false, style }) {
  useEffect(() => {
    if (!document.getElementById("slide-btn-css")) {
      const s = document.createElement("style");
      s.id = "slide-btn-css"; s.textContent = CSS; document.head.appendChild(s);
    }
  }, []);
  const h = small ? 28 : 32;
  return (
    <button type={type} onClick={onClick} className={`sb${small ? " sb-sm" : ""}`} style={{ "--sbh": h + "px", ...style }}>
      <span className="sb-fill" aria-hidden="true">
        <span className="sb-arrows">{Array.from({ length: 14 }).map((_, i) => <Chevron key={i} />)}</span>
      </span>
      <span className="sb-label">{icon}{label}</span>
    </button>
  );
}
