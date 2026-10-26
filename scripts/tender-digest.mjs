// Тижневий дайджест тендерів Prozorro (Миколаївська область) → Telegram.
// Запускається в GitHub Actions. Токен і chat id беруться тільки зі змінних середовища.
// Дані: відкритий API Prozorro (без ключа). Лише публічні тендери замовників, жодних приватних осіб.

const TOKEN = process.env.TG_REPORT_TOKEN;
const CHAT = process.env.TG_REPORT_CHAT;
const DRY = process.env.DRY_RUN === "1";
const DAYS = Number(process.env.DAYS || 7);
const REGION = /миколаїв/i;
const API = "https://public.api.openprocurement.org/api/2.5/tenders";

const KEYWORDS = [
  /дорог|асфальт|ямков|автошлях|вулиц/i,
  /демонтаж|знесення|руйнув/i,
  /котлован|траншей|земляні|ґрунт|грунт|планування|розчистк/i,
  /бетон|фундамент/i,
  /покрівл|дах(?:у|и|а|ів)?\b|кровл/i,
  /капітальн.*ремонт|поточн.*ремонт|реконструкц/i,
  /оренд.*(екскаватор|техніки|спецтехніки|автокран|самоскид)|послуги спецтехніки/i,
];
const CPV_OK = /^(4[5]|4[3]|7[1]|6[0])/; // будівництво/техніка, лише як підказка

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function getJson(url, tries = 3) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url, { headers: { accept: "application/json" } });
      if (!r.ok) throw new Error(`HTTP ${r.status} ${url}`);
      return await r.json();
    } catch (e) {
      if (i === tries - 1) throw e;
      await sleep(1500 * (i + 1));
    }
  }
}

const candidates = [];
const SEARCH = "https://prozorro.gov.ua/api/search/tenders";
async function search(body) {
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
  const raw = await r.text();
  let json = null;
  try { json = JSON.parse(raw); } catch {}
  return { status: r.status, json, raw };
}
const probes = [
  { text: "демонтаж", status: ["active.tendering"] },
  { text: "демонтаж", status: ["active.tendering"], region: ["UA-48"] },
  { text: "демонтаж", status: ["active.tendering"], region: [48] },
  { text: "демонтаж", status: ["active.tendering"], region: ["48"] },
  { text: "демонтаж", status: ["active.tendering"], region: ["Миколаївська область"] },
  { text: "демонтаж", status: ["active.tendering"], region: ["Миколаївська"] },
];
for (const b of probes) {
  try {
    const r = await search(b);
    const d = r.json?.data || [];
    console.log("DIAG", JSON.stringify(b), "->", r.status, "total", r.json?.total, "items", d.length, r.json?.errors ? JSON.stringify(r.json.errors) : "");
    if (r.status !== 200 && !r.json) console.log("DIAG raw:", r.raw.slice(0, 300));
    if (d[0]) console.log("DIAG keys:", Object.keys(d[0]).join(","));
    for (const x of d.slice(0, 3)) {
      console.log("DIAG item:", JSON.stringify({ id: x.id, tenderID: x.tenderID, title: x.title, status: x.status, value: x.value, addr: x.procuringEntity?.address, mod: x.dateModified, tp: x.tenderPeriod }).slice(0, 450));
    }
  } catch (e) {
    console.log("DIAG помилка:", JSON.stringify(b), e.message);
  }
}
const found = [];
for (const id of candidates) {
  try {
    const { data: t } = await getJson(`${API}/${id}`);
    const addr = t.procuringEntity?.address || {};
    const region = `${addr.region || ""} ${addr.locality || ""}`;
    const itemRegions = (t.items || []).map((i) => i.deliveryAddress?.region || "").join(" ");
    if (!REGION.test(region) && !REGION.test(itemRegions)) continue;
    if (!["active.tendering", "active.enquiries"].includes(t.status)) continue;
    found.push({
      title: t.title,
      customer: t.procuringEntity?.name,
      amount: t.value?.amount,
      cur: t.value?.currency || "UAH",
      end: t.tenderPeriod?.endDate,
      id: t.tenderID,
      link: `https://prozorro.gov.ua/tender/${t.tenderID}`,
    });
    await sleep(120);
  } catch (e) {
    console.log("пропуск", id, e.message);
  }
}
found.sort((a, b) => (b.amount || 0) - (a.amount || 0));

const fmt = (n) => (n ? Math.round(n).toLocaleString("uk-UA").replace(/\s/g, " ") : "—");
const esc = (s) => String(s || "").replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c]));
const date = new Date().toLocaleDateString("uk-UA");
let msg = `📊 <b>ТехМайданчик: тендери, Миколаївська обл.</b> (${date})\n`;
if (!found.length) {
  msg += `\nЗа ${DAYS} днів відкритих тендерів за ключовими словами не знайдено.`;
} else {
  msg += `\nВідкриті тендери зараз: ${found.length}\n`;
  for (const t of found.slice(0, 10)) {
    msg += `\n• <b>${esc(t.title).slice(0, 140)}</b>\n  ${fmt(t.amount)} ${t.cur} · ${esc(t.customer).slice(0, 80)}\n`;
    if (t.end) msg += `  Подача до ${new Date(t.end).toLocaleDateString("uk-UA")}\n`;
    msg += `  ${t.link}\n`;
  }
  if (found.length > 10) msg += `\n…і ще ${found.length - 10} на prozorro.gov.ua`;
}
msg += `\n\nДжерело: Prozorro (відкриті дані). Перевіряйте умови на сторінці тендеру.`;

if (DRY || !TOKEN || !CHAT) {
  console.log(msg);
  if (!DRY) { console.error("Немає TG_REPORT_TOKEN / TG_REPORT_CHAT"); process.exit(1); }
  process.exit(0);
}
const r = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ chat_id: CHAT, text: msg.slice(0, 4000), parse_mode: "HTML", disable_web_page_preview: true }),
});
const out = await r.json();
if (!out.ok) { console.error("Telegram:", out.description); process.exit(1); }
console.log("Надіслано");
