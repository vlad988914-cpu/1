// Генерує статичні SEO-сторінки: /orenda/, /orenda/<техніка>/, /orenda/<техніка>-<місто>/ + sitemap.xml
// Запуск: node scripts/gen-seo-pages.mjs   (адреса сайту: SITE_URL=https://ваш-домен.ua node scripts/gen-seo-pages.mjs)
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { GROUPS } from "../shared/models-data.js";

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
  { slug: "mini-ekskavator", name: "Міні-екскаватор", gen: "міні-екскаватора", plural: "міні-екскаватори",
    tasks: ["риття траншей під кабель, воду й каналізацію", "робота у дворах, підвалах і на вузьких ділянках", "демонтаж невеликих конструкцій і підготовка під фундамент", "благоустрій та ландшафтні роботи"],
    pick: ["експлуатаційна маса й габарити (чи проїде у ворота й під арку)", "глибина копання", "ширина й тип ковша", "гусеничний хід і наявність гідромолота", "чи потрібен оператор"],
    faq: [["Коли краще міні-екскаватор, а коли звичайний?", "Міні-екскаватор потрібен там, де тісно: двори, підвали, траншеї біля будівель. Для великих котлованів і великого обсягу ґрунту ефективніший звичайний екскаватор."], ["Як привезти міні-екскаватор на об'єкт?", "Зазвичай його перевозять на трейлері. Вкажіть у заявці, чи потрібна доставка, — це уточнює власник техніки."], ["Чи можна орендувати з оператором?", "Так, у заявці вкажіть, що потрібен оператор. Умови уточнює власник техніки."]] },
  { slug: "manipulyator", name: "Маніпулятор", gen: "маніпулятора", plural: "маніпулятори",
    tasks: ["доставка й розвантаження плит, блоків, труб і піддонів", "монтаж бордюрів, колодязних кілець і огорож", "перевезення матеріалів та техніки на об'єкт", "підйом вантажів там, де не заїде кран"],
    pick: ["вантажопідйомність маніпулятора на потрібному виносі", "довжина й вантажопідйомність кузова", "відстань доставки", "чи потрібен стропальник"],
    faq: [["Чим маніпулятор відрізняється від автокрана?", "Маніпулятор сам довозить вантаж і розвантажує його, але підіймає менше й нижче. Для важких вантажів на висоту потрібен автокран."], ["Чи розвантажує маніпулятор сам?", "Так, оператор керує стрілою з пульта. Стропування вантажу уточніть у власника техніки."], ["Як розраховується вартість?", "Залежить від умов власника: за годину, за зміну або за рейс. Це вказується в оголошенні та узгоджується до підтвердження."]] },
  { slug: "avtovyshka", name: "Автовишка", gen: "автовишки", plural: "автовишки",
    tasks: ["обрізання й знесення дерев", "монтаж і обслуговування освітлення та вивісок", "фасадні й покрівельні роботи без риштувань", "ремонт ліній та інші роботи на висоті"],
    pick: ["робоча висота й виліт люльки", "вантажопідйомність люльки", "тип стріли (телескопічна чи колінчата)", "доступність майданчика та місце для опор"],
    faq: [["Яка висота потрібна?", "Додайте до висоти робіт запас на виліт стріли. У заявці вкажіть висоту й відстань від місця встановлення до об'єкта."], ["Чи потрібен допуск для роботи на висоті?", "Вимоги до робіт на висоті визначають нормативи й умови власника. Уточніть це при підтвердженні заявки."], ["Чи можна орендувати з оператором?", "Так, у заявці вкажіть, що потрібен оператор. Умови уточнює власник техніки."]] },
  { slug: "greider", name: "Грейдер", gen: "грейдера", plural: "грейдери",
    tasks: ["профілювання й планування ґрунтових і щебеневих доріг", "підготовка основи під дорожнє покриття", "планування майданчиків і паркінгів", "зрізання ґрунту та розрівнювання щебеню"],
    pick: ["ширина й тип відвалу", "потужність двигуна", "площа та довжина ділянки", "чи потрібен оператор"],
    faq: [["Чим грейдер відрізняється від бульдозера?", "Грейдер точніше профілює поверхню довгим регульованим відвалом, а бульдозер переміщує великі об'єми ґрунту. Для доріг зазвичай обирають грейдер."], ["Коли потрібен грейдер?", "Коли треба рівне полотно дороги чи майданчика: щебеневі дороги, основа під асфальт, ґрунтові під'їзди."], ["Як швидко можна замовити?", "Залиште заявку з датою та місцем робіт. Диспетчер перевірить вільну техніку й підтвердить."]] },
  { slug: "gidromolot", name: "Гідромолот", gen: "гідромолота", plural: "гідромолоти",
    tasks: ["руйнування бетону, фундаментів і плит", "демонтаж асфальту та дорожнього покриття", "дроблення негабаритів і скельного ґрунту", "розбирання конструкцій у стиснених умовах"],
    pick: ["клас гідромолота має відповідати масі екскаватора-носія", "тип кріплення та параметри гідросистеми", "матеріал, який треба розбирати (бетон, асфальт, скеля)", "чи потрібен екскаватор і оператор разом із молотом"],
    faq: [["Чи можна орендувати гідромолот без екскаватора?", "Гідромолот — навісне обладнання, він працює на екскаваторі. У заявці вкажіть, чи потрібен екскаватор з оператором."], ["Як підібрати гідромолот під екскаватор?", "Клас молота залежить від маси й гідросистеми екскаватора. Диспетчер підкаже, якщо ви опишете техніку й завдання."], ["Чи можна орендувати з оператором?", "Так, у заявці вкажіть, що потрібен оператор. Умови уточнює власник техніки."]] },
];
const CITIES = [
  { slug: "mykolaiv", name: "Миколаїв", loc: "у Миколаєві", obl: "Миколаївська область" },
  { slug: "odesa", name: "Одеса", loc: "в Одесі", obl: "Одеська область" },
  { slug: "kyiv", name: "Київ", loc: "у Києві", obl: "Київ і область" },
];

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const css = `*{box-sizing:border-box}html{scroll-behavior:smooth}
body{margin:0;min-height:100vh;background:#09070A;color:#F7F1EA;font:16px/1.65 Manrope,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;position:relative;overflow-x:hidden}
body:before,body:after{content:"";position:fixed;z-index:-1;border-radius:50%;filter:blur(70px);pointer-events:none}
body:before{width:70vmax;height:70vmax;left:-25vmax;top:-30vmax;background:radial-gradient(circle,rgba(255,106,26,.42),rgba(255,106,26,0) 68%);animation:orb1 22s ease-in-out infinite alternate}
body:after{width:60vmax;height:60vmax;right:-22vmax;bottom:-26vmax;background:radial-gradient(circle,rgba(255,184,28,.30),rgba(226,52,86,.14) 45%,rgba(0,0,0,0) 70%);animation:orb2 26s ease-in-out infinite alternate}
@keyframes orb1{to{transform:translate(18vmax,12vmax) scale(1.15)}}@keyframes orb2{to{transform:translate(-16vmax,-10vmax) scale(1.2)}}
a{color:#FFD9A8}
.w{max-width:880px;margin:0 auto;padding:0 20px}
header{position:sticky;top:0;z-index:20;background:rgba(12,8,7,.62);backdrop-filter:blur(18px) saturate(1.4);-webkit-backdrop-filter:blur(18px) saturate(1.4);border-bottom:1px solid rgba(255,160,90,.35)}
header .w{display:flex;justify-content:space-between;align-items:center;padding:12px 20px;gap:12px;flex-wrap:wrap}
.logo{font:800 17px/1 Unbounded,Manrope,sans-serif;letter-spacing:.02em;color:#fff;text-decoration:none}.logo b{background:linear-gradient(90deg,#FFB81C,#FF6A1A);-webkit-background-clip:text;background-clip:text;color:transparent}
.btn{position:relative;overflow:hidden;display:inline-flex;align-items:center;justify-content:center;gap:8px;background:linear-gradient(135deg,#FFB81C 0%,#FF7A1F 55%,#F2441D 100%);color:#2A0E03;font:800 14px/1 Manrope,sans-serif;letter-spacing:.02em;text-decoration:none;border-radius:980px;padding:15px 26px;min-height:46px;box-shadow:0 10px 26px -8px rgba(255,106,26,.85),inset 0 1px 0 rgba(255,255,255,.55);transition:transform .25s cubic-bezier(.2,.8,.2,1),box-shadow .25s}
.btn:before{content:"";position:absolute;top:0;left:-70%;width:45%;height:100%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.55),transparent);transform:skewX(-20deg);transition:left .6s}
.btn:hover{transform:translateY(-2px) scale(1.03);box-shadow:0 16px 34px -8px rgba(255,106,26,1),inset 0 1px 0 rgba(255,255,255,.6)}.btn:hover:before{left:125%}
.btn.o{background:rgba(255,255,255,.06);color:#FFE3BD;border:1px solid rgba(255,190,120,.6);box-shadow:none;backdrop-filter:blur(8px)}.btn.o:hover{background:rgba(255,160,70,.16);box-shadow:0 0 24px -4px rgba(255,150,60,.7)}
.back{display:inline-flex;align-items:center;min-height:44px;margin-top:18px;padding:0 18px;border:1px solid rgba(255,190,120,.55);border-radius:980px;color:#FFE3BD;text-decoration:none;font-weight:700;background:rgba(255,255,255,.05);transition:all .25s}.back:hover{background:rgba(255,160,70,.18);transform:translateX(-3px)}
nav.bc{font-size:14px;color:#FFD3AE;padding:20px 0 0}nav.bc a{color:#FFD3AE}
h1{font:800 clamp(28px,6vw,50px)/1.1 Unbounded,Manrope,sans-serif;letter-spacing:-.01em;margin:18px 0 8px;background:linear-gradient(100deg,#FFFFFF 0%,#FFE1B5 35%,#FFB81C 60%,#FF6A1A 100%);background-size:220% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;animation:shine 9s ease-in-out infinite alternate}
@keyframes shine{to{background-position:100% 0}}
h2{font:700 clamp(20px,3.6vw,26px)/1.2 Unbounded,Manrope,sans-serif;margin:46px 0 14px;display:flex;align-items:center;gap:12px}h2:before{content:"";flex:none;width:34px;height:4px;border-radius:4px;background:linear-gradient(90deg,#FFB81C,#FF4D2E);box-shadow:0 0 14px rgba(255,120,40,.8)}
p,li{color:#FFF1E3}ul{padding-left:20px}li{margin:6px 0}ol li::marker{color:#FFB81C;font-weight:800}
.box{background:linear-gradient(150deg,rgba(255,120,40,.26),rgba(226,52,86,.10) 60%),rgba(24,12,8,.78);border:1px solid rgba(255,170,90,.5);border-radius:20px;padding:22px 24px;margin:24px 0;box-shadow:0 18px 50px -24px rgba(255,100,30,.8),inset 0 1px 0 rgba(255,225,190,.2)}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:10px;padding:0;list-style:none}
.grid a{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border:1px solid rgba(255,170,90,.38);border-radius:14px;text-decoration:none;color:#F7F1EA;font-weight:600;background:rgba(255,255,255,.035);transition:all .25s}.grid a:after{content:"→";color:#FFB81C;transition:transform .25s}
.grid a:hover{border-color:#FFB81C;background:linear-gradient(120deg,rgba(255,130,40,.25),rgba(255,184,28,.08));transform:translateY(-3px);box-shadow:0 12px 28px -12px rgba(255,120,30,.8)}.grid a:hover:after{transform:translateX(4px)}
.models{list-style:none;padding:0;margin:20px 0}
.mrow,.orow{border:1px solid rgba(255,170,90,.42);border-radius:20px;background:linear-gradient(145deg,rgba(255,120,40,.20),rgba(255,120,40,.04) 55%),rgba(22,12,8,.80);margin:12px 0;box-shadow:0 14px 40px -26px rgba(255,100,30,.9),inset 0 1px 0 rgba(255,225,190,.16);transition:transform .3s cubic-bezier(.2,.8,.2,1),border-color .3s,box-shadow .3s}
.models li:nth-child(3n+2) .orow{background:linear-gradient(145deg,rgba(255,184,28,.18),rgba(255,184,28,.03) 55%),rgba(22,12,8,.80)}.models li:nth-child(3n) .orow{background:linear-gradient(145deg,rgba(240,70,60,.20),rgba(240,70,60,.03) 55%),rgba(22,12,8,.80)}
.mrow:hover,.orow:hover{transform:translateY(-3px);border-color:#FFB81C;box-shadow:0 22px 50px -22px rgba(255,120,30,1),0 0 0 1px rgba(255,184,28,.3),inset 0 1px 0 rgba(255,225,190,.3)}
.mrow summary{list-style:none;display:grid;grid-template-columns:1fr;gap:6px;padding:18px 20px;cursor:pointer}.mrow summary::-webkit-details-marker{display:none}
.mrow .mn{font:700 18px/1.2 Unbounded,Manrope,sans-serif;color:#fff}.mrow .mb{color:#FFD3AE;font-size:13px}.mrow .mk{display:flex;flex-wrap:wrap;gap:6px}.mrow .mk i{font-style:normal;font-size:13px;background:rgba(255,140,50,.18);border:1px solid rgba(255,170,90,.55);border-radius:980px;padding:3px 11px;color:#FFE9CC}
.mrow .mm{color:#FFB81C;font-size:13px;font-weight:700}.mrow[open] .mm{display:none}.mrow table{width:calc(100% - 40px);margin:0 20px 8px;border-collapse:collapse}.mrow td{padding:9px 0;border-top:1px solid rgba(255,170,90,.25);vertical-align:top;font-size:15px}.mrow td:first-child{color:#FFD3AE;width:48%;padding-right:12px}
.orow{display:grid;grid-template-columns:1fr auto;grid-template-areas:"t p" "s s" "m m";gap:10px 14px;align-items:center;padding:18px 20px;text-decoration:none;color:#F7F1EA}
.orow .t{grid-area:t}.orow .t b{font:700 19px/1.2 Unbounded,Manrope,sans-serif;color:#fff}.orow .mb{color:#FFD3AE;font-size:13px}.orow .op{grid-area:p;font:800 17px/1 Unbounded,Manrope,sans-serif;color:#2A0E03;background:linear-gradient(135deg,#FFE9BE,#FFB81C);padding:9px 14px;border-radius:12px;box-shadow:0 8px 20px -8px rgba(255,184,28,.9)}
.orow .sp{grid-area:s;display:flex;flex-wrap:wrap;gap:7px}.orow .sp i{font-style:normal;font-size:13px;background:rgba(255,255,255,.07);border:1px solid rgba(255,190,120,.4);border-radius:10px;padding:5px 10px;color:#FFE9CC}.orow .sp i b{color:#FFB81C;font-weight:800}
.orow .mm{grid-area:m;color:#FFB81C;font-size:14px;font-weight:800;letter-spacing:.02em}.orow:hover .mm{letter-spacing:.06em}
.nw{font-style:normal;font-size:10px;font-weight:800;letter-spacing:.08em;color:#2A0E03;background:linear-gradient(135deg,#FFF0D2,#FFB81C);border-radius:980px;padding:3px 9px;vertical-align:middle;animation:pulse 2.4s ease-in-out infinite}
@keyframes pulse{50%{box-shadow:0 0 0 5px rgba(255,184,28,.0),0 0 14px rgba(255,184,28,.9)}}
.avail{color:#B9F6CA;font-size:13px}.mrow .mact{padding:4px 20px 20px;margin:0;display:flex;gap:10px;flex-wrap:wrap}.mrow .ms{padding:4px 20px 16px;font-size:13px;color:#FFD3AE}p.ms{color:#FFD3AE}
.rvp{opacity:0;transform:translateY(22px) scale(.985);transition:opacity .7s cubic-bezier(.2,.8,.2,1),transform .7s cubic-bezier(.2,.8,.2,1)}.rvp.in{opacity:1;transform:none}
@media(min-width:700px){.mrow summary{grid-template-columns:minmax(200px,1.1fr) 1.6fr auto;align-items:center}}
@media(max-width:520px){.orow{grid-template-columns:1fr;grid-template-areas:"t" "p" "s" "m"}.orow .op{justify-self:start}}
@media(prefers-reduced-motion:reduce){body:before,body:after,h1,.nw{animation:none}.rvp{opacity:1;transform:none;transition:none}.btn,.orow,.mrow,.grid a{transition:none}}
footer{border-top:1px solid rgba(255,160,90,.3);margin-top:60px;padding:28px 0 48px;color:#FFD3AE;font-size:14px}details{border-top:1px solid rgba(255,170,90,.3);padding:14px 0}summary{cursor:pointer;font-weight:700}details[open] summary{color:#FFB81C}`;

