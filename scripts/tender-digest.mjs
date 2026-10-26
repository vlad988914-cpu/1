// Тижневий дайджест тендерів Prozorro (Миколаївська область) → Telegram.
// Запускається в GitHub Actions. Токен і chat id беруться тільки зі змінних середовища.
// Дані: пошук сайту prozorro.gov.ua (відкриті тендери замовників; приватних осіб тут немає).

const TOKEN = process.env.TG_REPORT_TOKEN;
const CHAT = process.env.TG_REPORT_CHAT;
const DRY = process.env.DRY_RUN === "1";
const DAYS = Number(process.env.DAYS || 7);
const MAXP = Number(process.env.MAXP || 8); // сторінок по 20 на запит
const SEARCH = "https://prozorro.gov.ua/api/search/tenders";

// Запуск за розкладом: працюємо лише о 9-й за Києвом (другий cron-запуск просто виходить).
if (process.env.GITHUB_EVENT_NAME === "schedule") {
  const h = Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Kyiv", hour: "2-digit", hour12: false }).format(new Date()));
  if (h !== 9) {
    console.log(`Київ ${h}:xx, не 9-та година, пропускаю`);
    process.exit(0);
  }
}

// Місцевість Миколаївської області (адреса замовника в пошуку без області, тому фільтруємо за текстом).
const MYK = /миколаї|вознесенськ|первомайськ|південноукраїнськ|южноукраїнськ|очаків|баштанк|снігурівк|нова одеса|новий буг|казанк|доманівк|братськ|веселинів|вітовськ|арбузинк|врадіївськ|кривоозер|березнегуват|жовтнев|корабельн|інгульськ|коблев|парутин|рибаківськ/i;

const CATEGORIES = [
  { name: "Дороги", icon: "🛣", q: ["ремонт дороги", "ремонт доріг", "ямковий ремонт", "асфальтобетонне покриття"] },
  { name: "Земляні роботи, котловани", icon: "⛏", q: ["земляні роботи", "котлован", "траншея", "планування території", "вивезення ґрунту"] },
  { name: "Демонтаж", icon: "🏚", q: ["демонтаж", "знесення будівлі"] },
  { name: "Бетон, фундаменти", icon: "🧱", q: ["бетонні роботи", "бетон", "фундамент"] },
  { name: "Покрівлі, дахи", icon: "🏠", q: ["ремонт покрівлі", "ремонт даху", "покрівля"] },
  { name: "Послуги техніки", icon: "🚜", q: ["послуги екскаватора", "оренда екскаватора", "послуги спецтехніки", "оренда автокрана", "послуги самоскида", "послуги навантажувача"] },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function search(body, tries = 3) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(SEARCH, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json",
          origin: "https://prozorro.gov.ua",
          referer: "https://prozorro.gov.ua/search/tender",
          "user-agent": "Mozilla/5.0",
        },
        body: JSON.stringify(body),
      });
      if (r.status === 422) return { status: 422, json: await r.json().catch(() => null) };
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return { status: r.status, json: await r.json() };
    } catch (e) {
      if (i === tries - 1) throw e;
      await sleep(1500 * (i + 1));
    }
  }
}

// Фільтр області на сервері: формат невідомий, "48" (код Миколаївської області) сервер приймає.
let regionValue = null;
for (const cand of ["48", "Миколаївська область", "UA-48"]) {
  try {
    const r = await search({ text: "ремонт", status: ["active.tendering"], region: cand }, 1);
    console.log("DIAG region", JSON.stringify(cand), "->", r.status, "total", r.json?.total ?? JSON.stringify(r.json?.errors || {}));
    if (r.status === 200) {
      regionValue = cand;
      for (const x of (r.json?.data || []).slice(0, 5)) {
        console.log("DIAG зразок:", JSON.stringify({ t: x.title, c: x.procuringEntity?.name, a: x.procuringEntity?.address }).slice(0, 300));
      }
      break;
    }
  } catch (e) {
    console.log("DIAG region помилка", cand, e.message);
  }
}
console.log("Фільтр області на сервері:", regionValue || "немає, фільтруємо локально");

