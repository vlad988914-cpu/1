// Характеристики техніки за типом: які поля показувати у формі і як групувати їх на сторінці оголошення.
// Набір полів складено за практикою великих майданчиків спецтехніки (Machineryline та ін.):
// рік, стан, напрацювання, двигун (потужність, паливо, об'єм), а далі — параметри саме цього типу
// (глибина копання, об'єм ковша, вантажопідйомність, висота підйому, ширина відвала тощо).
// Усе зберігається в уже наявному полі listings.specs (jsonb): міняти базу не потрібно.
//   specs["Рік випуску"] = "2021", specs["Потужність"] = "110 к.с." …
//   specs._order = [ключі у потрібному порядку], specs._description = "текст опису"

export const GROUPS = {
  main: "Основні характеристики",
  engine: "Двигун",
  state: "Стан",
  extra: "Додатково",
};

const YEAR = { id: "year", key: "Рік випуску", group: "state", kind: "number", ph: "2021", min: 1950, max: new Date().getFullYear() + 1 };
const COND = { id: "cond", key: "Стан", group: "state", kind: "select", options: ["новий", "відмінний", "добрий", "робочий", "потребує ремонту"] };
const HOURS = { id: "hours", key: "Напрацювання", group: "state", kind: "number", unit: "м/г", ph: "4500" };
const MILEAGE = { id: "km", key: "Пробіг", group: "state", kind: "number", unit: "км", ph: "180000" };
const COLOR = { id: "color", key: "Колір", group: "extra", kind: "text", ph: "жовтий" };
const VIN = { id: "vin", key: "VIN / заводський номер", group: "extra", kind: "text", ph: "необов'язково" };

const ENGINE = { id: "engine", key: "Двигун (марка)", group: "engine", kind: "text", ph: "Yanmar 3TNV88" };
const POWER = { id: "power", key: "Потужність", group: "engine", kind: "number", unit: "к.с.", ph: "110" };
const FUEL = { id: "fuel", key: "Паливо", group: "engine", kind: "select", options: ["дизель", "бензин", "електро", "газ"] };
const DISPL = { id: "displ", key: "Об'єм двигуна", group: "engine", kind: "number", unit: "см³", ph: "1642" };
const EURO = { id: "euro", key: "Екологічний клас", group: "engine", kind: "select", options: ["Euro 2", "Euro 3", "Euro 4", "Euro 5", "Euro 6", "Stage V"] };

const WEIGHT = { id: "weight", key: "Експлуатаційна вага", group: "main", kind: "number", unit: "т", ph: "20.5", step: "0.1" };
const BUCKET = { id: "bucket", key: "Об'єм ковша", group: "main", kind: "number", unit: "м³", ph: "1.2", step: "0.01" };
const DIG = { id: "dig", key: "Глибина копання", group: "main", kind: "number", unit: "м", ph: "6.5", step: "0.01" };
const REACH = { id: "reach", key: "Радіус копання", group: "main", kind: "number", unit: "м", ph: "9.9", step: "0.01" };
const DRIVE = { id: "drive", key: "Тип ходу", group: "main", kind: "select", options: ["гусеничний", "колісний"] };
const LOAD_T = { id: "loadT", key: "Вантажопідйомність", group: "main", kind: "number", unit: "т", ph: "10", step: "0.1" };
const LOAD_KG = { id: "loadKg", key: "Вантажопідйомність", group: "main", kind: "number", unit: "кг", ph: "3500" };
const DUMP_H = { id: "dumpH", key: "Висота розвантаження", group: "main", kind: "number", unit: "м", ph: "2.8", step: "0.01" };
const WHEELS = { id: "wheels", key: "Колісна формула", group: "main", kind: "select", options: ["4x2", "4x4", "6x2", "6x4", "6x6", "8x4", "8x8"] };
const BODY_VOL = { id: "bodyVol", key: "Об'єм кузова", group: "main", kind: "number", unit: "м³", ph: "12", step: "0.1" };
const HEIGHT = { id: "liftH", key: "Висота підйому", group: "main", kind: "number", unit: "м", ph: "30", step: "0.1" };
const BOOM = { id: "boom", key: "Довжина стріли", group: "main", kind: "number", unit: "м", ph: "40", step: "0.1" };
const BASKET = { id: "basket", key: "Навантаження люльки", group: "main", kind: "number", unit: "кг", ph: "200" };
const OUTREACH = { id: "outreach", key: "Виліт стріли", group: "main", kind: "number", unit: "м", ph: "12", step: "0.1" };
const BLADE_MM = { id: "bladeMm", key: "Ширина відвала", group: "main", kind: "number", unit: "мм", ph: "3690" };
const BLADE_M = { id: "bladeM", key: "Довжина відвала", group: "main", kind: "number", unit: "м", ph: "3.7", step: "0.1" };
const DRUM_W = { id: "drumW", key: "Ширина вальця", group: "main", kind: "number", unit: "мм", ph: "1680" };
const DRUM_T = { id: "drumT", key: "Тип вальця", group: "main", kind: "select", options: ["гладкий вібраційний", "гладкий статичний", "кулачковий", "пневмоколісний", "комбінований"] };
const IMPACT = { id: "impact", key: "Енергія удару", group: "main", kind: "number", unit: "Дж", ph: "950" };
const TOOL_D = { id: "toolD", key: "Діаметр інструмента", group: "main", kind: "number", unit: "мм", ph: "100" };
const CARRIER = { id: "carrier", key: "Для екскаватора", group: "main", kind: "text", ph: "8–14 т" };
const SPEED = { id: "speed", key: "Швидкість пересування", group: "main", kind: "number", unit: "км/год", ph: "4.3", step: "0.1" };
const CAB = { id: "cab", key: "Кабіна", group: "main", kind: "select", options: ["закрита, з кондиціонером", "закрита", "відкрита"] };
const BOOM_LOAD = { id: "boomLoad", key: "Вантажопідйомність маніпулятора", group: "main", kind: "number", unit: "т", ph: "7", step: "0.1" };
const PLATFORM = { id: "platform", key: "Довжина борта", group: "main", kind: "number", unit: "м", ph: "6.2", step: "0.1" };

