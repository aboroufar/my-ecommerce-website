import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";

/**
 * Client for use in Client Components ("use client").
 * Uses the public anon key -- all access is governed by RLS policies.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