const all = new Map(); // tenderID -> tender + cats
const now = Date.now();
for (const cat of CATEGORIES) {
  for (const q of cat.q) {
    let got = 0;
    for (let page = 0; page < MAXP; page++) {
      let res;
      try {
        res = await search({ text: q, status: ["active.tendering"], ...(page ? { page } : {}), ...(regionValue ? { region: regionValue } : {}) });
      } catch (e) {
        console.log("пропуск", q, page, e.message);
        break;
      }
      const d = res.json?.data || [];
      for (const t of d) {
        if (!t.tenderID) continue;
        const e = all.get(t.tenderID) || { ...t, cats: new Set() };
        e.cats.add(cat.name);
        all.set(t.tenderID, e);
      }
      got += d.length;
      if (d.length < 20) break;
      await sleep(150);
    }
    console.log(`DIAG запит "${q}": отримано ${got}`);
  }
}

const isMyk = (t) => {
  const pe = t.procuringEntity || {};
  const blob = [t.title, pe.name, pe.identifier?.legalName, pe.address?.locality, pe.address?.region].join(" ");
  return MYK.test(blob);
};
const mine = regionValue ? [...all.values()] : [...all.values()].filter(isMyk);
console.log(`Усього знайдено: ${all.size}, по Миколаївщині: ${mine.length}`);

const fmt = (n) => (n ? Math.round(n).toLocaleString("uk-UA").replace(/\s/g, " ") : "0");
const esc = (s) => String(s || "").replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c]));
const cut = (s, n) => (String(s).length > n ? String(s).slice(0, n - 1) + "…" : String(s));
const isNew = (t) => {
  const s = t.enquiryPeriod?.startDate;
  return s && now - new Date(s).getTime() <= DAYS * 864e5;
};

const date = new Date().toLocaleDateString("uk-UA");
const lines = [];
lines.push(`📊 <b>ТехМайданчик: ринок, Миколаївська обл.</b> (${date})`);
lines.push(`Відкриті тендери зараз: <b>${mine.length}</b>, нових за ${DAYS} днів: <b>${mine.filter(isNew).length}</b>`);
const total = mine.reduce((s, t) => s + (t.value?.amount || 0), 0);
lines.push(`Загальна сума: <b>${fmt(total)} грн</b>`);

for (const cat of CATEGORIES) {
  const list = mine.filter((t) => t.cats.has(cat.name)).sort((a, b) => (b.value?.amount || 0) - (a.value?.amount || 0));
  if (!list.length) {
    lines.push(`\n${cat.icon} <b>${cat.name}</b>: відкритих немає`);
    continue;
  }
  const sum = list.reduce((s, t) => s + (t.value?.amount || 0), 0);
  lines.push(`\n${cat.icon} <b>${cat.name}</b>: ${list.length} шт., ${fmt(sum)} грн`);
  for (const t of list.slice(0, 3)) {
    const end = t.tenderPeriod?.endDate ? new Date(t.tenderPeriod.endDate).toLocaleDateString("uk-UA") : "—";
    lines.push(`• ${esc(cut(t.title, 90))}\n  ${fmt(t.value?.amount)} грн · ${esc(cut(t.procuringEntity?.name || "", 60))} · до ${end}\n  https://prozorro.gov.ua/tender/${t.tenderID}`);
  }
}

