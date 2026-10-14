// Прозорий WebM (VP9 з альфою) грає лише Chrome/Firefox/Edge на комп'ютері й Android.
// Усе на WebKit (Safari, iPhone, вбудовані браузери поштових застосунків без слова "Safari" в UA) — альфу не показує, там чорний фон.
export const WEBM_ALPHA_OK = (() => {
  if (typeof navigator === "undefined") return true;
  const ua = navigator.userAgent || "";
  const iOS = /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/i.test(ua) && (navigator.maxTouchPoints || 0) > 1);
  if (iOS) return false; // на iOS усі браузери — WebKit
  const webkitOnly = /AppleWebKit/i.test(ua) && !/chrome|chromium|crios|fxios|edg|android|firefox/i.test(ua);
  return !webkitOnly;
})();
