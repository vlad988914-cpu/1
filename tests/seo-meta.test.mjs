// Перевіряє meta description у згенерованих SEO-сторінках (запускати після scripts/gen-seo-pages.mjs)
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "public");

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

const pages = walk(ROOT).filter((f) => f.endsWith("index.html"));
const descOf = (file) => {
  const m = readFileSync(file, "utf8").match(/<meta name="description" content="([^"]*)"/);
  return m ? m[1].replace(/&quot;/g, '"').replace(/&amp;/g, "&") : null;
};

test("/orenda/ pages have meta description", () => {
  const orenda = pages.filter((f) => f.startsWith(join(ROOT, "orenda") + sep));
  assert.ok(orenda.length > 0, "немає сторінок /orenda/ — спочатку запустіть генератор");
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
  const orenda = pages.filter((f) => f.startsWith(join(ROOT, "orenda") + sep));
  const seen = new Map();
  for (const f of orenda) {
    const d = descOf(f);
    assert.ok(!seen.has(d), `однаковий description у ${f} і ${seen.get(d)}`);
    seen.set(d, f);
  }
});
