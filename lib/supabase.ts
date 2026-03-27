import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;
let warned = false;

function normalize(v: string | undefined): string | null {
  if (!v) return null;
  const t = v.trim();
  return t.length > 0 ? t : null;
}

export function getSupabaseClient(): SupabaseClient | null {
  if (cached) return cached;

  // クライアントバンドルで NEXT_PUBLIC_ を正しく展開させるため、動的キー参照は使わない
  const url = normalize(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anonKey = normalize(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!url || !anonKey) {
    if (!warned) {
      warned = true;
      console.warn(
        "Supabase環境変数が未設定です。NEXT_PUBLIC_SUPABASE_URL と NEXT_PUBLIC_SUPABASE_ANON_KEY を設定してください。",
      );
    }
    return null;
  }

  cached = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}

