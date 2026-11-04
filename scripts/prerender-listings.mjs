// Статичні оголошення у HTML, щоб їх бачив Google без JavaScript:
//  • /katalog/<група>/ — блок «Оголошення власників» (id="owners");
//  • index.html — текст головної й останні оголошення всередині #root (React замінить їх після завантаження).
// Запуск після scripts/gen-seo-pages.mjs: npm run seo
// Дані: таблиця listings у Supabase тим самим публічним anon-ключем, що вже є в коді.
// Для перевірки без мережі: LISTINGS_FILE=шлях/до/listings.json node scripts/prerender-listings.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { GROUPS } from "../shared/models-data.js";
import { HOME_SEO } from "../shared/home-seo.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const PUBLIC = join(HERE, "..", "public");
const INDEX = join(HERE, "..", "index.html");
const SB_URL = process.env.VITE_SUPABASE_URL || "https://jsyjqudermvbylaweuqj.supabase.co";
const SB_KEY = process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_ShJs7HgeVml_QbQO5pvb1g_yCaWV8ai";
const SELECT = "id,type,brand,region,price,unit,available,created_at,specs";
const HOME_LIMIT = 12;
// категорії оренди з генератора (посилання для перелінковки з головної)
const ORENDA_CATS = [
  ["ekskavator", "Екскаватор"], ["mini-ekskavator", "Міні-екскаватор"], ["navantazhuvach", "Навантажувач"],
  ["samoskyd", "Самоскид"], ["kran", "Кран"], ["katok", "Каток"], ["buldozer", "Бульдозер"],
  ["manipulyator", "Маніпулятор"], ["avtovyshka", "Автовишка"], ["greider", "Грейдер"], ["gidromolot", "Гідромолот"],
];
const START = "<!--seo-static-start-->";
const END = "<!--seo-static-end-->";

async function loadListings() {
  if (process.env.LISTINGS_FILE) return JSON.parse(readFileSync(process.env.LISTINGS_FILE, "utf8"));
  const res = await fetch(`${SB_URL}/rest/v1/listings?select=${SELECT}&order=created_at.desc`, {
    headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
  });
  if (!res.ok) throw new Error(`Supabase відповів HTTP ${res.status}`);
  return res.json();
}
// Якщо база недоступна — попереджаємо і лишаємо блоки оголошень як є (їх підтягне JS);
// текст головної все одно записуємо статично.
async function loadListingsOrNull() {
  try {
    return await loadListings();
  } catch (e) {
    console.warn(`УВАГА: оголошення не завантажено (${e.message}). Текст головної оновлено, блоки оголошень не змінено.`);
    return null;
  }
}

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
// та сама нормалізація назв, що й у скриптах сторінок (щоб посилання «Дати й бронь» збігалися з JS-версією)
const TR = { "м": "m", "с": "c", "а": "a", "т": "t" };
const nm = (s) => String(s || "").toLowerCase().replace(/[мсат]/g, (c) => TR[c]).replace(/[^a-z0-9]/g, "");
function modelIn(models, brand) {
  const a = nm(brand);
  if (a.length < 5) return null;
  for (const m of models) {
    const x = nm(m.name);
    if (x.indexOf(a) > -1 || a.indexOf(x) > -1) return m.id;
  }
  return null;
}
const priceOf = (r) => (Number(r.price) > 0 ? `${esc(r.price)} ₴/${esc(r.unit)}` : "Договірна");
function specsOf(r) {
  if (!r.specs || typeof r.specs !== "object") return "";
  const keys = Object.keys(r.specs).filter((k) => k.charAt(0) !== "_" && r.specs[k] && r.specs[k] !== "—").slice(0, 6);
  return keys.length ? `<span class="sp">${keys.map((k) => `<i>${esc(k)}: <b>${esc(r.specs[k])}</b></i>`).join("")}</span>` : "";
}
function row(r, models, from) {
  const mid = modelIn(models, r.brand);
  const href = mid
    ? `/?model=${mid}&sel=${r.id}&from=${encodeURIComponent(from)}`
    : `/?tech=${r.id}&from=${encodeURIComponent(from)}`;
  return `<li><a class="orow" href="${esc(href)}"><span class="t"><b>${esc(r.brand)}</b><br><span class="mb">📍 ${esc(r.region)} · ${r.available ? "доступна" : "зараз зайнята"}</span></span><span class="op">${priceOf(r)}</span>${specsOf(r)}<span class="mm">Дати й бронь →</span></a></li>`;
}
const groupHref = (type) => {
  const g = GROUPS.find((x) => x.type === type);
  return g ? `/katalog/${g.slug}/` : "/katalog/";
};

function ownersHtml(group, listings) {
  const rows = listings.filter((r) => r.type === group.type);
  if (!rows.length) {
    return '<p class="ms">Оголошень цієї техніки поки немає. Залиште заявку — диспетчер підбере варіант, а власники відгукнуться на «Дошці оголошень».</p>';
  }
  return `<ul class="models">${rows.map((r) => row(r, group.models, `/katalog/${group.slug}/`)).join("")}</ul>`;
}

