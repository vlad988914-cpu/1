import React, { useEffect, useRef, useState } from "react";

// Ефект «scramble»: символи перемішуються випадковими знаками і збираються в текст зліва направо.
const GLYPHS = "!<>-_\\/[]{}=+*^?#%&@$";

export default function ScrambleText({ text, hoverRef, every = 7000, duration = 650 }) {
  const [out, setOut] = useState(text);
  const raf = useRef(0);
  const run = useRef(null);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setOut(text);
    if (reduce) return;
    run.current = () => {
      cancelAnimationFrame(raf.current);
      const t0 = performance.now();
      const step = (now) => {
        const p = Math.min((now - t0) / duration, 1);
        const done = Math.floor(p * text.length);
        let s = "";
        for (let i = 0; i < text.length; i++) {
          const c = text[i];
          s += c === " " || i < done ? c : GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        }
        setOut(s);
        if (p < 1) raf.current = requestAnimationFrame(step);
        else setOut(text);
      };
      raf.current = requestAnimationFrame(step);
    };
    const first = setTimeout(run.current, 500);
    const loop = setInterval(() => { if (!document.hidden) run.current(); }, every);
    const el = hoverRef && hoverRef.current;
    const onEnter = () => run.current && run.current();
    el && el.addEventListener("mouseenter", onEnter);
    return () => {
      clearTimeout(first); clearInterval(loop); cancelAnimationFrame(raf.current);
      el && el.removeEventListener("mouseenter", onEnter);
    };
  }, [text, every, duration, hoverRef]);

  // невидимий оригінал тримає ширину кнопки, щоб вона не «стрибала»
  return (
    <span style={{ display: "inline-grid" }}>
      <span aria-hidden="true" style={{ gridArea: "1/1", visibility: "hidden" }}>{text}</span>
      <span aria-label={text} style={{ gridArea: "1/1", textAlign: "center", whiteSpace: "nowrap" }}>{out}</span>
    </span>
  );
}
