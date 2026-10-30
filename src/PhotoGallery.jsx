// Галерея фото техніки: велике фото зі свайпом (scroll-snap), лічильник «2/6», стрілки, мініатюри
// і повноекранний перегляд (клавіші ←/→, Esc). Працює без бібліотек; на телефоні гортається пальцем.
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const reduced = () => typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function useSlider(count, start = 0) {
  const ref = useRef(null);
  const [idx, setIdx] = useState(start);
  const raf = useRef(0);
  const onScroll = useCallback(() => {
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => {
      const el = ref.current;
      if (!el || !el.clientWidth) return;
      const i = Math.round(el.scrollLeft / el.clientWidth);
      setIdx((cur) => (cur === i ? cur : Math.max(0, Math.min(count - 1, i))));
    });
  }, [count]);
  const go = useCallback((i, instant) => {
    const el = ref.current;
    if (!el) return;
    const n = Math.max(0, Math.min(count - 1, i));
    el.scrollTo({ left: n * el.clientWidth, behavior: instant || reduced() ? "auto" : "smooth" });
    setIdx(n);
  }, [count]);
  useEffect(() => () => cancelAnimationFrame(raf.current), []);
  return { ref, idx, onScroll, go };
}

function Thumbs({ photos, idx, onPick, alt, big }) {
  const box = useRef(null);
  useEffect(() => {
    const el = box.current && box.current.children[idx];
    if (el && box.current) {
      const c = box.current;
      c.scrollTo({ left: el.offsetLeft - (c.clientWidth - el.clientWidth) / 2, behavior: reduced() ? "auto" : "smooth" });
    }
  }, [idx]);
  return (
    <div className={big ? "pg-thumbs pg-thumbs-big" : "pg-thumbs"} ref={box} role="tablist" aria-label="Мініатюри фото">
      {photos.map((p, i) => (
        <button key={i} type="button" role="tab" aria-selected={i === idx} aria-label={`Фото ${i + 1}`} className="pg-th" data-on={i === idx ? "1" : "0"} onClick={() => onPick(i)}>
          <img src={p} alt="" loading="lazy" decoding="async" draggable="false" />
        </button>
      ))}
    </div>
  );
}

