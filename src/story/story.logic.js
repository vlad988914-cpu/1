// Чиста логіка сцени прокрутки: прогрес секції → час відео → активна підпис. Без React, тестується окремо.
export const clamp01 = (v) => Math.min(1, Math.max(0, v));
const smooth = (t) => t * t * (3 - 2 * t);

/** Прогрес 0..1 всередині секції висотою H, поки її липкий екран (висота vh) «стоїть» на місці. */
export function progressOf(rect, vh) {
  const span = rect.height - vh;
  return span > 0 ? clamp01(-rect.top / span) : 0;
}

/**
 * Час відео для прогресу p. stops = [{ at, time }, ...] за зростанням at.
 * Між опорами рух плавний (smoothstep), між однаковими time — «зупинка» (кадр тримається, поки читаємо підпис).
 */
export function timeAt(p, stops) {
  if (!stops.length) return 0;
  if (p <= stops[0].at) return stops[0].time;
  for (let i = 1; i < stops.length; i++) {
    const a = stops[i - 1];
    const b = stops[i];
    if (p <= b.at) {
      const t = b.at === a.at ? 1 : (p - a.at) / (b.at - a.at);
      return a.time + (b.time - a.time) * smooth(t);
    }
  }
  return stops[stops.length - 1].time;
}

/** Індекс активного етапу за прогресом. */
export function stageAt(p, stages) {
  for (let i = 0; i < stages.length; i++) if (p < stages[i].range[1]) return i;
  return stages.length - 1;
}

/** Куди прокрутити, щоб етап i був по центру свого діапазону (для кліку по рейці). */
export function scrollTargetFor(i, stages, sectionTop, sectionHeight, vh) {
  const [a, b] = stages[i].range;
  const mid = i === 0 ? a + 0.02 : (a + b) / 2;
  return Math.round(sectionTop + mid * (sectionHeight - vh));
}

/** Згладжування «наздоганяє» ціль незалежно від частоти кадрів: k = 1 - e^(−dt/τ). */
export const follow = (cur, target, dtMs, tau = 90) => cur + (target - cur) * (1 - Math.exp(-Math.max(0, dtMs) / tau));
