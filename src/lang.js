// Мова інтерфейсу для внутрішніх сторінок: сторінка моделі, відгуки, бронювання, календар.
// Українська — основна; ru/en — переклад. Дані моделей (shared/models-data.js) лишаються українською,
// а переклад підписів, одиниць і пояснень робиться тут.
import { createContext, useContext } from "react";

export const LangContext = createContext("uk");
export const useLang = () => useContext(LangContext);
export const LOCALES = { uk: "uk-UA", ru: "ru-RU", en: "en-GB" };

export const TYPE_LABELS = {
  uk: { "Міні-екскаватор": "Міні-екскаватор", "Маніпулятор": "Вантажівка з маніпулятором", "Автовишка": "Автовишка", "Грейдер": "Грейдер", "Екскаватор": "Екскаватор", "Навантажувач": "Навантажувач", "Самоскид": "Самоскид", "Гідромолот": "Гідромолот", "Кран": "Кран", "Бульдозер": "Бульдозер", "Каток": "Каток" },
  ru: { "Міні-екскаватор": "Мини-экскаватор", "Маніпулятор": "Грузовик с манипулятором", "Автовишка": "Автовышка", "Грейдер": "Грейдер", "Екскаватор": "Экскаватор", "Навантажувач": "Погрузчик", "Самоскид": "Самосвал", "Гідромолот": "Гидромолот", "Кран": "Кран", "Бульдозер": "Бульдозер", "Каток": "Каток" },
  en: { "Міні-екскаватор": "Mini Excavator", "Маніпулятор": "Crane Truck", "Автовишка": "Aerial Platform", "Грейдер": "Grader", "Екскаватор": "Excavator", "Навантажувач": "Loader", "Самоскид": "Dump Truck", "Гідромолот": "Hydraulic Hammer", "Кран": "Crane", "Бульдозер": "Bulldozer", "Каток": "Road Roller" },
};
export const trType = (type, lang) => (TYPE_LABELS[lang] && TYPE_LABELS[lang][type]) || type;

// Множина — для хлібних крихт «Екскаватори · Caterpillar»
const GROUP_PLURAL = {
  "Екскаватори": { ru: "Экскаваторы", en: "Excavators" },
  "Міні-екскаватори": { ru: "Мини-экскаваторы", en: "Mini excavators" },
  "Автокрани": { ru: "Автокраны", en: "Truck cranes" },
  "Катки": { ru: "Катки", en: "Road rollers" },
  "Навантажувачі": { ru: "Погрузчики", en: "Loaders" },
  "Самоскиди": { ru: "Самосвалы", en: "Dump trucks" },
  "Маніпулятори": { ru: "Манипуляторы", en: "Crane trucks" },
  "Автовишки": { ru: "Автовышки", en: "Aerial platforms" },
  "Бульдозери": { ru: "Бульдозеры", en: "Bulldozers" },
  "Грейдери": { ru: "Грейдеры", en: "Graders" },
  "Гідромолоти": { ru: "Гидромолоты", en: "Hydraulic hammers" },
};
export const trGroup = (name, lang) => (lang === "uk" ? name : (GROUP_PLURAL[name] && GROUP_PLURAL[name][lang]) || name);

// Одиниці ціни в оголошеннях
const UNITS = { "год": { ru: "ч", en: "hr" }, "добу": { ru: "сутки", en: "day" }, "зміну": { ru: "смену", en: "shift" }, "період": { ru: "период", en: "period" } };
export const trUnit = (u, lang) => (lang === "uk" ? u : (UNITS[u] && UNITS[u][lang]) || u);
export const perUnit = (u, lang) => `${lang === "en" ? "per" : "за"} ${trUnit(u, lang)}`;

const KINDS = {
  "Гусеничний": { ru: "Гусеничный", en: "Crawler" },
  "Колісний": { ru: "Колёсный", en: "Wheeled" },
  "Гусеничний міні": { ru: "Гусеничный мини", en: "Compact crawler" },
  "2 осі": { ru: "2 оси", en: "2 axles" },
  "3 осі": { ru: "3 оси", en: "3 axles" },
  "4 осі": { ru: "4 оси", en: "4 axles" },
  "Одновальцевий, гладкий": { ru: "Одновальцовый, гладкий", en: "Single drum, smooth" },
  "Фронтальний": { ru: "Фронтальный", en: "Front loader" },
};
export const trKind = (k, lang) => (lang === "uk" ? k : (KINDS[k] && KINDS[k][lang]) || k);

