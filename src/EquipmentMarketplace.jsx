import React, { useState, useMemo, useEffect, useRef } from "react";

// ---- Bot API config ----
// TODO: після розгортання бота на Railway/Render замініть на реальну адресу,
// напр. "https://techmaydanchik-bot.up.railway.app". Той самий ключ має бути
// прописаний як DISPATCH_API_KEY у bot/.env.
const BOT_API_URL = "http://localhost:3001";
const BOT_API_KEY = "change-me";

// ---- i18n ----
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
    step_1: "Розкажіть, що потрібно",
    step_2: "Диспетчер знаходить техніку",
    step_3: "Власники отримують заявку",
    step_4: "Один із них підтверджує",
    step_5: "Ви отримуєте контакт",
    status_available: "ДОСТУПНА",
    status_busy: "ЗАЙНЯТА",
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
    respond_btn: "Відгукнутись",
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
    ai_greeting: "Привіт! Опишіть, яку роботу потрібно виконати — підберу техніку і заповню заявку.",
    faq_items: [
      { q: "Скільки коштує розміщення техніки в каталозі?", a: "Реєстрація та додавання оголошень безкоштовні. Ми не беремо комісію з угод — власник і клієнт домовляються напряму." },
      { q: "Як швидко власники відповідають на заявку?", a: "Диспетчер обирає, кому надіслати заявку, вручну — зазвичай перше підтвердження приходить протягом години в робочий час." },
      { q: "Що якщо жоден власник не відгукнеться?", a: "Диспетчер бачить це одразу і може надіслати заявку іншим власникам або розширити регіон пошуку." },
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
    step_1: "Расскажите, что нужно",
    step_2: "Диспетчер находит технику",
    step_3: "Владельцы получают заявку",
    step_4: "Один из них подтверждает",
    step_5: "Вы получаете контакт",
    status_available: "ДОСТУПНА",
    status_busy: "ЗАНЯТА",
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
    respond_btn: "Откликнуться",
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
    ai_greeting: "Привет! Опишите, какую работу нужно выполнить — подберу технику и заполню заявку.",
    faq_items: [
      { q: "Сколько стоит размещение техники в каталоге?", a: "Регистрация и добавление объявлений бесплатны. Мы не берём комиссию со сделок — владелец и клиент договариваются напрямую." },
      { q: "Как быстро владельцы отвечают на заявку?", a: "Диспетчер выбирает, кому отправить заявку, вручную — обычно первое подтверждение приходит в течение часа в рабочее время." },
      { q: "Что если ни один владелец не откликнется?", a: "Диспетчер видит это сразу и может отправить заявку другим владельцам или расширить регион поиска." },
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
    step_1: "Tell us what you need",
    step_2: "Dispatcher finds equipment",
    step_3: "Owners receive the request",
    step_4: "One of them confirms",
    step_5: "You get the contact",
    status_available: "AVAILABLE",
    status_busy: "BUSY",
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
    respond_btn: "Respond",
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
    ai_greeting: "Hi! Describe what work needs to be done — I'll pick the equipment and fill out the request.",
    faq_items: [
      { q: "How much does listing equipment in the catalog cost?", a: "Registration and adding listings are free. We don't take a commission from deals — the owner and client arrange things directly." },
      { q: "How fast do owners respond to a request?", a: "The dispatcher manually chooses who to send the request to — the first confirmation usually arrives within an hour during business hours." },
      { q: "What if no owner responds?", a: "The dispatcher sees this immediately and can send the request to other owners or widen the search region." },
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
];

const REGIONS = [
  "Ужгород",
  "Мукачево",
  "Львів",
  "Київ",
  "Миколаїв",
  "Одеса",
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
    photo: null,
    available: true,
  },
  {
    id: 2,
    type: "Гідромолот",
    brand: "CAT M320 + Hammer HM950",
    region: "Мукачево",
    price: 980,
    unit: "год",
    specs: { "Енергія удару": "950 Дж", "Вага молота": "950 кг" },
    owner: "БудТехСервіс",
    photo: null,
    available: true,
  },
  {
    id: 3,
    type: "Самоскид",
    brand: "МАЗ 5551",
    region: "Львів",
    price: 750,
    unit: "год",
    specs: { "Вантажопідйомність": "10 т", "Об'єм кузова": "6 м³" },
    owner: "ЛьвівБуд",
    photo: null,
    available: false,
    busyUntil: "2026-09-12",
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
    photo: null,
    available: true,
  },
];

const TAGLINE_ICONS = [IconExcavator, IconLoader, IconDumpTruck, IconHammer, IconCrane, IconBulldozer];

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

const ICONS_BY_TYPE = {
  Екскаватор: IconExcavator,
  Навантажувач: IconLoader,
  Самоскид: IconDumpTruck,
  Гідромолот: IconHammer,
  Кран: IconCrane,
  Бульдозер: IconBulldozer,
};

function SectionDivider({ n, of, title }) {
  return (
    <div className="section-divider">
      <span className="num">{String(n).padStart(2, "0")}</span>
      <span className="line" />
      <span className="title">{title}</span>
      <span className="line" />
    </div>
  );
}

function EquipmentIcon({ type, size = 24, style }) {
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
};

function EquipmentGuide({ listings, onSelectCategory, t }) {
  const [index, setIndex] = useState(0);
  const touchStartX = useRef(null);
  const type = TYPES[index];
  const info = EQUIPMENT_INFO[type];
  const count = listings.filter((l) => l.type === type).length;

  const go = (dir) => setIndex((i) => (i + dir + TYPES.length) % TYPES.length);

  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (touchStartX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (dx > 40) go(-1);
    else if (dx < -40) go(1);
    touchStartX.current = null;
  };

  return (
    <div style={{ position: "relative", maxWidth: 480, margin: "0 auto" }}>
      <button onClick={() => go(-1)} aria-label="Попередній тип" style={carouselArrowStyle("left")}>‹</button>
      <button onClick={() => go(1)} aria-label="Наступний тип" style={carouselArrowStyle("right")}>›</button>

      <div
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        style={{
          background: "#15181A",
          border: "1px solid #63696D",
          borderRadius: 20,
          padding: "28px 24px",
          textAlign: "center",
        }}
      >
        <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif", fontSize: 12, color: "#70777D", marginBottom: 10 }}>
          {String(index + 1).padStart(2, "0")} / {String(TYPES.length).padStart(2, "0")}
        </div>
        <div style={{ color: "#FF6A1A", filter: "drop-shadow(0 3px 5px rgba(0,0,0,0.4))", display: "flex", justifyContent: "center" }}>
          <EquipmentIcon type={type} size={56} />
        </div>
        <h3 style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif", fontSize: 22, margin: "12px 0 4px" }}>
          {type}
        </h3>
        <div style={{ fontSize: 12, color: "#70777D", marginBottom: 14 }}>
          {count} {count === 1 ? t("guide_listing_one") : t("guide_listing_many")}
        </div>

        <p style={{ color: "#A3A8AD", fontSize: 13.5, lineHeight: 1.6, maxWidth: 360, margin: "0 auto 18px" }}>
          {info.definition}
        </p>

        <div style={{ textAlign: "left", marginBottom: 16 }}>
          <Label>{t("guide_parts_label")}</Label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
            {info.parts.map((p) => (
              <span key={p} style={{ fontSize: 12, color: "#F4F4F1", background: "#191C1F", borderRadius: 980, padding: "4px 12px" }}>
                {p}
              </span>
            ))}
          </div>
        </div>

        <div style={{ textAlign: "left", marginBottom: 22 }}>
          <Label>{t("guide_uses_label")}</Label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
            {info.uses.map((u) => (
              <span key={u} style={{ fontSize: 12, color: "#FFB52E", background: "rgba(255,176,32,0.12)", border: "1px solid rgba(255,176,32,0.3)", borderRadius: 980, padding: "4px 12px" }}>
                {u}
              </span>
            ))}
          </div>
        </div>

        <button onClick={() => onSelectCategory(type)} style={{ ...primaryBtn, width: "100%" }}>
          {t("guide_choose_btn")}
        </button>
      </div>

      <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 14 }}>
        {TYPES.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            aria-label={`Тип ${i + 1}`}
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              border: "none",
              padding: 0,
              background: index === i ? "#FF6A1A" : "#63696D",
              cursor: "pointer",
            }}
          />
        ))}
      </div>
    </div>
  );
}

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
const Plate = ({ children, style, className, onClick }) => (
  <div
    className={className}
    onClick={onClick}
    style={{
      position: "relative",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 16,
      background: "#15181A",
      boxShadow: "0 1px 2px rgba(0,0,0,0.3), 0 8px 24px rgba(0,0,0,0.25)",
      ...style,
    }}
  >
    {children}
  </div>
);

