import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

/**
 * Client for public, cacheable reads (product catalog, categories).
 * Uses the anon key with no cookie/session handling, so it can run during
 * generateStaticParams / ISR revalidation as well as normal requests --
 * unlike the cookie-aware server client, which requires request context.
 * RLS still applies: this can only read what the "Public can view..."
 * policies allow (active products, categories, images).
 */
export function createPublicClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
}
