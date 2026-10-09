import React, { useState, useMemo, useEffect, useRef } from "react";
import { supabase } from "./supabaseClient";
import { Plate, Label, badgeStyle, miniBtn, ErrorText, Field, primaryBtn, smallBtn, selectStyle, inputStyle, Modal, RoleTag } from "./ui.jsx";
import { answerFromKnowledge, FALLBACK_ANSWER, JOB_PILLS, HELPER_PILLS } from "../shared/workKnowledge.js";
import { ClientCabinet, OwnerCabinet, NotificationsPanel, BookingForm, AvailabilityCalendar } from "./cabinets.jsx";
import { WantedBoard, RespondForm } from "./wanted.jsx";
import HeaderForge from "./forge/Forge.jsx";
import ScrollStory from "./story/ScrollStory.jsx";
import { SplitWords, CountUp, SlidingTabs, ScrollProgress, SceneAura, useSpotlight, useMagnetic, useReveal, useScenes } from "./motion/index.jsx";
import { DealsSection, EventLog, EquipmentBoard, UsersBoard, PairsBoard } from "./dispatcherDeals.jsx";
import * as deals from "./services/deals.js";

// ---- Bot API config ----
// TODO: після розгортання бота на Railway/Render замініть на реальну адресу,
// напр. "https://techmaydanchik-bot.up.railway.app". Той самий ключ має бути
// прописаний як DISPATCH_API_KEY у bot/.env.

// ---- i18n ----

// Прозорий WebM працює в Chrome/Firefox/Edge; Safari не вміє альфу у WebM — там статичний логотип.
const LOGO_ALPHA_VIDEO = typeof navigator !== "undefined" && !/^((?!chrome|android|crios|fxios|edg).)*safari/i.test(navigator.userAgent);

const TRANSLATIONS = {
  uk: {
    tagline: "біржа будтехніки",
    nav_login: "Увійти / Реєстрація",
    nav_client: "Шукаю техніку",
    nav_owner: "Здаю техніку",
    nav_my_requests: "Мої заявки",
    hero_badge: "Перша біржа будтехніки",
    ai_hint_line1: "Знайомтесь, ваш AI-помічник ТехМайданчика,",
    ai_hint_line2: "завжди на зв'язку в чаті внизу екрана",
    hero_typed: "Раді бачити. Розкажіть, яка техніка потрібна — а ми вже подбаємо про решту.",
    pill_catalog: "Каталог техніки",
    pill_request: "Залишити заявку",
    pill_add: "Додати техніку",
    pill_contact: "Зв'язок: demolis@ukr.net",
    how_it_works_label: "ПРОЦЕС",
    how_it_works_title: "Як це працює",
    step_1: "Оберіть техніку й дати або опишіть задачу",
    step_2: "Диспетчер перевіряє й підтверджує",
    step_3: "Підтвердження приходить у ваш кабінет",
    step_4: "Контакти відкриваються обом сторонам",
    step_5: "Техніка закріплена за вами на ваші дати",
    status_available: "ДОСТУПНА",
    status_busy: "ЗАЙНЯТА",
    sort_default: "За замовчуванням",
    sort_price_asc: "Дешевші спочатку",
    sort_price_desc: "Дорожчі спочатку",
    guide_listing_one: "оголошення в каталозі",
    guide_listing_many: "оголошень у каталозі",
    guide_parts_label: "Основні частини",
    guide_uses_label: "Де використовується",
    guide_choose_btn: "Обрати цю техніку",
    dispatcher_all: "Усі заявки",
    dispatcher_new: "Нові",
    dispatcher_progress: "В роботі",
    dispatcher_done: "Виконані",
    request_step_1: "Що потрібно виконати",
    request_step_2: "Техніка та локація",
    request_step_3: "Терміни та бюджет",
    request_step_4: "Контакт",
    hero_title_1: "Техніка знаходиться за годину,",
    hero_title_2: "не за тиждень",
    hero_sub: "Клієнти залишають заявку — власники техніки самі відгукуються. Диспетчер контролює кожну відправку вручну, тож жодна заявка не губиться.",
    hero_search_placeholder: "Що шукаєте? Напр. екскаватор",
    hero_search_btn: "Знайти",
    hero_cta_client: "Шукаю техніку",
    hero_cta_owner: "Здаю техніку в оренду",
    viewer_label: "3D-модель у каталозі",
    viewer_title: "CAT M320 — покрутіть самі",
    viewer_hint: "🖱️ Потягніть, щоб покрутити",
    categories_label: "Категорії техніки",
    categories_title: "Оберіть, що потрібно",
    trust_line: "Платформа щойно запускається — приєднуйтесь одними з перших",
    add_listing_btn: "+ Додати техніку в каталог",
    add_request_btn: "+ Залишити заявку на техніку",
    favorites_btn: "Обрані",
    recently_viewed: "Ви нещодавно переглядали:",
    filter_price_placeholder: "Ціна до, ₴/год",
    filter_all: "Усі",
    respond_btn: "Забронювати",
    busy_btn: "Зайнято",
    busy_until: "Зайнято до",
    catalog_empty: "Нічого не знайдено за цими фільтрами.",
    faq_label: "Часті запитання",
    faq_title: "Перш ніж почати",
    footer_desc: "Біржа оренди будівельної техніки. Клієнти і власники технiки знаходять одне одного напряму.",
    footer_contacts: "Контакти",
    footer_info: "Інформація",
    footer_terms: "Умови використання",
    footer_privacy: "Політика конфіденційності",
    footer_for_owners: "Для власників техніки",
    footer_dispatcher: "Панель диспетчера",
    profile_title: "Особистий кабінет",
    register_title: "Реєстрація",
    request_title: "Заявка на техніку",
    add_listing_title: "Додати техніку",
    ai_widget_title: "Помічник ТехМайданчика",
    ai_placeholder: "Опишіть задачу...",
    ai_greeting: "Привіт! Опишіть, яку роботу потрібно виконати — підберу техніку, поясню варіанти й різницю між ними. Або оберіть вид робіт нижче.",
    faq_items: [
      { q: "Скільки коштує розміщення техніки в каталозі?", a: "Реєстрація та додавання оголошень безкоштовні. Ми не беремо комісію з угод — власник і клієнт домовляються напряму." },
      { q: "Як швидко підтвердять бронь?", a: "Диспетчер перевіряє техніку й дати та підтверджує вручну — зазвичай протягом години в робочий час. Підтвердження й контакт власника з'являться в «Моєму кабінеті», ви отримаєте сповіщення. Для цього потрібен акаунт — реєстрація займає хвилину." },
      { q: "Що якщо підходящої техніки не знайдеться?", a: "Вивісьте заявку на «Дошці запитів»: дати, строк і ціну, яку готові заплатити. Власники самі запропонують свою техніку, ви оберете, а диспетчер підтвердить оренду — і відкриються контакти. Диспетчер також запитує власників напряму. Заявка лишається активною, поки ви її не скасуєте." },
      { q: "Чи можна перевірити власника техніки перед угодою?", a: "У профілі власника відображається позначка верифікації — ми перевіряємо контакти та документи перед її наданням." },
    ],
  },
  ru: {
    tagline: "биржа стройтехники",
    nav_login: "Войти / Регистрация",
    nav_client: "Ищу технику",
    nav_owner: "Сдаю технику",
    nav_my_requests: "Мои заявки",
    hero_badge: "Первая биржа стройтехники",
    ai_hint_line1: "Знакомьтесь, ваш AI-помощник ТехМайданчика,",
    ai_hint_line2: "всегда на связи в чате внизу экрана",
    hero_typed: "Рады видеть. Расскажите, какая техника нужна — а мы уже позаботимся об остальном.",
    pill_catalog: "Каталог техники",
    pill_request: "Оставить заявку",
    pill_add: "Добавить технику",
    pill_contact: "Связь: demolis@ukr.net",
    how_it_works_label: "ПРОЦЕСС",
    how_it_works_title: "Как это работает",
    step_1: "Выберите технику и даты или опишите задачу",
    step_2: "Диспетчер проверяет и подтверждает",
    step_3: "Подтверждение приходит в ваш кабинет",
    step_4: "Контакты открываются обеим сторонам",
    step_5: "Техника закреплена за вами на ваши даты",
    status_available: "ДОСТУПНА",
    status_busy: "ЗАНЯТА",
    sort_default: "По умолчанию",
    sort_price_asc: "Сначала дешевле",
    sort_price_desc: "Сначала дороже",
    guide_listing_one: "объявление в каталоге",
    guide_listing_many: "объявлений в каталоге",
    guide_parts_label: "Основные части",
    guide_uses_label: "Где используется",
    guide_choose_btn: "Выбрать эту технику",
    dispatcher_all: "Все заявки",
    dispatcher_new: "Новые",
    dispatcher_progress: "В работе",
    dispatcher_done: "Выполненные",
    request_step_1: "Что нужно выполнить",
    request_step_2: "Техника и локация",
    request_step_3: "Сроки и бюджет",
    request_step_4: "Контакт",
    hero_title_1: "Техника находится за час,",
    hero_title_2: "а не за неделю",
    hero_sub: "Клиенты оставляют заявку — владельцы техники сами откликаются. Диспетчер контролирует каждую отправку вручную, поэтому ни одна заявка не теряется.",
    hero_search_placeholder: "Что ищете? Напр. экскаватор",
    hero_search_btn: "Найти",
    hero_cta_client: "Ищу технику",
    hero_cta_owner: "Сдаю технику в аренду",
    viewer_label: "3D-модель в каталоге",
    viewer_title: "CAT M320 — покрутите сами",
    viewer_hint: "🖱️ Потяните, чтобы покрутить",
    categories_label: "Категории техники",
    categories_title: "Выберите, что нужно",
    trust_line: "Платформа только запускается — присоединяйтесь одними из первых",
    add_listing_btn: "+ Добавить технику в каталог",
    add_request_btn: "+ Оставить заявку на технику",
    favorites_btn: "Избранное",
    recently_viewed: "Вы недавно просматривали:",
    filter_price_placeholder: "Цена до, ₴/час",
    filter_all: "Все",
    respond_btn: "Забронировать",
    busy_btn: "Занято",
    busy_until: "Занято до",
    catalog_empty: "Ничего не найдено по этим фильтрам.",
    faq_label: "Частые вопросы",
    faq_title: "Прежде чем начать",
    footer_desc: "Биржа аренды строительной техники. Клиенты и владельцы техники находят друг друга напрямую.",
    footer_contacts: "Контакты",
    footer_info: "Информация",
    footer_terms: "Условия использования",
    footer_privacy: "Политика конфиденциальности",
    footer_for_owners: "Для владельцев техники",
    footer_dispatcher: "Панель диспетчера",
    profile_title: "Личный кабинет",
    register_title: "Регистрация",
    request_title: "Заявка на технику",
    add_listing_title: "Добавить технику",
    ai_widget_title: "Помощник ТехМайданчика",
    ai_placeholder: "Опишите задачу...",
    ai_greeting: "Привет! Опишите, какую работу нужно выполнить — подберу технику, объясню варианты и разницу между ними. Или выберите вид работ ниже.",
    faq_items: [
      { q: "Сколько стоит размещение техники в каталоге?", a: "Регистрация и добавление объявлений бесплатны. Мы не берём комиссию со сделок — владелец и клиент договариваются напрямую." },
      { q: "Как быстро подтвердят бронь?", a: "Диспетчер проверяет технику и даты и подтверждает вручную — обычно в течение часа в рабочее время. Подтверждение и контакт владельца появятся в «Моём кабинете», вы получите уведомление. Для этого нужен аккаунт — регистрация занимает минуту." },
      { q: "Что если подходящей техники не найдётся?", a: "Вывесите заявку на «Доске запросов»: даты, срок и цену, которую готовы заплатить. Владельцы сами предложат свою технику, вы выберете, а диспетчер подтвердит аренду — и откроются контакты. Диспетчер также запрашивает владельцев напрямую. Заявка остаётся активной, пока вы её не отмените." },
      { q: "Можно ли проверить владельца техники перед сделкой?", a: "В профиле владельца отображается отметка верификации — мы проверяем контакты и документы перед её выдачей." },
    ],
  },
  en: {
    tagline: "construction equipment exchange",
    nav_login: "Log in / Sign up",
    nav_client: "Find equipment",
    nav_owner: "Rent out equipment",
    nav_my_requests: "My requests",
    hero_badge: "First construction equipment exchange",
    ai_hint_line1: "Meet TechMaydanchyk's AI assistant,",
    ai_hint_line2: "always available in the chat below",
    hero_typed: "Good to see you. Tell us what equipment you need — we'll take care of the rest.",
    pill_catalog: "Equipment catalog",
    pill_request: "Post a request",
    pill_add: "Add equipment",
    pill_contact: "Contact: demolis@ukr.net",
    how_it_works_label: "PROCESS",
    how_it_works_title: "How it works",
    step_1: "Pick equipment and dates, or describe the job",
    step_2: "The dispatcher checks and confirms",
    step_3: "Confirmation arrives in your cabinet",
    step_4: "Contacts open for both sides",
    step_5: "The equipment is reserved for your dates",
    status_available: "AVAILABLE",
    status_busy: "BUSY",
    sort_default: "Default",
    sort_price_asc: "Price: low to high",
    sort_price_desc: "Price: high to low",
    guide_listing_one: "listing in catalog",
    guide_listing_many: "listings in catalog",
    guide_parts_label: "Main parts",
    guide_uses_label: "Used for",
    guide_choose_btn: "Choose this equipment",
    dispatcher_all: "All requests",
    dispatcher_new: "New",
    dispatcher_progress: "In progress",
    dispatcher_done: "Completed",
    request_step_1: "What needs to be done",
    request_step_2: "Equipment and location",
    request_step_3: "Timing and budget",
    request_step_4: "Contact",
    hero_title_1: "Equipment found in an hour,",
    hero_title_2: "not a week",
    hero_sub: "Clients post a request — equipment owners respond themselves. A dispatcher manually controls every send, so no request gets lost.",
    hero_search_placeholder: "What are you looking for? E.g. excavator",
    hero_search_btn: "Search",
    hero_cta_client: "Find equipment",
    hero_cta_owner: "Rent out equipment",
    viewer_label: "3D model in the catalog",
    viewer_title: "CAT M320 — spin it yourself",
    viewer_hint: "🖱️ Drag to rotate",
    categories_label: "Equipment categories",
    categories_title: "Choose what you need",
    trust_line: "The platform is just launching — be one of the first to join",
    add_listing_btn: "+ Add equipment to catalog",
    add_request_btn: "+ Post an equipment request",
    favorites_btn: "Favorites",
    recently_viewed: "You recently viewed:",
    filter_price_placeholder: "Price up to, ₴/hr",
    filter_all: "All",
    respond_btn: "Book",
    busy_btn: "Busy",
    busy_until: "Busy until",
    catalog_empty: "Nothing found for these filters.",
    faq_label: "Frequently asked questions",
    faq_title: "Before you start",
    footer_desc: "Construction equipment rental exchange. Clients and equipment owners find each other directly.",
    footer_contacts: "Contacts",
    footer_info: "Information",
    footer_terms: "Terms of use",
    footer_privacy: "Privacy policy",
    footer_for_owners: "For equipment owners",
    footer_dispatcher: "Dispatcher panel",
    profile_title: "Personal account",
    register_title: "Sign up",
    request_title: "Equipment request",
    add_listing_title: "Add equipment",
    ai_widget_title: "TechMaydanchik Assistant",
    ai_placeholder: "Describe your task...",
    ai_greeting: "Hi! Describe the work you need done — I'll pick the equipment and explain the options and differences. Or choose a job type below.",
    faq_items: [
      { q: "How much does listing equipment in the catalog cost?", a: "Registration and adding listings are free. We don't take a commission from deals — the owner and client arrange things directly." },
      { q: "How fast is a booking confirmed?", a: "The dispatcher checks the equipment and dates and confirms manually — usually within an hour during business hours. The confirmation and the owner's contact appear in your cabinet and you get a notification. An account is needed — signing up takes a minute." },
      { q: "What if no suitable equipment is found?", a: "Post your request on the Wanted board: dates, term and the price you are ready to pay. Owners offer their equipment, you choose, and the dispatcher confirms the rental — then contacts open. The dispatcher also asks owners directly. Your request stays active until you cancel it." },
      { q: "Can I verify the equipment owner before a deal?", a: "A verification badge is shown on the owner's profile — we check contacts and documents before granting it." },
    ],
  },
};

function useTranslate(lang) {
  return (key) => TRANSLATIONS[lang]?.[key] ?? TRANSLATIONS.uk[key] ?? key;
}

// ---- Font injection (Oswald for display, Inter for body, JetBrains Mono for specs) ----
const FontLink = () => (
  <link
    rel="stylesheet"
    href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
  />
);

// ---- Seed data ----
const TYPES = [
  "Екскаватор",
  "Навантажувач",
  "Самоскид",
  "Гідромолот",
  "Кран",
  "Бульдозер",
  "Каток",
];

// Display-only translation of type names; TYPES stays the internal key everywhere (filters, icons, EQUIPMENT_INFO)
const TYPE_LABELS = {
  uk: { "Екскаватор": "Екскаватор", "Навантажувач": "Навантажувач", "Самоскид": "Самоскид", "Гідромолот": "Гідромолот", "Кран": "Кран", "Бульдозер": "Бульдозер", "Каток": "Каток" },
  ru: { "Екскаватор": "Экскаватор", "Навантажувач": "Погрузчик", "Самоскид": "Самосвал", "Гідромолот": "Гидромолот", "Кран": "Кран", "Бульдозер": "Бульдозер", "Каток": "Каток" },
  en: { "Екскаватор": "Excavator", "Навантажувач": "Loader", "Самоскид": "Dump Truck", "Гідромолот": "Hydraulic Hammer", "Кран": "Crane", "Бульдозер": "Bulldozer", "Каток": "Road Roller" },
};
const tType = (type, lang) => (TYPE_LABELS[lang] && TYPE_LABELS[lang][type]) || type;

const REGIONS = [
  "Київ",
  "Харків",
  "Дніпро",
  "Одеса",
  "Львів",
  "Запоріжжя",
  "Вінниця",
  "Житомир",
  "Івано-Франківськ",
  "Кропивницький",
  "Луцьк",
  "Миколаїв",
  "Полтава",
  "Рівне",
  "Суми",
  "Тернопіль",
  "Ужгород",
  "Хмельницький",
  "Черкаси",
  "Чернігів",
  "Чернівці",
  "Мукачево",
  "Інше",
];

const seedListings = [
  {
    id: 1,
    type: "Екскаватор",
    brand: "CAT M320",
    region: "Миколаїв",
    price: 1450,
    unit: "год",
    specs: { "Об'єм ковша": "1.2 м³", "Вага": "20.5 т", "Виліт стріли": "9.9 м" },
    owner: "МиколаївБудуй",
    photos: [],
    available: true,
  },
  {
    id: 2,
    type: "Гідромолот",
    brand: "CAT M320 + Hammer HM950",
    region: "Мукачево",
    price: 1250,
    unit: "год",
    specs: { "Енергія удару": "950 Дж", "Вага молота": "950 кг" },
    owner: "БудТехСервіс",
    photos: [],
    available: true,
  },
  {
    id: 3,
    type: "Самоскид",
    brand: "МАЗ 5551",
    region: "Львів",
    price: 850,
    unit: "год",
    specs: { "Вантажопідйомність": "10 т", "Об'єм кузова": "6 м³" },
    owner: "ЛьвівБуд",
    photos: [],
    available: false,
    busyUntil: "2026-09-12",
  },
  {
    id: 5,
    type: "Каток",
    brand: "BOMAG BW 120 AD",
    region: "Київ",
    price: 1100,
    unit: "год",
    specs: { "Клас": "Середній (7 т)", "Тип вальця": "Гладковальцевий вібраційний" },
    owner: "КиївДорБуд",
    photos: [],
    available: true,
  },
  {
    id: 4,
    type: "Кран",
    brand: "Liebherr LTM 1050",
    region: "Київ",
    price: 2200,
    unit: "год",
    specs: { "Вантажопідйомність": "50 т", "Виліт стріли": "40 м" },
    owner: "КиївКранСервіс",
    photos: [],
    available: true,
  },
];

const TAGLINE_ICONS = [IconExcavator, IconLoader, IconDumpTruck, IconHammer, IconCrane, IconBulldozer, IconRoller];

function MorphingTagline({ text }) {
  const letters = text.split("");
  return (
    <span style={{ display: "inline-flex" }}>
      {letters.map((ch, i) =>
        ch === " " ? (
          <span key={i} style={{ width: "0.4em" }}>&nbsp;</span>
        ) : (
          <span
            key={i}
            className="morph-letter"
            style={{ animationDelay: `${i * 0.1}s` }}
          >
            <span className="morph-face morph-front">{ch}</span>
            <span className="morph-face morph-back">
              {(() => {
                const Icon = TAGLINE_ICONS[i % TAGLINE_ICONS.length];
                return <Icon size={16} />;
              })()}
            </span>
          </span>
        )
      )}
    </span>
  );
}

