// Генерує статичні SEO-сторінки: /orenda/, /orenda/<техніка>/, /orenda/<техніка>-<місто>/ + sitemap.xml
// Запуск: node scripts/gen-seo-pages.mjs   (адреса сайту: SITE_URL=https://ваш-домен.ua node scripts/gen-seo-pages.mjs)
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SITE = (process.env.SITE_URL || "https://www.tehmaydan.com").replace(/\/$/, "");
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "public");
const PHONE = "+380981319725", PHONE_FMT = "+380 98 131 97 25", EMAIL = "demolis@ukr.net";

const CATS = [
  { slug: "ekskavator", name: "Екскаватор", gen: "екскаватора", plural: "екскаватори",
    tasks: ["риття котлованів і траншей під фундамент та комунікації", "планування ділянки й вивантаження ґрунту", "демонтаж і розбирання конструкцій (з гідромолотом)", "завантаження сипких матеріалів"],
    pick: ["об'єм ковша та глибина копання", "колісний чи гусеничний хід (колісний — по асфальту, гусеничний — по розмоклому ґрунту)", "наявність гідромолота або додаткового обладнання", "чи потрібен оператор"],
    faq: [["Колісний чи гусеничний екскаватор обрати?", "Колісний швидше переїжджає між об'єктами й не руйнує асфальт. Гусеничний стійкіший на слабкому ґрунті та схилах. Якщо не впевнені — опишіть умови майданчика, диспетчер підкаже."], ["Чи можна орендувати з оператором?", "Так, у заявці вкажіть, що потрібен оператор. Умови уточнює власник техніки."]] },
  { slug: "navantazhuvach", name: "Навантажувач", gen: "навантажувача", plural: "навантажувачі",
    tasks: ["завантаження та розвантаження сипких матеріалів (пісок, щебінь, ґрунт)", "переміщення піддонів і вантажів на складі чи об'єкті", "розчищення території, прибирання снігу", "подача матеріалів на будівельний майданчик"],
    pick: ["вантажопідйомність і висота підйому", "тип навісного обладнання: ківш, вили, щітка", "фронтальний чи телескопічний", "чи потрібен оператор"],
    faq: [["Яка вантажопідйомність потрібна?", "Орієнтуйтеся на вагу найважчого піддона або об'єм ковша за годину роботи. Диспетчер допоможе підібрати за вашою задачею."], ["Чи є навісне обладнання?", "Залежить від власника техніки. Вкажіть потрібне обладнання в заявці."]] },
  { slug: "samoskyd", name: "Самоскид", gen: "самоскида", plural: "самоскиди",
    tasks: ["вивезення будівельного сміття та ґрунту", "доставка піску, щебеню, гравію", "перевезення вантажів на об'єкт без перевантажень", "підвіз матеріалів до місця роботи екскаватора"],
    pick: ["вантажопідйомність і об'єм кузова", "кількість рейсів і відстань", "чи дозволений в'їзд на об'єкт за габаритами", "тип вантажу"],
    faq: [["Як розраховується вартість?", "Залежить від умов власника: за годину, за зміну або за рейс. Це вказується в оголошенні та узгоджується до підтвердження."], ["Скільки самоскидів потрібно на об'єкт?", "Залежить від обсягу й відстані. Опишіть задачу в заявці, диспетчер підкаже реалістичну кількість рейсів."]] },
  { slug: "kran", name: "Кран", gen: "крана", plural: "крани",
    tasks: ["монтаж будівельних конструкцій і плит", "підйом і подача матеріалів на висоту", "розвантаження великогабаритних вантажів", "монтаж обладнання на об'єкті"],
    pick: ["вантажопідйомність на потрібному виносі стріли", "висота підйому та виліт стріли", "тип крана (автокран, на гусеничному ходу)", "майданчик для встановлення й підʼїзд"],
    faq: [["Яку вантажопідйомність обрати?", "Дивіться не на максимальну цифру, а на вантажопідйомність на потрібному виносі стріли. Це вказується в характеристиках від власника."], ["Чи потрібен окремий дозвіл?", "Вимоги до робіт з підйому вантажів визначає законодавство та умови об'єкта. Уточнюйте у власника техніки й відповідального за роботи."]] },
  { slug: "katok", name: "Каток", gen: "котка", plural: "котки",
    tasks: ["ущільнення основи під асфальт і бруківку", "ущільнення щебеню та піщаних шарів", "ремонт дорожнього покриття", "облаштування майданчиків і паркінгів"],
    pick: ["вага катка й тип вальця (гладкий, кулачковий)", "вібраційний чи статичний", "площа та тип ґрунту або покриття", "чи потрібен оператор"],
    faq: [["Який каток потрібен для ущільнення ґрунту?", "Для зв'язних ґрунтів зазвичай використовують кулачкові вальці, для щебеню й асфальту — гладкі. Опишіть задачу, і диспетчер підбере варіант."], ["Чи є вібрація?", "Вкажіть у заявці, вам потрібен вібраційний каток чи статичний. Наявність уточнюйте в оголошенні."]] },
  { slug: "buldozer", name: "Бульдозер", gen: "бульдозера", plural: "бульдозери",
    tasks: ["планування великих ділянок і підготовка майданчика", "розчищення території від ґрунту, дерев і залишків споруд", "насипання й розрівнювання ґрунту", "прокладання тимчасових доріг"],
    pick: ["потужність і тип відвалу", "площа і глибина робіт", "стан ґрунту (суха чи розмокла земля)", "чи потрібен оператор"],
    faq: [["Чим бульдозер відрізняється від екскаватора?", "Бульдозер переміщує й вирівнює ґрунт відвалом на великих площах. Екскаватор копає й вантажить. Часто потрібні обидва."], ["Як швидко можна замовити?", "Залиште заявку з датою та місцем. Диспетчер перевірить вільну техніку й підтвердить."]] },
];
const CITIES = [
  { slug: "mykolaiv", name: "Миколаїв", loc: "у Миколаєві", obl: "Миколаївська область" },
  { slug: "odesa", name: "Одеса", loc: "в Одесі", obl: "Одеська область" },
  { slug: "kyiv", name: "Київ", loc: "у Києві", obl: "Київ і область" },
];

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const css = `*{box-sizing:border-box}body{margin:0;background:#08090A;color:#F4F4F1;font:16px/1.65 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}a{color:#FFB81C}
.w{max-width:860px;margin:0 auto;padding:0 20px}header{border-bottom:1px solid #202428}header .w{display:flex;justify-content:space-between;align-items:center;padding:14px 20px;gap:12px;flex-wrap:wrap}
.logo{font-weight:800;letter-spacing:.04em;color:#F4F4F1;text-decoration:none}.logo b{color:#FF6A1A}
.btn{display:inline-block;background:#FF6A1A;color:#08090A;font-weight:700;text-decoration:none;border-radius:980px;padding:12px 24px;min-height:44px}
.btn.o{background:none;color:#FF6A1A;border:1px solid #FF6A1A}nav.bc{font-size:14px;color:#A3A8AD;padding:20px 0 0}nav.bc a{color:#A3A8AD}
h1{font-size:clamp(28px,5vw,44px);line-height:1.15;margin:16px 0}h2{font-size:24px;margin:40px 0 12px}p,li{color:#D5D8DA}ul{padding-left:20px}li{margin:6px 0}
.box{background:#101214;border:1px solid #202428;border-radius:16px;padding:20px 22px;margin:24px 0}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px;padding:0;list-style:none}.grid a{display:block;padding:12px 16px;border:1px solid #202428;border-radius:12px;text-decoration:none;color:#F4F4F1}.grid a:hover{border-color:#FF6A1A}
footer{border-top:1px solid #202428;margin-top:56px;padding:28px 0 48px;color:#A3A8AD;font-size:14px}details{border-top:1px solid #202428;padding:12px 0}summary{cursor:pointer;font-weight:600}`;

