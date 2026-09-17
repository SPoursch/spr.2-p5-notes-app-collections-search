'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

import {
  signInWithPassword,
  signOut,
  signUpWithPassword,
  startGoogleSignIn,
} from '../db'
import { failure, type NoteActionState } from './note-action-state'

/**
 * Server Actions for authentication (Part 6).
 *
 * These mirror the other action modules: they own input validation and the
 * mapping from a failure to a user-safe message, and they never touch
 * supabase-js. Every call is delegated to app/lib/db.ts, per CLAUDE.md.
 *
 * A Server Action is a public POST endpoint, so all input is treated as
 * untrusted. Passwords are forwarded to Supabase Auth and never stored,
 * logged or compared here.
 */

/** Where a signed-in user lands, and where a signed-out one is sent. */
const WORKSPACE_PATH = '/workspace'
const LOGIN_PATH = '/login'

/** Supabase Auth's own minimum. Rejecting shorter input here saves a round trip. */
const MIN_PASSWORD_LENGTH = 6

type Credentials = { email: string; password: string }

/**
 * Reads and validates the two credential fields.
 *
 * The email is only checked for the shape of an address; Supabase Auth is the
 * authority on whether it is deliverable or already registered.
 */
function readCredentials(
  formData: FormData,
): { ok: true; value: Credentials } | { ok: false; message: string } {
  const rawEmail = formData.get('email')
  const rawPassword = formData.get('password')

  if (typeof rawEmail !== 'string' || typeof rawPassword !== 'string') {
    return { ok: false, message: 'Enter an email address and a password.' }
  }

  const email = rawEmail.trim()

  if (email.length === 0) {
    return { ok: false, message: 'Enter your email address.' }
  }

  if (!email.includes('@') || email.length > 320) {
    return { ok: false, message: 'Enter a valid email address.' }
  }

  // Not trimmed: spaces are legitimate password characters, and trimming would
  // silently change what the user typed.
  if (rawPassword.length === 0) {
    return { ok: false, message: 'Enter your password.' }
  }

  return { ok: true, value: { email, password: rawPassword } }
}

/**
 * Signs in with an email address and password, then sends the user to the
 * workspace.
 *
 * `redirect` throws the framework's navigation signal, so it is called after
 * the sign-in has succeeded and outside any try/catch.
 */
export async function signInAction(
  _state: NoteActionState,
  formData: FormData,
): Promise<NoteActionState> {
  const parsed = readCredentials(formData)

  if (!parsed.ok) {
    return failure(parsed.message)
  }

  const result = await signInWithPassword(
    parsed.value.email,
    parsed.value.password,
  )

  if (!result.ok) {
    return failure(result.message ?? 'Could not sign in. Please try again.')
  }

  redirect(WORKSPACE_PATH)
}

/**
 * Registers a new account.
 *
 * When the project has email confirmation switched on, sign-up returns no
 * session; that case arrives here as a failed result carrying an explanatory
 * message, and the user stays on the form rather than being redirected to a
 * workspace they cannot yet reach.
 */
export async function signUpAction(
  _state: NoteActionState,
  formData: FormData,
): Promise<NoteActionState> {
  const parsed = readCredentials(formData)

  if (!parsed.ok) {
    return failure(parsed.message)
  }

  if (parsed.value.password.length < MIN_PASSWORD_LENGTH) {
    return failure(
      `Choose a password of at least ${MIN_PASSWORD_LENGTH} characters.`,
    )
  }

  const result = await signUpWithPassword(
    parsed.value.email,
    parsed.value.password,
  )

  if (!result.ok) {
    return failure(result.message ?? 'Could not create the account.')
  }

  redirect(WORKSPACE_PATH)
}

/** Ends the session and returns to the login page. */
export async function signOutAction(): Promise<void> {
  await signOut()

  redirect(LOGIN_PATH)
}

/**
 * Begins Google sign-in by redirecting to the provider.
 *
 * The callback URL is built from the request's own origin rather than from a
 * configured value, so no new environment variable is needed and the flow
 * works unchanged on localhost. The origin must still be listed in the
 * Supabase redirect allow-list, which is a dashboard setting.
 */
export async function signInWithGoogleAction(): Promise<NoteActionState> {
  const requestHeaders = await headers()

  // A Server Action is a POST, so the browser sends `Origin` and it already
  // carries the scheme. `Host` is the fallback, and needs a scheme added:
  // `x-forwarded-proto` behind a proxy, otherwise http, which is what a
  // localhost dev server actually serves.
  const origin = requestHeaders.get('origin')
  const host = requestHeaders.get('host')

  let baseUrl: string

  if (origin) {
    baseUrl = origin
  } else if (host) {
    const proto = requestHeaders.get('x-forwarded-proto') ?? 'http'
    baseUrl = `${proto}://${host}`
  } else {
    return failure('Google sign-in is unavailable right now.')
  }

  const { url, message } = await startGoogleSignIn(`${baseUrl}/auth/callback`)

  if (!url) {
    return failure(message ?? 'Google sign-in is unavailable right now.')
  }

  redirect(url)
}
