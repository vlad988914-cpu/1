import React, { useEffect, useMemo, useState } from "react";
import { m, animate, useMotionValue, useTransform } from "framer-motion";
import { SpriteBox } from "./Sprite.jsx";
import { DustBurst } from "./Particles.jsx";
import { shapesBBox, inflateBBox, clipPolygon } from "./geometry.js";

/**
 * Ефекти зон. Кожен ефект отримує ctx:
 *   { hotspot, active, image, imageSize, size:{worldW,worldH}, reduced }
 * і малює шари всередині «світу» (координати у відсотках від зображення).
 * Власні ефекти додаються через проп `effects` компонента ExcavatorHero: { myKey: MyEffect }.
 */

const lit = (h, extra = "") => `brightness(${h.highlight?.brightness ?? 1.2}) saturate(1.08) contrast(1.03) ${extra}`.trim();

// Дає елементу час «догаснути» перед демонтажем
function useDelayedMount(active, ms = 800) {
  const [mounted, setMounted] = useState(active);
  useEffect(() => {
    if (active) {
      setMounted(true);
      return undefined;
    }
    const t = setTimeout(() => setMounted(false), ms);
    return () => clearTimeout(t);
  }, [active, ms]);
  return mounted || active;
}

const easeOut = [0.22, 0.8, 0.3, 1];

/** Підсвітка: яскравіша копія контуру зони поверх затемненої основи. */
export function Highlight({ ctx, shapes, filter, className = "" }) {
  const { active, image, imageSize, hotspot } = ctx;
  const mounted = useDelayedMount(active);
  if (!mounted) return null;
  return (
    <m.div className={`hx-layer hx-hl ${className}`} initial={{ opacity: 0 }} animate={{ opacity: active ? 1 : 0 }} transition={{ duration: active ? 0.55 : 0.45, ease: easeOut }}>
      <SpriteBox image={image} imageSize={imageSize} shapes={shapes || hotspot.shapes} style={{ filter: filter || lit(hotspot) }} />
    </m.div>
  );
}

/** Відблиск, що біжить усередині контурів (лише transform/opacity). */
export function ClippedSweep({ shapes, imageSize, rot = -20, duration = 3.2, delay = 0, alpha = 0.32, band = 14, color = "255,244,214", ease = "cubic-bezier(.45,.05,.25,1)" }) {
  return (
    <div className="hx-layer hx-fx" aria-hidden="true">
      {shapes.map((poly, i) => {
        const b = inflateBBox(shapesBBox([poly]), 0, imageSize);
        return (
          <div
            key={i}
            className="hx-clip"
            style={{
              left: `${(b.x / imageSize.width) * 100}%`,
              top: `${(b.y / imageSize.height) * 100}%`,
              width: `${(b.w / imageSize.width) * 100}%`,
              height: `${(b.h / imageSize.height) * 100}%`,
              clipPath: clipPolygon(poly, b),
              WebkitClipPath: clipPolygon(poly, b),
            }}
          >
            <span className="hx-sweep" style={{ "--rot": `${rot}deg`, "--dur": `${duration}s`, "--delay": `${delay}s`, "--a": alpha, "--band": `${band}%`, "--rgb": color, "--ease": ease }} />
          </div>
        );
      })}
    </div>
  );
}

const useK = (ctx) => (ctx.size && ctx.size.worldW ? ctx.size.worldW / ctx.imageSize.width : 1); // css px на 1 px зображення