function page({ path, title, desc, h1, body, crumbs, ld }) {
  const url = `${SITE}${path}`;
  const bc = { "@type": "BreadcrumbList", itemListElement: crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c[0], item: `${SITE}${c[1]}` })) };
  return `<!doctype html><html lang="uk"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(title)}</title><meta name="description" content="${esc(desc)}"><link rel="canonical" href="${url}"><meta name="robots" content="index, follow, max-image-preview:large">
<meta name="theme-color" content="#08090A"><meta property="og:type" content="website"><meta property="og:locale" content="uk_UA"><meta property="og:site_name" content="ТехМайданчик"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${url}"><meta property="og:image" content="${SITE}/story/poster.jpg">
<meta name="twitter:card" content="summary_large_image"><link rel="icon" type="image/svg+xml" href="/favicon.svg"><link rel="manifest" href="/manifest.webmanifest">
<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@graph": [bc, ...ld] })}</script><style>${css}</style></head>
<body><header><div class="w"><a class="logo" href="/">ТЕХ<b>МАЙДАНЧИК</b></a><a class="btn" href="/">Залишити заявку</a></div></header>
<main class="w"><nav class="bc" aria-label="Навігація">${crumbs.map((c, i) => (i < crumbs.length - 1 ? `<a href="${c[1]}">${esc(c[0])}</a> / ` : esc(c[0]))).join("")}</nav>
<h1>${esc(h1)}</h1>${body}</main>
<footer><div class="w"><p><a href="/">ТехМайданчик</a> — біржа будівельної техніки. Диспетчер, Миколаїв: <a href="tel:${PHONE}">${PHONE_FMT}</a>, <a href="mailto:${EMAIL}">${EMAIL}</a>.</p><p><a href="/orenda/">Уся техніка</a></p></div></footer></body></html>`;
}
const cta = (t = "Залишити заявку") => `<p><a class="btn" href="/">${t}</a> <a class="btn o" href="tel:${PHONE}">${PHONE_FMT}</a></p>`;
const faqLd = (faq) => ({ "@type": "FAQPage", mainEntity: faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) });
const faqHtml = (faq) => `<h2>Часті питання</h2>${faq.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join("")}`;
const howto = `<h2>Як це працює</h2><ol><li>Залишаєте заявку: яка техніка, де і на які дати.</li><li>Диспетчер перевіряє вільну техніку й підтверджує.</li><li>Підтвердження приходить у ваш кабінет, контакти відкриваються обом сторонам.</li><li>Техніка закріплюється за вами на ваші дати.</li></ol>`;
const svc = (name, area, path) => ({ "@type": "Service", name, serviceType: "Оренда будівельної техніки", areaServed: area, url: `${SITE}${path}`, provider: { "@type": "Organization", name: "ТехМайданчик", url: SITE, telephone: PHONE, email: EMAIL } });