// Найбільші замовники
const byCust = new Map();
for (const t of mine) {
  const n = t.procuringEntity?.name || "—";
  const c = byCust.get(n) || { n: 0, sum: 0 };
  c.n++; c.sum += t.value?.amount || 0;
  byCust.set(n, c);
}
const top = [...byCust.entries()].sort((a, b) => b[1].sum - a[1].sum).slice(0, 5);
if (top.length) {
  lines.push(`\n🏢 <b>Найбільші замовники</b>`);
  for (const [n, c] of top) lines.push(`• ${esc(cut(n, 70))}: ${c.n} шт., ${fmt(c.sum)} грн`);
}
// ===== Уся Україна: де зараз найбільше відкритих тендерів за напрямами =====
const REGIONS = { "05": "Вінницька", "07": "Волинська", "12": "Дніпропетровська", "14": "Донецька", "18": "Житомирська", "21": "Закарпатська", "23": "Запорізька", "26": "Івано-Франківська", "32": "Київська", "35": "Кіровоградська", "44": "Луганська", "46": "Львівська", "48": "Миколаївська", "51": "Одеська", "53": "Полтавська", "56": "Рівненська", "59": "Сумська", "61": "Тернопільська", "63": "Харківська", "65": "Херсонська", "68": "Хмельницька", "71": "Черкаська", "73": "Чернівецька", "74": "Чернігівська", "80": "м. Київ" };
const MAIN = { "Дороги": "ремонт доріг", "Земляні роботи, котловани": "земляні роботи", "Демонтаж": "демонтаж", "Бетон, фундаменти": "бетонні роботи", "Покрівлі, дахи": "ремонт покрівлі", "Послуги техніки": "послуги спецтехніки" };
lines.push(`\n🇺🇦 <b>Уся Україна: відкриті тендери за напрямами</b>`);
for (const cat of CATEGORIES) {
  const q = MAIN[cat.name];
  try {
    const nat = await search({ text: q, status: ["active.tendering"] });
    const natTotal = nat.json?.total ?? 0;
    const per = [];
    for (const [code, name] of Object.entries(REGIONS)) {
      try {
        const r = await search({ text: q, status: ["active.tendering"], region: code }, 2);
        if (r.status === 200 && r.json?.total) per.push([name, r.json.total]);
      } catch {}
      await sleep(100);
    }
    per.sort((a, b) => b[1] - a[1]);
    console.log(`DIAG Україна "${q}": ${natTotal}; по областях: ${per.length}`);
    const topR = per.slice(0, 5).map(([n, c]) => `${n} ${c}`).join(", ");
    lines.push(`\n${cat.icon} <b>${cat.name}</b> («${q}»): ${natTotal >= 10000 ? "10 000+" : natTotal}${topR ? `. Більше всього: ${topR}` : ""}`);
    const big = (nat.json?.data || []).filter((t) => t.tenderID).sort((a, b) => (b.value?.amount || 0) - (a.value?.amount || 0)).slice(0, 3);
    for (const t of big) {
      const loc = t.procuringEntity?.address?.locality || "";
      lines.push(`• ${esc(cut(t.title, 80))}\n  ${fmt(t.value?.amount)} грн · ${esc(cut(t.procuringEntity?.name || "", 50))}${loc ? " · " + esc(loc) : ""}\n  https://prozorro.gov.ua/tender/${t.tenderID}`);
    }
  } catch (e) {
    console.log("Україна: пропуск", q, e.message);
  }
}

// Найбільші відкриті тендери на послуги техніки по Україні
try {
  const rent = new Map();
  for (const q of ["послуги екскаватора", "оренда екскаватора", "послуги спецтехніки", "оренда автокрана", "послуги самоскида"]) {
    for (let page = 0; page < 3; page++) {
      const r = await search({ text: q, status: ["active.tendering"], ...(page ? { page } : {}) });
      const d = r.json?.data || [];
      for (const t of d) if (t.tenderID) rent.set(t.tenderID, t);
      if (d.length < 20) break;
      await sleep(150);
    }
  }
  const top = [...rent.values()].sort((a, b) => (b.value?.amount || 0) - (a.value?.amount || 0)).slice(0, 5);
  if (top.length) {
    lines.push(`\n🚜 <b>Найбільші відкриті тендери на послуги техніки (Україна)</b>`);
    for (const t of top) {
      const loc = t.procuringEntity?.address?.locality || t.procuringEntity?.name || "";
      lines.push(`• ${esc(cut(t.title, 80))}\n  ${fmt(t.value?.amount)} грн · ${esc(cut(loc, 50))}\n  https://prozorro.gov.ua/tender/${t.tenderID}`);
    }
  }
} catch (e) {
  console.log("Україна: техніка помилка", e.message);
}

lines.push(`\nДжерело: Prozorro (відкриті дані). Область визначено фільтром Prozorro (код 48), перевіряйте тендер на сторінці. Ціни за годину роботи техніки в такому списку не видно, лише загальні суми. Контакти замовника (контактна особа, телефон, email для закупівлі) є на сторінці кожного тендеру.`);

const text = lines.join("\n");
if (DRY || !TOKEN || !CHAT) {
  console.log(text);
  if (!DRY) { console.error("Немає TG_REPORT_TOKEN / TG_REPORT_CHAT"); process.exit(1); }
  process.exit(0);
}

// Telegram: до 4096 символів, ріжемо по рядках.
const chunks = [];
let cur = "";
for (const l of lines) {
  if ((cur + "\n" + l).length > 3800) { chunks.push(cur); cur = l; } else cur = cur ? cur + "\n" + l : l;
}
if (cur) chunks.push(cur);
for (const c of chunks) {
  const r = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: CHAT, text: c, parse_mode: "HTML", disable_web_page_preview: true }),
  });
  const out = await r.json();
  if (!out.ok) { console.error("Telegram:", out.description); process.exit(1); }
  await sleep(500);
}
console.log("Надіслано, повідомлень:", chunks.length);