const NOTES = {
  "Розміри копання вказані виробником для рукояті 2 900 мм.": { ru: "Размеры копания указаны производителем для рукояти 2 900 мм.", en: "Digging dimensions are stated by the manufacturer for a 2,900 mm stick." },
  "Решту параметрів (амплітуда, частота, відцентрова сила) дивіться в технічному листі виробника.": { ru: "Остальные параметры (амплитуда, частота, центробежная сила) смотрите в техническом листе производителя.", en: "See the manufacturer's data sheet for the remaining parameters (amplitude, frequency, centrifugal force)." },
};
export const trNote = (n, lang) => (lang === "uk" ? n : (NOTES[n] && NOTES[n][lang]) || n);

const LABELS = {
  "Експлуатаційна маса": ["Эксплуатационная масса", "Operating weight"],
  "Двигун": ["Двигатель", "Engine"],
  "Чиста потужність (ISO 9249)": ["Чистая мощность (ISO 9249)", "Net power (ISO 9249)"],
  "Макс. глибина копання": ["Макс. глубина копания", "Max. digging depth"],
  "Чиста потужність": ["Чистая мощность", "Net power"],
  "Об'єм ковша (за брошурою)": ["Объём ковша (по брошюре)", "Bucket capacity (per brochure)"],
  "Макс. виліт на рівні землі": ["Макс. вылет на уровне земли", "Max. reach at ground level"],
  "Макс. висота вивантаження": ["Макс. высота выгрузки", "Max. dumping height"],
  "Паливний бак": ["Топливный бак", "Fuel tank"],
  "Швидкість руху": ["Скорость движения", "Travel speed"],
  "Швидкість повороту": ["Скорость поворота", "Swing speed"],
  "Потужність": ["Мощность", "Power"],
  "Опорний ківш": ["Опорный ковш", "Support bucket"],
  "Макс. виліт": ["Макс. вылет", "Max. reach"],
  "Об'єм ковша": ["Объём ковша", "Bucket capacity"],
  "Макс. швидкість руху": ["Макс. скорость движения", "Max. travel speed"],
  "Радіус заднього повороту": ["Радиус заднего поворота", "Tail swing radius"],
  "Макс. вантажопідйомність": ["Макс. грузоподъёмность", "Max. lifting capacity"],
  "Кількість осей": ["Количество осей", "Number of axles"],
  "Телескопічна стріла": ["Телескопическая стрела", "Telescopic boom"],
  "Макс. висота підйому гака": ["Макс. высота подъёма крюка", "Max. hook height"],
  "Потужність двигуна": ["Мощность двигателя", "Engine power"],
  "Баласт": ["Балласт", "Counterweight"],
  "Експлуатаційна маса (з кабіною)": ["Эксплуатационная масса (с кабиной)", "Operating weight (with cab)"],
  "Ширина вальця": ["Ширина вальца", "Drum width"],
  "Діаметр вальця": ["Диаметр вальца", "Drum diameter"],
  "Потужність (ISO 14396)": ["Мощность (ISO 14396)", "Power (ISO 14396)"],
  "Амплітуда": ["Амплитуда", "Amplitude"],
  "Частота": ["Частота", "Frequency"],
  "Відцентрова сила": ["Центробежная сила", "Centrifugal force"],
  "Подолання підйому": ["Преодолеваемый подъём", "Gradeability"],
  "Маса (за сторінкою виробника)": ["Масса (по странице производителя)", "Weight (per manufacturer page)"],
  "Робоча ширина": ["Рабочая ширина", "Working width"],
  "Екологічний клас": ["Экологический класс", "Emissions class"],
  "Зусилля відриву": ["Усилие отрыва", "Breakout force"],
  "Ківш загального призначення": ["Ковш общего назначения", "General-purpose bucket"],
  "Статичне навантаження перекидання": ["Статическая опрокидывающая нагрузка", "Static tipping load"],
};
export const trLabel = (l, lang) => (lang === "uk" ? l : (LABELS[l] && LABELS[l][lang === "ru" ? 0 : 1]) || l);

