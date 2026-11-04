// Перевіряє meta description у згенерованих SEO-сторінках (запускати після scripts/gen-seo-pages.mjs)
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "public");

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

const pages = walk(ROOT).filter((f) => f.endsWith("index.html"));
const inOrenda = (f) => relative(ROOT, f).split(sep)[0] === "orenda";
const descOf = (file) => {
  const m = readFileSync(file, "utf8").match(/<meta name="description" content="([^"]*)"/);
  return m ? m[1].replace(/&quot;/g, '"').replace(/&amp;/g, "&") : null;
};

test("/orenda/ pages have meta description", () => {
  const orenda = pages.filter(inOrenda);
  assert.ok(orenda.length > 0, `немає сторінок /orenda/ у ${ROOT} (знайдено index.html: ${pages.length}) — спочатку запустіть генератор`);
  for (const f of orenda) assert.ok(descOf(f), `немає description: ${f}`);
});

test("meta descriptions are not truncated and fit 160 characters", () => {
  for (const f of pages) {
    const d = descOf(f);
    if (d === null) continue;
    assert.ok(!d.endsWith("…"), `обрізано «…»: ${f}`);
    assert.ok(d.length <= 160, `довше 160 (${d.length}): ${f}`);
  }
});

test("meta descriptions on /orenda/ are unique", () => {
  const orenda = pages.filter(inOrenda);
  const seen = new Map();
  for (const f of orenda) {
    const d = descOf(f);
    assert.ok(!seen.has(d), `однаковий description у ${f} і ${seen.get(d)}`);
    seen.set(d, f);
  }
});

// Додаткові перевірки: каталог, текст головної, граматика, дубль бренду
const katalog = pages.filter((f) => relative(ROOT, f).split(sep)[0] === "katalog");
test("/katalog/ descriptions end with punctuation (no mid-word cut)", () => {
  for (const f of katalog) {
    const d = descOf(f);
    if (d === null) continue;
    assert.match(d, /[.!?]$/, `опис не завершено: ${f}`);
  }
});

test("/katalog/ descriptions have no doubled brand and no wrong plural", () => {
  for (const f of katalog) {
    const d = descOf(f);
    if (!d) continue;
    assert.doesNotMatch(d, /\b(\S+) \1\b/, `повтор слова в описі: ${f}`);
    assert.doesNotMatch(d, /\b1 моделей\b/, `граматика: ${f}`);
  }
});

test("home text is 300–400 words", async () => {
  const { HOME_SEO } = await import("../shared/home-seo.js");
  const words = HOME_SEO.sections
    .flatMap((s) => [s.h, ...s.ps])
    .join(" ")
    .split(/\s+/)
    .filter((w) => /[\p{L}\p{N}]/u.test(w));
  assert.ok(words.length >= 300 && words.length <= 400, `слів: ${words.length}`);
});

test("home text names no city without a dedicated page", async () => {
  const { HOME_SEO } = await import("../shared/home-seo.js");
  const text = HOME_SEO.sections.flatMap((s) => s.ps).join(" ");
  assert.doesNotMatch(text, /Дніпр|Львів|Одес/, "у тексті головної названо місто без підтвердженої бази");
});
