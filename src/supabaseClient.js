import { createClient } from "@supabase/supabase-js";

// Publishable-ключ Supabase призначений для браузера (безпечний за умови RLS),
// тому тримаємо його тут як надійний запасний варіант.
const FALLBACK_URL = "https://jsyjqudermvbylaweuqj.supabase.co";
const FALLBACK_KEY = "sb_publishable_ShJs7HgeVml_QbQO5pvb1g_yCaWV8ai";

const envUrl = (import.meta.env.VITE_SUPABASE_URL || "").trim();
const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || "").trim();

// Беремо значення зі змінних Vercel лише якщо воно виглядає правильно.
// (Раніше в KEY випадково потрапляло посилання — тепер це відсіюється.)
const looksLikeKey = (v) => v.startsWith("sb_publishable_") || v.startsWith("eyJ");
const looksLikeUrl = (v) => /^https:\/\/[a-z0-9]+\.supabase\.co$/.test(v);

const url = looksLikeUrl(envUrl) ? envUrl : FALLBACK_URL;
const key = looksLikeKey(envKey) ? envKey : FALLBACK_KEY;

console.log(
  `Supabase init: key from ${looksLikeKey(envKey) ? "Vercel env" : "built-in fallback"}, ` +
    `starts="${key.slice(0, 15)}", length=${key.length}`
);

export const supabase = createClient(url, key);
