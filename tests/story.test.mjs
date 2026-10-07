// Запуск: npm test — перевіряє логіку сцени прокрутки (час відео, етапи, прогрес, згладжування).
import test from "node:test";
import assert from "node:assert/strict";
import { defaultStory } from "../src/story/story.config.js";
import { timeAt, stageAt, progressOf, scrollTargetFor, follow, clamp01 } from "../src/story/story.logic.js";

const { stops, stages, video } = defaultStory;

test("час відео в опорних точках збігається з налаштуванням", () => {
  for (const s of stops) assert.ok(Math.abs(timeAt(s.at, stops) - s.time) < 1e-9, `at=${s.at}`);
  assert.equal(timeAt(-1, stops), stops[0].time);
  assert.equal(timeAt(2, stops), stops[stops.length - 1].time);
});

test("час відео не спадає при прокрутці вниз і не виходить за межі ролика", () => {
  let prev = -1;
  for (let i = 0; i <= 1000; i++) {
    const t = timeAt(i / 1000, stops);
    assert.ok(t >= prev - 1e-9, `спад на ${i / 1000}`);
    assert.ok(t >= 0 && t <= video.duration, `поза роликом: ${t}`);
    prev = t;
  }
});

test("паузи: поки етап читається, кадр не рухається", () => {
  assert.equal(timeAt(0.05, stops), 0);
  assert.equal(timeAt(0.38, stops), 5.8); // ковш
  assert.equal(timeAt(0.62, stops), 8.8); // стріла
  assert.equal(timeAt(0.95, stops), 12.0); // кабіна
});

test("етапи покривають весь прогрес без дірок і в правильному порядку", () => {
  assert.equal(stages[0].range[0], 0);
  for (let i = 1; i < stages.length; i++) assert.equal(stages[i].range[0], stages[i - 1].range[1], `стик ${i}`);
  assert.ok(stages[stages.length - 1].range[1] > 1);
  assert.deepEqual(stages.map((s) => s.id), ["machine", "bucket", "boom", "cab"]);
  const idx = (p) => stageAt(p, stages);
  assert.deepEqual([0, 0.1, 0.2, 0.4, 0.6, 0.8, 1].map(idx), [0, 0, 1, 1, 2, 3, 3]);
});

test("кожен етап «показує» свою частину техніки", () => {
  // у середині діапазону етапу відео стоїть там, де камера на потрібній деталі
  const mid = (i) => (stages[i].range[0] + Math.min(1, stages[i].range[1])) / 2;
  assert.ok(timeAt(mid(1), stops) > 4 && timeAt(mid(1), stops) < 7, "ковш: 4–7 с");
  assert.ok(timeAt(mid(2), stops) > 7.5 && timeAt(mid(2), stops) < 10, "стріла: 7,5–10 с");
  assert.ok(timeAt(mid(3), stops) > 10.5, "кабіна: після 10,5 с");
});

test("прогрес секції: початок, середина, кінець; без липкості — 0", () => {
  const vh = 800;
  assert.equal(progressOf({ top: 0, height: 4000 }, vh), 0);
  assert.equal(progressOf({ top: 100, height: 4000 }, vh), 0);
  assert.equal(progressOf({ top: -1600, height: 4000 }, vh), 0.5);
  assert.equal(progressOf({ top: -3200, height: 4000 }, vh), 1);
  assert.equal(progressOf({ top: -9999, height: 4000 }, vh), 1);
  assert.equal(progressOf({ top: -50, height: 700 }, vh), 0);
});

test("клік по рейці веде в діапазон потрібного етапу", () => {
  const top = 1000, H = 4320, vh = 900;
  for (let i = 0; i < stages.length; i++) {
    const y = scrollTargetFor(i, stages, top, H, vh);
    const p = clamp01((y - top) / (H - vh));
    assert.equal(stageAt(p, stages), i, `етап ${i}`);
  }
});

test("згладжування наздоганяє ціль незалежно від частоти кадрів", () => {
  const run = (dt, ms) => { let c = 0; for (let t = 0; t < ms; t += dt) c = follow(c, 10, dt); return c; };
  const a = run(16.7, 600), b = run(8.3, 600), c = run(100, 600);
  assert.ok(Math.abs(a - b) < 0.1 && Math.abs(a - c) < 0.2, `${a} ${b} ${c}`);
  assert.ok(a > 9.9);
  assert.equal(follow(5, 5, 16), 5);
});