const Label = ({ children }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 7, fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif", fontSize: 11, letterSpacing: "0.01em", color: "#A3A8AD" }}>
    <span style={{ width: 11, height: 1.4, background: "#FF6A1A", flexShrink: 0 }} />
    {children}
  </div>
);

const seedOwners = [
  { id: 1, name: "РЕМСЕРВІС-Н", region: "Ужгород", types: ["Екскаватор", "Гідромолот"], verified: true, phone: "+380 67 111 22 33" },
  { id: 2, name: "БудТехСервіс", region: "Мукачево", types: ["Гідромолот", "Екскаватор"], verified: true, phone: "+380 66 222 33 44" },
  { id: 3, name: "Карпати-Буд", region: "Ужгород", types: ["Екскаватор", "Навантажувач"], verified: false, phone: "+380 63 333 44 55" },
  { id: 4, name: "ЛьвівБуд", region: "Львів", types: ["Самоскид", "Бульдозер"], verified: true, phone: "+380 97 444 55 66" },
  { id: 5, name: "КиївКранСервіс", region: "Київ", types: ["Кран"], verified: true, phone: "+380 50 555 66 77" },
  { id: 6, name: "МиколаївТех", region: "Миколаїв", types: ["Екскаватор", "Самоскид"], verified: false, phone: "+380 68 666 77 88" },
  { id: 7, name: "МиколаївБудуй", region: "Миколаїв", types: ["Екскаватор"], verified: true, phone: "+380 95 777 88 99" },
];

