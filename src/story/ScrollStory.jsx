import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./story.css";
import { defaultStory } from "./story.config.js";
import { progressOf, timeAt, stageAt, scrollTargetFor, follow, formatSpec } from "./story.logic.js";
import { easeOutExpo } from "../motion/tokens.js";

const prefersReduced = () => typeof window !== "undefined" && !!window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Телефон: Safari/iOS погано перемотує <video> за currentTime (кадри відстають і «стрибають»),
// тому на вузьких екранах сцена малюється покадрово на canvas з готових webp-кадрів (12 к/с, між кадрами — плавне змішування).
const FR = { count: 145, fps: 12, w: 400, h: 702, src: (i) => `/story/f/f_${String(i + 1).padStart(3, "0")}.webp` };
const isFrameMode = () => typeof window !== "undefined" && window.innerWidth < 900;

/** Число параметра «набігає» щоразу, коли етап стає активним (reduced-motion — одразу кінцеве значення). */
function SpecValue({ value, decimals = 0, active }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!active) {
      setV(0);
      return undefined;
    }
    if (prefersReduced()) {
      setV(value);
      return undefined;
    }
    let raf = 0;
    let start = null;
    const tick = (now) => {
      if (start === null) start = now;
      const k = Math.min(1, Math.max(0, (now - start) / 900));
      setV(value * easeOutExpo(k));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, value]);
  return (
    <>
      <span aria-hidden="true">{formatSpec(v, decimals)}</span>
      <span className="mo-sr">{formatSpec(value, decimals)}</span>
    </>
  );
}

/**
 * ScrollStory — «залипна» сцена: прокрутка сторінки = перемотка відео, підписи змінюються за етапами.
 * props: config (див. story.config.js), onCta(stage.cta) — клік по кнопці на етапі.
 */
