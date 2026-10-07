import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import "./motion.css";
import { splitWords, staggerDelay, easeOutExpo, formatCount, STAGGER } from "./tokens.js";

export * from "./tokens.js";

const prefersReducedMotion = () => typeof window !== "undefined" && !!window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const canHover = () => typeof window !== "undefined" && !!window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;

/**
 * Заголовок, слова которого выезжают из-под маски со ступенькой 60 мс.
 * Скринридер читает цельный текст (.mo-sr), визуальные слова скрыты от него (aria-hidden).
 * offset — номер слова, с которого начинается этот фрагмент (для заголовка из двух частей).
 */
export function SplitWords({ text, delay = 0.3, step = STAGGER.step, offset = 0 }) {
  const words = useMemo(() => splitWords(text), [text]);
  return (
    <span className="mo-words">
      <span className="mo-sr">{words.join(" ")}</span>
      {words.map((w, i) => (
        <React.Fragment key={`${i}-${w}`}>
          <span className="mo-word" aria-hidden="true">
            <span className="mo-word-in" style={{ "--d": `${(delay + staggerDelay(offset + i, step)).toFixed(3)}s` }}>
              {w}
            </span>
          </span>
          {i < words.length - 1 ? " " : null}
        </React.Fragment>
      ))}
    </span>
  );
}

/**
 * Число «набегает» до значения (ease-out-expo, 900 мс). Старт — когда блок попал в экран.
 * При изменении value плавно доезжает до нового, при reduced-motion показывает сразу.
 */
export function CountUp({ value, duration = 900, format = formatCount, className, style }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(0);
  const from = useRef(0);
  const started = useRef(false);
  const raf = useRef(0);

  const run = useCallback(
    (to) => {
      cancelAnimationFrame(raf.current);
      if (prefersReducedMotion()) {
        from.current = to;
        setShown(to);
        return;
      }
      let start = null; // время берём из rAF-кадра: так нет рассинхрона с performance.now()
      const a = from.current;
      const tick = (now) => {
        if (start === null) start = now;
        const t = Math.min(1, Math.max(0, (now - start) / duration));
        const v = a + (to - a) * easeOutExpo(t);
        from.current = v;
        setShown(v);
        if (t < 1) raf.current = requestAnimationFrame(tick);
      };
      raf.current = requestAnimationFrame(tick);
    },
    [duration]
  );

  useEffect(() => {
    const el = ref.current;
    if (started.current) {
      run(value);
      return undefined;
    }
    const go = () => {
      started.current = true;
      run(value);
    };
    if (typeof IntersectionObserver === "undefined" || !el) {
      go();
      return undefined;
    }
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        io.disconnect();
        go();
      }
    }, { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, [value, run]);

  useEffect(() => () => cancelAnimationFrame(raf.current), []);
  return (
    <span ref={ref} className={className} style={style} aria-label={format(value)}>
      {format(shown)}
    </span>
  );
}

/**
 * Вкладки с плавным индикатором: оранжевая линия «переезжает» к активной вкладке (transform).
 * Работает и для группы вкладок: если активной вкладки в этой группе нет, индикатор гаснет.
 */
export function SlidingTabs({ tabs, value, onChange, style, buttonStyle, renderLabel, label }) {
  const ref = useRef(null);
  const [ind, setInd] = useState({ x: 0, w: 0, show: false });
  const [still, setStill] = useState(true); // первый показ без анимации

  const measure = useCallback(() => {
    const c = ref.current;
    if (!c) return;
    const el = c.querySelector('[aria-selected="true"]');
    if (!el) {
      setInd((p) => (p.show ? { ...p, show: false } : p));
      return;
    }
    const x = el.offsetLeft;
    const w = el.offsetWidth;
    setInd((p) => (p.x === x && p.w === w && p.show ? p : { x, w, show: true }));
  }, []);

  const key = tabs.map((t) => `${t.key}:${t.count || 0}`).join("|");
  useLayoutEffect(measure, [value, key, measure]);
  useEffect(() => {
    const t = requestAnimationFrame(() => setStill(false));
    const c = ref.current;
    const ro = typeof ResizeObserver !== "undefined" && c ? new ResizeObserver(measure) : null;
    if (ro) ro.observe(c);
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(t);
      ro && ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [measure]);

  return (
    <div ref={ref} role="presentation" className="mo-tabs" style={{ display: "flex", gap: 2, overflowX: "auto", ...style }} aria-label={label}>
      {tabs.map((t) => {
        const active = t.key === value;
        return (
          <button key={t.key} type="button" role="tab" aria-selected={active} onClick={() => onChange(t.key)} style={buttonStyle ? buttonStyle(active, t) : undefined}>
            {renderLabel ? renderLabel(t, active) : t.label}
          </button>
        );
      })}
      <span className="mo-ind" aria-hidden="true" data-still={still ? "" : undefined} style={{ transform: `translateX(${ind.x}px) scaleX(${ind.w / 100})`, opacity: ind.show ? 1 : 0 }} />
    </div>
  );
}

/** Свет следует за курсором на любой карточке .mo-spot (одна делегированная подписка на весь документ). */
export function useSpotlight() {
  useEffect(() => {
    if (!canHover()) return undefined;
    let raf = 0;
    let last = null;
    const onMove = (e) => {
      last = e;
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const t = last && last.target;
        const el = t && t.closest ? t.closest(".mo-spot") : null;
        if (!el) return;
        const r = el.getBoundingClientRect();
        el.style.setProperty("--mx", `${last.clientX - r.left}px`);
        el.style.setProperty("--my", `${last.clientY - r.top}px`);
      });
    };
    document.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      document.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);
}

