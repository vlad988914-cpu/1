import { createClient } from "@supabase/supabase-js";

const url = (import.meta.env.VITE_SUPABASE_URL || "").trim();
const key = (import.meta.env.VITE_SUPABASE_ANON_KEY || "").trim();

// Діагностика: видно у Console браузера, що саме сайт отримав як ключ —
// без самого ключа, лише довжину і перші/останні символи, щоб звірити.
if (key) {
  console.log(
    `Supabase key loaded: length=${key.length}, starts="${key.slice(0, 12)}", ends="${key.slice(-6)}"`
  );
} else {
  console.log("Supabase key is EMPTY — VITE_SUPABASE_ANON_KEY not reaching the build");
}

// Якщо змінні середовища ще не додані у Vercel — не ламаємо сайт,
// просто працюємо локально (supabase буде null, код це перевіряє).
export const supabase = url && key ? createClient(url, key) : null;