rmSync(join(ROOT, "orenda"), { recursive: true, force: true });
const urls = ["/"];
function write(path, html) { const d = join(ROOT, path); mkdirSync(d, { recursive: true }); writeFileSync(join(d, "index.html"), html); urls.push(path); }

// хаб
{
  const body = `<p>ТехМайданчик — біржа, де власники будівельної техніки та замовники знаходять одне одного. Оберіть тип техніки й місто або залиште заявку — диспетчер підбере варіант під вашу роботу.</p>
${cta()}<h2>Техніка в оренду</h2><ul class="grid">${CATS.map((c) => `<li><a href="/orenda/${c.slug}/">Оренда ${c.gen}</a></li>`).join("")}</ul>
<h2>За містами</h2>${CITIES.map((ci) => `<h3>${ci.name}</h3><ul class="grid">${CATS.map((c) => `<li><a href="/orenda/${c.slug}-${ci.slug}/">${c.name} ${ci.loc}</a></li>`).join("")}</ul>`).join("")}${howto}`;
  write("/orenda/", page({ path: "/orenda/", title: "Оренда будівельної техніки в Україні — ТехМайданчик", desc: "Оренда екскаваторів, навантажувачів, самоскидів, кранів, котків і бульдозерів. Залиште заявку — диспетчер підбере техніку під вашу роботу.", h1: "Оренда будівельної техніки", body, crumbs: [["Головна", "/"], ["Оренда техніки", "/orenda/"]], ld: [] }));
}
// категорії
for (const c of CATS) {
  const path = `/orenda/${c.slug}/`;
  const body = `<p>Потрібна оренда ${c.gen}? На ТехМайданчику ви залишаєте заявку з датами й описом задачі, а диспетчер перевіряє, яка техніка вільна, і підтверджує. Ціни та умови визначає власник техніки — вони вказуються в оголошенні й узгоджуються до підтвердження.</p>${cta()}
<h2>Для яких робіт потрібен ${c.name.toLowerCase()}</h2><ul>${c.tasks.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
<h2>На що звернути увагу при виборі</h2><ul>${c.pick.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
<div class="box"><strong>Не впевнені, що саме потрібно?</strong><p>Опишіть задачу в заявці: що робимо, де, коли і який обсяг. Диспетчер допоможе підібрати техніку.</p>${cta("Описати задачу")}</div>
<h2>Оренда ${c.gen} по містах</h2><ul class="grid">${CITIES.map((ci) => `<li><a href="/orenda/${c.slug}-${ci.slug}/">${c.name} ${ci.loc}</a></li>`).join("")}</ul>${howto}${faqHtml(c.faq)}`;
  write(path, page({ path, title: `Оренда ${c.gen} в Україні — ТехМайданчик`, desc: `Оренда ${c.gen}: для яких робіт, як обрати, як замовити. Залиште заявку — диспетчер підбере ${c.name.toLowerCase()} під вашу роботу та підтвердить.`, h1: `Оренда ${c.gen}`, body, crumbs: [["Головна", "/"], ["Оренда техніки", "/orenda/"], [`Оренда ${c.gen}`, path]], ld: [svc(`Оренда ${c.gen}`, "Україна", path), faqLd(c.faq)] }));
  // категорія × місто
  for (const ci of CITIES) {
    const p2 = `/orenda/${c.slug}-${ci.slug}/`;
    const faq = [[`Як замовити ${c.name.toLowerCase()} ${ci.loc}?`, `Залиште заявку на сайті: вкажіть місто, дати й опис робіт. Диспетчер перевірить вільну техніку (${ci.obl}) і підтвердить.`], ...c.faq];
    const body2 = `<p>Шукаєте ${c.name.toLowerCase()} в оренду ${ci.loc}? Залиште заявку — вкажіть адресу об'єкта, дати й задачу. Диспетчер ТехМайданчика перевірить, яка техніка вільна (${ci.obl}), і підтвердить замовлення. Вартість і умови визначає власник техніки.</p>${cta()}
<h2>Для яких робіт беруть ${c.name.toLowerCase()}</h2><ul>${c.tasks.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
<h2>Що вказати в заявці</h2><ul><li>Адреса або район об'єкта ${ci.loc}.</li><li>Дати й орієнтовна тривалість робіт.</li>${c.pick.map((t) => `<li>${esc(t[0].toUpperCase() + t.slice(1))}</li>`).join("")}</ul>${howto}${faqHtml(faq)}
<h2>Інша техніка ${ci.loc}</h2><ul class="grid">${CATS.filter((x) => x !== c).map((x) => `<li><a href="/orenda/${x.slug}-${ci.slug}/">${x.name} ${ci.loc}</a></li>`).join("")}</ul>
<p><a href="${path}">Оренда ${c.gen} в Україні</a></p>`;
    write(p2, page({ path: p2, title: `Оренда ${c.gen} ${ci.loc} — ТехМайданчик`, desc: `Оренда ${c.gen} ${ci.loc}: залиште заявку з датами та адресою, диспетчер підбере вільну техніку й підтвердить. ТехМайданчик.`, h1: `Оренда ${c.gen} ${ci.loc}`, body: body2, crumbs: [["Головна", "/"], ["Оренда техніки", "/orenda/"], [`Оренда ${c.gen}`, path], [ci.name, p2]], ld: [svc(`Оренда ${c.gen} ${ci.loc}`, ci.name, p2), faqLd(faq)] }));
  }
}
const today = new Date().toISOString().slice(0, 10);
writeFileSync(join(ROOT, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((u) => `<url><loc>${SITE}${u}</loc><lastmod>${today}</lastmod><priority>${u === "/" ? "1.0" : u === "/orenda/" ? "0.8" : "0.6"}</priority></url>`).join("")}</urlset>\n`);
console.log(`Згенеровано ${urls.length - 1} сторінок + sitemap (${SITE})`);