/** Главная кнопка слегка «тянется» к курсору (до ±6 px). Делегирование по [data-magnetic]. */
export function useMagnetic() {
  useEffect(() => {
    if (!canHover() || prefersReducedMotion()) return undefined;
    let current = null;
    const reset = (el) => {
      if (!el) return;
      el.classList.remove("is-pulling");
      el.style.translate = "0 0";
    };
    const onMove = (e) => {
      const el = e.target && e.target.closest ? e.target.closest("[data-magnetic]") : null;
      if (current && current !== el) {
        reset(current);
        current = null;
      }
      if (!el) return;
      current = el;
      const r = el.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
      const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
      el.classList.add("is-pulling");
      el.style.translate = `${(dx * 6).toFixed(2)}px ${(dy * 5).toFixed(2)}px`;
    };
    const onLeave = () => {
      reset(current);
      current = null;
    };
    document.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    return () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, []);
}

/** Тонкая полоса прогресса прокрутки сверху. Пишет в DOM напрямую — без перерисовок React. */
export function ScrollProgress() {
  const ref = useRef(null);
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = ref.current;
      if (!el) return;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      el.style.transform = `scaleX(${max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0})`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);
  return <div ref={ref} className="mo-progress" aria-hidden="true" />;
}

/**
 * Появление при прокрутке. Элементы, вошедшие в экран одновременно, получают каскад 60 мс (потолок 0,5 с).
 * Заголовок героя и т.п. с clip-path/opacity-0 наблюдатель «не видит», поэтому есть .reveal-wipe с таймером.
 */
export function useReveal(deps) {
  useEffect(() => {
    const els = document.querySelectorAll(".reveal:not(.is-visible), .mo-io:not(.is-visible)");
    if (typeof IntersectionObserver === "undefined") {
      els.forEach((el) => el.classList.add("is-visible"));
      return undefined;
    }
    const io = new IntersectionObserver(
      (entries) => {
        let n = 0;
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          if (el.classList.contains("reveal") && !el.style.transitionDelay) el.style.transitionDelay = `${staggerDelay(n)}s`;
          n += 1;
          el.classList.add("is-visible");
          io.unobserve(el);
        });
      },
      { threshold: 0.15 }
    );
    els.forEach((el) => io.observe(el));
    const wipes = [...document.querySelectorAll(".reveal-wipe:not(.is-visible)")].map((el, i) => setTimeout(() => el.classList.add("is-visible"), 220 + i * 140));
    return () => {
      io.disconnect();
      wipes.forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}


const clamp01 = (v) => Math.min(1, Math.max(0, v));
const smooth = (t) => t * t * (3 - 2 * t);

/**
 * «Перелив» кадров при прокрутке. Каждый блок с [data-scene] растворяется на входе и выходе из экрана:
 * прозрачность, лёгкий подъём и масштаб привязаны к его положению (не к таймеру). В покое стили очищаются,
 * поэтому position:fixed внутри (окна) не ломается. Блок .mo-aura подсвечивает фон: три «света» перетекают друг в друга.
 */
export function useScenes(deps) {
  useEffect(() => {
    if (prefersReducedMotion()) return undefined;
    const scenes = [...document.querySelectorAll("[data-scene]")];
    const auras = [...document.querySelectorAll(".mo-aura > span")];
    let raf = 0;
    const update = () => {
      raf = 0;
      const vh = window.innerHeight;
      scenes.forEach((el) => {
        const r = el.getBoundingClientRect();
        const enter = smooth(clamp01((vh - r.top) / (vh * 0.5))); // 0 → 1, пока верх блока поднимается из-за нижнего края
        const leave = smooth(clamp01(r.bottom / (vh * 0.4))); // 1 → 0, пока низ блока уходит за верхний край
        if (enter >= 0.999 && leave >= 0.999) {
          if (el.style.opacity) {
            el.style.opacity = "";
            el.style.translate = "";
            el.style.scale = "";
          }
          return;
        }
        el.style.opacity = (enter * leave).toFixed(3);
        el.style.translate = `0 ${((1 - enter) * 44 - (1 - leave) * 26).toFixed(1)}px`;
        el.style.scale = (1 - (1 - leave) * 0.025).toFixed(4);
      });
      const max = document.documentElement.scrollHeight - vh;
      const sp = max > 0 ? clamp01(window.scrollY / max) : 0;
      auras.forEach((a, i) => {
        const c = auras.length > 1 ? i / (auras.length - 1) : 0;
        const w = clamp01(1 - Math.abs(sp - c) / 0.55);
        a.style.opacity = smooth(w).toFixed(3);
        a.style.transform = `translate3d(${((sp - c) * -60).toFixed(1)}px, ${((sp - c) * -140).toFixed(1)}px, 0)`;
      });
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    window.__moScenesUpdate = update; // точка входа для тестов и записи видео
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
      scenes.forEach((el) => {
        el.style.opacity = "";
        el.style.translate = "";
        el.style.scale = "";
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/** Фоновые «света» (синий → оранжевый → янтарный): перетекают по мере прокрутки, анимируются только opacity/transform. */
export function SceneAura() {
  return (
    <div className="mo-aura" aria-hidden="true">
      <span />
      <span />
      <span />
    </div>
  );
}