// Значення: числа лишаються, одиниці й слова — перекладаються
const PHRASES = [
  [/залежить від ширини башмака/g, "зависит от ширины башмака", "depends on shoe width"],
  [/залежить від противаги/g, "зависит от противовеса", "depends on counterweight"],
  [/на вильоті (\d+) м/g, "на вылете $1 м", "at $1 m radius"],
  [/з подвійним гуськом/g, "с двойным гуськом", "with double jib"],
  [/6-циліндровий дизель/g, "6-цилиндровый дизель", "6-cylinder diesel"],
  [/циліндрів/g, "цилиндров", "cylinders"],
  [/висока \/ низька/g, "высокая / низкая", "high / low"],
  [/стандартна рукоять/g, "стандартная рукоять", "standard stick"],
  [/довга/g, "длинная", "long"],
  [/стандартна/g, "стандартная", "standard"],
  [/ брутто/g, " брутто", " gross"],
  [/ нетто/g, " нетто", " net"],
  [/\(теоретично\)/g, "(теоретически)", "(theoretical)"],
  [/майже/g, "почти", "almost"],
  [/ з вібрацією/g, " с вибрацией", " with vibration"],
  [/ без(?![а-яіїє])/g, " без", " without"],
  [/\(кабіна\)/g, "(кабина)", "(cab)"],
  [/ до /g, " до ", " up to "],
  [/ при /g, " при ", " at "],
  [/стріла/g, "стрела", "boom"],
  [/висота/g, "высота", "height"],
  [/км\/год/g, "км/ч", "km/h"],
  [/об\/хв/g, "об/мин", "rpm"],
  [/к\.с\./g, "л.с.", "hp"],
  [/кВт/g, "кВт", "kW"],
  [/кН/g, "кН", "kN"],
  [/Гц/g, "Гц", "Hz"],
  [/кг/g, "кг", "kg"],
  [/мм/g, "мм", "mm"],
  [/м³/g, "м³", "m³"],
  [/(\d) т(?![а-яіїє])/g, "$1 т", "$1 t"],
  [/(\d) л(?![а-яіїє])/g, "$1 л", "$1 L"],
  [/(\d) м(?![а-яіїє³])/g, "$1 м", "$1 m"],
];
export function trVal(v, lang) {
  if (lang === "uk" || typeof v !== "string") return v;
  let s = v;
  for (const [re, ru, en] of PHRASES) s = s.replace(re, lang === "ru" ? ru : en);
  if (lang === "en") s = s.replace(/(\d),(\d)/g, "$1.$2").replace(/(\d) (\d{3})(?!\d)/g, "$1,$2");
  return s;
}

