import React from "react";
import ReactDOM from "react-dom/client";
import EquipmentMarketplace from "./EquipmentMarketplace.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <EquipmentMarketplace />
  </React.StrictMode>
);

// PWA: сервіс-воркер лише в продакшені (у dev заважає гарячому перезавантаженню)
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch(() => {}));
}
