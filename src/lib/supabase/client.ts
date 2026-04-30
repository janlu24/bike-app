import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase";

export function createSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Supabase-Konfiguration fehlt: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY nicht gesetzt."
    );
  }

  return createBrowserClient<Database>(url, anonKey);
}
