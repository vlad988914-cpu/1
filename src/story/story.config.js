/**
 * Сцена «Техніка зблизька»: прокрутка веде камеру по екскаватору.
 * Відео — один безперервний кадр. Додати новий етап (борт, двигун) = додати кусок відео та рядки нижче:
 *  • stops   — опори «прогрес прокрутки → час відео, с»; однакові time поспіль = пауза на етапі;
 *  • stages  — підписи; range — діапазон прогресу, коли підпис активний.
 */
export const defaultStory = {
  video: {
    sources: [
      { src: "/story/excavator-scrub.mp4", type: 'video/mp4; codecs="avc1.64001F"' }, // H.264 High@3.1: Safari, Chrome, Edge
      { src: "/story/excavator-scrub.webm", type: 'video/webm; codecs="vp9"' }, // запасний: браузери без H.264
    ],
    poster: "/story/poster.jpg",
    duration: 12.04,
    aspect: 576 / 1012,
  },
  heightVh: 480, // довжина сцени у висотах екрана (чим більше — тим повільніше «їде» камера)
  stops: [
    { at: 0.0, time: 0.0 },
    { at: 0.1, time: 0.0 },
    { at: 0.32, time: 5.8 }, // ковш крупно
    { at: 0.44, time: 5.8 },
    { at: 0.58, time: 8.8 }, // уздовж стріли
    { at: 0.66, time: 8.8 },
    { at: 0.9, time: 12.0 }, // кабіна
    { at: 1.0, time: 12.0 },
  ],
  stages: [
    { id: "machine", kicker: "CAT M320", title: "Колісний екскаватор", text: "Прокрутіть вниз — розгляньте його зблизька.", range: [0, 0.18] },
    { id: "bucket", kicker: "Ковш", title: "КОВШ", text: "Розробка ґрунту", range: [0.18, 0.5] },
    { id: "boom", kicker: "Стріла", title: "СТРІЛА", text: "Максимальна робоча зона", range: [0.5, 0.72] },
    { id: "cab", kicker: "Кабіна", title: "КАБІНА ОПЕРАТОРА", text: "Комфорт + контроль", range: [0.72, 1.01], cta: { label: "Підібрати техніку", type: "Екскаватор" } },
  ],
};
export default defaultStory;