// Поля за типом. Порядок = порядок показу на сторінці.
export const TYPE_FIELDS = {
  "Екскаватор": [WEIGHT, BUCKET, DIG, REACH, DRIVE, ENGINE, POWER, FUEL, DISPL, EURO, YEAR, COND, HOURS, COLOR, VIN],
  "Міні-екскаватор": [WEIGHT, BUCKET, DIG, REACH, DRIVE, SPEED, ENGINE, POWER, FUEL, DISPL, YEAR, COND, HOURS, COLOR, VIN],
  "Навантажувач": [LOAD_KG, BUCKET, DUMP_H, WEIGHT, DRIVE, ENGINE, POWER, FUEL, EURO, YEAR, COND, HOURS, COLOR, VIN],
  "Самоскид": [WHEELS, LOAD_T, BODY_VOL, ENGINE, POWER, FUEL, DISPL, EURO, YEAR, COND, MILEAGE, COLOR, VIN],
  "Маніпулятор": [WHEELS, LOAD_T, PLATFORM, BOOM_LOAD, OUTREACH, ENGINE, POWER, FUEL, EURO, YEAR, COND, MILEAGE, COLOR, VIN],
  "Автовишка": [HEIGHT, OUTREACH, BASKET, WHEELS, ENGINE, POWER, FUEL, EURO, YEAR, COND, MILEAGE, COLOR, VIN],
  "Бульдозер": [WEIGHT, BLADE_MM, DRIVE, ENGINE, POWER, FUEL, EURO, YEAR, COND, HOURS, COLOR, VIN],
  "Грейдер": [WEIGHT, BLADE_M, DRIVE, ENGINE, POWER, FUEL, EURO, YEAR, COND, HOURS, COLOR, VIN],
  "Каток": [WEIGHT, DRUM_W, DRUM_T, ENGINE, POWER, FUEL, YEAR, COND, HOURS, COLOR, VIN],
  "Кран": [LOAD_T, HEIGHT, BOOM, WHEELS, ENGINE, POWER, FUEL, EURO, YEAR, COND, HOURS, MILEAGE, COLOR, VIN],
  "Гідромолот": [WEIGHT, IMPACT, TOOL_D, CARRIER, YEAR, COND, HOURS, COLOR, VIN],
};
const FALLBACK = [WEIGHT, ENGINE, POWER, FUEL, YEAR, COND, HOURS, COLOR, VIN];

export const fieldsFor = (type) => TYPE_FIELDS[type] || FALLBACK;

// Усі відомі поля за назвою (щоб прочитати значення зі specs незалежно від типу)
const ALL = {};
Object.values(TYPE_FIELDS).flat().concat(FALLBACK).forEach((f) => { ALL[f.id] = f; });
export const ALL_FIELDS = Object.values(ALL);
const KEY_TO_FIELD = {};
// «Вантажопідйомність» зустрічається і в тоннах, і в кілограмах: ключ однаковий, одиниця — в самому значенні
ALL_FIELDS.forEach((f) => { if (!KEY_TO_FIELD[f.key]) KEY_TO_FIELD[f.key] = f; });

// Значення зі specs → те, що вводить людина (без одиниці)
export function parseValue(f, stored) {
  if (stored === undefined || stored === null || stored === "—") return "";
  let s = String(stored).trim();
  if (f.unit && s.endsWith(" " + f.unit)) s = s.slice(0, -(f.unit.length + 1));
  return s;
}
// Те, що ввела людина → значення для specs
export function formatValue(f, raw) {
  const s = String(raw ?? "").trim();
  if (!s) return "";
  return f.unit && f.kind === "number" ? `${s} ${f.unit}` : s;
}