// ---- FAQ accordion ----
function FaqAccordion({ items }) {
  const [openIndex, setOpenIndex] = useState(0);
  return (
    <div>
      {items.map((item, i) => (
        <div key={i} className="faq-item">
          <button className="faq-question" onClick={() => setOpenIndex(openIndex === i ? null : i)}>
            <span>{item.q}</span>
            <span style={{ color: "#FF6A1A", fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif", flexShrink: 0 }}>
              {openIndex === i ? "−" : "+"}
            </span>
          </button>
          <div className={`faq-answer${openIndex === i ? " open" : ""}`}>
            <p>{item.a}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---- Equipment icons: filled realistic silhouettes (own original geometry, no brand marks) ----
const ICON_DARK = "rgba(0,0,0,0.55)";

function IconExcavator({ size = 24, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" style={style} fill="currentColor">
      <path d="M2 24.5c0-1 .8-1.8 1.8-1.8h13.4c1 0 1.8.8 1.8 1.8v1.7H2z" />
      <rect x="4" y="19.5" width="8.5" height="4" rx="0.8" />
      <path d="M11 20.5l1.6-1.3 12-9.8c.6-.5 1.5-.4 2 .2s.4 1.5-.2 2l-8.2 8-.9 3.4z" />
      <path d="M15.5 24.8l4.2-4.1 3 2.4-2.6 3.4-4.2-.4z" />
      <rect x="2.5" y="18.5" width="1.6" height="8" rx="0.6" fill={ICON_DARK} />
      <circle cx="6" cy="26.5" r="1.4" fill={ICON_DARK} />
      <circle cx="10.5" cy="26.5" r="1.4" fill={ICON_DARK} />
    </svg>
  );
}
function IconLoader({ size = 24, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" style={style} fill="currentColor">
      <path d="M3 18.5c0-1 .8-1.8 1.8-1.8h9.4c1 0 1.8.8 1.8 1.8v6.8H3z" />
      <path d="M14 22.3l7.4-8.6c.5-.6 1.4-.6 2-.1s.6 1.4.1 2l-6 7.6z" />
      <path d="M18.2 21.6l4-4.6 2.6 2.3-3.4 4.2-3.2-1.9z" />
      <circle cx="7.5" cy="26.5" r="2.6" fill={ICON_DARK} />
      <circle cx="15" cy="26.5" r="2.6" fill={ICON_DARK} />
      <circle cx="7.5" cy="26.5" r="1" fill="currentColor" />
      <circle cx="15" cy="26.5" r="1" fill="currentColor" />
    </svg>
  );
}
function IconDumpTruck({ size = 24, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" style={style} fill="currentColor">
      <path d="M2.5 15c0-.8.6-1.4 1.4-1.4h6.6c.8 0 1.4.6 1.4 1.4v9.5H2.5z" />
      <path d="M4.5 16.2h4.5v3.6H4.5z" fill={ICON_DARK} />
      <path d="M12 24.5V14l4.4-3.5h9.6c.8 0 1.4.6 1.4 1.4v12.6z" />
      <circle cx="7" cy="26.5" r="2.6" fill={ICON_DARK} />
      <circle cx="21" cy="26.5" r="2.6" fill={ICON_DARK} />
      <circle cx="7" cy="26.5" r="1" fill="currentColor" />
      <circle cx="21" cy="26.5" r="1" fill="currentColor" />
    </svg>
  );
}
function IconHammer({ size = 24, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" style={style} fill="currentColor">
      <path d="M11 2.5h9c.8 0 1.4.6 1.4 1.4v10.6h-11.8V3.9c0-.8.6-1.4 1.4-1.4z" />
      <rect x="9.5" y="15.5" width="12" height="3.6" rx="0.6" fill={ICON_DARK} />
      <path d="M12.5 19.5h2.4l-.9 8h-.6z" />
      <path d="M16.6 19.5h2.4l-.9 8h-.6z" />
    </svg>
  );
}
function IconCrane({ size = 24, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" style={style} fill="currentColor">
      <path d="M2.5 25h13.5v2.3H2.5z" fill={ICON_DARK} />
      <path d="M5.7 4h2.6v22H5.7z" />
      <path d="M6.2 3.2l21 3.4c.9.15 1.35 1.2.8 1.9-.35.45-.95.65-1.5.5l-20.3-5.4z" />
      <path d="M6.2 3.2L1 8.2l1.3 1.4 4.6-5.1z" />
      <path d="M20.5 6.5l1.3.2v8.6h-1.3z" fill={ICON_DARK} />
      <circle cx="21.1" cy="16.2" r="1.6" fill={ICON_DARK} />
    </svg>
  );
}
function IconBulldozer({ size = 24, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" style={style} fill="currentColor">
      <path d="M2.5 17c0-.9.7-1.6 1.6-1.6h4.4c.9 0 1.6.7 1.6 1.6v6.5H2.5z" fill={ICON_DARK} />
      <path d="M9 10.5c0-.8.6-1.4 1.4-1.4h9.2c.8 0 1.4.6 1.4 1.4v6.5H9z" />
      <path d="M9 16.7h4.5v3.2H9z" fill={ICON_DARK} />
      <rect x="4" y="23.5" width="21" height="2.6" rx="0.8" fill={ICON_DARK} />
    </svg>
  );
}

function IconRoller({ size = 24, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" style={style} fill="currentColor">
      <circle cx="7" cy="19" r="5.2" />
      <circle cx="7" cy="19" r="2" fill={ICON_DARK} />
      <path d="M11 15.5h11.5c.8 0 1.4.6 1.4 1.4v5.6H11z" fill={ICON_DARK} />
      <path d="M13.5 16.7h5.2v3.2h-5.2z" />
      <circle cx="24" cy="24" r="2.6" fill={ICON_DARK} />
      <rect x="10" y="24" width="9" height="2.4" rx="0.6" fill={ICON_DARK} />
    </svg>
  );
}

const ICONS_BY_TYPE = {
  Екскаватор: IconExcavator,
  Навантажувач: IconLoader,
  Самоскид: IconDumpTruck,
  Гідромолот: IconHammer,
  Кран: IconCrane,
  Бульдозер: IconBulldozer,
  Каток: IconRoller,
};

function SectionDivider({ n, of, title }) {
  return (
    <div className="section-divider mo-io">
      <span className="num">{String(n).padStart(2, "0")}</span>
      <span className="line" />
      <span className="title">{title}</span>
      <span className="line" />
    </div>
  );
}

// ---- User-provided illustrated icons (their own generated artwork) for 5 of the 7 types ----
const ICON_IMG_EXCAVATOR = "data:image/jpeg;base64,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";
const ICON_IMG_CRANE = "data:image/jpeg;base64,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";
const ICON_IMG_LOADER = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBAUEBAYFBQUGBgYHCQ4JCQgICRINDQoOFRIWFhUSFBQXGiEcFxgfGRQUHScdHyIjJSUlFhwpLCgkKyEkJST/2wBDAQYGBgkICREJCREkGBQYJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCT/wAARCAB4AHgDASIAAhEBAxEB/8QAHAAAAQQDAQAAAAAAAAAAAAAAAAMEBgcBAgUI/8QASRAAAgEDAQQFAxAIBAcAAAAAAQIDAAQRBQYSITEHE0FRYSJxkRUXGCMyQlVWYoGSlKGx0uIUJDNDUlOCwWRydLMWNEVGVLLh/8QAGgEAAgMBAQAAAAAAAAAAAAAAAAMBAgQFBv/EADERAAEDAgQEBAUEAwAAAAAAAAEAAhEDBAUSITETQVGhFCIj0RUWUlNhBnGBwSSRsf/aAAwDAQACEQMRAD8A9P1msVk1dUWDRTe+1C10y1ku725htreIZeWVgqqPPUEvenHZW2lMdut/egHG/FCFU+beIJ9FSBKJhWHWarT1+dnz/wBN1X6Kfio9fjQPg3Vfox/ioylRIVl0VWnr8aB8Gar9FPxUevxoHwbqn0U/FU5SiQrKoqtfX30D4M1X0J+KsevxoHwZqnoT8VGUokKy6KrX199B+DNU9Ef4qPX30D4N1T0J+KoylEhWVWKru16c9mJ5RHPDqNop/eSRBlHn3ST9lTjTdVstYs473T7qG6t5PcyxNkHw8D4GiIUyndFFFQhZVsitZJVQEswVRxJPICkbeXeQGuB0g3j2ex2tTxNuulnJg92Rj+9CFRXSZ0kS7S6jI++3qdA5SztgeDY/eN4nnnsGBVcTajc3DFjKyD+FOAFY1aQm5VPeogxTVTTgIS906W4nz+3l+kaUW4n/AJ0v0jTdKXQUISyzTH99J9I1t1s386T6RrVVpULUqFr1s382T6RrRpZh++k+kaWt4JbxGktoXlRQCzBkUAHkSWYYzWv6LNLJ1UbWbSkEiIXsTyHALHCRszHABJ4chSzVYDE6qwY7eE3aeccppfpGk2uLj+fL9I07Wwkkmkt1utKe5jYpJb+qEaTIw5gpJufYTWl9pWo6cgkvdOvbaNiAJZIT1ZJ5AOMr9tQ2tTJgHVWNNwEkJvHf3MDZEznwY5B9NTro96RrnZjUlu4Sxt3YLeWoPkyJ/EPlDmD83I1XrmltJcregA8GUg0zdUXty1u4ruCOeFxJHKodGHJlIyD6KKiXRZdyXOwuivI2WWAx58FdlH2AUUpMUmtH9rFRnpNfGxGu/wCjf+1SKz/Ziox0ntjYXXj/AIN/vFA3RyXlDU2zef0j+9JJRfNm6P8AlFaxmmpcp1HxpzGKaxmnCSBVLMQABkk8gKEJ0oouG6iHrGbcUMoZsgboLAE8eHI1r1yR2lzdM8MaW0ayMtxJ1LOCcDcDgb55cuWR30kdY0+ROrllXDqPJkQ4YEcuWDUZx1RlKsroP2R0baPZ691zWbNL2a3kMNl1pLJbIYUZwinyebDjildQ2es7zX7rTcR/o1uEl6t4VIbhvYI5cO+kNjtudJ2X2HMUV5bS3dxcXMxt0kXeRSyqpYe9G6gIz3io0+0Gp6/cautnZ3c0tzbFnZ8KqxoFZyGIUHKlcAdjZrVTcxjZcVzKzKlSqQ1R3Utm7fTNf1a2tLFtUhsTEMJCXUB4jxKJw91ujz0jf7PRaLY2FxGOp6+e8gmhUlVDQtHgkZwSN49nCsaBrF3oO099OqdVPGDG0ch5EYUg7pwfTW6R61ttcHT9Pjgkmjmv7gRvKsKKzhS2HbhnhndJzgGk1HU8hqE6dlpp8XiCn09kymWSGTq5YzG+4sm6SCQrDK5APAkccHB4jhxpXTW/XUPgfuro6/sjtFoUt1c6noGp20LvvmfqOsiHkgcXjLKOIPM1xtPmWS4SSNgykHBU5B4Upr2uEtMrWQRuvVvRI+dhNI/ySf7jUUl0PtnYHRz8iT/daiqHdXCmlp+zFRbpTONgtoD/AINvvFSm0GIxUT6Vjjo/2h/0TfeKAheSrts3B8woRqw8fWSvI0qKiMqsN8Bz2ndB5nBHPhxpYDTux9W+ZYD/AHFMS1ujUszb8fVEDMpWMA9pYgYpJPU5eJuNWHntYW+6UU+0vULKC6BgmeRy0Y3buEW5wJFY7rh2XJA5Nu5wOPYaVXEMJaJKuwAuAJU02r0xrXT9Mhi1S5ilSW5ja5ZBIxRmkduB4E4jUDiB38BXN0fXds5uq07SNobq6WGIQ2sPV7xlZVHkjygAigDeckAZrW72p0UzRrr8UCsrjqmvoS6ou6CSEIIDAmQkkcRjBxUytLjTtntHudbt7K3sBfIJRHFCEKWyjMSEADiV9sbvZ/kjHgq1xVoUstcEmdJAgknYf30XqmUmPdNONfzsB+P+Lmw7Pafsvo9tcbSi21G7tWadUjh34Y5nJJKqRmV8kgZGOAwvDeqLbRW0mvbOnV7m+vRO4LppqrIHjlkn8tn4eV7WFGMdlJ6o2o7cv196Tb2yAyRQYYSRKQCkrA7o3XyQH3uzABGSY/Lsq9qf1fanUbNySF6xyApHfuniD3jNdrDcNrmK9w+HzMDYDoP35ndcy9uqTfSpCR15ymun2sMcrkyuwAwY1XdPZwJB4cuzB49lSLZvWhYaxEiJIzBLgJFGB5KmLdyASABkj01HYZdQkv8A9A1iHT7+/i3VjuroNIk8DNgNvKyklWxgnjhmB5Vus9zbXTm3061sZFQh5beCQgsrFWjJZyMZ49h5V27iK2a2cNCOy51JvDArg7Hurkv+kWez0m8ntWeyuwm7DNK0SL1h4gcX48OzxFQza+6g1vSNA2hWzsYNSupZoL6W0QIsxAO6TunBOUPHieJGaiKS3Os3E4aa2kgQdRvMF3j/ADG5+SC3hyAFdC+1EW2iadokUiXCre70E+QiglX3lfPuT5XDsPhyrkW+DtsXs8KDGbXXcQR/qYW2rei4a7jRMaac59l6U6Gxjo90X/JL/uvRTfoSuBLsLZWrEddZPJDKAwZclusBVgcEFXX7aK7x3XNCmezl6b7Q7C6a4guWnt45GmtwRHISoJZAeIU8xnsqO9LJz0fbRAf+E/3in3Rzp95pux2l2moW09tdRRbksc8okcHePEkEjB5hRwUEDsrg9OOq2mm9HmrR3Em619GLSIDmSxySPMqsfmFCF5G1h2ghidD7Yzdcx7lPBB86je/rFJWt8bp44oYZJJpDurHGpZmbuAHE1Mtiei3X+keaS8K+p+jF/bdQlQlcZ9xCo4yMOA4eSMcT2V6P2K2E2V6P7HOh6duXDDdkvbkZuZiO9iOC+C4HgayXWIU6Gm5TaNq+prsF5Iv0u9Jn6jUrK6sZsZ6u4iaNseYgUiNRjA8mQ+mvTHSBoVvtHbyXF3FHO6Z31cZDL2H5u/u81UXtDsXBZRS3GnRB0jBLW7nyh4K3b5jx89KtcUZV8rxBTq2HvYMzTISWiIk2iXktykc8V262cEUo3l4eU7AdnEoMjB8k11dp9r7gwW+kyXYknuJVRZLh8bsJCk77Ljt3kzz7eYpGGxEE1rYKwMWmwCMkcmlbJdvSWPmIrkbbwx2baXqYZVZZGt33lDAqRvDh283GPGtVxaUq5bxBOUyEijc1KM5DuIXXOpxFerdbG3CMUt7e73rqWJc/skU8FQEnDnPDljgKSjsYnifU7qzmu7SOQR9VFcNAsS53QcrxyWyq+9G7kg5qMRahLvGMTKkTvxC+W8p8Tz3R/aptssJrywk07r7OO3kYSTNcTLHuorF8gsQMZODjJGOXEUjE6lSnRzU+on9k3D2MfVipsuBqsJttYsbcNJIIb1IUlYAF4JAGXex243fDOac7b2KaftNPFFOYw4kCR+Ud4vErdnAeUDzrTaBv+Idq44NOmWGLrVZZ5MoEjjQIrngSuSAeWeIrO0ezs+k2T6vJr+natNGyFosSySJzG+CwAwOGR3capTJ4tOpUdBywRzkwruA4b2MEiZB/AlZ0JH1R7DSi8kUc8kUW7JJwGfkjAXPhxPnrbaGwbTLNAot2mSdomMEYjSR4pFAYLyGQxH/3OY7omoxxSoHwiKRxUciORzwyfN2V39RnutoLm3tdJsZZ4rVQ7pbq77gznJJ8olmA7Pe47CS6qyr4hrwfKN0mm9nBc0jzL0f0DWhh2Cs7yRszX8kk8gHJcHq1A/pjHzk0U/6FFeLo40SOaN4pFjlDJIpVh7c/MHiKK1TKSFLn1K3020ea5kAVELbo902ByA7SarHVrCx6Qb211XavqWtrQE2mhW8hZFLYO9cSDHWNgAFVwgxjLcatFLKG4iHWxI5AwCRxqJbTbPabpdheapcWvXrbRNO4tkMcrBRk43WAJwK5l94iPT27rbbcGfPunlrqTC0iRbdIAiBUijG6ka9gUdgFcHV9dYIYIZm3E4NIzZ+0/fUX03aDZXaayNzoW1s1nID+wv5QMeBVsNjxBNaMEt2DzbT7NgqcqzT7+6fAZrz5ovBhw1XWY9h1BSkuowszmK4UScQ2W4nwOeyoHr92sV2MFerUm4fA4YT3Ppcqf6TU6uNlNR1tDc2mpWV5IwOH6p41J8+DkVGNS6OdYkEiavrezmnRSgK7Nc7z4APAbxUDmfe9ta7EMbUzvOyVdOJZlZzUSsGxbLKVLPKd9u8Z5egY9FaxXk812xiVZoIY3hZtwOrs+AwHPkoxkdpPdUpi2E2DhI9U9urC6Yc1e93wfmBC/ZUn0xejWwQJDtLpZIGAP0hUGO7lwFba90505QTP4WWjRY2JIVCX2y+owzu1jG80LH3jASBe45++nOnWG0i+0x6LqDkngBFlc9nE/fXoSHUtjYJkddZ2YaHdO+Wut597sxk4x56cz9JmwmkxnOuacWUe5tFMjHzbo/vUtxG4jKGT/BVXWlCZzQqo2e6NNVSOS/1GEQTSjy2lk3VReYXJ+3xqYWXRQ06rJLcQhGGQY5CwI844VHNrOnnULu96rZuKKyslIBnurdZZn72Ck4Udw4nxpJelW1EP6ztftpNJjlaWFpbID4czS3211U879CVdtzRYMjeSl56GdkIWUz6Nc30jMAwgRgAO0niBiulrezg2G2bm1DZDR9GspbcGaU36EEqBzUkgb/dk8eyqQ1LpJ2muLqUWm02v/ohPtYnuAJMfK3MD0VwbrU73U5A99e3N22c5nmaT/wBia0Mw6qSDUfI6apLrxgnI3Vev+iPWrzaTYjS9Y1F0kvLtJGldE3QcSMo4dnACikuhK0e06NNAjlUqzQNJg9zSMw+wiiumzKB5NlhcST5t1O7PPVjNMdZXfgkTAO8pGDyNdW2jwgFNdRhyp4UPYHtLTzQ0kGQvFnSTsJNsjrcrpb50m6kLWsmMiMniYj3EdneMeNRS2c2c6XFuxhmjO8kkZ3WU94I5GvY+0Wi2mpW81td2sVzbTDEsMi5VvHz1Umr9BGkXMzPpmp3dgCf2UqCZV8xJB9Oa4NPGPA/4+IAiNnRIcP6PVdB1lx/Utz/HMKo73aXWtS/53WdTuezEt3Iw9Ga5x3Sd4qCe886tv2PrH/uVfqf56z7H0/GUfU/z00fqTDG7VOx9lQ4ZdHdvcKpQ2OXCjeq2vY/N8ZR9T/PR7H9vjKPqf56n5mw37nY+yj4Xc/T3CqXIFG/Vtex/b4yj6n+ej2Pp+Mo+p/nqfmbDfudj7I+FXP09wqkL1jeq2/Y/H4yj6n+ej2PzfGVfqf56PmbDfudj7I+F3P09wqjJqR7BbG3W2etpbqrrYQsGu5xyVP4Qf4m5AfP2VY2l9AumwThtS1i6vEH7qCIRb3nOWPoq2tmtnLDSLWG0sLSO1touKRIOZ7yeZPieNIqY34z0MOBJO7oIDR113PRXbY8H1LnQDlzKlugQrbWcECIqJGgRVXkoHIDzUU80+LCiiu7SpimwMHIQsLnZiXHmupEuFxSVzHvg0UVdVXCvrHfzgVx5tN4+5oooIB0KlImwP8I9FY/QPkj0UUVXhs6Kcx6rHqf8keij1P8Akiiip4bOiMx6rPqf8kUep/yBRRUcNvQKMx6o9T/kj0Uep+fej0UUUcNnQIzHqlYdO4+5rsWNhuYOKKKsABoEFd22i3VFFFFChf/Z";
const ICON_IMG_ROLLER = "data:image/jpeg;base64,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";
const ICON_IMG_DUMPTRUCK = "data:image/jpeg;base64,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";

const ICON_IMG_HAMMER = "data:image/jpeg;base64,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";
const ICON_IMG_BULLDOZER = "data:image/jpeg;base64,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";
const ILLUSTRATED_ICONS = {
  "Екскаватор": ICON_IMG_EXCAVATOR,
  "Кран": ICON_IMG_CRANE,
  "Навантажувач": ICON_IMG_LOADER,
  "Каток": ICON_IMG_ROLLER,
  "Самоскид": ICON_IMG_DUMPTRUCK,
  "Гідромолот": ICON_IMG_HAMMER,
  "Бульдозер": ICON_IMG_BULLDOZER,
};

function EquipmentIcon({ type, size = 24, style }) {
  const illustrated = ILLUSTRATED_ICONS[type];
  if (illustrated) {
    return (
      <img
        src={illustrated}
        alt={type}
        width={size}
        height={size}
        style={{ objectFit: "cover", borderRadius: size > 32 ? 10 : 6, border: "2px solid #FF6A1A", ...style }}
      />
    );
  }
  const Comp = ICONS_BY_TYPE[type] || IconExcavator;
  return <Comp size={size} style={style} />;
}

// ---- Equipment guide: flippable educational cards (own original copy/icons) ----
const EQUIPMENT_INFO = {
  "Екскаватор": {
    definition: "Гусенична або колісна машина для копання ґрунту, розробки котлованів і навантажувальних робіт на будь-якій поверхні.",
    parts: ["Стріла", "Рукоять", "Ковш", "Кабіна"],
    uses: ["Земляні роботи", "Знесення", "Траншеї", "Котловани"],
  },
  "Навантажувач": {
    definition: "Компактна колісна машина для швидкого переміщення сипучих матеріалів і будівельного сміття на невеликих майданчиках.",
    parts: ["Стріла", "Ківш", "Кабіна", "Шасі"],
    uses: ["Прибирання снігу", "Навантаження сипучих", "Планування майданчика"],
  },
  "Самоскид": {
    definition: "Вантажівка з підйомним кузовом для вивезення ґрунту, щебеню та будівельних матеріалів з об'єкта.",
    parts: ["Кузов", "Кабіна", "Гідроциліндр", "Шасі"],
    uses: ["Вивезення ґрунту", "Доставка щебеню", "Перевезення сміття"],
  },
  "Гідромолот": {
    definition: "Навісне обладнання, що руйнує бетон, асфальт і тверді породи за рахунок ударної сили.",
    parts: ["Корпус", "Долото", "Кріплення"],
    uses: ["Руйнування бетону", "Демонтаж фундаментів", "Дроблення асфальту"],
  },
  "Кран": {
    definition: "Підіймальна техніка для монтажу конструкцій і переміщення важких вантажів на висоту.",
    parts: ["Щогла", "Стріла", "Гак", "Противага"],
    uses: ["Монтаж конструкцій", "Підйом вантажів", "Висотні роботи"],
  },
  "Бульдозер": {
    definition: "Гусенична машина з відвалом для розрівнювання, зрізання та переміщення великих обсягів ґрунту.",
    parts: ["Відвал", "Гусениці", "Кабіна"],
    uses: ["Розрівнювання ділянки", "Зрізання ґрунту", "Розчищення території"],
  },
  "Каток": {
    definition: "Дорожня машина для ущільнення ґрунту, щебеню та асфальту вагою вальця. Легкі (до 5 т), середні (6-10 т) і важкі (понад 10 т) — залежно від товщини шару, що ущільнюється.",
    parts: ["Валець", "Кабіна", "Вібраційний механізм"],
    uses: ["Ущільнення асфальту", "Ущільнення ґрунту", "Будівництво доріг"],
  },
};

const carouselArrowStyle = (side) => ({
  position: "absolute",
  [side]: -6,
  top: "38%",
  zIndex: 5,
  width: 30,
  height: 30,
  borderRadius: "50%",
  border: "1px solid #63696D",
  background: "#15181A",
  color: "#ffffff",
  fontSize: 16,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
});

// ---- Small UI atoms ----
// ---- Main App ----
export default function EquipmentMarketplace() {
  const [role, setRole] = useState("client"); // client | owner
  const [lang, setLang] = useState("uk"); // uk | ru | en
  const t = useTranslate(lang);
  const [listings, setListings] = useState(supabase ? [] : seedListings);
  const [listingsReady, setListingsReady] = useState(!supabase); // каталог завантажено з бази
  const [listingsFromDb, setListingsFromDb] = useState(false);
  const [filterType, setFilterType] = useState("Усі");
  const [filterRegion, setFilterRegion] = useState("Усі");
  const [showAddForm, setShowAddForm] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [detailListing, setDetailListing] = useState(null);
  const [detailPhotoIndex, setDetailPhotoIndex] = useState(0);
  const openDetail = (l) => {
    setDetailListing(l);
    setDetailPhotoIndex(0);
  };
  const [aiOpen, setAiOpen] = useState(false);
  const [requests, setRequests] = useState([]);
  const [dispatchOwners, setDispatchOwners] = useState([]); // справжні власники з бази (для диспетчера)
  const [ownerInbox, setOwnerInbox] = useState([]); // запити, надіслані цьому власнику
  const [showInbox, setShowInbox] = useState(false);
  const [ownerBookings, setOwnerBookings] = useState([]); // оренди техніки цього власника
  const [ownerTab, setOwnerTab] = useState("rentals");
  const [clientData, setClientData] = useState({ requests: [], offers: [], bookings: [] }); // кабінет клієнта
  const [clientTab, setClientTab] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [busyRanges, setBusyRanges] = useState([]); // зайнятість техніки для каталогу
  const [dealsData, setDealsData] = useState({ offers: [], bookings: [], events: [] }); // для диспетчера
  const [dispatchUsers, setDispatchUsers] = useState([]); // усі зареєстровані користувачі (для диспетчера)
  const [bookingListing, setBookingListing] = useState(null); // техніка, яку клієнт зараз бронює
  const [wantedItems, setWantedItems] = useState([]); // публічна «Дошка запитів»
  const [wantedLoaded, setWantedLoaded] = useState(false);
  const [respondingWanted, setRespondingWanted] = useState(null); // запит, на який власник пише відгук
  const [ownerResponses, setOwnerResponses] = useState([]); // відгуки цього власника

  // Читання заявок з бази для панелі диспетчера потребує входу диспетчера (RLS) —
  // це наступний крок. Поки що заявки видно в Supabase Table Editor і в Telegram.
  const [toast, setToast] = useState(null);
  const [user, setUser] = useState(null);
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [aiPrefill, setAiPrefill] = useState(null);
  const [showMyRequests, setShowMyRequests] = useState(false);
  const [heroSearch, setHeroSearch] = useState("");
  const { displayed: typedIntro, done: typedIntroDone } = useTypewriter(t("hero_typed"), 32, 500);
  const copyContactEmail = () => {
    navigator.clipboard?.writeText("demolis@ukr.net");
    flashToast("Email скопійовано: demolis@ukr.net");
  };
  const [reviews, setReviews] = useState([]);
  // Доступ диспетчера дає лише справжній акаунт з роллю dispatcher (перевіряється базою через RLS)
  const dispatcherUnlocked = user?.role === "dispatcher";
  const [filterMaxPrice, setFilterMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState("default");
  const [catFrom, setCatFrom] = useState(""); // дати, на які потрібна техніка (фільтр каталогу)
  const [catTo, setCatTo] = useState("");
  const [onlyFree, setOnlyFree] = useState(true);
  const [favorites, setFavorites] = useState(new Set());
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [recentlyViewed, setRecentlyViewed] = useState([]);

  const toggleFavorite = (id) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const trackViewed = (id) => {
    setRecentlyViewed((prev) => [id, ...prev.filter((x) => x !== id)].slice(0, 5));
  };

  const handleAddReview = (requestId, ownerName, rating, comment) => {
    setReviews((prev) => [...prev, { id: prev.length + 1, requestId, ownerName, rating, comment }]);
    flashToast("Дякуємо за відгук!");
  };
  const clientPending = clientData.offers.filter((o) => o.status === "proposed").length;
  const inboxPending = ownerInbox.filter((x) => x.dispatch_status === "sent" && x.req_status !== "taken").length;
  const ownerAttention =
    inboxPending +
    ownerBookings.filter((b) => b.status === "reserved").length +
    ownerResponses.filter((x) => x.status === "chosen" && x.request.status !== "taken").length;
  const [scrolled, setScrolled] = useState(false);
  const appSectionRef = useRef(null);
  useSpotlight(); // світло карток слідує за курсором
  useMagnetic(); // головна кнопка «тягнеться» до курсора
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Поява при прокрутці з каскадом 60 мс (потолок 0,5 с), див. src/motion
  useReveal([role, listings.length, requests.length, wantedItems.length]);
  useScenes([role, listings.length, requests.length, wantedItems.length]); // сцены «переливаются» друг в друга

  const scrollToApp = () => appSectionRef.current?.scrollIntoView({ behavior: "smooth" });

  const datesChosen = !!(catFrom && catTo && catTo >= catFrom);
  // Коли зайнята техніка на вибрані дати: повертає останню дату звільнення або null
  const busyOnChosen = (l) => {
    if (!datesChosen) return null;
    const hit = busyRanges.filter((r) => r.listing_id === l.id && deals.rangesOverlap(r.date_from, r.date_to, catFrom, catTo));
    return hit.length ? hit.map((r) => r.date_to).sort().slice(-1)[0] : null;
  };

  const filtered = useMemo(() => {
    const base = listings.filter(
      (l) =>
        (filterType === "Усі" || l.type === filterType) &&
        (filterRegion === "Усі" || l.region === filterRegion) &&
        (!filterMaxPrice || l.price <= Number(filterMaxPrice)) &&
        (!showFavoritesOnly || favorites.has(l.id))
    );
    let out = base;
    if (sortBy === "price_asc") out = [...base].sort((a, b) => a.price - b.price);
    else if (sortBy === "price_desc") out = [...base].sort((a, b) => b.price - a.price);
    if (catFrom && catTo && catTo >= catFrom) {
      const isBusy = (l) => !l.available || busyRanges.some((r) => r.listing_id === l.id && deals.rangesOverlap(r.date_from, r.date_to, catFrom, catTo));
      out = onlyFree ? out.filter((l) => !isBusy(l)) : [...out].sort((a, b) => Number(isBusy(a)) - Number(isBusy(b)));
    }
    return out;
  }, [listings, filterType, filterRegion, filterMaxPrice, showFavoritesOnly, favorites, sortBy, catFrom, catTo, onlyFree, busyRanges]);

  // Середній рейтинг власника — рахуємо з відгуків, прив'язаних до його імені
  const ownerRatings = useMemo(() => {
    const sums = {};
    reviews.forEach((r) => {
      if (!sums[r.ownerName]) sums[r.ownerName] = { total: 0, count: 0 };
      sums[r.ownerName].total += r.rating;
      sums[r.ownerName].count += 1;
    });
    const avg = {};
    Object.entries(sums).forEach(([name, { total, count }]) => (avg[name] = { avg: total / count, count }));
    return avg;
  }, [reviews]);

  const flashToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  };

  // Каталог з бази: бачать усі відвідувачі. Поки в базі порожньо — показуємо демо-приклади.
  useEffect(() => {
    if (!supabase) return;
    supabase
      .from("listings")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        setListingsReady(true);
        if (error) {
          console.error("Supabase load (listings) failed:", error.message);
          return;
        }
        if (data && data.length) {
          setListings(data.map(mapListingRow));
          setListingsFromDb(true);
        } else {
          setListings(seedListings); // база порожня — показуємо демо-приклади
        }
      });
  }, []);

  const refreshListings = async () => {
    if (!supabase) return;
    const { data, error } = await supabase.from("listings").select("*").order("created_at", { ascending: false });
    if (error || !data) return;
    setListings(data.length ? data.map(mapListingRow) : seedListings);
    setListingsFromDb(data.length > 0);
  };

  // Додавати техніку можуть лише власники (і диспетчер) — перевіряє також база (RLS)
  // Орендувати може лише зареєстрований користувач: гостя просимо увійти й після входу відкриваємо форму
  const [pendingRequest, setPendingRequest] = useState(null);
  const openRequestForm = (prefill = null) => {
    if (!user) {
      setPendingRequest({ prefill });
      setShowAuthForm(true);
      flashToast("Щоб залишити заявку, увійдіть або зареєструйтесь — це 1 хвилина");
      return;
    }
    setAiPrefill(prefill);
    setRole("client");
    setShowRequestForm(true);
  };
  useEffect(() => {
    if (user && pendingRequest) {
      const p = pendingRequest;
      setPendingRequest(null);
      setShowAuthForm(false);
      setAiPrefill(p.prefill);
      setRole("client");
      setShowRequestForm(true);
    }
  }, [user, pendingRequest]);

  const openAddListing = () => {
    if (!user) {
      setShowAuthForm(true);
      flashToast("Щоб додати техніку, увійдіть або зареєструйтесь як власник");
      return;
    }
    if (user.role !== "owner" && user.role !== "dispatcher") {
      flashToast("Додавати техніку можуть лише власники. Зареєструйтесь як «Власник техніки» або попросіть диспетчера відкрити кабінет власника");
      return;
    }
    setShowAddForm(true);
  };

  const handleAddListing = async (data) => {
    if (!supabase || !user?.id || !user.hasProfile) {
      flashToast("Не вдалося зберегти: увійдіть у акаунт");
      return false;
    }
    // 1. фото -> сховище (кожне вже стиснуте до ~1000 px)
    const urls = [];
    let photoFailed = false;
    for (let i = 0; i < (data.photos || []).length; i++) {
      try {
        const blob = await (await fetch(data.photos[i])).blob();
        const path = `${user.id}/${Date.now()}-${i}.jpg`;
        const { error: upErr } = await supabase.storage.from("listing-photos").upload(path, blob, { contentType: "image/jpeg" });
        if (upErr) throw upErr;
        urls.push(supabase.storage.from("listing-photos").getPublicUrl(path).data.publicUrl);
      } catch (e) {
        console.error("Photo upload failed:", e.message || e);
        photoFailed = true;
      }
    }
    // 2. рядок оголошення в базу
    const { data: row, error } = await supabase
      .from("listings")
      .insert({
        owner_id: user.id,
        type: data.type,
        brand: data.brand,
        region: data.region,
        price: data.price,
        unit: data.unit,
        specs: data.specs,
        owner_name: data.owner,
        busy_until: data.busyUntil || null,
        available: data.available !== false,
        photos: urls,
      })
      .select()
      .single();
    if (error) {
      console.error("Supabase insert (listings) failed:", error.message);
      flashToast("Не вдалося додати техніку: " + error.message);
      return false;
    }
    setListings((prev) => [mapListingRow(row), ...(listingsFromDb ? prev : [])]);
    setListingsFromDb(true);
    setShowAddForm(false);
    flashToast(photoFailed ? "Техніку додано, але частину фото завантажити не вдалося" : "Техніку додано в каталог");
    return true;
  };

  const toggleAvailability = async (l) => {
    const next = !l.available;
    const { data, error } = await supabase
      .from("listings")
      .update({ available: next, busy_until: null })
      .eq("id", l.id)
      .select();
    if (error || !data || data.length === 0) {
      flashToast(error ? "Не вдалося змінити: " + error.message : "Немає прав змінювати це оголошення");
      return;
    }
    setListings((prev) => prev.map((x) => (x.id === l.id ? { ...x, available: next, busyUntil: null } : x)));
    setDetailListing((d) => (d && d.id === l.id ? { ...d, available: next, busyUntil: null } : d));
    flashToast(next ? "Техніку позначено як вільну" : "Техніку позначено як зайняту");
  };

  const deleteListing = async (l) => {
    if (!window.confirm(`Видалити «${l.brand}» з каталогу?`)) return;
    const { data, error } = await supabase.from("listings").delete().eq("id", l.id).select();
    if (error || !data || data.length === 0) {
      flashToast(error ? "Не вдалося видалити: " + error.message : "Немає прав видаляти це оголошення");
      return;
    }
    try {
      const paths = (l.photos || []).map((u) => u.split("/listing-photos/")[1]).filter(Boolean);
      if (paths.length) await supabase.storage.from("listing-photos").remove(paths);
    } catch (e) {}
    setListings((prev) => prev.filter((x) => x.id !== l.id));
    setDetailListing(null);
    flashToast("Оголошення видалено");
  };

  const handleSubmitRequest = async (data) => {
    if (!supabase || !user?.id || !user.hasProfile) {
      setShowRequestForm(false);
      setPendingRequest({ prefill: aiPrefill });
      setShowAuthForm(true);
      flashToast("Щоб залишити заявку, увійдіть або зареєструйтесь");
      return false;
    }
    try {
      const { error } = await supabase.from("requests").insert({
        client_id: user.id,
        type: data.type,
        region: data.region,
        date_from: data.dateFrom || null,
        date_to: data.dateTo || null,
        with_operator: !!data.withOperator,
        budget: data.budget ? Number(data.budget) : null,
        budget_unit: data.budget ? data.budgetUnit || "період" : null,
        is_public: !!data.isPublic,
        comment: data.comment || null,
        contact: data.contact,
        requester_name: data.requesterName || user.name || null,
      });
      if (error) throw error;
    } catch (e) {
      console.error("Supabase insert (requests) failed:", e.message || e);
      flashToast("Не вдалося надіслати заявку: " + (e.message || "перевірте з'єднання"));
      return false;
    }
    deals.notifyDispatcher(data); // Telegram диспетчера (лише для тих, хто увійшов)
    setShowRequestForm(false);
    setAiPrefill(null);
    flashToast(data.isPublic ? "Заявку прийнято й вивішено на «Дошці запитів». Відгуки — у «Моєму кабінеті»" : "Заявку прийнято. Хід і відповіді — у «Моєму кабінеті»");
    setTimeout(() => {
      loadClientData();
      loadWanted();
    }, 600);
    return true;
  };

  const nowTime = () => new Date().toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" });

  // Надсилання заявки обраним власникам: рядки в request_dispatch + статус заявки «у роботі».
  // Власник побачить її в кабінеті («Запити для мене») і прийме або відмовиться.
  const handleDispatch = async (requestId, ownerIds, ownerNames) => {
    if (!supabase || user?.role !== "dispatcher") return;
    const rows = ownerIds.map((id) => ({ request_id: requestId, owner_id: id, dispatched_by: user.id, status: "sent" }));
    const { error } = await supabase.from("request_dispatch").upsert(rows, { onConflict: "request_id,owner_id", ignoreDuplicates: true });
    if (error) {
      flashToast("Не вдалося надіслати: " + error.message);
      return;
    }
    const cur = requests.find((r) => r.id === requestId);
    if (cur && cur.status !== "taken") {
      await supabase.from("requests").update({ status: "dispatched" }).eq("id", requestId);
    }
    const time = nowTime();
    setRequests((prev) =>
      prev.map((r) => {
        if (r.id !== requestId) return r;
        const ownerStatuses = { ...r.ownerStatuses };
        const log = [...r.log];
        ownerIds.forEach((id, i) => {
          ownerStatuses[id] = "sent";
          log.push({ ownerId: id, ownerName: ownerNames[i], action: "sent", time });
        });
        return { ...r, status: r.status === "taken" ? r.status : "dispatched", ownerStatuses, log };
      })
    );
    flashToast(`Надіслано власникам: ${ownerNames.join(", ")}`);
  };

  // Ручне рішення диспетчера (наприклад, власник відповів по телефону) і «Взяти собі».
  // Сам власник відповідає зі свого кабінету через функцію respond_to_request.
  const handleOwnerAction = async (requestId, ownerId, ownerName, action) => {
    if (!supabase || user?.role !== "dispatcher") return;
    const self = ownerId === "self";
    const nowIso = new Date().toISOString();
    try {
      if (action === "accepted") {
        if (self) {
          const { error } = await supabase
            .from("request_dispatch")
            .insert({ request_id: requestId, owner_id: null, dispatched_by: user.id, status: "accepted", responded_at: nowIso });
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("request_dispatch")
            .update({ status: "accepted", responded_at: nowIso })
            .eq("request_id", requestId)
            .eq("owner_id", ownerId);
          if (error) throw error;
        }
        let expire = supabase.from("request_dispatch").update({ status: "expired", responded_at: nowIso }).eq("request_id", requestId).eq("status", "sent");
        if (!self) expire = expire.neq("owner_id", ownerId);
        await expire;
        await supabase.from("requests").update({ status: "taken" }).eq("id", requestId);
      } else if (action === "rejected") {
        const { error } = await supabase
          .from("request_dispatch")
          .update({ status: "rejected", responded_at: nowIso })
          .eq("request_id", requestId)
          .eq("owner_id", ownerId);
        if (error) throw error;
      }
    } catch (e) {
      flashToast("Не вдалося зберегти: " + (e.message || e));
      return;
    }

    const time = nowTime();
    setRequests((prev) =>
      prev.map((r) => {
        if (r.id !== requestId) return r;
        const ownerStatuses = { ...r.ownerStatuses, [ownerId]: action };
        const log = [...r.log, { ownerId, ownerName, action, time }];
        let status = r.status;
        if (action === "accepted") {
          status = "taken";
          Object.keys(ownerStatuses).forEach((id) => {
            if (id !== String(ownerId) && ownerStatuses[id] === "sent") {
              ownerStatuses[id] = "expired";
              log.push({ ownerId: id, ownerName: (r.log.find((l) => String(l.ownerId) === id) || {}).ownerName || id, action: "auto-expired", time });
            }
          });
        } else if (action === "rejected" && !Object.values(ownerStatuses).some((x) => x === "sent")) {
          status = "new"; // усі відмовились — заявка знову в черзі диспетчера
          supabase.from("requests").update({ status: "new" }).eq("id", requestId);
        }
        return { ...r, status, ownerStatuses, log };
      })
    );
    flashToast(
      action === "accepted"
        ? `${ownerName} узяв заявку #${requestId}`
        : `${ownerName} відмовився від заявки #${requestId}`
    );
  };


  // ---- Справжній вхід через Supabase Auth ----
  const handleAuth = async ({ mode, email, password, name, org, phone, role }) => {
    if (!supabase) return { error: "З'єднання з базою недоступне" };
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name: name.trim(), org: (org || "").trim(), phone: phone.trim(), role } },
        });
        if (error) return { error: translateAuthError(error.message) };
        if (!data.session) {
          return { info: "Майже готово! Ми надіслали лист на вашу пошту — підтвердіть email за посиланням, потім увійдіть." };
        }
        flashToast(`Ласкаво просимо, ${name.trim()}!`);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return { error: translateAuthError(error.message) };
        flashToast("Ви увійшли");
      }
      setShowAuthForm(false);
      return null;
    } catch (e) {
      return { error: "Немає зв'язку з сервером. Спробуйте ще раз" };
    }
  };

  const handleUpdateProfile = async (data) => {
    if (supabase && user?.id && user.hasProfile) {
      const { error } = await supabase
        .from("profiles")
        .update({ name: data.name.trim(), org: (data.org || "").trim() || null, phone: data.phone.trim() })
        .eq("id", user.id);
      if (error) {
        flashToast("Не вдалося зберегти: " + error.message);
        return;
      }
    }
    setUser({ ...user, name: data.name.trim(), org: (data.org || "").trim(), phone: data.phone.trim() });
    setShowProfile(false);
    flashToast("Дані кабінету оновлено");
  };

  const handleLogout = async () => {
    try {
      await supabase?.auth.signOut();
    } catch (e) {}
    if (user?.role === "dispatcher") {
      setRequests([]); // не лишаємо чужі заявки в пам'яті
      setDealsData({ offers: [], bookings: [], events: [] });
      setDispatchUsers([]);
    }
    setUser(null);
    setShowProfile(false);
    setRole((r) => (r === "dispatcher" ? "client" : r));
    flashToast("Ви вийшли з кабінету");
  };

  // Відновлення сесії при відкритті сайту + реакція на вхід/вихід
  useEffect(() => {
    if (!supabase) return;
    let active = true;
    const loadProfile = async (session) => {
      if (!session) {
        if (active) setUser(null);
        return;
      }
      const { data: p } = await supabase.from("profiles").select("*").eq("id", session.user.id).maybeSingle();
      if (!active) return;
      if (p) {
        setUser({ id: p.id, name: p.name, org: p.org || "", phone: p.phone, email: p.email, role: p.role, hasProfile: true });
      } else {
        const m = session.user.user_metadata || {};
        setUser({
          id: session.user.id,
          name: m.name || session.user.email,
          org: m.org || "",
          phone: m.phone || "",
          email: session.user.email,
          role: m.role === "owner" ? "owner" : "client",
          hasProfile: false,
        });
      }
    };
    supabase.auth.getSession().then(({ data }) => loadProfile(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setTimeout(() => loadProfile(session), 0);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // Диспетчер бачить усі заявки, власників і історію розсилок (RLS пропускає лише роль dispatcher)
  const loadDispatcherData = async () => {
    if (!supabase || user?.role !== "dispatcher") return;
    const dealsRes = await deals.fetchDispatcherDeals();
    setDealsData(dealsRes);
    const [profRes, listRes, reqRes, dispRes] = await Promise.all([
      supabase.from("profiles").select("id,name,org,phone,email,role,created_at"),
      supabase.from("listings").select("owner_id,type,region,available"),
      supabase.from("requests").select("*").order("created_at", { ascending: false }),
      supabase.from("request_dispatch").select("*").order("sent_at", { ascending: true }),
    ]);
    const err = profRes.error || listRes.error || reqRes.error || dispRes.error;
    if (err) {
      console.error("Supabase load (dispatcher) failed:", err.message);
      return;
    }
    const uniq = (arr) => [...new Set(arr)];
    setDispatchUsers(profRes.data || []);
    const owners = (profRes.data || []).filter((p) => p.role === "owner").map((p) => {
      const mine = (listRes.data || []).filter((l) => l.owner_id === p.id);
      return { id: p.id, name: p.org || p.name, phone: p.phone, types: uniq(mine.map((l) => l.type)), regions: uniq(mine.map((l) => l.region)), verified: false };
    });
    setDispatchOwners(owners);
    const nameOf = (id) => (id ? (owners.find((o) => o.id === id) || {}).name || "Власник" : user.org || user.name || "Диспетчер");
    const fmt = (iso) => new Date(iso).toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" });
    setRequests(
      (reqRes.data || []).map((r) => {
        const rows = (dispRes.data || []).filter((d) => d.request_id === r.id);
        const ownerStatuses = {};
        const log = [];
        rows.forEach((d) => {
          const key = d.owner_id || "self";
          ownerStatuses[key] = d.status;
          log.push({ ownerId: key, ownerName: nameOf(d.owner_id), action: "sent", time: fmt(d.sent_at) });
          if (d.status !== "sent") log.push({ ownerId: key, ownerName: nameOf(d.owner_id), action: d.status === "expired" ? "auto-expired" : d.status, time: fmt(d.responded_at || d.sent_at) });
        });
        return {
          id: r.id,
          type: r.type,
          region: r.region,
          dateFrom: r.date_from,
          budget: r.budget,
          comment: r.comment,
          contact: r.contact,
          requesterName: r.requester_name,
          status: r.status,
          ownerStatuses,
          log,
          // угода: клієнт із акаунтом, період, пропозиції, броні й журнал дій
          hasAccount: !!r.client_id,
          clientId: r.client_id,
          createdAt: r.created_at,
          isPublic: !!r.is_public,
          budgetUnit: r.budget_unit,
          responses: (dealsRes.responses || []).filter((w) => w.request_id === r.id),
          dateTo: r.date_to,
          withOperator: !!r.with_operator,
          listingId: r.listing_id,
          offers: dealsRes.offers.filter((o) => o.request_id === r.id),
          bookings: dealsRes.bookings.filter((b) => b.request_id === r.id),
          events: dealsRes.events.filter((e) => e.request_id === r.id),
        };
      })
    );
  };

  useEffect(() => {
    if (!supabase || user?.role !== "dispatcher") return;
    loadDispatcherData();
    // автооновлення, поки відкрита панель диспетчера: бачимо відповіді власників
    const timer = setInterval(() => {
      if (role === "dispatcher" && !document.hidden) loadDispatcherData();
    }, 30000);
    return () => clearInterval(timer);
  }, [user?.id, user?.role, role]);

  // ---- Дії диспетчера по угоді: пропозиція, підтвердження, скасування ----
  const dealResult = async (res, okMsg) => {
    if (!res.ok) {
      flashToast(res.reason === "busy" && res.busy_until ? `Техніка зайнята до ${deals.fmtDate(res.busy_until)}` : deals.reasonText(res));
      return false;
    }
    flashToast(okMsg);
    await loadDispatcherData();
    refreshBusy();
    return true;
  };
  const handlePropose = async (reqId, listingId, from, to) =>
    dealResult(await deals.proposeOffer(reqId, listingId, from, to), "Пропозицію надіслано клієнту");
  const handleManualBooking = async (reqId, listingId, from, to) =>
    dealResult(await deals.createManualBooking(reqId, listingId, from, to), "Оренду підтверджено: клієнт і власник бачать контакти одне одного");
  const handleDeclineRequest = async (reqId, reason) =>
    dealResult(await deals.declineListingRequest(reqId, reason), "Відхилено. Клієнта сповіщено, заявка чекає на альтернативу");
  const handleDeleteUser = async (userId) => {
    const res = await deals.deleteUser(userId);
    if (!res.ok) {
      flashToast(deals.reasonText(res));
      return;
    }
    flashToast("Користувача видалено");
    await loadDispatcherData();
    refreshListings();
    refreshBusy();
  };
  const [dispatcherViewRequest, setDispatcherViewRequest] = useState(null);
  const handleSetRole = async (userId, role) => {
    const res = await deals.setUserRole(userId, role);
    if (!res.ok) flashToast(deals.reasonText(res));
    else {
      flashToast("Роль змінено, користувача сповіщено");
      await loadDispatcherData();
    }
  };
  const handleConfirmBooking = async (bookingId) => dealResult(await deals.confirmBooking(bookingId), "Оренду підтверджено, клієнта й власника сповіщено");
  const handleCancelBooking = async (bookingId, reason) => dealResult(await deals.cancelBooking(bookingId, reason), "Бронь скасовано");

  // ---- Кабінет клієнта: пропозиції, заявки, оренди ----
  const loadClientData = async () => {
    if (!supabase || !user || user.role === "dispatcher") return;
    setClientData(await deals.fetchClientCabinet());
  };
  useEffect(() => {
    if (!supabase || !user || user.role === "dispatcher") {
      setClientData({ requests: [], offers: [], bookings: [] });
      return;
    }
    loadClientData();
    const timer = setInterval(() => {
      if (!document.hidden) loadClientData();
    }, 60000);
    return () => clearInterval(timer);
  }, [user?.id, user?.role]);

  const handleCancelRequest = async (requestId) => {
    const res = await deals.cancelMyRequest(requestId);
    flashToast(res.ok ? "Заявку скасовано" : deals.reasonText(res));
    await loadClientData();
  };

  // Клієнт обирає техніку й дати -> заявка диспетчеру (він підтвердить одним кліком)
  const openBooking = (l) => {
    if (!l.ownerId) {
      respondToListing(l); // демо-оголошення без власника з бази
      return;
    }
    if (!user) {
      setShowAuthForm(true);
      flashToast("Щоб забронювати техніку, увійдіть або зареєструйтесь — це 1 хвилина");
      return;
    }
    if (user.role === "dispatcher") {
      flashToast("Диспетчер оформлює бронь у «Панелі диспетчера» (кнопка «Підтвердити оренду»)");
      return;
    }
    if (l.ownerId === user.id) {
      flashToast("Це ваша власна техніка");
      return;
    }
    setBookingListing(l);
  };
  const handleBook = async ({ dateFrom, dateTo, withOperator, comment }) => {
    const l = bookingListing;
    const res = await deals.requestListing(l.id, dateFrom, dateTo, comment, withOperator);
    if (!res.ok) {
      flashToast(res.reason === "busy" && res.busy_until ? `Ці дати зайняті до ${deals.fmtDate(res.busy_until)}` : deals.reasonText(res));
      if (res.reason === "busy") refreshBusy();
      return false;
    }
    deals.notifyDispatcher({ type: l.type, region: l.region, comment: `Бронь ${l.brand}, ${deals.fmtDate(dateFrom)} — ${deals.fmtDate(dateTo)}`, contact: user.phone, requesterName: user.name });
    setBookingListing(null);
    flashToast("Заявку надіслано. Відповідь і контакт власника з'являться в «Моєму кабінеті»");
    loadClientData();
    return true;
  };

  const handleRespondOffer = async (offerId, action, reason) => {
    const res = await deals.respondToOffer(offerId, action, reason);
    if (!res.ok) flashToast(deals.reasonText(res));
    else flashToast(action === "accepted" ? "Підтверджено! Диспетчер підтвердить оренду — ви отримаєте сповіщення" : "Пропозицію відхилено");
    await loadClientData();
    loadNotifications(false);
    refreshBusy();
  };

  // ---- Оренди техніки власника ----
  const loadOwnerBookings = async () => {
    if (!supabase || user?.role !== "owner") return;
    setOwnerBookings(await deals.fetchOwnerCabinet());
  };

  // ---- Дошка запитів: публічні заявки, відгуки власників, вибір клієнта ----
  const loadWanted = async () => {
    setWantedItems(await deals.fetchPublicWanted());
    setWantedLoaded(true);
  };
  useEffect(() => {
    loadWanted();
    const timer = setInterval(() => {
      if (!document.hidden) loadWanted();
    }, 120000);
    return () => clearInterval(timer);
  }, [user?.id]);

  const loadOwnerResponses = async () => {
    if (!supabase || user?.role !== "owner") return;
    setOwnerResponses(await deals.fetchOwnerResponses());
  };

  const openRespond = (item) => {
    if (!user) {
      setShowAuthForm(true);
      flashToast("Щоб відгукнутись, увійдіть як власник техніки");
      return;
    }
    if (user.role !== "owner") {
      flashToast("Відгукуватись можуть власники техніки. Зареєструйтесь як «Власник» або попросіть диспетчера відкрити кабінет власника");
      return;
    }
    setRespondingWanted(item);
  };
  const handleRespondWanted = async ({ listingId, price, unit, note }) => {
    const res = await deals.respondToWanted(respondingWanted.req_id, listingId, price, unit, note);
    if (!res.ok) {
      flashToast(res.reason === "busy" && res.busy_until ? `Ця техніка зайнята на дати заявки (до ${deals.fmtDate(res.busy_until)})` : deals.reasonText(res));
      loadWanted();
      return false;
    }
    setRespondingWanted(null);
    flashToast("Пропозицію надіслано. Клієнт і диспетчер отримали сповіщення");
    loadWanted();
    loadOwnerResponses();
    return true;
  };
  const handleWithdrawResponse = async (responseId) => {
    const res = await deals.withdrawResponse(responseId);
    flashToast(res.ok ? "Відгук забрано" : deals.reasonText(res));
    await loadOwnerResponses();
    loadWanted();
  };
  const handleChooseResponse = async (responseId) => {
    const res = await deals.chooseResponse(responseId);
    flashToast(res.ok ? "Пропозицію обрано. Диспетчер підтвердить оренду — ви отримаєте сповіщення" : deals.reasonText(res));
    await loadClientData();
    loadWanted();
  };
  const handleTogglePublic = async (requestId, isPublic) => {
    const res = await deals.setRequestPublic(requestId, isPublic);
    flashToast(res.ok ? (isPublic ? "Заявку вивішено на дошці запитів" : "Заявку знято з дошки") : deals.reasonText(res));
    await loadClientData();
    loadWanted();
  };

  // ---- Сповіщення (дзвіночок) ----
  const notifMaxRef = useRef(0);
  const notifLoadedRef = useRef(false);
  const loadNotifications = async (notify) => {
    if (!supabase || !user) return;
    const items = await deals.fetchNotifications(40);
    const maxId = items.reduce((m, n) => Math.max(m, n.id), 0);
    if (notify && notifLoadedRef.current) {
      const fresh = items.filter((n) => n.id > notifMaxRef.current && !n.read_at);
      if (fresh.length) flashToast(fresh.length === 1 ? fresh[0].title : `Нових сповіщень: ${fresh.length}`);
    }
    notifMaxRef.current = Math.max(notifMaxRef.current, maxId);
    notifLoadedRef.current = true;
    setNotifications(items);
  };
  useEffect(() => {
    notifMaxRef.current = 0;
    notifLoadedRef.current = false;
    if (!supabase || !user) {
      setNotifications([]);
      return;
    }
    loadNotifications(true);
    const timer = setInterval(() => {
      if (!document.hidden) loadNotifications(true);
    }, 30000);
    return () => clearInterval(timer);
  }, [user?.id]);
  const unreadCount = notifications.filter((n) => !n.read_at).length;
  const prevUnread = useRef(unreadCount);
  const [bellRing, setBellRing] = useState(0);
  useEffect(() => {
    if (unreadCount > prevUnread.current) {
      setBellRing((k) => k + 1);
      const t = setTimeout(() => setBellRing(0), 1000);
      prevUnread.current = unreadCount;
      return () => clearTimeout(t);
    }
    prevUnread.current = unreadCount;
    return undefined;
  }, [unreadCount]);

  const openNotification = async (n) => {
    if (!n.read_at) {
      await deals.markNotificationsRead([n.id]);
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x)));
    }
    setShowNotifications(false);
    if (n.kind === "role_changed") {
      flashToast("Оновлюємо сторінку…");
      setTimeout(() => window.location.reload(), 600);
      return;
    }
    if (user?.role === "dispatcher") {
      setRole("dispatcher");
      if (n.kind === "new_user") setDispatcherViewRequest({ view: "users", n: Date.now() });
      loadDispatcherData();
      return;
    }
    if (user?.role === "owner" && ["response_chosen", "response_closed"].includes(n.kind)) {
      setOwnerTab("responses");
      loadOwnerResponses();
      setShowInbox(true);
      return;
    }
    if (user?.role === "owner" && ["booking_reserved", "booking_confirmed", "booking_cancelled"].includes(n.kind)) {
      setOwnerTab("rentals");
      loadOwnerBookings();
      setShowInbox(true);
      return;
    }
    setClientTab(n.kind === "offer_proposed" ? "offers" : String(n.kind).startsWith("booking_") ? "rentals" : "requests");
    loadClientData();
    setShowMyRequests(true);
  };
  const markAllNotifications = async () => {
    await deals.markNotificationsRead(null);
    setNotifications((prev) => prev.map((x) => ({ ...x, read_at: x.read_at || new Date().toISOString() })));
  };

  // ---- Зайнятість техніки в каталозі ----
  const refreshBusy = async () => setBusyRanges(await deals.fetchListingBusy());
  useEffect(() => {
    refreshBusy();
    const timer = setInterval(refreshBusy, 120000);
    return () => clearInterval(timer);
  }, []);
  const busyNextRange = (listingId) => {
    const today = new Date().toLocaleDateString("sv-SE");
    const future = busyRanges.filter((r) => r.listing_id === listingId && r.date_from > today).sort((a, b) => (a.date_from < b.date_from ? -1 : 1));
    return future[0] || null;
  };
  const busyNowUntil = (listingId) => {
    const today = new Date().toLocaleDateString("sv-SE");
    const hit = busyRanges.filter((r) => r.listing_id === listingId && r.date_from <= today && r.date_to >= today);
    return hit.length ? hit.map((r) => r.date_to).sort().slice(-1)[0] : null;
  };

  // «Відгукнутись» на оголошення = заявка на цю техніку: іде диспетчеру, не власнику напряму
  const respondToListing = async (l) => {
    if (!user?.id || !user.hasProfile) {
      setShowAuthForm(true);
      flashToast("Щоб орендувати техніку, увійдіть або зареєструйтесь — це 1 хвилина");
      return false;
    }
    trackViewed(l.id);
    const comment = `Клієнт відгукнувся на оголошення: ${l.brand} (${l.owner})`;
    const { error } = await supabase.from("requests").insert({
      client_id: user.id,
      type: l.type,
      region: l.region,
      contact: user.phone,
      requester_name: user.name || null,
      comment,
      listing_id: l.ownerId ? l.id : null,
    });
    if (error) {
      flashToast("Не вдалося надіслати: " + error.message);
      return false;
    }
    deals.notifyDispatcher({ type: l.type, region: l.region, comment, contact: user.phone, requesterName: user.name });
    flashToast("Запит надіслано диспетчеру. Відповідь побачите в «Моєму кабінеті»");
    setTimeout(() => loadClientData(), 600);
    return true;
  };

  // ---- Кабінет власника: запити, надіслані диспетчером («Запити для мене») ----
  const inboxCountRef = useRef(0);
  const inboxLoadedRef = useRef(false);
  const loadInbox = async (notify) => {
    if (!supabase || user?.role !== "owner") return;
    const { data, error } = await supabase.rpc("owner_inbox");
    if (error) {
      console.error("Supabase rpc (owner_inbox) failed:", error.message);
      return;
    }
    const rows = data || [];
    const pending = rows.filter((x) => x.dispatch_status === "sent" && x.req_status !== "taken").length;
    if (notify) {
      if (!inboxLoadedRef.current && pending > 0) flashToast(`У вас нових запитів: ${pending}`);
      else if (inboxLoadedRef.current && pending > inboxCountRef.current) flashToast(pending - inboxCountRef.current === 1 ? "Новий запит на вашу техніку" : `Нових запитів: ${pending - inboxCountRef.current}`);
    }
    inboxCountRef.current = pending;
    inboxLoadedRef.current = true;
    setOwnerInbox(rows);
  };

  useEffect(() => {
    inboxCountRef.current = 0;
    inboxLoadedRef.current = false;
    if (!supabase || user?.role !== "owner") {
      setOwnerInbox([]);
      setOwnerBookings([]);
      setOwnerResponses([]);
      return;
    }
    loadInbox(true);
    loadOwnerBookings();
    loadOwnerResponses();
    const timer = setInterval(() => {
      if (!document.hidden) {
        loadInbox(true);
        loadOwnerBookings();
        loadOwnerResponses();
      }
    }, 60000);
    return () => clearInterval(timer);
  }, [user?.id, user?.role]);

  const respondToRequest = async (dispatchId, action) => {
    const { data, error } = await supabase.rpc("respond_to_request", { p_dispatch_id: dispatchId, p_action: action });
    if (error) {
      flashToast("Не вдалося: " + error.message);
      return;
    }
    if (data && data.ok === false) {
      flashToast(
        data.reason === "taken"
          ? "Цю заявку вже взяв інший власник"
          : data.reason === "already_answered"
          ? "Ви вже відповіли на цю заявку"
          : "Заявку не знайдено"
      );
    } else {
      flashToast(action === "accepted" ? "Заявку прийнято — контакт клієнта нижче" : "Ви відмовились від заявки");
    }
    await loadInbox(false);
  };

  // Страховка: якщо сесія закінчилась — виходимо з панелі диспетчера
  useEffect(() => {
    if (role === "dispatcher" && user?.role !== "dispatcher") setRole("client");
  }, [role, user]);


  return (
    <div
      style={{
        position: "relative",
        isolation: "isolate",
        minHeight: "100vh",
        background: "#08090A",
        color: "#ffffff",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif",
      }}
    >
      <FontLink />
      <ScrollProgress />
      <SceneAura />
      <style>{`
        @keyframes shimmerFlow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .shimmer-logo {
          background: linear-gradient(90deg, #FF6A1A, #ffb347, #FF6A1A, #e8437a, #FF6A1A);
          background-size: 300% 100%;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          animation: shimmerFlow 5s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .shimmer-logo { animation: none; }
        }
        @keyframes letterFlip {
          0%, 38% { transform: rotateX(0deg); }
          50%, 88% { transform: rotateX(180deg); }
          100% { transform: rotateX(360deg); }
        }
        .morph-letter {
          position: relative;
          display: inline-block;
          width: 1.15ch;
          height: 1.3em;
          transform-style: preserve-3d;
          animation: letterFlip 5s ease-in-out infinite;
        }
        .morph-face {
          position: absolute;
          inset: 0;
          backface-visibility: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .morph-back {
          transform: rotateX(180deg);
          font-size: 1.9em;
          line-height: 1;
          filter: drop-shadow(0 0 2px rgba(0,0,0,.5));
        }
        @media (prefers-reduced-motion: reduce) {
          .morph-letter { animation: none; }
          .morph-back { display: none; }
        }

        @keyframes bounceLetter {
          0%, 88% { transform: translateY(0); }
          92% { transform: translateY(-6px); }
          96% { transform: translateY(0); }
          98% { transform: translateY(-2px); }
          100% { transform: translateY(0); }
        }
        .bounce-letter {
          display: inline-block;
          animation: bounceLetter 8s ease-in-out infinite;
        }

        @keyframes logoFlip {
          0%, 55% { transform: rotateX(0deg); }
          64%, 90% { transform: rotateX(180deg); }
          100% { transform: rotateX(360deg); }
        }

        .brand-3d { display: inline-block; width: clamp(200px, 17vw, 300px); line-height: 0; align-self: center; margin: -6px 0 -10px; }
        .brand-3d img, .brand-3d video { width: 100%; pointer-events: none; height: auto; display: block; user-select: none; }
        .logo-flip {
          position: relative;
          display: inline-grid;
          transform-style: preserve-3d;
          animation: logoFlip 8s ease-in-out infinite;
          vertical-align: middle;
        }
        .logo-face {
          grid-row: 1;
          grid-column: 1;
          backface-visibility: hidden;
          white-space: nowrap;
          display: flex;
          align-items: center;
        }
        .logo-back {
          transform: rotateX(180deg);
          position: relative;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }
        .road-track {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 5px;
          height: 4px;
          background: rgba(237, 232, 222, 0.12);
          border-radius: 2px;
          overflow: hidden;
        }
        @keyframes roadGrow {
          0%, 63% { transform: scaleX(0); }
          64% { transform: scaleX(0); }
          88%, 100% { transform: scaleX(1); }
        }
        .road-fill {
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, #70777D, #A3A8AD);
          transform-origin: left center;
          transform: scaleX(0);
          animation: roadGrow 8s ease-in-out infinite;
        }
        @keyframes tractorDrive {
          0%, 63% { left: 0%; }
          64% { left: 0%; }
          88%, 100% { left: calc(100% - 1.2em); }
        }
        .tractor-icon {
          position: absolute;
          left: 0;
          bottom: 8px;
          font-size: 1.2em;
          line-height: 1;
          animation: tractorDrive 8s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .logo-flip { animation: none; }
          .logo-back { display: none; }
          .road-fill, .tractor-icon { animation: none; }
          .bounce-letter { animation: none; }
        }
        @media (max-width: 768px) {
          .dispatcher-layout { flex-direction: column; }
          .dispatcher-sidebar { flex-direction: row !important; overflow-x: auto; min-width: 0 !important; gap: 6px !important; padding-bottom: 4px; }
          .dispatcher-sidebar button { flex-shrink: 0; border-left: none !important; border-bottom: 2px solid transparent; }
        }
        @media (max-width: 640px) {
          .auth-split-left { display: none !important; }
        }
        button:focus-visible, a:focus-visible, input:focus-visible, select:focus-visible, textarea:focus-visible, [tabindex]:focus-visible {
          outline: 2px solid #FFB52E;
          outline-offset: 2px;
        }

        .blur-fade-in {
          filter: blur(4px);
          opacity: 0;
          animation: blurFadeIn 0.9s ease forwards;
        }
        @keyframes blurFadeIn {
          to { filter: blur(0); opacity: 1; }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .typewriter-cursor {
          display: inline-block;
          width: 2px;
          height: 1.1em;
          background: #ffffff;
          vertical-align: middle;
          margin-left: 2px;
          animation: blink 1s step-end infinite;
        }
        .hero-pill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          background: #ffffff;
          color: #08090A;
          border: 1px solid rgba(0,0,0,0.1);
          border-radius: 980px;
          font-size: 13px;
          padding: 8px 16px;
          cursor: pointer;
          white-space: nowrap;
          transition: background-color 0.2s ease, color 0.2s ease;
          font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif;
        }
        .hero-pill:hover {
          background: #08090A;
          color: #ffffff;
        }
        .hero-pill-outline {
          background: transparent;
          color: #ffffff;
          border: 1px solid #ffffff;
        }
        .hero-pill-outline:hover {
          background: #ffffff;
          color: #08090A;
        }

        :root {
          --motion-fast: cubic-bezier(0.2, 0.8, 0.2, 1);
          --motion-normal: cubic-bezier(0.16, 1, 0.3, 1);
          --motion-mechanical: cubic-bezier(0.22, 1, 0.36, 1);
        }
        .btn-premium-hover {
          position: relative;
          overflow: hidden;
        }
        .btn-premium-hover::after {
          content: '';
          position: absolute;
          left: -40%;
          top: 0;
          bottom: 0;
          width: 30%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent);
          transform: skewX(-20deg);
          transition: left 0.5s var(--motion-mechanical);
          pointer-events: none;
        }
        .btn-premium-hover:hover::after {
          left: 130%;
        }
        .icon-tilt {
          display: inline-flex;
          transition: transform 0.3s var(--motion-mechanical);
          transform-origin: center;
        }
        .icon-tilt:hover {
          transform: scale(1.05) rotate(-2deg) translateY(-1px);
        }
        @media (prefers-reduced-motion: reduce) {
          .icon-tilt:hover { transform: none; }
        }
        .section-divider {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 20px;
        }
        .section-divider .num {
          font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif;
          font-size: 11px;
          color: #70777D;
          flex-shrink: 0;
        }
        .section-divider .line {
          flex: 1;
          height: 1px;
          background: #202428;
        }
        .section-divider .title {
          font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif;
          font-size: 11px;
          letter-spacing: 0.04em;
          color: #A3A8AD;
          flex-shrink: 0;
        }

        }

        .guide-card-motion {
          animation: guideCardIn 0.35s var(--motion-normal);
        }
        @keyframes guideCardIn {
          from { opacity: 0; transform: scale(0.97) translateY(6px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .guide-card-motion { animation: none; }
        }

        @keyframes badgePulse {
          0%, 100% { color: #FFB52E; border-color: #FFB52E; box-shadow: 0 0 20px rgba(255,176,32,0.25); }
          33% { color: #FF6A1A; border-color: #FF6A1A; box-shadow: 0 0 20px rgba(255,106,26,0.3); }
          66% { color: #FFE08A; border-color: #FFE08A; box-shadow: 0 0 20px rgba(255,224,138,0.3); }
        }
        .badge-pulse {
          border: 1px solid #FFB52E;
          animation: badgePulse 3s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .badge-pulse { animation: none; color: #FFB52E; border-color: #FFB52E; }
        }

        @keyframes statusBreathe {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.45; }
        }
        .status-dot-available {
          animation: statusBreathe 2.4s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .status-dot-available { animation: none; }
          .btn-premium-hover::after { display: none; }
        }

        @keyframes heroFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .reveal {
          opacity: 0;
          transform: translateY(28px);
          transition: opacity 0.7s cubic-bezier(0.16,1,0.3,1), transform 0.7s cubic-bezier(0.16,1,0.3,1);
        }
        .reveal.is-visible {
          opacity: 1;
          transform: translateY(0);
        }
        .reveal-1 { transition-delay: 0.08s; }
        .reveal-2 { transition-delay: 0.16s; }
        .reveal-3 { transition-delay: 0.24s; }
        @media (prefers-reduced-motion: reduce) {
          .reveal { opacity: 1; transform: none; transition: none; }
        }

        /* Clip-path "wipe" entrance for the headline — opens downward like a blind,
           instead of a plain fade, for a more premium first impression */
        .reveal-wipe {
          opacity: 0;
          clip-path: inset(-0.2em 0 100% 0);
          transform: translateY(10px);
          transition: opacity 0.9s cubic-bezier(0.16,1,0.3,1), clip-path 0.9s cubic-bezier(0.16,1,0.3,1), transform 0.9s cubic-bezier(0.16,1,0.3,1);
        }
        .reveal-wipe.is-visible {
          opacity: 1;
          clip-path: inset(-0.2em 0 -0.2em 0);
          transform: translateY(0);
        }
        @media (prefers-reduced-motion: reduce) {
          .reveal-wipe { opacity: 1; clip-path: none; transform: none; transition: none; }
        }

        /* Frosted glass CTA — layered gradients + blur + gradient-masked border,
           in the site's own orange/yellow palette */
        .glass-cta {
          position: relative;
          border-radius: 999px;
          border: none;
          cursor: pointer;
          color: #08090A;
          font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.03em;
          text-transform: uppercase;
          padding: 13px 24px;
          background:
            linear-gradient(180deg, rgba(23,21,19,0) 45%, rgba(23,21,19,0.18) 100%),
            linear-gradient(90deg, rgba(255,224,138,0.9) 0%, rgba(255,176,32,0.95) 45%, rgba(255,90,31,0.95) 100%);
          box-shadow: 0 6px 22px rgba(255,144,32,0.3), inset 0 1px 0 rgba(255,255,255,0.45);
        }
        .glass-cta::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          padding: 1.4px;
          pointer-events: none;
          background: linear-gradient(90deg, rgba(255,255,255,0.9), rgba(255,255,255,0.15));
          -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
          -webkit-mask-composite: xor;
          mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
          mask-composite: exclude;
        }

        .sticky-header {
          position: sticky;
          top: 0;
          z-index: 40;
          background: rgba(255, 255, 255, 0.02);
          background-blend-mode: luminosity;
          backdrop-filter: blur(14px) saturate(1.1);
          -webkit-backdrop-filter: blur(14px) saturate(1.1);
          transition: padding 0.25s ease;
          overflow: hidden;
        }
        .sticky-header::before {
          content: '';
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: linear-gradient(180deg,
            rgba(255,255,255,0.16) 0%,
            rgba(255,255,255,0.05) 30%,
            rgba(255,255,255,0) 55%,
            rgba(255,90,31,0.06) 100%);
        }
        .sticky-header::after {
          content: '';
          position: absolute;
          left: 0; right: 0; bottom: 0;
          height: 1px;
          background: linear-gradient(90deg, rgba(255,90,31,0) 0%, rgba(255,176,32,0.55) 50%, rgba(255,90,31,0) 100%);
          pointer-events: none;
        }
        .sticky-header > * {
          position: relative;
          z-index: 1;
        }

        .faq-item { border-bottom: 1px solid #63696D; }
        .faq-question {
          width: 100%;
          text-align: left;
          background: none;
          border: none;
          color: #ffffff;
          padding: 16px 4px;
          font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif;
          font-size: 14.5px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
        }
        .faq-answer {
          overflow: hidden;
          max-height: 0;
          transition: max-height 0.35s ease;
        }
        .faq-answer.open { max-height: 240px; }
        .faq-answer p {
          margin: 0 4px 16px;
          font-size: 13px;
          color: #A3A8AD;
          line-height: 1.6;
        }

        .sticky-cta {
          display: none;
          position: fixed;
          left: 0; right: 0; bottom: 0;
          z-index: 60;
          background: #15181A;
          border-top: 1px solid #63696D;
          padding: 12px 16px;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          box-shadow: 0 -6px 20px rgba(0,0,0,.35);
        }
        @media (max-width: 680px) {
          .sticky-cta { display: flex; }
          .ai-fab { bottom: 108px; }
          .ai-panel { bottom: 168px; max-height: calc(100vh - 200px); max-height: calc(100dvh - 200px); }
          body { padding-bottom: 0; }
        }
        .skeleton {
          background: linear-gradient(90deg, #15181A 25%, #1d2125 50%, #15181A 75%);
          background-size: 200% 100%;
          border-radius: 16px;
          border: 1px solid rgba(255,255,255,0.06);
          animation: skeletonPulse 1.4s ease-in-out infinite;
        }
        @keyframes skeletonPulse { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        @media (prefers-reduced-motion: reduce) { .skeleton { animation: none; } }
        .equipment-card {
          transition: transform 0.25s cubic-bezier(0.16,1,0.3,1), box-shadow 0.25s ease, border-color 0.25s ease;
        }
        .equipment-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 14px 30px rgba(0,0,0,.45);
          border-color: #FF6A1A;
        }
        .role-pill {
          transition: color 0.2s ease, background 0.2s ease;
        }
        .role-tabs {
          position: relative;
        }
        @media (prefers-reduced-motion: reduce) {
          .equipment-card:hover { transform: none; }
        }
        .carousel-track {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .carousel-track::-webkit-scrollbar { display: none; }

        .category-card {
          position: relative;
          background: linear-gradient(180deg, #15181A 0%, #15181A 100%);
          border: 1px solid #63696D;
          border-radius: 16px;
          padding: 26px 16px;
          text-align: center;
          cursor: pointer;
          overflow: hidden;
          height: 130px;
          scroll-snap-align: start;
          transition: border-color 0.25s ease, transform 0.25s ease;
        }
        .category-card:hover {
          border-color: #FF6A1A;
          transform: translateY(-4px);
        }
        .category-card-front {
          transition: opacity 0.2s ease;
        }
        .category-card:hover .category-card-front {
          opacity: 0;
        }
        .category-card-hover {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: radial-gradient(circle at 50% 0%, rgba(255,176,32,0.15), rgba(23,21,19,0.97) 60%);
          transform: translateY(100%);
          transition: transform 0.3s cubic-bezier(0.16,1,0.3,1);
          padding: 16px;
        }
        .category-card:hover .category-card-hover {
          transform: translateY(0);
        }
        .ai-fab {
          position: fixed;
          right: 20px;
          bottom: 90px;
          z-index: 70;
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: #FF6A1A;
          color: #08090A;
          border: none;
          font-size: 20px;
          cursor: pointer;
          box-shadow: 0 8px 24px rgba(0,0,0,.4);
        }
        .ai-panel {
          position: fixed;
          right: 20px;
          bottom: 150px;
          z-index: 70;
          width: 390px;
          max-width: calc(100vw - 40px);
          height: 600px;
          max-height: 78vh;
          background: #15181A;
          border: 1px solid #63696D;
          display: flex;
          flex-direction: column;
          box-shadow: 0 12px 40px rgba(0,0,0,.5);
        }
        .ai-panel-header {
          padding: 12px 14px;
          border-bottom: 1px solid #63696D;
          font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #A3A8AD;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .ai-voice-toggle {
          background: none;
          border: 1px solid #63696D;
          color: #A3A8AD;
          font-size: 13px;
          width: 26px;
          height: 26px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .ai-voice-toggle.on {
          border-color: #FF6A1A;
          color: #FF6A1A;
        }
        .ai-mic-btn {
          background: none;
          border: none;
          color: #A3A8AD;
          width: 40px;
          font-size: 16px;
          cursor: pointer;
        }
        .ai-mic-btn.active {
          color: #FF6A1A;
          animation: micPulse 1.2s ease-in-out infinite;
        }
        @keyframes micPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        .ai-panel-body {
          flex: 1;
          overflow-y: auto;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .ai-bubble {
          font-size: 13px;
          padding: 8px 10px;
          max-width: 85%;
          line-height: 1.45;
        }
        .ai-bubble.user {
          align-self: flex-end;
          background: #FF6A1A;
          color: #08090A;
        }
        .ai-bubble.assistant {
          max-width: 96%;
          align-self: flex-start;
          background: #191C1F;
          color: #ffffff;
          border: 1px solid #63696D;
        }
        .ai-blocks {
          margin-top: 8px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .ai-block {
          border-top: 1px solid #2a2e32;
          padding: 2px 0;
        }
        .ai-block summary {
          cursor: pointer;
          font-size: 12.5px;
          font-weight: 600;
          color: #FFB52E;
          padding: 6px 0;
          list-style: none;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .ai-block summary::-webkit-details-marker { display: none; }
        .ai-block summary::after { content: "+"; color: #70777D; font-size: 15px; }
        .ai-block[open] summary::after { content: "–"; }
        .ai-block ul, .ai-block ol {
          margin: 2px 0 8px;
          padding-left: 18px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .ai-block li { font-size: 12.5px; line-height: 1.5; color: #D9DCDF; }
        .ai-block li b { color: #ffffff; font-weight: 600; }
        .ai-suggestion-btn {
          display: block;
          margin-top: 8px;
          background: none;
          border: 1px solid #FF6A1A;
          color: #FF6A1A;
          font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif;
          font-size: 11px;
          padding: 6px 10px;
          cursor: pointer;
          width: 100%;
        }
        .ai-panel-input {
          display: flex;
          border-top: 1px solid #63696D;
        }
        .ai-panel-input input {
          flex: 1;
          background: none;
          border: none;
          color: #ffffff;
          padding: 10px 12px;
          font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif;
          font-size: 13px;
          outline: none;
        }
        .ai-panel-input button {
          background: #FF6A1A;
          color: #08090A;
          border: none;
          width: 44px;
          cursor: pointer;
          font-size: 16px;
        }
      `}</style>

      {/* Header */}
      <header
        className={`sticky-header has-forge${scrolled ? " is-scrolled" : ""}`}
        style={{
          "--hp": scrolled ? "12px" : "20px",
          borderBottom: "1px solid #63696D",
          padding: scrolled ? "12px 24px" : "20px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <span role="img" aria-label="ТЕХМАЙДАНЧИК" className="brand-3d">
            {LOGO_ALPHA_VIDEO ? (
              <video autoPlay loop muted playsInline preload="auto" poster="/logo/logo.png" aria-hidden="true">
                <source src="/logo/logo.webm" type="video/webm" />
              </video>
            ) : (
              <img src="/logo/logo.png" alt="" draggable="false" />
            )}
          </span>
          <Label><MorphingTagline text="біржа будтехніки" /></Label>
        </div>
        <HeaderForge />

        <button
          onClick={() => {
            const el = document.getElementById("how-it-works");
            if (el) el.scrollIntoView({ behavior: "smooth" });
          }}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#A3A8AD",
            fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif",
            fontSize: 13,
            transition: "color 0.2s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#F4F4F1")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#A3A8AD")}
        >
          {t("how_it_works_title")}
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "10px 12px", flexWrap: "wrap", maxWidth: "100%" }}>
          <div
            style={{
              position: "relative",
              display: "flex",
              maxWidth: "100%",
              background: "linear-gradient(160deg, #3a3a3c 0%, #17181a 55%, #0c0d0e 100%)",
              padding: 6,
              borderRadius: 980,
              width: 272,
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -2px 3px rgba(0,0,0,0.6), 0 6px 14px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,0,0,0.4)",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 6,
                bottom: 6,
                left: 6,
                width: "calc(50% - 6px)",
                borderRadius: 980,
                background: "linear-gradient(180deg, #FFC862 0%, #FF6A1A 55%, #C9500E 100%)",
                transform: role === "owner" ? "translateX(calc(100% + 0px))" : "translateX(0%)",
                transition: "transform 0.45s cubic-bezier(0.65, 0, 0.35, 1)",
                boxShadow:
                  "inset 0 1.5px 0 rgba(255,255,255,0.6), inset 0 -3px 4px rgba(0,0,0,0.35), 0 2px 8px rgba(255,90,31,0.5)",
              }}
            />
            {[
              { key: "client", label: t("nav_client") },
              { key: "owner", label: t("nav_owner") },
            ].map((r) => (
              <button
                key={r.key}
                onClick={() => {
                  setRole(r.key);
                  if (r.key === "owner") openAddListing();
                  else setAiOpen(true);
                }}
                style={{
                  position: "relative",
                  zIndex: 1,
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif",
                  fontSize: 12,
                  letterSpacing: "0.06em",
                  textTransform: "none",
                  padding: "9px 14px",
                  border: "none",
                  cursor: "pointer",
                  background: "transparent",
                  color: role === r.key ? "#1a0f05" : "#8e8e93",
                  textShadow: role === r.key ? "0 1px 0 rgba(255,255,255,0.25)" : "none",
                  transition: "color 0.3s ease",
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: role === r.key ? "radial-gradient(circle at 35% 30%, #FFE08A, #FF6A1A 75%)" : "radial-gradient(circle at 35% 30%, #8e8e93, transparent)",
                    boxShadow: role === r.key ? "0 0 5px 2px rgba(255,197,90,0.8)" : "-1px -1px 2px rgba(255,255,255,0.12), 0 1px 2px rgba(0,0,0,0.5)",
                    flexShrink: 0,
                  }}
                />
                {r.label}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", gap: 4 }}>
            {["uk", "ru", "en"].map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif",
                  fontSize: 10.5,
                  padding: "6px 9px",
                  borderRadius: 8,
                  border: "none",
                  background: "#1c1c1e",
                  boxShadow:
                    lang === l
                      ? "inset 3px 3px 6px rgba(0,0,0,0.55), inset -2px -2px 4px rgba(255,255,255,0.03)"
                      : "3px 3px 6px rgba(0,0,0,0.4), -2px -2px 5px rgba(255,255,255,0.025)",
                  color: "#A3A8AD",
                  cursor: "pointer",
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    flexShrink: 0,
                    background:
                      lang === l
                        ? "radial-gradient(circle at 35% 30%, #FFC862, #FF6A1A 70%)"
                        : "radial-gradient(circle at 35% 30%, #8e8e93, transparent)",
                    boxShadow: lang === l ? "0 0 5px 1.5px rgba(255,106,26,0.65)" : "-1px -1px 2px rgba(255,255,255,0.15), 0 1px 2px rgba(0,0,0,0.5)",
                  }}
                />
                {l.toUpperCase()}
              </button>
            ))}
          </div>

          {user && (
            <button
              onClick={() => {
                setShowNotifications(true);
                loadNotifications(false);
              }}
              aria-label={`Сповіщення${unreadCount ? ` (${unreadCount})` : ""}`}
              className={bellRing ? "mo-ring" : undefined}
              style={{ position: "relative", background: "#191C1F", border: "1px solid #63696D", width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#ffffff" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
              </svg>
              {unreadCount > 0 && (
                <span key={unreadCount} className="mo-badge-pop" style={{ position: "absolute", top: -7, right: -7, background: "#FF6A1A", color: "#08090A", borderRadius: 980, fontSize: 10.5, fontWeight: 700, minWidth: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px" }}>
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>
          )}

          {user ? (
            <button
              onClick={() => setShowProfile(true)}
              aria-label={`${t("profile_title")}: ${user.name}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "#191C1F",
                border: "1px solid #63696D",
                padding: "8px 14px",
                cursor: "pointer",
                color: "#ffffff",
                fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif",
                fontSize: 12,
              }}
            >
              <span style={{ width: 20, height: 20, borderRadius: "50%", background: "#FF6A1A", color: "#08090A", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 11 }}>
                {user.name.trim().charAt(0).toUpperCase()}
              </span>
              <span style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", lineHeight: 1.15 }}>
                <span style={{ fontSize: 9.5, letterSpacing: "0.08em", textTransform: "uppercase", color: "#A3A8AD" }}>{t("profile_title")}</span>
                <span style={{ fontSize: 13 }}>{user.name.split(" ")[0]}</span>
              </span>
            </button>
          ) : (
            <button onClick={() => setShowAuthForm(true)} style={{ ...smallBtn, borderColor: "#FF6A1A", color: "#FF6A1A" }}>
              {t("nav_login")}
            </button>
          )}
        </div>
      </header>

      {/* Перший екран: «Техніка зблизька». Прокрутка веде камеру по екскаватору; перший етап — заголовок, пошук і кнопки */}
      <ScrollStory
        onCta={(cta) => {
          setRole("client");
          if (cta && cta.type) setFilterType(cta.type);
          scrollToApp();
        }}
        intro={
          <>
        <div className="ss-l" style={{ maxWidth: 640, margin: "0 auto", position: "relative" }}>
          <div
            className="mo-in badge-pulse"
            style={{
              "--i": 0,
              display: "inline-block",
              fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif",
              fontSize: 11,
              letterSpacing: "0.14em",
              textTransform: "none",
              padding: "5px 12px",
              marginBottom: 18,
              borderRadius: 6,
                          }}
          >
            {t("hero_badge")}
          </div>
          <div
            className="mo-in ss-opt"
            onClick={() => setAiOpen(true)}
            style={{
              "--i": 1,
              fontSize: "clamp(13px,3vw,16px)",
              lineHeight: 1.3,
              color: "#A3A8AD",
              marginBottom: 10,
              cursor: "pointer",
              textDecoration: "underline",
              textDecorationColor: "rgba(163,168,173,0.35)",
              textUnderlineOffset: 4,
            }}
          >
            {t("ai_hint_line1")}
            <br />
            {t("ai_hint_line2")}
          </div>
          <h1
            style={{
              fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif",
              fontWeight: 600,
              fontSize: "clamp(28px, 5vw, 44px)",
              lineHeight: 1.15,
              margin: "0 0 16px",
              textTransform: "none",
                          }}
          >
            <SplitWords text={t("hero_title_1")} delay={0.32} offset={0} />{" "}
            <br className="ss-br" />
            <SplitWords text={t("hero_title_2")} delay={0.32} offset={String(t("hero_title_1")).split(/\s+/).filter(Boolean).length} />
          </h1>
          <p className="ss-l mo-in ss-opt-m" style={{ "--i": 3, color: "#A3A8AD", fontSize: 15.5, maxWidth: 480, margin: "0 auto 28px", minHeight: 44 }}>
            {typedIntro}
            {!typedIntroDone && <span className="typewriter-cursor" />}
          </p>
          <form
            className="mo-in ss-l"
            onSubmit={(e) => {
              e.preventDefault();
              const query = heroSearch.trim().toLowerCase();
              const matchedType = TYPES.find((ty) => ty.toLowerCase().includes(query) || query.includes(ty.toLowerCase()));
              setRole("client");
              if (matchedType) setFilterType(matchedType);
              scrollToApp();
            }}
            style={{ "--i": 4, display: "flex", gap: 8, maxWidth: 420, margin: "0 auto 20px" }}
          >
            <input
              value={heroSearch}
              onChange={(e) => setHeroSearch(e.target.value)}
              aria-label={t("hero_search_placeholder")}
              placeholder={t("hero_search_placeholder")}
              style={{ ...inputStyle, flex: 1 }}
            />
            <button type="submit" className="glass-cta">
              {t("hero_search_btn")}
            </button>
          </form>
          <div className="mo-in ss-l" style={{ "--i": 5, display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: 44 }}>
            <button
              onClick={() => {
                setRole("client");
                setAiOpen(true);
              }}
              className="glass-cta"
              data-magnetic
              style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
            >
              <IconExcavator size={16} />
              {t("hero_cta_client")}
            </button>
            <button
              onClick={() => {
                setRole("owner");
                openAddListing();
              }}
              style={smallBtn}
            >
              {t("hero_cta_owner")}
            </button>
          </div>
          <div className="mo-in ss-l ss-opt-p" style={{ "--i": 6, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 8, marginBottom: 8 }}>
            <button className="hero-pill" onClick={() => scrollToApp()}>
              {t("pill_catalog")}
            </button>
            <button className="hero-pill" onClick={() => openRequestForm()}>
              {t("pill_request")}
            </button>
            <button className="hero-pill" onClick={() => { setRole("owner"); openAddListing(); }}>
              {t("pill_add")}
            </button>
            <button className="hero-pill hero-pill-outline" onClick={copyContactEmail}>
              {t("pill_contact")}
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1">
                <rect x="1" y="1" width="7" height="7" />
                <rect x="4" y="4" width="7" height="7" />
              </svg>
            </button>
          </div>
        </div>
          </>
        }
      />

      {/* 3D viewer temporarily removed — revisit later */}

      {/* How it works — the request workflow, as a technical process line */}
      <section id="how-it-works" data-scene style={{ padding: "104px 24px 48px", marginTop: -56, borderBottom: "1px solid #202428" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <SectionDivider n={2} of={5} title={t("how_it_works_label")} />
          <h2 style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif", fontSize: 24, margin: "0 0 32px" }}>
            {t("how_it_works_title")}
          </h2>
          <div className="mo-steps mo-io" style={{ display: "flex", flexWrap: "wrap", gap: 24 }}>
            {[t("step_1"), t("step_2"), t("step_3"), t("step_4"), t("step_5")].map((step, i) => (
              <div key={i} className="mo-step" style={{ "--i": i, flex: "1 1 150px", minWidth: 140 }}>
                <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif", fontSize: 12, color: "#70777D" }}>
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div className="mo-dash" style={{ width: 20, height: 1.4, background: "#FF6A1A", margin: "8px 0 10px" }} />
                <div style={{ fontSize: 14, color: "#F4F4F1", lineHeight: 1.4 }}>{step}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Honest placeholder instead of mock trust signals */}
      <div data-scene style={{ padding: "22px 24px 20px", borderBottom: "1px solid #202428", textAlign: "center" }}>
        {listings.filter((l) => l.ownerId).length > 0 && (
          <div className="mo-stats">
            {[
              [listings.filter((l) => l.ownerId).length, "одиниць техніки в каталозі"],
              [wantedItems.length, "запитів на дошці"],
              [new Set(listings.filter((l) => l.ownerId).map((l) => l.region)).size, "міст"],
            ].map(([n, label]) => (
              <div key={label} className="mo-stat">
                <b>
                  <CountUp value={n} />
                </b>
                <span>{label}</span>
              </div>
            ))}
          </div>
        )}
        <span style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif", fontSize: 12, color: "#A3A8AD", letterSpacing: "0.04em" }}>
          {t("trust_line")}
        </span>
      </div>

      {/* Catalog */}
      <div ref={appSectionRef} data-scene style={{ padding: "28px 24px 8px" }}>
        {role === "client" && <SectionDivider n={3} of={5} title="КАТАЛОГ ТЕХНІКИ" />}
        <h2
          style={{
            fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif",
            fontWeight: 600,
            fontSize: "clamp(24px, 4vw, 38px)",
            textTransform: "none",
            margin: 0,
            lineHeight: 1.15,
            maxWidth: 720,
          }}
        >
          {role === "client"
            ? "Знайдіть техніку поруч — за годину, а не за тиждень"
            : role === "owner"
            ? "Здавайте техніку простою — заявки клієнтів щодня"
            : "Диспетчерська: вручну обирайте, кому піде заявка"}
        </h2>
        <p style={{ color: "#A3A8AD", marginTop: 10, maxWidth: 560, fontSize: 15 }}>
          {role === "client"
            ? "Оберіть дати — покажемо, яка техніка вільна. Натисніть на картку: побачите, для чого вона, де використовується, параметри й календар зайнятості."
            : role === "owner"
            ? "Додайте техніку з характеристиками одноразово — заявки клієнтів з вашого регіону приходитимуть автоматично."
            : "Жодна заявка не йде власникам автоматично. Ви бачите рекомендації системи й вирішуєте, кому надіслати."}
        </p>
        {role === "owner" && user && (
          <div style={{ marginTop: 14, display: "flex", gap: 20 }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 600 }}>
                {listings.filter((l) => (l.ownerId ? l.ownerId === user.id : l.owner === (user.org || user.name))).length}
              </div>
              <Label>Моя техніка</Label>
            </div>
          </div>
        )}
      </div>

      {/* Action bar */}
      {role !== "dispatcher" && (
        <div style={{ padding: "16px 24px", display: "flex", gap: 12, flexWrap: "wrap" }}>
          {role === "client" ? (
            <>
              <button onClick={() => openRequestForm()} style={primaryBtn}>
                {t("add_request_btn")}
              </button>
              {user && (
                <button
                  onClick={() => {
                    setClientTab(clientPending > 0 ? "offers" : null);
                    loadClientData();
                    setShowMyRequests(true);
                  }}
                  style={clientPending > 0 ? { ...smallBtn, borderColor: "#FF6A1A", color: "#FF6A1A" } : smallBtn}
                >
                  Мій кабінет{clientPending > 0 ? ` (${clientPending})` : ""}
                </button>
              )}
            </>
          ) : (
            <>
              <button onClick={() => openAddListing()} style={primaryBtn}>
                {t("add_listing_btn")}
              </button>
              {user?.role === "owner" && (
                <button
                  onClick={() => {
                    setOwnerTab(
                      ownerResponses.some((x) => x.status === "chosen" && x.request.status !== "taken")
                        ? "responses"
                        : ownerBookings.some((b) => b.status === "reserved") || inboxPending === 0
                        ? "rentals"
                        : "requests"
                    );
                    setShowInbox(true);
                    loadInbox(false);
                    loadOwnerBookings();
                    loadOwnerResponses();
                  }}
                  style={ownerAttention > 0 ? { ...smallBtn, borderColor: "#FF6A1A", color: "#FF6A1A" } : smallBtn}
                >
                  Кабінет власника
                  {ownerAttention > 0 ? ` (${ownerAttention})` : ""}
                </button>
              )}
            </>
          )}
        </div>
      )}

      {role === "dispatcher" && (
        <DispatcherPanel requests={requests} owners={dispatchOwners} listings={listings} allBookings={dealsData.bookings} offers={dealsData.offers} onDispatch={handleDispatch} onOwnerAction={handleOwnerAction} onRefresh={loadDispatcherData} onPropose={handlePropose} onManual={handleManualBooking} onConfirm={handleConfirmBooking} onCancel={handleCancelBooking} onDecline={handleDeclineRequest} users={dispatchUsers} onSetRole={handleSetRole} onDeleteUser={handleDeleteUser} viewRequest={dispatcherViewRequest} user={user} t={t} />
      )}

      {/* Filters (client view) */}
      {role === "client" && (
        <div style={{ padding: "0 24px 8px", display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif", fontSize: 12.5, color: "#A3A8AD" }}>Коли потрібно:</span>
          <input
            type="date"
            aria-label="Потрібно з"
            min={new Date().toLocaleDateString("sv-SE")}
            value={catFrom}
            onChange={(e) => {
              setCatFrom(e.target.value);
              if (catTo && e.target.value && catTo < e.target.value) setCatTo(e.target.value);
            }}
            style={selectStyle}
          />
          <span style={{ color: "#70777D" }}>—</span>
          <input type="date" aria-label="Потрібно по" min={catFrom || new Date().toLocaleDateString("sv-SE")} value={catTo} onChange={(e) => setCatTo(e.target.value)} style={selectStyle} />
          {(catFrom || catTo) && (
            <button onClick={() => { setCatFrom(""); setCatTo(""); }} aria-label="Скинути дати" style={{ ...selectStyle, cursor: "pointer", color: "#A3A8AD" }}>
              ✕ Скинути
            </button>
          )}
          {datesChosen && (
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif", fontSize: 12.5, color: "#A3A8AD", cursor: "pointer" }}>
              <input type="checkbox" checked={onlyFree} onChange={(e) => setOnlyFree(e.target.checked)} style={{ accentColor: "#FF6A1A", width: 16, height: 16 }} />
              Тільки вільна на ці дати
            </label>
          )}
          <span style={{ flexBasis: "100%", height: 0 }} />
          <select aria-label="Тип техніки" value={filterType} onChange={(e) => setFilterType(e.target.value)} style={selectStyle}>
            <option value="Усі">{t("filter_all")}</option>
            {TYPES.map((ty) => (
              <option key={ty} value={ty}>{tType(ty, lang)}</option>
            ))}
          </select>
          <select aria-label="Регіон" value={filterRegion} onChange={(e) => setFilterRegion(e.target.value)} style={selectStyle}>
            <option value="Усі">{t("filter_all")}</option>
            {REGIONS.filter((r) => r !== "Інше").map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
          <select aria-label="Сортування" value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={selectStyle}>
            <option value="default">{t("sort_default")}</option>
            <option value="price_asc">{t("sort_price_asc")}</option>
            <option value="price_desc">{t("sort_price_desc")}</option>
          </select>
          <input
            type="number"
            value={filterMaxPrice}
            onChange={(e) => setFilterMaxPrice(e.target.value)}
            aria-label={t("filter_price_placeholder")}
            placeholder={t("filter_price_placeholder")}
            style={{ ...selectStyle, width: 140 }}
          />
          <button
            onClick={() => setShowFavoritesOnly((v) => !v)}
            style={{
              ...selectStyle,
              cursor: "pointer",
              color: showFavoritesOnly ? "#FF6A1A" : "#ffffff",
              borderColor: showFavoritesOnly ? "#FF6A1A" : "#63696D",
            }}
          >
            ♥ {t("favorites_btn")}{favorites.size > 0 ? ` (${favorites.size})` : ""}
          </button>
        </div>
      )}

      {/* Recently viewed */}
      {role === "client" && recentlyViewed.length > 0 && (
        <div style={{ padding: "0 24px 12px", display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <Label>{t("recently_viewed")}</Label>
          {recentlyViewed.map((id) => {
            const l = listings.find((x) => x.id === id);
            if (!l) return null;
            return (
              <button
                key={id}
                onClick={() => setFilterType(l.type)}
                style={{ ...smallBtn, padding: "5px 10px", fontSize: 11 }}
              >
                {l.brand}
              </button>
            );
          })}
        </div>
      )}

      {/* Catalog */}
      {role !== "dispatcher" && (
      <div
        style={{
          padding: "16px 24px 64px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 16,
        }}
      >
        {filtered.map((l, i) => (
          <Plate
            key={l.id}
            className="equipment-card reveal"
            style={{ padding: "14px 12px", cursor: "pointer", transitionDelay: `${Math.min(i % 6, 5) * 0.06}s` }}
            onClick={() => openDetail(l)}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                const url = `${window.location.origin}${window.location.pathname}#listing-${l.id}`;
                navigator.clipboard?.writeText(url);
                flashToast("Посилання скопійовано");
              }}
              aria-label="Поділитися"
              style={{
                position: "absolute",
                top: 2,
                right: 46,
                width: 44,
                height: 44,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 15,
                color: "#70777D",
                zIndex: 2,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
                <circle cx="12.5" cy="3.5" r="2" />
                <circle cx="3.5" cy="8" r="2" />
                <circle cx="12.5" cy="12.5" r="2" />
                <path d="M5.3 7L10.7 4.3M5.3 9L10.7 11.7" />
              </svg>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFavorite(l.id);
              }}
              aria-label="Обране"
              style={{
                position: "absolute",
                top: 2,
                right: 2,
                width: 44,
                height: 44,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 18,
                color: favorites.has(l.id) ? "#FF6A1A" : "#70777D",
                zIndex: 2,
              }}
            >
              {favorites.has(l.id) ? "♥" : "♡"}
            </button>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ marginBottom: 6 }}>
                  <RoleTag kind="lease" />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3 }}>
                  <span className={l.available ? "status-dot-available" : ""} style={{ width: 6, height: 6, borderRadius: "50%", background: l.available ? "#5FA876" : "#70777D", display: "inline-block" }} />
                  <span style={{ fontSize: 10.5, color: "#70777D", fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif" }}>
                    {l.available ? t("status_available") : t("status_busy")}
                  </span>
                </div>
                {datesChosen && l.available && (
                  <div style={{ fontSize: 11.5, fontWeight: 600, marginBottom: 4, color: busyOnChosen(l) ? "#c96b5a" : "#5FA876" }}>
                    {busyOnChosen(l) ? `● Зайнята на ці дати (до ${deals.fmtDate(busyOnChosen(l))})` : "● Вільна на ваші дати"}
                  </div>
                )}
                <Label>{tType(l.type, lang)}</Label>
                <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif", fontSize: 18, fontWeight: 600, marginTop: 2 }}>
                  {l.brand}
                </div>
              </div>
              {l.photos && l.photos.length > 0 ? (
                <div style={{ position: "relative" }}>
                  <img src={l.photos[0]} alt={l.brand} style={{ width: 44, height: 44, objectFit: "cover", border: "1px solid #63696D" }} />
                  {l.photos.length > 1 && (
                    <span style={{ position: "absolute", bottom: -4, right: -4, fontSize: 9.5, fontWeight: 600, background: "#08090A", color: "#F4F4F1", border: "1px solid #63696D", borderRadius: 980, padding: "1px 5px" }}>
                      +{l.photos.length - 1}
                    </span>
                  )}
                </div>
              ) : (
                <div className="icon-tilt" style={{ color: "#FF6A1A", filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.4))" }}><EquipmentIcon type={l.type} size={46} /></div>
              )}
            </div>

            <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 4 }}>
              {Object.entries(l.specs).filter(([, v]) => v && v !== "—").map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif", color: "#F4F4F1" }}>
                  <span style={{ color: "#A3A8AD" }}>{k}</span>
                  <span>{v}</span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px dashed #63696D", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div
                  style={{
                    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif",
                    fontSize: 19,
                    fontWeight: 600,
                    background: "linear-gradient(90deg, #FF6A1A, #FFB52E)",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    color: "transparent",
                  }}
                >
                  {l.price} ₴<span style={{ fontSize: 12, color: "#A3A8AD", WebkitTextFillColor: "#A3A8AD" }}>/{l.unit}</span>
                </div>
                <div style={{ fontSize: 11, color: "#A3A8AD" }}>
                  {l.region} · {l.owner}
                  {ownerRatings[l.owner] && (
                    <span style={{ color: "#FFB52E" }}> · ★ {ownerRatings[l.owner].avg.toFixed(1)} ({ownerRatings[l.owner].count})</span>
                  )}
                </div>
                {l.photos && l.photos.length > 0 && (
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      marginTop: 4,
                      fontSize: 10.5,
                      fontWeight: 600,
                      color: "#0b0a09",
                      background: "linear-gradient(90deg, #ffe08a, #FFB52E)",
                      borderRadius: 980,
                      padding: "2px 9px",
                    }}
                  >
                    ✓ Перевірено власником
                  </div>
                )}
                {!l.available && l.busyUntil && (
                  <div style={{ fontSize: 11, color: "#c9a83f", marginTop: 2 }}>{t("busy_until")} {l.busyUntil}</div>
                )}
                {busyNowUntil(l.id) && (
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#c96b5a", marginTop: 4, letterSpacing: "0.02em" }}>
                    ● ЗАЙНЯТА до {deals.fmtDate(busyNowUntil(l.id))}
                  </div>
                )}
                {!busyNowUntil(l.id) && busyNextRange(l.id) && (
                  <div style={{ fontSize: 11.5, color: "#FFB52E", marginTop: 4 }}>
                    Найближча оренда: {deals.fmtDate(busyNextRange(l.id).date_from)} — {deals.fmtDate(busyNextRange(l.id).date_to)}
                  </div>
                )}
              </div>
              <button
                disabled={!l.available}
                onClick={(e) => {
                  e.stopPropagation();
                  openBooking(l);
                }}
                style={{
                  ...smallBtn,
                  opacity: l.available ? 1 : 0.4,
                  cursor: l.available ? "pointer" : "not-allowed",
                }}
              >
                {l.available ? t("respond_btn") : t("busy_btn")}
              </button>
            </div>
          </Plate>
        ))}
        {!listingsReady && [0, 1, 2].map((i) => <div key={i} className="skeleton" style={{ height: 150 }} aria-hidden="true" />)}
        {listingsReady && filtered.length === 0 && (
          <div style={{ color: "#A3A8AD", fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif", fontSize: 13 }}>
            {t("catalog_empty")}
          </div>
        )}
      </div>
      )}

      {/* Дошка запитів: хто що шукає */}
      <div data-scene style={{ padding: "8px 24px 0", maxWidth: 1100, margin: "0 auto" }}>
        <SectionDivider n={4} of={5} title="ДОШКА ЗАПИТІВ" />
      </div>
      <WantedBoard
        items={wantedItems}
        loaded={wantedLoaded}
        user={user}
        onPublish={() => openRequestForm()}
        onRespond={openRespond}
        onUnpublish={(id) => handleTogglePublic(id, false)}
        onSignIn={() => {
          setShowAuthForm(true);
          flashToast("Щоб відгукнутись, увійдіть як власник техніки");
        }}
      />

      {/* FAQ */}
      <div data-scene style={{ padding: "8px 24px 64px", maxWidth: 640, margin: "0 auto" }}>
        <SectionDivider n={5} of={5} title={t("faq_label").toUpperCase()} />
        <h2 style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif", fontSize: 22, textTransform: "none", margin: "0 0 12px" }}>
          {t("faq_title")}
        </h2>
        <FaqAccordion items={t("faq_items")} />
      </div>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid #202428", padding: "32px 24px", marginTop: 8 }}>
        <div
          style={{
            maxWidth: 1000,
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 24,
          }}
        >
          <div>
            <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif", fontWeight: 700, fontSize: 16, textTransform: "none" }}>
              ТЕХ<span style={{ color: "#FF6A1A" }}>МАЙДАНЧИК</span>
            </div>
            <p style={{ color: "#A3A8AD", fontSize: 12, marginTop: 8, maxWidth: 260, lineHeight: 1.6 }}>
              {t("footer_desc")}
            </p>
          </div>

          <div style={{ display: "flex", gap: 40, flexWrap: "wrap" }}>
            <div>
              <Label>{t("footer_contacts")}</Label>
              <div style={{ marginTop: 8, fontSize: 12.5, color: "#A3A8AD", lineHeight: 2 }}>
                <div>demolis@ukr.net</div>
                <div>+380 98 131 97 25</div>
                <div>Миколаїв, Україна</div>
              </div>
            </div>
            <div>
              <Label>{t("footer_info")}</Label>
              <div style={{ marginTop: 8, fontSize: 12.5, color: "#A3A8AD", lineHeight: 2 }}>
                <div>{t("footer_terms")}</div>
                <div>{t("footer_privacy")}</div>
                <div>{t("footer_for_owners")}</div>
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            maxWidth: 1000,
            margin: "24px auto 0",
            paddingTop: 16,
            borderTop: "1px solid #202428",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          <span style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif", fontSize: 11, color: "#70777D" }}>
            © {new Date().getFullYear()} ТехМайданчик
          </span>
          <button
            onClick={() => {
              if (dispatcherUnlocked) setRole("dispatcher");
              else if (!user) {
                setShowAuthForm(true);
                flashToast("Панель диспетчера: спершу увійдіть у свій акаунт");
              } else flashToast("Панель доступна лише диспетчеру");
            }}
            style={{
              background: "none",
              border: "none",
              color: "#70777D",
              fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif",
              fontSize: 11,
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            {t("footer_dispatcher")}
          </button>
        </div>
      </footer>

      {detailListing && (
        <Modal onClose={() => setDetailListing(null)} title={detailListing.brand} wide>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <RoleTag kind="lease" />
            </div>
            <div style={{ display: "flex", justifyContent: "center", padding: "20px 0", background: "#191C1F", borderRadius: 12 }}>
              {detailListing.photos && detailListing.photos.length > 0 ? (
                <img
                  src={detailListing.photos[detailPhotoIndex] || detailListing.photos[0]}
                  alt={detailListing.brand}
                  style={{ maxWidth: "100%", maxHeight: 160, objectFit: "cover" }}
                />
              ) : (
                <div style={{ color: "#FF6A1A" }}><EquipmentIcon type={detailListing.type} size={90} /></div>
              )}
            </div>
            {detailListing.photos && detailListing.photos.length > 1 && (
              <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                {detailListing.photos.map((p, i) => (
                  <img
                    key={i}
                    src={p}
                    alt={`Фото ${i + 1}`}
                    onClick={() => setDetailPhotoIndex(i)}
                    style={{
                      width: 44,
                      height: 44,
                      objectFit: "cover",
                      cursor: "pointer",
                      borderRadius: 6,
                      border: i === detailPhotoIndex ? "2px solid #FF6A1A" : "1px solid #63696D",
                    }}
                  />
                ))}
              </div>
            )}

            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span className={detailListing.available ? "status-dot-available" : ""} style={{ width: 6, height: 6, borderRadius: "50%", background: detailListing.available ? "#5FA876" : "#70777D" }} />
              <span style={{ fontSize: 11, color: "#70777D" }}>{detailListing.available ? t("status_available") : t("status_busy")}</span>
            </div>

            <div>
              <Label>{tType(detailListing.type, lang)}</Label>
              <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif", fontSize: 22, fontWeight: 600 }}>
                {detailListing.brand}
              </div>
              <div style={{ fontSize: 13, color: "#A3A8AD", marginTop: 2 }}>{detailListing.region}</div>
            </div>

            {EQUIPMENT_INFO[detailListing.type] && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div>
                  <Label>Для чого служить</Label>
                  <p style={{ margin: "8px 0 0", fontSize: 13.5, lineHeight: 1.55, color: "#D9DCDF" }}>{EQUIPMENT_INFO[detailListing.type].definition}</p>
                </div>
                <div>
                  <Label>{t("guide_uses_label")}</Label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                    {EQUIPMENT_INFO[detailListing.type].uses.map((u) => (
                      <span key={u} style={{ fontSize: 12, padding: "4px 10px", borderRadius: 980, border: "1px solid #3a3f44", color: "#FFB52E" }}>{u}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div style={{ borderTop: "1px solid #202428", borderBottom: "1px solid #202428", padding: "12px 0" }}>
              <Label>Параметри</Label>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
                {[["Тип", tType(detailListing.type, lang)], ["Регіон", detailListing.region], ...Object.entries(detailListing.specs).filter(([, v]) => v && v !== "—")].map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 13 }}>
                    <span style={{ color: "#A3A8AD" }}>{k}</span>
                    <span style={{ textAlign: "right" }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>

            <div
              style={{
                fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif",
                fontSize: 26,
                fontWeight: 600,
                background: "linear-gradient(90deg, #FF6A1A, #FFB52E)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              {detailListing.price} ₴<span style={{ fontSize: 14, color: "#A3A8AD", WebkitTextFillColor: "#A3A8AD" }}>/{detailListing.unit}</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
              {detailListing.owner}
              {detailListing.photos && detailListing.photos.length > 0 && <span style={{ color: "#FFB52E" }}>✓</span>}
            </div>

            {busyNowUntil(detailListing.id) && (
              <div style={{ padding: "12px 14px", border: "1px solid #c96b5a", background: "rgba(201,107,90,0.1)", color: "#e0a89c", fontSize: 14, fontWeight: 700, letterSpacing: "0.02em" }}>
                ● ЗАЙНЯТА до {deals.fmtDate(busyNowUntil(detailListing.id))}
              </div>
            )}
            {!busyNowUntil(detailListing.id) && busyNextRange(detailListing.id) && (
              <div style={{ padding: "10px 14px", border: "1px solid #FFB52E", background: "rgba(255,181,46,0.08)", color: "#FFB52E", fontSize: 13 }}>
                Найближча оренда: {deals.fmtDate(busyNextRange(detailListing.id).date_from)} — {deals.fmtDate(busyNextRange(detailListing.id).date_to)}. Обирайте вільні дати.
              </div>
            )}
            <div>
              <Label>Коли техніка вільна</Label>
              <div style={{ marginTop: 10 }}>
                <AvailabilityCalendar ranges={busyRanges.filter((r) => r.listing_id === detailListing.id)} selectFrom={datesChosen ? catFrom : ""} selectTo={datesChosen ? catTo : ""} />
              </div>
            </div>
            <button
              disabled={!detailListing.available}
              onClick={() => {
                const dl = detailListing;
                setDetailListing(null);
                openBooking(dl);
              }}
              style={{ ...primaryBtn, width: "100%", opacity: detailListing.available ? 1 : 0.4, cursor: detailListing.available ? "pointer" : "not-allowed" }}
            >
              ЗАБРОНЮВАТИ НА ДАТИ
            </button>

            {detailListing.ownerId && user && (user.id === detailListing.ownerId || user.role === "dispatcher") && (
              <div style={{ display: "flex", gap: 8, paddingTop: 4, borderTop: "1px dashed #63696D" }}>
                <button type="button" onClick={() => toggleAvailability(detailListing)} style={{ ...smallBtn, flex: 1 }}>
                  {detailListing.available ? "Позначити зайнятою" : "Позначити вільною"}
                </button>
                <button type="button" onClick={() => deleteListing(detailListing)} style={{ ...smallBtn, borderColor: "#c96b5a", color: "#c96b5a" }}>
                  Видалити
                </button>
              </div>
            )}
          </div>
        </Modal>
      )}

      {showAddForm && (
        <Modal onClose={() => setShowAddForm(false)} title={t("add_listing_title")}>
          <AddListingForm onSubmit={handleAddListing} user={user} lang={lang} />
        </Modal>
      )}
      {showRequestForm && (
        <Modal
          onClose={() => {
            setShowRequestForm(false);
            setAiPrefill(null);
          }}
          title={t("request_title")}
        >
          <RequestForm onSubmit={handleSubmitRequest} user={user} initial={aiPrefill} t={t} lang={lang} />
        </Modal>
      )}
      {showMyRequests && user && (
        <Modal onClose={() => { setShowMyRequests(false); setClientTab(null); }} title="Мій кабінет" wide>
          <ClientCabinet key={clientTab || "auto"} data={clientData} initialTab={clientTab} onRespond={handleRespondOffer} onRefresh={loadClientData} onCancelRequest={handleCancelRequest} onTogglePublic={handleTogglePublic} onChooseResponse={handleChooseResponse} />
        </Modal>
      )}

      {respondingWanted && user && (
        <Modal onClose={() => setRespondingWanted(null)} title="Пропозиція власника" wide>
          <RespondForm
            request={respondingWanted}
            myListings={listings.filter((l) => l.ownerId === user.id)}
            busyRanges={busyRanges}
            onSubmit={handleRespondWanted}
            onAddListing={() => {
              setRespondingWanted(null);
              openAddListing();
            }}
          />
        </Modal>
      )}

      {bookingListing && (
        <Modal onClose={() => setBookingListing(null)} title="Бронювання техніки" wide>
          <BookingForm listing={bookingListing} busyRanges={busyRanges} onSubmit={handleBook} initialFrom={datesChosen ? catFrom : ""} initialTo={datesChosen ? catTo : ""} />
        </Modal>
      )}

      {showNotifications && user && (
        <Modal onClose={() => setShowNotifications(false)} title="Сповіщення" wide>
          <NotificationsPanel items={notifications} onOpenItem={openNotification} onMarkAll={markAllNotifications} />
        </Modal>
      )}

      {showInbox && (
        <Modal onClose={() => setShowInbox(false)} title="Кабінет власника" wide>
          <OwnerCabinet
            tab={ownerTab}
            setTab={setOwnerTab}
            inboxItems={ownerInbox}
            bookings={ownerBookings}
            responses={ownerResponses}
            onWithdrawResponse={handleWithdrawResponse}
            onRefreshResponses={loadOwnerResponses}
            onRespondRequest={respondToRequest}
            onRefreshInbox={() => loadInbox(false)}
            onRefreshBookings={loadOwnerBookings}
          />
        </Modal>
      )}

      {showAuthForm && (
        <Modal onClose={() => setShowAuthForm(false)} title={t("register_title")} splitLeft>
          <AuthForm onSubmit={handleAuth} />
        </Modal>
      )}
      {showProfile && user && (
        <Modal onClose={() => setShowProfile(false)} title={t("profile_title")}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
            {user.role === "dispatcher" ? (
              <button
                onClick={() => {
                  setShowProfile(false);
                  setRole("dispatcher");
                }}
                style={{ ...primaryBtn, minHeight: 44 }}
              >
                Панель диспетчера
              </button>
            ) : (
              <>
                <button
                  onClick={() => {
                    setShowProfile(false);
                    setClientTab(null);
                    loadClientData();
                    setShowMyRequests(true);
                  }}
                  style={{ ...smallBtn, minHeight: 44, display: "flex", alignItems: "center", gap: 8 }}
                >
                  <RoleTag kind="rent" /> Мої заявки й оренди
                </button>
                {user.role === "owner" && (
                  <button
                    onClick={() => {
                      setShowProfile(false);
                      setOwnerTab("rentals");
                      setShowInbox(true);
                      loadInbox(false);
                      loadOwnerBookings();
                      loadOwnerResponses();
                    }}
                    style={{ ...smallBtn, minHeight: 44, display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <RoleTag kind="lease" /> Кабінет власника
                  </button>
                )}
              </>
            )}
          </div>
          <ProfileForm user={user} onSave={handleUpdateProfile} onLogout={handleLogout} />
        </Modal>
      )}

      <AiAssistant
        user={user}
        t={t}
        listings={listings}
        open={aiOpen}
        setOpen={setAiOpen}
        onPrefillRequest={(data) => openRequestForm(data)}
        onViewListing={(l) => openDetail(l)}
      />

      <div className="sticky-cta">
        <span style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif", fontSize: 12.5, color: "#A3A8AD" }}>
          {role === "owner" ? "Готові здати техніку?" : "Потрібна техніка зараз?"}
        </span>
        <button
          onClick={() => (role === "owner" ? openAddListing() : openRequestForm())}
          style={{ ...primaryBtn, padding: "9px 16px" }}
        >
          {role === "owner" ? "Додати" : "Залишити заявку"}
        </button>
      </div>

      {toast && (
        <div
          key={toast}
          className="mo-toast"
          role="status"
          style={{
            position: "fixed",
            bottom: 20,
            left: "50%",
            transform: "translateX(-50%)",
            background: "#FF6A1A",
            color: "#08090A",
            padding: "10px 18px",
            fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif",
            fontSize: 12.5,
            fontWeight: 700,
            letterSpacing: "0.02em",
            boxShadow: "0 6px 20px rgba(0,0,0,.4)",
          }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}

// ---- Dispatcher panel ----
// Диспетчерська: три вкладки. «Заявки» — основна робота; «Техніка» — хто хоче кожну одиницю;
// «Користувачі» — усі зареєстровані.
function DispatcherPanel(props) {
  const { requests, listings, allBookings, offers, users, onSetRole, onManual, onDecline, onConfirm, onDeleteUser, viewRequest, user } = props;
  const [view, setView] = useState("pairs");
  // Нові користувачі від вашого останнього візиту у вкладку «Користувачі»
  const SEEN_KEY = "techmaydanchik_users_seen";
  const [seenAt] = useState(() => {
    try {
      return window.localStorage.getItem(SEEN_KEY) || new Date(Date.now() - 7 * 86400000).toISOString();
    } catch (e) {
      return new Date(Date.now() - 7 * 86400000).toISOString();
    }
  });
  const unseenUsers = users.filter((u) => u.role !== "dispatcher" && u.created_at > seenAt).length;
  useEffect(() => {
    if (view === "users") {
      try {
        window.localStorage.setItem(SEEN_KEY, new Date().toISOString());
      } catch (e) {}
    }
  }, [view]);
  useEffect(() => {
    if (viewRequest && viewRequest.view) setView(viewRequest.view);
  }, [viewRequest]);
  const attention = requests.filter((r) => r.status === "new" || r.status === "booked").length;
  const wanted = requests.filter((r) => r.listingId && ["new", "dispatched", "offered"].includes(r.status)).length;
  const decide =
    requests.filter((r) => ["new", "dispatched", "offered"].includes(r.status) && (r.listingId || (r.responses || []).some((x) => ["sent", "chosen"].includes(x.status)))).length +
    allBookings.filter((b) => b.status === "reserved").length;
  const clientsCount = users.filter((u) => u.role === "client").length;
  const ownersCount = users.filter((u) => u.role === "owner").length;
  // Дві сторони ринку: «Візьму в оренду» (клієнти) і «Здам в оренду» (власники з технікою)
  const groups = [
    {
      title: "Візьму в оренду",
      color: "#6fae6f",
      tabs: [
        ["pairs", "Хто в кого", decide],
        ["requests", "Заявки", attention],
        ["clients", "Клієнти", clientsCount],
      ],
    },
    {
      title: "Здам в оренду",
      color: "#FF6A1A",
      tabs: [
        ["equipment", "Техніка", wanted],
        ["owners", "Власники", ownersCount],
      ],
    },
    {
      title: "Облік",
      color: "#A3A8AD",
      tabs: [["users", "Користувачі", unseenUsers > 0 ? unseenUsers : users.length]],
    },
  ];
  const sansFont = "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif";
  const quiet = (key) => (key === "users" && unseenUsers === 0) || key === "clients" || key === "owners";
  return (
    <div>
      <div role="tablist" aria-label="Розділи диспетчерської" style={{ display: "flex", flexWrap: "wrap", gap: "10px 30px", padding: "0 24px", borderBottom: "1px solid #202428", margin: "0 0 14px" }}>
        {groups.map((g) => (
          <div key={g.title} role="presentation" style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontFamily: sansFont, fontSize: 12.5, fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase", color: g.color, padding: "4px 14px 0", borderTop: `2px solid ${g.color}` }}>
              {g.title}
            </div>
            <SlidingTabs
              tabs={g.tabs.map(([key, label, count]) => ({ key, label, count }))}
              value={view}
              onChange={setView}
              buttonStyle={(active) => ({ background: "none", border: "none", color: active ? "#F4F4F1" : "#A3A8AD", fontFamily: sansFont, fontSize: 14, padding: "8px 14px", cursor: "pointer", whiteSpace: "nowrap", minHeight: 44 })}
              renderLabel={(tab) => (
                <>
                  {tab.label}
                  {tab.count > 0 && (
                    <span style={{ marginLeft: 6, background: quiet(tab.key) ? "#2a2e32" : "#FF6A1A", color: quiet(tab.key) ? "#F4F4F1" : "#08090A", borderRadius: 980, padding: "1px 7px", fontSize: 11, fontWeight: 600 }}>
                      {tab.key === "users" && unseenUsers > 0 ? "+" : ""}
                      {tab.count}
                    </span>
                  )}
                </>
              )}
            />
          </div>
        ))}
      </div>
      {view === "pairs" && (
        <div style={{ padding: "0 24px 48px" }}>
          <PairsBoard
            requests={requests}
            listings={listings}
            offers={offers || []}
            bookings={allBookings}
            users={users}
            onConfirm={(r) => onManual(r.id, r.listingId, r.dateFrom, r.dateTo)}
            onDecline={onDecline}
            onConfirmBooking={onConfirm}
            onManual={onManual}
            onOpenRequests={() => setView("requests")}
          />
        </div>
      )}
      {view === "requests" && <DispatcherRequests {...props} />}
      {view === "equipment" && (
        <div style={{ padding: "0 24px 48px" }}>
          <EquipmentBoard listings={listings} requests={requests} allBookings={allBookings} onConfirm={(r) => onManual(r.id, r.listingId, r.dateFrom, r.dateTo)} onDecline={onDecline} />
        </div>
      )}
      {(view === "clients" || view === "owners") && (
        <div style={{ padding: "0 24px 48px" }}>
          <UsersBoard users={users} requests={requests} bookings={allBookings} listings={listings} currentUserId={user && user.id} seenSince={seenAt} onSetRole={onSetRole} onDelete={onDeleteUser} lockRole={view === "clients" ? "client" : "owner"} />
        </div>
      )}
      {view === "users" && (
        <div style={{ padding: "0 24px 48px" }}>
          <UsersBoard users={users} requests={requests} bookings={allBookings} listings={listings} currentUserId={user && user.id} seenSince={seenAt} onSetRole={onSetRole} onDelete={onDeleteUser} />
        </div>
      )}
    </div>
  );
}

function DispatcherRequests({ requests, owners, users, listings, allBookings, onDispatch, onOwnerAction, onRefresh, onPropose, onManual, onConfirm, onCancel, onDecline, user, t }) {
  const [filter, setFilter] = useState("all");

  const categories = [
    { key: "all", label: t("dispatcher_all"), test: () => true },
    { key: "new", label: t("dispatcher_new"), test: (r) => r.status === "new" },
    { key: "booked", label: "Очікують підтвердження", test: (r) => r.status === "booked" },
    { key: "dispatched", label: t("dispatcher_progress"), test: (r) => r.status === "dispatched" || r.status === "offered" },
    { key: "taken", label: t("dispatcher_done"), test: (r) => r.status === "taken" },
  ];

  const filtered = requests.filter(categories.find((c) => c.key === filter).test);

  if (requests.length === 0) {
    return (
      <div style={{ padding: "8px 24px 48px" }}>
        <Plate style={{ padding: "24px", maxWidth: 480 }}>
          <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif", fontSize: 13, color: "#A3A8AD" }}>
            Заявок поки немає. Щойно клієнт залишить заявку через форму — вона з'явиться тут для диспетчеризації.
          </div>
          <button onClick={onRefresh} style={{ ...smallBtn, marginTop: 12 }}>Оновити</button>
        </Plate>
      </div>
    );
  }

  return (
    <div className="dispatcher-layout" style={{ padding: "8px 24px 48px", display: "flex", gap: 20 }}>
      <div className="dispatcher-sidebar" style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 160, flexShrink: 0 }}>
        <button onClick={onRefresh} style={{ ...smallBtn, marginBottom: 8 }}>Оновити</button>
        <div style={{ fontSize: 11, color: "#70777D", padding: "0 12px 8px", fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif" }}>
          Власників у базі: {owners.length}
        </div>
        {categories.map((c) => {
          const count = requests.filter(c.test).length;
          const active = filter === c.key;
          return (
            <button
              key={c.key}
              onClick={() => setFilter(c.key)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: active ? "#191C1F" : "transparent",
                border: "none",
                color: active ? "#F4F4F1" : "#A3A8AD",
                fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif",
                fontSize: 13,
                padding: "9px 12px",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  flexShrink: 0,
                  background: active
                    ? "radial-gradient(circle at 35% 30%, #FFC862, #FF6A1A 70%)"
                    : "radial-gradient(circle at 35% 30%, #8e8e93, transparent)",
                  boxShadow: active ? "0 0 5px 1.5px rgba(255,106,26,0.65)" : "-1px -1px 2px rgba(255,255,255,0.12), 0 1px 2px rgba(0,0,0,0.5)",
                }}
              />
              <span style={{ flex: 1 }}>{c.label}</span>
              <span style={{ fontSize: 11, color: "#70777D" }}>{count}</span>
            </button>
          );
        })}
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
        {filtered.length === 0 ? (
          <div style={{ fontSize: 13, color: "#70777D" }}>Немає заявок у цій категорії.</div>
        ) : (
          filtered.map((req) => (
            <RequestDispatchCard key={req.id} req={req} owners={owners} users={users} listings={listings} allBookings={allBookings} onDispatch={onDispatch} onOwnerAction={onOwnerAction} onPropose={onPropose} onManual={onManual} onConfirm={onConfirm} onCancel={onCancel} onDecline={onDecline} user={user} />
          ))
        )}
      </div>
    </div>
  );
}

const STATUS_LABEL = {
  sent: "надіслано, очікує",
  accepted: "взяв заявку",
  rejected: "відмовився",
  expired: "втратив актуальність",
};
const STATUS_COLOR = {
  sent: "#c9a83f",
  accepted: "#6fae6f",
  rejected: "#c96b5a",
  expired: "#70777D",
};

// ---- Client-facing request status panel ----
function clientStatusInfo(req) {
  if (req.status === "taken") {
    const acceptedEntry = req.log.find((l) => l.action === "accepted");
    return { label: acceptedEntry ? `Виконує: ${acceptedEntry.ownerName}` : "Заявку виконано", color: "#6fae6f" };
  }
  if (req.status === "dispatched") {
    return { label: "Надіслано власникам, очікуємо відповіді", color: "#c9a83f" };
  }
  if (req.log.length > 0) {
    return { label: "Шукаємо виконавця далі", color: "#c9a83f" };
  }
  return { label: "Заявку прийнято, очікує диспетчеризації", color: "#A3A8AD" };
}

function useTypewriter(text, speed = 38, startDelay = 500) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    const reduced = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setDisplayed(text);
      setDone(true);
      return;
    }
    setDisplayed("");
    setDone(false);
    let i = 0;
    let interval;
    const startTimer = setTimeout(() => {
      interval = setInterval(() => {
        i++;
        setDisplayed(text.slice(0, i));
        if (i >= text.length) {
          clearInterval(interval);
          setDone(true);
        }
      }, speed);
    }, startDelay);
    return () => {
      clearTimeout(startTimer);
      clearInterval(interval);
    };
  }, [text, speed, startDelay]);

  return { displayed, done };
}

function StarRating({ value, onChange, readOnly }) {
  return (
    <div style={{ display: "flex", gap: 3 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          onClick={() => !readOnly && onChange?.(n)}
          style={{
            cursor: readOnly ? "default" : "pointer",
            color: n <= value ? "#FF6A1A" : "#63696D",
            fontSize: 16,
          }}
        >
          ★
        </span>
      ))}
    </div>
  );
}

function ReviewBox({ req, onSubmit }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const acceptedEntry = req.log.find((l) => l.action === "accepted");
  const ownerName = acceptedEntry?.ownerName || "виконавець";

  return (
    <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px dashed #63696D" }}>
      <Label>Оцініть роботу «{ownerName}»</Label>
      <div style={{ marginTop: 6 }}>
        <StarRating value={rating} onChange={setRating} />
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Коментар (необов'язково)"
        rows={2}
        style={{ ...inputStyle, marginTop: 8, width: "100%", resize: "vertical" }}
      />
      <button
        onClick={() => rating > 0 && onSubmit(req.id, ownerName, rating, comment)}
        disabled={rating === 0}
        style={{ ...smallBtn, marginTop: 8, opacity: rating === 0 ? 0.5 : 1 }}
      >
        Надіслати відгук
      </button>
    </div>
  );
}

function RequestDispatchCard({ req, owners, users, listings, allBookings, onDispatch, onOwnerAction, onPropose, onManual, onConfirm, onCancel, onDecline, user }) {
  const contactedIds = new Set(Object.keys(req.ownerStatuses));
  const uncontacted = owners.filter((o) => !contactedIds.has(String(o.id)));
  const suggestedUncontacted = uncontacted.filter((o) => o.types.includes(req.type) && (o.regions || []).includes(req.region));
  const otherUncontacted = uncontacted.filter((o) => !suggestedUncontacted.includes(o));

  const [selected, setSelected] = useState(() => new Set(suggestedUncontacted.map((o) => String(o.id))));
  const [showHistory, setShowHistory] = useState(false);

  const toggle = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const send = () => {
    const chosen = owners.filter((o) => selected.has(String(o.id)));
    if (chosen.length === 0) return;
    onDispatch(req.id, chosen.map((o) => o.id), chosen.map((o) => o.name));
    setSelected(new Set());
  };

  const takeForMyself = () => {
    const selfName = user?.org || user?.name || "Моя компанія";
    onOwnerAction(req.id, "self", selfName, "accepted");
  };

  const contactedOwners = owners.filter((o) => contactedIds.has(String(o.id)));
  const needsAttention = req.status === "new" && req.log.length > 0; // everyone contacted so far refused

  return (
    <Plate style={{ padding: "20px 18px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <div>
          <div style={{ marginBottom: 6 }}>
            <RoleTag kind="rent" />
          </div>
          <Label>
            Заявка #{req.id} ·{" "}
            {req.status === "taken"
              ? "закрито"
              : req.status === "booked"
              ? "клієнт підтвердив — потрібне ваше рішення"
              : req.status === "offered"
              ? "запропоновано клієнту"
              : req.status === "dispatched"
              ? "у роботі"
              : needsAttention
              ? "потрібна увага"
              : "нова"}
          </Label>
          <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif", fontSize: 18, fontWeight: 600, marginTop: 2 }}>
            {req.type} — {req.region}
          </div>
          <div style={{ fontSize: 12.5, color: "#A3A8AD", marginTop: 4, fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif" }}>
            Бюджет: {req.budget || "—"} ₴ · Період: {req.dateFrom ? (req.dateTo ? `${deals.fmtDate(req.dateFrom)} — ${deals.fmtDate(req.dateTo)}` : deals.fmtDate(req.dateFrom)) : "не вказано"}{req.withOperator ? " · з оператором" : ""} · Контакт: {req.contact}{req.hasAccount ? "" : " (без акаунта)"}
          </div>
          {req.comment && (
            <div style={{ fontSize: 12.5, color: "#F4F4F1", marginTop: 6, maxWidth: 480 }}>{req.comment}</div>
          )}
        </div>
        {req.status === "taken" && (
          <span style={{ ...badgeStyle, background: "rgba(111,174,111,0.15)", color: "#6fae6f", border: "1px solid #6fae6f" }}>
            ✓ Взято
          </span>
        )}
      </div>

      {req.status === "booked" && (
        <div style={{ marginTop: 12, padding: "8px 12px", background: "rgba(255,181,46,0.1)", border: "1px solid #FFB52E", fontSize: 12, color: "#FFB52E", fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif" }}>
          Клієнт підтвердив техніку. Підтвердьте оренду в блоці «Угода» нижче — після цього клієнт і власник отримають контакти.
        </div>
      )}

      {needsAttention && (
        <div style={{ marginTop: 12, padding: "8px 12px", background: "rgba(201,107,90,0.1)", border: "1px solid #c96b5a", fontSize: 12, color: "#e0a89c", fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif" }}>
          Усі, кому надсилали, відмовились. Оберіть інших власників нижче.
        </div>
      )}

      {/* Contacted owners with live status + action buttons for pending ones */}
      {contactedOwners.length > 0 && (
        <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px dashed #63696D" }}>
          <Label>Кому надіслано</Label>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
            {contactedOwners.map((o) => {
              const st = req.ownerStatuses[String(o.id)];
              return (
                <div key={o.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12.5, fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif" }}>
                  <span>{o.name} <span style={{ color: "#70777D" }}>· {o.phone}</span></span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ color: STATUS_COLOR[st] }}>{STATUS_LABEL[st]}</span>
                    {st === "sent" && (
                      <>
                        <button onClick={() => onOwnerAction(req.id, o.id, o.name, "accepted")} style={miniBtn("#6fae6f")}>
                          Взяв (за телефоном)
                        </button>
                        <button onClick={() => onOwnerAction(req.id, o.id, o.name, "rejected")} style={miniBtn("#c96b5a")}>
                          Відмова (за телефоном)
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <DealsSection req={req} listings={listings} users={users} allBookings={allBookings} onPropose={onPropose} onManual={onManual} onConfirm={onConfirm} onCancel={onCancel} onDecline={onDecline} />

      {/* Запит власникам: запасний шлях, коли в каталозі немає підходящої техніки */}
      {!["taken", "booked"].includes(req.status) && (
        <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px dashed #63696D" }}>
          <Label>{contactedOwners.length === 0 ? "Запитати у власників (якщо немає підходящої техніки)" : "Запитати у власників ще"}</Label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
            {suggestedUncontacted.length === 0 && otherUncontacted.length === 0 && (
              <span style={{ fontSize: 12.5, color: "#A3A8AD" }}>Усіх власників уже задіяно.</span>
            )}
            {suggestedUncontacted.map((o) => (
              <OwnerChip key={o.id} owner={o} checked={selected.has(String(o.id))} onToggle={() => toggle(String(o.id))} highlighted />
            ))}
            {otherUncontacted.map((o) => (
              <OwnerChip key={o.id} owner={o} checked={selected.has(String(o.id))} onToggle={() => toggle(String(o.id))} />
            ))}
          </div>
          {(suggestedUncontacted.length > 0 || otherUncontacted.length > 0) && (
            <button className="btn-premium-hover" onClick={send} style={{ ...primaryBtn, marginTop: 14 }}>
              Надіслати обраним ({selected.size})
            </button>
          )}
          <div style={{ marginTop: 10 }}>
            <button onClick={takeForMyself} style={smallBtn}>
              Взяти собі
            </button>
          </div>
        </div>
      )}

      {/* History log */}
      {(req.log.length > 0 || (req.events || []).length > 0) && (
        <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px dashed #63696D" }}>
          <button
            onClick={() => setShowHistory((s) => !s)}
            style={{ background: "none", border: "none", color: "#A3A8AD", cursor: "pointer", fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif", fontSize: 11, letterSpacing: "0.08em", textTransform: "none", padding: 0 }}
          >
            {showHistory ? "▲ Сховати історію" : `▼ Історія (${req.log.length + (req.events || []).length})`}
          </button>
          {showHistory && (req.events || []).length > 0 && (
            <div style={{ marginTop: 8 }}>
              <EventLog events={req.events} />
            </div>
          )}
          {showHistory && (
            <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 4 }}>
              {req.log.map((l, i) => (
                <div key={i} style={{ fontSize: 11.5, fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif", color: "#A3A8AD", display: "flex", gap: 8 }}>
                  <span style={{ color: "#70777D" }}>{l.time}</span>
                  <span>
                    {l.ownerName} —{" "}
                    <span style={{ color: STATUS_COLOR[l.action === "sent" ? "sent" : l.action === "auto-expired" ? "expired" : l.action] }}>
                      {l.action === "sent"
                        ? "заявку надіслано"
                        : l.action === "accepted"
                        ? "взяв заявку"
                        : l.action === "rejected"
                        ? "відмовився"
                        : "автоматично знято (заявку взяв інший)"}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Plate>
  );
}

function OwnerChip({ owner, checked, onToggle, highlighted }) {
  return (
    <label
      onClick={onToggle}
      title={owner.phone}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 7,
        padding: "7px 12px",
        border: `1px solid ${checked ? "#FF6A1A" : "#63696D"}`,
        background: checked ? "rgba(255,90,31,0.1)" : "transparent",
        cursor: "pointer",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif",
        fontSize: 12,
      }}
    >
      <input type="checkbox" checked={checked} onChange={onToggle} style={{ accentColor: "#FF6A1A" }} />
      <span>{owner.name}</span>
      {owner.verified && <span style={{ color: "#6fae6f", fontSize: 10, textShadow: "0 0 6px rgba(111,174,111,0.6)" }}>✓</span>}
      {highlighted && <span style={{ color: "#A3A8AD", fontSize: 10 }}>({(owner.regions || []).join(", ")})</span>}
    </label>
  );
}

// ---- Вхід і реєстрація (Supabase Auth) ----
const translateAuthError = (msg = "") => {
  const m = msg.toLowerCase();
  if (m.includes("invalid login")) return "Невірний email або пароль";
  if (m.includes("already registered") || m.includes("already been registered")) return "Цей email уже зареєстровано — перейдіть на вкладку «Вхід»";
  if (m.includes("not confirmed")) return "Email ще не підтверджено — відкрийте лист із посиланням";
  if (m.includes("rate limit") || m.includes("too many")) return "Забагато спроб. Спробуйте за кілька хвилин";
  if (m.includes("password") && m.includes("least")) return "Пароль закороткий — мінімум 8 символів";
  if (m.includes("valid email") || m.includes("invalid email")) return "Схоже, email невірний";
  return "Не вдалося виконати: " + msg;
};

function AuthForm({ onSubmit }) {
  const [mode, setMode] = useState("signup"); // signup | login
  const [form, setForm] = useState({ name: "", org: "", phone: "", email: "", password: "", role: "client" });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const font = "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif";

  const validate = () => {
    const e = {};
    if (mode === "signup") {
      if (!form.name.trim()) e.name = "Вкажіть ім'я";
      if (!form.phone.trim()) e.phone = "Вкажіть телефон";
      else if (!/^\+?[0-9\s()-]{9,}$/.test(form.phone.trim())) e.phone = "Схоже, номер невірний";
    }
    if (!form.email.trim()) e.email = "Вкажіть email";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = "Схоже, email невірний";
    if (!form.password) e.password = "Вкажіть пароль";
    else if (mode === "signup" && form.password.length < 8) e.password = "Пароль — не менше 8 символів";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    setServerError("");
    setInfo("");
    if (!validate()) return;
    setLoading(true);
    const result = await onSubmit({ mode, ...form, email: form.email.trim() });
    setLoading(false);
    if (result?.error) setServerError(result.error);
    else if (result?.info) setInfo(result.info);
  };

  const segBtn = (active) => ({
    flex: 1,
    padding: "9px 10px",
    border: `1px solid ${active ? "#FF6A1A" : "#63696D"}`,
    background: active ? "rgba(255,90,31,0.1)" : "transparent",
    color: "#ffffff",
    fontFamily: font,
    fontSize: 12,
    cursor: "pointer",
  });

  return (
    <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <button type="button" onClick={() => { setMode("signup"); setErrors({}); setServerError(""); setInfo(""); }} style={segBtn(mode === "signup")}>
          Реєстрація
        </button>
        <button type="button" onClick={() => { setMode("login"); setErrors({}); setServerError(""); setInfo(""); }} style={segBtn(mode === "login")}>
          Вхід
        </button>
      </div>
      <div style={{ fontFamily: font, fontSize: 12, color: "#A3A8AD" }}>Орендувати й здавати техніку можуть лише зареєстровані користувачі.</div>

      {mode === "signup" && (
        <>
          <Field label="Я реєструюсь як">
            <div style={{ display: "flex", gap: 8 }}>
              {[
                { key: "client", label: "Клієнт" },
                { key: "owner", label: "Власник техніки" },
              ].map((r) => (
                <button type="button" key={r.key} onClick={() => setForm((f) => ({ ...f, role: r.key }))} style={segBtn(form.role === r.key)}>
                  {r.label}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Ім'я та прізвище">
            <input value={form.name} onChange={set("name")} placeholder="Володимир Іваненко" autoComplete="name" style={inputStyle} />
            {errors.name && <ErrorText>{errors.name}</ErrorText>}
          </Field>

          <Field label="Назва організації (якщо є)">
            <input value={form.org} onChange={set("org")} placeholder="РЕМСЕРВІС-Н" autoComplete="organization" style={inputStyle} />
          </Field>

          <Field label="Телефон">
            <input value={form.phone} onChange={set("phone")} placeholder="+380 XX XXX XX XX" autoComplete="tel" style={inputStyle} />
            {errors.phone && <ErrorText>{errors.phone}</ErrorText>}
          </Field>
        </>
      )}

      <Field label="Email">
        <input type="email" value={form.email} onChange={set("email")} placeholder="name@company.com" autoComplete="email" style={inputStyle} />
        {errors.email && <ErrorText>{errors.email}</ErrorText>}
      </Field>

      <Field label="Пароль">
        <div style={{ position: "relative" }}>
          <input
            type={showPw ? "text" : "password"}
            value={form.password}
            onChange={set("password")}
            placeholder={mode === "signup" ? "Мінімум 8 символів" : "Ваш пароль"}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            style={{ ...inputStyle, width: "100%", boxSizing: "border-box", paddingRight: 46 }}
          />
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            aria-label={showPw ? "Сховати пароль" : "Показати пароль"}
            aria-pressed={showPw}
            title={showPw ? "Сховати пароль" : "Показати пароль"}
            style={{ position: "absolute", right: 2, top: "50%", transform: "translateY(-50%)", width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", color: showPw ? "#FF6A1A" : "#A3A8AD", cursor: "pointer" }}
          >
            {showPw ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a19.77 19.77 0 0 1 5.06-5.94M9.9 4.24A10.9 10.9 0 0 1 12 5c7 0 11 7 11 7a19.86 19.86 0 0 1-3.17 4.19" />
                <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                <path d="M1 1l22 22" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>
        {errors.password && <ErrorText>{errors.password}</ErrorText>}
      </Field>

      {serverError && <ErrorText>{serverError}</ErrorText>}
      {info && <span style={{ color: "#5FA876", fontSize: 12, fontFamily: font }}>{info}</span>}

      <button
        className="btn-premium-hover"
        type="submit"
        disabled={loading}
        style={{ ...primaryBtn, marginTop: 8, width: "100%", opacity: loading ? 0.6 : 1, cursor: loading ? "default" : "pointer" }}
      >
        {loading ? "Зачекайте..." : mode === "signup" ? "Зареєструватись" : "Увійти"}
      </button>
    </form>
  );
}

// ---- Personal cabinet (profile) ----
function ProfileForm({ user, onSave, onLogout }) {
  const [form, setForm] = useState(user);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18, paddingBottom: 16, borderBottom: "1px dashed #63696D" }}>
        <span style={{ width: 44, height: 44, borderRadius: "50%", background: "#FF6A1A", color: "#08090A", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 18, fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif" }}>
          {form.name.trim().charAt(0).toUpperCase()}
        </span>
        <div>
          <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif", fontSize: 17, fontWeight: 600 }}>{form.name}</div>
          <Label>{form.role === "owner" ? "Власник техніки" : form.role === "dispatcher" ? "Диспетчер" : "Клієнт"}{form.org ? ` · ${form.org}` : ""}</Label>
        </div>
      </div>

      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Field label="Ім'я та прізвище">
          <input value={form.name} onChange={set("name")} style={inputStyle} />
        </Field>
        <Field label="Назва організації">
          <input value={form.org} onChange={set("org")} style={inputStyle} />
        </Field>
        <Field label="Телефон">
          <input value={form.phone} onChange={set("phone")} style={inputStyle} />
        </Field>
        <Field label="Email">
          <input type="email" value={form.email} readOnly title="Email — це ваш логін, змінити його тут не можна" style={{ ...inputStyle, opacity: 0.6 }} />
        </Field>

        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <button className="btn-premium-hover" type="submit" style={{ ...primaryBtn, flex: 1 }}>
            Зберегти
          </button>
          <button type="button" onClick={onLogout} style={{ ...smallBtn, borderColor: "#c96b5a", color: "#c96b5a" }}>
            Вийти
          </button>
        </div>
      </form>
    </div>
  );
}

// ---- ІІ-помічник: серверний ШІ (/api/chat) або локальна база знань, коли ключа немає ----
let aiServerDown = false; // після першої відмови (немає ключа) не ходимо на сервер до кінця сесії

async function callAssistantApi(messages) {
  if (aiServerDown) throw new Error("ai server unavailable");

  // Anthropic вимагає, щоб перше повідомлення було від user (без привітання асистента)
  const apiMessages = messages.map((m) => ({ role: m.role, content: m.text }));
  while (apiMessages.length && apiMessages[0].role !== "user") apiMessages.shift();

  let r;
  try {
    r = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: apiMessages }),
    });
  } catch (e) {
    aiServerDown = true;
    throw e;
  }
  if (!r.ok) {
    if (r.status === 500 || r.status === 404) aiServerDown = true; // немає ключа чи функції — не повторюємо
    throw new Error("chat api " + r.status);
  }
  const data = await r.json();
  const raw = (data.content || []).map((b) => b.text || "").join("");
  const clean = raw.replace(/```json|```/g, "").trim();
  const start = clean.indexOf("{");
  const end = clean.lastIndexOf("}");
  return JSON.parse(start >= 0 && end > start ? clean.slice(start, end + 1) : clean);
}

const REGION_ALIASES = {
  "Київ": ["київ", "києв", "киев"],
  "Харків": ["харків", "харьков"],
  "Дніпро": ["дніпро", "днепр"],
  "Одеса": ["одес"],
  "Львів": ["львів", "львов"],
  "Запоріжжя": ["запоріжж", "запорож"],
  "Вінниця": ["вінниц", "винниц"],
  "Житомир": ["житомир"],
  "Івано-Франківськ": ["івано-франків", "ивано-франков"],
  "Кропивницький": ["кропивниц"],
  "Луцьк": ["луцьк", "луцк"],
  "Миколаїв": ["миколаїв", "миколає", "николаев"],
  "Полтава": ["полтав"],
  "Рівне": ["рівне", "ровно"],
  "Суми": ["суми", "сумы"],
  "Тернопіль": ["тернопіл"],
  "Ужгород": ["ужгород"],
  "Хмельницький": ["хмельниц"],
  "Черкаси": ["черкас"],
  "Чернігів": ["чернігів", "чернигов"],
  "Чернівці": ["чернівц", "черновц"],
  "Мукачево": ["мукачев"],
};

function detectRegion(q) {
  for (const [name, aliases] of Object.entries(REGION_ALIASES)) {
    if (aliases.some((a) => q.includes(a))) return name;
  }
  return null;
}

function detectBudget(q) {
  const m = q.match(/(\d[\d\s]{2,})\s*(грн|₴|гривень|гривні|uah)/);
  return m ? Number(m[1].replace(/\s/g, "")) : null;
}

// Локальний режим: працює без ШІ-сервера — відповідає з бази знань (shared/workKnowledge.js)
function localAssistantReply(text, ctx) {
  const q = text.toLowerCase();
  const kb = answerFromKnowledge(text, ctx) || FALLBACK_ANSWER;
  return { ...kb, region: detectRegion(q), budget: detectBudget(q), comment: text.slice(0, 140) };
}

// Розділи відповіді (від ШІ чи з бази): залишаємо лише коректні
const normSections = (x) =>
  Array.isArray(x)
    ? x
        .filter((s) => s && typeof s.title === "string" && Array.isArray(s.items) && s.items.length)
        .slice(0, 8)
        .map((s) => ({ title: s.title, items: s.items.slice(0, 8).map(String), ordered: !!s.ordered }))
    : [];

// "Екскаватор — обов'язково: ..." -> виділяємо початок жирним
function SectionItem({ item }) {
  const i = item.indexOf(" — ");
  if (i > 0 && i <= 40) {
    return (
      <>
        <b>{item.slice(0, i)}</b>
        {item.slice(i)}
      </>
    );
  }
  return <>{item}</>;
}

// ---- AI assistant: free-text task -> equipment/region/budget suggestion -> prefilled request form ----
function AiAssistant({ user, onPrefillRequest, onViewListing, listings, t, open, setOpen }) {
  const [messages, setMessages] = useState([
    { role: "assistant", text: t("ai_greeting") },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [ctx, setCtx] = useState({ types: [], jobTitle: "", text: "", region: null });
  const [showAllJobs, setShowAllJobs] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceOn, setVoiceOn] = useState(false);
  const listRef = useRef(null);
  const recognitionRef = useRef(null);
  const speechSupported = typeof window !== "undefined" && !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading, open]);

  // Set up speech recognition once (mic -> fills the input field, doesn't auto-send)
  useEffect(() => {
    if (!speechSupported) return;
    const SpeechRecognitionApi = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognitionApi();
    recognition.lang = "uk-UA";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (e) => setInput(e.results[0][0].transcript);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;

    return () => {
      recognition.onresult = null;
      recognition.onend = null;
      recognition.onerror = null;
    };
  }, [speechSupported]);

  // Stop any speech when the panel closes or the widget unmounts
  useEffect(() => {
    if (!open && typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, [open]);
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel();
      recognitionRef.current?.stop();
    };
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
    } else {
      window.speechSynthesis?.cancel();
      recognitionRef.current.start();
      setListening(true);
    }
  };

  const speak = (text) => {
    if (!voiceOn || typeof window === "undefined" || !window.speechSynthesis || !text) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "uk-UA";
    window.speechSynthesis.speak(utter);
  };

  const addAssistant = (msg) => setMessages((prev) => [...prev, { role: "assistant", ...msg }]);

  const send = async (override) => {
    const text = (typeof override === "string" ? override : input).trim();
    if (!text || loading) return;
    const nextMessages = [...messages, { role: "user", text }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      // --- команди інтерфейсу (без звернення до ШІ) ---
      if (/^(створити|залишити|оформити|создать|оставить)\s+заявк|^create request/i.test(text)) {
        if (ctx.types.length) {
          const bundle = ctx.types.length > 1 ? ` Потрібен комплект техніки: ${ctx.types.join(", ")}.` : "";
          onPrefillRequest({
            type: ctx.types[0],
            region: ctx.region,
            budget: null,
            comment: ((ctx.jobTitle ? ctx.jobTitle + ". " : "") + ctx.text).slice(0, 300) + bundle,
          });
          addAssistant({ text: "Відкриваю форму заявки — перевірте дані й додайте контакт. Диспетчер підбере власників техніки.", showFollowUp: false });
        } else {
          onPrefillRequest(null);
          addAssistant({ text: "Відкриваю форму заявки. Опишіть у ній задачу — диспетчер підбере техніку.", showFollowUp: false });
        }
        return;
      }
      if (/показати ще|show more|ещё вариант/i.test(text) && ctx.types.length) {
        const more = (listings || []).filter((l) => l.available && ctx.types.includes(l.type)).slice(0, 8);
        addAssistant({
          text: more.length
            ? "Уся доступна техніка з каталогу для цієї роботи:"
            : "Зараз у каталозі немає вільної техніки цього типу — залиште заявку, і диспетчер підбере власників.",
          matchedListings: more,
          showFollowUp: true,
        });
        return;
      }
      if (/^(інша задача|друга задача|другая задача|new task|опишу свою задачу)/i.test(text)) {
        setCtx({ types: [], jobTitle: "", text: "", region: null });
        addAssistant({ text: "Добре, опишіть задачу своїми словами або оберіть вид робіт.", options: JOB_PILLS.slice(0, 8), showFollowUp: false });
        return;
      }

      // --- відповідь: ШІ-сервер, а якщо його немає — локальна база знань ---
      let parsed;
      try {
        parsed = await callAssistantApi(nextMessages);
      } catch (apiErr) {
        parsed = localAssistantReply(text, ctx);
      }
      const replyText = parsed.reply || "Готово.";

      const typesFromReply = Array.isArray(parsed.types) ? parsed.types.filter((x) => TYPES.includes(x)) : [];
      const mainType = TYPES.includes(parsed.type) ? parsed.type : typesFromReply[0] || null;
      const allTypes = typesFromReply.length ? typesFromReply : mainType ? [mainType] : [];
      // Контекст задачі оновлюємо лише відповіддю про конкретну роботу. Відповіді про ціну чи
      // порівняння техніки не затирають уже підібраний комплект.
      const isJobAnswer = !!parsed.jobId || typesFromReply.length > 0;
      if (isJobAnswer) setCtx({ types: allTypes, jobTitle: parsed.jobTitle || "", text, region: parsed.region || null });
      else if (allTypes.length && !ctx.types.length) setCtx({ types: allTypes, jobTitle: "", text, region: parsed.region || null });

      // Ground the recommendation in real inventory: show listings that fit,
      // same-region matches first.
      const findMatches = (ty) => {
        if (!ty || !listings) return [];
        return listings
          .filter((l) => l.available && l.type === ty)
          .sort((a, b) => {
            const aReg = parsed.region && a.region === parsed.region ? 0 : 1;
            const bReg = parsed.region && b.region === parsed.region ? 0 : 1;
            return aReg - bReg;
          })
          .slice(0, 4);
      };
      const matchedListings =
        allTypes.length > 1 ? allTypes.map((ty) => findMatches(ty)[0]).filter(Boolean) : findMatches(allTypes[0]);

      const bundleNote = allTypes.length > 1 ? ` Потрібен комплект техніки: ${allTypes.join(", ")}.` : "";
      const suggestion = mainType && (isJobAnswer || !ctx.types.length)
        ? {
            type: mainType,
            types: allTypes,
            region: parsed.region,
            budget: parsed.budget,
            comment: ((parsed.jobTitle ? parsed.jobTitle + ". " : "") + (parsed.comment || text)).slice(0, 300) + bundleNote,
          }
        : null;

      addAssistant({
        text: replyText,
        sections: normSections(parsed.sections),
        options: Array.isArray(parsed.options) ? parsed.options.filter((o) => typeof o === "string").slice(0, 5) : null,
        suggestion,
        matchedListings,
        showFollowUp: true,
      });
      speak(replyText);
    } catch (err) {
      const errText = "Вибачте, не вдалося обробити запит. Спробуйте ще раз або скористайтесь звичайною формою заявки.";
      addAssistant({ text: errText });
      speak(errText);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button className="ai-fab" onClick={() => setOpen((o) => !o)} aria-label="AI-помічник">
        {open ? (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M4 4l12 12M16 4L4 16" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M3 5h14M3 10h14M3 15h9" />
          </svg>
        )}
      </button>

      {open && (
        <div className="ai-panel">
          <div className="ai-panel-header">
            <span style={{ letterSpacing: "0.04em" }}>ТЕХМАЙДАНЧИК AI</span>
            <button
              className={`ai-voice-toggle${voiceOn ? " on" : ""}`}
              onClick={() => {
                if (voiceOn) window.speechSynthesis?.cancel();
                setVoiceOn((v) => !v);
              }}
              aria-label={voiceOn ? "Вимкнути озвучення" : "Увімкнути озвучення"}
              title={voiceOn ? "Озвучення увімкнено" : "Озвучення вимкнено"}
            >
              {voiceOn ? "🔊" : "🔇"}
            </button>
          </div>

          <div className="ai-panel-body" ref={listRef}>
            {messages.map((m, i) => (
              <div key={i} className={`ai-bubble ${m.role}`}>
                {m.text}
                {m.sections && m.sections.length > 0 && (
                  <div className="ai-blocks">
                    {m.sections.map((sec, si) => (
                      <details key={si} open={si === 0} className="ai-block">
                        <summary>{sec.title}</summary>
                        {sec.ordered ? (
                          <ol>
                            {sec.items.map((it, ii) => (
                              <li key={ii}>
                                <SectionItem item={it} />
                              </li>
                            ))}
                          </ol>
                        ) : (
                          <ul>
                            {sec.items.map((it, ii) => (
                              <li key={ii}>
                                <SectionItem item={it} />
                              </li>
                            ))}
                          </ul>
                        )}
                      </details>
                    ))}
                  </div>
                )}
                {m.matchedListing && (
                  <div
                    onClick={() => onViewListing && onViewListing(m.matchedListing)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      marginTop: 8,
                      padding: 10,
                      background: "#191C1F",
                      borderRadius: 12,
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ color: "#FF6A1A", flexShrink: 0 }}>
                      <EquipmentIcon type={m.matchedListing.type} size={30} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#F4F4F1" }}>{m.matchedListing.brand}</div>
                      <div style={{ fontSize: 11, color: "#A3A8AD" }}>
                        {m.matchedListing.region} · {m.matchedListing.price} ₴/{m.matchedListing.unit}
                      </div>
                    </div>
                  </div>
                )}
                {m.matchedListings && m.matchedListings.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
                    {m.matchedListings.map((l) => (
                      <div
                        key={l.id}
                        onClick={() => onViewListing && onViewListing(l)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: 8,
                          background: "#191C1F",
                          borderRadius: 10,
                          cursor: "pointer",
                        }}
                      >
                        <div style={{ color: "#FF6A1A", flexShrink: 0 }}>
                          <EquipmentIcon type={l.type} size={24} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: "#F4F4F1" }}>{l.type} · {l.brand}</div>
                          <div style={{ fontSize: 10.5, color: "#A3A8AD" }}>
                            {l.region} · {l.price} ₴/{l.unit}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {m.suggestion && (
                  <button
                    className="ai-suggestion-btn"
                    onClick={() =>
                      onPrefillRequest({
                        type: m.suggestion.type,
                        region: m.suggestion.region,
                        budget: m.suggestion.budget,
                        comment: m.suggestion.comment,
                      })
                    }
                  >
                    Заповнити заявку: {(m.suggestion.types && m.suggestion.types.length ? m.suggestion.types : [m.suggestion.type]).join(" + ")}
                    {m.suggestion.region ? `, ${m.suggestion.region}` : ""}
                  </button>
                )}
              </div>
            ))}
            {loading && <div className="ai-bubble assistant">Друкує…</div>}
            {!loading && (messages.length === 1 || messages[messages.length - 1]?.role === "assistant") && (() => {
              const last = messages[messages.length - 1];
              const isFirst = messages.length === 1;
              const followUps = ctx.types.length
                ? ["Показати ще варіанти", "Скільки це коштує?", "Створити заявку", "Інша задача"]
                : ["Скільки це коштує?", "Створити заявку", "Інша задача"];
              const pills = isFirst
                ? [...(showAllJobs ? JOB_PILLS : JOB_PILLS.slice(0, 8)), ...HELPER_PILLS]
                : last.options && last.options.length
                ? last.options
                : followUps;
              const chip = {
                fontSize: 11.5,
                padding: "6px 11px",
                borderRadius: 980,
                border: "1px solid #63696D",
                background: "transparent",
                color: "#A3A8AD",
                cursor: "pointer",
                fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif",
              };
              return (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                  {pills.map((p) => (
                    <button key={p} onClick={() => send(p)} style={p === "Створити заявку" ? { ...chip, borderColor: "#FF6A1A", color: "#FF6A1A" } : chip}>
                      {p}
                    </button>
                  ))}
                  {isFirst && !showAllJobs && (
                    <button onClick={() => setShowAllJobs(true)} style={{ ...chip, borderStyle: "dashed" }}>
                      Ще види робіт ▾
                    </button>
                  )}
                </div>
              );
            })()}
          </div>

          <div className="ai-panel-input">
            {speechSupported && (
              <button
                onClick={toggleListening}
                className={`ai-mic-btn${listening ? " active" : ""}`}
                aria-label={listening ? "Зупинити запис" : "Голосове введення"}
                title={listening ? "Слухаю..." : "Голосове введення"}
              >
                🎤
              </button>
            )}
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder={listening ? "..." : t("ai_placeholder")}
            />
            <button onClick={send} disabled={loading} aria-label="Надіслати">
              →
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// ---- Modal wrapper ----
// Стиснення фото в браузері: довга сторона до 1000 px, JPEG — щоб не вантажити мегабайти
function resizeImageToDataUrl(file, maxSide = 1000, quality = 0.78) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Не вдалося прочитати зображення"));
    };
    img.src = url;
  });
}

// Автозбереження чернетки форми у браузері: переживає закриття вікна, оновлення
// сторінки і вихід з акаунта. Після успішної відправки чернетка стирається.
function useDraft(key, initial, { skipRestore = false } = {}) {
  const initialRef = useRef(initial);
  const initialJson = useRef(JSON.stringify(initial)).current;
  const clearedRef = useRef(false);

  const savedRef = useRef(undefined);
  if (savedRef.current === undefined) {
    let saved = null;
    if (!skipRestore) {
      try {
        const raw = window.localStorage.getItem(key);
        if (raw) saved = JSON.parse(raw);
      } catch (e) {}
    }
    savedRef.current = saved;
  }

  const [value, setValueRaw] = useState(() => (savedRef.current ? { ...initial, ...savedRef.current } : initial));
  const [restored, setRestored] = useState(!!savedRef.current);

  const latest = useRef(value);
  latest.current = value;

  const persist = (v) => {
    if (clearedRef.current) return;
    try {
      if (JSON.stringify(v) === initialJson) {
        window.localStorage.removeItem(key); // нічого не змінено — чернетка не потрібна
        return;
      }
      try {
        window.localStorage.setItem(key, JSON.stringify(v));
      } catch (e) {
        const { photos, ...rest } = v; // не вмістилось (великі фото) — зберігаємо без фото
        window.localStorage.setItem(key, JSON.stringify(rest));
      }
    } catch (e) {}
  };
  const persistRef = useRef(persist);
  persistRef.current = persist;

  // збереження через 0.4 с після останньої зміни
  useEffect(() => {
    const id = setTimeout(() => persistRef.current(latest.current), 400);
    return () => clearTimeout(id);
  }, [value]);

  // і одразу при закритті вкладки або розмонтуванні форми
  useEffect(() => {
    const flush = () => persistRef.current(latest.current);
    window.addEventListener("pagehide", flush);
    return () => {
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, []);

  const setValue = (v) => {
    clearedRef.current = false;
    setValueRaw(v);
  };
  const clear = () => {
    clearedRef.current = true;
    try {
      window.localStorage.removeItem(key);
    } catch (e) {}
  };
  const reset = () => {
    clear();
    setRestored(false);
    setValueRaw(initialRef.current);
  };

  return [value, setValue, { clear, reset, restored }];
}

function DraftBanner({ draft }) {
  if (!draft.restored) return null;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
        fontSize: 12,
        color: "#FFB52E",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif",
      }}
    >
      <span>Відновлено вашу незавершену чернетку</span>
      <button
        type="button"
        onClick={draft.reset}
        style={{ background: "none", border: "none", color: "#A3A8AD", textDecoration: "underline", cursor: "pointer", fontSize: 12, padding: 0 }}
      >
        Почати заново
      </button>
    </div>
  );
}

// Рядок з бази -> об'єкт оголошення, який розуміє сайт
const mapListingRow = (r) => ({
  id: r.id,
  ownerId: r.owner_id,
  type: r.type,
  brand: r.brand,
  region: r.region,
  price: Number(r.price),
  unit: r.unit,
  specs: r.specs || {},
  owner: r.owner_name || "Власник",
  photos: r.photos || [],
  available: r.available,
  busyUntil: r.busy_until || null,
});

// ---- Add listing form (owner side) ----
function AddListingForm({ onSubmit, user, lang }) {
  const [form, setForm, draft] = useDraft(`techmaydanchik_draft_listing_${user?.id || "guest"}`, {
    type: TYPES[0],
    brand: "",
    region: user?.region || REGIONS[0],
    price: "",
    unit: "год",
    spec1Key: "Вага",
    spec1Val: "",
    spec2Key: "Об'єм / вантажопідйомність",
    spec2Val: "",
    photos: [],
    owner: user ? user.org || user.name : "",
    busyUntil: "",
  });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const [submitting, setSubmitting] = useState(false);

  const handlePhoto = async (e) => {
    const input = e.target;
    const files = Array.from(input.files || []).slice(0, 3 - form.photos.length);
    for (const file of files) {
      try {
        const dataUrl = await resizeImageToDataUrl(file);
        setForm((f) => ({ ...f, photos: [...f.photos, dataUrl].slice(0, 3) }));
      } catch (err) {
        console.error("Photo resize failed:", err.message);
      }
    }
    input.value = "";
  };
  const removePhoto = (i) => setForm((f) => ({ ...f, photos: f.photos.filter((_, idx) => idx !== i) }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.brand || !form.price || !form.owner || submitting) return;
    setSubmitting(true);
    try {
      const ok = await onSubmit({
      type: form.type,
      brand: form.brand,
      region: form.region === "Інше" ? (form.customRegion || "Інше") : form.region,
      price: Number(form.price),
      unit: form.unit,
      photos: form.photos,
      owner: form.owner,
      busyUntil: form.busyUntil || null,
      available: !form.busyUntil,
      specs: {
        [form.spec1Key]: form.spec1Val || "—",
        [form.spec2Key]: form.spec2Val || "—",
      },
      });
      if (ok) draft.clear();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <DraftBanner draft={draft} />
      {user ? (
        <div style={{ fontSize: 12, color: "#6fae6f", fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif" }}>
          ✓ Дані підтягнуто з кабінету — {user.org || user.name}
        </div>
      ) : (
        <div style={{ fontSize: 12, color: "#A3A8AD", fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif" }}>
          Ви не увійшли — вкажіть назву організації вручну, або спочатку зареєструйтесь.
        </div>
      )}
      <Field label={`Фото техніки — до 3 шт. (необов'язково)`}>
        <input type="file" accept="image/*" multiple onChange={handlePhoto} disabled={form.photos.length >= 3} style={inputStyle} />
        {form.photos.length > 0 && (
          <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
            {form.photos.map((p, i) => (
              <div key={i} style={{ position: "relative" }}>
                <img src={p} alt={`Прев'ю ${i + 1}`} style={{ width: 84, height: 84, objectFit: "cover", border: "1px solid #63696D" }} />
                <button
                  type="button"
                  onClick={() => removePhoto(i)}
                  aria-label="Прибрати фото"
                  style={{ position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: "50%", background: "#08090A", border: "1px solid #63696D", color: "#F4F4F1", fontSize: 12, cursor: "pointer" }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        <span style={{ fontSize: 11, color: "#A3A8AD", marginTop: 4, display: "block" }}>
          Без фото буде показана іконка типу техніки
        </span>
      </Field>
      <Field label="Від імені (назва організації / ПІБ)">
        <input value={form.owner} onChange={set("owner")} placeholder="напр. РЕМСЕРВІС-Н" style={inputStyle} />
      </Field>
      <Field label="Тип техніки">
        <select value={form.type} onChange={set("type")} style={inputStyle}>
          {TYPES.map((ty) => <option key={ty} value={ty}>{tType(ty, lang)}</option>)}
        </select>
      </Field>
      <Field label="Марка / модель">
        <input value={form.brand} onChange={set("brand")} placeholder="напр. CAT 320" style={inputStyle} />
      </Field>
      <Field label="Регіон роботи">
        <select value={form.region} onChange={set("region")} style={inputStyle}>
          {REGIONS.map((r) => <option key={r}>{r}</option>)}
        </select>
        {form.region === "Інше" && (
          <input
            value={form.customRegion || ""}
            onChange={set("customRegion")}
            placeholder="Вкажіть місто, селище чи область"
            style={{ ...inputStyle, marginTop: 8 }}
          />
        )}
      </Field>
      <div style={{ display: "flex", gap: 10 }}>
        <Field label="Ціна" style={{ flex: 1 }}>
          <input type="number" value={form.price} onChange={set("price")} placeholder="1450" style={inputStyle} />
        </Field>
        <Field label="Одиниця" style={{ width: 100 }}>
          <select value={form.unit} onChange={set("unit")} style={inputStyle}>
            <option value="год">₴/год</option>
            <option value="добу">₴/добу</option>
            <option value="зміну">₴/зміну</option>
          </select>
        </Field>
      </div>
      <Field label="Зайнято до (необов'язково)">
        <input type="date" value={form.busyUntil} onChange={set("busyUntil")} style={inputStyle} />
        <span style={{ fontSize: 11, color: "#A3A8AD", marginTop: 4, display: "block" }}>
          Залиште порожнім, якщо техніка вільна прямо зараз
        </span>
      </Field>
      <Field label="Параметр 1 (назва)">
        <input value={form.spec1Key} onChange={set("spec1Key")} style={inputStyle} />
      </Field>
      <Field label="Параметр 1 (значення)">
        <input value={form.spec1Val} onChange={set("spec1Val")} placeholder="20.5 т" style={inputStyle} />
      </Field>
      <Field label="Параметр 2 (назва)">
        <input value={form.spec2Key} onChange={set("spec2Key")} style={inputStyle} />
      </Field>
      <Field label="Параметр 2 (значення)">
        <input value={form.spec2Val} onChange={set("spec2Val")} placeholder="1.2 м³" style={inputStyle} />
      </Field>
      <button
        className="btn-premium-hover"
        type="submit"
        disabled={submitting}
        style={{ ...primaryBtn, marginTop: 8, width: "100%", opacity: submitting ? 0.6 : 1, cursor: submitting ? "default" : "pointer" }}
      >
        {submitting ? "Зберігаємо..." : "Додати в каталог"}
      </button>
    </form>
  );
}

// ---- Client request form ----
function RequestForm({ onSubmit, user, initial, t, lang }) {
  const [form, setForm, draft] = useDraft(`techmaydanchik_draft_request_${user?.id || "guest"}`, {
    type: initial?.type || TYPES[0],
    region: initial?.region || user?.region || REGIONS[0],
    dateFrom: "",
    dateTo: "",
    withOperator: false,
    budget: initial?.budget != null ? String(initial.budget) : "",
    budgetUnit: "зміну",
    isPublic: true,
    comment: initial?.comment || "",
    contact: user?.phone || "",
    requesterName: user?.name || "",
  }, { skipRestore: !!initial });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const [contactError, setContactError] = useState(false);
  const [dateError, setDateError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isValidContact = (v) => {
    const digits = v.replace(/\D/g, "");
    return digits.length >= 9 || /^@?[a-zA-Z0-9_]{5,}$/.test(v.trim());
  };

  const submit = (e) => {
    e.preventDefault();
    const badContact = !form.contact || !isValidContact(form.contact);
    const badDates = !!(form.dateFrom && form.dateTo && form.dateTo < form.dateFrom);
    setContactError(badContact);
    setDateError(badDates);
    if (badContact || badDates) return;
    setSubmitting(true);
    Promise.resolve(onSubmit({ ...form, region: form.region === "Інше" ? (form.customRegion || "Інше") : form.region }))
      .then((ok) => {
        if (ok !== false) draft.clear();
      })
      .finally(() => setSubmitting(false));
  };

  return (
    <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <DraftBanner draft={draft} />
      {initial && (
        <div style={{ fontSize: 12, color: "#FF6A1A", fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif" }}>
          ✨ Заповнено помічником — перевірте і додайте контакт
        </div>
      )}
      {user ? (
        <div style={{ fontSize: 12, color: "#6fae6f", fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif" }}>
          ✓ Заявка від: {user.name}{user.org ? ` · ${user.org}` : ""}
        </div>
      ) : (
        <div style={{ fontSize: 12, color: "#A3A8AD", fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif" }}>
          Ви не увійшли — контакт доведеться вказати вручну.
        </div>
      )}

      <StepLabel n={1} of={4} text={t("request_step_1")} />
      <Field label="Опишіть задачу">
        <textarea
          value={form.comment}
          onChange={set("comment")}
          rows={3}
          placeholder="Наприклад: потрібен екскаватор для котловану під фундамент..."
          style={{ ...inputStyle, resize: "vertical" }}
        />
      </Field>

      <StepLabel n={2} of={4} text={t("request_step_2")} />
      <Field label="Яка техніка потрібна">
        <select value={form.type} onChange={set("type")} style={inputStyle}>
          {TYPES.map((ty) => <option key={ty} value={ty}>{tType(ty, lang)}</option>)}
        </select>
      </Field>
      <Field label="Регіон / об'єкт">
        <select value={form.region} onChange={set("region")} style={inputStyle}>
          {REGIONS.map((r) => <option key={r}>{r}</option>)}
        </select>
        {form.region === "Інше" && (
          <input
            value={form.customRegion || ""}
            onChange={set("customRegion")}
            placeholder="Вкажіть місто, селище чи область"
            style={{ ...inputStyle, marginTop: 8 }}
          />
        )}
      </Field>

      <StepLabel n={3} of={4} text={t("request_step_3")} />
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Field label="Потрібно з" style={{ flex: "1 1 140px" }}>
          <input type="date" value={form.dateFrom} onChange={(e) => { setDateError(false); set("dateFrom")(e); }} style={inputStyle} />
        </Field>
        <Field label="По" style={{ flex: "1 1 140px" }}>
          <input type="date" value={form.dateTo} onChange={(e) => { setDateError(false); set("dateTo")(e); }} style={inputStyle} />
        </Field>
      </div>
      {dateError && <ErrorText>Кінець періоду не може бути раніше за початок</ErrorText>}
      <label style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif", fontSize: 13, color: "#A3A8AD", cursor: "pointer" }}>
        <input type="checkbox" checked={!!form.withOperator} onChange={(e) => setForm((f) => ({ ...f, withOperator: e.target.checked }))} style={{ accentColor: "#FF6A1A", width: 18, height: 18 }} />
        Потрібна техніка з оператором
      </label>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Field label="Ціна, яку готові заплатити (₴)" style={{ flex: "1 1 150px" }}>
          <input type="number" min="0" value={form.budget} onChange={set("budget")} placeholder="2000" style={inputStyle} />
        </Field>
        <Field label="Одиниця" style={{ flex: "1 1 150px" }}>
          <select value={form.budgetUnit} onChange={set("budgetUnit")} style={{ ...selectStyle, width: "100%", minHeight: 44 }}>
            {deals.BUDGET_UNITS.map(([v, label]) => (
              <option key={v} value={v}>
                {label}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <label style={{ display: "flex", alignItems: "flex-start", gap: 8, fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif", fontSize: 13, color: "#D9DCDF", cursor: "pointer" }}>
        <input type="checkbox" checked={!!form.isPublic} onChange={(e) => setForm((f) => ({ ...f, isPublic: e.target.checked }))} style={{ accentColor: "#FF6A1A", width: 18, height: 18, marginTop: 2 }} />
        <span>
          Вивісити заявку на «Дошці запитів» — власники зможуть запропонувати свою техніку
          <span style={{ display: "block", fontSize: 11.5, color: "#70777D", marginTop: 2 }}>
            Усі побачать: тип техніки, регіон, дати, ціну, коментар і ваше ім'я (без прізвища). Телефон не показується — не пишіть його в коментарі.
          </span>
        </span>
      </label>

      <StepLabel n={4} of={4} text={t("request_step_4")} />
      <Field label="Контакт для зв'язку (телефон/Telegram)">
        <input
          value={form.contact}
          onChange={(e) => {
            setContactError(false);
            set("contact")(e);
          }}
          placeholder="+380... або @username"
          style={inputStyle}
        />
        {contactError && <ErrorText>Вкажіть номер телефону (мін. 9 цифр) або Telegram @username</ErrorText>}
      </Field>
      <button
        className="btn-premium-hover"
        type="submit"
        disabled={submitting}
        style={{ ...primaryBtn, marginTop: 8, width: "100%", opacity: submitting ? 0.6 : 1, cursor: submitting ? "default" : "pointer" }}
      >
        {submitting ? "Надсилаємо..." : "Надіслати заявку"}
      </button>
    </form>
  );
}

function StepLabel({ n, of, text }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
      <span style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif", fontSize: 11, color: "#70777D" }}>
        {String(n).padStart(2, "0")} / {String(of).padStart(2, "0")}
      </span>
      <span style={{ flex: 1, height: 1, background: "#202428" }} />
      <span style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif", fontSize: 11, color: "#A3A8AD" }}>
        {text}
      </span>
    </div>
  );
}

// ---- shared styles ----
