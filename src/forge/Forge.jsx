import { useEffect, useMemo, useRef, useState } from "react";
import "./forge.css";

// «Кузня» у шапці: робітник з перфоратором + тріщини з лавою на всю ширину панелі.
// Спокій: нерухомий кадр і тріщини тихо дихають. Наведення: ролик «б'є», тріщини розповзаються до країв.

const TIP = { x: 0.28, y: 0.895 }; // де наконечник перфоратора на кадрі (частки ширини/висоти)
const WEBM_OK = typeof navigator !== "undefined" && !/^((?!chrome|android|crios|fxios|edg).)*safari/i.test(navigator.userAgent);
const reducedMotion = () => typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

// Ламані тріщини від точки (ox, oy) в обидва боки до країв панелі
export function buildCracks(width, height, ox, oy, seed = 7) {
  const r = rng(seed);
  const yMin = height - 30, yMax = height - 3;
  const clampY = (y) => Math.max(yMin, Math.min(yMax, y));
  const paths = [];
  const maxDist = Math.max(ox, width - ox, 1);
  const walk = (dir) => {
    let x = ox, y = oy;
    const pts = [[x, y]];
    const branchAt = [];
    while (dir > 0 ? x < width + 20 : x > -20) {
      x += dir * (10 + r() * 26);
      y = clampY(y + (r() - 0.5) * 9);
      pts.push([x, y]);
      if (r() < 0.2) branchAt.push([x, y]);
    }
    paths.push({ d: "M" + pts.map((p) => p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" L"), at: 0, main: true });
    branchAt.forEach(([bx, by]) => {
      const up = r() < 0.5;
      const len = 18 + r() * 44;
      const n = 2 + Math.floor(r() * 3);
      let px = bx, py = by;
      const bp = [[px, py]];
      for (let i = 0; i < n; i++) {
        px += dir * (len / n) * (0.6 + r() * 0.8);
        py = clampY(py + (up ? -1 : 1) * (3 + r() * 6));
        bp.push([px, py]);
      }
      paths.push({ d: "M" + bp.map((p) => p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" L"), at: Math.abs(bx - ox) / maxDist, main: false });
    });
  };
  walk(-1);
  walk(1);
  return paths;
}