// Що вміє техніка (EQUIPMENT_INFO): визначення та сфери застосування
const INFO = {
  "Міні-екскаватор": { ru: { d: "Компактный экскаватор для тесных площадок: дворы, подвалы, траншеи у зданий, куда большая машина не проходит.", u: ["Траншеи под коммуникации", "Работы во дворах", "Демонтаж в помещениях"] }, en: { d: "A compact excavator for tight sites: yards, basements, trenches next to buildings where a large machine cannot fit.", u: ["Utility trenches", "Work in courtyards", "Indoor demolition"] } },
  "Маніпулятор": { ru: { d: "Грузовик с кран., манипуляторной установкой: сам довозит груз и сам его разгружает или поднимает.".replace("кран., ", "кран-"), u: ["Доставка и разгрузка материалов", "Монтаж плит и блоков", "Перевозка техники"] }, en: { d: "A truck with a loader crane: delivers the load and unloads or lifts it by itself.", u: ["Material delivery and unloading", "Slab and block installation", "Equipment transport"] } },
  "Автовишка": { ru: { d: "Автомобиль с подъёмной телескопической или коленчатой стрелой и люлькой для работ на высоте без лесов.", u: ["Обрезка деревьев", "Монтаж и ремонт освещения", "Фасадные работы"] }, en: { d: "A vehicle with a telescopic or articulated boom and a basket for work at height without scaffolding.", u: ["Tree trimming", "Lighting installation and repair", "Facade work"] } },
  "Грейдер": { ru: { d: "Дорожная машина с длинным регулируемым отвалом для точного профилирования и планировки полотна дорог и площадок.", u: ["Планировка дорог", "Профилирование щебня", "Срезка грунта"] }, en: { d: "A road machine with a long adjustable blade for precise profiling and grading of roads and sites.", u: ["Road grading", "Gravel profiling", "Soil cutting"] } },
  "Екскаватор": { ru: { d: "Гусеничная или колёсная машина для копания грунта, разработки котлованов и погрузочных работ на любой поверхности.", u: ["Земляные работы", "Снос", "Траншеи", "Котлованы"] }, en: { d: "A crawler or wheeled machine for digging, excavating foundations and loading work on any surface.", u: ["Earthworks", "Demolition", "Trenches", "Foundation pits"] } },
  "Навантажувач": { ru: { d: "Компактная колёсная машина для быстрого перемещения сыпучих материалов и строительного мусора на небольших площадках.", u: ["Уборка снега", "Погрузка сыпучих", "Планировка площадки"] }, en: { d: "A compact wheeled machine for quickly moving bulk materials and construction debris on smaller sites.", u: ["Snow removal", "Loading bulk materials", "Site leveling"] } },
  "Самоскид": { ru: { d: "Грузовик с поднимающимся кузовом для вывоза грунта, щебня и строительных материалов с объекта.", u: ["Вывоз грунта", "Доставка щебня", "Перевозка мусора"] }, en: { d: "A truck with a tipping body for hauling soil, gravel and building materials away from the site.", u: ["Soil removal", "Gravel delivery", "Debris hauling"] } },
  "Гідромолот": { ru: { d: "Навесное оборудование, разрушающее бетон, асфальт и твёрдые породы за счёт ударной силы.", u: ["Разрушение бетона", "Демонтаж фундаментов", "Дробление асфальта"] }, en: { d: "An attachment that breaks concrete, asphalt and hard rock by impact force.", u: ["Concrete breaking", "Foundation demolition", "Asphalt crushing"] } },
  "Кран": { ru: { d: "Подъёмная техника для монтажа конструкций и перемещения тяжёлых грузов на высоту.", u: ["Монтаж конструкций", "Подъём грузов", "Высотные работы"] }, en: { d: "Lifting equipment for installing structures and moving heavy loads to height.", u: ["Structure installation", "Lifting loads", "High-rise work"] } },
  "Бульдозер": { ru: { d: "Гусеничная машина с отвалом для разравнивания, срезки и перемещения больших объёмов грунта.", u: ["Разравнивание участка", "Срезка грунта", "Расчистка территории"] }, en: { d: "A crawler machine with a blade for leveling, cutting and moving large volumes of soil.", u: ["Site leveling", "Soil cutting", "Land clearing"] } },
  "Каток": { ru: { d: "Дорожная машина для уплотнения грунта, щебня и асфальта весом вальца. Лёгкие (до 5 т), средние (6–10 т) и тяжёлые (свыше 10 т) — в зависимости от толщины уплотняемого слоя.", u: ["Уплотнение асфальта", "Уплотнение грунта", "Строительство дорог"] }, en: { d: "A road machine that compacts soil, gravel and asphalt with the weight of its drum. Light (up to 5 t), medium (6–10 t) and heavy (over 10 t), depending on the thickness of the layer being compacted.", u: ["Asphalt compaction", "Soil compaction", "Road construction"] } },
};
export function trInfo(type, info, lang) {
  if (!info || lang === "uk") return info;
  const t = INFO[type] && INFO[type][lang];
  return t ? { ...info, definition: t.d, uses: t.u } : info;
}

