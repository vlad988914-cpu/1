// Відстеження конверсій Google Ads (тег AW-18540775028 підключений в index.html).
// Щоб заявки й дзвінки рахувалися як конверсії, в Google Ads створіть дві конверсії
// («Цілі» → «Конверсії» → «Створити») і вставте їх «мітки» нижче (частина після "/" у send_to).
export const AW_ID = "AW-18540775028";
export const LABEL_LEAD = "1ZaNCOLE5qsdEPSM94hF"; // мітка конверсії «Заявка»
export const LABEL_CALL = ""; // мітка конверсії «Дзвінок»

function send(label, name, withValue) {
  try {
    if (typeof window === "undefined" || typeof window.gtag !== "function") return;
    window.gtag("event", name); // стандартна подія, видна в Google Ads / Tag Assistant
    if (label) window.gtag("event", "conversion", withValue ? { send_to: `${AW_ID}/${label}`, value: 1.0, currency: "UAH" } : { send_to: `${AW_ID}/${label}` });
  } catch {
    /* трекінг ніколи не ламає сайт */
  }
}
export const trackLead = () => send(LABEL_LEAD, "generate_lead", true);
export const trackCall = () => send(LABEL_CALL, "phone_call_click");