export default function HeaderForge() {
  const box = useRef(null);
  const vid = useRef(null);
  const [on, setOn] = useState(false);
  const [geo, setGeo] = useState(null); // { w, h, ox, oy }
  const [ok, setOk] = useState(false); // достатньо місця для робітника
  const reduced = useMemo(() => reducedMotion(), []);
  const timer = useRef(0);

  // розміри панелі та позиція наконечника
  useEffect(() => {
    const el = box.current;
    const hdr = el && el.closest("header");
    if (!hdr) return undefined;
    const measure = () => {
      const img = el.querySelector("img");
      if (!img) return;
      const hr = hdr.getBoundingClientRect();
      const ir = img.getBoundingClientRect();
      // шапка перенеслась на два рядки? тоді робітник стає поверх шапки (absolute) з правого боку
      const kids = Array.prototype.filter.call(hdr.children, (k) => k !== el && !(k.classList && k.classList.contains("forge-cracks")));
      const wrapped = kids.length > 1 && kids.some((k) => k.offsetTop > kids[0].offsetTop + 30);
      el.dataset.mode = wrapped ? "abs" : "flow";
      const ar = el.getBoundingClientRect();
      const fits = window.innerWidth >= 820 && (wrapped || ar.width >= 96);
      setOk(fits);
      hdr.classList.toggle("forge-ok", fits);
      if (!ir.width) return;
      setGeo({ w: hr.width, h: hr.height, ox: ir.left - hr.left + ir.width * TIP.x, oy: ir.top - hr.top + ir.height * TIP.y });
    };
    measure();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    if (ro) { ro.observe(hdr); ro.observe(el); }
    window.addEventListener("resize", measure);
    const img = el.querySelector("img");
    if (img && !img.complete) img.addEventListener("load", measure, { once: true });
    return () => { ro && ro.disconnect(); window.removeEventListener("resize", measure); };
  }, []);

  // відео: грає лише під час наведення
  useEffect(() => {
    const v = vid.current;
    if (!v) return undefined;
    if (on) {
      clearTimeout(timer.current);
      const p = v.play();
      if (p && p.catch) p.catch(() => {});
    } else {
      timer.current = setTimeout(() => { try { v.pause(); v.currentTime = 0; } catch (e) { /* ignore */ } }, 380);
    }
    return () => clearTimeout(timer.current);
  }, [on]);

  // шапка «підсвічується» теж: клас на header для тріщин на всю ширину
  useEffect(() => {
    const hdr = box.current && box.current.closest("header");
    if (hdr) hdr.classList.toggle("forge-on", on);
  }, [on]);

  const cracks = useMemo(() => (geo ? buildCracks(geo.w, geo.h, geo.ox, geo.oy) : []), [geo && Math.round(geo.w), geo && Math.round(geo.h), geo && Math.round(geo.ox), geo && Math.round(geo.oy)]);

  const touch = () => { setOn(true); clearTimeout(touch.t); touch.t = setTimeout(() => setOn(false), 5000); };

  return (
    <>
      {geo && ok && (
        <svg className="forge-cracks" width={geo.w} height={geo.h} viewBox={`0 0 ${geo.w} ${geo.h}`} aria-hidden="true" data-on={on ? "1" : "0"}>
          <defs>
            <radialGradient id="forgeGlow" gradientUnits="userSpaceOnUse" cx={geo.ox} cy={geo.h} r={Math.max(geo.ox, geo.w - geo.ox)}>
              <stop offset="0" stopColor="#FF6A1A" stopOpacity="0.55" />
              <stop offset="0.35" stopColor="#FF6A1A" stopOpacity="0.2" />
              <stop offset="1" stopColor="#FF6A1A" stopOpacity="0.05" />
            </radialGradient>
            <linearGradient id="forgeFadeV" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#000" /><stop offset="0.7" stopColor="#fff" /><stop offset="1" stopColor="#fff" /></linearGradient>
            <mask id="forgeFloorMask" maskUnits="userSpaceOnUse" x="0" y={geo.h - 46} width={geo.w} height="46"><rect x="0" y={geo.h - 46} width={geo.w} height="46" fill="url(#forgeFadeV)" /></mask>
            <filter id="forgeBlur" x="-5%" y="-100%" width="110%" height="300%"><feGaussianBlur stdDeviation="3.2" /></filter>
          </defs>
          <rect className="forge-floor" x="0" y={geo.h - 46} width={geo.w} height="46" fill="url(#forgeGlow)" mask="url(#forgeFloorMask)" />
          <g className="forge-pulse">
            <g filter="url(#forgeBlur)" stroke="#FF6A1A" strokeWidth="5" fill="none" strokeLinejoin="round" strokeLinecap="round">
              {cracks.map((c, i) => <path key={"g" + i} className="forge-line" d={c.d} pathLength="1" style={{ transitionDelay: `${Math.round(c.at * 650)}ms` }} />)}
            </g>
            <g stroke="#FFB81C" strokeWidth={1.3} fill="none" strokeLinejoin="round" strokeLinecap="round">
              {cracks.map((c, i) => <path key={"c" + i} className="forge-line" d={c.d} pathLength="1" style={{ transitionDelay: `${Math.round(c.at * 650)}ms`, strokeWidth: c.main ? 1.4 : 0.9 }} />)}
            </g>
            <g stroke="#FFF1CC" strokeWidth="0.55" fill="none" opacity="0.85" strokeLinecap="round">
              {cracks.filter((c) => c.main).map((c, i) => <path key={"h" + i} className="forge-line" d={c.d} pathLength="1" style={{ transitionDelay: `${Math.round(c.at * 650)}ms` }} />)}
            </g>
          </g>
        </svg>
      )}

      <div
        ref={box}
        className="forge-art"
        data-ok={ok ? "1" : "0"}
        onMouseEnter={() => !reduced && setOn(true)}
        onMouseLeave={() => setOn(false)}
        onTouchStart={() => !reduced && touch()}
        role="img"
        aria-label="Робітник з відбійним молотком"
      >
        <img src="/forge/worker.png" alt="" draggable="false" />
        {WEBM_OK && !reduced && (
          <video ref={vid} className="forge-video" data-on={on ? "1" : "0"} muted loop playsInline preload="auto" aria-hidden="true">
            <source src="/forge/worker.webm" type="video/webm" />
          </video>
        )}
      </div>
    </>
  );
}