// ───────────────────────── Ковш: «копання» ─────────────────────────
function DigEffect({ ctx }) {
  const { hotspot, active, image, imageSize, reduced } = ctx;
  const o = hotspot.effectOptions;
  const k = useK(ctx);
  const rot = useMotionValue(0);
  const dxv = useMotionValue(0);
  const dyv = useMotionValue(0);
  const rodv = useMotionValue(0);
  const glow = useMotionValue(0);
  const x = useTransform(dxv, (v) => v * k);
  const y = useTransform(dyv, (v) => v * k);
  const rodY = useTransform(rodv, (v) => v * k);
  const [burst, setBurst] = useState(0);
  const mountedHL = useDelayedMount(active, 900);

  const bbox = useMemo(() => inflateBBox(shapesBBox(hotspot.shapes), 3, imageSize), [hotspot.shapes, imageSize]);
  const rodShapes = useMemo(() => [o.rod], [o.rod]);
  const origin = `${((o.pivot.x - bbox.x) / bbox.w) * 100}% ${((o.pivot.y - bbox.y) / bbox.h) * 100}%`;

  useEffect(() => {
    const heavy = { type: "spring", stiffness: 48, damping: 17, mass: 1.6 };
    const ctrls = [];
    const timers = [];
    let dead = false;
    const stop = () => {
      dead = true;
      ctrls.forEach((c) => c.stop());
      timers.forEach(clearTimeout);
    };
    if (!active) {
      [rot, dxv, dyv, rodv].forEach((mv) => ctrls.push(animate(mv, 0, heavy)));
      ctrls.push(animate(glow, 0, { duration: 0.5 }));
      return stop;
    }
    ctrls.push(animate(glow, 1, { duration: 0.6, ease: easeOut }));
    if (reduced) return stop;

    const D = 3.8; // один цикл «врізання → загрібання → повернення»
    const times = [0, 0.18, 0.3, 0.6, 0.8, 1];
    const ease = Array(5).fill([0.5, 0, 0.2, 1]); // важкий старт і плавне гальмування
    const cycle = () => {
      if (dead) return;
      const opt = { duration: D, times, ease };
      ctrls.push(
        animate(rot, [0, -2, -2, 7.5, 7.5, 0], opt), // ковш провертається всередину
        animate(dyv, [0, 2.5, 6, 3, 3, 0], opt), // зуби йдуть униз
        animate(dxv, [0, 1.2, 1.6, -4, -4, 0], opt),
        animate(rodv, [0, 1.8, 3, -3, -3, 0], opt) // шток гідроциліндра
      );
      timers.push(setTimeout(() => setBurst((b) => b + 1), D * 0.3 * 1000));
      timers.push(setTimeout(() => setBurst((b) => b + 1), D * 0.62 * 1000));
      timers.push(setTimeout(cycle, (D + 1.3) * 1000));
    };
    timers.push(setTimeout(cycle, 350));
    return stop;
  }, [active, reduced, rot, dxv, dyv, rodv, glow]);

  const move = { x, y, rotate: rot, transformOrigin: origin };
  return (
    <>
      {/* Ковш завжди лежить окремим шаром поверх основи — у спокої він ідентичний оригіналу */}
      <SpriteBox className="hx-mover" image={image} imageSize={imageSize} shapes={hotspot.shapes} style={move} />
      {mountedHL && (
        <m.div className="hx-layer hx-hl" style={{ opacity: glow }}>
          <SpriteBox image={image} imageSize={imageSize} shapes={hotspot.shapes} style={{ ...move, filter: lit(hotspot) }} />
          <SpriteBox image={image} imageSize={imageSize} shapes={rodShapes} margin={2} style={{ y: rodY, filter: lit(hotspot) }} />
        </m.div>
      )}
      {burst > 0 && <DustBurst key={burst} x={o.teeth.x} y={o.teeth.y} imageSize={imageSize} count={16} spreadX={44} rise={48} duration={1.8} />}
    </>
  );
}

// ───────────────────────── Гідравліка: шток, шланги ─────────────────────────
function HydraulicsEffect({ ctx }) {
  const { hotspot, active, image, imageSize, reduced } = ctx;
  const o = hotspot.effectOptions;
  const k = useK(ctx);
  const rodv = useMotionValue(0);
  const rodY = useTransform(rodv, (v) => v * k);
  const sway = [useMotionValue(0), useMotionValue(0)];
  const mounted = useDelayedMount(active, 900);
  const rodShapes = useMemo(() => [o.rod], [o.rod]);
  const hoseShapes = useMemo(() => o.hoses.map((h) => [h.shape]), [o.hoses]);
  const sweepShapes = useMemo(() => [hotspot.shapes[0]], [hotspot.shapes]);

  useEffect(() => {
    const ctrls = [];
    const stop = () => ctrls.forEach((c) => c.stop());
    if (!active || reduced) {
      ctrls.push(animate(rodv, 0, { type: "spring", stiffness: 60, damping: 18, mass: 1.2 }));
      sway.forEach((mv) => ctrls.push(animate(mv, 0, { duration: 0.6 })));
      return stop;
    }
    ctrls.push(animate(rodv, [0, 3.6, -2.4, 3, 0], { duration: 3, ease: "easeInOut", repeat: Infinity, repeatDelay: 0.4 }));
    o.hoses.forEach((h, i) => ctrls.push(animate(sway[i], [0, h.sway, -h.sway * 0.8, h.sway * 0.6, 0], { duration: 3.4 + i * 0.5, ease: "easeInOut", repeat: Infinity })));
    return stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, reduced]);

  return (
    <>
      <Highlight ctx={ctx} />
      {mounted && (
        <m.div className="hx-layer hx-hl" initial={{ opacity: 0 }} animate={{ opacity: active ? 1 : 0 }} transition={{ duration: 0.5 }}>
          <SpriteBox image={image} imageSize={imageSize} shapes={rodShapes} margin={2} style={{ y: rodY, filter: lit(hotspot, "drop-shadow(0 0 3px rgba(255,236,170,.35))") }} />
          {o.hoses.map((h, i) => {
            const bb = inflateBBox(shapesBBox([h.shape]), 3, imageSize);
            return (
              <SpriteBox
                key={i}
                image={image}
                imageSize={imageSize}
                shapes={hoseShapes[i]}
                style={{ rotate: sway[i], transformOrigin: `${((h.origin.x - bb.x) / bb.w) * 100}% ${((h.origin.y - bb.y) / bb.h) * 100}%`, filter: lit(hotspot) }}
              />
            );
          })}
        </m.div>
      )}
      {mounted && active && <ClippedSweep shapes={sweepShapes} imageSize={imageSize} rot={o.sheen.angle} duration={o.sheen.duration} alpha={0.3} band={22} />}
    </>
  );
}

