import React, { useMemo } from "react";

// Детермінований генератор: однакова картина на сервері/в тестах, без Math.random у рендері
const rng = (seed) => {
  let s = seed >>> 0;
  return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
};

/** Дрібний пил у повітрі — лише transform/opacity (CSS-анімація, без перемальовування). */
export function AmbientDust({ count = 16, seed = 11 }) {
  const motes = useMemo(() => {
    const r = rng(seed);
    return Array.from({ length: count }, (_, i) => ({
      key: i,
      left: 4 + r() * 92,
      top: 30 + r() * 62,
      size: 1.6 + r() * 3.2,
      dx: 40 + r() * 90,
      dy: -(24 + r() * 70),
      dur: 14 + r() * 16,
      delay: -r() * 24,
      a: 0.16 + r() * 0.26,
    }));
  }, [count, seed]);
  return (
    <div className="hx-motes" aria-hidden="true">
      {motes.map((p) => (
        <span
          key={p.key}
          className="hx-mote"
          style={{ left: `${p.left}%`, top: `${p.top}%`, width: p.size, height: p.size, "--dx": `${p.dx}px`, "--dy": `${p.dy}px`, "--dur": `${p.dur}s`, "--delay": `${p.delay}s`, "--a": p.a }}
        />
      ))}
    </div>
  );
}

/**
 * Хмарка пилу в точці зображення (x, y в px оригіналу). loop — безперервний дрейф.
 * Позиціонується у «світі», тому природно масштабується разом з камерою.
 */
export function DustBurst({ x, y, imageSize, count = 14, spreadX = 46, rise = 56, duration = 1.9, tint = "214,178,128", alpha = 0.5, loop = false, seed = 3 }) {
  const puffs = useMemo(() => {
    const r = rng(seed + Math.round(x * 7 + y * 13));
    return Array.from({ length: count }, (_, i) => ({
      key: i,
      dx: (r() - 0.35) * spreadX * 2,
      dy: -(r() * rise + 8),
      s: 5 + r() * 12,
      dur: duration * (0.75 + r() * 0.6),
      delay: r() * duration * 0.5,
      a: alpha * (0.6 + r() * 0.5),
    }));
  }, [count, spreadX, rise, duration, alpha, seed, x, y]);
  return (
    <div className="hx-layer hx-puffs" aria-hidden="true">
      {puffs.map((p) => (
        <span
          key={p.key}
          className="hx-puff"
          style={{
            left: `${(x / imageSize.width) * 100}%`,
            top: `${(y / imageSize.height) * 100}%`,
            width: p.s,
            height: p.s,
            "--dx": `${p.dx}px`,
            "--dy": `${p.dy}px`,
            "--dur": `${p.dur}s`,
            "--delay": `${p.delay}s`,
            "--a": p.a,
            background: `radial-gradient(circle, rgba(${tint},0.9) 0%, rgba(${tint},0) 70%)`,
            animationIterationCount: loop ? "infinite" : 1,
          }}
        />
      ))}
    </div>
  );
}
