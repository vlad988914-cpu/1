// Тижневий дайджест тендерів Prozorro (Миколаївська область) → Telegram.
// Запускається в GitHub Actions. Токен і chat id беруться тільки зі змінних середовища.
// Дані: пошук сайту prozorro.gov.ua (відкриті тендери замовників; приватних осіб тут немає).

const TOKEN = process.env.TG_REPORT_TOKEN;
const CHAT = process.env.TG_REPORT_CHAT;
const DRY = process.env.DRY_RUN === "1";
const DAYS = Number(process.env.DAYS || 7);
const MAXP = Number(process.env.MAXP || 8); // сторінок по 20 на запит
const SEARCH = "https://prozorro.gov.ua/api/search/tenders";

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

// Чи приймає пошук фільтр за областю (формат невідомий, пробуємо кілька і логуємо результат).
let regionValue = null;
for (const cand of ["Миколаївська область", "Миколаївська", "UA-48", "48", "Миколаївська обл."]) {
  try {
    const r = await search({ text: "демонтаж", status: ["active.tendering"], region: cand }, 1);
    console.log("DIAG region", JSON.stringify(cand), "->", r.status, r.json?.total ?? JSON.stringify(r.json?.errors || {}));
    if (r.status === 200 && r.json?.total) { regionValue = cand; break; }
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
        res = await search({ text: q, status: ["active.tendering"], page, ...(regionValue ? { region: regionValue } : {}) });
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
const mine = [...all.values()].filter(isMyk);
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
lines.push(`\nДжерело: Prozorro (відкриті дані). Область визначено за адресою та назвою замовника, тож перевіряйте тендер на сторінці. Ціни за годину роботи техніки в такому списку не видно, лише загальні суми.`);

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
