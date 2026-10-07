import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { LazyMotion, domAnimation, m, animate, useMotionValue, useSpring, useTransform, useReducedMotion } from "framer-motion";
import "./hero.css";
import { defaultHeroConfig } from "./hotspots.config.js";
import { prepareHotspots, hitTest, distToShapes } from "./geometry.js";
import { baseFocus, cameraTarget, unprojectPoint, worldSize } from "./camera.js";
import { EFFECTS } from "./effects.jsx";
import { AmbientDust } from "./Particles.jsx";
import { HotspotPanel, Markers } from "./HotspotPanel.jsx";

const STICKY = 46; // «липка» зона навколо активної деталі (px оригіналу): курсор не втрачає її від дрібного зсуву
const easeOut = [0.22, 0.8, 0.3, 1];
const PARALLAX = 8; // максимальний зсув у px

/**
 * ExcavatorHero — інтерактивний герой на основі одного 2D-зображення.
 *
 * props:
 *   config            { image, hotspots } — див. hotspots.config.js (за замовчуванням CAT M320)
 *   onSelectHotspot   (hotspot) => void — клік/кнопка в панелі; тут підключається каталог
 *   resolveHotspot    (hotspot) => hotspot — підмішати реальні дані (ціни, наявність) у панель
 *   effects           { key: Component } — власні ефекти поруч зі стандартними
 *   ctaLabel          текст кнопки в панелі
 *   sectionRef        ref на кореневий <section>
 *   children          вміст героя (заголовок, пошук, кнопки)
 */