// Початкові значення форми з уже збережених specs. Невідомі ключі повертаються як extras.
export function specsToForm(specs) {
  const o = specs || {};
  const vals = {};
  ALL_FIELDS.forEach((f) => {
    if (f.id === "loadKg") return;
    const v = o[f.key];
    if (v !== undefined && !vals[f.id]) vals[f.id] = parseValue(f, v);
  });
  // Вантажопідйомність: одна й та сама назва — розкладаємо за одиницею
  const lc = o["Вантажопідйомність"];
  if (lc !== undefined) {
    const s = String(lc);
    if (/(^|\s)кг(\s|$)/.test(s)) { vals.loadKg = parseValue(ALL.loadKg, s); delete vals.loadT; }
    else vals.loadT = parseValue(ALL.loadT, s);
  }
  // Старі оголошення: «Вага» — це експлуатаційна вага
  if (vals.weight === undefined && o["Вага"] !== undefined) vals.weight = String(o["Вага"]).replace(/ т$/, "");
  const known = new Set(ALL_FIELDS.map((f) => f.key).concat(["Вага"]));
  const extras = Object.entries(o)
    .filter(([k, v]) => !k.startsWith("_") && !known.has(k) && v !== undefined && v !== "—")
    .map(([k, v]) => [k, String(v)]);
  return { vals, extras, description: typeof o._description === "string" ? o._description : "" };
}

// Значення форми → specs у правильному порядку (+ службові ключі зберігаємо: _video, _poster …)
export function formToSpecs(type, vals, extras, description, previous) {
  const out = {};
  const order = [];
  const put = (k, v) => { if (v === "" || v === undefined || out[k] !== undefined) return; out[k] = v; order.push(k); };
  fieldsFor(type).forEach((f) => put(f.key, formatValue(f, vals[f.id])));
  (extras || []).forEach(([k, v]) => { const kk = String(k || "").trim().slice(0, 60), vv = String(v || "").trim().slice(0, 200); if (kk && vv) put(kk, vv); });
  const prev = previous || {};
  Object.keys(prev).forEach((k) => { if (k.startsWith("_") && k !== "_order" && k !== "_description") out[k] = prev[k]; });
  const d = String(description || "").trim().slice(0, 3000);
  if (d) out._description = d;
  out._order = order;
  return out;
}

// Порядок ключів: jsonb його не зберігає, тому тримаємо в _order
export function orderSpecs(o) {
  const src = o || {};
  const out = {};
  if (Array.isArray(src._order)) src._order.forEach((k) => { if (k in src) out[k] = src[k]; });
  const legacyOrder = ["Вантажопідйомність", "Довжина авто", "Довжина платформи", "Кран"];
  if (!Array.isArray(src._order)) legacyOrder.forEach((k) => { if (k in src) out[k] = src[k]; });
  Object.keys(src).forEach((k) => { if (!(k in out)) out[k] = src[k]; });
  return out;
}

export const visibleSpecs = (specs) => Object.entries(specs || {}).filter(([k, v]) => v !== undefined && v !== null && v !== "" && v !== "—" && !k.startsWith("_"));

// Групи для сторінки оголошення: [{ id, title, rows: [[ключ, значення]] }]
export function groupSpecs(specs) {
  const rows = visibleSpecs(specs);
  const groups = { main: [], engine: [], state: [], extra: [] };
  rows.forEach(([k, v]) => {
    const f = KEY_TO_FIELD[k];
    groups[f ? f.group : "main"].push([k, v]); // невідомі (старі) параметри були основними
  });
  return ["main", "engine", "state", "extra"].filter((g) => groups[g].length).map((g) => ({ id: g, title: GROUPS[g], rows: groups[g] }));
}

// Плитки зверху сторінки: найважливіші 4 параметри
const TILE_PRIORITY = ["Рік випуску", "Стан", "Напрацювання", "Пробіг", "Потужність", "Вантажопідйомність", "Глибина копання", "Об'єм ковша", "Висота підйому", "Довжина стріли", "Ширина відвала", "Експлуатаційна вага", "Колісна формула", "Енергія удару"];
export function keyTiles(specs) {
  const rows = visibleSpecs(specs);
  const by = Object.fromEntries(rows);
  const picked = TILE_PRIORITY.filter((k) => by[k] !== undefined).slice(0, 4).map((k) => [k, by[k]]);
  if (picked.length >= 4) return picked;
  const have = new Set(picked.map(([k]) => k));
  return picked.concat(rows.filter(([k]) => !have.has(k))).slice(0, 4);
}

// Короткий рядок для картки: «2021 · новий · 110 к.с. · 4 500 м/г»
export function summaryLine(specs, max = 4) {
  const by = Object.fromEntries(visibleSpecs(specs));
  const keys = ["Рік випуску", "Стан", "Потужність", "Напрацювання", "Пробіг", "Вантажопідйомність", "Глибина копання", "Висота підйому"];
  return keys.filter((k) => by[k] !== undefined).slice(0, max).map((k) => by[k]).join(" · ");
}