function Lightbox({ photos, start, alt, onClose }) {
  const s = useSlider(photos.length, start);
  const closeRef = useRef(null);
  useLayoutEffect(() => {
    s.go(start, true);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    if (closeRef.current) closeRef.current.focus();
    return () => { document.body.style.overflow = prev; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    // capture + stopPropagation: Esc закриває лише перегляд фото, а не сторінку техніки під ним
    const onKey = (e) => {
      if (e.key === "Escape") { e.stopPropagation(); e.preventDefault(); onClose(); }
      else if (e.key === "ArrowRight") { e.stopPropagation(); s.go(s.idx + 1); }
      else if (e.key === "ArrowLeft") { e.stopPropagation(); s.go(s.idx - 1); }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [s, onClose]);
  return createPortal(
    <div className="pg-lb" role="dialog" aria-modal="true" aria-label={`Фото: ${alt}`}>
      <div className="pg-lb-bar">
        <span className="pg-count" aria-live="polite">{s.idx + 1} / {photos.length}</span>
        <button ref={closeRef} type="button" className="pg-close" onClick={onClose} aria-label="Закрити перегляд">×</button>
      </div>
      <div className="pg-track pg-track-lb" ref={s.ref} onScroll={s.onScroll}>
        {photos.map((p, i) => (
          <div className="pg-slide pg-slide-lb" key={i} aria-hidden={i !== s.idx}>
            <img src={p} alt={`${alt} — фото ${i + 1}`} decoding="async" draggable="false" />
          </div>
        ))}
      </div>
      {photos.length > 1 && (
        <>
          <button type="button" className="pg-arrow pg-prev" onClick={() => s.go(s.idx - 1)} disabled={s.idx === 0} aria-label="Попереднє фото">‹</button>
          <button type="button" className="pg-arrow pg-next" onClick={() => s.go(s.idx + 1)} disabled={s.idx === photos.length - 1} aria-label="Наступне фото">›</button>
          <Thumbs photos={photos} idx={s.idx} onPick={s.go} alt={alt} big />
        </>
      )}
    </div>,
    document.body
  );
}

export default function PhotoGallery({ photos, alt, empty, badge }) {
  const list = (photos || []).filter(Boolean);
  const s = useSlider(list.length);
  const [open, setOpen] = useState(false);
  if (list.length === 0) return <div className="lp-hero">{badge}{empty}</div>;
  const many = list.length > 1;
  const onKey = (e) => {
    if (e.key === "ArrowRight") { e.preventDefault(); s.go(s.idx + 1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); s.go(s.idx - 1); }
    else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpen(true); }
  };
  return (
    <div className="pg" aria-roledescription="carousel" aria-label={`Фото: ${alt}`}>
      {badge}
      <div className="pg-track" ref={s.ref} onScroll={s.onScroll} tabIndex={0} onKeyDown={onKey}>
        {list.map((p, i) => (
          <div className="pg-slide" key={i}>
            <img className="pg-bg" src={p} alt="" aria-hidden="true" loading={i === 0 ? "eager" : "lazy"} decoding="async" draggable="false" />
            <button type="button" className="pg-open" onClick={() => setOpen(true)} aria-label={`Відкрити фото ${i + 1} на весь екран`}>
              <img className="pg-img" src={p} alt={many ? `${alt} — фото ${i + 1} з ${list.length}` : alt} loading={i === 0 ? "eager" : "lazy"} decoding="async" draggable="false" />
            </button>
          </div>
        ))}
      </div>
      {many && <span className="pg-count pg-count-main" aria-live="polite">{s.idx + 1} / {list.length}</span>}
      <button type="button" className="pg-full" onClick={() => setOpen(true)}>{many ? `Усі фото (${list.length})` : "На весь екран"}</button>
      {many && (
        <>
          <button type="button" className="pg-arrow pg-prev" onClick={() => s.go(s.idx - 1)} disabled={s.idx === 0} aria-label="Попереднє фото">‹</button>
          <button type="button" className="pg-arrow pg-next" onClick={() => s.go(s.idx + 1)} disabled={s.idx === list.length - 1} aria-label="Наступне фото">›</button>
        </>
      )}
      {many && <Thumbs photos={list} idx={s.idx} onPick={s.go} alt={alt} />}
      {open && <Lightbox photos={list} start={s.idx} alt={alt} onClose={() => setOpen(false)} />}
    </div>
  );
}

// Мініатюрна карусель для карточок каталогу: гортається пальцем або стрілками, точки показують, скільки фото
export function CardCarousel({ photos, alt, onOpen, fallback }) {
  const list = (photos || []).filter(Boolean);
  const s = useSlider(list.length);
  if (list.length === 0) return <div className="cc cc-empty" onClick={onOpen}>{fallback}</div>;
  const many = list.length > 1;
  return (
    <div className="cc">
      <div className="cc-track" ref={s.ref} onScroll={s.onScroll}>
        {list.map((p, i) => (
          <div className="cc-slide" key={i} onClick={onOpen}>
            <img src={p} alt={i === 0 ? alt : `${alt} — фото ${i + 1}`} loading={i === 0 ? "eager" : "lazy"} decoding="async" draggable="false" />
          </div>
        ))}
      </div>
      {many && (
        <>
          <button type="button" className="cc-arrow cc-prev" onClick={(e) => { e.stopPropagation(); s.go(s.idx - 1); }} disabled={s.idx === 0} aria-label="Попереднє фото">‹</button>
          <button type="button" className="cc-arrow cc-next" onClick={(e) => { e.stopPropagation(); s.go(s.idx + 1); }} disabled={s.idx === list.length - 1} aria-label="Наступне фото">›</button>
          <div className="cc-dots" aria-hidden="true">{list.slice(0, 8).map((_, i) => <i key={i} data-on={i === s.idx ? "1" : "0"} />)}</div>
          <span className="cc-n">{s.idx + 1}/{list.length}</span>
        </>
      )}
    </div>
  );
}
