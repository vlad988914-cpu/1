// Запуск: npm test   (або: node --test tests/hero.test.mjs)
// Перевіряє дані героя: контури, камеру, пріоритети наведення. Без зовнішніх залежностей.
import test from "node:test";
import assert from "node:assert/strict";
import { hotspots, heroImage } from "../src/hero/hotspots.config.js";
import { prepareHotspots, hitTest, pointInPolygon, distToPolygon, polyArea, shapesBBox } from "../src/hero/geometry.js";
import { cameraTarget, baseFocus, projectPoint, unprojectPoint } from "../src/hero/camera.js";

const hs = prepareHotspots(hotspots);

test("кожна зона має обов'язкові поля", () => {
  const ids = new Set();
  for (const h of hotspots) {
    assert.ok(h.id && !ids.has(h.id), `унікальний id: ${h.id}`);
    ids.add(h.id);
    for (const k of ["label", "description"]) assert.ok(typeof h[k] === "string" && h[k].length > 0, `${h.id}.${k}`);
    assert.ok(Array.isArray(h.shapes) && h.shapes.length > 0, `${h.id}.shapes`);
    assert.ok(h.camera && h.camera.zoom >= 1, `${h.id}.camera`);
    assert.ok(h.anchor && Number.isFinite(h.anchor.x), `${h.id}.anchor`);
    assert.ok(["left", "right"].includes(h.tooltip.side), `${h.id}.tooltip.side`);
  }
  assert.equal(hotspots.length, 7);
});

test("тексти зон збігаються із завданням", () => {
  const t = Object.fromEntries(hotspots.map((h) => [h.id, [h.label, h.description]]));
  assert.deepEqual(t.bucket, ["КОВШ", "Розробка ґрунту"]);
  assert.deepEqual(t.hydraulics, ["ГІДРАВЛІКА", "Потужна гідравлічна система"]);
  assert.deepEqual(t.boom, ["СТРІЛА", "Максимальна робоча зона"]);
  assert.deepEqual(t.cab, ["КАБІНА ОПЕРАТОРА", "Комфорт + контроль"]);
  assert.deepEqual(t.wheels, ["ХОДОВА", "Колісне шасі"]);
  assert.deepEqual(t.engine, ["ДВИГУН", "Надійність для важких робіт"]);
  assert.deepEqual(t.stabilizer, ["ОПОРА", "Стабільність під час роботи"]);
});

test("усі контури лежать у межах зображення і не вироджені", () => {
  for (const h of hotspots) for (const poly of h.shapes) {
    assert.ok(poly.length >= 4, `${h.id}: мало точок`);
    assert.ok(polyArea(poly) > 100, `${h.id}: площа`);
    for (const [x, y] of poly) assert.ok(x >= 0 && x <= heroImage.width && y >= 0 && y <= heroImage.height, `${h.id}: точка поза кадром ${x},${y}`);
  }
});

test("якір підказки та центр камери — всередині зображення", () => {
  for (const h of hotspots) {
    assert.ok(h.anchor.x >= 0 && h.anchor.x <= heroImage.width && h.anchor.y >= 0 && h.anchor.y <= heroImage.height, h.id);
    assert.ok(h.camera.x >= 0 && h.camera.x <= heroImage.width && h.camera.y >= 0 && h.camera.y <= heroImage.height, h.id);
  }
});

test("наведення знаходить правильну зону; небо й ґрунт — порожньо", () => {
  const probes = { bucket: [590, 480], hydraulics: [555, 190], boom: [330, 430], cab: [372, 690], wheels: [78, 900], engine: [110, 745], stabilizer: [330, 870] };
  for (const [id, [x, y]] of Object.entries(probes)) assert.equal(hitTest(x, y, hs)?.id, id, id);
  assert.equal(hitTest(120, 300, hs), null);
  assert.equal(hitTest(300, 1150, hs), null);
});

test("при перекритті виграє менша зона (двигун над п'ятою стріли)", () => {
  // точка в зоні перекриття двигуна та п'яти стріли
  const x = 215, y = 740;
  assert.ok(pointInPolygon(x, y, hotspots.find((h) => h.id === "engine").shapes[0]));
  assert.ok(pointInPolygon(x, y, hotspots.find((h) => h.id === "boom").shapes[0]));
  assert.equal(hitTest(x, y, hs).id, "engine");
});

test("допуск навколо тонких деталей: шланг ловиться біля краю", () => {
  assert.equal(hitTest(580, 150, hs)?.id, "hydraulics");
  assert.ok(distToPolygon(580, 150, hotspots.find((h) => h.id === "hydraulics").shapes[1]) > 0);
});

test("камера: центрує зону, не виходить за межі зображення, проєкція оборотна", () => {
  const vw = 560, vh = 802;
  const base = cameraTarget({ vw, vh, image: heroImage, focus: baseFocus(heroImage) });
  assert.equal(base.s, heroImage.baseZoom);
  assert.ok(base.x <= 0 && base.y <= 0);
  for (const h of hotspots) {
    const t = cameraTarget({ vw, vh, image: heroImage, focus: h.camera });
    assert.ok(t.x <= 0 && t.x >= vw - t.worldW * t.s - 1e-6, `${h.id}: x у межах`);
    assert.ok(t.y <= 0 && t.y >= vh - t.worldH * t.s - 1e-6, `${h.id}: y у межах`);
    // центр зони видно в кадрі
    const p = projectPoint(h.camera.x, h.camera.y, t, t, heroImage);
    assert.ok(p.x > 0 && p.x < vw && p.y > 0 && p.y < vh, `${h.id}: центр камери у кадрі`);
    const back = unprojectPoint(p.x, p.y, t, t, heroImage);
    assert.ok(Math.abs(back.x - h.camera.x) < 1e-6 && Math.abs(back.y - h.camera.y) < 1e-6, `${h.id}: оборотність`);
  }
});

test("кожну зону після зуму видно повністю або майже повністю", () => {
  const vw = 560, vh = 802;
  for (const h of hotspots) {
    const t = cameraTarget({ vw, vh, image: heroImage, focus: h.camera });
    const b = shapesBBox(h.shapes);
    const a = projectPoint(b.x, b.y, t, t, heroImage);
    const z = projectPoint(b.x + b.w, b.y + b.h, t, t, heroImage);
    const visW = Math.min(z.x, vw) - Math.max(a.x, 0), visH = Math.min(z.y, vh) - Math.max(a.y, 0);
    const share = (Math.max(visW, 0) * Math.max(visH, 0)) / ((z.x - a.x) * (z.y - a.y));
    assert.ok(share > 0.6, `${h.id}: у кадрі лише ${(share * 100) | 0}%`);
  }
});