export default function ExcavatorHero({ config = defaultHeroConfig, onSelectHotspot, resolveHotspot, effects, ctaLabel, sectionRef, className = "", id, children }) {
  const reduced = !!useReducedMotion();
  const IMG = config.image;
  const hotspots = useMemo(() => prepareHotspots(config.hotspots), [config.hotspots]);
  const byId = useMemo(() => Object.fromEntries(hotspots.map((h) => [h.id, h])), [hotspots]);
  const effectMap = useMemo(() => ({ ...EFFECTS, ...(effects || {}) }), [effects]);
  const usePlate = hotspots.some((h) => h.effectOptions && h.effectOptions.cutout);
  const imageSize = useMemo(() => ({ width: IMG.width, height: IMG.height }), [IMG.width, IMG.height]);

  const rootRef = useRef(null);
  const frameRef = useRef(null);
  const viewportRef = useRef(null);
  const setRoot = useCallback((node) => {
    rootRef.current = node;
    if (typeof sectionRef === "function") sectionRef(node);
    else if (sectionRef) sectionRef.current = node;
  }, [sectionRef]);

  const [size, setSize] = useState({ vw: 0, vh: 0 });
  const [bounds, setBounds] = useState({ minX: 0, maxX: 0 });
  const [activeId, setActiveIdState] = useState(null);
  const [img, setImg] = useState(null);
  const [canHover, setCanHover] = useState(true);
  const [interacted, setInteracted] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const activeRef = useRef(null);
  activeRef.current = activeId;
  const active = activeId ? byId[activeId] : null;

  // ───── вхідні дані пристрою ─────
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return undefined;
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setCanHover(mq.matches);
    update();
    mq.addEventListener ? mq.addEventListener("change", update) : mq.addListener && mq.addListener(update);
    return () => (mq.removeEventListener ? mq.removeEventListener("change", update) : mq.removeListener && mq.removeListener(update));
  }, []);

  // ───── зображення для спрайтів ─────
  useEffect(() => {
    if (typeof Image === "undefined") return undefined;
    let alive = true;
    const im = new Image();
    im.decoding = "async";
    im.onload = () => alive && setImg(im);
    im.src = IMG.src;
    return () => {
      alive = false;
      im.onload = null;
    };
  }, [IMG.src]);

  // ───── вимірювання сцени ─────
  useLayoutEffect(() => {
    const measure = () => {
      const v = viewportRef.current;
      if (!v) return;
      const vr = v.getBoundingClientRect();
      setSize((p) => (Math.abs(p.vw - vr.width) < 0.5 && Math.abs(p.vh - vr.height) < 0.5 ? p : { vw: vr.width, vh: vr.height }));
      const r = rootRef.current;
      const f = frameRef.current;
      if (r && f) {
        const rr = r.getBoundingClientRect();
        const fr = f.getBoundingClientRect();
        setBounds((p) => {
          const next = { minX: 12 - (fr.left - rr.left), maxX: rr.right - fr.left - 12 };
          return p.minX === next.minX && p.maxX === next.maxX ? p : next;
        });
      }
    };
    measure();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    if (ro) {
      viewportRef.current && ro.observe(viewportRef.current);
      rootRef.current && ro.observe(rootRef.current);
    }
    window.addEventListener("resize", measure);
    return () => {
      ro && ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  // Сцену показуємо, коли готовий оригінал: ковш — окремий шар, тож без нього на його місці була б «дірка»
  const ready = !usePlate || !!img;
  const world = useMemo(() => (size.vw && ready ? worldSize(size.vw, IMG) : null), [size.vw, ready, IMG]);
  const worldRef = useRef(null);
  worldRef.current = world;
  const baseCam = useMemo(() => (size.vw ? cameraTarget({ vw: size.vw, vh: size.vh, image: IMG, focus: baseFocus(IMG) }) : null), [size.vw, size.vh, IMG]);
  const baseCamRef = useRef(null);
  baseCamRef.current = baseCam;

  // ───── камера: пружини, «важкий» рух ─────
  const camX = useMotionValue(0);
  const camY = useMotionValue(0);
  const camS = useMotionValue(IMG.baseZoom ?? 1.06);
  const cam = useMemo(() => ({ x: camX, y: camY, s: camS }), [camX, camY, camS]);
  const camCtrls = useRef([]);
  const lastSize = useRef({ vw: 0, vh: 0 });

  useEffect(() => {
    if (!size.vw || !world) return;
    const focus = active ? active.camera : baseFocus(IMG);
    const t = cameraTarget({ vw: size.vw, vh: size.vh, image: IMG, focus });
    camCtrls.current.forEach((c) => c.stop());
    const first = lastSize.current.vw === 0;
    const resized = lastSize.current.vw !== size.vw || lastSize.current.vh !== size.vh;
    lastSize.current = { vw: size.vw, vh: size.vh };
    if (first || resized) {
      camX.set(t.x);
      camY.set(t.y);
      if (first && !reduced) {
        // кінематографічний вступ: кадр повільно «осідає» у базове положення
        camS.set(t.s * 1.09);
        camCtrls.current = [animate(camS, t.s, { duration: 2.2, ease: easeOut })];
      } else {
        camS.set(t.s);
      }
      return;
    }
    const cfg = reduced ? { duration: 0.4, ease: "easeOut" } : { type: "spring", stiffness: active ? 56 : 64, damping: active ? 20 : 22, mass: 1.25 };
    camCtrls.current = [animate(camX, t.x, cfg), animate(camY, t.y, cfg), animate(camS, t.s, cfg)];
    return () => camCtrls.current.forEach((c) => c.stop());
  }, [size.vw, size.vh, !!world, activeId, reduced, IMG, active, camX, camY, camS]);

  // ───── паралакс + ледь помітний дрейф ─────
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const sx = useSpring(rawX, { stiffness: 55, damping: 18, mass: 0.9 });
  const sy = useSpring(rawY, { stiffness: 55, damping: 18, mass: 0.9 });
  const idleX = useMotionValue(0);
  const idleY = useMotionValue(0);
  useEffect(() => {
    if (reduced) return undefined;
    const a = animate(idleX, [-4, 4], { duration: 17, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" });
    const b = animate(idleY, [-2.5, 2.5], { duration: 23, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" });
    return () => {
      a.stop();
      b.stop();
    };
  }, [reduced, idleX, idleY]);
  const parX = useTransform([sx, idleX], ([a, b]) => a + b);
  const parY = useTransform([sy, idleY], ([a, b]) => a + b);
  const par = useMemo(() => ({ x: parX, y: parY }), [parX, parY]);
  const tiltY = useTransform(sx, (v) => v * 0.11);
  const tiltX = useTransform(sy, (v) => -v * 0.09);
  const ambX = useTransform(sx, (v) => -v * 1.8);
  const ambY = useTransform(sy, (v) => -v * 1.2);

  const onHeroMove = (e) => {
    if (reduced || e.pointerType === "touch") return;
    const r = rootRef.current && rootRef.current.getBoundingClientRect();
    if (!r || !r.width) return;
    const k = activeRef.current ? 0.25 : 1;
    rawX.set(((e.clientX - r.left) / r.width * 2 - 1) * PARALLAX * k);
    rawY.set(((e.clientY - r.top) / r.height * 2 - 1) * PARALLAX * 0.7 * k);
  };

  // ───── прокрутка: сцена «відстає», текст трохи піднімається й гасне (через CSS-змінну, без React-рендерів) ─────
  useEffect(() => {
    if (reduced) return undefined;
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = rootRef.current;
      if (!r) return;
      const rect = r.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, -rect.top / Math.max(1, rect.height)));
      r.style.setProperty("--hx-scroll", p.toFixed(3));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [reduced]);

  // ───── вибір зони ─────
  const timers = useRef({ leave: null, enter: null, pending: null });
  const clearTimers = () => {
    clearTimeout(timers.current.leave);
    clearTimeout(timers.current.enter);
    timers.current.leave = null;
    timers.current.enter = null;
    timers.current.pending = null;
  };
  useEffect(() => clearTimers, []);

  const setActive = useCallback((next) => {
    setActiveIdState(next);
    if (next) setInteracted(true);
  }, []);

  const toLocal = (clientX, clientY) => {
    const r = viewportRef.current.getBoundingClientRect();
    return { x: clientX - r.left, y: clientY - r.top };
  };
  const imageAt = (lx, ly, c) => unprojectPoint(lx - parX.get(), ly - parY.get(), c, worldRef.current, IMG);
  const liveCam = () => ({ x: camX.get(), y: camY.get(), s: camS.get() });

  // Курсор → зона. «Липка» активна деталь + затримка входу/виходу: жодного мигання при зумі.
  const decide = (lx, ly) => {
    if (!worldRef.current || !baseCamRef.current) return;
    const live = imageAt(lx, ly, liveCam());
    const base = imageAt(lx, ly, baseCamRef.current);
    const curId = activeRef.current;
    const cur = curId ? byId[curId] : null;
    const t = timers.current;
    if (cur && (distToShapes(live.x, live.y, cur.shapes) <= STICKY || distToShapes(base.x, base.y, cur.shapes) <= STICKY)) {
      clearTimeout(t.leave);
      clearTimeout(t.enter);
      t.leave = null;
      t.pending = null;
      return;
    }
    const hit = hitTest(live.x, live.y, hotspots, 5);
    if (hit && hit.id !== curId) {
      clearTimeout(t.leave);
      t.leave = null;
      if (t.pending !== hit.id) {
        clearTimeout(t.enter);
        t.pending = hit.id;
        t.enter = setTimeout(() => {
          t.pending = null;
          setActive(hit.id);
        }, curId ? 170 : 70);
      }
      return;
    }
    if (!hit) {
      clearTimeout(t.enter);
      t.pending = null;
      if (curId && !t.leave) {
        t.leave = setTimeout(() => {
          t.leave = null;
          setActive(null);
        }, 280);
      }
    }
  };

  const raf = useRef(0);
  const lastMove = useRef(null);
  const onMove = (e) => {
    if (e.pointerType === "touch" || e.pointerType === "pen") return;
    lastMove.current = { cx: e.clientX, cy: e.clientY };
    if (raf.current) return;
    raf.current = requestAnimationFrame(() => {
      raf.current = 0;
      const p = lastMove.current;
      if (!p || !viewportRef.current) return;
      const { x, y } = toLocal(p.cx, p.cy);
      decide(x, y);
    });
  };
  const onLeave = (e) => {
    if (e.pointerType === "touch") return;
    clearTimeout(timers.current.enter);
    timers.current.pending = null;
    if (activeRef.current && !timers.current.leave) {
      timers.current.leave = setTimeout(() => {
        timers.current.leave = null;
        setActive(null);
      }, 280);
    }
    rawX.set(0);
    rawY.set(0);
  };

  // Дотик: тап по деталі — відкрити, повторний тап чи тап повз — закрити
  const tap = useRef(null);
  const onDown = (e) => {
    if (e.pointerType === "mouse" || !e.pointerType) return;
    tap.current = { x: e.clientX, y: e.clientY, t: Date.now() };
  };
  const onUp = (e) => {
    const s = tap.current;
    tap.current = null;
    if (!s || e.pointerType === "mouse" || !e.pointerType) return;
    if (Math.hypot(e.clientX - s.x, e.clientY - s.y) > 12 || Date.now() - s.t > 600) return; // це був скрол
    if (!worldRef.current) return;
    const { x, y } = toLocal(e.clientX, e.clientY);
    const hit = hitTest(imageAt(x, y, liveCam()).x, imageAt(x, y, liveCam()).y, hotspots, 14);
    clearTimers();
    setInteracted(true);
    setActive(hit && hit.id !== activeRef.current ? hit.id : null);
  };
  const onClick = (e) => {
    if (e.detail === 0 && !activeRef.current) return;
    const pt = e.pointerType;
    if (pt && pt !== "mouse") return;
    const cur = activeRef.current && byId[activeRef.current];
    if (cur && onSelectHotspot && cur.catalog) onSelectHotspot(resolved(cur));
  };

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setActive(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setActive]);

  // маркери: на дотик одразу, на десктопі — після паузи без взаємодії
  useEffect(() => {
    if (interacted) {
      setShowHints(false);
      return undefined;
    }
    const t = setTimeout(() => setShowHints(true), canHover ? 4500 : 600);
    return () => clearTimeout(t);
  }, [interacted, canHover]);

  const resolved = useCallback((h) => (resolveHotspot ? { ...h, ...resolveHotspot(h) } : h), [resolveHotspot]);
  const panelHotspot = active ? resolved(active) : null;
  const compact = !canHover; // на дотик підказка «прилипає» до низу кадру

  const aspect = IMG.window.w / IMG.window.h;
  const sunStyle = { left: `${(IMG.sun.x / IMG.width) * 100}%`, top: `${(IMG.sun.y / IMG.height) * 100}%` };

  return (
    <LazyMotion features={domAnimation} strict={false}>
      <section
        id={id}
        ref={setRoot}
        className={`hx-hero ${className}`}
        data-active={activeId || undefined}
        style={{ "--hx-aspect": aspect }}
        onPointerMove={onHeroMove}
      >
        <m.div className="hx-ambient" aria-hidden="true" style={{ backgroundImage: `url(${IMG.ambient})`, x: ambX, y: ambY }} />
        <div className="hx-shade" aria-hidden="true" />

        <div className="hx-layout">
          <div className="hx-content">{children}</div>

          <div ref={frameRef} className="hx-stage-frame">
            <div
              ref={viewportRef}
              className="hx-viewport"
              role="group"
              aria-label="Інтерактивний екскаватор CAT. Наведіть або торкніться деталі, щоб розглянути її"
              onPointerMove={onMove}
              onPointerLeave={onLeave}
              onPointerDown={onDown}
              onPointerUp={onUp}
              onClick={onClick}
              style={{ cursor: active && onSelectHotspot ? "pointer" : "default" }}
            >
              <m.div className="hx-parallax" style={{ x: parX, y: parY, rotateX: tiltX, rotateY: tiltY }}>
                {world && (
                  <m.div
                    className="hx-world"
                    style={{ width: world.worldW, height: world.worldH, x: camX, y: camY, scale: camS, originX: 0, originY: 0 }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1.1, ease: easeOut }}
                  >
                    <img className="hx-plate" src={usePlate ? IMG.plate : IMG.src} alt={IMG.alt} width={IMG.width} height={IMG.height} decoding="async" fetchpriority="high" draggable={false} />
                    <span className="hx-sun" style={sunStyle} aria-hidden="true" />
                    <m.div className="hx-layer hx-dim" initial={false} animate={{ opacity: active ? active.highlight?.dim ?? 0.5 : 0 }} transition={{ duration: 0.6, ease: easeOut }} />
                    {hotspots.map((h) => {
                      const Effect = effectMap[h.effect] || effectMap.basic;
                      return <Effect key={h.id} ctx={{ hotspot: h, active: activeId === h.id, image: img, imageSize, size: world, reduced }} />;
                    })}
                  </m.div>
                )}
              </m.div>
              {!reduced && <AmbientDust count={16} />}
              <div className="hx-lightsweep" aria-hidden="true" />
              <div className="hx-vignette" aria-hidden="true" />
              <div className="hx-grain" aria-hidden="true" />
            </div>

            {world && (
              <div className="hx-overlay">
                <Markers hotspots={hotspots} visible={showHints && !activeId} cam={cam} par={par} world={world} imageSize={imageSize} />
                <HotspotPanel
                  hotspot={panelHotspot}
                  compact={compact}
                  cam={cam}
                  par={par}
                  world={world}
                  imageSize={imageSize}
                  bounds={bounds}
                  vh={size.vh}
                  ctaLabel={ctaLabel}
                  onSelect={onSelectHotspot}
                  onClose={() => setActive(null)}
                />
              </div>
            )}

            {/* Клавіатура / скрінрідер: кожна деталь — окрема кнопка */}
            <ul className="hx-sr" aria-label="Деталі екскаватора">
              {hotspots.map((h) => (
                <li key={h.id}>
                  <button
                    type="button"
                    onFocus={() => setActive(h.id)}
                    onBlur={() => activeRef.current === h.id && setActive(null)}
                    onClick={() => onSelectHotspot && h.catalog && onSelectHotspot(resolved(h))}
                    aria-label={`${h.label}: ${h.description}`}
                  >
                    {h.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </LazyMotion>
  );
}
