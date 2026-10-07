import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./story.css";
import { defaultStory } from "./story.config.js";
import { progressOf, timeAt, stageAt, scrollTargetFor, follow } from "./story.logic.js";

const prefersReduced = () => typeof window !== "undefined" && !!window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * ScrollStory — «залипна» сцена: прокрутка сторінки = перемотка відео, підписи змінюються за етапами.
 * props: config (див. story.config.js), onCta(stage.cta) — клік по кнопці на етапі.
 */
export default function ScrollStory({ config = defaultStory, onCta }) {
  const { video, stops, stages, heightVh } = config;
  const secRef = useRef(null);
  const vidRef = useRef(null);
  const fillRef = useRef(null);
  const [stage, setStage] = useState(0);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const reduced = useMemo(() => prefersReduced(), []);
  const last = useRef({ stage: 0, cur: 0, t: 0 });

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
      const v = vidRef.current;
      if (v && v.readyState >= 2 && Math.abs(v.currentTime - last.current.cur) > 0.012) v.currentTime = last.current.cur;
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
  }, [reduced, stops, stages]);

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
          <div className="ss-left">
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
            <div className="ss-caps" aria-live="polite">
              {stages.map((s, i) => (
                <div key={s.id} className="ss-cap" data-on={i === stage ? "" : undefined} data-stage={s.id} aria-hidden={i === stage ? undefined : "true"}>
                  <div className="ss-kicker">
                    {String(i + 1).padStart(2, "0")} / {String(stages.length).padStart(2, "0")} — {s.kicker}
                  </div>
                  <h2 className="ss-title">{s.title}</h2>
                  <p className="ss-text">{s.text}</p>
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
            {failed ? (
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
        </div>
        <div className="ss-hint" aria-hidden="true">
          <span />
        </div>
      </div>
    </section>
  );
}