export default function ScrollStory({ config = defaultStory, onCta, intro }) {
  const { video, stops, stages, heightVh } = config;
  const secRef = useRef(null);
  const vidRef = useRef(null);
  const cvRef = useRef(null);
  const imgs = useRef([]);
  const drawn = useRef(-1);
  const frameMode = useMemo(() => isFrameMode(), []);
  const fillRef = useRef(null);
  const [stage, setStage] = useState(0);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const reduced = useMemo(() => prefersReduced(), []);
  const last = useRef({ stage: 0, cur: 0, t: 0 });

  // Шапка сайта идёт в потоке: подтягиваем сцену под неё, чтобы на нулевой прокрутке кадр был таким же, как в «залипшем» состоянии
  useEffect(() => {
    const hdr = typeof document !== "undefined" ? document.querySelector("header") : null;
    const set = () => secRef.current && secRef.current.style.setProperty("--ss-hdr", `${hdr ? hdr.offsetHeight : 0}px`);
    set();
    const ro = hdr && typeof ResizeObserver !== "undefined" ? new ResizeObserver(set) : null;
    if (ro) ro.observe(hdr);
    window.addEventListener("resize", set);
    return () => {
      ro && ro.disconnect();
      window.removeEventListener("resize", set);
    };
  }, []);

  const drawAt = useCallback((tSec) => {
    const cv = cvRef.current;
    if (!cv) return;
    const f = Math.min(FR.count - 1, Math.max(0, tSec * FR.fps));
    if (Math.abs(f - drawn.current) < 0.02) return;
    const pick = (i) => {
      for (let d = 0; d < FR.count; d++) {
        for (const j of [i - d, i + d]) {
          const im = imgs.current[j];
          if (j >= 0 && j < FR.count && im && im.complete && im.naturalWidth) return im;
        }
      }
      return null;
    };
    const i0 = Math.floor(f);
    const a = f - i0;
    const A = pick(i0);
    if (!A) return;
    drawn.current = f;
    const ctx = cv.getContext("2d");
    ctx.globalAlpha = 1;
    ctx.drawImage(A, 0, 0, FR.w, FR.h);
    if (a > 0.04 && i0 + 1 < FR.count) {
      const B = pick(i0 + 1);
      if (B && B !== A) { ctx.globalAlpha = a; ctx.drawImage(B, 0, 0, FR.w, FR.h); ctx.globalAlpha = 1; }
    }
  }, []);

  useEffect(() => {
    if (!frameMode || reduced) return undefined;
    let dead = false;
    const list = [];
    for (let i = 0; i < FR.count; i++) {
      const im = new Image();
      im.decoding = "async";
      im.onload = () => { if (!dead) { if (i === 0) setReady(true); drawn.current = -1; drawAt(last.current.cur); } };
      im.src = FR.src(i);
      list.push(im);
    }
    imgs.current = list;
    return () => { dead = true; list.forEach((im) => { im.onload = null; }); };
  }, [frameMode, reduced, drawAt]);

  useEffect(() => {
    if (reduced) return undefined;
    let raf = 0;
    let running = false;
    const frame = (now) => {
      raf = requestAnimationFrame(frame);
      const sec = secRef.current;
      if (!sec) return;
      const vh = window.innerHeight;
      const p = progressOf(sec.getBoundingClientRect(), vh);
      const target = timeAt(p, stops);
      const dt = last.current.t ? now - last.current.t : 16;
      last.current.t = now;
      last.current.cur = follow(last.current.cur, target, dt);
      if (frameMode) drawAt(last.current.cur);
      else {
        const v = vidRef.current;
        if (v && v.readyState >= 2 && Math.abs(v.currentTime - last.current.cur) > 0.012) v.currentTime = last.current.cur;
      }
      if (fillRef.current) fillRef.current.style.transform = `scaleY(${p.toFixed(4)})`;
      const idx = stageAt(p, stages);
      if (idx !== last.current.stage) {
        last.current.stage = idx;
        setStage(idx);
      }
    };
    const start = () => {
      if (running) return;
      running = true;
      last.current.t = 0;
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };
    if (typeof IntersectionObserver === "undefined") {
      start();
      return stop;
    }
    const io = new IntersectionObserver((entries) => (entries.some((e) => e.isIntersecting) ? start() : stop()), { rootMargin: "200px 0px" });
    io.observe(secRef.current);
    return () => {
      io.disconnect();
      stop();
    };
  }, [reduced, stops, stages, frameMode, drawAt]);

  const go = useCallback(
    (i) => {
      const sec = secRef.current;
      if (!sec) return;
      const top = sec.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: scrollTargetFor(i, stages, top, sec.offsetHeight, window.innerHeight), behavior: "smooth" });
    },
    [stages]
  );

  const cur = stages[stage];
  return (
    <section ref={secRef} id="story" className={`ss${reduced ? " ss-static" : ""}`} style={reduced ? undefined : { "--ss-h": `${heightVh}vh` }} aria-label="Техніка зблизька">
      <div className="ss-pin">
        <div className="ss-bg" aria-hidden="true" />
        <div className="ss-grid">
          <div className="ss-caps-col">
            <div className="ss-caps" aria-live="polite">
              {stages.map((s, i) => (
                <div key={s.id} className="ss-cap" data-on={i === stage ? "" : undefined} data-stage={s.id} aria-hidden={i === stage ? undefined : "true"} inert={i === stage ? undefined : ""}>
                  {i === 0 && intro ? (
                    <div className="ss-intro">{intro}</div>
                  ) : (
                    <>
                      <div className="ss-kicker">
                        {String(i + 1).padStart(2, "0")} / {String(stages.length).padStart(2, "0")} — {s.kicker}
                      </div>
                      <h2 className="ss-title">{s.title}</h2>
                      <p className="ss-text">{s.text}</p>
                      {s.specs && (
                        <dl className="ss-specs">
                          {s.specs.map((sp, k) => (
                            <div key={sp.label} className={sp.primary ? "ss-spec ss-spec-main" : "ss-spec ss-spec-row"} style={{ "--i": k }}>
                              <dd>
                                <b>
                                  <SpecValue value={sp.value} decimals={sp.decimals} active={i === stage} />
                                </b>
                                <span className="ss-unit">{sp.unit}</span>
                              </dd>
                              <dt>{sp.label}</dt>
                            </div>
                          ))}
                        </dl>
                      )}
                      {s.note && <p className="ss-note">{s.note}</p>}
                    </>
                  )}
                  {s.cta && onCta && (
                    <button type="button" className="ss-cta" onClick={() => onCta(s.cta)} tabIndex={i === stage ? 0 : -1}>
                      {s.cta.label} <span aria-hidden="true">→</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="ss-stage" style={{ "--ss-aspect": video.aspect }}>
            {frameMode && !reduced ? (
              <canvas ref={cvRef} className="ss-media" width={FR.w} height={FR.h} role="img" aria-label="Колісний екскаватор CAT M320: огляд зблизька" style={{ background: `#0c0e10 url(${video.poster}) 50% 42% / cover no-repeat` }} />
            ) : failed || (frameMode && reduced) ? (
              <img className="ss-media" src={video.poster} alt="Колісний екскаватор CAT M320" />
            ) : (
              <video
                ref={vidRef}
                className="ss-media"
                muted
                playsInline
                preload="auto"
                poster={video.poster}
                disablePictureInPicture
                aria-label="Колісний екскаватор CAT M320: огляд зблизька"
                onLoadedData={() => setReady(true)}
                onError={(e) => e.target === e.currentTarget && setFailed(true)} // ошибки <source> всплывают сюда: их игнорируем
              >
                {video.sources.map((s, i) => (
                  // пропущенный источник — не авария: браузер берёт следующий; запасной вариант — только если не сработал последний
                  <source key={s.src} src={s.src} type={s.type} onError={i === video.sources.length - 1 ? () => setFailed(true) : undefined} />
                ))}
              </video>
            )}
            <div className="ss-vignette" aria-hidden="true" />
            <div className="ss-chip" aria-hidden="true">
              {cur.kicker}
            </div>
            {!ready && !failed && <div className="ss-loading" aria-hidden="true" />}
          </div>
          <div className="ss-rail-col">
            <ol className="ss-rail" aria-label="Етапи огляду">
              <span className="ss-rail-line" aria-hidden="true">
                <span ref={fillRef} className="ss-rail-fill" />
              </span>
              {stages.map((s, i) => (
                <li key={s.id}>
                  <button type="button" className="ss-rail-btn" data-on={i === stage ? "" : undefined} onClick={() => go(i)} aria-current={i === stage ? "step" : undefined}>
                    <b>{String(i + 1).padStart(2, "0")}</b>
                    <span>{s.kicker}</span>
                  </button>
                </li>
              ))}
            </ol>
          </div>
        </div>
        <div className="ss-hint" aria-hidden="true">
          <span />
        </div>
      </div>
    </section>
  );
}