// сторінка моделі: лише оголошення цієї моделі (як у скрипті сторінки)
function modelOwnersHtml(group, model, listings) {
  const rows = listings.filter((r) => r.type === group.type && modelIn(group.models, r.brand) === model.id);
  if (!rows.length) {
    return '<p class="ms">Оголошень цієї моделі поки немає. Залиште заявку — диспетчер підбере таку або схожу техніку, а власники відгукнуться на «Дошці оголошень».</p>';
  }
  return `<ul class="models">${rows.map((r) => row(r, group.models, `/katalog/${group.slug}/${model.id}/`)).join("")}</ul>`;
}

function injectOwners(file, html) {
  const src = readFileSync(file, "utf8");
  const re = /(<div id="owners"[^>]*>)[\s\S]*?(<\/div>)/;
  if (!re.test(src)) throw new Error(`немає блоку #owners: ${file} (спершу запустіть gen-seo-pages.mjs)`);
  writeFileSync(file, src.replace(re, (_, open, close) => open + html + close));
}

function homeStaticHtml(listings) {
  const latest = listings ? listings.slice(0, HOME_LIMIT) : null;
  const text = HOME_SEO.sections
    .map((sec) => `<h3>${esc(sec.h)}</h3>${sec.ps.map((p) => `<p>${esc(p)}</p>`).join("")}`)
    .join("");
  const latestHtml = !latest
    ? ""
    : `<h2>Останні оголошення</h2>${latest.length
      ? `<ul>${latest.map((r) => `<li><a href="${esc(groupHref(r.type))}">${esc(r.brand)}</a>, ${esc(r.region)}: ${priceOf(r)}</li>`).join("")}</ul>`
      : "<p>Оголошень поки немає.</p>"}`;
  const cats = GROUPS.map((g) => `<li><a href="/katalog/${g.slug}/">${esc(g.name)}</a></li>`).join("");
  const orenda = ORENDA_CATS.map(([slug, name]) => `<li><a href="/orenda/${slug}/">${esc(name)}</a></li>`).join("");
  return `<main style="max-width:760px;margin:0 auto;padding:24px;color:#FFE6D0;font-family:Manrope,sans-serif;line-height:1.6">
<h1>Техніка знаходиться за годину, не за тиждень</h1>
<h2>${esc(HOME_SEO.title)}</h2>${text}
${latestHtml}
<h2>Техніка в каталозі</h2><ul>${cats}</ul>
<h2><a href="/orenda/">Оренда техніки за містами</a></h2><ul>${orenda}</ul>
<p><a href="/orenda/ekskavator-mykolaiv/">Оренда екскаватора у Миколаєві</a></p>
</main>`;
}

// лічильники «Є в оренду: N» у статиці (як у скрипті сторінки: лише для моделей з оголошеннями)
function injectAvail(file, group, listings) {
  const counts = {};
  for (const r of listings) {
    if (r.type !== group.type) continue;
    const mid = modelIn(group.models, r.brand);
    if (mid) counts[mid] = (counts[mid] || 0) + 1;
  }
  let src = readFileSync(file, "utf8");
  src = src.replace(/<span class="avail" data-avail="([^"]+)"><\/span>/g, (m, id) =>
    counts[id] ? `<span class="avail" data-avail="${id}">Є в оренду: ${counts[id]}</span>` : m);
  writeFileSync(file, src);
}

function injectHome(listings) {
  let html = readFileSync(INDEX, "utf8");
  const block = `<div id="root">${START}${homeStaticHtml(listings)}${END}</div>`;
  const marked = new RegExp(`<div id="root">${START}[\\s\\S]*?${END}</div>`);
  if (marked.test(html)) html = html.replace(marked, () => block);
  else if (html.includes('<div id="root"></div>')) html = html.replace('<div id="root"></div>', () => block);
  else throw new Error('в index.html не знайдено <div id="root"></div>');
  writeFileSync(INDEX, html);
}

const raw = await loadListingsOrNull();
const listings = raw && raw.slice().sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
if (listings) {
  for (const g of GROUPS) {
    injectOwners(join(PUBLIC, "katalog", g.slug, "index.html"), ownersHtml(g, listings));
    injectAvail(join(PUBLIC, "katalog", g.slug, "index.html"), g, listings);
    for (const m of g.models) {
      injectOwners(join(PUBLIC, "katalog", g.slug, m.id, "index.html"), modelOwnersHtml(g, m, listings));
    }
  }
  const models = GROUPS.reduce((n, g) => n + g.models.length, 0);
  console.log(`Оголошень: ${listings.length}; сторінок групи: ${GROUPS.length}; сторінок моделей: ${models}; головна: до ${HOME_LIMIT} останніх.`);
}
injectHome(listings);
