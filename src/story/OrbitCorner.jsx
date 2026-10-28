import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

// Кутове відео для телефона: екскаватор «обертається» (камера обходить машину туди-назад), стрілки показують ківш, стрілу й кабіну.
// Кадри клипу: 0…HALF — вперед, HALF…2·HALF — назад (пінг-понг). KF: [час, ківш x,y, стріла x,y, кабіна x,y] у % кадру — точки стеження для стрілок.
const HALF = 6.208;
const FRAMES = 99; // public/story/orbit/f001.webp … f099.webp — кадри «обходу» машини (вперед); прокрутка = перемотка між ними
const frameUrl = (i) => `/story/orbit/f${String(i + 1).padStart(3, "0")}.webp`;
const KF = [
  [0, 65.0, 33.0, 50.0, 25.0, 51.5, 48.0],
  [1, 60.5, 31.0, 48.5, 24.0, 53.0, 48.0],
  [2, 47.0, 29.0, 47.0, 10.0, 54.5, 47.0],
  [3, 29.0, 29.0, 42.5, 25.0, 58.3, 46.0],
  [4, 20.0, 34.0, 39.5, 16.0, 59.7, 48.0],
  [5, 24.5, 40.0, 42.5, 22.0, 57.5, 45.0],
  [HALF, 35.0, 44.0, 44.0, 27.0, 44.0, 43.0],
];
// кут підпису (у % кадру), куди тягнеться стрілка
const PARTS = [
  { id: "bucket", label: "Ківш", chip: { left: "4%", bottom: "6%" }, anchor: [14, 90] },
  { id: "boom", label: "Стріла", chip: { right: "4%", top: "6%" }, anchor: [86, 10] },
  { id: "cab", label: "Кабіна", chip: { right: "4%", bottom: "6%" }, anchor: [86, 90] },
];

function at(t) {
  const x = Math.min(Math.max(t, 0), HALF);
  for (let i = 0; i < KF.length - 1; i++) {
    const a = KF[i], b = KF[i + 1];
    if (x >= a[0] && x <= b[0]) { const u = (x - a[0]) / (b[0] - a[0]); return [1, 2, 3, 4, 5, 6].map((k) => a[k] + (b[k] - a[k]) * u); }
  }
  return KF[KF.length - 1].slice(1);
}

