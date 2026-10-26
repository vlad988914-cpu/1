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

const since = new Date(Date.now() - DAYS * 864e5).toISOString();
let url = `${API}?descending=0&limit=1000&offset=${encodeURIComponent(since)}&opt_fields=title,status`;
const candidates = [];
let pages = 0;
while (url && pages < 40) {
  const j = await getJson(url);
  pages++;
  if (pages === 1) {
    const d = j.data || [];
    console.log("DIAG перша сторінка:", url);
    console.log("DIAG елементів:", d.length, "з title:", d.filter((x) => x.title).length);
    console.log("DIAG приклад:", JSON.stringify(d.slice(0, 2)));
    console.log("DIAG next_page:", j.next_page?.uri);
  }
  for (const t of j.data || []) {
    if (KEYWORDS.some((k) => k.test(t.title || ""))) candidates.push(t.id);
  }
  const next = j.next_page?.uri;
  if (!next || !(j.data || []).length) break;
  url = next.includes("opt_fields") ? next : next + "&opt_fields=title,status";
}
console.log(`Сторінок: ${pages}, кандидатів за ключовими словами: ${candidates.length}`);
try {
  const last = await getJson(url);
  const d = last.data || [];
  console.log("DIAG остання сторінка: елементів", d.length, "dateModified", d[d.length - 1]?.dateModified);
} catch (e) {
  console.log("DIAG остання сторінка помилка:", e.message);
}
for (const probe of [
  "https://prozorro.gov.ua/api/search/tenders?text=%D0%B4%D0%B5%D0%BC%D0%BE%D0%BD%D1%82%D0%B0%D0%B6&status=active.tendering",
]) {
  try {
    const r = await fetch(probe, { headers: { accept: "application/json" } });
    const t = await r.text();
    console.log("DIAG probe", r.status, t.slice(0, 700).replace(/\s+/g, " "));
  } catch (e) {
    console.log("DIAG probe помилка:", e.message);
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