// ---- Main App ----
export default function EquipmentMarketplace() {
  const [role, setRole] = useState("client"); // client | owner
  const [lang, setLang] = useState("uk"); // uk | ru | en
  const t = useTranslate(lang);
  const [listings, setListings] = useState(seedListings);
  const [filterType, setFilterType] = useState("Усі");
  const [filterRegion, setFilterRegion] = useState("Усі");
  const [showAddForm, setShowAddForm] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [detailListing, setDetailListing] = useState(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [requests, setRequests] = useState([]);
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
  const [dispatcherUnlocked, setDispatcherUnlocked] = useState(() => {
    try {
      return typeof window !== "undefined" && window.localStorage.getItem("techmaydanchik_dispatcher_unlocked") === "true";
    } catch {
      return false;
    }
  });
  const [showDispatcherAuth, setShowDispatcherAuth] = useState(false);
  const [filterMaxPrice, setFilterMaxPrice] = useState("");
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
  const myRequestsCount = user ? requests.filter((r) => r.contact === user.phone).length : 0;
  const [scrolled, setScrolled] = useState(false);
  const appSectionRef = useRef(null);
  const heroRef = useRef(null);
  const [parallax, setParallax] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let rafId = null;
    const handleMove = (e) => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        const rect = el.getBoundingClientRect();
        setParallax({
          x: (e.clientX - rect.left) / rect.width - 0.5,
          y: (e.clientY - rect.top) / rect.height - 0.5,
        });
      });
    };
    const handleLeave = () => setParallax({ x: 0, y: 0 });

    el.addEventListener("mousemove", handleMove);
    el.addEventListener("mouseleave", handleLeave);
    return () => {
      el.removeEventListener("mousemove", handleMove);
      el.removeEventListener("mouseleave", handleLeave);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  const parallaxStyle = (depth) => ({
    transform: `translate(${parallax.x * depth}px, ${parallax.y * depth}px)`,
    transition: "transform 0.2s ease-out",
  });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const els = document.querySelectorAll(".reveal:not(.is-visible)");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [role, listings.length, requests.length]);

  const scrollToApp = () => appSectionRef.current?.scrollIntoView({ behavior: "smooth" });

  const filtered = useMemo(() => {
    return listings.filter(
      (l) =>
        (filterType === "Усі" || l.type === filterType) &&
        (filterRegion === "Усі" || l.region === filterRegion) &&
        (!filterMaxPrice || l.price <= Number(filterMaxPrice)) &&
        (!showFavoritesOnly || favorites.has(l.id))
    );
  }, [listings, filterType, filterRegion, filterMaxPrice, showFavoritesOnly, favorites]);

  const flashToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  };

  const handleAddListing = (data) => {
    setListings((prev) => [
      { ...data, id: prev.length + 1, available: data.available !== undefined ? data.available : true },
      ...prev,
    ]);
    setShowAddForm(false);
    flashToast("Техніку додано в каталог");
  };

  const handleSubmitRequest = (data) => {
    // Надсилаємо заявку в Telegram (працює на реальному сайті; у чат-превью тихо ігнорується)
    try {
      fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).catch(() => {});
    } catch (e) {}
    setRequests((prev) => [
      { ...data, id: prev.length + 1, status: "new", ownerStatuses: {}, log: [] },
      ...prev,
    ]);
    setShowRequestForm(false);
    setAiPrefill(null);
    flashToast("Заявку прийнято. Вона в черзі на диспетчеризацію");
  };

  const applyDispatchLocally = (requestId, ownerIds, ownerNames) => {
    const now = new Date().toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" });
    setRequests((prev) =>
      prev.map((r) => {
        if (r.id !== requestId) return r;
        const ownerStatuses = { ...r.ownerStatuses };
        const newLog = [...r.log];
        ownerIds.forEach((id, i) => {
          ownerStatuses[id] = "sent";
          newLog.push({ ownerId: id, ownerName: ownerNames[i], action: "sent", time: now });
        });
        return { ...r, status: r.status === "taken" ? r.status : "dispatched", ownerStatuses, log: newLog };
      })
    );
  };

  const handleDispatch = async (requestId, ownerIds, ownerNames) => {
    try {
      const res = await fetch(`${BOT_API_URL}/dispatch`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-API-Key": BOT_API_KEY },
        body: JSON.stringify({ requestId, ownerIds, dispatchedBy: user?.name || "dispatcher" }),
      });
      if (!res.ok) throw new Error(`Бот відповів помилкою: ${res.status}`);
      await res.json();
      applyDispatchLocally(requestId, ownerIds, ownerNames);
      flashToast(`Надіслано в Telegram: ${ownerNames.join(", ")}`);
    } catch (err) {
      // Бот ще не розгорнутий/недоступний — показуємо це чесно і працюємо локально,
      // щоб макет не ламався, поки реальний бот не піднятий.
      console.error("Dispatch API unreachable:", err);
      applyDispatchLocally(requestId, ownerIds, ownerNames);
      flashToast(`Бот недоступний (демо-режим) — заявку позначено локально: ${ownerNames.join(", ")}`);
    }
  };

  const handleOwnerAction = (requestId, ownerId, ownerName, action) => {
    const now = new Date().toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" });
    setRequests((prev) =>
      prev.map((r) => {
        if (r.id !== requestId) return r;
        const ownerStatuses = { ...r.ownerStatuses, [ownerId]: action };
        let newLog = [...r.log, { ownerId, ownerName, action, time: now }];
        let status = r.status;

        if (action === "accepted") {
          status = "taken";
          Object.keys(ownerStatuses).forEach((id) => {
            if (Number(id) !== ownerId && ownerStatuses[id] === "sent") {
              ownerStatuses[id] = "expired";
              newLog.push({
                ownerId: Number(id),
                ownerName: owners_lookup(r, Number(id)),
                action: "auto-expired",
                time: now,
              });
            }
          });
        } else if (action === "rejected") {
          const stillPending = Object.values(ownerStatuses).some((s) => s === "sent");
          if (!stillPending) status = "new"; // everyone contacted refused -> back to dispatcher queue
        }

        return { ...r, status, ownerStatuses, log: newLog };
      })
    );
    flashToast(
      action === "accepted"
        ? `${ownerName} узяв заявку #${requestId}`
        : `${ownerName} відмовився від заявки #${requestId}`
    );
  };

  function owners_lookup(req, id) {
    const found = req.log.find((l) => l.ownerId === id);
    return found ? found.ownerName : `#${id}`;
  }

  const handleRegister = (data) => {
    setUser(data);
    setShowAuthForm(false);
    flashToast(`Ласкаво просимо, ${data.name}!`);
  };

  const handleUpdateProfile = (data) => {
    setUser(data);
    setShowProfile(false);
    flashToast("Дані кабінету оновлено");
  };

  const handleLogout = () => {
    setUser(null);
    setShowProfile(false);
    flashToast("Ви вийшли з кабінету");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#08090A",
        color: "#ffffff",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif",
      }}
    >
      <FontLink />
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

        .hero-video-drip-zone .drip {
          position: absolute;
          top: 30%;
          width: 5px;
          height: 12px;
          border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
          background: linear-gradient(180deg, #FFC862, #FF6A1A);
          opacity: 0;
          pointer-events: none;
          box-shadow: 0 0 4px rgba(255,106,26,0.5);
        }
        .hero-video-drip-zone:hover .drip {
          animation: dripFall 1.4s ease-in infinite;
        }
        @keyframes dripFall {
          0% { opacity: 0; transform: translateY(0) scaleY(0.6); }
          15% { opacity: 1; transform: translateY(0) scaleY(1); }
          85% { opacity: 1; }
          100% { opacity: 0; transform: translateY(160px) scaleY(1.4); }
        }
        @media (prefers-reduced-motion: reduce) {
          .hero-video-drip-zone:hover .drip { animation: none; opacity: 0; }
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
          .ai-panel { bottom: 168px; }
          body { padding-bottom: 0; }
        }
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
          width: 320px;
          max-width: calc(100vw - 40px);
          height: 420px;
          max-height: 60vh;
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
          align-self: flex-start;
          background: #191C1F;
          color: #ffffff;
          border: 1px solid #63696D;
        }
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
        className="sticky-header"
        style={{
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
          <span
            className="logo-flip"
            style={{
              fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif",
              fontWeight: 700,
              fontSize: 22,
              letterSpacing: "0.02em",
              textTransform: "none",
            }}
          >
            <span className="logo-face logo-front">
              {"ТЕХМАЙДАНЧИК".split("").map((ch, i) => (
                <span
                  key={i}
                  className={`bounce-letter${i >= 3 ? " shimmer-logo" : ""}`}
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  {ch}
                </span>
              ))}
            </span>
            <span className="logo-face logo-back" aria-hidden="true">
              <span className="road-track">
                <span className="road-fill" />
              </span>
              <span className="tractor-icon"><IconExcavator size={30} style={{ color: "#FF6A1A" }} /></span>
            </span>
          </span>
          <Label><MorphingTagline text="біржа будтехніки" /></Label>
        </div>

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

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              position: "relative",
              display: "flex",
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
                  if (r.key === "owner") setShowAddForm(true);
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

          {user ? (
            <button
              onClick={() => setShowProfile(true)}
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
              <span>{user.name.split(" ")[0]}</span>
            </button>
          ) : (
            <button onClick={() => setShowAuthForm(true)} style={{ ...smallBtn, borderColor: "#FF6A1A", color: "#FF6A1A" }}>
              {t("nav_login")}
            </button>
          )}
        </div>
      </header>

      {/* Hero landing */}
      <section
        ref={heroRef}
        style={{
          padding: "56px 24px 40px",
          textAlign: "center",
          borderBottom: "1px solid #202428",
          overflow: "hidden",
          position: "relative",
          background: "radial-gradient(ellipse 700px 380px at 50% -10%, rgba(255,176,32,0.16), rgba(255,90,31,0.08) 45%, transparent 70%)",
        }}
      >
        <div className="hero-video-drip-zone" style={{ position: "absolute", inset: 0, zIndex: 0 }}>
          <video
            autoPlay
            muted
            loop
            playsInline
            src="/hero-video.mp4"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          />
          <span className="drip" style={{ left: "38%", animationDelay: "0s" }} />
          <span className="drip" style={{ left: "45%", animationDelay: "0.35s" }} />
          <span className="drip" style={{ left: "52%", animationDelay: "0.7s" }} />
          <span className="drip" style={{ left: "58%", animationDelay: "0.2s" }} />
          <span className="drip" style={{ left: "48%", animationDelay: "0.5s" }} />
        </div>
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(180deg, rgba(8,9,10,0.5) 0%, rgba(8,9,10,0.68) 55%, rgba(8,9,10,0.92) 100%)",
            zIndex: 0,
          }}
        />
        {/* Blueprint grid — the one deliberate signature texture, echoing the technical-drawing icon set */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
            maskImage: "radial-gradient(ellipse 60% 70% at 50% 20%, #000 0%, transparent 75%)",
            WebkitMaskImage: "radial-gradient(ellipse 60% 70% at 50% 20%, #000 0%, transparent 75%)",
            pointerEvents: "none",
          }}
        />
        <span aria-hidden="true" style={{ position: "absolute", top: 14, left: 14, width: 14, height: 14, borderTop: "1.5px solid #48484a", borderLeft: "1.5px solid #48484a" }} />
        <span aria-hidden="true" style={{ position: "absolute", top: 14, right: 14, width: 14, height: 14, borderTop: "1.5px solid #48484a", borderRight: "1.5px solid #48484a" }} />
        <div style={{ maxWidth: 640, margin: "0 auto", position: "relative" }}>
          <div
            className="reveal badge-pulse"
            style={{
              display: "inline-block",
              fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif",
              fontSize: 11,
              letterSpacing: "0.14em",
              textTransform: "none",
              padding: "5px 12px",
              marginBottom: 18,
              borderRadius: 6,
              ...parallaxStyle(6),
            }}
          >
            {t("hero_badge")}
          </div>
          <div
            className="blur-fade-in"
            onClick={() => setAiOpen(true)}
            style={{
              fontSize: "clamp(13px,3vw,16px)",
              lineHeight: 1.3,
              color: "#A3A8AD",
              marginBottom: 10,
              animationDelay: "0.1s",
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
            className="reveal-wipe"
            style={{
              fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif",
              fontWeight: 600,
              fontSize: "clamp(28px, 5vw, 44px)",
              lineHeight: 1.15,
              margin: "0 0 16px",
              textTransform: "none",
              ...parallaxStyle(12),
            }}
          >
            {t("hero_title_1")}
            <br />
            {t("hero_title_2")}
          </h1>
          <p style={{ color: "#A3A8AD", fontSize: 15.5, maxWidth: 480, margin: "0 auto 28px", minHeight: 44 }}>
            {typedIntro}
            {!typedIntroDone && <span className="typewriter-cursor" />}
          </p>
          <form
            className="reveal reveal-2"
            onSubmit={(e) => {
              e.preventDefault();
              const query = heroSearch.trim().toLowerCase();
              const matchedType = TYPES.find((ty) => ty.toLowerCase().includes(query) || query.includes(ty.toLowerCase()));
              setRole("client");
              if (matchedType) setFilterType(matchedType);
              scrollToApp();
            }}
            style={{ display: "flex", gap: 8, maxWidth: 420, margin: "0 auto 20px" }}
          >
            <input
              value={heroSearch}
              onChange={(e) => setHeroSearch(e.target.value)}
              placeholder={t("hero_search_placeholder")}
              style={{ ...inputStyle, flex: 1 }}
            />
            <button type="submit" className="glass-cta">
              {t("hero_search_btn")}
            </button>
          </form>
          <div className="reveal reveal-2" style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: 44 }}>
            <button
              onClick={() => {
                setRole("client");
                setAiOpen(true);
              }}
              className="glass-cta"
              style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
            >
              <IconExcavator size={16} />
              {t("hero_cta_client")}
            </button>
            <button
              onClick={() => {
                setRole("owner");
                setShowAddForm(true);
              }}
              style={smallBtn}
            >
              {t("hero_cta_owner")}
            </button>
          </div>
          <div className="reveal reveal-2" style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 8, marginBottom: 8 }}>
            <button className="hero-pill" onClick={() => scrollToApp()}>
              {t("pill_catalog")}
            </button>
            <button className="hero-pill" onClick={() => { setShowRequestForm(true); }}>
              {t("pill_request")}
            </button>
            <button className="hero-pill" onClick={() => { setRole("owner"); setShowAddForm(true); }}>
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
      </section>

      {/* 3D viewer temporarily removed — revisit later */}

      {/* How it works — the request workflow, as a technical process line */}
      <section id="how-it-works" style={{ padding: "48px 24px", borderBottom: "1px solid #202428" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <SectionDivider n={2} of={7} title={t("how_it_works_label")} />
          <h2 style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif", fontSize: 24, margin: "0 0 32px" }}>
            {t("how_it_works_title")}
          </h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 24 }}>
            {[t("step_1"), t("step_2"), t("step_3"), t("step_4"), t("step_5")].map((step, i) => (
              <div key={i} style={{ flex: "1 1 150px", minWidth: 140 }}>
                <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif", fontSize: 12, color: "#70777D" }}>
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div style={{ width: 20, height: 1.4, background: "#FF6A1A", margin: "8px 0 10px" }} />
                <div style={{ fontSize: 14, color: "#F4F4F1", lineHeight: 1.4 }}>{step}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Equipment guide — flip through types to learn and choose */}
      <section style={{ padding: "8px 24px 36px", borderBottom: "1px solid #202428" }}>
        <div style={{ maxWidth: 780, margin: "0 auto" }}>
          <div className="reveal" style={{ marginBottom: 20 }}>
            <SectionDivider n={3} of={7} title={t("categories_label").toUpperCase()} />
            <h2 style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif", fontSize: 22, textTransform: "none", margin: "0", textAlign: "center" }}>
              {t("categories_title")}
            </h2>
          </div>
          <EquipmentGuide
            t={t}
            listings={listings}
            onSelectCategory={(type) => {
              setRole("client");
              setFilterType(type);
              scrollToApp();
            }}
          />
        </div>
      </section>

      {/* Honest placeholder instead of mock trust signals */}
      <div className="reveal" style={{ padding: "20px 24px", borderBottom: "1px solid #202428", textAlign: "center" }}>
        <span style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif", fontSize: 12, color: "#A3A8AD", letterSpacing: "0.04em" }}>
          {t("trust_line")}
        </span>
      </div>

      {/* Hero strip */}
      <div ref={appSectionRef} style={{ padding: "28px 24px 8px" }}>
        <h1
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
        </h1>
        <p style={{ color: "#A3A8AD", marginTop: 10, maxWidth: 560, fontSize: 15 }}>
          {role === "client"
            ? "Фільтруйте по типу техніки, регіону та ціні, або залиште одну заявку — і власники самі відгукнуться."
            : role === "owner"
            ? "Додайте техніку з характеристиками одноразово — заявки клієнтів з вашого регіону приходитимуть автоматично."
            : "Жодна заявка не йде власникам автоматично. Ви бачите рекомендації системи й вирішуєте, кому надіслати."}
        </p>
        {role === "owner" && user && (
          <div style={{ marginTop: 14, display: "flex", gap: 20 }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 600 }}>
                {listings.filter((l) => l.owner === (user.org || user.name)).length}
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
              <button onClick={() => setShowRequestForm(true)} style={primaryBtn}>
                {t("add_request_btn")}
              </button>
              {user && (
                <button onClick={() => setShowMyRequests(true)} style={smallBtn}>
                  {t("nav_my_requests")}{myRequestsCount > 0 ? ` (${myRequestsCount})` : ""}
                </button>
              )}
            </>
          ) : (
            <button onClick={() => setShowAddForm(true)} style={primaryBtn}>
              {t("add_listing_btn")}
            </button>
          )}
        </div>
      )}

      {role === "dispatcher" && (
        <DispatcherPanel requests={requests} owners={seedOwners} onDispatch={handleDispatch} onOwnerAction={handleOwnerAction} user={user} t={t} />
      )}

      {/* Filters (client view) */}
      {role === "client" && (
        <div style={{ padding: "0 24px 8px", display: "flex", gap: 10, flexWrap: "wrap" }}>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} style={selectStyle}>
            <option>{t("filter_all")}</option>
            {TYPES.map((ty) => (
              <option key={ty}>{ty}</option>
            ))}
          </select>
          <select value={filterRegion} onChange={(e) => setFilterRegion(e.target.value)} style={selectStyle}>
            <option>{t("filter_all")}</option>
            {REGIONS.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
          <input
            type="number"
            value={filterMaxPrice}
            onChange={(e) => setFilterMaxPrice(e.target.value)}
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
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: 16,
        }}
      >
        {filtered.map((l) => (
          <Plate
            key={l.id}
            className="equipment-card"
            style={{ padding: "18px 16px", cursor: "pointer" }}
            onClick={() => setDetailListing(l)}
          >
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
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3 }}>
                  <span className={l.available ? "status-dot-available" : ""} style={{ width: 6, height: 6, borderRadius: "50%", background: l.available ? "#5FA876" : "#70777D", display: "inline-block" }} />
                  <span style={{ fontSize: 10.5, color: "#70777D", fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif" }}>
                    {l.available ? t("status_available") : t("status_busy")}
                  </span>
                </div>
                <Label>{l.type}</Label>
                <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif", fontSize: 18, fontWeight: 600, marginTop: 2 }}>
                  {l.brand}
                </div>
              </div>
              {l.photo && l.photo.startsWith("data:") ? (
                <img src={l.photo} alt={l.brand} style={{ width: 44, height: 44, objectFit: "cover", border: "1px solid #63696D" }} />
              ) : (
                <div className="icon-tilt" style={{ color: "#FF6A1A", filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.4))" }}><EquipmentIcon type={l.type} size={46} /></div>
              )}
            </div>

            <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 4 }}>
              {Object.entries(l.specs).map(([k, v]) => (
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
                <div style={{ fontSize: 11, color: "#A3A8AD" }}>{l.region} · {l.owner}</div>
                {l.photo && l.photo.startsWith("data:") && (
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
              </div>
              <button
                disabled={!l.available}
                onClick={(e) => {
                  e.stopPropagation();
                  trackViewed(l.id);
                  flashToast(`Запит надіслано власнику "${l.owner}"`);
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
        {filtered.length === 0 && (
          <div style={{ color: "#A3A8AD", fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif", fontSize: 13 }}>
            {t("catalog_empty")}
          </div>
        )}
      </div>
      )}

      {/* FAQ */}
      <div className="reveal" style={{ padding: "8px 24px 64px", maxWidth: 640, margin: "0 auto" }}>
        <SectionDivider n={7} of={7} title={t("faq_label").toUpperCase()} />
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
            onClick={() => (dispatcherUnlocked ? setRole("dispatcher") : setShowDispatcherAuth(true))}
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
        <Modal onClose={() => setDetailListing(null)} title={detailListing.brand}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", justifyContent: "center", padding: "20px 0", background: "#191C1F", borderRadius: 12 }}>
              {detailListing.photo && detailListing.photo.startsWith("data:") ? (
                <img src={detailListing.photo} alt={detailListing.brand} style={{ maxWidth: "100%", maxHeight: 160, objectFit: "cover" }} />
              ) : (
                <div style={{ color: "#FF6A1A" }}><EquipmentIcon type={detailListing.type} size={90} /></div>
              )}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span className={detailListing.available ? "status-dot-available" : ""} style={{ width: 6, height: 6, borderRadius: "50%", background: detailListing.available ? "#5FA876" : "#70777D" }} />
              <span style={{ fontSize: 11, color: "#70777D" }}>{detailListing.available ? t("status_available") : t("status_busy")}</span>
            </div>

            <div>
              <Label>{detailListing.type}</Label>
              <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif", fontSize: 22, fontWeight: 600 }}>
                {detailListing.brand}
              </div>
              <div style={{ fontSize: 13, color: "#A3A8AD", marginTop: 2 }}>{detailListing.region}</div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6, borderTop: "1px solid #202428", borderBottom: "1px solid #202428", padding: "12px 0" }}>
              {Object.entries(detailListing.specs).map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span style={{ color: "#A3A8AD" }}>{k}</span>
                  <span>{v}</span>
                </div>
              ))}
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
              {detailListing.photo && detailListing.photo.startsWith("data:") && <span style={{ color: "#FFB52E" }}>✓</span>}
            </div>

            <button
              disabled={!detailListing.available}
              onClick={() => {
                trackViewed(detailListing.id);
                flashToast(`Запит надіслано власнику "${detailListing.owner}"`);
                setDetailListing(null);
              }}
              style={{ ...primaryBtn, width: "100%", opacity: detailListing.available ? 1 : 0.4, cursor: detailListing.available ? "pointer" : "not-allowed" }}
            >
              ЗАПИТАТИ ПРО ОРЕНДУ
            </button>
          </div>
        </Modal>
      )}

      {showAddForm && (
        <Modal onClose={() => setShowAddForm(false)} title={t("add_listing_title")}>
          <AddListingForm onSubmit={handleAddListing} user={user} />
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
          <RequestForm onSubmit={handleSubmitRequest} user={user} initial={aiPrefill} t={t} />
        </Modal>
      )}
      {showMyRequests && user && (
        <Modal onClose={() => setShowMyRequests(false)} title={t("nav_my_requests")}>
          <MyRequestsPanel requests={requests.filter((r) => r.contact === user.phone)} reviews={reviews} onAddReview={handleAddReview} />
        </Modal>
      )}

      {showDispatcherAuth && (
        <Modal onClose={() => setShowDispatcherAuth(false)} title={t("footer_dispatcher")}>
          <DispatcherAuthForm
            onSuccess={() => {
              setDispatcherUnlocked(true);
              try {
                window.localStorage.setItem("techmaydanchik_dispatcher_unlocked", "true");
              } catch {}
              setShowDispatcherAuth(false);
              setRole("dispatcher");
            }}
          />
        </Modal>
      )}

      {showAuthForm && (
        <Modal onClose={() => setShowAuthForm(false)} title={t("register_title")} splitLeft>
          <AuthForm onSubmit={handleRegister} />
        </Modal>
      )}
      {showProfile && user && (
        <Modal onClose={() => setShowProfile(false)} title={t("profile_title")}>
          <ProfileForm user={user} onSave={handleUpdateProfile} onLogout={handleLogout} />
        </Modal>
      )}

      <AiAssistant
        user={user}
        t={t}
        listings={listings}
        open={aiOpen}
        setOpen={setAiOpen}
        onPrefillRequest={(data) => {
          setAiPrefill(data);
          setRole("client");
          setShowRequestForm(true);
        }}
        onViewListing={(l) => setDetailListing(l)}
      />

      <div className="sticky-cta">
        <span style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif", fontSize: 12.5, color: "#A3A8AD" }}>
          {role === "owner" ? "Готові здати техніку?" : "Потрібна техніка зараз?"}
        </span>
        <button
          onClick={() => (role === "owner" ? setShowAddForm(true) : setShowRequestForm(true))}
          style={{ ...primaryBtn, padding: "9px 16px" }}
        >
          {role === "owner" ? "Додати" : "Залишити заявку"}
        </button>
      </div>

      {toast && (
        <div
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
function DispatcherPanel({ requests, owners, onDispatch, onOwnerAction, user, t }) {
  const [filter, setFilter] = useState("all");

  const categories = [
    { key: "all", label: t("dispatcher_all"), test: () => true },
    { key: "new", label: t("dispatcher_new"), test: (r) => r.status === "new" },
    { key: "dispatched", label: t("dispatcher_progress"), test: (r) => r.status === "dispatched" },
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
        </Plate>
      </div>
    );
  }

  return (
    <div className="dispatcher-layout" style={{ padding: "8px 24px 48px", display: "flex", gap: 20 }}>
      <div className="dispatcher-sidebar" style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 160, flexShrink: 0 }}>
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
            <RequestDispatchCard key={req.id} req={req} owners={owners} onDispatch={onDispatch} onOwnerAction={onOwnerAction} user={user} />
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

function MyRequestsPanel({ requests, reviews, onAddReview }) {
  if (requests.length === 0) {
    return (
      <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif", fontSize: 13, color: "#A3A8AD" }}>
        Ви ще не залишали заявок. Коли залишите — статус буде видно тут.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {requests.map((req) => {
        const info = clientStatusInfo(req);
        const existingReview = reviews.find((r) => r.requestId === req.id);
        return (
          <div key={req.id} style={{ border: "1px solid #63696D", padding: "14px 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
              <div>
                <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif", fontSize: 15, fontWeight: 600 }}>
                  {req.type} — {req.region}
                </div>
                <div style={{ fontSize: 11.5, color: "#A3A8AD", fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif", marginTop: 3 }}>
                  Заявка #{req.id}{req.budget ? ` · до ${req.budget} ₴` : ""}
                </div>
              </div>
            </div>
            <div
              style={{
                marginTop: 10,
                fontSize: 12.5,
                fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif",
                color: info.color,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: info.color, display: "inline-block" }} />
              {info.label}
            </div>

            {req.status === "taken" &&
              (existingReview ? (
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px dashed #63696D" }}>
                  <Label>Ваш відгук</Label>
                  <div style={{ marginTop: 6 }}>
                    <StarRating value={existingReview.rating} readOnly />
                  </div>
                  {existingReview.comment && (
                    <p style={{ fontSize: 12.5, color: "#F4F4F1", marginTop: 6 }}>{existingReview.comment}</p>
                  )}
                </div>
              ) : (
                <ReviewBox req={req} onSubmit={onAddReview} />
              ))}
          </div>
        );
      })}
    </div>
  );
}

function RequestDispatchCard({ req, owners, onDispatch, onOwnerAction, user }) {
  const contactedIds = new Set(Object.keys(req.ownerStatuses).map(Number));
  const uncontacted = owners.filter((o) => !contactedIds.has(o.id));
  const suggestedUncontacted = uncontacted.filter((o) => o.types.includes(req.type) && o.region === req.region);
  const otherUncontacted = uncontacted.filter((o) => !suggestedUncontacted.includes(o));

  const [selected, setSelected] = useState(() => new Set(suggestedUncontacted.map((o) => o.id)));
  const [showHistory, setShowHistory] = useState(false);

  const toggle = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const send = () => {
    const chosen = owners.filter((o) => selected.has(o.id));
    if (chosen.length === 0) return;
    onDispatch(req.id, [...selected], chosen.map((o) => o.name));
    setSelected(new Set());
  };

  const takeForMyself = async () => {
    const selfName = user?.org || user?.name || "Моя компанія";
    try {
      const res = await fetch(`${BOT_API_URL}/take`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-API-Key": BOT_API_KEY },
        body: JSON.stringify({ requestId: req.id, ownerName: selfName }),
      });
      if (!res.ok) throw new Error(`Бот відповів помилкою: ${res.status}`);
      await res.json();
    } catch (err) {
      console.error("Take API unreachable:", err);
      // Бот недоступний — все одно застосовуємо локально, щоб не блокувати роботу з макетом.
    }
    // Той самий виклик, яким власник приймає заявку у боті — жодних окремих
    // полів чи позначок "адмін" немає, тому в даних це нічим не відрізняється
    // від того, що заявку взяв звичайний власник.
    onOwnerAction(req.id, "self", selfName, "accepted");
  };

  const contactedOwners = owners.filter((o) => contactedIds.has(o.id));
  const needsAttention = req.status === "new" && req.log.length > 0; // everyone contacted so far refused

  return (
    <Plate style={{ padding: "20px 18px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <div>
          <Label>
            Заявка #{req.id} ·{" "}
            {req.status === "taken" ? "закрито" : req.status === "dispatched" ? "у роботі" : needsAttention ? "потрібна увага" : "нова"}
          </Label>
          <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif", fontSize: 18, fontWeight: 600, marginTop: 2 }}>
            {req.type} — {req.region}
          </div>
          <div style={{ fontSize: 12.5, color: "#A3A8AD", marginTop: 4, fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif" }}>
            Бюджет: {req.budget || "—"} ₴ · Дата: {req.dateFrom || "не вказано"} · Контакт: {req.contact}
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
              const st = req.ownerStatuses[o.id];
              return (
                <div key={o.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12.5, fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif" }}>
                  <span>{o.name} <span style={{ color: "#70777D" }}>· {o.phone}</span></span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ color: STATUS_COLOR[st] }}>{STATUS_LABEL[st]}</span>
                    {st === "sent" && (
                      <>
                        <button onClick={() => onOwnerAction(req.id, o.id, o.name, "accepted")} style={miniBtn("#6fae6f")}>
                          Взяв
                        </button>
                        <button onClick={() => onOwnerAction(req.id, o.id, o.name, "rejected")} style={miniBtn("#c96b5a")}>
                          Відмова
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

      {/* Selection of new owners to contact (initial send, or re-dispatch after refusal) */}
      {req.status !== "taken" && (
        <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px dashed #63696D" }}>
          <Label>{contactedOwners.length === 0 ? "Рекомендовано системою" : "Надіслати ще"}</Label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
            {suggestedUncontacted.length === 0 && otherUncontacted.length === 0 && (
              <span style={{ fontSize: 12.5, color: "#A3A8AD" }}>Усіх власників уже задіяно.</span>
            )}
            {suggestedUncontacted.map((o) => (
              <OwnerChip key={o.id} owner={o} checked={selected.has(o.id)} onToggle={() => toggle(o.id)} highlighted />
            ))}
            {otherUncontacted.map((o) => (
              <OwnerChip key={o.id} owner={o} checked={selected.has(o.id)} onToggle={() => toggle(o.id)} />
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
      {req.log.length > 0 && (
        <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px dashed #63696D" }}>
          <button
            onClick={() => setShowHistory((s) => !s)}
            style={{ background: "none", border: "none", color: "#A3A8AD", cursor: "pointer", fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif", fontSize: 11, letterSpacing: "0.08em", textTransform: "none", padding: 0 }}
          >
            {showHistory ? "▲ Сховати історію" : `▼ Історія (${req.log.length})`}
          </button>
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

const badgeStyle = {
  fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif",
  fontSize: 11,
  padding: "5px 10px",
  height: "fit-content",
};

const miniBtn = (color) => ({
  background: "none",
  border: `1px solid ${color}`,
  color,
  fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif",
  fontSize: 10.5,
  padding: "3px 8px",
  cursor: "pointer",
});

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
      {highlighted && <span style={{ color: "#A3A8AD", fontSize: 10 }}>({owner.region})</span>}
    </label>
  );
}

// ---- Registration form ----
const DISPATCHER_PASSWORD = "techmaydanchik2026";

function DispatcherAuthForm({ onSuccess }) {
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    if (password === DISPATCHER_PASSWORD) {
      onSuccess();
    } else {
      setError(true);
    }
  };

  const neuBase = "#1c1c1e";
  const neuRaised = {
    background: neuBase,
    borderRadius: 14,
    boxShadow: "6px 6px 12px rgba(0,0,0,0.55), -4px -4px 10px rgba(255,255,255,0.03)",
    border: "none",
  };
  const neuInset = {
    background: neuBase,
    borderRadius: 12,
    boxShadow: "inset 4px 4px 8px rgba(0,0,0,0.6), inset -3px -3px 6px rgba(255,255,255,0.025)",
    border: "none",
    color: "#F4F4F1",
    padding: "12px 16px",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif",
    fontSize: 14,
    outline: "none",
  };

  return (
    <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 16, padding: 6 }}>
      <div style={{ fontSize: 12, color: "#A3A8AD", fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif" }}>
        Цей розділ бачить телефони клієнтів — доступ лише для диспетчера.
      </div>

      <div>
        <Label>Пароль</Label>
        <input
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError(false);
          }}
          style={{ ...neuInset, width: "100%", marginTop: 8 }}
          autoFocus
        />
        {error && <ErrorText>Невірний пароль</ErrorText>}
      </div>

      <button
        type="button"
        onClick={() => setRemember((r) => !r)}
        style={{
          ...(remember ? neuInset : neuRaised),
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "12px 16px",
          cursor: "pointer",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif",
          fontSize: 13,
          color: "#F4F4F1",
        }}
      >
        <span
          style={{
            width: 9,
            height: 9,
            borderRadius: "50%",
            background: remember ? "#FF6A1A" : "#48484a",
            boxShadow: remember ? "0 0 6px 2px rgba(255,106,26,0.6)" : "none",
            flexShrink: 0,
          }}
        />
        Запам'ятати мене
      </button>

      <button
        type="submit"
        className="btn-premium-hover"
        style={{
          ...neuRaised,
          padding: "14px 20px",
          color: "#F4F4F1",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif",
          fontSize: 14,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        Увійти
      </button>
    </form>
  );
}

function AuthForm({ onSubmit }) {
  const [form, setForm] = useState({ name: "", org: "", phone: "", email: "", role: "client" });
  const [errors, setErrors] = useState({});
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Вкажіть ім'я";
    if (!form.phone.trim()) e.phone = "Вкажіть телефон";
    else if (!/^\+?[0-9\s()-]{9,}$/.test(form.phone.trim())) e.phone = "Схоже, номер невірний";
    if (!form.email.trim()) e.email = "Вкажіть email";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = "Схоже, email невірний";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    onSubmit(form);
  };

  return (
    <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <Field label="Я реєструюсь як">
        <div style={{ display: "flex", gap: 8 }}>
          {[
            { key: "client", label: "Клієнт" },
            { key: "owner", label: "Власник техніки" },
          ].map((r) => (
            <button
              type="button"
              key={r.key}
              onClick={() => setForm((f) => ({ ...f, role: r.key }))}
              style={{
                flex: 1,
                padding: "9px 10px",
                border: `1px solid ${form.role === r.key ? "#FF6A1A" : "#63696D"}`,
                background: form.role === r.key ? "rgba(255,90,31,0.1)" : "transparent",
                color: "#ffffff",
                fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif",
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              {r.label}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Ім'я та прізвище">
        <input value={form.name} onChange={set("name")} placeholder="Володимир Іваненко" style={inputStyle} />
        {errors.name && <ErrorText>{errors.name}</ErrorText>}
      </Field>

      <Field label="Назва організації (якщо є)">
        <input value={form.org} onChange={set("org")} placeholder="РЕМСЕРВІС-Н" style={inputStyle} />
      </Field>

      <Field label="Телефон">
        <input value={form.phone} onChange={set("phone")} placeholder="+380 XX XXX XX XX" style={inputStyle} />
        {errors.phone && <ErrorText>{errors.phone}</ErrorText>}
      </Field>

      <Field label="Email">
        <input type="email" value={form.email} onChange={set("email")} placeholder="name@company.com" style={inputStyle} />
        {errors.email && <ErrorText>{errors.email}</ErrorText>}
      </Field>

      <button className="btn-premium-hover" type="submit" style={{ ...primaryBtn, marginTop: 8, width: "100%" }}>
        Зареєструватись
      </button>
    </form>
  );
}

function ErrorText({ children }) {
  return (
    <span style={{ color: "#c96b5a", fontSize: 11, fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif" }}>{children}</span>
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
          <Label>{form.role === "owner" ? "Власник техніки" : "Клієнт"}{form.org ? ` · ${form.org}` : ""}</Label>
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
          <input type="email" value={form.email} onChange={set("email")} style={inputStyle} />
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

const AI_ASSISTANT_SYSTEM_PROMPT = `Ти — помічник сайту ТехМайданчик, біржі оренди будівельної техніки в Україні.

Клієнт може написати ДВА типи повідомлень:
1. Опис завдання (наприклад: "потрібно викопати траншею під фундамент гаража в Ужгороді") — визнач, яка техніка потрібна, і чому саме вона.
2. Загальне питання про техніку (наприклад: "чим екскаватор відрізняється від навантажувача") — дай коротку, конкретну відповідь по суті, без зайвого.

Визнач з повідомлення:
- type: одне значення зі списку [${TYPES.join(", ")}], або null якщо це не запит на техніку
- region: одне значення зі списку [${REGIONS.join(", ")}], або null якщо не згадано
- budget: число (гривні), або null якщо не згадано
- comment: короткий переказ задачі клієнта, 1 речення, українською (для заявки)
- reply: твоя відповідь клієнту, 2-3 речення українською.
  Якщо це завдання — ОБОВ'ЯЗКОВО поясни, чому саме цей тип техніки підходить (яка функція вирішує задачу), а не просто назви тип.
  Якщо це питання — дай пряму, конкретну відповідь по суті питання.

Відповідай ЛИШЕ у форматі JSON, без жодного тексту навколо, без markdown-обгортки:
{"type": ..., "region": ..., "budget": ..., "comment": "...", "reply": "..."}`;

// ---- AI assistant transport: server proxy -> direct (Claude sandbox) -> local on-topic fallback ----
async function callAssistantApi(messages) {
  // Anthropic вимагає, щоб перше повідомлення було від user (без привітання асистента)
  const apiMessages = messages.map((m) => ({ role: m.role, content: m.text }));
  while (apiMessages.length && apiMessages[0].role !== "user") apiMessages.shift();

  const parseResponse = (data) => {
    const raw = (data.content || []).map((b) => b.text || "").join("");
    const clean = raw.replace(/```json|```/g, "").trim();
    const start = clean.indexOf("{");
    const end = clean.lastIndexOf("}");
    return JSON.parse(start >= 0 && end > start ? clean.slice(start, end + 1) : clean);
  };

  // 1) Серверний проксі на Vercel (/api/chat) — працює на реальному сайті
  try {
    const r = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: apiMessages }),
    });
    if (r.ok) return parseResponse(await r.json());
  } catch (e) {}

  // 2) Прямий виклик — працює всередині чату Claude (артефакт)
  const r2 = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 500,
      system: AI_ASSISTANT_SYSTEM_PROMPT,
      messages: apiMessages,
    }),
  });
  if (!r2.ok) throw new Error("direct api failed");
  return parseResponse(await r2.json());
}

// Локальний режим: працює без AI-сервера, відповідає по темі сайту за ключовими словами.
const LOCAL_RULES = [
  { type: "Екскаватор", keys: ["викопа", "котлован", "траншеј", "траншея", "траншею", "траншеї", "копа", "ров ", "екскават", "экскават", "выкоп", "котлован", "фундамент", "яму", "яма"],
    why: "Екскаватор — основна машина для земляних робіт: копає котловани, траншеї та ями і вантажить ґрунт." },
  { type: "Навантажувач", keys: ["навантаж", "погруз", "сніг", "снег", "пісок", "песок", "щебін", "щебен", "перемістити ґрунт", "сипуч"],
    why: "Навантажувач швидко переміщує та вантажить сипучі матеріали (пісок, щебінь, сніг) на невеликих майданчиках." },
  { type: "Самоскид", keys: ["вивез", "вывоз", "самоскид", "самосвал", "перевез", "доставк", "сміття", "мусор"],
    why: "Самоскид вивозить ґрунт, щебінь і сміття з об'єкта та доставляє матеріали." },
  { type: "Гідромолот", keys: ["зруйн", "знести", "знос", "снести", "снос", "демонтаж", "розбит", "разбить", "бетон", "асфальт", "молот"],
    why: "Гідромолот руйнує бетон, асфальт і фундаменти ударною силою — його встановлюють на екскаватор." },
  { type: "Кран", keys: ["кран", "підйом", "подъем", "підняти", "поднять", "монтаж", "плит", "перекритт", "перекрыти", "висот", "высот"],
    why: "Кран піднімає і встановлює важкі вантажі та конструкції на висоту — плити, балки, блоки." },
  { type: "Бульдозер", keys: ["бульдозер", "розрівн", "выровн", "планув", "планиров", "розчист", "расчист", "зрізат", "срезат", "відвал"],
    why: "Бульдозер розрівнює ділянку, зрізає ґрунт і розчищає територію відвалом." },
];
const REGION_ALIASES = { "Ужгород": ["ужгород"], "Мукачево": ["мукачев"], "Львів": ["львів", "львов"], "Київ": ["київ", "києв", "киев"], "Миколаїв": ["миколаїв", "миколає", "николаев"], "Одеса": ["одес"] };

function localAssistantReply(text) {
  const q = text.toLowerCase();
  const rule = LOCAL_RULES.find((r) => r.keys.some((k) => q.includes(k)));
  let region = null;
  for (const [name, aliases] of Object.entries(REGION_ALIASES)) {
    if (aliases.some((a) => q.includes(a))) { region = name; break; }
  }
  const budgetMatch = q.match(/(\d[\d\s]{2,})\s*(грн|₴|гривень|гривні|uah)/);
  const budget = budgetMatch ? Number(budgetMatch[1].replace(/\s/g, "")) : null;

  // Питання-порівняння ("чим відрізняється…") — відповідаємо по суті, без підбору техніки
  if (/відрізня|різниц|разниц|отлича|различ|difference|vs\b/.test(q)) {
    const found = LOCAL_RULES.filter((r) => r.keys.some((k) => q.includes(k)));
    if (found.length >= 2) {
      return { type: null, region: null, budget: null, comment: "",
        reply: found.map((r) => `${r.type}: ${r.why}`).join(" ") + " Опишіть вашу задачу — підкажу, що саме підійде." };
    }
  }
  if (rule) {
    return {
      type: rule.type, region, budget,
      comment: text.slice(0, 140),
      reply: `${rule.why} Для вашої задачі раджу тип техніки: ${rule.type}${region ? ` (${region})` : ""}. Нижче — підходяща техніка з каталогу, або залиште заявку — диспетчер підбере власника.`,
    };
  }
  if (/як (це )?працю|как (это )?работает|як здати|как сдать|здат[иь] техніку|сдат[ьи] технику/.test(q)) {
    return { type: null, region: null, budget: null, comment: "",
      reply: "Клієнт залишає заявку → диспетчер підбирає та розсилає її власникам техніки → один із них підтверджує → ви отримуєте контакт. Щоб здати свою техніку, натисніть «Здаю техніку» і додайте оголошення." };
  }
  return { type: null, region: null, budget: null, comment: "",
    reply: "Я допомагаю підібрати будівельну техніку. Опишіть задачу — наприклад: «потрібно викопати котлован у Миколаєві» — і я порадю тип техніки та знайду її в каталозі." };
}

// ---- AI assistant: free-text task -> equipment/region/budget suggestion -> prefilled request form ----
function AiAssistant({ user, onPrefillRequest, onViewListing, listings, t, open, setOpen }) {
  const [messages, setMessages] = useState([
    { role: "assistant", text: t("ai_greeting") },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
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

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const nextMessages = [...messages, { role: "user", text }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      let parsed;
      try {
        parsed = await callAssistantApi(nextMessages);
      } catch (apiErr) {
        // AI-сервер недоступний — працюємо локально, по темі сайту
        parsed = localAssistantReply(text);
      }
      const replyText = parsed.reply || "Готово.";

      // Ground the recommendation in real inventory: find an actual available listing
      // matching the type (and region, if given) instead of only suggesting an abstract type.
      let matchedListing = null;
      if (parsed.type && listings) {
        const byTypeAndRegion = listings.filter((l) => l.available && l.type === parsed.type && (!parsed.region || l.region === parsed.region));
        const byTypeOnly = listings.filter((l) => l.available && l.type === parsed.type);
        matchedListing = byTypeAndRegion[0] || byTypeOnly[0] || null;
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: replyText, suggestion: parsed.type ? parsed : null, matchedListing },
      ]);
      speak(replyText);
    } catch (err) {
      const errText = "Вибачте, не вдалося обробити запит. Спробуйте ще раз або скористайтесь звичайною формою заявки.";
      setMessages((prev) => [...prev, { role: "assistant", text: errText }]);
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
                    Заповнити заявку: {m.suggestion.type}
                    {m.suggestion.region ? `, ${m.suggestion.region}` : ""}
                  </button>
                )}
              </div>
            ))}
            {loading && <div className="ai-bubble assistant">Друкує…</div>}
            {messages.length === 1 && !loading && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                {["Підібрати екскаватор", "Знайти техніку поруч", "Створити заявку", "Пояснити різницю між технікою"].map((s) => (
                  <button
                    key={s}
                    onClick={() => setInput(s)}
                    style={{
                      fontSize: 11.5,
                      padding: "6px 11px",
                      borderRadius: 980,
                      border: "1px solid #63696D",
                      background: "transparent",
                      color: "#A3A8AD",
                      cursor: "pointer",
                      fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif",
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
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
function Modal({ children, onClose, title, splitLeft }) {
  const titleId = useRef(`modal-title-${Math.random().toString(36).slice(2, 9)}`).current;
  const closeBtnRef = useRef(null);

  useEffect(() => {
    closeBtnRef.current?.focus();
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(10,9,8,.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        zIndex: 50,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        style={{
          background: "#15181A",
          border: "1px solid #48484a",
          width: "100%",
          maxWidth: splitLeft ? 760 : 460,
          maxHeight: "88vh",
          overflowY: "auto",
          display: splitLeft ? "flex" : "block",
        }}
      >
        {splitLeft && (
          <div
            style={{
              flex: "0 0 280px",
              background: "linear-gradient(180deg, #191C1F, #08090A)",
              borderRight: "1px solid #202428",
              padding: 28,
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end",
            }}
            className="auth-split-left"
          >
            <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif", fontSize: 26, fontWeight: 600, lineHeight: 1.15 }}>
              ТЕХНІКА<br />ПОЧИНАЄТЬСЯ<br />З ПРАВИЛЬНОГО<br /><span style={{ color: "#FF6A1A" }}>ЗАПИТУ.</span>
            </div>
          </div>
        )}
        <div style={{ padding: 24, flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h2 id={titleId} style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif", textTransform: "none", fontSize: 18, margin: 0 }}>
            {title}
          </h2>
          <button
            ref={closeBtnRef}
            onClick={onClose}
            aria-label="Закрити"
            style={{ background: "none", border: "none", color: "#A3A8AD", fontSize: 20, cursor: "pointer", padding: 10, margin: -10 }}
          >
            ×
          </button>
        </div>
        {children}
        </div>
      </div>
    </div>
  );
}

// ---- Add listing form (owner side) ----
function AddListingForm({ onSubmit, user }) {
  const [form, setForm] = useState({
    type: TYPES[0],
    brand: "",
    region: user?.region || REGIONS[0],
    price: "",
    unit: "год",
    spec1Key: "Вага",
    spec1Val: "",
    spec2Key: "Об'єм / вантажопідйомність",
    spec2Val: "",
    photo: "",
    owner: user ? user.org || user.name : "",
    busyUntil: "",
  });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handlePhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, photo: reader.result }));
    reader.readAsDataURL(file);
  };

  const submit = (e) => {
    e.preventDefault();
    if (!form.brand || !form.price || !form.owner) return;
    onSubmit({
      type: form.type,
      brand: form.brand,
      region: form.region,
      price: Number(form.price),
      unit: form.unit,
      photo: form.photo || null,
      owner: form.owner,
      busyUntil: form.busyUntil || null,
      available: !form.busyUntil,
      specs: {
        [form.spec1Key]: form.spec1Val || "—",
        [form.spec2Key]: form.spec2Val || "—",
      },
    });
  };

  return (
    <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {user ? (
        <div style={{ fontSize: 12, color: "#6fae6f", fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif" }}>
          ✓ Дані підтягнуто з кабінету — {user.org || user.name}
        </div>
      ) : (
        <div style={{ fontSize: 12, color: "#A3A8AD", fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif" }}>
          Ви не увійшли — вкажіть назву організації вручну, або спочатку зареєструйтесь.
        </div>
      )}
      <Field label="Фото техніки (необов'язково)">
        <input type="file" accept="image/*" onChange={handlePhoto} style={inputStyle} />
        {form.photo && form.photo.startsWith("data:") && (
          <img
            src={form.photo}
            alt="Прев'ю техніки"
            style={{ width: 84, height: 84, objectFit: "cover", marginTop: 8, border: "1px solid #63696D" }}
          />
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
          {TYPES.map((t) => <option key={t}>{t}</option>)}
        </select>
      </Field>
      <Field label="Марка / модель">
        <input value={form.brand} onChange={set("brand")} placeholder="напр. CAT 320" style={inputStyle} />
      </Field>
      <Field label="Регіон роботи">
        <select value={form.region} onChange={set("region")} style={inputStyle}>
          {REGIONS.map((r) => <option key={r}>{r}</option>)}
        </select>
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
      <button className="btn-premium-hover" type="submit" style={{ ...primaryBtn, marginTop: 8, width: "100%" }}>
        Додати в каталог
      </button>
    </form>
  );
}

// ---- Client request form ----
function RequestForm({ onSubmit, user, initial, t }) {
  const [form, setForm] = useState({
    type: initial?.type || TYPES[0],
    region: initial?.region || user?.region || REGIONS[0],
    dateFrom: "",
    budget: initial?.budget != null ? String(initial.budget) : "",
    comment: initial?.comment || "",
    contact: user?.phone || "",
    requesterName: user?.name || "",
  });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.contact) return;
    onSubmit(form);
  };

  return (
    <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
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
          {TYPES.map((t) => <option key={t}>{t}</option>)}
        </select>
      </Field>
      <Field label="Регіон / об'єкт">
        <select value={form.region} onChange={set("region")} style={inputStyle}>
          {REGIONS.map((r) => <option key={r}>{r}</option>)}
        </select>
      </Field>

      <StepLabel n={3} of={4} text={t("request_step_3")} />
      <Field label="Коли потрібно">
        <input type="date" value={form.dateFrom} onChange={set("dateFrom")} style={inputStyle} />
      </Field>
      <Field label="Бюджет (₴, орієнтовно)">
        <input type="number" value={form.budget} onChange={set("budget")} placeholder="1000" style={inputStyle} />
      </Field>

      <StepLabel n={4} of={4} text={t("request_step_4")} />
      <Field label="Контакт для зв'язку (телефон/Telegram)">
        <input value={form.contact} onChange={set("contact")} placeholder="+380..." style={inputStyle} />
      </Field>
      <button className="btn-premium-hover" type="submit" style={{ ...primaryBtn, marginTop: 8, width: "100%" }}>
        Надіслати заявку
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

function Field({ label, children, style }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6, ...style }}>
      <span style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif", fontSize: 10.5, letterSpacing: "0.08em", textTransform: "none", color: "#A3A8AD" }}>
        {label}
      </span>
      {children}
    </label>
  );
}

// ---- shared styles ----
const primaryBtn = {
  background: "linear-gradient(90deg, #FF6A1A, #FFB52E)",
  color: "#08090A",
  border: "none",
  borderRadius: 980,
  padding: "12px 22px",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif",
  fontSize: 14,
  fontWeight: 600,
  letterSpacing: "-0.01em",
  textTransform: "none",
  cursor: "pointer",
  boxShadow: "0 4px 16px rgba(255, 90, 31, 0.3)",
};

const smallBtn = {
  background: "transparent",
  color: "#ffffff",
  border: "1px solid rgba(255,255,255,0.18)",
  borderRadius: 980,
  padding: "8px 16px",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif",
  fontSize: 13,
  fontWeight: 500,
  letterSpacing: "-0.01em",
  textTransform: "none",
  transition: "border-color 0.2s ease, color 0.2s ease",
};

const selectStyle = {
  background: "#191C1F",
  color: "#ffffff",
  border: "1px solid #63696D",
  borderRadius: 8,
  padding: "9px 12px",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif",
  fontSize: 13,
};

const inputStyle = {
  background: "#191C1F",
  color: "#ffffff",
  border: "1px solid #63696D",
  borderRadius: 8,
  padding: "10px 12px",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif",
  fontSize: 14,
  outline: "none",
};