export default function OrbitCorner({ cardsRef, reduced }) {
  const vid = useRef(null);
  const canvasRef = useRef(null);
  const imgs = useRef([]);
  const [fb, setFb] = useState(false); // кадри не завантажились → запасний варіант: відео, що крутиться само
  const lines = useRef([]);
  const dots = useRef([]);
  const [active, setActive] = useState("bucket");
  const [show, setShow] = useState(false);

  // видно, поки на екрані хоч одна картка етапу; активна — та, що біля центру екрана
  useEffect(() => {
    const cards = cardsRef.current ? Array.from(cardsRef.current.querySelectorAll(".sm-card[data-stage]")) : [];
    if (!cards.length || typeof IntersectionObserver === "undefined") { setShow(true); return undefined; }
    const vis = new Set();
    const ioShow = new IntersectionObserver((es) => {
      es.forEach((e) => (e.isIntersecting ? vis.add(e.target) : vis.delete(e.target)));
      setShow(vis.size > 0);
    }, { rootMargin: "-20% 0px -22% 0px", threshold: 0.02 });
    const ioAct = new IntersectionObserver((es) => {
      es.forEach((e) => { if (e.isIntersecting) setActive(e.target.getAttribute("data-stage")); });
    }, { rootMargin: "-42% 0px -42% 0px" });
    cards.forEach((c) => { ioShow.observe(c); ioAct.observe(c); });
    return () => { ioShow.disconnect(); ioAct.disconnect(); };
  }, [cardsRef]);

  // кадри обертання: час «камери» t=0…HALF береться з прокрутки сторінки (скрол вниз — обходимо машину, вгору — назад)
  useEffect(() => {
    if (reduced || fb) return undefined;
    let dead = false;
    const arr = imgs.current;
    let loadedFirst = false;
    const load = (i) => {
      if (arr[i]) return;
      const im = new Image();
      im.decoding = "async";
      im.onload = () => { if (i === 0) loadedFirst = true; };
      im.onerror = () => { if (i === 0 && !dead) setFb(true); };
      im.src = frameUrl(i);
      arr[i] = im;
    };
    load(0);
    // решту кадрів вантажимо, коли віджет уперше стає видимим (не вантажимо вісімдесят кадрів даремно)
    let rest = false;
    const loadRest = () => { if (rest) return; rest = true; for (let i = 1; i < FRAMES; i++) load(i); };
    const place = (t) => {
      const p = at(t);
      PARTS.forEach((part, i) => {
        const x = p[i * 2], y = p[i * 2 + 1] * 0.75;
        const ln = lines.current[i], dt = dots.current[i];
        if (ln) { ln.setAttribute("x1", part.anchor[0]); ln.setAttribute("y1", part.anchor[1] * 0.75); ln.setAttribute("x2", x); ln.setAttribute("y2", y); }
        if (dt) { dt.setAttribute("cx", x); dt.setAttribute("cy", y); }
      });
    };
    place(3.6);
    let cur = -1, target = 0, raf = 0, drawn = -2;
    const progress = () => {
      const el = cardsRef.current;
      if (!el) return 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight || 800;
      const span = Math.max(1, r.height - vh * 0.4);
      return Math.min(1, Math.max(0, (vh * 0.3 - r.top) / span));
    };
    const draw = (idx) => {
      const cv = canvasRef.current;
      if (!cv) return;
      // ближній завантажений кадр (якщо потрібний ще не прийшов)
      let k = idx;
      for (let d = 0; d < FRAMES; d++) {
        const a = arr[idx - d], b = arr[idx + d];
        if (a && a.complete && a.naturalWidth) { k = idx - d; break; }
        if (b && b.complete && b.naturalWidth) { k = idx + d; break; }
      }
      const im = arr[k];
      if (!im || !im.complete || !im.naturalWidth || k === drawn) return;
      const ctx = cv.getContext("2d");
      if (ctx) { ctx.drawImage(im, 0, 0, cv.width, cv.height); drawn = k; }
    };
    const tick = () => {
      if (dead) return;
      raf = requestAnimationFrame(tick);
      if (!show) return;
      loadRest();
      target = progress() * (FRAMES - 1);
      cur = cur < 0 ? target : cur + (target - cur) * 0.22;
      if (Math.abs(target - cur) < 0.02) cur = target;
      const idx = Math.round(cur);
      draw(idx);
      place((cur / (FRAMES - 1)) * HALF);
    };
    raf = requestAnimationFrame(tick);
    return () => { dead = true; cancelAnimationFrame(raf); };
  }, [reduced, fb, show, cardsRef]);

  // запасний варіант (кадри не завантажились): кут крутиться сам, стрілки йдуть за відео
  useEffect(() => {
    if (reduced || !fb) return undefined;
    let raf = 0, dead = false;
    const place = (t) => {
      const p = at(t);
      PARTS.forEach((part, i) => {
        const x = p[i * 2], y = p[i * 2 + 1] * 0.75;
        const ln = lines.current[i], dt = dots.current[i];
        if (ln) { ln.setAttribute("x1", part.anchor[0]); ln.setAttribute("y1", part.anchor[1] * 0.75); ln.setAttribute("x2", x); ln.setAttribute("y2", y); }
        if (dt) { dt.setAttribute("cx", x); dt.setAttribute("cy", y); }
      });
    };
    const tick = () => {
      if (dead) return;
      const v = vid.current;
      if (v && !v.paused) { const ct = v.currentTime % (HALF * 2); place(ct <= HALF ? ct : HALF * 2 - ct); }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { dead = true; cancelAnimationFrame(raf); };
  }, [reduced, fb]);

  // не крутимо відео, коли воно не на екрані (економія батареї)
  useEffect(() => {
    const v = vid.current;
    if (!v || reduced || !fb) return;
    if (show) { const p = v.play(); if (p && p.catch) p.catch(() => {}); } else v.pause();
  }, [show, reduced, fb]);

  const go = (id) => {
    const el = cardsRef.current && cardsRef.current.querySelector(`.sm-card[data-stage="${id}"]`);
    if (el) el.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });
  };

  if (typeof document === "undefined") return null;
  return createPortal(
    <div className="oc" data-show={show ? "1" : "0"} aria-hidden={show ? undefined : "true"}>
      <div className="oc-frame">
        {reduced ? (
          <img className="oc-media" src="/story/orbit-poster.jpg" alt="" />
        ) : fb ? (
          <video ref={vid} className="oc-media" poster="/story/orbit-poster.jpg" muted loop playsInline preload="metadata" aria-hidden="true">
            <source src="/story/orbit.mp4" type='video/mp4; codecs="avc1.64001F"' />
            <source src="/story/orbit.webm" type="video/webm" />
          </video>
        ) : (
          <>
            <img className="oc-media" src="/story/orbit-poster.jpg" alt="" />
            <canvas ref={canvasRef} className="oc-media" width="384" height="288" aria-hidden="true" />
          </>
        )}
        <svg className="oc-svg" viewBox="0 0 100 75" aria-hidden="true">
          {PARTS.map((p, i) => (
            <g key={p.id} className="oc-part" data-on={active === p.id ? "1" : "0"}>
              <line ref={(el) => (lines.current[i] = el)} />
              <circle ref={(el) => (dots.current[i] = el)} r="2.4" />
            </g>
          ))}
        </svg>
        {PARTS.map((p) => (
          <button key={p.id} type="button" className="oc-chip" data-on={active === p.id ? "1" : "0"} style={p.chip} onClick={() => go(p.id)}>{p.label}</button>
        ))}
      </div>
    </div>,
    document.body
  );
}