export const TX = {
  uk: {
    back: "Назад до каталогу", isNew: "НОВЕ",
    listingsCount: (n) => `Оголошень у каталозі: ${n}`, noListings: "Оголошень цієї моделі поки немає",
    can: "Що може ця техніка", specs: "Характеристики", calBook: "Календар і бронювання",
    noSel: "Вільних оголошень цієї моделі зараз немає. Залиште заявку — диспетчер підбере таку або схожу техніку й повідомить вас, а власники зможуть відгукнутися на «Дошці оголошень».",
    unavail: " · зараз недоступна", negotiable: "Договірна", yourRating: "Ваша оцінка:", noRatings: "Ще без оцінок",
    signInBook: "Увійти, щоб забронювати", signInBookMsg: "Щоб забронювати техніку, увійдіть або зареєструйтесь — це 1 хвилина",
    ownTech: "Це ваша техніка.", dispNote: "Диспетчер оформлює бронь у «Панелі диспетчера».", signInReviewMsg: "Щоб залишити відгук, увійдіть або зареєструйтесь",
    dates: "Дати", request: "Залишити заявку",
    // відгуки
    rvTitle: "Відгуки клієнтів", rvSoon: "Відгуки з'являться найближчим часом.", rvNone: "Відгуків поки немає. Орендували цю техніку? Поділіться враженням.",
    client: "Клієнт", rvDelete: "Видалити мій відгук", rvSignIn: "Увійти, щоб залишити відгук", rvOwner: "Власник не може залишати відгуки про власну техніку.",
    rvYour: "Ваш відгук", rvPlaceholder: "Стан техніки, оператор, пунктуальність власника", rvSaving: "Зберігаємо...", rvSend: "Надіслати відгук", rvShort: "Напишіть хоча б кілька слів (від 5 символів)",
    // бронювання
    busyDates: "Ці дати вже зайняті", freeSoon: "Найближчим часом техніка вільна", quick: "Швидкий вибір строку (підберемо найближчі вільні дати)",
    week: "Тиждень", m1: "1 місяць", m2: "2 місяці", m3: "3 місяці", fromDay: "З якого дня", toDay: "По який день",
    reversed: "Кінець періоду не може бути раніше за початок", clash: (a, b) => `Ці дати зайняті (${a} — ${b}). Оберіть інші.`,
    estimate: "Орієнтовно:", estimateNote: " (без доставки; остаточну ціну підтвердить диспетчер)", withOp: "Потрібна техніка з оператором",
    comment: "Коментар (необов'язково): що робитимете, адреса об'єкта", sending: "Надсилаємо...", sendBook: "Надіслати заявку на бронь",
    dispInfo: "Диспетчер перевірить дати й підтвердить — зазвичай протягом години в робочий час. Контакт власника відкриється у вашому кабінеті після підтвердження.",
    calLabel: "Календар зайнятості", busy: "зайнято", free: "вільно", yours: "ваші дати", busyCap: "Зайнято", freeCap: "Вільно",
    weekdays: ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"],
  },
  ru: {
    back: "Назад в каталог", isNew: "НОВОЕ",
    listingsCount: (n) => `Объявлений в каталоге: ${n}`, noListings: "Объявлений этой модели пока нет",
    can: "Что умеет эта техника", specs: "Характеристики", calBook: "Календарь и бронирование",
    noSel: "Свободных объявлений этой модели сейчас нет. Оставьте заявку — диспетчер подберёт такую или похожую технику и сообщит вам, а владельцы смогут откликнуться на «Доске объявлений».",
    unavail: " · сейчас недоступна", negotiable: "Договорная", yourRating: "Ваша оценка:", noRatings: "Пока без оценок",
    signInBook: "Войти, чтобы забронировать", signInBookMsg: "Чтобы забронировать технику, войдите или зарегистрируйтесь — это 1 минута",
    ownTech: "Это ваша техника.", dispNote: "Диспетчер оформляет бронь в «Панели диспетчера».", signInReviewMsg: "Чтобы оставить отзыв, войдите или зарегистрируйтесь",
    dates: "Даты", request: "Оставить заявку",
    rvTitle: "Отзывы клиентов", rvSoon: "Отзывы появятся в ближайшее время.", rvNone: "Отзывов пока нет. Арендовали эту технику? Поделитесь впечатлением.",
    client: "Клиент", rvDelete: "Удалить мой отзыв", rvSignIn: "Войти, чтобы оставить отзыв", rvOwner: "Владелец не может оставлять отзывы о собственной технике.",
    rvYour: "Ваш отзыв", rvPlaceholder: "Состояние техники, оператор, пунктуальность владельца", rvSaving: "Сохраняем...", rvSend: "Отправить отзыв", rvShort: "Напишите хотя бы несколько слов (от 5 символов)",
    busyDates: "Эти даты уже заняты", freeSoon: "В ближайшее время техника свободна", quick: "Быстрый выбор срока (подберём ближайшие свободные даты)",
    week: "Неделя", m1: "1 месяц", m2: "2 месяца", m3: "3 месяца", fromDay: "С какого дня", toDay: "По какой день",
    reversed: "Конец периода не может быть раньше начала", clash: (a, b) => `Эти даты заняты (${a} — ${b}). Выберите другие.`,
    estimate: "Ориентировочно:", estimateNote: " (без доставки; окончательную цену подтвердит диспетчер)", withOp: "Нужна техника с оператором",
    comment: "Комментарий (необязательно): что будете делать, адрес объекта", sending: "Отправляем...", sendBook: "Отправить заявку на бронь",
    dispInfo: "Диспетчер проверит даты и подтвердит — обычно в течение часа в рабочее время. Контакт владельца откроется в вашем кабинете после подтверждения.",
    calLabel: "Календарь занятости", busy: "занято", free: "свободно", yours: "ваши даты", busyCap: "Занято", freeCap: "Свободно",
    weekdays: ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"],
  },
  en: {
    back: "Back to catalog", isNew: "NEW",
    listingsCount: (n) => `Listings in catalog: ${n}`, noListings: "No listings for this model yet",
    can: "What this machine can do", specs: "Specifications", calBook: "Calendar & booking",
    noSel: "There are no available listings for this model right now. Leave a request — the dispatcher will find the same or similar equipment and let you know, and owners can respond on the Classifieds board.",
    unavail: " · currently unavailable", negotiable: "Negotiable", yourRating: "Your rating:", noRatings: "No ratings yet",
    signInBook: "Sign in to book", signInBookMsg: "To book equipment, sign in or register — it takes a minute",
    ownTech: "This is your equipment.", dispNote: "The dispatcher arranges bookings in the dispatcher panel.", signInReviewMsg: "To leave a review, sign in or register",
    dates: "Dates", request: "Leave a request",
    rvTitle: "Customer reviews", rvSoon: "Reviews will appear soon.", rvNone: "No reviews yet. Rented this machine? Share your experience.",
    client: "Customer", rvDelete: "Delete my review", rvSignIn: "Sign in to leave a review", rvOwner: "Owners cannot review their own equipment.",
    rvYour: "Your review", rvPlaceholder: "Condition of the machine, operator, owner's punctuality", rvSaving: "Saving...", rvSend: "Submit review", rvShort: "Please write at least a few words (5+ characters)",
    busyDates: "These dates are already taken", freeSoon: "The machine is free soon", quick: "Quick duration (we'll pick the nearest free dates)",
    week: "1 week", m1: "1 month", m2: "2 months", m3: "3 months", fromDay: "From", toDay: "To",
    reversed: "The end of the period cannot be before the start", clash: (a, b) => `These dates are taken (${a} — ${b}). Please choose others.`,
    estimate: "Estimate:", estimateNote: " (excluding delivery; the dispatcher will confirm the final price)", withOp: "Need equipment with an operator",
    comment: "Comment (optional): what you'll do, site address", sending: "Sending...", sendBook: "Send booking request",
    dispInfo: "The dispatcher will check the dates and confirm — usually within an hour during business hours. The owner's contact opens in your account after confirmation.",
    calLabel: "Availability calendar", busy: "booked", free: "free", yours: "your dates", busyCap: "Booked", freeCap: "Free",
    weekdays: ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"],
  },
};
export const useTx = () => { const l = useLang(); return TX[l] || TX.uk; };
