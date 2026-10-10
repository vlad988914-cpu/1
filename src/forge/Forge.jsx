import { useEffect, useMemo, useRef, useState } from "react";
import "./forge.css";

// «Кузня» у шапці: робітник з відбійним молотком + лава на всю довжину панелі до надпису.
// Ролик-вступ (раз): тріщини → удар → лава розплескується вліво по всій плиті й доходить до логотипу.
// Далі — безкінечний цикл «лава кипить, робітник б'є». Наведення: яскравіше й швидше.

const WEBM_OK = typeof navigator !== "undefined" && !/^((?!chrome|android|crios|fxios|edg).)*safari/i.test(navigator.userAgent);
const reducedMotion = () => typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// геометрія смуги (джерельні пікселі ролика 3168 px завширшки; оригінальне відео займає праві 1168)
const SRC_W = 3168, EXT = 2000;
const T_SEAM = (143 - 49) / 24; // с вступу, коли фронт лави виходить за лівий край оригіналу
const T_RUN = 2.2;              // с, за які фронт пробігає продовження (EXT)

// коли фронт лави доходить до центру логотипу (с від початку вступу)
function hitTime(hdr, vid) {
  const logo = hdr.querySelector(".brand-3d");
  if (!logo || !vid) return T_SEAM + T_RUN;
  const vr = vid.getBoundingClientRect();
  const lr = logo.getBoundingClientRect();
  const k = vr.width / SRC_W;                       // css px на джерельний піксель
  const seamX = vr.left + EXT * k;                  // де закінчується оригінал і починається продовження
  const dist = (seamX - (lr.left + lr.width * 0.5)) / k; // джерельні px від шва до центру логотипу
  const r = Math.max(0, Math.min(1, dist / EXT));
  const u = (-1 + Math.sqrt(1 + 3.84 * r)) / 1.2;
  return T_SEAM + u * T_RUN;
}

export default function HeaderForge() {
  const box = useRef(null);
  const vA = useRef(null);
  const vB = useRef(null);
  const [on, setOn] = useState(false);
  const [ok, setOk] = useState(false);          // достатньо місця
  const [started, setStarted] = useState(false); // вступ пішов — постер не потрібен
  const [idle, setIdle] = useState(false);       // перейшли до циклу
  const hit = useRef(false);
  const reduced = useMemo(() => reducedMotion(), []);
  const animated = WEBM_OK && !reduced;
  const timer = useRef(0);

  // чи вміщається робітник; якщо шапка перенеслась на два рядки — ставимо його поверх (abs)
  useEffect(() => {
    const el = box.current;
    const hdr = el && el.closest("header");
    if (!hdr) return undefined;
    const measure = () => {
      // вузькі екрани (ноутбук 1920 з масштабом 175 % = ~1100 px): шапка в два ряди —
      // зверху логотип + кузня (лава до надпису), знизу меню. Те саме, якщо шапка переноситься сама.
      hdr.classList.remove("forge-two");
      const kids = Array.prototype.filter.call(hdr.children, (k) => k !== el);
      const wrapped = kids.length > 1 && kids.some((k) => k.offsetTop > kids[0].offsetTop + 30);
      const wide = window.innerWidth >= 820;
      hdr.classList.toggle("forge-two", wide && (window.innerWidth < 1280 || wrapped));
      const ar = el.getBoundingClientRect();
      const fits = wide && ar.width >= 96;
      setOk(fits);
      hdr.classList.toggle("forge-ok", fits);
    };
    measure();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    if (ro) { ro.observe(hdr); ro.observe(el); }
    window.addEventListener("resize", measure);
    return () => { ro && ro.disconnect(); window.removeEventListener("resize", measure); };
  }, []);

  // без анімації (Safari / reduced motion): лава вже «дійшла» — тепле світіння на логотипі без вспишки
  useEffect(() => {
    const hdr = box.current && box.current.closest("header");
    if (!hdr) return undefined;
    if (ok && !animated) hdr.classList.add("lava-still");
    return () => hdr.classList.remove("lava-still");
  }, [ok, animated]);

  // вступ: запускаємо, коли панель видима
  useEffect(() => {
    const a = vA.current;
    if (!a || !ok || !animated) return undefined;
    const p = a.play();
    if (p && p.catch) p.catch(() => {});
    return undefined;
  }, [ok, animated]);

  const onTime = () => {
    const a = vA.current;
    const hdr = box.current && box.current.closest("header");
    if (!a || !hdr || hit.current) return;
    if (a.currentTime >= hitTime(hdr, a) - 0.1) {
      hit.current = true;
      hdr.classList.add("lava-hit");
    }
  };

  const onEnded = () => {
    const b = vB.current;
    if (!b) return;
    b.currentTime = 0;
    const p = b.play();
    const go = () => setIdle(true);
    if (p && p.then) p.then(go).catch(go); else go();
  };

  // наведення: швидше й яскравіше
  useEffect(() => {
    const hdr = box.current && box.current.closest("header");
    if (hdr) hdr.classList.toggle("forge-on", on);
    if (vB.current) vB.current.playbackRate = on ? 1.35 : 1;
  }, [on, idle]);

  const touch = () => { setOn(true); clearTimeout(timer.current); timer.current = setTimeout(() => setOn(false), 5000); };

  return (
    <div
      ref={box}
      className="forge-art"
      data-ok={ok ? "1" : "0"}
      data-idle={idle ? "1" : "0"}
      onMouseEnter={() => !reduced && setOn(true)}
      onMouseLeave={() => setOn(false)}
      onTouchStart={() => !reduced && touch()}
      role="img"
      aria-label="Робітник з відбійним молотком і розплавлена лава"
    >
      <img className="forge-poster" src="/forge/strip.webp" alt="" draggable="false" style={{ opacity: started ? 0 : 1 }} />
      {animated && (
        <>
          <video ref={vB} className="forge-video forge-loop" data-on={idle ? "1" : "0"} muted loop playsInline preload="auto" aria-hidden="true">
            <source src="/forge/strip-loop.webm" type="video/webm" />
          </video>
          <video ref={vA} className="forge-video forge-intro" data-on={started && !idle ? "1" : "0"} muted playsInline preload="auto" aria-hidden="true"
            onPlaying={() => setStarted(true)} onTimeUpdate={onTime} onEnded={onEnded}>
            <source src="/forge/strip-intro.webm" type="video/webm" />
          </video>
        </>
      )}
    </div>
  );
}
