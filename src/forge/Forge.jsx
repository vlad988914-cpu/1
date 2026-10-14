import { useEffect, useMemo, useRef, useState } from "react";
import "./forge.css";
import { WEBM_ALPHA_OK } from "../env.js";

// Рабочий с кувалдой у шапки. Покой: нерухомий кадр. Наведення на робітника: б'є кувалдою (відео, цикл).
// Плита під ним тягнеться вліво до логотипу.

const WEBM_OK = WEBM_ALPHA_OK;
const reducedMotion = () => typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const LOOP_LEN = 78 / 24;   // тривалість циклу, с
const FADE_FROM = LOOP_LEN - 0.4; // кінець циклу: поза = «кувалда піднята», та сама, що в спокої — можна непомітно переходити в спокій


// Safari / iPhone не вміє прозоре відео: граємо mp4 на чорному тлі (невидиме) і «вирізаємо» чорне на canvas
// (та сама формула, що й для WebM: alpha = max(rgb)/0.16, колір без премультиплікації).
function KeyedVideo({ vref, className, src, onPlaying }) {
  const cv = useRef(null);
  useEffect(() => {
    const v = vref.current, c = cv.current;
    if (!v || !c) return undefined;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    let raf = 0, last = -1, dead = false;
    const draw = () => {
      if (dead) return;
      if (v.readyState >= 2 && v.videoWidth && v.currentTime !== last && !document.hidden) {
        last = v.currentTime;
        if (c.width !== v.videoWidth) { c.width = v.videoWidth; c.height = v.videoHeight; }
        ctx.drawImage(v, 0, 0);
        const im = ctx.getImageData(0, 0, c.width, c.height), d = im.data;
        for (let i = 0; i < d.length; i += 4) {
          const r = d[i], g = d[i + 1], b = d[i + 2];
          const m = r > g ? (r > b ? r : b) : (g > b ? g : b);
          if (m >= 41) { d[i + 3] = 255; }
          else if (m < 6) { d[i + 3] = 0; }
          else { const k = 41 / m; d[i + 3] = m * 6.2195; d[i] = r * k; d[i + 1] = g * k; d[i + 2] = b * k; }
        }
        ctx.putImageData(im, 0, 0);
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => { dead = true; cancelAnimationFrame(raf); };
  }, [vref]);
  return (
    <>
      <video ref={vref} className="fw-vsrc" muted loop playsInline preload="auto" aria-hidden="true" onPlaying={onPlaying}>
        <source src={src} type="video/mp4" />
      </video>
      <canvas ref={cv} className={className} aria-hidden="true" />
    </>
  );
}

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
  const animated = !reduced; // Chrome/Firefox/Edge: WebM з альфою; Safari/iPhone: mp4 + mix-blend-mode: screen (чорний фон «гаситься»)

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
      const mobile = window.innerWidth < 820;
      setOk(fits || mobile);
      hdr.classList.toggle("forge-ok", fits);
      hdr.classList.toggle("forge-mobile", mobile);
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
        {animated && WEBM_OK && (
          <>
            <video ref={idleV} className="fw-idle" muted loop playsInline preload="auto" aria-hidden="true" onPlaying={() => setLive(true)}>
              <source src="/forge/strip-idle.webm" type="video/webm" />
            </video>
            <video ref={vid} className="fw-video" muted loop playsInline preload="auto" aria-hidden="true">
              <source src="/forge/strip-hit.webm" type="video/webm" />
            </video>
          </>
        )}
        {animated && !WEBM_OK && (
          <>
            <KeyedVideo vref={idleV} className="fw-idle" src="/forge/strip-idle.mp4" onPlaying={() => setLive(true)} />
            <KeyedVideo vref={vid} className="fw-video" src="/forge/strip-hit.mp4" />
          </>
        )}
        <img className="fw-slab" src="/forge/strip-slab.webp" alt="" draggable="false" />
        <div className="fw-hit" onMouseEnter={enter} onMouseLeave={leave} onTouchStart={touch} />
      </div>
    </div>
  );
}
