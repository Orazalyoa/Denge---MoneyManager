import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_STORAGE_FALLBACK_KEY = "kaspi_mvp_supabase_storage_fallback_v1";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

type SupabaseLikeError = {
  code?: string;
  message?: string;
};

function hasSupabaseStorageFallback(): boolean {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(SUPABASE_STORAGE_FALLBACK_KEY) === "1";
}

export function isSupabaseStorageEnabled(): boolean {
  return isSupabaseConfigured && !hasSupabaseStorageFallback();
}

export function markSupabaseStorageUnavailable(error: unknown): void {
  if (typeof window === "undefined") return;

  const candidate = (error ?? {}) as SupabaseLikeError;
  const code = candidate.code ?? "";
  const message = candidate.message ?? "";
  const missingSchemaTable = code === "PGRST205" || /Could not find the table '.+' in the schema cache/i.test(message);

  if (!missingSchemaTable) return;

  window.sessionStorage.setItem(SUPABASE_STORAGE_FALLBACK_KEY, "1");
  console.warn("[SUPABASE] Storage tables are unavailable in this project. Falling back to local-only transaction storage.");
}

if (typeof window !== "undefined" && !isSupabaseConfigured) {
  console.warn(
    "⚠️ Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
    "Working in local-only mode. Data will NOT sync across devices."
  );
}

export const supabase =
  isSupabaseConfigured && supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      })
    : null;
