import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Якщо змінні середовища ще не додані у Vercel — не ламаємо сайт,
// просто працюємо локально (supabase буде null, код це перевіряє).
export const supabase = url && key ? createClient(url, key) : null;
