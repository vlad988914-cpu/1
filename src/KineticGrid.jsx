import React, { useEffect, useRef } from "react";

// Кінетична сітка: лінії прогинаються до курсора, клік дає хвилю.
// Адаптовано з shadcn kinetic-grid під JSX без Tailwind. Малює в межах батьківського блоку.
const CELL = 55, RADIUS = 260, MAX_WARP = 24, DOT = 28, LERP = 0.08;
const lerp = (a, b, t) => a + (b - a) * t;

const BRAND = [255, 106, 26];
export default function KineticGrid({ accent = BRAND, fixed = false, dim = 1, style }) {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    let w = 0, h = 0, dpr = 1, raf = 0, visible = true;
    const mouse = { x: -9999, y: -9999, tx: -9999, ty: -9999, a: 0, ta: 0 };
    const ripples = [];

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = fixed ? window.innerWidth : parent.clientWidth; h = fixed ? window.innerHeight : parent.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      canvas.style.width = w + "px"; canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const warp = (x, y) => {
      let ox = 0, oy = 0;
      const dx = mouse.x - x, dy = mouse.y - y, d = Math.hypot(dx, dy);
      if (d < RADIUS && d > 0.01) {
        const f = Math.pow(1 - d / RADIUS, 2) * MAX_WARP * mouse.a;
        ox += (dx / d) * f; oy += (dy / d) * f;
      }
      for (const r of ripples) {
        const rx = x - r.x, ry = y - r.y, rd = Math.hypot(rx, ry);
        const dist = Math.abs(rd - r.r);
        if (dist < 60 && rd > 0.01) {
          const f = Math.cos((dist / 60) * Math.PI / 2) * 14 * r.life;
          ox += (rx / rd) * f; oy += (ry / rd) * f;
        }
      }
      return [x + ox, y + oy];
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const [r, g, b] = accent;
      ctx.lineWidth = 1;
      ctx.strokeStyle = `rgba(${r},${g},${b},${0.11 * dim})`;
      ctx.beginPath();
      for (let x = 0; x <= w + CELL; x += CELL) {
        for (let y = 0; y <= h; y += 12) {
          const [px, py] = warp(x, y);
          y === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
      }
      for (let y = 0; y <= h + CELL; y += CELL) {
        for (let x = 0; x <= w; x += 12) {
          const [px, py] = warp(x, y);
          x === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
      }
      ctx.stroke();
      for (let x = DOT; x < w; x += DOT * 2) {
        for (let y = DOT; y < h; y += DOT * 2) {
          const d = Math.hypot(mouse.x - x, mouse.y - y);
          const k = d < RADIUS ? (1 - d / RADIUS) * mouse.a : 0;
          if (k <= 0.02) continue;
          const [px, py] = warp(x, y);
          ctx.fillStyle = `rgba(255,201,56,${Math.min(0.95, (0.2 + k * 0.78) * Math.max(dim, 0.9))})`;
          ctx.beginPath(); ctx.arc(px, py, 1.2 + k * 1.7, 0, 6.2832); ctx.fill();
        }
      }
    };

    const tick = () => {
      raf = 0;
      mouse.x = lerp(mouse.x, mouse.tx, LERP * 2);
      mouse.y = lerp(mouse.y, mouse.ty, LERP * 2);
      mouse.a = lerp(mouse.a, mouse.ta, LERP);
      for (let i = ripples.length - 1; i >= 0; i--) {
        ripples[i].r += 5; ripples[i].life -= 0.014;
        if (ripples[i].life <= 0) ripples.splice(i, 1);
      }
      draw();
      const idle = mouse.a < 0.01 && mouse.ta === 0 && !ripples.length;
      if (visible && !document.hidden && !idle) raf = requestAnimationFrame(tick);
    };
    const kick = () => { if (!raf && visible && !reduce) raf = requestAnimationFrame(tick); };

    const local = (e) => {
      const rc = canvas.getBoundingClientRect();
      return [e.clientX - rc.left, e.clientY - rc.top, rc];
    };
    const onMove = (e) => {
      const [x, y, rc] = local(e);
      const inside = x >= 0 && y >= 0 && x <= rc.width && y <= rc.height;
      if (inside) {
        if (mouse.a < 0.02) { mouse.x = x; mouse.y = y; }
        mouse.tx = x; mouse.ty = y; mouse.ta = 1;
      } else mouse.ta = 0;
      kick();
    };
    const onClick = (e) => {
      const [x, y, rc] = local(e);
      if (x < 0 || y < 0 || x > rc.width || y > rc.height) return;
      ripples.push({ x, y, r: 0, life: 1 });
      kick();
    };

    resize(); draw();
    const ro = new ResizeObserver(() => { resize(); draw(); });
    if (fixed) window.addEventListener("resize", resize); else ro.observe(parent);
    const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible) kick(); });
    if (!fixed) io.observe(parent);
    if (fine && !reduce) {
      window.addEventListener("mousemove", onMove, { passive: true });
      window.addEventListener("click", onClick, { passive: true });
    }
    return () => {
      cancelAnimationFrame(raf); window.removeEventListener("resize", resize); ro.disconnect(); io.disconnect();
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("click", onClick);
    };
  }, [accent, fixed, dim]);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      style={{ position: fixed ? "fixed" : "absolute", inset: 0, zIndex: fixed ? -1 : 0, pointerEvents: "none", ...style }}
    />
  );
}
