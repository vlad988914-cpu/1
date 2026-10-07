// «Камера» героя: чиста математика перетворення зображення → екран.
// Світ (зображення) має розмір worldW × worldH px і малюється з transform: translate(x, y) scale(s), origin 0 0.

const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);

export function worldSize(vw, image) {
  const worldW = vw * (image.width / image.window.w);
  return { worldW, worldH: (worldW * image.height) / image.width };
}

// Кадр за замовчуванням: центр видимого вікна зображення з невеликим запасом (щоб паралакс не відкривав краї)
export const baseFocus = (image) => ({
  x: image.window.x + image.window.w / 2,
  y: image.window.y + image.window.h / 2,
  zoom: image.baseZoom ?? 1.06,
});

export function cameraTarget({ vw, vh, image, focus }) {
  const world = worldSize(vw, image);
  const z = focus.zoom;
  const x = clamp(vw / 2 - (focus.x / image.width) * world.worldW * z, vw - world.worldW * z, 0);
  const y = clamp(vh / 2 - (focus.y / image.height) * world.worldH * z, vh - world.worldH * z, 0);
  return { x, y, s: z, ...world };
}

export const projectPoint = (px, py, cam, world, image) => ({
  x: cam.x + (px / image.width) * world.worldW * cam.s,
  y: cam.y + (py / image.height) * world.worldH * cam.s,
});

export const unprojectPoint = (sx, sy, cam, world, image) => ({
  x: ((sx - cam.x) / cam.s / world.worldW) * image.width,
  y: ((sy - cam.y) / cam.s / world.worldH) * image.height,
});