// ───────────────────────── Стріла: відблиск уздовж осі ─────────────────────────
function BoomEffect({ ctx }) {
  const { hotspot, active, imageSize } = ctx;
  const o = hotspot.effectOptions;
  const mounted = useDelayedMount(active, 900);
  const rot = (Math.atan2(o.axis.to.y - o.axis.from.y, o.axis.to.x - o.axis.from.x) * 180) / Math.PI; // ≈ −68°: рух від п'яти до ліктя
  return (
    <>
      <Highlight ctx={ctx} />
      {mounted && active && <ClippedSweep shapes={hotspot.shapes} imageSize={imageSize} rot={rot} duration={o.duration} alpha={0.36} band={9} />}
    </>
  );
}

// ───────────────────────── Кабіна: скло та силует оператора ─────────────────────────
function CabEffect({ ctx }) {
  const { hotspot, active, image, imageSize, reduced } = ctx;
  const o = hotspot.effectOptions;
  const mounted = useDelayedMount(active, 900);
  const glass = useMemo(() => [o.glass], [o.glass]);
  const operator = useMemo(() => [o.operator], [o.operator]);
  return (
    <>
      <Highlight ctx={ctx} />
      {mounted && active && <ClippedSweep shapes={glass} imageSize={imageSize} rot={-24} duration={3.6} alpha={0.34} band={11} />}
      {mounted && (
        <m.div className="hx-layer hx-hl" initial={{ opacity: 0 }} animate={{ opacity: active ? 1 : 0 }} transition={{ duration: 0.5 }}>
          <SpriteBox
            image={image}
            imageSize={imageSize}
            shapes={operator}
            margin={2}
            style={{ filter: "brightness(.92) contrast(1.06)" }}
            animate={active && !reduced ? { x: [0, 1.4, -0.8, 0], y: [0, -1, 0.7, 0], rotate: [0, 1.1, -0.6, 0] } : { x: 0, y: 0, rotate: 0 }}
            transition={active && !reduced ? { duration: 3.8, repeat: Infinity, ease: "easeInOut" } : { duration: 0.5 }}
          />
        </m.div>
      )}
    </>
  );
}

// ───────────────────────── Колеса: пил з-під шасі ─────────────────────────
function WheelsEffect({ ctx }) {
  const { hotspot, active, imageSize, reduced } = ctx;
  const mounted = useDelayedMount(active, 1200);
  return (
    <>
      <Highlight ctx={ctx} />
      {mounted && active && !reduced && hotspot.effectOptions.dust.map((d, i) => (
        <DustBurst key={i} x={d.x} y={d.y} imageSize={imageSize} count={8} spreadX={34} rise={30} duration={3.4} alpha={0.34} loop seed={5 + i} />
      ))}
    </>
  );
}

// ───────────────────────── Двигун: ледь помітна вібрація ─────────────────────────
function EngineEffect({ ctx }) {
  const { hotspot, active, image, imageSize, reduced } = ctx;
  const o = hotspot.effectOptions;
  const mounted = useDelayedMount(active, 900);
  const grille = useMemo(() => [o.grille], [o.grille]);
  return (
    <>
      <div className={mounted && !reduced ? "hx-vibrate" : undefined} style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 3 }}>
        <Highlight ctx={ctx} />
      </div>
      {mounted && (
        <m.div className="hx-layer hx-hl" initial={{ opacity: 0 }} animate={{ opacity: active ? 1 : 0 }} transition={{ duration: 0.6 }}>
          <SpriteBox image={image} imageSize={imageSize} shapes={grille} margin={2} style={{ filter: "brightness(1.5) contrast(1.08) saturate(1.1)" }} />
        </m.div>
      )}
    </>
  );
}

function BasicEffect({ ctx }) {
  return <Highlight ctx={ctx} />;
}

export const EFFECTS = {
  dig: DigEffect,
  hydraulics: HydraulicsEffect,
  boom: BoomEffect,
  cab: CabEffect,
  wheels: WheelsEffect,
  engine: EngineEffect,
  basic: BasicEffect,
};