function page({ path, title, desc, h1, body, crumbs, ld, back }) {
  const url = `${SITE}${path}`;
  const bc = { "@type": "BreadcrumbList", itemListElement: crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c[0], item: `${SITE}${c[1]}` })) };
  return `<!doctype html><html lang="uk"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Unbounded:wght@600;700;800&display=swap">
<title>${esc(title)}</title><meta name="description" content="${esc(desc)}"><link rel="canonical" href="${url}"><meta name="robots" content="index, follow, max-image-preview:large">
<meta name="theme-color" content="#3A1405"><meta property="og:type" content="website"><meta property="og:locale" content="uk_UA"><meta property="og:site_name" content="ТехМайданчик"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${url}"><meta property="og:image" content="${SITE}/story/poster.jpg">
<meta name="twitter:card" content="summary_large_image"><link rel="icon" type="image/svg+xml" href="/favicon.svg"><link rel="manifest" href="/manifest.webmanifest">
<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@graph": [bc, ...ld] })}</script><style>${css}</style></head>
<body><header><div class="w"><a class="logo" href="/">ТЕХ<b>МАЙДАНЧИК</b></a><a class="btn" href="/">Залишити заявку</a></div></header>
<main class="w">${back ? `<a class="back" href="/">← На головну</a>` : ""}<nav class="bc" aria-label="Навігація">${crumbs.map((c, i) => (i < crumbs.length - 1 ? `<a href="${c[1]}">${esc(c[0])}</a> / ` : esc(c[0]))).join("")}</nav>
<h1>${esc(h1)}</h1>${body}</main>
<footer><div class="w"><p><a href="/">ТехМайданчик</a> — біржа будівельної техніки. Диспетчер, Миколаїв: <a href="tel:${PHONE}">${PHONE_FMT}</a>, <a href="mailto:${EMAIL}">${EMAIL}</a>.</p><p><a href="/orenda/">Уся техніка</a></p></div></footer><script>(function(){var d=document;if(!("IntersectionObserver" in window)||matchMedia("(prefers-reduced-motion:reduce)").matches)return;var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add("in");io.unobserve(e.target)}})},{rootMargin:"0px 0px -6% 0px",threshold:.08});var n=0;function rv(){d.querySelectorAll("main h2,main .mrow,main .box,main .grid li,main details,main .orow,main ol li,main nav.bc").forEach(function(e){if(e.dataset.rv)return;e.dataset.rv=1;e.classList.add("rvp");e.style.transitionDelay=Math.min((n++%6)*60,300)+"ms";io.observe(e)})}window.__rv=rv;rv();new MutationObserver(rv).observe(d.querySelector("main"),{childList:true,subtree:true})})()</script></body></html>`;
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
  write("/orenda/", page({ path: "/orenda/", title: "Оренда будівельної техніки в Україні — ТехМайданчик", desc: "Оренда екскаваторів, міні-екскаваторів, навантажувачів, самоскидів, кранів, котків, бульдозерів, грейдерів і гідромолотів. Залиште заявку — диспетчер підбере техніку.", h1: "Оренда будівельної техніки", body, crumbs: [["Головна", "/"], ["Оренда техніки", "/orenda/"]], ld: [] }));
}
// категорії
for (const c of CATS) {
  const path = `/orenda/${c.slug}/`;
  const body = `<p>Потрібна оренда ${c.gen}? На ТехМайданчику ви залишаєте заявку з датами й описом задачі, а диспетчер перевіряє, яка техніка вільна, і підтверджує. Ціни та умови визначає власник техніки — вони вказуються в оголошенні й узгоджуються до підтвердження.</p>${cta()}
<h2>Для яких робіт потрібен ${c.name.toLowerCase()}</h2><ul>${c.tasks.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
<h2>На що звернути увагу при виборі</h2><ul>${c.pick.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
<div class="box"><strong>Не впевнені, що саме потрібно?</strong><p>Опишіть задачу в заявці: що робимо, де, коли і який обсяг. Диспетчер допоможе підібрати техніку.</p>${cta("Описати задачу")}</div>
<h2>Оренда ${c.gen} по містах</h2><ul class="grid">${CITIES.map((ci) => `<li><a href="/orenda/${c.slug}-${ci.slug}/">${c.name} ${ci.loc}</a></li>`).join("")}</ul>${howto}${faqHtml(c.faq)}`;
  write(path, page({ path, title: `Оренда ${c.gen} в Україні — ТехМайданчик`, desc: `Оренда ${c.gen} в Україні: для яких робіт потрібен, на що звернути увагу при виборі, як замовити. Залиште заявку — диспетчер підбере ${c.name.toLowerCase()} і підтвердить.`, h1: `Оренда ${c.gen}`, body, crumbs: [["Головна", "/"], ["Оренда техніки", "/orenda/"], [`Оренда ${c.gen}`, path]], ld: [svc(`Оренда ${c.gen}`, "Україна", path), faqLd(c.faq)] }));
  // категорія × місто
  for (const ci of CITIES) {
    const p2 = `/orenda/${c.slug}-${ci.slug}/`;
    const faq = [[`Як замовити ${c.name.toLowerCase()} ${ci.loc}?`, `Залиште заявку на сайті: вкажіть місто, дати й опис робіт. Диспетчер перевірить вільну техніку (${ci.obl}) і підтвердить.`], ...c.faq];
    const body2 = `<p>Шукаєте ${c.name.toLowerCase()} в оренду ${ci.loc}? Залиште заявку — вкажіть адресу об'єкта, дати й задачу. Диспетчер ТехМайданчика перевірить, яка техніка вільна (${ci.obl}), і підтвердить замовлення. Вартість і умови визначає власник техніки.</p>${cta()}
<h2>Для яких робіт беруть ${c.name.toLowerCase()}</h2><ul>${c.tasks.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
<h2>Що вказати в заявці</h2><ul><li>Адреса або район об'єкта ${ci.loc}.</li><li>Дати й орієнтовна тривалість робіт.</li>${c.pick.map((t) => `<li>${esc(t[0].toUpperCase() + t.slice(1))}</li>`).join("")}</ul>${howto}${faqHtml(faq)}
<h2>Інша техніка ${ci.loc}</h2><ul class="grid">${CATS.filter((x) => x !== c).map((x) => `<li><a href="/orenda/${x.slug}-${ci.slug}/">${x.name} ${ci.loc}</a></li>`).join("")}</ul>
<p><a href="${path}">Оренда ${c.gen} в Україні</a></p>`;
    write(p2, page({ path: p2, title: `Оренда ${c.gen} ${ci.loc} — ТехМайданчик`, desc: `Оренда ${c.gen} ${ci.loc}: залиште заявку з датами та адресою об'єкта, диспетчер підбере вільну техніку (${ci.obl}) і підтвердить. Умови визначає власник.`, h1: `Оренда ${c.gen} ${ci.loc}`, body: body2, crumbs: [["Головна", "/"], ["Оренда техніки", "/orenda/"], [`Оренда ${c.gen}`, path], [ci.name, p2]], ld: [svc(`Оренда ${c.gen} ${ci.loc}`, ci.name, p2), faqLd(faq)] }));
  }
}
// каталог моделей
rmSync(join(ROOT, "katalog"), { recursive: true, force: true });
const SB_URL = process.env.VITE_SUPABASE_URL || "https://jsyjqudermvbylaweuqj.supabase.co";
const SB_KEY = process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_ShJs7HgeVml_QbQO5pvb1g_yCaWV8ai";
const DISC = "Характеристики наведено за даними виробника (посилання біля кожної моделі) і залежать від комплектації та ринку. Параметри, яких немає на сторінці виробника, не наводяться.";
let FROM = "";
const modelRows = (g) => `<ul class="models">${g.models.map((m) => `<li><details class="mrow" id="${m.id}"><summary><span><span class="mn">${esc(m.name)}</span><br><span class="mb">${esc(m.brand)} · ${esc(m.kind)}</span></span><span class="mk">${m.key.map((k) => `<i>${esc(k)}</i>`).join("")}</span><span class="mm">Усі характеристики ▾</span><span class="avail" data-avail="${m.id}"></span></summary>
<table>${m.specs.map(([a, b]) => `<tr><td>${esc(a)}</td><td>${esc(b)}</td></tr>`).join("")}</table>${m.note ? `<p class="ms">${esc(m.note)}</p>` : ""}<p class="mact"><a class="btn" href="/?model=${m.id}&amp;from=${FROM}">Дати, бронювання й відгуки</a> <a class="btn o" href="${FROM}${m.id}/">Сторінка моделі</a> <a class="btn o" href="/?model=${m.id}&amp;request=1&amp;from=${FROM}">Залишити заявку</a></p></details></li>`).join("")}</ul>`;
for (const g of GROUPS) {
  const path = `/katalog/${g.slug}/`;
  FROM = path;
  const body = `
<h2>Оголошення власників</h2><div id="owners" data-type="${esc(g.type)}" data-from="${path}"><p class="ms">Завантажуємо оголошення…</p></div>
${g.models.length ? `<h2>Моделі та характеристики</h2>${modelRows(g)}` : ""}
<h2>Інші категорії</h2><ul class="grid">${GROUPS.filter((x) => x !== g).map((x) => `<li><a href="/katalog/${x.slug}/">${x.name}</a></li>`).join("")}</ul>
<script>(function(){var U=${JSON.stringify(SB_URL)},K=${JSON.stringify(SB_KEY)},M=${JSON.stringify(g.models.map((m) => ({ id: m.id, n: m.name })))};
var map={"м":"m","с":"c","а":"a","т":"t"};function nm(s){return String(s||"").toLowerCase().replace(/[мсат]/g,function(c){return map[c]}).replace(/[^a-z0-9]/g,"")}
function esc(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
var box=document.getElementById("owners"),type=box.dataset.type,from=box.dataset.from;
function modelFor(b){var a=nm(b);if(a.length<5)return null;for(var i=0;i<M.length;i++){var x=nm(M[i].n);if(x.indexOf(a)>-1||a.indexOf(x)>-1)return M[i].id}return null}
fetch(U+"/rest/v1/listings?select=id,brand,region,price,unit,available,created_at,specs&type=eq."+encodeURIComponent(type)+"&order=created_at.desc",{headers:{apikey:K,Authorization:"Bearer "+K}}).then(function(r){return r.json()}).then(function(rows){
if(!Array.isArray(rows)||!rows.length){box.innerHTML='<p class="ms">Оголошень цієї техніки поки немає. Залиште заявку — диспетчер підбере варіант, а власники відгукнуться на «Дошці оголошень».</p>';return}
var cnt={};box.innerHTML='<ul class="models">'+rows.map(function(r){var mid=modelFor(r.brand);if(mid)cnt[mid]=(cnt[mid]||0)+1;
var href=mid?"/?model="+mid+"&sel="+r.id+"&from="+encodeURIComponent(from):"/?tech="+r.id+"&from="+encodeURIComponent(from);
var isNew=Date.now()-new Date(r.created_at).getTime()<14*864e5;
return '<li><a class="orow" href="'+href+'"><span class="t"><b>'+esc(r.brand)+'</b>'+(isNew?' <i class="nw">НОВЕ</i>':'')+'<br><span class="mb">📍 '+esc(r.region)+' · '+(r.available?"доступна":"зараз зайнята")+'</span></span><span class="op">'+(Number(r.price)>0?esc(r.price)+" ₴/"+esc(r.unit):"Договірна")+'</span>'+(r.specs&&typeof r.specs==="object"&&Object.keys(r.specs).length?'<span class="sp">'+Object.keys(r.specs).map(function(k){return '<i>'+esc(k)+': <b>'+esc(r.specs[k])+'</b></i>'}).join("")+'</span>':"")+'<span class="mm">Дати й бронь →</span></a></li>'}).join("")+'</ul>';
Object.keys(cnt).forEach(function(id){var e=document.querySelector('[data-avail="'+id+'"]');if(e)e.textContent="Є в оренду: "+cnt[id]})
}).catch(function(){box.innerHTML='<p class="ms">Не вдалося завантажити оголошення. Оновіть сторінку.</p>'});
var h=location.hash.slice(1);if(h){var d=document.getElementById(h);if(d&&d.tagName==="DETAILS"){d.open=true;setTimeout(function(){d.scrollIntoView()},100)}}})();</script>`;
  const ld = g.models.length ? { "@type": "ItemList", name: g.name, itemListElement: g.models.map((m, i) => ({ "@type": "ListItem", position: i + 1, name: m.name, url: `${SITE}${path}#${m.id}` })) } : null;
  write(path, page({ path, title: `${g.name} в оренду — ТехМайданчик`, desc: (g.models.length ? `${g.name} в оренду: ${g.models.map((m) => m.name).join(", ")}. Оголошення власників, характеристики за даними виробників, календар вільних дат і бронювання.` : `${g.name} в оренду: оголошення власників, календар вільних дат і бронювання. Залиште заявку — диспетчер ТехМайданчика підбере техніку й підтвердить.`).slice(0, 160), h1: g.h1, body, crumbs: [["Головна", "/"], ["Каталог техніки", "/katalog/"], [g.name, path]], ld: ld ? [ld] : [], back: true }));
}
// сторінки окремих моделей: /katalog/<категорія>/<модель>/ — для запитів «Cat M320 характеристики»
for (const g of GROUPS) {
  for (const m of g.models) {
    const gp = `/katalog/${g.slug}/`;
    const path = `${gp}${m.id}/`;
    const related = g.models.filter((x) => x !== m);
    const rent = CATS.find((c) => c.name === g.type || (g.type === "Маніпулятор" && c.slug === "manipulyator"));
    const body = `<p>${esc(m.brand)} ${esc(m.name)} — ${esc(g.type.toLowerCase())} (${esc(m.kind.toLowerCase())}). Нижче характеристики за даними виробника та оголошення власників, які здають цю техніку в оренду.</p>
<div class="mk" style="display:flex;flex-wrap:wrap;gap:8px;margin:16px 0">${m.key.map((k) => `<span style="background:#A53C0D;border:1px solid #E99660;border-radius:980px;padding:5px 14px;color:#FFF0D2">${esc(k)}</span>`).join("")}</div>
${cta("Залишити заявку")}
<h2>Технічні характеристики ${esc(m.name)}</h2><div class="box"><table style="width:100%;border-collapse:collapse">${m.specs.map(([a, b]) => `<tr><td style="padding:9px 0;border-top:1px solid #EFA06A;color:#FFE6D0;width:48%;padding-right:12px;vertical-align:top">${esc(a)}</td><td style="padding:9px 0;border-top:1px solid #EFA06A">${esc(b)}</td></tr>`).join("")}</table>${m.note ? `<p style="font-size:13px;color:#FFE6D0">${esc(m.note)}</p>` : ""}</div>
<p><a class="btn" href="/?model=${m.id}&amp;from=${gp}">Дати, бронювання й відгуки</a></p>
<h2>Оголошення ${esc(m.name)} в оренду</h2><div id="owners" data-type="${esc(g.type)}" data-model="${m.id}" data-from="${path}"><p class="ms">Завантажуємо оголошення…</p></div>
${related.length ? `<h2>Інші моделі: ${esc(g.name.toLowerCase())}</h2><ul class="grid">${related.map((x) => `<li><a href="${gp}${x.id}/">${esc(x.name)}</a></li>`).join("")}</ul>` : ""}
<p><a href="${gp}">Усі ${esc(g.name.toLowerCase())}</a>${rent ? ` · <a href="/orenda/${rent.slug}/">Оренда ${rent.gen}</a> · <a href="/orenda/${rent.slug}-mykolaiv/">${rent.name} у Миколаєві</a>` : ""}</p>
<script>(function(){var U=${JSON.stringify(SB_URL)},K=${JSON.stringify(SB_KEY)},MID=${JSON.stringify(m.id)},M=${JSON.stringify(g.models.map((x) => ({ id: x.id, n: x.name })))};
var map={"м":"m","с":"c","а":"a","т":"t"};function nm(s){return String(s||"").toLowerCase().replace(/[мсат]/g,function(c){return map[c]}).replace(/[^a-z0-9]/g,"")}
function esc(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
var box=document.getElementById("owners"),from=box.dataset.from;
function modelFor(b){var a=nm(b);if(a.length<5)return null;for(var i=0;i<M.length;i++){var x=nm(M[i].n);if(x.indexOf(a)>-1||a.indexOf(x)>-1)return M[i].id}return null}
fetch(U+"/rest/v1/listings?select=id,brand,region,price,unit,available,created_at&type=eq."+encodeURIComponent(box.dataset.type)+"&order=created_at.desc",{headers:{apikey:K,Authorization:"Bearer "+K}}).then(function(r){return r.json()}).then(function(rows){
rows=Array.isArray(rows)?rows.filter(function(r){return modelFor(r.brand)===MID}):[];
if(!rows.length){box.innerHTML='<p class="ms">Оголошень цієї моделі поки немає. Залиште заявку — диспетчер підбере таку або схожу техніку, а власники відгукнуться на «Дошці оголошень».</p>';return}
box.innerHTML='<ul class="models">'+rows.map(function(r){return '<li><a class="orow" href="/?model='+MID+'&sel='+r.id+'&from='+encodeURIComponent(from)+'"><span><b>'+esc(r.brand)+'</b><br><span class="mb">'+esc(r.region)+' · '+(r.available?"доступна":"зараз зайнята")+'</span></span><span class="op">'+(Number(r.price)>0?esc(r.price)+" ₴/"+esc(r.unit):"Договірна")+'</span><span class="mm">Дати й бронь →</span></a></li>'}).join("")+'</ul>'
}).catch(function(){box.innerHTML='<p class="ms">Не вдалося завантажити оголошення. Оновіть сторінку.</p>'})})();</script>`;
    const ld = [{ "@type": "Product", name: m.name, brand: { "@type": "Brand", name: m.brand }, category: g.type, description: `${m.brand} ${m.name}: ${m.key.join(", ")}.`, url: `${SITE}${path}`, image: `${SITE}/story/poster.jpg` }];
    const title = (`${m.name} — характеристики та оренда | ТехМайданчик`.length <= 60 ? `${m.name} — характеристики та оренда | ТехМайданчик` : `${m.name} — характеристики, оренда`);
    const desc = `${m.brand} ${m.name}: ${m.key.join(", ")}. Технічні характеристики за даними виробника, оголошення власників, календар вільних дат і бронювання.`.slice(0, 160);
    write(path, page({ path, title, desc, h1: `${m.name}: характеристики та оренда`, body, crumbs: [["Головна", "/"], ["Каталог техніки", "/katalog/"], [g.name, gp], [m.name, path]], ld, back: true }));
  }
}
{
  const body = `<p>Моделі техніки з характеристиками за даними виробників. Оберіть категорію.</p><ul class="grid">${GROUPS.map((g) => `<li><a href="/katalog/${g.slug}/">${g.name}</a></li>`).join("")}</ul>${cta()}`;
  write("/katalog/", page({ path: "/katalog/", title: "Каталог техніки: моделі та характеристики — ТехМайданчик", desc: "Каталог будівельної техніки: екскаватори, міні-екскаватори, автокрани, катки й навантажувачі. Моделі та характеристики за даними виробників, оголошення власників.", h1: "Каталог техніки", body, crumbs: [["Головна", "/"], ["Каталог техніки", "/katalog/"]], ld: [], back: true }));
}
const today = new Date().toISOString().slice(0, 10);
writeFileSync(join(ROOT, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((u) => `<url><loc>${SITE}${u}</loc><lastmod>${today}</lastmod><priority>${u === "/" ? "1.0" : u === "/orenda/" || u === "/katalog/" ? "0.8" : u.split("/").filter(Boolean).length === 3 && u.startsWith("/katalog/") ? "0.7" : "0.6"}</priority></url>`).join("")}</urlset>\n`);
console.log(`Згенеровано ${urls.length - 1} сторінок + sitemap (${SITE})`);
