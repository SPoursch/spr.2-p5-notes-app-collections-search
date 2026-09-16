import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Supabase client wiring.
 *
 * This module owns client construction only. All application reads and writes
 * go through the centralised data-access layer (app/lib/db.ts), which is added
 * in a later step and is the only module that should import from here.
 *
 * Credentials come from environment variables (see .env.local.example).
 * Never hard-code a project URL or key.
 */

const SUPABASE_URL_VAR = 'NEXT_PUBLIC_SUPABASE_URL'
const SUPABASE_KEY_VAR = 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'

let client: SupabaseClient | null = null

function readRequiredEnv(name: string, value: string | undefined): string {
  const trimmed = value?.trim()

  if (!trimmed) {
    throw new Error(
      `Missing environment variable ${name}. ` +
        `Add it to .env.local as "${name}=<value>" (see .env.local.example), ` +
        `then restart the dev server so Next.js reloads the file.`,
    )
  }

  return trimmed
}

/**
 * Returns the shared Supabase client, creating it on first use.
 *
 * Construction is lazy so that a missing or malformed .env.local surfaces as a
 * clear error at the point of the first query, rather than crashing any module
 * that merely imports this file.
 */
export function getSupabaseClient(): SupabaseClient {
  if (client) {
    return client
  }

  const url = readRequiredEnv(
    SUPABASE_URL_VAR,
    process.env.NEXT_PUBLIC_SUPABASE_URL,
  )
  const key = readRequiredEnv(
    SUPABASE_KEY_VAR,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  )

  client = createClient(url, key)

  return client
}

/**
 * Reports whether both Supabase environment variables are present, without
 * constructing a client or exposing their values. Useful for diagnostics.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim(),
  )
}
