// Геометрія зон: усі координати — у пікселях ОРИГІНАЛЬНОГО зображення (див. hotspots.config.js).
// Нічого тут не залежить від React, тож це легко тестувати й повторно використовувати.

export const polyArea = (poly) =>
  Math.abs(poly.reduce((sum, [x1, y1], i) => {
    const [x2, y2] = poly[(i + 1) % poly.length];
    return sum + (x1 * y2 - x2 * y1);
  }, 0) / 2);

export function shapesBBox(shapes) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  shapes.forEach((poly) => poly.forEach(([x, y]) => {
    if (x < x0) x0 = x; if (y < y0) y0 = y;
    if (x > x1) x1 = x; if (y > y1) y1 = y;
  }));
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

// Розширює рамку на margin і вирівнює по цілих пікселях, не виходячи за межі зображення
export function inflateBBox(b, margin, size) {
  const x = Math.max(0, Math.floor(b.x - margin));
  const y = Math.max(0, Math.floor(b.y - margin));
  const r = Math.min(size.width, Math.ceil(b.x + b.w + margin));
  const bt = Math.min(size.height, Math.ceil(b.y + b.h + margin));
  return { x, y, w: r - x, h: bt - y };
}

export function pointInPolygon(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function distToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const len2 = dx * dx + dy * dy;
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

export function distToPolygon(x, y, poly) {
  if (pointInPolygon(x, y, poly)) return 0;
  let best = Infinity;
  for (let i = 0; i < poly.length; i++) {
    const [ax, ay] = poly[i];
    const [bx, by] = poly[(i + 1) % poly.length];
    best = Math.min(best, distToSegment(x, y, ax, ay, bx, by));
  }
  return best;
}

export const distToShapes = (x, y, shapes) => Math.min(...shapes.map((p) => distToPolygon(x, y, p)));

// Додає службові поля (площа, рамка) — потрібні для пріоритетів при перекритті зон
export function prepareHotspots(list) {
  return list.map((h) => ({
    ...h,
    _area: h.shapes.reduce((s, p) => s + polyArea(p), 0),
    _bbox: shapesBBox(h.shapes),
  }));
}

/**
 * Яка зона під курсором. Пріоритет: ті, що містять точку (менша площа — вища), далі найближчі в межах margin.
 * Так дрібні деталі (ковш, шланги) перемагають велику стрілу чи опору, що перекриваються з ними.
 */
export function hitTest(x, y, hotspots, margin = 6) {
  const hits = [];
  for (const h of hotspots) {
    const d = distToShapes(x, y, h.shapes);
    if (d <= (h.hitMargin ?? margin)) hits.push({ h, d });
  }
  if (!hits.length) return null;
  hits.sort((a, b) => {
    const aIn = a.d === 0, bIn = b.d === 0;
    if (aIn !== bIn) return aIn ? -1 : 1;
    if (!aIn && a.d !== b.d) return a.d - b.d;
    return a.h._area - b.h._area;
  });
  return hits[0].h;
}

// CSS clip-path polygon() у відсотках від рамки bbox
export const clipPolygon = (poly, bbox) =>
  `polygon(${poly.map(([x, y]) => `${(((x - bbox.x) / bbox.w) * 100).toFixed(3)}% ${(((y - bbox.y) / bbox.h) * 100).toFixed(3)}%`).join(",")})`;
