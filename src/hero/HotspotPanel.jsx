import React, { useEffect, useState } from "react";
import { m, useTransform } from "framer-motion";

const PANEL_W = 244;
const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
const easeOut = [0.22, 0.8, 0.3, 1];

// Проекція точки зображення на екран: слідує за камерою (spring), тож панель «їде» разом із зумом
function useProjected(hotspot, cam, par, world, imageSize) {
  const ax = useTransform([cam.x, cam.s, par.x], ([x, s, p]) => x + (hotspot.anchor.x / imageSize.width) * world.worldW * s + p);
  const ay = useTransform([cam.y, cam.s, par.y], ([y, s, p]) => y + (hotspot.anchor.y / imageSize.height) * world.worldH * s + p);
  return { ax, ay };
}

function PanelBody({ hotspot, onSelect, ctaLabel }) {
  const stats = hotspot.data && Array.isArray(hotspot.data.stats) ? hotspot.data.stats : [];
  return (
    <>
      <div className="hx-panel-title">{hotspot.label}</div>
      <div className="hx-panel-desc">{hotspot.description}</div>
      {stats.length > 0 && (
        <div className="hx-panel-stats">
          {stats.map((s) => (
            <span key={s.label} className="hx-panel-stat">
              <b>{s.value}</b> {s.label}
            </span>
          ))}
        </div>
      )}
      {onSelect && hotspot.catalog && (
        <button type="button" className="hx-panel-cta" onClick={() => onSelect(hotspot)}>
          {ctaLabel || "Підібрати техніку"} <span aria-hidden="true">→</span>
        </button>
      )}
    </>
  );
}

function FloatingPanel({ hotspot, visible, cam, par, world, imageSize, bounds, vh, onSelect, ctaLabel }) {
  const side = hotspot.tooltip?.side === "right" ? "right" : "left";
  const gap = hotspot.tooltip?.gap ?? 26;
  const { ax, ay } = useProjected(hotspot, cam, par, world, imageSize);
  const px = useTransform(ax, (a) => clamp(side === "right" ? a + gap : a - gap - PANEL_W, bounds.minX, Math.max(bounds.minX, bounds.maxX - PANEL_W)));
  const py = useTransform(ay, (a) => clamp(a, 64, Math.max(64, vh - 64)));
  const dotX = useTransform(ax, (a) => a - 4);
  const dotY = useTransform(ay, (a) => a - 4);
  // тонка лінія від точки до краю панелі (scaleX від фіксованої ширини — без layout)
  const lineX = useTransform([ax, px], ([a, p]) => Math.min(a, side === "right" ? p : p + PANEL_W));
  const lineS = useTransform([ax, px], ([a, p]) => Math.max(0.001, Math.abs((side === "right" ? p : p + PANEL_W) - a) / 100));
  return (
    <>
      <m.span className="hx-anchor" style={{ x: dotX, y: dotY }} initial={{ opacity: 0, scale: 0.4 }} animate={visible ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.6 }} transition={{ duration: 0.35, ease: easeOut, delay: visible ? 0.15 : 0 }} />
      <m.span className="hx-leader" style={{ x: lineX, y: ay, scaleX: lineS }} initial={{ opacity: 0 }} animate={{ opacity: visible ? 1 : 0 }} transition={{ duration: 0.35, delay: visible ? 0.25 : 0 }} />
      <m.div className="hx-panel-pos" style={{ x: px, y: py, width: PANEL_W }}>
        <m.div
          className="hx-panel"
          role="status"
          style={{ pointerEvents: visible ? "auto" : "none" }}
          initial={{ opacity: 0, x: side === "right" ? -14 : 14, scale: 0.97 }}
          animate={visible ? { opacity: 1, x: 0, scale: 1 } : { opacity: 0, x: side === "right" ? -8 : 8, scale: 0.98 }}
          transition={visible ? { type: "spring", stiffness: 190, damping: 24, mass: 0.9, delay: 0.2 } : { duration: 0.22 }}
        >
          <PanelBody hotspot={hotspot} onSelect={onSelect} ctaLabel={ctaLabel} />
        </m.div>
      </m.div>
    </>
  );
}

function DockedPanel({ hotspot, visible, onSelect, onClose, ctaLabel }) {
  return (
    <m.div
      className="hx-panel hx-panel-docked"
      role="status"
      style={{ pointerEvents: visible ? "auto" : "none" }}
      initial={{ opacity: 0, y: 22 }}
      animate={visible ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
      transition={visible ? { type: "spring", stiffness: 220, damping: 26, delay: 0.12 } : { duration: 0.2 }}
    >
      <button type="button" className="hx-panel-close" onClick={onClose} aria-label="Закрити">
        ×
      </button>
      <PanelBody hotspot={hotspot} onSelect={onSelect} ctaLabel={ctaLabel} />
    </m.div>
  );
}

/**
 * Панель з описом активної зони: плаваюча біля деталі (десктоп) або знизу кадру (дотик).
 * Після зникнення зони панель ще 450 мс «гасне» й лише тоді демонтується (без AnimatePresence).
 * Під час прямого переходу A → B панель B монтується одразу з новим key.
 */
export function HotspotPanel({ hotspot, compact, ...rest }) {
  const [shown, setShown] = useState(hotspot);
  useEffect(() => {
    if (hotspot) {
      setShown(hotspot);
      return undefined;
    }
    const t = setTimeout(() => setShown(null), 450);
    return () => clearTimeout(t);
  }, [hotspot]);
  const current = hotspot || shown;
  if (!current) return null;
  const visible = !!hotspot;
  return compact ? (
    <DockedPanel key={current.id} hotspot={current} visible={visible} onSelect={rest.onSelect} onClose={rest.onClose} ctaLabel={rest.ctaLabel} />
  ) : (
    <FloatingPanel key={current.id} hotspot={current} visible={visible} {...rest} />
  );
}

function Marker({ hotspot, cam, par, world, imageSize, visible }) {
  const { ax, ay } = useProjected(hotspot, cam, par, world, imageSize);
  const x = useTransform(ax, (a) => a - 9);
  const y = useTransform(ay, (a) => a - 9);
  return <m.span className="hx-marker" style={{ x, y }} initial={false} animate={{ opacity: visible ? 1 : 0 }} transition={{ duration: 0.5 }} aria-hidden="true" />;
}

/** Ненав'язливі точки-підказки: показують, що деталі інтерактивні (на дотик — одразу, на десктопі — після паузи). */
export function Markers({ hotspots, visible, ...rest }) {
  return (
    <>
      {hotspots.map((h, i) => (
        <Marker key={h.id} hotspot={h} visible={visible} {...rest} />
      ))}
    </>
  );
}
