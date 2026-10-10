import { useEffect, useMemo, useRef, useState } from "react";
import "./forge.css";

// Рабочий с кувалдой у шапки. Покой: нерухомий кадр. Наведення на робітника: б'є кувалдою (відео, цикл).
// Плита під ним тягнеться вліво до логотипу.

const WEBM_OK = typeof navigator !== "undefined" && !/^((?!chrome|android|crios|fxios|edg).)*safari/i.test(navigator.userAgent);
const reducedMotion = () => typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const LOOP_LEN = 78 / 24;   // тривалість циклу, с
const FADE_FROM = LOOP_LEN - 0.4; // кінець циклу: поза = «кувалда піднята», та сама, що в спокої — можна непомітно переходити в спокій

export default function HeaderForge() {
  const box = useRef(null);
  const vid = useRef(null);
  const idleV = useRef(null);
  const [live, setLive] = useState(false); // спокійне відео пішло — постер не потрібен
  const [ok, setOk] = useState(false);
  const [active, setActive] = useState(false);
  const hovering = useRef(false);
  const raf = useRef(0);
  const touchT = useRef(0);
  const reduced = useMemo(() => reducedMotion(), []);
  const animated = WEBM_OK && !reduced;

  // чи вміщається; вузькі екрани (~1100 px) і перенос шапки → два ряди (кузня в першому)
  useEffect(() => {
    const el = box.current;
    const hdr = el && el.closest("header");
    if (!hdr) return undefined;
    const measure = () => {
      // 1) звичайна шапка; 2) якщо тісно — ховаємо слоган і «Як це працює» (forge-compact);
      // 3) якщо й так тісно (вузько/залогінений профіль) — два ряди (forge-two)
      hdr.classList.remove("forge-two", "forge-compact");
      const kids = Array.prototype.filter.call(hdr.children, (k) => k !== el);
      const isWrapped = () => kids.length > 1 && kids.some((k) => k.offsetTop > kids[0].offsetTop + 30);
      const slotW = () => el.getBoundingClientRect().width;
      const wide = window.innerWidth >= 820;
      if (wide && (isWrapped() || slotW() < 150)) {
        hdr.classList.add("forge-compact");
        if (isWrapped() || slotW() < 96) {
          hdr.classList.remove("forge-compact");
          hdr.classList.add("forge-two");
        }
      }
      const fits = wide && slotW() >= 96 || (wide && hdr.classList.contains("forge-two"));
      setOk(fits);
      hdr.classList.toggle("forge-ok", fits);
    };
    measure();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    if (ro) { ro.observe(hdr); ro.observe(el); }
    window.addEventListener("resize", measure);
    return () => { ro && ro.disconnect(); window.removeEventListener("resize", measure); cancelAnimationFrame(raf.current); };
  }, []);

  // спокій: ледь помітний рух (те саме відео, поза та сама, що на початку/кінці удару) — без жодних стрибків
  useEffect(() => {
    const v = idleV.current;
    if (!v || !ok || !animated) return undefined;
    v.playbackRate = 0.5;
    const p = v.play();
    if (p && p.catch) p.catch(() => {});
    return undefined;
  }, [ok, animated]);

  const start = () => {
    const v = vid.current;
    if (!v || !animated) return;
    cancelAnimationFrame(raf.current);
    if (!active) { v.currentTime = 0; }
    const p = v.play();
    if (p && p.catch) p.catch(() => {});
    setActive(true);
  };

  // відпустили: дочекаємось спокійної пози й плавно повернемось до стоп-кадру
  const stop = () => {
    const v = vid.current;
    if (!v) return;
    cancelAnimationFrame(raf.current);
    const t0 = performance.now();
    const tick = () => {
      if (hovering.current) return;
      if (v.currentTime >= FADE_FROM || performance.now() - t0 > 4200) {
        setActive(false);
        setTimeout(() => { if (!hovering.current && vid.current) { vid.current.pause(); vid.current.currentTime = 0; } }, 700);
        return;
      }
      raf.current = requestAnimationFrame(tick);
    };
    tick();
  };

  const enter = () => { hovering.current = true; start(); };
  const leave = () => { hovering.current = false; stop(); };
  const touch = () => {
    hovering.current = true; start();
    clearTimeout(touchT.current);
    touchT.current = setTimeout(() => { hovering.current = false; stop(); }, 4500);
  };

  return (
    <div ref={box} className="forge-art" data-ok={ok ? "1" : "0"} data-active={active ? "1" : "0"} role="img" aria-label="Робітник з кувалдою на плиті">
      <div className="fw-strip">
        <img className="fw-still" src="/forge/strip-still.webp" alt="" draggable="false" style={{ opacity: live ? 0 : 1 }} />
        {animated && (
          <>
            <video ref={idleV} className="fw-idle" muted loop playsInline preload="auto" aria-hidden="true" onPlaying={() => setLive(true)}>
              <source src="/forge/strip-idle.webm" type="video/webm" />
            </video>
            <video ref={vid} className="fw-video" muted loop playsInline preload="auto" aria-hidden="true">
              <source src="/forge/strip-hit.webm" type="video/webm" />
            </video>
          </>
        )}
        <img className="fw-slab" src="/forge/strip-slab.webp" alt="" draggable="false" />
        <div className="fw-hit" onMouseEnter={enter} onMouseLeave={leave} onTouchStart={touch} />
      </div>
    </div>
  );
}
