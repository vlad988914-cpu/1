import React, { useEffect, useRef, useState } from "react";

// Плавний «scramble»: кожна літера живе у власній комірці фіксованої ширини (нічого не тремтить),
// знаки міняються рідко й тьмяніють, а потім літера по черзі проявляється. Запуск: при завантаженні й при наведенні.
const GLYPHS = "!<>-_/[]{}=+*^?#%&";
const TICK = 85;      // як часто міняються випадкові знаки, мс
const STAGGER = 55;   // затримка між літерами, мс
const SPIN = 380;     // скільки літера «крутиться» перед проявою, мс

export default function ScrambleText({ text, hoverRef }) {
  const chars = Array.from(text);
  const [view, setView] = useState(() => chars.map((c) => ({ c, on: true })));
  const raf = useRef(0);
  const busy = useRef(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const arr = Array.from(text);
    setView(arr.map((c) => ({ c, on: true })));
    if (reduce) return;

    const play = () => {
      if (busy.current) return;
      busy.current = true;
      const t0 = performance.now();
      const ends = arr.map((_, i) => i * STAGGER + SPIN + Math.random() * 120);
      const total = Math.max(...ends) + 50;
      let last = -1e9;
      const step = (now) => {
        const dt = now - t0;
        if (now - last >= TICK || dt >= total) {
          last = now;
          setView(arr.map((c, i) => {
            if (c === " " || dt >= ends[i]) return { c, on: true };
            return { c: GLYPHS[Math.floor(Math.random() * GLYPHS.length)], on: false };
          }));
        }
        if (dt < total) raf.current = requestAnimationFrame(step);
        else { busy.current = false; setView(arr.map((c) => ({ c, on: true }))); }
      };
      raf.current = requestAnimationFrame(step);
    };

    const first = setTimeout(play, 600);
    const el = hoverRef && hoverRef.current;
    el && el.addEventListener("mouseenter", play);
    return () => {
      clearTimeout(first); cancelAnimationFrame(raf.current); busy.current = false;
      el && el.removeEventListener("mouseenter", play);
    };
  }, [text, hoverRef]);

  return (
    <span aria-label={text} style={{ display: "inline-flex", whiteSpace: "pre" }}>
      {view.map((v, i) => (
        <span key={i} aria-hidden="true" style={{ position: "relative", display: "inline-block" }}>
          <span style={{ visibility: "hidden" }}>{chars[i]}</span>
          <span style={{ position: "absolute", left: "-50%", right: "-50%", top: 0, textAlign: "center", opacity: v.on ? 1 : 0.4, transition: "opacity .28s ease" }}>{v.c}</span>
        </span>
      ))}
    </span>
  );
}
