/**
 * Язык движения «ТехМайданчика»: тяжёлая техника — движения уверенные, без «резинки».
 * Правила (по Material Motion, web.dev, Motion.dev и правилу 100/300/500):
 *  • отклик на действие 160–280 мс, смена макета / окна 300–500 мс; больше 500 мс — только первое впечатление;
 *  • появление — ease-out (быстрый старт, мягкая посадка), уход — ease-in и ≈75% от длительности входа;
 *  • «ступеньки» (stagger) 50–70 мс, суммарно не больше 500 мс;
 *  • анимируем только transform и opacity (GPU), при prefers-reduced-motion — мягкое растворение.
 * Те же значения продублированы в motion.css как CSS-переменные.
 */
export const EASE = {
  out: [0.16, 1, 0.3, 1], // expo-out: появление
  outSoft: [0.25, 1, 0.5, 1], // quart-out: hover, состояния
  in: [0.7, 0, 0.84, 0], // уход
  inOut: [0.65, 0, 0.35, 1], // переключатели
};
export const EASE_CSS = {
  out: "cubic-bezier(0.16, 1, 0.3, 1)",
  outSoft: "cubic-bezier(0.25, 1, 0.5, 1)",
  in: "cubic-bezier(0.7, 0, 0.84, 0)",
  inOut: "cubic-bezier(0.65, 0, 0.35, 1)",
};
export const DUR = { fast: 0.16, base: 0.28, slow: 0.48, hero: 0.9 }; // секунды
export const EXIT_RATIO = 0.75;
export const STAGGER = { step: 0.06, cap: 0.5 };

/** Задержка i-го элемента в каскаде, но не больше cap (10 элементов × 50 мс = 500 мс — потолок). */
export const staggerDelay = (i, step = STAGGER.step, cap = STAGGER.cap) => Math.min(Math.max(0, i) * step, cap);

/** Уход быстрее входа: ≈75% его длительности. */
export const exitDuration = (enter) => Math.round(enter * EXIT_RATIO * 1000) / 1000;

/** Разбивает текст на слова для побуквенного/пословного появления; пробелы схлопываются. */
export const splitWords = (text) => String(text ?? "").split(/\s+/).filter(Boolean);

/** Ease-out-expo для счётчиков и ручных rAF-анимаций. */
export const easeOutExpo = (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));

/** Короткая запись числа для счётчика: 1234 → «1 234». */
export const formatCount = (n) => Math.round(n).toLocaleString("uk-UA");
