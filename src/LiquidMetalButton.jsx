import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { liquidMetalFragmentShader, ShaderMount } from "@paper-design/shaders";

// Кнопка «рідкий метал»: чорна капсула в рамці з рухомого металу (shader). Адаптовано з shadcn liquid-metal-button.
const EASE = "all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)";
const SANS = "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif";

export default function LiquidMetalButton({ label, onClick, icon = null, type = "button", color = "#E9E4DC", height = 46, style, ariaLabel }) {
  const [hover, setHover] = useState(false);
  const [press, setPress] = useState(false);
  const [ripples, setRipples] = useState([]);
  const [w, setW] = useState(150);
  const shaderRef = useRef(null);
  const mount = useRef(null);
  const btnRef = useRef(null);
  const measure = useRef(null);
  const rid = useRef(0);
  const reduce = useRef(false);

  useLayoutEffect(() => {
    if (measure.current) setW(Math.ceil(measure.current.getBoundingClientRect().width) + 44 + (icon ? 24 : 0));
  }, [label, icon]);

  useEffect(() => {
    reduce.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!shaderRef.current) return;
    try {
      mount.current = new ShaderMount(
        shaderRef.current,
        liquidMetalFragmentShader,
        { u_repetition: 4, u_softness: 0.5, u_shiftRed: 0.3, u_shiftBlue: 0.3, u_distortion: 0, u_contour: 0, u_angle: 45, u_scale: 8, u_shape: 1, u_offsetX: 0.1, u_offsetY: -0.1 },
        undefined,
        reduce.current ? 0 : 0.6
      );
    } catch (e) { /* без WebGL лишається чорна капсула */ }
    return () => { try { mount.current && mount.current.destroy && mount.current.destroy(); } catch (e) {} mount.current = null; };
  }, []);

  const speed = (v) => { if (!reduce.current) mount.current && mount.current.setSpeed && mount.current.setSpeed(v); };
  const click = (e) => {
    speed(2.4);
    setTimeout(() => speed(hover ? 1 : 0.6), 300);
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      const id = rid.current++;
      setRipples((p) => [...p, { x: e.clientX - r.left, y: e.clientY - r.top, id }]);
      setTimeout(() => setRipples((p) => p.filter((q) => q.id !== id)), 600);
    }
    onClick && onClick(e);
  };

  const shadow = press
    ? "0 0 0 1px rgba(0,0,0,.5), 0 1px 2px rgba(0,0,0,.3)"
    : hover
      ? "0 0 0 1px rgba(0,0,0,.4), 0 12px 6px rgba(0,0,0,.05), 0 8px 5px rgba(0,0,0,.1), 0 4px 4px rgba(0,0,0,.15), 0 1px 2px rgba(0,0,0,.2), 0 6px 22px rgba(255,106,26,.28)"
      : "0 0 0 1px rgba(0,0,0,.3), 0 20px 12px rgba(0,0,0,.08), 0 9px 9px rgba(0,0,0,.12), 0 2px 5px rgba(0,0,0,.15)";

  return (
    <span style={{ position: "relative", display: "inline-block", width: w, height, maxWidth: "100%", ...style }}>
      <span ref={measure} aria-hidden="true" style={{ position: "absolute", visibility: "hidden", whiteSpace: "nowrap", fontSize: 14, fontWeight: 600, fontFamily: SANS, pointerEvents: "none" }}>{label}</span>
      <span style={{ position: "absolute", inset: 0, borderRadius: 100, boxShadow: shadow, transition: "box-shadow .15s, transform .2s", transform: press ? "translateY(1px) scale(.98)" : "none" }}>
        <span ref={shaderRef} className="lm-shader" style={{ display: "block", position: "relative", width: "100%", height: "100%", borderRadius: 100, overflow: "hidden" }} />
      </span>
      <span style={{ position: "absolute", inset: 2, borderRadius: 100, background: "linear-gradient(180deg,#202020 0%,#000 100%)", pointerEvents: "none", transform: press ? "translateY(1px) scale(.98)" : "none", transition: "transform .2s" }} />
      <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color, fontFamily: SANS, fontSize: 14, fontWeight: 600, whiteSpace: "nowrap", textShadow: "0 1px 2px rgba(0,0,0,.5)", pointerEvents: "none" }}>
        {icon}{label}
      </span>
      <button
        ref={btnRef}
        type={type}
        aria-label={ariaLabel || label}
        onClick={click}
        onMouseEnter={() => { setHover(true); speed(1); }}
        onMouseLeave={() => { setHover(false); setPress(false); speed(0.6); }}
        onMouseDown={() => setPress(true)}
        onMouseUp={() => setPress(false)}
        onTouchStart={() => setPress(true)}
        onTouchEnd={() => setPress(false)}
        style={{ position: "absolute", inset: 0, background: "transparent", border: "none", borderRadius: 100, cursor: "pointer", overflow: "hidden", padding: 0 }}
      >
        {ripples.map((r) => (
          <span key={r.id} style={{ position: "absolute", left: r.x, top: r.y, width: 20, height: 20, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,.4) 0%, rgba(255,255,255,0) 70%)", pointerEvents: "none", animation: "lm-ripple .6s ease-out" }} />
        ))}
      </button>
    </span>
  );
}
